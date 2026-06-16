// Authoring kit for extended-branch levels.
//
// Branch levels reuse the same `Level` shape as the foundation curriculum
// (`@/lib/levels`), but their tests are CODE-PATTERN checks (they inspect the
// source text, not the run output). That keeps judging stable for topics whose
// libraries can't execute in the in-browser Pyodide sandbox or the server
// runner (network / GUI / server / heavy-ML packages). Where a snippet *can*
// run as plain code, the starter scaffold is still real, runnable code.
//
// This module is a LEAF: it imports only types from `@/lib/levels`, so the
// per-language data files (`./<lang>.ts`) can import it without creating an
// import cycle with `@/lib/language-modules`.
import type { Level, LessonSection, TestCase } from '@/lib/levels'

export type { Level }

/** Pass if the source contains every fragment (case-insensitive). */
export const includesAll = (parts: string[]): TestCase['check'] =>
  (_output, code) => parts.every((part) => code.toLowerCase().includes(part.toLowerCase()))

/** Pass if the source matches the pattern. */
export const matches = (pattern: RegExp): TestCase['check'] =>
  (_output, code) => pattern.test(code)

/** Pass if the source matches every pattern. */
export const matchesAll = (patterns: RegExp[]): TestCase['check'] =>
  (_output, code) => patterns.every((pattern) => pattern.test(code))

export function test(
  id: string,
  description: string,
  check: TestCase['check'],
  failHint: string,
  points = 50
): TestCase {
  return { id, description, check, failHint, points }
}

/** A teaching section, optionally with a reference code block / tip / warning. */
export function sec(
  heading: string,
  body: string,
  opts: { code?: string; caption?: string; fillable?: boolean; tip?: string; warning?: string } = {}
): LessonSection {
  const section: LessonSection = { heading, body }
  if (opts.code) section.codeBlock = { code: opts.code, caption: opts.caption ?? '参考结构', fillable: opts.fillable ?? true }
  if (opts.tip) section.tip = opts.tip
  if (opts.warning) section.warning = opts.warning
  return section
}

/**
 * Build one branch sub-level. `id` is a placeholder (0) — the assembler
 * (`attachBranchLevels`) assigns the real, contiguous id when wiring the level
 * into a language module.
 */
export function lesson(input: {
  title: string
  badge: string
  icon: string
  objective: string
  starterCode: string
  hints: string[]
  tests: TestCase[]
  sections: LessonSection[]
  requiresGraphics?: boolean
}): Level {
  return {
    id: 0,
    title: input.title,
    badge: input.badge,
    icon: input.icon,
    objective: input.objective,
    starterCode: input.starterCode,
    proactiveHints: input.hints,
    tests: input.tests,
    sections: input.sections,
    ...(input.requiresGraphics ? { requiresGraphics: true } : {}),
  }
}
