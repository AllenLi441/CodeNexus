'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  FileCode2,
  Lock,
  PackageCheck,
  Save,
  Share2,
  Sparkles,
} from 'lucide-react'
import { BrandHeader } from '@/components/layout/logo'
import { useTr } from '@/contexts/language-context'
import { getProjectCheckpoint, localizeProjectTitle } from '@/lib/learning-profile'
import { getLanguageModule } from '@/lib/language-modules'
import { buildProjectCardMarkdown, projectCardFileName } from '@/lib/project-card'

type ProjectStudioProps = {
  languageId: string
  codename: string
  afterLevel: number
  demoMode?: boolean
}

type Draft = {
  title: string
  problem: string
  approach: string
  output: string
  reflection: string
  checks: Record<string, boolean>
}

function emptyDraft(projectTitle: string): Draft {
  return {
    title: projectTitle,
    problem: '',
    approach: '',
    output: '',
    reflection: '',
    checks: {},
  }
}

function readDraft(key: string, projectTitle: string): Draft {
  if (typeof window === 'undefined') return emptyDraft(projectTitle)
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? { ...emptyDraft(projectTitle), ...JSON.parse(raw) as Partial<Draft> } : emptyDraft(projectTitle)
  } catch {
    return emptyDraft(projectTitle)
  }
}

function fieldReady(value: string) {
  return value.trim().length >= 18
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('Copy command failed')
}

export function ProjectStudio({ languageId, codename, afterLevel, demoMode = false }: ProjectStudioProps) {
  const tr = useTr()
  const language = useMemo(() => getLanguageModule(languageId), [languageId])
  const project = getProjectCheckpoint(language.name, afterLevel)
  const storageKey = `cn:project:${language.id}:${afterLevel}`
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(project?.title ?? '阶段作品'))
  const [saved, setSaved] = useState(false)
  const [cardActionStatus, setCardActionStatus] = useState<'idle' | 'copied' | 'downloaded' | 'error'>('idle')
  const completedChecks = project ? project.skills.filter((skill) => draft.checks[skill]).length : 0
  const completedTextFields = [draft.problem, draft.approach, draft.output, draft.reflection]
    .filter(fieldReady).length
  const totalRequirements = (project?.skills.length ?? 0) + 4
  const readinessPercent = totalRequirements > 0
    ? Math.round(((completedChecks + completedTextFields) / totalRequirements) * 100)
    : 0
  const cardMarkdown = useMemo(() => buildProjectCardMarkdown({
    title: draft.title || project?.title || '阶段作品',
    codename,
    languageName: language.name,
    stage: project?.stage ?? Math.ceil(afterLevel / 5),
    problem: draft.problem,
    approach: draft.approach,
    output: draft.output,
    reflection: draft.reflection,
    skills: project?.skills ?? [],
  }), [afterLevel, codename, draft, language.name, project])

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) setDraft(readDraft(storageKey, project?.title ?? '阶段作品'))
    })
    return () => { cancelled = true }
  }, [project?.title, storageKey])

  if (!project) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background p-6 text-foreground">
        <div className="cn-panel max-w-md rounded-2xl p-6 text-center">
          <Lock className="mx-auto mb-3 h-8 w-8 text-ink-mute" />
          <h1 className="text-lg font-semibold">{tr('没有这个阶段作品')}</h1>
          <p className="mt-2 text-sm text-ink-mute">{tr('阶段作品只在 Lv.5 / 10 / 15 / 20 后解锁。')}</p>
        </div>
      </div>
    )
  }

  const activeProject = project
  const fieldsReady = [draft.problem, draft.approach, draft.output, draft.reflection].every(fieldReady)
  const ready = completedChecks === activeProject.skills.length && fieldsReady

  function updateDraft(patch: Partial<Draft>) {
    setDraft((current) => {
      const next = { ...current, ...patch }
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next))
        setSaved(true)
        window.setTimeout(() => setSaved(false), 1200)
      } catch {
        // Local project drafts are best-effort.
      }
      return next
    })
  }

  function markCardStatus(status: typeof cardActionStatus) {
    setCardActionStatus(status)
    window.setTimeout(() => setCardActionStatus('idle'), 1600)
  }

  function updateText(field: keyof Omit<Draft, 'checks'>, value: string) {
    updateDraft({ [field]: value } as Partial<Draft>)
  }

  function toggleSkill(skill: string) {
    updateDraft({ checks: { ...draft.checks, [skill]: !draft.checks[skill] } })
  }

  async function handleCopyProjectCard() {
    if (!ready) return
    try {
      await copyText(cardMarkdown)
      markCardStatus('copied')
    } catch {
      markCardStatus('error')
    }
  }

  function handleDownloadProjectCard() {
    if (!ready) return
    const blob = new Blob([cardMarkdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = projectCardFileName(draft.title || activeProject.title, language.name, activeProject.stage)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    markCardStatus('downloaded')
  }

  const backHref = demoMode ? `/play?language=${language.route}` : `/dashboard?language=${language.route}`

  return (
    <div className="min-h-[100dvh] bg-background text-foreground cn-noise">
      <header className="sticky top-0 z-20 border-b border-cyan-300/12 bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={backHref}
              className="cn-focus-ring flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white/35 transition-colors hover:bg-white/[0.05] hover:text-white/70"
              title={tr('返回课程选择')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <BrandHeader dark />
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="hidden text-xs text-cyan-100/55 sm:inline">{tr('已保存草稿')}</span>}
            {demoMode ? (
              <Link
                href="/register?from=play"
                className="cn-focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-[0_8px_22px_color-mix(in_oklab,var(--primary)_22%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 active:scale-[0.98]"
              >
                {tr('保存进度')}
              </Link>
            ) : (
              <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-white/42">
                <Save className="h-3.5 w-3.5" />
                {tr('本地草稿')}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-3 py-5 sm:px-4 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <div className="cn-panel-cyan p-5 sm:p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-cyan-300/45">
              Stage Project · Lv.1-{afterLevel}
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{localizeProjectTitle(activeProject.title, language.name, tr)}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/46">{tr(activeProject.brief)}</p>
              </div>
              <span className="w-fit rounded-lg border border-cyan-300/20 bg-cyan-300/8 px-3 py-1.5 text-xs font-medium text-cyan-100/74">
                {language.name} · {tr('阶段')} {activeProject.stage}
              </span>
            </div>
            <div className="mt-4 rounded-lg border border-emerald-300/15 bg-emerald-300/[0.04] px-3 py-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-100/78">
                <PackageCheck className="h-4 w-4" />
                {tr('交付物')}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-white/42">{tr(activeProject.deliverable)}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextPanel
              title={tr('1. 你要解决什么')}
              value={draft.problem}
              placeholder={tr('例：我想做一个能根据分数输出等级的小工具，不再手动判断。')}
              onChange={(value) => updateText('problem', value)}
            />
            <TextPanel
              title={tr('2. 你的实现思路')}
              value={draft.approach}
              placeholder={tr('例：先准备输入数据，再用条件/循环处理，最后统一输出结果。')}
              onChange={(value) => updateText('approach', value)}
            />
            <TextPanel
              title={tr('3. 最终输出长什么样')}
              value={draft.output}
              placeholder={tr('例：终端打印每个用户的等级，并输出总计数量。')}
              onChange={(value) => updateText('output', value)}
            />
            <TextPanel
              title={tr('4. 你踩过什么坑')}
              value={draft.reflection}
              placeholder={tr('例：我一开始把输出文本写错了，后来先对齐测试目标再改逻辑。')}
              onChange={(value) => updateText('reflection', value)}
            />
          </div>
        </section>

        <aside className="space-y-4">
          <section className="cn-panel p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-white/74">
              <ClipboardCheck className="h-4 w-4 text-cyan-200/70" />
              {tr('能力清单')}
            </p>
            <div className="mt-3 grid gap-2">
              {activeProject.skills.map((skill) => {
                const checked = Boolean(draft.checks[skill])
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`cn-focus-ring flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                      checked
                        ? 'border-emerald-300/30 bg-emerald-300/[0.075] text-emerald-100/78'
                        : 'border-white/8 bg-white/[0.022] text-white/42 hover:border-cyan-300/20 hover:text-white/68'
                    }`}
                  >
                    <span className="text-xs font-medium">{tr(skill)}</span>
                    <CheckCircle2 className={`h-4 w-4 ${checked ? 'text-emerald-300' : 'text-white/18'}`} />
                  </button>
                )
              })}
            </div>
          </section>

          <section className="cn-panel-cyan p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-white/78">
              <FileCode2 className="h-4 w-4 text-cyan-200/70" />
              {tr('作品卡预览')}
            </p>
            <div className="mt-3 rounded-lg border border-white/8 bg-black/34 px-3 py-2">
              <div className="flex items-center justify-between gap-3 text-[11px] text-white/38">
                <span>{tr('完成度')}</span>
                <span className="font-mono text-cyan-100/58">{readinessPercent}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/8">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${readinessPercent}%` }}
                />
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-white/8 bg-black/42 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-300/45">CodeNexus Project</p>
              <h2 className="mt-2 text-lg font-semibold text-white">{draft.title || localizeProjectTitle(activeProject.title, language.name, tr)}</h2>
              <p className="mt-1 text-xs text-white/36">by {codename}</p>
              <div className="mt-4 space-y-2 text-xs leading-relaxed text-white/42">
                <p><span className="text-cyan-100/65">{tr('问题：')}</span>{draft.problem || tr('还没写。')}</p>
                <p><span className="text-cyan-100/65">{tr('方案：')}</span>{draft.approach || tr('还没写。')}</p>
                <p><span className="text-cyan-100/65">{tr('输出：')}</span>{draft.output || tr('还没写。')}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {activeProject.skills.map((skill) => (
                  <span key={skill} className="rounded border border-cyan-300/12 bg-cyan-300/[0.04] px-2 py-1 text-[10px] text-cyan-100/58">
                    {tr(skill)}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!ready}
                onClick={handleCopyProjectCard}
                className="cn-focus-ring flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_22px_color-mix(in_oklab,var(--primary)_22%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0 disabled:shadow-none"
              >
                {ready ? <Copy className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                {ready ? tr('复制') : tr('待完成')}
              </button>
              <button
                type="button"
                disabled={!ready}
                onClick={handleDownloadProjectCard}
                className="cn-focus-ring flex h-11 items-center justify-center gap-2 rounded-lg border border-primary/25 bg-primary/[0.08] px-3 text-sm font-semibold text-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/[0.13] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
              >
                {ready ? <Download className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                {tr('导出')}
              </button>
            </div>
            {cardActionStatus !== 'idle' && (
              <p className={`mt-2 text-[11px] ${cardActionStatus === 'error' ? 'text-rose-200/70' : 'text-emerald-200/70'}`}>
                {cardActionStatus === 'copied' && tr('作品卡 Markdown 已复制')}
                {cardActionStatus === 'downloaded' && tr('作品卡 Markdown 已下载')}
                {cardActionStatus === 'error' && tr('浏览器拒绝复制，可以改用导出')}
              </p>
            )}
            <p className="mt-2 text-[11px] leading-relaxed text-white/30">
              {tr('本地作品卡现在可以复制或下载。下一步可以接 Supabase，生成公开作品 URL。')}
            </p>
          </section>
        </aside>
      </main>
    </div>
  )
}

function TextPanel({
  title,
  value,
  placeholder,
  onChange,
}: {
  title: string
  value: string
  placeholder: string
  onChange: (value: string) => void
}) {
  return (
    <section className="rounded-lg border border-white/8 bg-white/[0.025] p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white/74">{title}</p>
        <span className={`font-mono text-[10px] ${fieldReady(value) ? 'text-emerald-300/70' : 'text-white/24'}`}>
          {value.trim().length}/18
        </span>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="cn-focus-ring min-h-32 w-full resize-y rounded-lg border border-white/10 bg-black/38 px-3 py-2 text-sm leading-relaxed text-white outline-none placeholder:text-white/22 focus:border-cyan-300/42"
      />
    </section>
  )
}
