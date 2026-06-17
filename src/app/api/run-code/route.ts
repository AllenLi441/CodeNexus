import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
// Remote compile+run can be slow on a cold sandbox; give it headroom past 10s.
export const maxDuration = 30

type SupportedLanguage = 'c' | 'cpp' | 'java' | 'csharp' | 'javascript' | 'visual-basic'

type RunPayload = {
  languageId?: string
  code?: string
}

const MAX_CODE_LENGTH = 50_000
const MAX_OUTPUT_LENGTH = 12_000
// NOTE: the timeout message interpolates `${TIMEOUT_MS / 1000}s` into a string
// whose EN translation is keyed on the literal "8s" in src/lib/i18n-en.ts. If you
// change this value, update that EN_MAP key or the English message will fall back
// to Chinese.
const TIMEOUT_MS = 8_000

// 30 runs / minute / user. Each run is a real remote compile+run, so this is a
// hard cost ceiling. Adjust if learners legitimately exceed it.
const RUN_LIMIT = 30
const RUN_WINDOW_MS = 60_000

function truncate(value: string) {
  if (value.length <= MAX_OUTPUT_LENGTH) return value
  // Embedded in mixed program output, so keep the marker language-neutral.
  return `${value.slice(0, MAX_OUTPUT_LENGTH)}\n... (output truncated / 输出已截断)`
}

function speedTier(executionMs: number) {
  if (executionMs < 500) return { emoji: '✓', label: `${executionMs}ms`, percentile: '真实运行' }
  return { emoji: '✓', label: `${executionMs}ms`, percentile: '含编译/启动开销' }
}

function response(output: string, error: string, executionMs: number) {
  return NextResponse.json({
    output,
    error,
    imageBase64: null,
    executionMs,
    speedTier: speedTier(executionMs),
  })
}

// ── Remote execution ─────────────────────────────────────────────────────────
// Vercel's serverless runtime cannot spawn child processes (clone() fails with
// "OCI runtime error: crun: clone: Resource temporarily unavailable"), so NO
// language is compiled/run locally. Everything goes to a remote sandbox.
//
// Primary: Piston (https://github.com/engineer-man/piston) — free public API at
// emkc.org, no key, runs every language we teach (incl. JS via Node and VB via
// basic.net). Self-host and point CODE_EXEC_PISTON_URL at it for production.
// Fallback: Wandbox, for the compiled languages it supports, if Piston is down.
const PISTON_URL = process.env.CODE_EXEC_PISTON_URL?.trim() || 'https://emkc.org/api/v2/piston/execute'

// language + version are pinned to runtimes confirmed available on emkc.org. The
// JS entry pins Node 18 (NOT the deno-js runtime that shares the "javascript"
// language id). filename matters for Java (`public class Main` → Main.java).
const PISTON_LANG: Record<SupportedLanguage, { language: string; version: string; filename: string }> = {
  c: { language: 'c', version: '10.2.0', filename: 'main.c' },
  cpp: { language: 'c++', version: '10.2.0', filename: 'main.cpp' },
  java: { language: 'java', version: '15.0.2', filename: 'Main.java' },
  csharp: { language: 'csharp', version: '6.12.0', filename: 'Program.cs' },
  javascript: { language: 'javascript', version: '18.15.0', filename: 'main.js' },
  'visual-basic': { language: 'basic.net', version: '5.0.201', filename: 'Program.vb' },
}

type PistonStage = { stdout?: string; stderr?: string; output?: string; code?: number | null; signal?: string | null }
type PistonResult = { run?: PistonStage; compile?: PistonStage; message?: string }

async function runViaPiston(languageId: SupportedLanguage, code: string) {
  const cfg = PISTON_LANG[languageId]
  const started = Date.now()
  const res = await fetch(PISTON_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: cfg.language,
      version: cfg.version,
      files: [{ name: cfg.filename, content: code }],
      stdin: '',
      compile_timeout: 10_000,
      run_timeout: TIMEOUT_MS,
    }),
    signal: AbortSignal.timeout(20_000),
  })
  const executionMs = Math.max(1, Date.now() - started)

  if (res.status === 429) {
    throw new Error('rate-limited')
  }
  if (!res.ok) {
    throw new Error(`piston ${res.status}`)
  }

  const data = (await res.json()) as PistonResult
  // Compile-stage failure (compiled languages only): surface it as the error.
  if (data.compile && typeof data.compile.code === 'number' && data.compile.code !== 0) {
    const compileErr = (data.compile.stderr || data.compile.output || '').trim()
    return response('', truncate(compileErr || '编译失败。'), executionMs)
  }

  const run = data.run ?? {}
  const stdout = run.stdout ?? ''
  const stderr = run.stderr ?? ''
  // Server-side kill on the run timeout.
  if (run.signal === 'SIGKILL' && !stdout.trim()) {
    return response('', `运行超时：超过 ${TIMEOUT_MS / 1000}s，已停止。`, executionMs)
  }
  return response(truncate(stdout), truncate(stderr), executionMs)
}

// Wandbox fallback. Only the compilers Wandbox exposes; JS/VB have no fallback.
const WANDBOX_URL = process.env.CODE_EXEC_WANDBOX_URL?.trim() || 'https://wandbox.org/api/compile.json'
const WANDBOX_COMPILER: Partial<Record<SupportedLanguage, string>> = {
  c: 'gcc-12.3.0-c',
  cpp: 'gcc-12.3.0',
  java: 'openjdk-jdk-21+35',
  csharp: 'mono-6.12.0.199',
}

async function runViaWandbox(languageId: SupportedLanguage, code: string) {
  const compiler = WANDBOX_COMPILER[languageId]
  if (!compiler) return response('', '在线运行服务暂时不可用，稍后再试。', 1)
  // Wandbox writes source to prog.java, so a `public class X` trips the
  // "class X is public, should be in X.java" rule. A package-private class with
  // main runs identically — strip only the `public` before `class`.
  const payloadCode = languageId === 'java' ? code.replace(/\bpublic\s+(?=class\b)/g, '') : code

  const started = Date.now()
  const res = await fetch(WANDBOX_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ compiler, code: payloadCode, stdin: '' }),
    signal: AbortSignal.timeout(15_000),
  })
  const executionMs = Math.max(1, Date.now() - started)
  if (!res.ok) {
    return response('', '在线运行服务暂时不可用，稍后再试。', executionMs)
  }
  const data = (await res.json()) as {
    program_output?: string
    program_error?: string
    compiler_error?: string
    status?: string
  }
  const compileErr = (data.compiler_error ?? '').trim()
  const runOut = truncate(data.program_output ?? '')
  const runErr = truncate(data.program_error ?? '')
  if (compileErr && (data.status !== '0' || !runOut)) {
    return response(runOut, compileErr, executionMs)
  }
  return response(runOut, runErr, executionMs)
}

async function runRemote(languageId: SupportedLanguage, code: string) {
  try {
    return await runViaPiston(languageId, code)
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    console.error('[run-code] piston failed:', reason)
    // Rate-limited: don't hammer the fallback, tell the learner to wait.
    if (reason === 'rate-limited') {
      return response('', '在线运行有点忙，等几秒再点运行。', 1)
    }
    // Network / 5xx: try the Wandbox fallback for compiled languages.
    try {
      return await runViaWandbox(languageId, code)
    } catch (fallbackErr) {
      console.error('[run-code] wandbox fallback failed:', fallbackErr instanceof Error ? fallbackErr.message : fallbackErr)
      return response('', '在线运行服务暂时不可用，稍后再试。', 1)
    }
  }
}

export async function POST(req: NextRequest) {
  // Auth: anon users can't burn our remote-execution quota.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录再运行代码。' }, { status: 401 })
  }

  // Per-user rate limit before parsing the body — cheap reject path.
  const limit = checkRateLimit(`run:${user.id}`, RUN_LIMIT, RUN_WINDOW_MS)
  if (!limit.ok) {
    const seconds = Math.max(1, Math.ceil(limit.retryAfterMs / 1000))
    return NextResponse.json(
      { error: '运行太频繁，请稍后再试。' },
      { status: 429, headers: { 'Retry-After': String(seconds) } },
    )
  }

  let body: RunPayload
  try {
    body = (await req.json()) as RunPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const languageId = body.languageId as SupportedLanguage
  const code = body.code

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }
  if (code.length > MAX_CODE_LENGTH) {
    return NextResponse.json({ error: 'Code too large' }, { status: 400 })
  }
  if (!(languageId in PISTON_LANG)) {
    return NextResponse.json({ error: 'Unsupported language' }, { status: 400 })
  }

  return runRemote(languageId, code)
}
