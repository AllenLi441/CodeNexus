export default function DashboardLoading() {
  return (
    <main className="min-h-[100dvh] bg-black text-white">
      <div className="border-b border-cyan-300/12 bg-black/84 backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center gap-3 px-4 py-2">
          <div className="h-6 w-32 animate-pulse rounded bg-white/8" />
          <div className="ml-auto h-7 w-7 animate-pulse rounded bg-white/8" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-7">
        <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-cyan-300/45">
          Mission Control
        </p>
        <div className="mt-3 h-7 w-72 animate-pulse rounded bg-white/8" />
        <div className="mt-2 h-4 w-96 animate-pulse rounded bg-white/5" />
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <div className="h-44 animate-pulse rounded-lg border border-cyan-300/14 bg-white/[0.025]" />
            <div className="h-56 animate-pulse rounded-lg border border-white/8 bg-white/[0.022]" />
            <div className="h-[520px] animate-pulse rounded-lg border border-cyan-300/14 bg-black/40" />
          </div>
          <div className="space-y-4">
            <div className="h-32 animate-pulse rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04]" />
            <div className="h-28 animate-pulse rounded-lg border border-white/8 bg-white/[0.022]" />
            <div className="h-32 animate-pulse rounded-lg border border-cyan-300/22 bg-cyan-300/[0.05]" />
          </div>
        </div>
        <p className="mt-8 text-center font-mono text-[10px] tracking-[0.32em] text-cyan-200/35">
          LOADING NEXUS · 加载主控台...
        </p>
      </div>
    </main>
  )
}
