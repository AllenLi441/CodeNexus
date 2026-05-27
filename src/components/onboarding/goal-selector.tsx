'use client'

import { cn } from '@/lib/utils'

type Goal = {
  id: string
  label: string
  icon: string
}

const goals: Goal[] = [
  { id: 'web', label: '做网站 / Web 应用', icon: '🌐' },
  { id: 'automation', label: '自动化办公', icon: '🤖' },
  { id: 'data', label: '数据分析', icon: '📊' },
  { id: 'ai', label: '人工智能 / AI', icon: '🧠' },
  { id: 'game', label: '游戏开发', icon: '🎮' },
  { id: 'interest', label: '纯粹的兴趣', icon: '✨' },
]

export function GoalSelector({ selected, onToggle }: {
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {goals.map((goal) => {
        const isSelected = selected.includes(goal.id)
        return (
          <button
            key={goal.id}
            type="button"
            onClick={() => onToggle(goal.id)}
            className={cn(
              'flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all duration-150',
              isSelected
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent',
            )}
          >
            <span>{goal.icon}</span>
            <span>{goal.label}</span>
          </button>
        )
      })}
    </div>
  )
}
