#!/usr/bin/env node

import { spawn } from 'node:child_process'
import {
  appendFileSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import net from 'node:net'

const root = process.cwd()
const nextDir = path.join(root, '.next')
const pidFile = path.join(nextDir, 'dev-server.pid')
const logFile = path.join(nextDir, 'dev-server.log')
const port = process.env.PORT ?? '3000'
const host = process.env.HOST ?? '0.0.0.0'
const localUrl = `http://localhost:${port}`
const healthUrl = `${localUrl}/api/health`
const healthTimeoutMs = 1_500
const startupTimeoutMs = 25_000

function ensureNextDir() {
  mkdirSync(nextDir, { recursive: true })
}

function readPid() {
  if (!existsSync(pidFile)) return null
  const value = Number(readFileSync(pidFile, 'utf8').trim())
  return Number.isFinite(value) && value > 0 ? value : null
}

function isRunning(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function canBindPort(value) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close(() => resolve(true))
    })
    server.listen(Number(value), '0.0.0.0')
  })
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchHealth() {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), healthTimeoutMs)
  try {
    const res = await fetch(healthUrl, {
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!res.ok) {
      return { ok: false, status: res.status, message: `HTTP ${res.status}` }
    }
    const payload = await res.json()
    return { ok: true, status: res.status, payload }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      message: error instanceof Error ? error.message : 'health check failed',
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function waitForHealth(maxMs = startupTimeoutMs) {
  const started = Date.now()
  let last = null
  while (Date.now() - started < maxMs) {
    last = await fetchHealth()
    if (last.ok) return last
    await wait(800)
  }
  return last ?? { ok: false, status: 0, message: 'health check timed out' }
}

function clearPid() {
  if (existsSync(pidFile)) rmSync(pidFile)
}

async function start() {
  ensureNextDir()
  const currentPid = readPid()
  if (currentPid && isRunning(currentPid)) {
    console.log(`CodeNexus dev server is already running: pid ${currentPid}`)
    await printHealth()
    console.log('Logs: npm run dev:logs')
    return
  }

  if (!(await canBindPort(port))) {
    console.log(`Port ${port} is already in use.`)
    await printHealth()
    console.log('If this is your old foreground dev server, press Ctrl+C there, then run npm run dev:bg.')
    return
  }

  const out = openSync(logFile, 'a')
  appendFileSync(logFile, `\n\n[${new Date().toISOString()}] starting next dev on ${host}:${port}\n`)

  const child = spawn('npm', ['run', 'dev', '--', '--hostname', host], {
    cwd: root,
    detached: true,
    env: { ...process.env, PORT: port },
    stdio: ['ignore', out, out],
  })

  child.unref()
  closeSync(out)
  writeFileSync(pidFile, String(child.pid))
  console.log(`CodeNexus dev server started in background: pid ${child.pid}`)
  console.log(`Local: ${localUrl}`)
  console.log(`LAN: use your Mac IP, for example http://<your-ip>:${port}`)
  console.log('Waiting for health check...')
  const health = await waitForHealth()
  if (health.ok) {
    console.log(`Health: ok (${health.payload.service}, uptime ${health.payload.uptimeSec}s)`)
  } else {
    console.log(`Health: not ready yet (${health.message ?? 'unknown error'})`)
    console.log('Run npm run dev:logs to inspect the last log lines.')
  }
  console.log('Logs: npm run dev:logs')
  console.log('Follow logs: npm run dev:logs:follow')
  console.log('Stop: npm run dev:stop')
}

async function stop() {
  const pid = readPid()
  if (!pid || !isRunning(pid)) {
    clearPid()
    console.log('CodeNexus dev server is not running.')
    return
  }

  process.kill(pid, 'SIGTERM')
  for (let i = 0; i < 20; i += 1) {
    await wait(200)
    if (!isRunning(pid)) {
      clearPid()
      console.log(`Stopped CodeNexus dev server: pid ${pid}`)
      return
    }
  }

  process.kill(pid, 'SIGKILL')
  clearPid()
  console.log(`Force-stopped CodeNexus dev server: pid ${pid}`)
}

async function printHealth() {
  const health = await fetchHealth()
  if (health.ok) {
    console.log(`Health: ok (${health.payload.service}, uptime ${health.payload.uptimeSec}s)`)
    console.log(`Health URL: ${healthUrl}`)
  } else {
    console.log(`Health: unavailable (${health.message ?? 'unknown error'})`)
  }
}

async function status() {
  const pid = readPid()
  if (pid && isRunning(pid)) {
    console.log(`CodeNexus dev server is running: pid ${pid}`)
    console.log(`Local: ${localUrl}`)
    console.log(`Logs: ${logFile}`)
    await printHealth()
    return
  }
  clearPid()
  if (!(await canBindPort(port))) {
    console.log(`CodeNexus pid file is empty, but port ${port} is in use.`)
    await printHealth()
    return
  }
  console.log('CodeNexus dev server is not running.')
}

function logs() {
  ensureNextDir()
  if (!existsSync(logFile)) {
    console.log('No dev server log yet. Start it with npm run dev:bg.')
    return
  }
  const args = process.argv.includes('--follow') ? ['-f', logFile] : ['-n', '80', logFile]
  const tail = spawn('tail', args, { stdio: 'inherit' })
  tail.on('exit', (code) => process.exit(code ?? 0))
}

const command = process.argv[2] ?? 'start'

if (command === 'start') await start()
else if (command === 'stop') await stop()
else if (command === 'status') await status()
else if (command === 'logs') logs()
else if (command === 'health') await printHealth()
else {
  console.error(`Unknown command: ${command}`)
  console.error('Use one of: start, stop, status, logs, health')
  process.exit(1)
}
