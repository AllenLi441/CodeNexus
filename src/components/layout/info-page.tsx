import Link from 'next/link'
import { BrandHeader } from '@/components/layout/logo'
import { SiteFooter } from '@/components/layout/site-footer'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { translate, type Lang } from '@/lib/i18n'

// Shared shell for the static info pages (/about, /terms, /privacy).
export function InfoPage({
  lang,
  title,
  updated,
  children,
}: {
  lang: Lang
  title: string
  updated?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground cn-noise">
      <header className="border-b border-white/8 bg-background/84 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <Link href="/" className="cn-focus-ring rounded-lg">
            <BrandHeader dark />
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link href="/" className="cn-focus-ring text-xs text-ink-mute transition-colors hover:text-foreground">
              {translate('返回首页', lang)}
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="text-balance text-3xl font-semibold tracking-tight">{title}</h1>
        {updated && <p className="mt-2 font-mono text-xs text-ink-mute">{updated}</p>}
        <div className="mt-8 space-y-8">{children}</div>
      </main>
      <SiteFooter lang={lang} />
    </div>
  )
}

export function InfoSection({ heading, paragraphs }: { heading: string; paragraphs: string[] }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
      <div className="mt-3 space-y-3">
        {paragraphs.map((p) => (
          <p key={p} className="text-pretty text-sm leading-7 text-ink-soft">
            {p}
          </p>
        ))}
      </div>
    </section>
  )
}
