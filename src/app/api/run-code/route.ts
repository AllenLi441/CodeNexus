import { NextRequest, NextResponse } from 'next/server'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
// Remote compile+run (Wandbox fallback) needs headroom beyond the default 10s.
export const maxDuration = 30

type SupportedLanguage = 'c' | 'cpp' | 'java' | 'csharp' | 'javascript' | 'visual-basic'

type RunPayload = {
  languageId?: string
  code?: string
}

const execFileAsync = promisify(execFile)
const MAX_CODE_LENGTH = 50_000
const MAX_OUTPUT_LENGTH = 12_000
const TIMEOUT_MS = 8_000

// 30 runs / minute / user. Each run can be a real compile, so this is a hard
// cost ceiling (CPU + tmpfs IO). Adjust if learners legitimately exceed it.
const RUN_LIMIT = 30
const RUN_WINDOW_MS = 60_000

function truncate(value: string) {
  if (value.length <= MAX_OUTPUT_LENGTH) return value
  return `${value.slice(0, MAX_OUTPUT_LENGTH)}\n... 输出已截断`
}

async function commandExists(command: string) {
  try {
    await execFileAsync('which', [command], { timeout: 1_000 })
    return true
  } catch {
    return false
  }
}

async function firstAvailable(commands: string[]) {
  for (const command of commands) {
    if (await commandExists(command)) return command
  }
  return null
}

async function runCommand(command: string, args: string[], cwd: string) {
  const started = Date.now()
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd,
      timeout: TIMEOUT_MS,
      maxBuffer: 1024 * 1024,
      env: {
        NODE_ENV: process.env.NODE_ENV ?? 'production',
        PATH: process.env.PATH ?? '',
        HOME: cwd,
        TMPDIR: cwd,
        LANG: process.env.LANG ?? 'C.UTF-8',
        LC_ALL: process.env.LC_ALL ?? process.env.LANG ?? 'C.UTF-8',
      },
    })
    return {
      ok: true,
      output: truncate(stdout),
      error: truncate(stderr),
      executionMs: Math.max(1, Date.now() - started),
    }
  } catch (error) {
    const err = error as Error & { stdout?: string | Buffer; stderr?: string | Buffer; killed?: boolean; signal?: string }
    const stdout = Buffer.isBuffer(err.stdout) ? err.stdout.toString('utf8') : err.stdout ?? ''
    const stderr = Buffer.isBuffer(err.stderr) ? err.stderr.toString('utf8') : err.stderr ?? ''
    const message = err.killed || err.signal === 'SIGTERM'
      ? `运行超时：超过 ${TIMEOUT_MS / 1000}s，已停止。`
      : stderr || err.message

    return {
      ok: false,
      output: truncate(String(stdout)),
      error: truncate(String(message)),
      executionMs: Math.max(1, Date.now() - started),
    }
  }
}

function speedTier(executionMs: number) {
  if (executionMs < 50) return { emoji: '✓', label: `${executionMs}ms`, percentile: '真实运行' }
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

// Remote execution fallback. Vercel's serverless runtime has Node (so JS runs
// locally) but NOT gcc/g++/javac/mono, so C/C++/Java/C# are compiled+run on a
// remote sandbox. Defaults to the public Wandbox API (free, no key) and is
// overridable via CODE_EXEC_WANDBOX_URL so the deployment can point at a
// self-hosted instance for production reliability. VB is not on Wandbox.
const WANDBOX_URL = process.env.CODE_EXEC_WANDBOX_URL?.trim() || 'https://wandbox.org/api/compile.json'
const WANDBOX_COMPILER: Partial<Record<SupportedLanguage, string>> = {
  c: 'gcc-12.3.0-c',
  cpp: 'gcc-12.3.0',
  java: 'openjdk-jdk-21+35',
  csharp: 'mono-6.12.0.199',
}

async function runViaWandbox(languageId: SupportedLanguage, code: string) {
  const compiler = WANDBOX_COMPILER[languageId]
  if (!compiler) {
    return response('', '这门语言暂时不支持在线编译运行（仅做结构检查）。真实运行需自托管执行后端。', 1)
  }
  // Wandbox writes the source to prog.java, so a `public class X` trips the
  // "class X is public, should be in X.java" rule. A package-private class with
  // main still runs identically — strip only the `public` before `class`.
  const payloadCode = languageId === 'java' ? code.replace(/\bpublic\s+(?=class\b)/g, '') : code

  const started = Date.now()
  try {
    const res = await fetch(WANDBOX_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ compiler, code: payloadCode, stdin: '' }),
      signal: AbortSignal.timeout(15_000),
    })
    const executionMs = Date.now() - started
    if (!res.ok) {
      return response('', `在线编译服务返回 ${res.status}，稍后再试。`, executionMs)
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
    // Non-zero status with no stdout → surface the compiler error as the failure.
    if (compileErr && (data.status !== '0' || !runOut)) {
      return response(runOut, compileErr, executionMs)
    }
    return response(runOut, runErr, executionMs)
  } catch {
    return response('', '在线编译服务暂时不可用（网络或超时）。稍后再试，或在部署环境配置自托管执行后端（CODE_EXEC_WANDBOX_URL）。', Date.now() - started)
  }
}

async function runJavaScript(code: string, cwd: string) {
  const node = await firstAvailable(['node'])
  if (!node) return response('', '缺少 Node.js，无法真实运行 JavaScript。', 1)
  const file = join(cwd, 'main.js')
  await writeFile(file, code, 'utf8')
  const result = await runCommand(node, ['--no-warnings', file], cwd)
  return response(result.output, result.error, result.executionMs)
}

async function runC(code: string, cwd: string) {
  const compiler = await firstAvailable(['clang', 'gcc'])
  if (!compiler) return runViaWandbox('c', code)
  const source = join(cwd, 'main.c')
  const binary = join(cwd, 'main')
  await writeFile(source, code, 'utf8')

  const compile = await runCommand(compiler, [source, '-O0', '-Wall', '-Wextra', '-o', binary], cwd)
  if (!compile.ok) return response(compile.output, compile.error, compile.executionMs)

  const run = await runCommand(binary, [], cwd)
  return response(run.output, run.error, compile.executionMs + run.executionMs)
}

async function runCpp(code: string, cwd: string) {
  const compiler = await firstAvailable(['clang++', 'g++'])
  if (!compiler) return runViaWandbox('cpp', code)
  const source = join(cwd, 'main.cpp')
  const binary = join(cwd, 'main')
  await writeFile(source, code, 'utf8')

  const compile = await runCommand(compiler, [source, '-std=c++17', '-O0', '-Wall', '-Wextra', '-o', binary], cwd)
  if (!compile.ok) return response(compile.output, compile.error, compile.executionMs)

  const run = await runCommand(binary, [], cwd)
  return response(run.output, run.error, compile.executionMs + run.executionMs)
}

async function runJava(code: string, cwd: string) {
  const javac = await firstAvailable(['javac'])
  const java = await firstAvailable(['java'])
  if (!javac || !java) return runViaWandbox('java', code)
  const source = join(cwd, 'Main.java')
  await writeFile(source, code, 'utf8')

  const compile = await runCommand(javac, ['Main.java'], cwd)
  if (!compile.ok) return response(compile.output, compile.error, compile.executionMs)

  const run = await runCommand(java, ['Main'], cwd)
  return response(run.output, run.error, compile.executionMs + run.executionMs)
}

async function runCSharp(code: string, cwd: string) {
  const dotnet = await firstAvailable(['dotnet'])
  if (!dotnet) return runViaWandbox('csharp', code)

  const projectDir = join(cwd, 'CSharpRun')
  const create = await runCommand(dotnet, ['new', 'console', '--force', '--output', projectDir], cwd)
  if (!create.ok) return response(create.output, create.error, create.executionMs)

  await writeFile(join(projectDir, 'Program.cs'), code, 'utf8')
  const run = await runCommand(dotnet, ['run', '--no-restore', '--project', projectDir], cwd)
  return response(run.output, run.error, create.executionMs + run.executionMs)
}

async function runVisualBasic(code: string, cwd: string) {
  const dotnet = await firstAvailable(['dotnet'])
  if (!dotnet) return runViaWandbox('visual-basic', code)

  const projectDir = join(cwd, 'VBRun')
  const create = await runCommand(dotnet, ['new', 'console', '-lang', 'VB', '--force', '--output', projectDir], cwd)
  if (!create.ok) return response(create.output, create.error, create.executionMs)

  await writeFile(join(projectDir, 'Program.vb'), code, 'utf8')
  const run = await runCommand(dotnet, ['run', '--no-restore', '--project', projectDir], cwd)
  return response(run.output, run.error, create.executionMs + run.executionMs)
}

export async function POST(req: NextRequest) {
  // Auth: anon users cannot spawn child compilers on our box.
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
      { error: `运行太频繁，${seconds} 秒后再试。` },
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

  const cwd = await mkdtemp(join(tmpdir(), 'codenexus-run-'))
  try {
    switch (languageId) {
      case 'javascript':
        return await runJavaScript(code, cwd)
      case 'c':
        return await runC(code, cwd)
      case 'cpp':
        return await runCpp(code, cwd)
      case 'java':
        return await runJava(code, cwd)
      case 'csharp':
        return await runCSharp(code, cwd)
      case 'visual-basic':
        return await runVisualBasic(code, cwd)
      default:
        return NextResponse.json({ error: 'Unsupported language' }, { status: 400 })
    }
  } finally {
    await rm(cwd, { recursive: true, force: true })
  }
}
