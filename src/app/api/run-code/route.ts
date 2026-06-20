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
// Provider order (see runRemote): a self-hosted Piston (CODE_EXEC_PISTON_URL) is
// tried first when configured; otherwise the free Paiza.IO public runner; Wandbox
// is a last-resort fallback for the compiled languages it supports. The emkc.org
// public Piston went whitelist-only on 2026-02-15 (intermittent 401), so it is NO
// LONGER a default — only a Piston URL you set (self-hosted) is ever used.
const PISTON_URL = process.env.CODE_EXEC_PISTON_URL?.trim() || ''

// language + version are pinned to runtimes confirmed available on emkc.org. The
// JS entry pins Node 18 (NOT the deno-js runtime that shares the "javascript"
// language id). filename matters for Java (`public class Main` → Main.java).
const PISTON_LANG: Record<SupportedLanguage, { language: string; version: string; filename: string }> = {
  c: { language: 'c', version: '10.2.0', filename: 'main.c' },
  cpp: { language: 'c++', version: '10.2.0', filename: 'main.cpp' },
  java: { language: 'java', version: '15.0.2', filename: 'Main.java' },
  csharp: { language: 'csharp', version: '6.12.0', filename: 'Program.cs' },
  // `node-js` (alias) forces Piston's Node runtime, not its deno "javascript"
  // runtime. `*` = latest available version, so we survive Piston version drift
  // (pinned 18.15.0 / 5.0.201 stopped matching, which silently broke JS + VB).
  javascript: { language: 'node-js', version: '*', filename: 'main.js' },
  'visual-basic': { language: 'basic.net', version: '*', filename: 'Program.vb' },
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
    const body = await res.text().catch(() => '')
    throw new Error(`piston ${res.status}: ${body.slice(0, 120)}`)
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

// Paiza.IO — free public runner (api_key=guest, no key needed). Covers all six
// languages INCLUDING Visual Basic. Async: create a runner (longpoll for the
// result), then read details. No whitelist, but it's a free best-effort service.
const PAIZA_URL = process.env.CODE_EXEC_PAIZA_URL?.trim() || 'https://api.paiza.io'
const PAIZA_LANG: Record<SupportedLanguage, string> = {
  c: 'c',
  cpp: 'cpp',
  java: 'java',
  csharp: 'csharp',
  javascript: 'javascript',
  'visual-basic': 'vb',
}

type PaizaJob = { id?: string; status?: string; error?: string }
type PaizaDetails = {
  build_result?: string
  build_stdout?: string
  build_stderr?: string
  stdout?: string
  stderr?: string
  result?: string
}

async function runViaPaiza(languageId: SupportedLanguage, code: string) {
  const started = Date.now()
  const createBody = new URLSearchParams({
    source_code: code,
    language: PAIZA_LANG[languageId],
    input: '',
    longpoll: 'true',
    longpoll_timeout: '14',
    api_key: 'guest',
  })
  const createRes = await fetch(`${PAIZA_URL}/runners/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: createBody.toString(),
    signal: AbortSignal.timeout(20_000),
  })
  if (!createRes.ok) {
    const body = await createRes.text().catch(() => '')
    throw new Error(`paiza ${createRes.status}: ${body.slice(0, 120)}`)
  }
  let job = (await createRes.json()) as PaizaJob
  if (!job.id) throw new Error(`paiza no-id: ${JSON.stringify(job).slice(0, 120)}`)

  // longpoll usually returns 'completed'; if it timed out as 'running', poll.
  let tries = 0
  while (job.status !== 'completed' && tries < 6) {
    await new Promise((r) => setTimeout(r, 1_200))
    const stRes = await fetch(`${PAIZA_URL}/runners/get_status?id=${job.id}&api_key=guest`, {
      signal: AbortSignal.timeout(10_000),
    })
    job = (await stRes.json()) as PaizaJob
    tries++
  }
  if (job.status !== 'completed') throw new Error('paiza timeout')

  const detRes = await fetch(`${PAIZA_URL}/runners/get_details?id=${job.id}&api_key=guest`, {
    signal: AbortSignal.timeout(10_000),
  })
  if (!detRes.ok) throw new Error(`paiza details ${detRes.status}`)
  const det = (await detRes.json()) as PaizaDetails
  const executionMs = Math.max(1, Date.now() - started)

  // Compile / build failure → surface it as the error.
  if (det.build_result && det.build_result !== 'success') {
    const be = (det.build_stderr || det.build_stdout || '').trim()
    return response('', truncate(be || '编译失败。'), executionMs)
  }
  if (det.result === 'timeout') {
    return response('', '运行超时，已停止。', executionMs)
  }
  return response(truncate(det.stdout ?? ''), truncate(det.stderr ?? ''), executionMs)
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
  if (!compiler) throw new Error('no-wandbox-compiler')
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
  // Try providers in order. A returned response (incl. compile/runtime errors) is
  // the final answer; only a THROWN error falls through to the next provider.
  const providers: Array<{ name: string; run: () => Promise<NextResponse> }> = []
  if (PISTON_URL) providers.push({ name: 'piston', run: () => runViaPiston(languageId, code) })
  providers.push({ name: 'paiza', run: () => runViaPaiza(languageId, code) })
  providers.push({ name: 'wandbox', run: () => runViaWandbox(languageId, code) })

  let reason = ''
  for (const p of providers) {
    try {
      return await p.run()
    } catch (err) {
      const r = err instanceof Error ? err.message : String(err)
      console.error(`[run-code] ${p.name} failed:`, r)
      if (r === 'rate-limited') {
        return response('', '在线运行有点忙，等几秒再点运行。', 1)
      }
      // Keep the most informative reason (not the wandbox "unsupported" noise).
      if (r !== 'no-wandbox-compiler') reason = r
    }
  }
  return response('', `在线运行服务暂时不可用，稍后再试。（${reason}）`, 1)
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
