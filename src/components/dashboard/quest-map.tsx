'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Background,
  Controls,
  Edge,
  Handle,
  Node,
  NodeProps,
  Panel,
  Position,
  ReactFlow,
} from '@xyflow/react'
import {
  ArrowLeft,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  Code2,
  Database,
  FlaskConical,
  Gamepad2,
  Globe2,
  Layers3,
  Lock,
  MousePointer2,
  Search,
  Shield,
  Sparkles,
  TestTube2,
  Wrench,
  Zap,
} from 'lucide-react'
import type { ProgressRow } from '@/app/actions/progress'
import { useCommandSettings, type CommandSettings } from '@/hooks/use-command-settings'
import {
  FOUNDATION_MAP_ID,
  getAllCourseSearchItems,
  getMapLessonCount,
  type CourseMap,
  type CourseNode,
} from '@/lib/course-maps'
import { getLanguageModule, isModuleLevelCompleted, type LearningLanguage } from '@/lib/language-modules'
import { getCourseNodeHook, getCourseProjectPreview } from '@/lib/course-engagement'
import { appleEase, appleSpring, quickFade } from '@/lib/motion'

type QuestStatus = 'completed' | 'available' | 'locked'

type CourseNodeData = {
  courseNode: CourseNode
  map: CourseMap
  status: QuestStatus
  zoom: number
  isSelected: boolean
  isLaunching: boolean
  animations: boolean
}

type CourseFlowNode = Node<CourseNodeData, 'branchCourse'>

const STATUS_STYLES = {
  completed: {
    glow: 'shadow-[0_0_28px_rgba(52,211,153,0.28)]',
    border: 'border-emerald-300/45',
    dot: 'bg-emerald-300',
    text: 'text-emerald-200',
    label: 'CLEAR',
  },
  available: {
    glow: 'shadow-[0_0_34px_rgba(103,232,249,0.36)]',
    border: 'border-cyan-300/65',
    dot: 'bg-cyan-200',
    text: 'text-cyan-100',
    label: 'LIVE',
  },
  locked: {
    glow: '',
    border: 'border-white/12',
    dot: 'bg-white/22',
    text: 'text-white/28',
    label: 'LOCK',
  },
} satisfies Record<QuestStatus, {
  glow: string
  border: string
  dot: string
  text: string
  label: string
}>

const ACCENT_EDGE = {
  cyan: 'rgba(103,232,249,0.48)',
  emerald: 'rgba(110,231,183,0.48)',
  violet: 'rgba(196,181,253,0.48)',
  amber: 'rgba(252,211,77,0.48)',
  rose: 'rgba(251,113,133,0.48)',
} satisfies Record<CourseMap['accent'], string>

const ACCENT_FILL = {
  cyan: 'rgba(103,232,249,0.12)',
  emerald: 'rgba(110,231,183,0.12)',
  violet: 'rgba(196,181,253,0.12)',
  amber: 'rgba(252,211,77,0.12)',
  rose: 'rgba(251,113,133,0.12)',
} satisfies Record<CourseMap['accent'], string>

const BRANCH_ICONS = {
  foundation: Code2,
  automation: Wrench,
  'web-api': Globe2,
  'data-analysis': Database,
  'ai-ml': Bot,
  'data-engineering': Layers3,
  'testing-devops': TestTube2,
  scientific: FlaskConical,
  'apps-iot': Sparkles,
  pygame: Gamepad2,
  'computer-vision': BookOpen,
  'security-network': Shield,
  'finance-business': BriefcaseBusiness,
} as const

function BranchIcon({ map }: { map: CourseMap }) {
  const Icon = BRANCH_ICONS[map.id as keyof typeof BRANCH_ICONS] ?? Layers3
  return <Icon className="h-4 w-4" />
}

function isLevelCompleted(levelId: number, progress: ProgressRow[], language: LearningLanguage) {
  return isModuleLevelCompleted(language, levelId, progress)
}

function getFoundationStatus(levelId: number, progress: ProgressRow[], language: LearningLanguage): QuestStatus {
  if (isLevelCompleted(levelId, progress, language)) return 'completed'
  const prevCompleted = levelId === 1 || isLevelCompleted(levelId - 1, progress, language)
  return prevCompleted ? 'available' : 'locked'
}

function getCourseStatus(node: CourseNode, map: CourseMap, progress: ProgressRow[], foundationComplete: boolean, language: LearningLanguage): QuestStatus {
  if (node.levelId) return getFoundationStatus(node.levelId, progress, language)
  if (node.unlockAfterLevel) {
    return isLevelCompleted(node.unlockAfterLevel, progress, language) ? 'available' : 'locked'
  }
  return map.id === FOUNDATION_MAP_ID || foundationComplete ? 'available' : 'locked'
}

function courseNodePosition(index: number, total: number, mapId: string) {
  if (mapId === FOUNDATION_MAP_ID) {
    const ring = Math.floor(index / 5)
    const step = index % 5
    const angle = (step / 5) * Math.PI * 2 + ring * 0.62 - Math.PI / 2
    const radius = 150 + ring * 118
    return {
      x: Math.round(560 + Math.cos(angle) * radius),
      y: Math.round(380 + Math.sin(angle) * radius + ring * 34),
    }
  }

  const indexOffset = index - (total - 1) / 2
  const curve = Math.sin((index / Math.max(total - 1, 1)) * Math.PI) * -96
  return {
    x: Math.round(120 + index * 220),
    y: Math.round(360 + curve + (indexOffset % 2 === 0 ? 22 : -22)),
  }
}

function BranchCourseNode({ data }: NodeProps<CourseFlowNode>) {
  const compact = data.zoom < 0.62
  const styles = STATUS_STYLES[data.status]
  const activePulse = data.animations && data.status === 'available' && !data.isLaunching
  const nodeLabel = data.courseNode.levelId
    ? `LV.${String(data.courseNode.levelId).padStart(2, '0')}`
    : `${data.courseNode.lessonCount} 题`
  const statusLabel = data.isLaunching
    ? 'LINK'
    : data.courseNode.levelId
    ? styles.label
    : data.status === 'locked'
    ? 'LOCK'
    : 'ROAD'

  const compactNode = (
    <motion.div
      className={`relative h-5 w-5 rounded-full border ${styles.border} ${styles.dot} ${styles.glow}`}
      title={`${data.map.shortTitle} · ${data.courseNode.title}`}
      animate={data.isLaunching ? { scale: [1, 1.55, 1.18], opacity: [1, 0.86, 1] } : activePulse ? { scale: [1, 1.12, 1] } : { scale: 1 }}
      transition={data.animations ? data.isLaunching ? { duration: 0.48, ease: appleEase } : { repeat: Infinity, duration: 2.8, ease: appleEase } : quickFade}
    >
      {data.isSelected && <span className="absolute inset-[-7px] rounded-full border border-cyan-200/55" />}
      {data.isLaunching && (
        <motion.span
          className="absolute inset-[-10px] rounded-full border border-cyan-200/50"
          initial={{ scale: 0.6, opacity: 0.7 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.56, ease: appleEase }}
        />
      )}
    </motion.div>
  )

  const card = (
    <motion.div
      className={`relative w-[188px] overflow-hidden rounded-lg border ${styles.border} ${styles.glow} bg-black/86 px-3 py-2.5 backdrop-blur-md transition-colors ${
        data.isSelected ? 'ring-1 ring-cyan-200/45' : ''
      }`}
      style={{ boxShadow: data.status !== 'locked' ? `0 22px 60px ${ACCENT_FILL[data.map.accent]}` : undefined }}
      animate={data.isLaunching ? { y: -3, scale: 1.025, borderColor: 'rgba(103,232,249,0.9)' } : { y: 0, scale: 1 }}
      whileHover={data.status !== 'locked' ? { y: -2, scale: 1.015 } : undefined}
      whileTap={data.status !== 'locked' ? { scale: 0.985 } : undefined}
      transition={data.animations ? appleSpring : quickFade}
    >
      <div className="absolute left-0 top-0 h-full w-0.5" style={{ backgroundColor: ACCENT_EDGE[data.map.accent] }} />
      {data.isLaunching && (
        <motion.div
          className="pointer-events-none absolute inset-0 bg-cyan-300/12"
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: '100%', opacity: 1 }}
          transition={{ duration: 0.55, ease: appleEase }}
        />
      )}
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className={`font-mono text-[10px] tracking-[0.18em] ${styles.text}`}>{nodeLabel}</span>
        <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] ${styles.border} ${styles.text}`}>
          {statusLabel}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border border-white/8 bg-white/[0.035] text-white/42">
          <BranchIcon map={data.map} />
        </span>
        <p className="truncate text-sm font-semibold text-white/88">{data.courseNode.title}</p>
      </div>
      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-white/38">{data.courseNode.objective}</p>
      <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
        <span className={styles.text}>{data.courseNode.difficulty}</span>
        <span className="text-white/28">{data.courseNode.lessonCount} 题</span>
      </div>
    </motion.div>
  )

  return (
    <>
      <Handle type="target" position={Position.Left} className="opacity-0" isConnectable={false} />
      <div className={data.status === 'locked' ? 'cursor-not-allowed' : 'cursor-pointer'}>
        {compact ? compactNode : card}
      </div>
      <Handle type="source" position={Position.Right} className="opacity-0" isConnectable={false} />
    </>
  )
}

const nodeTypes = { branchCourse: BranchCourseNode }

export function QuestMap({
  progress,
  activeLanguageId = 'python',
  initialSettings,
  demoMode = false,
  showLanguageBack = false,
}: {
  progress: ProgressRow[]
  activeLanguageId?: string
  initialSettings?: Partial<CommandSettings> | null
  demoMode?: boolean
  showLanguageBack?: boolean
}) {
  const router = useRouter()
  const { settings, updateSettings } = useCommandSettings(initialSettings)
  const language = useMemo(() => getLanguageModule(activeLanguageId), [activeLanguageId])
  const courseMaps = language.courseMaps
  const levels = language.levels
  const [activeMapIndex, setActiveMapIndex] = useState(0)
  const [zoom, setZoom] = useState(0.78)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [launchingId, setLaunchingId] = useState<string | null>(null)
  const [launchLabel, setLaunchLabel] = useState<string | null>(null)
  const launchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentMap = courseMaps[activeMapIndex] ?? courseMaps[0]
  const completedFoundationCount = levels.filter((level) => isLevelCompleted(level.id, progress, language)).length
  const foundationComplete = demoMode || completedFoundationCount === levels.length
  const totalLessonCount = courseMaps.reduce((sum, map) => sum + getMapLessonCount(map), 0)
  const currentLessonCount = getMapLessonCount(currentMap)
  const selectedNode = currentMap.nodes.find((node) => node.id === selectedNodeId) ?? null
  const selectedNodeHook = selectedNode ? getCourseNodeHook(language.name, selectedNode) : null
  const selectedNodeProject = selectedNode ? getCourseProjectPreview(language.name, selectedNode) : null

  const searchItems = useMemo(() => getAllCourseSearchItems(courseMaps), [courseMaps])
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return []
    return searchItems
      .filter((item) => item.haystack.includes(query))
      .slice(0, 8)
  }, [searchItems, searchQuery])

  useEffect(() => () => {
    if (launchTimerRef.current) clearTimeout(launchTimerRef.current)
  }, [])

  function selectBranch(index: number, nodeId?: string) {
    setActiveMapIndex(index)
    setSelectedNodeId(nodeId ?? null)
    setLaunchLabel(null)
    setLaunchingId(null)
  }

  const nodes = useMemo<CourseFlowNode[]>(() => currentMap.nodes.map((courseNode, index) => {
    const status = getCourseStatus(courseNode, currentMap, progress, foundationComplete, language)
    const effectiveStatus = demoMode && status === 'locked' ? 'available' : status
    return {
      id: courseNode.id,
      type: 'branchCourse',
      position: courseNodePosition(index, currentMap.nodes.length, currentMap.id),
      data: {
        courseNode,
        map: currentMap,
        status: effectiveStatus,
        zoom,
        isSelected: selectedNodeId === courseNode.id,
        isLaunching: launchingId === courseNode.id,
        animations: settings.mapAnimations,
      },
      draggable: false,
    }
  }), [currentMap, progress, foundationComplete, language, zoom, selectedNodeId, launchingId, settings.mapAnimations, demoMode])

  const edges = useMemo<Edge[]>(() => currentMap.nodes.slice(0, -1).map((courseNode, index) => {
    const next = currentMap.nodes[index + 1]
    const status = demoMode ? 'available' : getCourseStatus(next, currentMap, progress, foundationComplete, language)
    const active = status !== 'locked'
    return {
      id: `${courseNode.id}-${next.id}`,
      source: courseNode.id,
      target: next.id,
      type: 'smoothstep',
      animated: active && zoom > 0.58 && settings.mapAnimations,
      style: {
        stroke: active ? ACCENT_EDGE[currentMap.accent] : 'rgba(255,255,255,0.10)',
        strokeWidth: active ? 1.2 : 0.8,
      },
    }
  }), [currentMap, progress, foundationComplete, language, zoom, settings.mapAnimations, demoMode])

  return (
    <section id="course-branches" className="overflow-hidden rounded-lg border border-cyan-300/14 bg-black shadow-[0_24px_100px_rgba(0,0,0,0.28)]">
      <div className="border-b border-cyan-300/10 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start">
            {showLanguageBack && (
              <button
                type="button"
                onClick={() => updateSettings({ courseViewMode: 'picker' })}
                className="cn-focus-ring inline-flex h-9 flex-shrink-0 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.025] px-3 text-xs font-semibold text-cyan-100/72 transition-colors hover:border-cyan-300/35 hover:bg-cyan-300/10 hover:text-cyan-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                选择语言
              </button>
            )}
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300/40">{language.domainLabel}</p>
              <h2 className="mt-1 text-lg font-semibold text-white">{language.name} 领域分支</h2>
              <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-white/34">
                先选择一个领域分支，再进入该分支课程路线。基础也是一个独立分支，先把 {language.name} 的入口打稳，后面再开专业路线。
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cyan-200/40" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索全部课程"
                className="cn-focus-ring h-9 w-full rounded-lg border border-white/10 bg-white/[0.035] pl-9 pr-3 text-xs text-white outline-none transition-colors placeholder:text-white/22 focus:border-cyan-300/45 sm:w-72"
            />
            {searchResults.length > 0 && (
              <div className="cn-scrollbar absolute right-0 top-10 z-20 max-h-80 w-[min(380px,calc(100vw-48px))] overflow-y-auto rounded-lg border border-cyan-300/18 bg-black/95 shadow-2xl shadow-black/60 backdrop-blur-xl">
                {searchResults.map((item) => (
                  <button
                    key={`${item.map.id}-${item.node.id}`}
                    type="button"
                    onClick={() => {
                      selectBranch(item.mapIndex, item.node.id)
                      setSearchQuery('')
                    }}
                    className="cn-focus-ring block w-full border-b border-white/6 px-3 py-2 text-left transition-colors last:border-0 hover:bg-cyan-300/8"
                  >
                    <span className="block text-xs font-semibold text-white/78">{item.node.title}</span>
                    <span className="mt-0.5 block text-[10px] text-cyan-200/45">{item.map.shortTitle} · {item.node.difficulty} · {item.node.lessonCount} 题</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {courseMaps.map((map, index) => {
            const isActive = index === activeMapIndex
            const isLocked = !demoMode && map.id !== FOUNDATION_MAP_ID && !foundationComplete
            return (
              <button
                key={map.id}
                type="button"
                onClick={() => selectBranch(index)}
                className={`cn-focus-ring group min-h-[74px] overflow-hidden rounded-lg border px-3 py-2 text-left transition-all duration-300 ${
                  isActive
                    ? 'border-cyan-300/55 bg-cyan-300/12 text-cyan-50 shadow-[0_16px_50px_rgba(34,211,238,0.09)]'
                    : 'border-white/8 bg-white/[0.025] text-white/46 hover:-translate-y-0.5 hover:border-cyan-300/24 hover:text-white/72'
                }`}
                style={{ backgroundImage: isActive ? `linear-gradient(135deg, ${ACCENT_FILL[map.accent]}, rgba(255,255,255,0.018))` : undefined }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex items-center gap-2 text-xs font-semibold">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md border border-white/8 bg-black/28 text-cyan-100/70 transition-colors group-hover:border-cyan-300/22">
                      <BranchIcon map={map} />
                    </span>
                    <span>{map.shortTitle}</span>
                  </span>
                  {isLocked ? <Lock className="mt-1 h-3.5 w-3.5 text-white/28" /> : <span className="mt-1 font-mono text-[10px] text-cyan-200/55">{map.nodes.length}</span>}
                </div>
                <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-white/34">{map.subtitle}</p>
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-white/32">
          <span className="rounded border border-cyan-300/14 bg-cyan-300/5 px-2 py-1 text-cyan-100/70">当前：{currentMap.title}</span>
          <span className="rounded border border-white/8 bg-white/[0.025] px-2 py-1">{currentMap.nodes.length} 个模块</span>
          <span className="rounded border border-white/8 bg-white/[0.025] px-2 py-1">{currentLessonCount} 道训练题</span>
          <span className="rounded border border-white/8 bg-white/[0.025] px-2 py-1">总规划 {totalLessonCount} 道</span>
          <span className="rounded border border-white/8 bg-white/[0.025] px-2 py-1">
            基础{demoMode ? '试玩开放' : `进度 ${completedFoundationCount}/${levels.length}`}
          </span>
        </div>
      </div>

      <div className="relative h-[520px] cn-grid-shell sm:h-[610px] lg:h-[650px]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/6 bg-black/64 px-3 py-2 sm:px-4 sm:py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white/86">{currentMap.title}</p>
            <p className="mt-0.5 line-clamp-1 text-xs text-white/35">{currentMap.description}</p>
          </div>
          <div className="hidden items-center gap-2 text-[10px] text-white/32 sm:flex">
            <span className="rounded border border-white/8 bg-black/36 px-2 py-1">{currentMap.shortTitle}</span>
            <span className="rounded border border-white/8 bg-black/36 px-2 py-1">{currentLessonCount} 题</span>
          </div>
        </div>
        <ReactFlow
          key={currentMap.id}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          minZoom={0.28}
          maxZoom={1.65}
          defaultViewport={{ x: 16, y: 36, zoom: currentMap.id === FOUNDATION_MAP_ID ? 0.78 : 0.72 }}
          onMove={(_, viewport) => setZoom(viewport.zoom)}
          onNodeClick={(_, node) => {
            const courseFlowNode = node as CourseFlowNode
            const status = courseFlowNode.data.status
            const courseNode = courseFlowNode.data.courseNode
            setSelectedNodeId(courseNode.id)
            if (status === 'locked' || launchingId) return
            if (!courseNode.levelId && courseNode.unlockAfterLevel && courseNode.kind === 'project') {
              setLaunchingId(courseNode.id)
              setLaunchLabel(`阶段作品 · ${courseNode.title}`)
              if (launchTimerRef.current) clearTimeout(launchTimerRef.current)
              launchTimerRef.current = setTimeout(() => {
                router.push(demoMode ? `/play?language=${language.route}&project=${courseNode.unlockAfterLevel}` : `/project/${language.route}?after=${courseNode.unlockAfterLevel}`)
              }, settings.mapAnimations ? 620 : 180)
              return
            }
            if (!courseNode.levelId) return
            setLaunchingId(courseNode.id)
            setLaunchLabel(`Lv.${courseNode.levelId} · ${courseNode.title}`)
            if (launchTimerRef.current) clearTimeout(launchTimerRef.current)
            launchTimerRef.current = setTimeout(() => {
              router.push(demoMode ? `/play?language=${language.route}&level=${courseNode.levelId}` : `/learn/${language.route}?level=${courseNode.levelId}`)
            }, settings.mapAnimations ? 620 : 180)
          }}
          panOnDrag
          zoomOnScroll
          zoomOnPinch
          zoomOnDoubleClick={false}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          fitView
          fitViewOptions={{ padding: 0.18, maxZoom: 0.95 }}
          proOptions={{ hideAttribution: true }}
          className="astro-flow bg-transparent"
        >
          <Background color="rgba(103,232,249,0.12)" gap={28} size={0.8} />
          <Controls
            showInteractive={false}
            className="!border !border-cyan-300/18 !bg-black/75 !text-cyan-100"
          />
          <Panel position="bottom-left" className="rounded border border-cyan-300/14 bg-black/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200/45">
            Zoom {Math.round(zoom * 100)}%
          </Panel>
          <Panel position="top-center" className="pointer-events-none">
            <AnimatePresence>
              {launchLabel && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={settings.mapAnimations ? appleSpring : quickFade}
                  className="rounded-full border border-cyan-300/25 bg-black/78 px-4 py-2 text-xs font-medium text-cyan-100 shadow-[0_16px_60px_rgba(34,211,238,0.18)] backdrop-blur-xl"
                >
                  正在接入 {launchLabel}
                </motion.div>
              )}
            </AnimatePresence>
          </Panel>
          <Panel position="bottom-right" className="max-w-[min(330px,calc(100vw-40px))]">
            <AnimatePresence mode="wait">
              {selectedNode ? (
                <motion.div
                  key={selectedNode.id}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={settings.mapAnimations ? appleSpring : quickFade}
                  className="rounded-lg border border-cyan-300/16 bg-black/86 p-4 text-white shadow-2xl shadow-black/50 backdrop-blur-xl"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {selectedNode.levelId ? <BookOpen className="h-4 w-4 text-cyan-200" /> : <Layers3 className="h-4 w-4 text-cyan-200" />}
                      <p className="text-sm font-semibold">{selectedNode.title}</p>
                    </div>
                    <span className="rounded border border-cyan-300/20 px-1.5 py-0.5 text-[10px] text-cyan-100/70">
                      {selectedNode.difficulty}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-white/44">{selectedNode.objective}</p>
                  {selectedNodeHook && (
                    <div className="mt-3 rounded-lg border border-cyan-300/12 bg-cyan-300/[0.035] px-3 py-2">
                      <p className="mb-1 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-200/50">
                        <Zap className="h-3 w-3" />
                        应用场景
                      </p>
                      <p className="text-[11px] leading-relaxed text-white/42">{selectedNodeHook}</p>
                    </div>
                  )}
                  {selectedNodeProject && (
                    <div className="mt-2 rounded-lg border border-white/8 bg-black/35 px-3 py-2 text-[11px] leading-relaxed text-white/38">
                      {selectedNodeProject}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedNode.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded border border-white/8 bg-white/[0.035] px-2 py-1 text-[10px] text-white/38">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 border-t border-white/8 pt-3 text-[11px] leading-relaxed text-white/35">
                    {selectedNode.levelId ? (
                      !demoMode && getFoundationStatus(selectedNode.levelId, progress, language) === 'locked'
                        ? <span className="inline-flex items-center gap-1.5"><Lock className="h-3 w-3" /> 先清理前置基础节点。</span>
                        : <span className="inline-flex items-center gap-1.5"><MousePointer2 className="h-3 w-3" /> 点击节点会先给反馈，再接入关卡。</span>
                    ) : selectedNode.kind === 'project' ? (
                      foundationComplete || !selectedNode.unlockAfterLevel || isLevelCompleted(selectedNode.unlockAfterLevel, progress, language)
                        ? `阶段作品已解锁：用前 ${selectedNode.unlockAfterLevel ?? levels.length} 关能力做一个能运行、能展示、能复盘的小作品。`
                        : <span className="inline-flex items-center gap-1.5"><Lock className="h-3 w-3" /> 先完成 Lv.{selectedNode.unlockAfterLevel}，再开这个阶段作品。</span>
                    ) : foundationComplete ? (
                      `课程路线已排好：${selectedNode.lessonCount} 道训练题。后续接入训练页时会按这个模块展开。`
                    ) : (
                      <span className="inline-flex items-center gap-1.5"><Lock className="h-3 w-3" /> 先完成基础分支 20 个节点，再开专业分支训练。</span>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="hint"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={quickFade}
                  className="rounded-lg border border-white/8 bg-black/62 px-3 py-2 text-xs text-white/30 backdrop-blur-md"
                >
                  先选分支，再点课程节点看反馈。
                </motion.div>
              )}
            </AnimatePresence>
          </Panel>
        </ReactFlow>
      </div>
    </section>
  )
}
