export default function PlayLoading() {
  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <div className="border-b border-cyan-300/12 bg-background/84 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 py-2 sm:px-6">
          <div className="h-7 w-36 animate-pulse rounded bg-white/8" />
          <div className="ml-auto flex items-center gap-2">
            <div className="h-8 w-16 animate-pulse rounded-lg bg-white/8" />
            <div className="h-8 w-20 animate-pulse rounded-lg bg-white/8" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-cyan-300/45">CodeNexus</p>
        <div className="mt-4 h-9 w-80 max-w-full animate-pulse rounded bg-white/8" />
        <div className="mt-3 h-4 w-[28rem] max-w-full animate-pulse rounded bg-white/5" />
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-lg border border-cyan-300/14 bg-white/[0.025]" />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="h-28 animate-pulse rounded-lg border border-white/8 bg-white/[0.022]" />
              <div className="h-28 animate-pulse rounded-lg border border-white/8 bg-white/[0.022]" />
              <div className="h-28 animate-pulse rounded-lg border border-white/8 bg-white/[0.022]" />
            </div>
          </div>
          <div className="h-72 animate-pulse rounded-lg border border-cyan-300/16 bg-cyan-300/[0.035]" />
        </div>
        <div className="mt-6 h-[360px] animate-pulse rounded-lg border border-white/8 bg-black/40" />
        <p className="mt-8 text-center font-mono text-[10px] tracking-[0.32em] text-cyan-200/35">
          LOADING NEXUS
        </p>
      </div>
    </main>
  )
}
