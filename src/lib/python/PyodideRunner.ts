// Pyodide loaded from CDN — not bundled
const PYODIDE_VERSION = '0.26.4'
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`
export const ZF_IMAGE_PREFIX = '__ZF_IMAGE__'

export type RunResult = {
  output: string
  error: string
  executionMs: number
  imageBase64: string | null  // non-null when matplotlib was used
  speedTier: SpeedTier
}

export type SpeedTier = {
  label: string
  emoji: string
  percentile: string
}

export type PyodideStatus = 'idle' | 'loading' | 'ready' | 'error'

interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>
  loadPackage: (pkgs: string[]) => Promise<void>
  globals: { set: (key: string, value: unknown) => void }
  version: string
}

let pyodideInstance: PyodideInterface | null = null
let loadingPromise: Promise<PyodideInterface> | null = null
let graphicsLoaded = false
let graphicsLoadingPromise: Promise<void> | null = null

// ── Speed tier lookup ─────────────────────────────────────────────────────────
function getSpeedTier(ms: number): SpeedTier {
  if (ms < 10)  return { emoji: '🚀', label: `${ms}ms`, percentile: '超越 99.99% 的全球设备' }
  if (ms < 50)  return { emoji: '⚡', label: `${ms}ms`, percentile: '超越 99.5% 的全球设备' }
  if (ms < 100) return { emoji: '🔥', label: `${ms}ms`, percentile: '超越 97% 的全球设备' }
  if (ms < 300) return { emoji: '✓',  label: `${ms}ms`, percentile: '响应飞快' }
  if (ms < 1000)return { emoji: '⏱',  label: `${ms}ms`, percentile: '' }
  return { emoji: '⌛', label: `${ms}ms`, percentile: '(含首次编译开销)' }
}

// ── Script injection ──────────────────────────────────────────────────────────
async function injectScript(src: string): Promise<void> {
  if (document.querySelector(`script[src="${src}"]`)) return
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
}

// ── Init Pyodide ──────────────────────────────────────────────────────────────
export async function initPyodide(
  onProgress?: (msg: string) => void
): Promise<PyodideInterface> {
  if (pyodideInstance) return pyodideInstance
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    onProgress?.('正在下载 Python 引擎...')
    await injectScript(`${PYODIDE_CDN}pyodide.js`)
    onProgress?.('正在初始化 WASM 运行时...')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const py = await (window as any).loadPyodide({ indexURL: PYODIDE_CDN })
    onProgress?.('预热标准库...')
    await py.runPythonAsync('import sys, io, traceback, math, random, json, base64')
    pyodideInstance = py as PyodideInterface
    onProgress?.('就绪')
    return pyodideInstance
  })()

  return loadingPromise
}

// ── Load matplotlib + numpy for graphics levels ───────────────────────────────
export async function loadGraphicsPackages(
  onProgress?: (msg: string) => void
): Promise<void> {
  if (graphicsLoaded) return
  if (graphicsLoadingPromise) return graphicsLoadingPromise

  graphicsLoadingPromise = (async () => {
    const py = await initPyodide()
    onProgress?.('正在下载绘图工具 (matplotlib + numpy)...')
    await py.loadPackage(['matplotlib', 'numpy'])
    // Set non-display backend
    await py.runPythonAsync("import matplotlib; matplotlib.use('Agg')")
    graphicsLoaded = true
    onProgress?.('绘图工具已就绪')
  })()

  return graphicsLoadingPromise
}

export function isGraphicsReady(): boolean { return graphicsLoaded }

// ── Sandbox runner ────────────────────────────────────────────────────────────
const RUNNER_SCRIPT = `
import sys, io, traceback as _tb

_buf = io.StringIO()
_err = io.StringIO()
sys.stdout = _buf
sys.stderr = _err

_output = ""
_error = ""

try:
    exec(compile(_zf_user_code, '<workshop>', 'exec'), {})
    _output = _buf.getvalue()
except SystemExit:
    _output = _buf.getvalue()
    _error = "[程序调用了 sys.exit()]"
except Exception:
    _output = _buf.getvalue()
    _error = _tb.format_exc()
finally:
    sys.stdout = sys.__stdout__
    sys.stderr = sys.__stderr__

(_output, _error)
`

export async function runCode(code: string): Promise<RunResult> {
  const py = await initPyodide()

  const start = performance.now()
  py.globals.set('_zf_user_code', code)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await py.runPythonAsync(RUNNER_SCRIPT)) as any
  const executionMs = Math.round(performance.now() - start)

  const rawOutput = String(result.get ? result.get(0) : (result[0] ?? ''))
  const error = String(result.get ? result.get(1) : (result[1] ?? ''))
  if (typeof result.destroy === 'function') result.destroy()
  py.globals.set('_zf_user_code', '')

  // Detect graphical output
  let imageBase64: string | null = null
  let output = rawOutput
  const imgIdx = rawOutput.indexOf(ZF_IMAGE_PREFIX)
  if (imgIdx !== -1) {
    imageBase64 = rawOutput.slice(imgIdx + ZF_IMAGE_PREFIX.length).trim()
    output = rawOutput.slice(0, imgIdx).trim()
  }

  return { output, error, executionMs, imageBase64, speedTier: getSpeedTier(executionMs) }
}
