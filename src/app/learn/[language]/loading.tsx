export default function WorkshopLoading() {
  return (
    <main className="flex h-[100dvh] flex-col bg-background text-foreground">
      <div className="flex min-h-12 items-center gap-3 border-b border-cyan-300/12 bg-background/90 px-4">
        <div className="h-5 w-14 animate-pulse rounded bg-white/8" />
        <div className="h-5 w-px bg-white/10" />
        <div className="h-5 w-32 animate-pulse rounded bg-white/8" />
        <div className="ml-auto h-7 w-7 animate-pulse rounded bg-white/8" />
        <div className="h-7 w-20 animate-pulse rounded bg-primary/30" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 flex-shrink-0 border-r border-white/8 p-4 lg:block">
          <div className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded bg-white/8" />
            <div className="h-20 animate-pulse rounded bg-white/[0.04]" />
            <div className="h-20 animate-pulse rounded bg-white/[0.04]" />
          </div>
        </aside>
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-pulse rounded-full border border-cyan-300/22 bg-cyan-300/8" />
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-200/40">
              BOOTING WORKSHOP...
            </p>
          </div>
        </main>
        <aside className="hidden w-80 flex-shrink-0 border-l border-white/8 p-4 lg:block">
          <div className="space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-white/8" />
            <div className="h-32 animate-pulse rounded bg-white/[0.04]" />
          </div>
        </aside>
      </div>
    </main>
  )
}
