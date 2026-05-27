import { describe, expect, it } from 'vitest'
import { buildProjectCardMarkdown, projectCardFileName } from './project-card'

describe('project-card', () => {
  it('builds a markdown project card with learner fields and skill checklist', () => {
    const markdown = buildProjectCardMarkdown({
      title: '成绩统计器',
      codename: '试玩新人',
      languageName: 'Python',
      stage: 2,
      problem: '统计一组成绩并输出平均值。',
      approach: '使用列表保存成绩，再用 sum 和 len 计算。',
      output: '平均分：86.5',
      reflection: '一开始忘记处理空列表，后来补了判断。',
      skills: ['变量', '列表', '函数'],
    })

    expect(markdown).toContain('# 成绩统计器')
    expect(markdown).toContain('CodeNexus Python 阶段 2 · 试玩新人')
    expect(markdown).toContain('- [x] 列表')
  })

  it('creates safe markdown file names', () => {
    expect(projectCardFileName('A/B:作品?', 'C++', 1)).toBe('A-B-作品-C++-stage-1.md')
  })
})
