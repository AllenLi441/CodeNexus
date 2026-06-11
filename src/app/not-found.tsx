import Link from 'next/link'
import { Compass, Home } from 'lucide-react'
import { getServerLang } from '@/lib/i18n-server'
import { translate } from '@/lib/i18n'

export default async function NotFound() {
  const lang = await getServerLang()
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/22 bg-primary/8 text-primary">
          <Compass className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/45">
            Sector 404 · No Signal
          </p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight">
            {translate('这条链路不存在', lang)}
          </h1>
          <p className="mx-auto max-w-sm text-pretty text-sm leading-relaxed text-ink-mute">
            {translate('你跳进了一段没人写代码的扇区。回主控台，从能跑的关卡开始。', lang)}
          </p>
        </div>

        <div className="flex justify-center">
          <Link
            href="/"
            className="cn-focus-ring inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 active:scale-[0.98]"
          >
            <Home className="h-4 w-4" />
            {translate('回主控台', lang)}
          </Link>
        </div>

        <p className="font-mono text-[10px] text-ink-mute">
          &quot;{translate('走错门没关系，走回去就行。', lang)}&quot; — {translate('Nexus 老炮', lang)}
        </p>
      </div>
    </main>
  )
}
