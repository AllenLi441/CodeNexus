// Deterministically extract the full branch-node work-list from source.
//   - Python branch nodes: every node(...) call in course-maps.ts COURSE_MAPS
//   - Generic-language nodes: courseNode(...) inside genericBranches() per prefix
// Output: src/lib/branches/.staging/worklist.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const staging = resolve(root, 'src/lib/branches/.staging')
mkdirSync(staging, { recursive: true })

const NODE_RE =
  /\b(?:courseNode|node)\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*(\d+)\s*,\s*\[([^\]]*)\]\s*(?:,\s*'([^']*)')?\s*\)/g

const parseTags = (raw) =>
  raw.split(',').map((t) => t.trim().replace(/^'|'$/g, '')).filter(Boolean)

// closest preceding header (by source index) → map context
function assignMap(nodeIndex, headers) {
  let cur = { mapId: '', mapTitle: '' }
  for (const h of headers) {
    if (h.index <= nodeIndex) cur = { mapId: h.id, mapTitle: h.title }
    else break
  }
  return cur
}

const worklist = []

// ── Python: course-maps.ts ──────────────────────────────────────────────────
{
  const src = readFileSync(resolve(root, 'src/lib/course-maps.ts'), 'utf8')
  // map headers: `id: 'automation',\n ... title: '自动化与爬虫分支',`
  const headers = []
  const headerRe = /id:\s*'([^']+)'\s*,[\s\S]{0,80}?title:\s*'([^']+)'/g
  for (let m; (m = headerRe.exec(src)); ) headers.push({ index: m.index, id: m[1], title: m[2] })
  for (let m; (m = NODE_RE.exec(src)); ) {
    const { mapId, mapTitle } = assignMap(m.index, headers)
    if (mapId === 'foundation') continue
    worklist.push({
      lang: 'python', icon: 'Py', mapId, mapTitle,
      id: m[1], title: m[2], objective: m[3], difficulty: m[4],
      lessons: Number(m[5]), tags: parseTags(m[6]), kind: m[7] || 'lesson',
    })
  }
}

// ── Generic langs: genericBranches() in language-modules.ts ──────────────────
{
  const full = readFileSync(resolve(root, 'src/lib/language-modules.ts'), 'utf8')
  const start = full.indexOf('function genericBranches')
  const src = full.slice(start)
  const PREFIX_TO_LANG = { c: 'c', cpp: 'cpp', java: 'java', csharp: 'csharp', js: 'javascript', vb: 'visual-basic' }
  const ICON = { c: 'C', cpp: 'C++', java: 'J', csharp: 'C#', javascript: 'JS', 'visual-basic': 'VB' }
  // prefix region boundaries
  const prefixMarks = []
  const prefRe = /if \(prefix === '([^']+)'\)/g
  for (let m; (m = prefRe.exec(src)); ) prefixMarks.push({ index: m.index, prefix: m[1] })
  const langAt = (idx) => {
    let p = null
    for (const mk of prefixMarks) { if (mk.index <= idx) p = mk.prefix; else break }
    return p ? PREFIX_TO_LANG[p] : null
  }
  // branchMap headers for theme context
  const headers = []
  const bmRe = /branchMap\(\s*'([^']+)'\s*,\s*'([^']+)'/g
  for (let m; (m = bmRe.exec(src)); ) headers.push({ index: m.index, id: m[1], title: m[2] })
  for (let m; (m = NODE_RE.exec(src)); ) {
    const lang = langAt(m.index)
    if (!lang) continue // fallback block uses template-literal ids; skipped
    const { mapId, mapTitle } = assignMap(m.index, headers)
    worklist.push({
      lang, icon: ICON[lang], mapId, mapTitle,
      id: m[1], title: m[2], objective: m[3], difficulty: m[4],
      lessons: Number(m[5]), tags: parseTags(m[6]), kind: m[7] || 'lesson',
    })
  }
}

writeFileSync(resolve(staging, 'worklist.json'), JSON.stringify(worklist, null, 2))

// summary only (keep caller context clean)
const byLang = {}
let totalLessons = 0
for (const n of worklist) {
  byLang[n.lang] = (byLang[n.lang] || 0) + 1
  totalLessons += n.lessons
}
console.log('nodes:', worklist.length, ' lessons:', totalLessons)
console.log('byLang:', JSON.stringify(byLang))
const ids = new Set(worklist.map((n) => n.id))
console.log('unique ids:', ids.size, ids.size === worklist.length ? '(no dupes)' : '(DUPES!)')
