// Pure serializer: staging node JSON -> the 14 branch TS files.
// Reads:  src/lib/branches/.staging/worklist.json   (expected nodes)
//         src/lib/branches/.staging/nodes/<id>.json  (authored, one per node)
// Writes: src/lib/branches/<lang>.ts  +  <lang>-en.ts
// Exits nonzero (and writes nothing) if any node is missing/invalid, printing
// the failing ids so the caller can re-author just those.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const branches = resolve(root, 'src/lib/branches')
const staging = resolve(branches, '.staging')

const LANGS = {
  python: { file: 'python', levels: 'PYTHON_BRANCH_LEVELS', en: 'PYTHON_BRANCH_EN', name: 'Python' },
  c: { file: 'c', levels: 'C_BRANCH_LEVELS', en: 'C_BRANCH_EN', name: 'C' },
  cpp: { file: 'cpp', levels: 'CPP_BRANCH_LEVELS', en: 'CPP_BRANCH_EN', name: 'C++' },
  java: { file: 'java', levels: 'JAVA_BRANCH_LEVELS', en: 'JAVA_BRANCH_EN', name: 'Java' },
  csharp: { file: 'csharp', levels: 'CSHARP_BRANCH_LEVELS', en: 'CSHARP_BRANCH_EN', name: 'C#' },
  javascript: { file: 'javascript', levels: 'JAVASCRIPT_BRANCH_LEVELS', en: 'JAVASCRIPT_BRANCH_EN', name: 'JavaScript' },
  'visual-basic': { file: 'visual-basic', levels: 'VISUAL_BASIC_BRANCH_LEVELS', en: 'VISUAL_BASIC_BRANCH_EN', name: 'Visual Basic' },
}

const worklist = JSON.parse(readFileSync(resolve(staging, 'worklist.json'), 'utf8'))
const q = (s) => JSON.stringify(String(s)) // safe TS string literal

const errors = []
const missing = []
let weakEn = 0

// pull zh, register zh->en into the lang's en map (fallback en=zh, flagged)
function tr(enMap, field, label, ctx) {
  if (field == null) { errors.push(`${ctx}: missing ${label}`); return '' }
  if (typeof field === 'string') { // tolerate plain string -> no translation
    if (!field.trim()) { errors.push(`${ctx}: empty ${label}`); return '' }
    enMap.set(field, field); weakEn++; return field
  }
  const zh = field.zh
  if (typeof zh !== 'string' || !zh.trim()) { errors.push(`${ctx}: missing ${label}.zh`); return '' }
  let en = typeof field.en === 'string' && field.en.trim() ? field.en : null
  if (!en) { en = zh; weakEn++ }
  enMap.set(zh, en)
  return zh
}

function checkExpr(check, ctx) {
  const re = (p, f) => {
    try { new RegExp(p, f || undefined) } catch (e) { errors.push(`${ctx}: bad regex ${JSON.stringify(p)}: ${e.message}`) }
    return `new RegExp(${q(p)}${f ? `, ${q(f)}` : ''})`
  }
  if (!check || typeof check !== 'object') { errors.push(`${ctx}: missing check`); return 'matches(/.^/)' }
  if (check.kind === 'includesAll') {
    if (!Array.isArray(check.parts) || !check.parts.length) { errors.push(`${ctx}: includesAll needs parts`); return 'matches(/.^/)' }
    return `includesAll([${check.parts.map(q).join(', ')}])`
  }
  if (check.kind === 'matches') return `matches(${re(check.pattern, check.flags)})`
  if (check.kind === 'matchesAll') {
    if (!Array.isArray(check.patterns) || !check.patterns.length) { errors.push(`${ctx}: matchesAll needs patterns`); return 'matches(/.^/)' }
    const parts = check.patterns.map((p) => (typeof p === 'string' ? re(p) : re(p.pattern, p.flags)))
    return `matchesAll([${parts.join(', ')}])`
  }
  errors.push(`${ctx}: unknown check.kind ${check.kind}`)
  return 'matches(/.^/)'
}

function emitLesson(enMap, lesson, ctx) {
  const title = tr(enMap, lesson.title, 'title', ctx)
  const badge = tr(enMap, lesson.badge, 'badge', ctx)
  const objective = tr(enMap, lesson.objective, 'objective', ctx)
  const icon = typeof lesson.icon === 'string' ? lesson.icon : ''
  const starter = typeof lesson.starterCode === 'string' ? lesson.starterCode : ''
  if (!icon) errors.push(`${ctx}: missing icon`)

  const hints = Array.isArray(lesson.hints) ? lesson.hints : []
  if (!hints.length) errors.push(`${ctx}: no hints`)
  const hintLits = hints.map((h, i) => q(tr(enMap, h, `hint[${i}]`, ctx)))

  const tests = Array.isArray(lesson.tests) ? lesson.tests : []
  if (!tests.length) errors.push(`${ctx}: no tests`)
  const testLits = tests.map((t, i) => {
    const tctx = `${ctx} test[${i}]`
    const id = typeof t.id === 'string' && t.id.trim() ? t.id : `${ctx}-t${i}`
    const desc = tr(enMap, t.description, 'description', tctx)
    const fail = tr(enMap, t.failHint, 'failHint', tctx)
    const chk = checkExpr(t.check, tctx)
    const pts = Number.isFinite(t.points) && t.points !== 50 ? `, ${t.points}` : ''
    return `      test(${q(id)}, ${q(desc)}, ${chk}, ${q(fail)}${pts})`
  })

  const sections = Array.isArray(lesson.sections) ? lesson.sections : []
  if (!sections.length) errors.push(`${ctx}: no sections`)
  const secLits = sections.map((s, i) => {
    const sctx = `${ctx} section[${i}]`
    const heading = tr(enMap, s.heading, 'heading', sctx)
    const body = tr(enMap, s.body, 'body', sctx)
    const opts = []
    const hasCode = typeof s.code === 'string' && s.code.trim()
    if (hasCode) {
      opts.push(`code: ${q(s.code)}`)
      // guarantee caption coverage when code present
      let cap
      if (s.caption) cap = tr(enMap, s.caption, 'caption', sctx)
      else { cap = '参考结构'; enMap.set('参考结构', 'Reference structure') }
      opts.push(`caption: ${q(cap)}`)
    } else if (s.caption) {
      // caption without code is dropped by kit; ignore but don't register
    }
    if (s.tip) opts.push(`tip: ${q(tr(enMap, s.tip, 'tip', sctx))}`)
    if (s.warning) opts.push(`warning: ${q(tr(enMap, s.warning, 'warning', sctx))}`)
    const optStr = opts.length ? `, { ${opts.join(', ')} }` : ''
    return `      sec(${q(heading)}, ${q(body)}${optStr})`
  })

  const graphics = lesson.requiresGraphics ? '\n      requiresGraphics: true,' : ''
  return `    lesson({
      title: ${q(title)},
      badge: ${q(badge)},
      icon: ${q(icon)},
      objective: ${q(objective)},
      starterCode: ${q(starter)},${graphics}
      hints: [${hintLits.join(', ')}],
      tests: [
${testLits.join(',\n')},
      ],
      sections: [
${secLits.join(',\n')},
      ],
    })`
}

// group worklist by lang, in source order
const byLang = {}
for (const n of worklist) (byLang[n.lang] ||= []).push(n)

for (const [lang, cfg] of Object.entries(LANGS)) {
  const nodes = byLang[lang] || []
  const enMap = new Map()
  const nodeBlocks = []
  let presentCount = 0
  for (const n of nodes) {
    const f = resolve(staging, 'nodes', `${n.id}.json`)
    if (!existsSync(f)) { missing.push(n.id); continue }
    let data
    try { data = JSON.parse(readFileSync(f, 'utf8')) } catch (e) { errors.push(`${n.id}: invalid JSON: ${e.message}`); continue }
    const lessons = Array.isArray(data.lessons) ? data.lessons : []
    if (lessons.length !== n.lessons) errors.push(`${n.id}: expected ${n.lessons} lessons, got ${lessons.length}`)
    const lessonLits = lessons.map((l, i) => emitLesson(enMap, l, `${n.id}#${i + 1}`))
    nodeBlocks.push(`  ${q(n.id)}: [\n${lessonLits.join(',\n')},\n  ],`)
    presentCount++
  }

  // always include the default-caption EN once
  enMap.set('参考结构', 'Reference structure')

  const header = `// AUTO-GENERATED by gen/serialize.mjs — do not edit by hand.\n// ${cfg.name} extended-branch levels. Keyed by CourseNode.id; each array's\n// length === that node's lessonCount. Tests are static code-pattern checks.`
  const levelsTs = `${header}
import { lesson, sec, test, includesAll, matches, matchesAll, type Level } from './kit'
import type { BranchLevelsByNode } from './assemble'

export const ${cfg.levels}: BranchLevelsByNode = {
${nodeBlocks.join('\n')}
}

export type { Level }
`
  // void no-unused for langs that don't use some helpers: keep all imports (no noUnusedLocals)

  const enEntries = [...enMap.entries()].map(([zh, en]) => `  ${q(zh)}: ${q(en)},`).join('\n')
  const enTs = `// AUTO-GENERATED by gen/serialize.mjs — do not edit by hand.\n// ${cfg.name} branch zh -> en strings (pure Record, no heavy level data).
export const ${cfg.en}: Record<string, string> = {
${enEntries}
}
`
  writeFileSync(resolve(branches, `${cfg.file}.ts`), levelsTs)
  writeFileSync(resolve(branches, `${cfg.file}-en.ts`), enTs)
  console.log(`${lang}: ${presentCount}/${nodes.length} nodes, ${enMap.size} en keys`)
}

console.log('---')
console.log('missing nodes:', missing.length, missing.length ? missing.join(',') : '')
console.log('errors:', errors.length)
for (const e of errors.slice(0, 40)) console.log('  !', e)
if (errors.length > 40) console.log(`  ... +${errors.length - 40} more`)
console.log('weak (en fell back to zh):', weakEn)

if (missing.length || errors.length) {
  console.log('INCOMPLETE — re-author the listed ids, then re-run.')
  process.exit(1)
}
console.log('OK — all nodes serialized.')
