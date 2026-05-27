import Link from 'next/link'
import { Compass, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-cyan-300/22 bg-cyan-300/8 text-cyan-200">
          <Compass className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/45">
            Sector 404 · No Signal
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            这条链路不存在
          </h1>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-white/45">
            你跳进了一段没人写代码的扇区。回主控台，从能跑的关卡开始。
          </p>
        </div>

        <div className="flex justify-center">
          <Link
            href="/dashboard"
            className="cn-focus-ring inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-200"
          >
            <Home className="h-4 w-4" />
            回主控台
          </Link>
        </div>

        <p className="font-mono text-[10px] text-white/22">
          &quot;走错门没关系，走回去就行。&quot; — Nexus 老炮
        </p>
      </div>
    </main>
  )
}
