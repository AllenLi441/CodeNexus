import Link from 'next/link'
import { CodeNexusLogo } from '@/components/layout/logo'
import { translate, type Lang } from '@/lib/i18n'

// Server-friendly footer: takes the resolved lang instead of using context so
// it renders in Server Component trees (guest dashboard, wall, share page).
export function SiteFooter({ lang }: { lang: Lang }) {
  const t = (zh: string) => translate(zh, lang)
  return (
    <footer className="relative z-10 border-t border-white/8 bg-background/72">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2 text-ink-mute">
          <CodeNexusLogo size={16} className="flex-shrink-0 text-primary/70" />
          <span className="text-xs">© {new Date().getFullYear()} CodeNexus · {t('AI 编程中枢')}</span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-mute">
          <Link href="/about" className="cn-focus-ring transition-colors hover:text-foreground">{t('关于')}</Link>
          <Link href="/terms" className="cn-focus-ring transition-colors hover:text-foreground">{t('服务条款')}</Link>
          <Link href="/privacy" className="cn-focus-ring transition-colors hover:text-foreground">{t('隐私政策')}</Link>
          <a
            href="https://github.com/AllenLi441/CodeNexus"
            target="_blank"
            rel="noreferrer"
            className="cn-focus-ring transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  )
}
