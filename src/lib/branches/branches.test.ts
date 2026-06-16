import { describe, it, expect } from 'vitest'
import { LANGUAGE_MODULES } from '@/lib/language-modules'
import { FOUNDATION_MAP_ID } from '@/lib/course-maps'
import { BRANCH_EN } from './branch-en'
import type { Level } from '@/lib/levels'

// Translatable fields (rendered via tr()); code / starterCode / icon render raw.
function translatableStrings(level: Level): string[] {
  const out = [level.title, level.objective, level.badge, ...level.proactiveHints]
  for (const t of level.tests) out.push(t.description, t.failHint)
  for (const s of level.sections) {
    if (s.auto) continue // auto sections are generated, not translated verbatim
    out.push(s.heading, s.body)
    if (s.tip) out.push(s.tip)
    if (s.warning) out.push(s.warning)
    if (s.codeBlock?.caption) out.push(s.codeBlock.caption)
  }
  return out
}

describe.each(LANGUAGE_MODULES.map((m) => [m.id, m] as const))('language module %s', (_id, module) => {
  it('has contiguous level ids 1..N', () => {
    module.levels.forEach((level, i) => expect(level.id).toBe(i + 1))
  })

  it('has no duplicate level ids', () => {
    const ids = module.levels.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every branch node levelId resolves to a level and is within clamp range', () => {
    const byId = new Map(module.levels.map((l) => [l.id, l]))
    for (const map of module.courseMaps) {
      if (map.id === FOUNDATION_MAP_ID) continue
      for (const node of map.nodes) {
        if (node.levelId == null) continue
        expect(byId.has(node.levelId)).toBe(true)
        expect(node.levelId).toBeLessThanOrEqual(module.levels.length)
      }
    }
  })
})

describe('authored branch content', () => {
  it('C: the c-cli-parser node is wired with 4 sub-levels', () => {
    const c = LANGUAGE_MODULES.find((m) => m.id === 'c')!
    const node = c.courseMaps.flatMap((m) => m.nodes).find((n) => n.id === 'c-cli-parser')!
    expect(node.levelId).toBeTypeOf('number')
    const byId = new Map(c.levels.map((l) => [l.id, l]))
    for (let i = 0; i < 4; i++) expect(byId.has(node.levelId! + i)).toBe(true)
  })

  it('every authored (non-foundation) branch level has full English coverage', () => {
    const baseCounts: Record<string, number> = {} // foundation level count per language
    // A branch level is any level whose id exceeds the foundation count. We infer
    // the foundation count from the foundation map's highest lesson levelId.
    for (const m of LANGUAGE_MODULES) {
      const foundation = m.courseMaps.find((map) => map.id === FOUNDATION_MAP_ID)
      const maxFoundationId = Math.max(0, ...(foundation?.nodes ?? []).map((n) => n.levelId ?? 0))
      baseCounts[m.id] = maxFoundationId
    }
    const missing: string[] = []
    for (const m of LANGUAGE_MODULES) {
      for (const level of m.levels) {
        if (level.id <= baseCounts[m.id]) continue // foundation level
        for (const s of translatableStrings(level)) {
          if (!(s in BRANCH_EN)) missing.push(`[${m.id} lv${level.id}] ${s.slice(0, 40)}`)
        }
      }
    }
    expect(missing, `missing EN keys:\n${missing.join('\n')}`).toEqual([])
  })
})
