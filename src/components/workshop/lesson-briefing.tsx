'use client'

import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Code2,
  Compass,
  FileText,
  FlaskConical,
  ListChecks,
  MessageSquare,
  Sparkles,
  TerminalSquare,
} from 'lucide-react'
import type { Level, LessonSection } from '@/lib/levels'
import { useTr } from '@/contexts/language-context'
import { getLevelMission, getLevelTeachingBlueprint } from '@/lib/course-engagement'
import { appleEase, appleSpring, quickFade } from '@/lib/motion'
import { MarkdownMessage } from './markdown-message'

type LessonBriefingProps = {
  level: Level
  languageName: string
  codename: string
  onStart: () => void
}

function CodeSample({ section, languageName, tr }: { section: LessonSection; languageName: string; tr: (zh: string) => string }) {
  if (!section.codeBlock) return null
  const fence = languageName === 'JavaScript'
    ? 'javascript'
    : languageName === 'C++'
    ? 'cpp'
    : languageName === 'C#'
    ? 'csharp'
    : languageName === 'Visual Basic'
    ? 'vbnet'
    : languageName.toLowerCase()

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-cyan-300/12 bg-black/60">
      <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.025] px-3 py-2">
        <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-200/55">
          <Code2 className="h-3.5 w-3.5" />
          {tr(section.codeBlock.caption ?? '参考结构')}
        </span>
        {section.codeBlock.fillable && (
          <span className="rounded border border-cyan-300/18 px-2 py-0.5 text-[10px] text-cyan-100/50">
            {tr('读懂结构，不自动填入')}
          </span>
        )}
      </div>
      <pre className="cn-scrollbar overflow-x-auto p-4 font-mono text-xs leading-relaxed text-cyan-50/80">
        <code className={`language-${fence}`}>{section.codeBlock.code}</code>
      </pre>
    </div>
  )
}

function ArticleSection({
  section,
  index,
  languageName,
  level,
  tr,
}: {
  section: LessonSection
  index: number
  languageName: string
  level: Level
  tr: (zh: string) => string
}) {
  // Auto-generated sections interpolate the objective/tests, so their stored
  // bodies can never match EN_MAP — rebuild them from translatable parts.
  const body = section.auto === 'breakdown'
    ? `${tr('先把目标压成一句话：')}${tr(level.objective)}${tr('。')}\n\n${tr('再把代码拆成三段：入口在哪里、数据在哪里、结果怎么交出去。每次只写能证明目标的一小段，跑通后再补结构。')}`
    : section.auto === 'checklist'
    ? level.tests.map((test, i) => `${i + 1}. ${tr(test.description)}`).join('\n')
    : tr(section.body)
  return (
    <section id={`chapter-${index + 1}`} className="scroll-mt-24 border-t border-white/8 py-7 first:border-t-0 first:pt-0">
      <div className="mb-3 flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/[0.07] font-mono text-[11px] text-cyan-100">
          {index + 1}
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-white">{tr(section.heading)}</h2>
          <p className="mt-1 text-xs text-white/28">{tr('这一段先读懂，再去写代码。')}</p>
        </div>
      </div>

      <div className="text-sm leading-7 text-white/62">
        <MarkdownMessage text={body} />
      </div>

      <CodeSample section={section} languageName={languageName} tr={tr} />

      {section.tip && (
        <div className="mt-4 rounded-lg border border-emerald-300/14 bg-emerald-300/[0.045] px-4 py-3 text-xs leading-relaxed text-emerald-50/62">
          <span className="font-semibold text-emerald-100/86">{tr('提示：')}</span>{tr(section.tip)}
        </div>
      )}

      {section.warning && (
        <div className="mt-4 rounded-lg border border-red-300/14 bg-red-300/[0.045] px-4 py-3 text-xs leading-relaxed text-red-50/62">
          <span className="font-semibold text-red-100/86">{tr('小心：')}</span>{tr(section.warning)}
        </div>
      )}
    </section>
  )
}

function MentorAside({ codename, line, tr }: { codename: string; line: string; tr: (zh: string) => string }) {
  return (
    <div className="rounded-lg border border-cyan-300/14 bg-cyan-300/[0.04] p-4">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-cyan-200/70" />
        <p className="text-sm font-semibold text-white/75">{tr('小助手旁白')}</p>
      </div>
      <p className="text-xs leading-relaxed text-white/50">
        {codename}，{line}
      </p>
    </div>
  )
}

export function LessonBriefing({ level, languageName, codename, onStart }: LessonBriefingProps) {
  const tr = useTr()
  const mission = getLevelMission(languageName, level, tr)
  const teaching = getLevelTeachingBlueprint(languageName, level, tr)

  return (
    <div className="cn-scrollbar h-full w-full max-w-full overflow-x-hidden overflow-y-auto bg-[#020408]">
      <div className="mx-auto box-border w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={appleSpring}
          className="mb-6 rounded-lg border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(8,18,26,0.92),rgba(0,0,0,0.72))] p-5 shadow-[0_24px_100px_rgba(0,0,0,0.4)] sm:p-7"
        >
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/45">{mission.kicker}</p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-4xl">
                Lv.{level.id} {tr(level.title)}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">{tr(level.objective)}</p>
            </div>
            <span className="w-fit rounded-lg border border-cyan-300/20 bg-cyan-300/8 px-3 py-1.5 text-xs font-medium text-cyan-100/76">
              {languageName} · {tr(level.badge)}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-white/8 bg-black/30 p-4">
              <Compass className="mb-3 h-4 w-4 text-cyan-200/70" />
              <p className="text-xs font-semibold text-white/78">{tr('这节课解决什么')}</p>
              <p className="mt-2 text-xs leading-relaxed text-white/42">{mission.brief}</p>
            </div>
            <div className="rounded-lg border border-white/8 bg-black/30 p-4">
              <BrainCircuit className="mb-3 h-4 w-4 text-cyan-200/70" />
              <p className="text-xs font-semibold text-white/78">{tr('先建立脑内模型')}</p>
              <p className="mt-2 text-xs leading-relaxed text-white/42">{teaching.mentalModel}</p>
            </div>
            <div className="rounded-lg border border-white/8 bg-black/30 p-4">
              <TerminalSquare className="mb-3 h-4 w-4 text-cyan-200/70" />
              <p className="text-xs font-semibold text-white/78">{tr('最后要交付什么')}</p>
              <p className="mt-2 text-xs leading-relaxed text-white/42">{mission.payoff}</p>
            </div>
          </div>
        </motion.header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <motion.article
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...quickFade, delay: 0.08 }}
            className="rounded-lg border border-white/8 bg-black/72 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.3)] sm:p-7"
          >
            <section className="mb-7 rounded-lg border border-cyan-300/12 bg-cyan-300/[0.035] p-4">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-cyan-200/70" />
                <p className="text-sm font-semibold text-white/78">{tr('先别打开编辑器')}</p>
              </div>
              <p className="text-sm leading-7 text-white/58">
                {tr('这一页不是让你背概念，而是先把本关的“为什么、怎么写、怎么验证”讲清楚。读完以后编辑器仍然是空的，你要自己把最小代码写出来。')}
              </p>
            </section>

            <section className="mb-7 rounded-lg border border-white/8 bg-white/[0.026] p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-cyan-200/70" />
                <div>
                  <p className="text-sm font-semibold text-white/78">{tr('知识拆解')}</p>
                  <p className="mt-1 text-xs text-white/32">{tr('先把概念、用途和验证方式连起来。')}</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {teaching.walkthrough.map((item) => (
                  <div key={item.title} className="rounded-lg border border-cyan-300/10 bg-black/34 p-4">
                    <p className="text-xs font-semibold text-cyan-50/76">{item.title}</p>
                    <p className="mt-2 text-xs leading-relaxed text-white/46">{item.body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-cyan-300/10 bg-cyan-300/[0.035] px-4 py-3">
                <p className="text-xs font-semibold text-cyan-50/72">{tr('真实用途')}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/46">{teaching.realUse}</p>
              </div>
            </section>

            {level.sections.map((section, index) => (
              <ArticleSection
                key={`${section.heading}-${index}`}
                section={section}
                index={index}
                languageName={languageName}
                level={level}
                tr={tr}
              />
            ))}

            <section className="border-t border-white/8 pt-7">
              <div className="mb-3 flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-cyan-200/70" />
                <h2 className="text-lg font-semibold tracking-tight text-white">{tr('进入平台练习')}</h2>
              </div>
              <p className="text-sm leading-7 text-white/56">{teaching.checkpoint}</p>
              <div className="mt-4 grid gap-2">
                {teaching.practiceSteps.map((step, index) => (
                  <div key={step} className="flex items-start gap-2 rounded-lg border border-white/8 bg-white/[0.025] px-3 py-2 text-xs leading-relaxed text-white/48">
                    <span className="mt-0.5 font-mono text-cyan-200/68">{index + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-2">
                {level.tests.map((test) => (
                  <div key={test.id} className="flex items-start gap-2 rounded-lg border border-cyan-300/10 bg-cyan-300/[0.026] px-3 py-2 text-xs leading-relaxed text-white/48">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-cyan-200/70" />
                    <span>{tr(test.description)}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={onStart}
                className="cn-focus-ring mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 text-sm font-semibold text-black shadow-[0_18px_70px_rgba(34,211,238,0.14)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-200 sm:w-auto"
              >
                {tr('打开空编辑器，开始实践')}
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          </motion.article>

          <motion.aside
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...quickFade, delay: 0.12 }}
            className="space-y-4 lg:sticky lg:top-5 lg:self-start"
          >
            <section className="rounded-lg border border-white/8 bg-white/[0.025] p-4">
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-cyan-200/70" />
                <p className="text-sm font-semibold text-white/74">{tr('本课路线')}</p>
              </div>
              <div className="grid gap-2">
                {level.sections.map((section, index) => (
                  <a
                    key={`${section.heading}-nav`}
                    href={`#chapter-${index + 1}`}
                    className="cn-focus-ring flex items-center gap-2 rounded-lg border border-white/8 bg-black/28 px-3 py-2 text-xs text-white/42 transition-colors hover:border-cyan-300/24 hover:text-cyan-100"
                  >
                    <span className="font-mono text-cyan-200/55">{index + 1}</span>
                    <span className="min-w-0 truncate">{tr(section.heading)}</span>
                  </a>
                ))}
              </div>
            </section>

            <MentorAside
              codename={codename}
              line={`${tr('这一关的核心是')}“${teaching.concept}”${tr('。先把目标说清楚，再写最短代码。别在第一步就把自己绕进框架里。')}`}
              tr={tr}
            />

            <section className="rounded-lg border border-cyan-300/12 bg-cyan-300/[0.035] p-4">
              <div className="mb-3 flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-cyan-200/70" />
                <p className="text-sm font-semibold text-white/74">{tr('动手前检查')}</p>
              </div>
              <div className="grid gap-2">
                {teaching.learnFirst.map((item, index) => (
                  <div key={item} className="flex gap-2 rounded-lg border border-white/8 bg-black/28 px-3 py-2 text-xs leading-relaxed text-white/46">
                    <span className="font-mono text-cyan-200/64">{index + 1}</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-white/8 bg-black/38 p-4">
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-cyan-200/70" />
                <p className="text-sm font-semibold text-white/74">{tr('术语速查')}</p>
              </div>
              <div className="grid gap-2">
                {teaching.vocabulary.map((item) => (
                  <div key={item.term} className="rounded-lg border border-white/8 bg-white/[0.025] px-3 py-2">
                    <p className="font-mono text-[11px] text-cyan-100/70">{item.term}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/38">{item.meaning}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-red-300/12 bg-red-400/[0.035] p-4">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-200/70" />
                <p className="text-sm font-semibold text-white/74">{tr('常见坑')}</p>
              </div>
              <div className="grid gap-2">
                {teaching.pitfalls.map((pitfall) => (
                  <div key={pitfall} className="flex items-start gap-2 text-xs leading-relaxed text-white/45">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-200/55" />
                    <span>{pitfall}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-white/8 bg-black/38 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-200/70" />
                <p className="text-sm font-semibold text-white/74">{tr('加餐')}</p>
              </div>
              <p className="text-xs leading-relaxed text-white/42">{teaching.stretchGoal}</p>
              <motion.div
                className="mt-4 h-px bg-cyan-200/45"
                animate={{ opacity: [0.2, 0.85, 0.2] }}
                transition={{ repeat: Infinity, duration: 2.8, ease: appleEase }}
              />
            </section>

            <section className="rounded-lg border border-white/8 bg-white/[0.025] p-4">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-cyan-200/70" />
                <p className="text-sm font-semibold text-white/74">{tr('读完自测')}</p>
              </div>
              <div className="grid gap-2">
                {teaching.reviewQuestions.map((question, index) => (
                  <p key={question} className="flex gap-2 text-xs leading-relaxed text-white/42">
                    <span className="font-mono text-cyan-200/60">{index + 1}</span>
                    <span>{question}</span>
                  </p>
                ))}
              </div>
            </section>
          </motion.aside>
        </div>
      </div>
    </div>
  )
}
