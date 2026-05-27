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
}: ProjectCardInput) {
  const checklist = skills.length > 0
    ? skills.map((skill) => `- [x] ${skill}`).join('\n')
    : '- [ ] 还没有能力清单'

  return [
    `# ${line(title, 'CodeNexus 阶段作品')}`,
    `> CodeNexus ${languageName} 阶段 ${stage} · ${line(codename, '匿名学习者')}`,
    '## 解决的问题',
    line(problem, '还没有填写。'),
    '## 实现思路',
    line(approach, '还没有填写。'),
    '## 最终输出',
    line(output, '还没有填写。'),
    '## 复盘',
    line(reflection, '还没有填写。'),
    '## 能力清单',
    checklist,
  ].join('\n\n') + '\n'
}

export function projectCardFileName(title: string, languageName: string, stage: number) {
  return `${slugPart(title)}-${slugPart(languageName)}-stage-${stage}.md`
}
