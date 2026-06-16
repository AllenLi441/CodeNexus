// Generate synthetic (placeholder) but schema-valid node files for EVERY node in
// worklist.json, to smoke-test the serializer + assembly + test wiring end-to-end
// before spending tokens on real authoring agents.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const staging = resolve(here, '..', 'src/lib/branches/.staging')
const nodesDir = resolve(staging, 'nodes')
mkdirSync(nodesDir, { recursive: true })

const worklist = JSON.parse(readFileSync(resolve(staging, 'worklist.json'), 'utf8'))

for (const n of worklist) {
  const lessons = Array.from({ length: n.lessons }, (_, i) => {
    const k = `${n.id}#${i + 1}`
    return {
      title: { zh: `占位课程 ${k}`, en: `Placeholder ${k}` },
      badge: { zh: `徽章${i + 1}`, en: `Badge ${i + 1}` },
      objective: { zh: `占位目标 ${k}`, en: `Placeholder objective ${k}` },
      icon: n.icon,
      starterCode: `// ${k}\n`,
      hints: [
        { zh: `提示A ${k}`, en: `Hint A ${k}` },
        { zh: `提示B ${k}`, en: `Hint B ${k}` },
      ],
      tests: [
        { id: `${n.id}-${i + 1}-a`, description: { zh: `检查A ${k}`, en: `Check A ${k}` }, failHint: { zh: `失败A ${k}`, en: `Fail A ${k}` }, check: { kind: 'includesAll', parts: ['x'] } },
        { id: `${n.id}-${i + 1}-b`, description: { zh: `检查B ${k}`, en: `Check B ${k}` }, failHint: { zh: `失败B ${k}`, en: `Fail B ${k}` }, check: { kind: 'matches', pattern: '\\bx\\b' } },
      ],
      sections: [
        { heading: { zh: `小节A ${k}`, en: `Section A ${k}` }, body: { zh: `正文A ${k}`, en: `Body A ${k}` }, code: 'x = 1', caption: { zh: `示例 ${k}`, en: `Example ${k}` }, tip: { zh: `贴士 ${k}`, en: `Tip ${k}` } },
        { heading: { zh: `小节B ${k}`, en: `Section B ${k}` }, body: { zh: `正文B ${k}`, en: `Body B ${k}` }, warning: { zh: `警告 ${k}`, en: `Warning ${k}` } },
      ],
    }
  })
  writeFileSync(resolve(nodesDir, `${n.id}.json`), JSON.stringify({ nodeId: n.id, lang: n.lang, lessons }))
}
console.log(`wrote ${worklist.length} synthetic node files`)
