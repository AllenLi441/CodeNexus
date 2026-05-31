'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, BookOpen, CheckCircle2, Code2, FlaskConical, GitBranch, Lock, Route, Search, Sparkles } from 'lucide-react'
import type { ProgressRow } from '@/app/actions/progress'
import {
  FOUNDATION_MAP_ID,
  getAllCourseSearchItems,
  type CourseMap,
  type CourseNode,
} from '@/lib/course-maps'
import {
  LANGUAGE_MODULES,
  completedModuleLevelIds,
  getLanguageModule,
  isModuleLevelCompleted,
  type LearningLanguage,
} from '@/lib/language-modules'

const ACCENT_CLASSES = {
  cyan: 'border-cyan-300/45 bg-cyan-300/[0.08] text-cyan-100',
  emerald: 'border-emerald-300/40 bg-emerald-300/[0.08] text-emerald-100',
  violet: 'border-violet-300/40 bg-violet-300/[0.08] text-violet-100',
  amber: 'border-amber-300/40 bg-amber-300/[0.08] text-amber-100',
  rose: 'border-rose-300/40 bg-rose-300/[0.08] text-rose-100',
} satisfies Record<CourseMap['accent'], string>

function nodeHref(language: LearningLanguage, node: CourseNode, demoMode: boolean) {
  if (node.levelId) {
    return demoMode
      ? `/play?language=${language.route}&level=${node.levelId}`
      : `/learn/${language.route}?level=${node.levelId}`
  }

  if (node.unlockAfterLevel && node.kind === 'project') {
    return demoMode
      ? `/play?language=${language.route}&project=${node.unlockAfterLevel}`
      : `/project/${language.route}?after=${node.unlockAfterLevel}`
  }

  return null
}

function nodeAvailable({
  node,
  map,
  language,
  progress,
  demoMode,
}: {
  node: CourseNode
  map: CourseMap
  language: LearningLanguage
  progress: ProgressRow[]
  demoMode: boolean
}) {
  if (demoMode) return true
  if (node.unlockAfterLevel) {
    return isModuleLevelCompleted(language, node.unlockAfterLevel, progress)
  }
  if (!node.levelId) {
    const completed = completedModuleLevelIds(language, progress).length
    return map.id === FOUNDATION_MAP_ID || completed === language.levels.length
  }
  if (node.levelId === 1) return true
  return isModuleLevelCompleted(language, node.levelId - 1, progress)
}

function StepHeader({
  index,
  label,
  title,
}: {
  index: number
  label: string
  title: string
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300/38">{label}</p>
        <h3 className="mt-1 text-sm font-semibold text-white">{title}</h3>
      </div>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-300/18 bg-cyan-300/8 font-mono text-xs text-cyan-100">
        {index}
      </span>
    </div>
  )
}

export function CoursePicker({
  progress,
  activeLanguageId = 'python',
  demoMode = false,
}: {
  progress: ProgressRow[]
  activeLanguageId?: string
  demoMode?: boolean
}) {
  const router = useRouter()
  const initialLanguage = getLanguageModule(activeLanguageId)
  const [languageId, setLanguageId] = useState(initialLanguage.id)
  const [mapId, setMapId] = useState<string | null>(FOUNDATION_MAP_ID)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const language = useMemo(() => getLanguageModule(languageId), [languageId])
  const selectedMap = mapId ? language.courseMaps.find((map) => map.id === mapId) ?? null : null
  const selectedNode = selectedMap && selectedNodeId
    ? selectedMap.nodes.find((node) => node.id === selectedNodeId) ?? null
    : null
  const completed = completedModuleLevelIds(language, progress)
  const searchItems = useMemo(() => getAllCourseSearchItems(language.courseMaps), [language.courseMaps])
  const searchResults = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return []
    return searchItems.filter((item) => item.haystack.includes(needle)).slice(0, 6)
  }, [query, searchItems])

  function chooseLanguage(id: LearningLanguage['id']) {
    const nextLanguage = getLanguageModule(id)
    setLanguageId(nextLanguage.id)
    setMapId(FOUNDATION_MAP_ID)
    setSelectedNodeId(null)
    setQuery('')
    router.replace(demoMode ? `/play?language=${nextLanguage.route}` : `/dashboard?language=${nextLanguage.route}`)
  }

  function chooseMap(id: string) {
    setMapId(id)
    setSelectedNodeId(null)
  }

  function chooseNode(node: CourseNode) {
    setSelectedNodeId(node.id)
  }

  return (
    <section className="cn-panel-cyan overflow-hidden p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/45">
            Course Launchpad
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">选择入口</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/42">
            先选语言，再选领域分支，最后进入具体课程。结构保持清晰，学习路径也更容易持续。
          </p>
          {demoMode && (
            <p className="mt-2 rounded-lg border border-amber-300/16 bg-amber-300/[0.06] px-3 py-2 text-xs leading-relaxed text-amber-100/68">
              试玩模式：你可以浏览和进入课程，但不会保存进度；这是未登录状态的真实限制，不是我故意卡你。
            </p>
          )}
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cyan-200/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索所有课程"
            className="cn-focus-ring h-10 w-full rounded-lg border border-white/10 bg-black/36 pl-9 pr-3 text-xs text-white outline-none placeholder:text-white/24 focus:border-cyan-300/45"
          />
          {searchResults.length > 0 && (
            <div className="cn-scrollbar absolute right-0 top-11 z-30 max-h-80 w-full overflow-y-auto rounded-lg border border-cyan-300/18 bg-black/95 shadow-2xl shadow-black/60 backdrop-blur-xl">
              {searchResults.map((item) => (
                <button
                  key={`${item.map.id}-${item.node.id}`}
                  type="button"
                  onClick={() => {
                    setMapId(item.map.id)
                    setSelectedNodeId(item.node.id)
                    setQuery('')
                  }}
                  className="cn-focus-ring block w-full border-b border-white/6 px-3 py-2 text-left transition-colors last:border-0 hover:bg-cyan-300/8"
                >
                  <span className="block text-xs font-semibold text-white/82">{item.node.title}</span>
                  <span className="mt-0.5 block text-[10px] text-cyan-200/48">{item.map.shortTitle} · {item.node.difficulty}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.92fr_1fr_1.15fr]">
        <div className="rounded-lg border border-white/8 bg-black/28 p-3">
          <StepHeader index={1} label="Language" title="选择语言" />
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {LANGUAGE_MODULES.map((item) => {
              const active = item.id === language.id
              const done = completedModuleLevelIds(item, progress).length
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => chooseLanguage(item.id)}
                  className={`cn-focus-ring rounded-lg border px-3 py-3 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                    active
                      ? `${ACCENT_CLASSES[item.accent]} shadow-[0_16px_50px_rgba(34,211,238,0.08)]`
                      : 'border-white/8 bg-white/[0.022] text-white/48 hover:border-cyan-300/22 hover:text-white/78'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold">{item.shortName}</span>
                    <span className="font-mono text-[10px] text-white/38">
                      {demoMode ? '试玩' : `${done}/${item.levels.length}`}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed opacity-70">{item.tagline}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-lg border border-white/8 bg-black/28 p-3">
          <StepHeader index={2} label="Branch" title="选择分支" />
          <div className="grid gap-2">
            {language.courseMaps.map((map) => {
              const active = map.id === selectedMap?.id
              const foundationDone = completed.length === language.levels.length
              const locked = !demoMode && map.id !== FOUNDATION_MAP_ID && !foundationDone
              return (
                <button
                  key={map.id}
                  type="button"
                  onClick={() => chooseMap(map.id)}
                  className={`cn-focus-ring rounded-lg border px-3 py-3 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                    active
                      ? `${ACCENT_CLASSES[map.accent]} shadow-[0_16px_50px_rgba(34,211,238,0.08)]`
                      : 'border-white/8 bg-white/[0.022] text-white/48 hover:border-cyan-300/22 hover:text-white/78'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold">
                      <GitBranch className="h-3.5 w-3.5" />
                      {map.shortTitle}
                    </span>
                    {locked ? <Lock className="h-3.5 w-3.5 text-white/25" /> : <span className="font-mono text-[10px] text-white/38">{map.nodes.length}</span>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed opacity-70">{map.subtitle}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-lg border border-white/8 bg-black/28 p-3">
          <StepHeader index={3} label="Lesson" title="选择课程" />
          {!selectedMap ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.018] px-5 text-center">
              <Route className="mb-3 h-8 w-8 text-white/18" />
              <p className="text-sm font-semibold text-white/50">先选一个分支</p>
              <p className="mt-1 text-xs leading-relaxed text-white/28">选择分支后，这里会显示对应课程和可进入的实践任务。</p>
            </div>
          ) : (
            <div className="grid max-h-[520px] gap-2 overflow-y-auto pr-1 cn-scrollbar">
              {selectedMap.nodes.map((node) => {
                const available = nodeAvailable({ node, map: selectedMap, language, progress, demoMode })
                const href = nodeHref(language, node, demoMode)
                const selected = node.id === selectedNode?.id
                const complete = node.levelId ? isModuleLevelCompleted(language, node.levelId, progress) : false
                const content = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-semibold text-white/82">
                          {node.kind === 'project' || node.kind === 'capstone' ? <FlaskConical className="h-3.5 w-3.5 text-cyan-200/65" /> : <BookOpen className="h-3.5 w-3.5 text-cyan-200/65" />}
                          <span className="truncate">{node.title}</span>
                        </p>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/38">{node.objective}</p>
                      </div>
                      {complete ? (
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-300/75" />
                      ) : !available ? (
                        <Lock className="h-4 w-4 flex-shrink-0 text-white/22" />
                      ) : (
                        <ArrowRight className="h-4 w-4 flex-shrink-0 text-cyan-200/65" />
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded border border-cyan-300/14 bg-cyan-300/5 px-1.5 py-0.5 text-[10px] text-cyan-100/60">{node.difficulty}</span>
                      <span className="rounded border border-white/8 bg-white/[0.025] px-1.5 py-0.5 text-[10px] text-white/35">{node.lessonCount} 课</span>
                      {!href && <span className="rounded border border-amber-300/16 bg-amber-300/[0.055] px-1.5 py-0.5 text-[10px] text-amber-100/56">
                        {node.kind === 'project' ? '阶段作品' : '路线预览'}
                      </span>}
                    </div>
                  </>
                )

                if (href && available) {
                  return (
                    <Link
                      key={node.id}
                      href={href}
                      onMouseEnter={() => chooseNode(node)}
                      className={`cn-focus-ring rounded-lg border px-3 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-300/[0.055] ${
                        selected ? 'border-cyan-300/42 bg-cyan-300/[0.06]' : 'border-white/8 bg-white/[0.022]'
                      }`}
                    >
                      {content}
                    </Link>
                  )
                }

                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => chooseNode(node)}
                    className={`cn-focus-ring rounded-lg border px-3 py-3 text-left transition-all duration-300 ${
                      selected ? 'border-cyan-300/42 bg-cyan-300/[0.06]' : 'border-white/8 bg-white/[0.022]'
                    } ${available ? 'hover:-translate-y-0.5 hover:border-cyan-300/30' : 'opacity-55'}`}
                  >
                    {content}
                  </button>
                )
              })}
            </div>
          )}

          {selectedNode && (
            <div className="mt-3 rounded-lg border border-cyan-300/12 bg-cyan-300/[0.035] p-3">
              <p className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-100/75">
                <Sparkles className="h-3.5 w-3.5" />
                {selectedNode.title}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/40">
                {selectedNode.levelId
                  ? '这是可进入的实践课。点课程卡片会进入教学引导，然后才打开空编辑器。'
                  : selectedNode.kind === 'project'
                  ? '这是阶段作品检查点：点进去写项目说明、能力清单和作品卡，把基础能力组合成一个能展示的小交付。'
                  : '这是领域路线预览节点，训练题内容还没拆成独立实践页。先把基础分支跑通，后面再补这块。'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-white/32">
        <span className="rounded border border-cyan-300/14 bg-cyan-300/5 px-2 py-1 text-cyan-100/70">
          当前语言：{language.name}
        </span>
        <span className="rounded border border-white/8 bg-white/[0.025] px-2 py-1">
          基础 {demoMode ? '试玩' : `${completed.length}/${language.levels.length}`}
        </span>
        <span className="rounded border border-white/8 bg-white/[0.025] px-2 py-1">
          {language.courseMaps.length} 条分支
        </span>
        <span className="rounded border border-white/8 bg-white/[0.025] px-2 py-1">
          <Code2 className="mr-1 inline h-3 w-3" />
          编辑器先空白，教学后实践
        </span>
      </div>
    </section>
  )
}
