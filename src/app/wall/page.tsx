import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Eye, MessageSquareQuote, Play, TerminalSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { LEVEL_MAP } from '@/lib/levels'
import { BrandHeader } from '@/components/layout/logo'
import { SiteFooter } from '@/components/layout/site-footer'
import { getServerLang } from '@/lib/i18n-server'
import { translate } from '@/lib/i18n'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang()
  return lang === 'en'
    ? {
        title: 'Nexus Roast Wall',
        description: 'Public shares from learners who earned a sharp-tongued review from the CodeNexus AI mentor.',
        openGraph: { url: '/wall' },
      }
    : {
        title: 'Nexus 吐槽墙',
        description: '看看别人被 CodeNexus AI 编程导师精准扎心的公开分享。',
        openGraph: { url: '/wall' },
      }
}

type WallItem = {
  id: string
  title: string | null
  language: string | null
  level_id: number | null
  mentor_quote: string | null
  codename: string | null
  created_at: string
  view_count: number | null
  has_graphic: boolean | null
  wall_reaction: string | null
}

export default async function WallPage() {
  const lang = await getServerLang()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shared_snippets')
    .select('id,title,language,level_id,mentor_quote,codename,created_at,view_count,has_graphic,wall_reaction')
    .eq('is_wall_public', true)
    .not('mentor_quote', 'is', null)
    .order('created_at', { ascending: false })
    .limit(48)

  if (error) console.error('[wall] failed to load shares:', error.message)
  const items = (data ?? []) as WallItem[]

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground cn-noise">
      <header className="sticky top-0 z-20 border-b border-cyan-300/12 bg-background/84 backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:px-4">
          <BrandHeader dark />
          <div className="flex items-center gap-2">
            <Link
              href="/play"
              className="cn-focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-hairline px-3 text-sm font-semibold text-ink-soft transition-colors hover:border-cyan-300/28 hover:text-cyan-100"
            >
              <Play className="h-3.5 w-3.5" />
              {translate('试玩', lang)}
            </Link>
            <Link
              href="/register"
              className="cn-focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_22px_color-mix(in_oklab,var(--primary)_22%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 active:scale-[0.98]"
            >
              {translate('加入', lang)}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-3 py-8 sm:px-4 sm:py-10">
        <section className="mb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-cyan-300/45">Nexus Wall</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-4xl">
            {translate('被 AI 编程导师扎心，也算一种通关纪念。', lang)}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/48">
            {translate('这里收录用户主动公开的导师吐槽卡。笑归笑，点进去能看到真实代码和输出结果。', lang)}
          </p>
        </section>

        {error ? (
          <section className="rounded-lg border border-amber-300/18 bg-amber-300/[0.06] p-5">
            <p className="text-sm font-semibold text-amber-100">{translate('吐槽墙暂时打不开。', lang)}</p>
            <p className="mt-2 text-xs leading-relaxed text-amber-100/62">
              {translate('服务出了点小状况，稍后再来看看。', lang)}
            </p>
          </section>
        ) : items.length === 0 ? (
          <section className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.018] p-6 text-center">
            <MessageSquareQuote className="mb-4 h-10 w-10 text-white/18" />
            <p className="text-lg font-semibold text-white/68">{translate('吐槽墙还空着', lang)}</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/36">
              {translate('第一张公开导师卡还没人发。现在去过一关，然后把 Nexus 老炮的嘴毒语录挂上来。', lang)}
            </p>
            <Link
              href="/play"
              className="cn-focus-ring mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_8px_22px_color-mix(in_oklab,var(--primary)_22%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 active:scale-[0.98]"
            >
              {translate('去试玩', lang)}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const level = item.level_id ? LEVEL_MAP.get(item.level_id) : null
              const language = item.language ?? 'Python'
              return (
                <Link
                  key={item.id}
                  href={`/s/${item.id}`}
                  className="cn-focus-ring group flex min-h-[250px] flex-col rounded-lg border border-cyan-300/14 bg-black/62 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/34 hover:bg-cyan-300/[0.035] hover:shadow-[0_18px_70px_rgba(34,211,238,0.09)]"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 rounded border border-cyan-300/14 bg-cyan-300/[0.055] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-100/65">
                      <MessageSquareQuote className="h-3 w-3" />
                      Nexus
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-white/24">
                      <Eye className="h-3 w-3" />
                      {(item.view_count ?? 0).toLocaleString('zh-CN')}
                    </span>
                  </div>

                  <blockquote className="flex-1 text-lg font-semibold leading-relaxed text-white/86">
                    “{item.mentor_quote}”
                  </blockquote>

                  <div className="mt-5 border-t border-white/8 pt-3">
                    <p className="line-clamp-1 text-sm font-semibold text-white/72">
                      {item.title ?? `${language} ${translate('通关片段', lang)}`}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-white/34">
                      <span className="rounded border border-white/8 bg-white/[0.025] px-1.5 py-0.5">{item.codename ?? translate('匿名玩家', lang)}</span>
                      <span className="rounded border border-cyan-300/14 bg-cyan-300/[0.045] px-1.5 py-0.5 text-cyan-100/55">{language}</span>
                      {level && (
                        <span className="rounded border border-white/8 bg-white/[0.025] px-1.5 py-0.5">Lv.{level.id} · {translate(level.badge, lang)}</span>
                      )}
                      {item.has_graphic && (
                        <span className="inline-flex items-center gap-1 rounded border border-emerald-300/14 bg-emerald-300/[0.045] px-1.5 py-0.5 text-emerald-100/55">
                          <TerminalSquare className="h-3 w-3" />
                          {translate('图形输出', lang)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </section>
        )}
      </main>

      <SiteFooter lang={lang} />
    </div>
  )
}
