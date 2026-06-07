// Pyodide runs inside a Web Worker (see /public/pyodide.worker.js) so a runaway
// loop / memory bomb can be HARD-KILLED via worker.terminate() instead of
// freezing the tab. This module keeps the original public API (initPyodide /
// loadGraphicsPackages / isGraphicsReady / runCode) as a drop-in, and adds a
// wall-clock timeout that terminates+respawns the worker on a runaway.
const ZF_IMAGE_PREFIX = "__ZF_IMAGE__";
export { ZF_IMAGE_PREFIX };

// Wall-clock cap on a single execution (measured from exec-start, so the one-off
// Pyodide download is NOT counted against it). On timeout we terminate the
// worker — the only reliable way to stop a synchronous WASM busy-loop.
const EXEC_TIMEOUT_MS = 6000;

export type RunResult = {
  output: string;
  error: string;
  executionMs: number;
  imageBase64: string | null;
  speedTier: SpeedTier;
};

export type SpeedTier = { label: string; emoji: string; percentile: string };
export type PyodideStatus = "idle" | "loading" | "ready" | "error";

function getSpeedTier(ms: number): SpeedTier {
  if (ms < 10) return { emoji: "🚀", label: `${ms}ms`, percentile: "超越 99.99% 的全球设备" };
  if (ms < 50) return { emoji: "⚡", label: `${ms}ms`, percentile: "超越 99.5% 的全球设备" };
  if (ms < 100) return { emoji: "🔥", label: `${ms}ms`, percentile: "超越 97% 的全球设备" };
  if (ms < 300) return { emoji: "✓", label: `${ms}ms`, percentile: "响应飞快" };
  if (ms < 1000) return { emoji: "⏱", label: `${ms}ms`, percentile: "" };
  return { emoji: "⌛", label: `${ms}ms`, percentile: "(含首次编译开销)" };
}

type Waiter = { resolve: () => void; reject: (e: Error) => void };
type RunWaiter = {
  resolve: (v: { output: string; error: string; executionMs: number }) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout> | null;
};

let worker: Worker | null = null;
let ready = false;
let graphicsReady = false;
let graphicsWanted = false;
let initPromise: Promise<void> | null = null;
let progressCb: ((msg: string) => void) | undefined;
let runSeq = 0;

const initWaiters: Waiter[] = [];
const graphicsWaiters: Waiter[] = [];
const pending = new Map<number, RunWaiter>();

function flushReject(list: Waiter[], err: Error) {
  while (list.length) list.shift()!.reject(err);
}

function hardReset(err: Error) {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  ready = false;
  graphicsReady = false;
  initPromise = null;
  pending.forEach((p) => {
    if (p.timer) clearTimeout(p.timer);
    p.reject(err);
  });
  pending.clear();
  flushReject(initWaiters, err);
  flushReject(graphicsWaiters, err);
}

function onTimeout(id: number) {
  const p = pending.get(id);
  pending.delete(id);
  // Kill the worker (and everything running in it), then resolve THIS run with a
  // friendly "stopped" result. Remaining pending work is rejected by hardReset.
  hardReset(new Error("runtime terminated after timeout"));
  if (p) {
    p.resolve({
      output: "",
      error: `代码运行超过 ${EXEC_TIMEOUT_MS / 1000} 秒，已被自动停止（多半是死循环或占用过多内存）。给循环加退出条件，或把数据规模改小后再运行。`,
      executionMs: EXEC_TIMEOUT_MS
    });
  }
}

function makeWorker(): Worker {
  const w = new Worker("/pyodide.worker.js");
  w.onmessage = (e: MessageEvent) => {
    const m = e.data || {};
    switch (m.type) {
      case "progress":
        progressCb?.(m.msg);
        break;
      case "ready":
        ready = true;
        flushResolve(initWaiters);
        break;
      case "graphics-ready":
        graphicsReady = true;
        flushResolve(graphicsWaiters);
        break;
      case "exec-start": {
        const p = pending.get(m.id);
        if (p) p.timer = setTimeout(() => onTimeout(m.id), EXEC_TIMEOUT_MS);
        break;
      }
      case "result": {
        const p = pending.get(m.id);
        if (p) {
          if (p.timer) clearTimeout(p.timer);
          pending.delete(m.id);
          p.resolve({ output: m.output, error: m.error, executionMs: m.executionMs });
        }
        break;
      }
      case "run-error": {
        const p = pending.get(m.id);
        if (p) {
          if (p.timer) clearTimeout(p.timer);
          pending.delete(m.id);
          p.reject(new Error(m.message));
        }
        break;
      }
      case "init-error":
        hardReset(new Error(m.message || "Pyodide init failed"));
        break;
    }
  };
  w.onerror = () => hardReset(new Error("Pyodide worker crashed"));
  return w;
}

function flushResolve(list: Waiter[]) {
  while (list.length) list.shift()!.resolve();
}

async function ensureReady(onProgress?: (msg: string) => void): Promise<void> {
  if (onProgress) progressCb = onProgress;
  if (ready && worker) {
    if (graphicsWanted && !graphicsReady) await loadGraphicsInternal();
    return;
  }
  if (!initPromise) {
    if (!worker) worker = makeWorker();
    initPromise = new Promise<void>((resolve, reject) => {
      initWaiters.push({ resolve, reject });
      worker!.postMessage({ type: "init" });
    });
  }
  await initPromise;
  if (graphicsWanted && !graphicsReady) await loadGraphicsInternal();
}

function loadGraphicsInternal(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    graphicsWaiters.push({ resolve, reject });
    worker!.postMessage({ type: "graphics" });
  });
}

// ── Public API (drop-in compatible) ────────────────────────────────────────────
export async function initPyodide(onProgress?: (msg: string) => void): Promise<void> {
  await ensureReady(onProgress);
}

export async function loadGraphicsPackages(onProgress?: (msg: string) => void): Promise<void> {
  graphicsWanted = true;
  if (onProgress) progressCb = onProgress;
  await ensureReady(onProgress);
  if (!graphicsReady) await loadGraphicsInternal();
}

export function isGraphicsReady(): boolean {
  return graphicsReady;
}

export async function runCode(code: string): Promise<RunResult> {
  await ensureReady();
  const id = ++runSeq;
  const raw = await new Promise<{ output: string; error: string; executionMs: number }>(
    (resolve, reject) => {
      pending.set(id, { resolve, reject, timer: null });
      worker!.postMessage({ type: "run", id, code });
    }
  );

  let imageBase64: string | null = null;
  let output = raw.output;
  const imgIdx = raw.output.indexOf(ZF_IMAGE_PREFIX);
  if (imgIdx !== -1) {
    imageBase64 = raw.output.slice(imgIdx + ZF_IMAGE_PREFIX.length).trim();
    output = raw.output.slice(0, imgIdx).trim();
  }

  return {
    output,
    error: raw.error,
    executionMs: raw.executionMs,
    imageBase64,
    speedTier: getSpeedTier(raw.executionMs)
  };
}
