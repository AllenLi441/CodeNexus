export type ProjectCardInput = {
  title: string
  codename: string
  languageName: string
  stage: number
  problem: string
  approach: string
  output: string
  reflection: string
  skills: string[]
}

function line(value: string, fallback: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

function slugPart(value: string) {
  const normalized = value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return normalized || 'project-card'
}

export function buildProjectCardMarkdown({
  title,
  codename,
  languageName,
  stage,
  problem,
  approach,
  output,
  reflection,
  skills,
}: ProjectCardInput, lang: 'zh' | 'en' = 'zh') {
  const en = lang === 'en'
  const empty = en ? 'Not filled in yet.' : '还没有填写。'
  const checklist = skills.length > 0
    ? skills.map((skill) => `- [x] ${skill}`).join('\n')
    : en ? '- [ ] No skills listed yet' : '- [ ] 还没有能力清单'

  return [
    `# ${line(title, en ? 'CodeNexus stage project' : 'CodeNexus 阶段作品')}`,
    `> CodeNexus ${languageName} ${en ? `Stage ${stage}` : `阶段 ${stage}`} · ${line(codename, en ? 'Anonymous learner' : '匿名学习者')}`,
    en ? '## Problem solved' : '## 解决的问题',
    line(problem, empty),
    en ? '## Approach' : '## 实现思路',
    line(approach, empty),
    en ? '## Final output' : '## 最终输出',
    line(output, empty),
    en ? '## Retrospective' : '## 复盘',
    line(reflection, empty),
    en ? '## Skills checklist' : '## 能力清单',
    checklist,
  ].join('\n\n') + '\n'
}

export function projectCardFileName(title: string, languageName: string, stage: number) {
  return `${slugPart(title)}-${slugPart(languageName)}-stage-${stage}.md`
}
