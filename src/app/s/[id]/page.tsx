import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Eye, MessageSquareQuote, Play } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { LEVEL_MAP } from '@/lib/levels'
import { BrandHeader } from '@/components/layout/logo'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('shared_snippets')
    .select('title, level_id, code, language, mentor_quote, codename')
    .eq('id', id)
    .single()

  const title = data?.title ?? `CodeNexus 代码片段 #${id}`
  const language = data?.language ?? 'Python'
  const level = data?.level_id ? LEVEL_MAP.get(data.level_id) : null
  const quote = typeof data?.mentor_quote === 'string' ? data.mentor_quote : null
  const desc = level
    ? quote ?? `${level.badge} · ${level.title} — 在 CodeNexus 查看这段 ${language} 代码`
    : quote ?? `在 CodeNexus 查看这段 ${language} 代码`

  return {
    title: `${title} — CodeNexus`,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: [{ url: `/s/${id}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description: desc },
  }
}

export default async function SnippetPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: snippet } = await supabase
    .from('shared_snippets')
    .select('*')
    .eq('id', id)
    .single()

  if (!snippet) notFound()

  // Increment view count in background
  supabase.rpc('increment_snippet_views', { p_id: id }).then(() => {})

  const level = snippet.level_id ? LEVEL_MAP.get(snippet.level_id) : null
  const language = typeof snippet.language === 'string' ? snippet.language : 'Python'
  const codeLines = snippet.code.split('\n')
  const displayLines = codeLines.slice(0, 40)
  const truncated = codeLines.length > 40

  return (
    <div className="min-h-[100dvh] bg-background text-foreground cn-noise">
      {/* Topbar */}
      <header className="sticky top-0 z-20 border-b border-cyan-300/12 bg-background/84 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <BrandHeader dark />
          <div className="flex items-center gap-2 text-xs text-white/30">
            <Eye className="h-3.5 w-3.5" />
            <span>{snippet.view_count + 1} 次查看</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
        {/* Meta */}
        <div className="space-y-2">
          {level && (
            <div className="flex items-center gap-2">
              <span className="text-lg">{level.icon}</span>
              <span className="rounded border border-cyan-300/22 bg-cyan-300/[0.06] px-2 py-0.5 text-xs font-medium text-cyan-100/70">
                Lv.{level.id} · {level.badge}
              </span>
            </div>
          )}
          <h1 className="text-2xl font-bold">
            {snippet.title ?? `${language} 代码片段`}
          </h1>
          <p className="text-white/40 text-sm">
            分享于 {new Date(snippet.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}片段 ID: <code className="font-mono text-cyan-300/70">{id}</code>
          </p>
        </div>

        {snippet.mentor_quote && (
          <section className="rounded-lg border border-cyan-300/18 bg-cyan-300/[0.045] p-5">
            <p className="mb-2 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200/50">
              <MessageSquareQuote className="h-3.5 w-3.5" />
              Nexus Roast
            </p>
            <blockquote className="text-xl font-semibold leading-relaxed text-white/88">
              “{snippet.mentor_quote}”
            </blockquote>
            <p className="mt-3 text-xs text-white/34">
              {snippet.codename ?? '匿名玩家'} 被导师点评后公开了这张通关卡。
            </p>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Code */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30 uppercase tracking-widest">代码</span>
                <span className="text-xs text-cyan-300/55">{language}</span>
            </div>
            <div className="rounded-xl overflow-hidden border border-white/8 bg-[#0a0a12]">
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/5 bg-[#0d0d18]">
                <span className="w-3 h-3 rounded-full bg-[#ff5f56]"/>
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e]"/>
                <span className="w-3 h-3 rounded-full bg-[#27c93f]"/>
                <span className="ml-2 text-xs text-white/25 font-mono">snippet</span>
              </div>
              <pre className="p-5 font-mono text-sm text-cyan-50/78 leading-relaxed overflow-x-auto whitespace-pre">
                {displayLines.join('\n')}
                {truncated && (
                  <span className="text-white/25">{'\n'}... ({codeLines.length - 40} 行已省略)</span>
                )}
              </pre>
            </div>
          </div>

          {/* Output */}
          <div className="space-y-3">
            {(snippet.output_text || snippet.output_image) && (
              <>
                <span className="text-xs text-white/30 uppercase tracking-widest">运行输出</span>
                <div className="rounded-xl overflow-hidden border border-white/8 bg-[#08080f]">
                  <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/5 bg-[#0d0d18]">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f56]"/>
                    <span className="w-3 h-3 rounded-full bg-[#ffbd2e]"/>
                    <span className="w-3 h-3 rounded-full bg-[#27c93f]"/>
                    <span className="ml-2 text-xs text-white/25 font-mono">Output</span>
                  </div>
                  <div className="p-4">
                    {snippet.output_image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`data:image/png;base64,${snippet.output_image}`}
                        alt="Code output"
                        className="max-w-full rounded-lg"
                      />
                    )}
                    {snippet.output_text && (
                      <pre className="font-mono text-sm text-[#a3e635] leading-relaxed whitespace-pre-wrap break-words">
                        {snippet.output_text}
                      </pre>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* CTA */}
            <div className="rounded-lg border border-cyan-300/18 bg-cyan-300/[0.055] p-5 space-y-3 text-center">
              <p className="text-sm font-semibold text-white">想自己被导师扎一下？</p>
              <p className="text-xs text-white/50">先免登录试玩，跑通第一课再决定要不要保存进度。</p>
              <Link
                href="/play"
                className="cn-focus-ring flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground shadow-[0_8px_22px_color-mix(in_oklab,var(--primary)_22%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 active:scale-[0.98]"
              >
                <Play className="h-3.5 w-3.5" />
                免费试玩
              </Link>
              <Link
                href="/wall"
                className="cn-focus-ring flex w-full items-center justify-center gap-2 rounded-lg border border-hairline py-2.5 text-center text-sm font-semibold text-ink-soft transition-colors hover:border-cyan-300/28 hover:text-cyan-100"
              >
                看吐槽墙
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
