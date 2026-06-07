/* Pyodide Web Worker (classic) — runs user Python OFF the main thread so a
 * runaway loop / memory bomb can be HARD-KILLED via worker.terminate() instead
 * of freezing the whole tab. Loaded from /public as a static asset to avoid any
 * Next.js/webpack/turbopack worker-bundling pitfalls. Protocol:
 *   main → worker: {type:'init'} | {type:'graphics'} | {type:'run', id, code}
 *   worker → main: {type:'progress',msg} | {type:'ready'} | {type:'graphics-ready'}
 *                  | {type:'exec-start',id} | {type:'result',id,output,error,executionMs}
 *                  | {type:'init-error',message} | {type:'run-error',id,message}
 */
const PYODIDE_VERSION = "0.26.4";
const CDN = "https://cdn.jsdelivr.net/pyodide/v" + PYODIDE_VERSION + "/full/";

let py = null;
let graphicsLoaded = false;

// Same sandbox runner as the main-thread version: capture stdout/stderr, exec
// user code, return (output, error). Graphics flow through stdout (ZF_IMAGE_).
const RUNNER_SCRIPT = [
  "import sys, io, traceback as _tb",
  "_buf = io.StringIO(); _err = io.StringIO()",
  "sys.stdout = _buf; sys.stderr = _err",
  '_output = ""; _error = ""',
  "try:",
  "    exec(compile(_zf_user_code, '<workshop>', 'exec'), {})",
  "    _output = _buf.getvalue()",
  "except SystemExit:",
  '    _output = _buf.getvalue(); _error = "[程序调用了 sys.exit()]"',
  "except Exception:",
  "    _output = _buf.getvalue(); _error = _tb.format_exc()",
  "finally:",
  "    sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__",
  "(_output, _error)"
].join("\n");

async function ensurePy() {
  if (py) return py;
  postMessage({ type: "progress", msg: "正在下载 Python 引擎..." });
  importScripts(CDN + "pyodide.js");
  postMessage({ type: "progress", msg: "正在初始化 WASM 运行时..." });
  py = await self.loadPyodide({ indexURL: CDN });
  postMessage({ type: "progress", msg: "预热标准库..." });
  await py.runPythonAsync("import sys, io, traceback, math, random, json, base64");
  return py;
}

self.onmessage = async (e) => {
  const msg = e.data || {};
  try {
    if (msg.type === "init") {
      await ensurePy();
      postMessage({ type: "ready" });
    } else if (msg.type === "graphics") {
      await ensurePy();
      if (!graphicsLoaded) {
        postMessage({ type: "progress", msg: "正在下载绘图工具 (matplotlib + numpy)..." });
        await py.loadPackage(["matplotlib", "numpy"]);
        await py.runPythonAsync("import matplotlib; matplotlib.use('Agg')");
        graphicsLoaded = true;
      }
      postMessage({ type: "graphics-ready" });
    } else if (msg.type === "run") {
      await ensurePy();
      postMessage({ type: "exec-start", id: msg.id });
      const start = performance.now();
      py.globals.set("_zf_user_code", msg.code);
      const result = await py.runPythonAsync(RUNNER_SCRIPT);
      const executionMs = Math.round(performance.now() - start);
      const output = String(result && result.get ? result.get(0) : (result && result[0]) || "");
      const error = String(result && result.get ? result.get(1) : (result && result[1]) || "");
      if (result && typeof result.destroy === "function") result.destroy();
      py.globals.set("_zf_user_code", "");
      postMessage({ type: "result", id: msg.id, output, error, executionMs });
    }
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    postMessage({ type: msg.type === "run" ? "run-error" : "init-error", id: msg.id, message });
  }
};
