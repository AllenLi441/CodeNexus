export const meta = {
  name: 'author-branch-lessons',
  description: 'Author bilingual branch lessons for all 158 course nodes (~788 lessons)',
  phases: [
    { title: 'Load', detail: 'read worklist.json' },
    { title: 'Author', detail: 'one agent per node -> staging JSON' },
  ],
}

const LANG_NAME = {
  python: 'Python', c: 'C', cpp: 'C++', java: 'Java',
  csharp: 'C#', javascript: 'JavaScript', 'visual-basic': 'Visual Basic',
}

const WL_SCHEMA = {
  type: 'object',
  required: ['nodes'],
  additionalProperties: true,
  properties: {
    nodes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'lang', 'icon', 'mapTitle', 'title', 'objective', 'difficulty', 'lessons', 'tags'],
        additionalProperties: true,
        properties: {
          id: { type: 'string' }, lang: { type: 'string' }, icon: { type: 'string' },
          mapTitle: { type: 'string' }, title: { type: 'string' }, objective: { type: 'string' },
          difficulty: { type: 'string' }, lessons: { type: 'number' },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
}

const EXAMPLE = `EXAMPLE (format only — one lesson of a hypothetical node):
{
  "nodeId": "demo-node",
  "lang": "c",
  "lessons": [
    {
      "title": {"zh": "认识 argc 与 argv", "en": "Meet argc and argv"},
      "badge": {"zh": "入口参数", "en": "Entry args"},
      "objective": {"zh": "在 main(int argc, char *argv[]) 里用 printf 打印参数个数 argc。", "en": "Print argc with printf inside main(int argc, char *argv[])."},
      "icon": "C",
      "starterCode": "#include <stdio.h>\\n\\nint main(int argc, char *argv[]) {\\n    // TODO: 打印参数个数 argc\\n    return 0;\\n}\\n",
      "requiresGraphics": false,
      "hints": [
        {"zh": "argc 是命令行词的数量，程序名也算一个。", "en": "argc is the count of command-line words; the program name counts too."},
        {"zh": "用 printf(\\"%d\\\\n\\", argc); 打印这个整数。", "en": "Use printf(\\"%d\\\\n\\", argc); to print this integer."}
      ],
      "tests": [
        {"id": "demo-node-1-printf", "description": {"zh": "用 printf 输出", "en": "Output with printf"}, "failHint": {"zh": "需要用 printf 打印结果。", "en": "Use printf to print the result."}, "check": {"kind": "includesAll", "parts": ["printf"]}, "points": 50},
        {"id": "demo-node-1-argc", "description": {"zh": "在 printf 里用到 argc", "en": "Use argc in printf"}, "failHint": {"zh": "把 argc 传进 printf。", "en": "Pass argc into printf."}, "check": {"kind": "matches", "pattern": "printf\\\\s*\\\\([^;]*argc"}, "points": 50}
      ],
      "sections": [
        {"heading": {"zh": "main 能收两个参数", "en": "main can take two parameters"}, "body": {"zh": "完整形态是 int main(int argc, char *argv[])：操作系统把命令行拆成词交给你。argc 是词数，argv 是这些词。", "en": "The full form is int main(int argc, char *argv[]): the OS hands you the command line split into words. argc is the count, argv is the words."}, "code": "int main(int argc, char *argv[]) {\\n    printf(\\"%d\\\\n\\", argc);\\n    return 0;\\n}", "caption": {"zh": "main 的完整签名", "en": "Full main signature"}, "tip": {"zh": "先打印 argc，跑通再读 argv。", "en": "Print argc first; read argv once it runs."}}
      ]
    }
  ]
}`

function authorPrompt(n) {
  const langName = LANG_NAME[n.lang] || n.lang
  const vbNote = n.lang === 'visual-basic'
    ? ' Visual Basic is case-insensitive — add "flags":"i" to every regex check.'
    : ''
  return `You are an expert ${langName} engineer and a programming teacher writing for a Chinese coding-practice product (《编程工坊》). Author the lessons for ONE course node, in real engineering depth — NOT placeholder text.

NODE
- id: ${n.id}
- language: ${langName} (lang key "${n.lang}")
- branch theme: ${n.mapTitle}
- node title: ${n.title}
- node goal: ${n.objective}
- difficulty: ${n.difficulty}
- tags: ${(n.tags || []).join(', ')}
- Author EXACTLY ${n.lessons} lessons (sub-levels), ordered so each builds on the previous toward the node goal. The final lesson should integrate the skill into a small concrete result.

EACH LESSON = one focused exercise: a few teaching sections + a runnable starter scaffold + static code-pattern tests that inspect the learner's SOURCE CODE (not program output).

OUTPUT: use the Write tool to create EXACTLY this file (absolute path; valid JSON — no comments, no trailing commas):
  /Users/allenli/Desktop/编程工坊/frontend/src/lib/branches/.staging/nodes/${n.id}.json
Schema:
{
  "nodeId": "${n.id}",
  "lang": "${n.lang}",
  "lessons": [ Lesson x ${n.lessons} ]
}
Lesson = {
  "title": {"zh","en"},            // short, specific
  "badge": {"zh","en"},            // 2-4 char tag (e.g. 入口 / 类型 / 错误码)
  "objective": {"zh","en"},        // one sentence: what makes THIS lesson pass
  "icon": "${n.icon}",
  "starterCode": "RAW ${langName} scaffold with TODO comments; must NOT already pass the tests",
  "requiresGraphics": ${['pygame', 'app-game', 'app-gui'].some((k) => n.id.includes(k)) || /game|unity|gui|cv-|vision|graphic/i.test(n.id) ? 'true' : 'false'},
  "hints": [ {"zh","en"} x2-3 ],
  "tests": [ Test x2-4 ],
  "sections": [ Section x2-4 ]
}
Test = { "id": "${n.id}-<lessonNo>-<slug>", "description": {"zh","en"}, "failHint": {"zh","en"}, "check": Check, "points": 50 }
Check is ONE of:
  {"kind":"includesAll","parts":["substr", ...]}                 // source contains all (case-insensitive)
  {"kind":"matches","pattern":"<regex source>","flags":"i"}      // flags optional${vbNote}
  {"kind":"matchesAll","patterns":["<re1>","<re2>"]}
  regex "pattern" is the SOURCE string, JSON-escaped (e.g. "\\\\bint\\\\s+main\\\\s*\\\\(").
Section = { "heading": {"zh","en"}, "body": {"zh","en"}, "code": "optional RAW snippet", "caption": {"zh","en"} (REQUIRED when code present), "tip": {"zh","en"} (optional), "warning": {"zh","en"} (optional) }

HARD RULES
- EXACTLY ${n.lessons} lessons.
- Every {zh,en}: zh = natural, direct Chinese in the product voice (concrete, practical, name the real pitfall, no fluff, occasional "别…" warnings). en = a faithful English rendering of the SAME meaning. NEVER leave en empty and NEVER set en equal to the Chinese.
- Tests check SOURCE CODE. A correct solution to the objective MUST pass every test; the starterCode MUST fail at least one. Keep patterns lenient on whitespace/naming but specific to the concept. Prefer includesAll for plain substrings; keep every regex simple and valid.
- Use correct, idiomatic ${langName} syntax. Teach the real concept of "${n.title}".

${EXAMPLE}

After writing the file, reply with ONE line only: "ok ${n.id} ${n.lessons}". Do NOT put the JSON in your reply.`
}

// ── Load ──────────────────────────────────────────────────────────────────
phase('Load')
const loaded = await agent(
  'Read the file /Users/allenli/Desktop/编程工坊/frontend/src/lib/branches/.staging/worklist.json and return its parsed contents as {"nodes": [...]} with every element unchanged (fields: id, lang, icon, mapId, mapTitle, title, objective, difficulty, lessons, tags, kind). Return ALL elements.',
  { label: 'load-worklist', phase: 'Load', schema: WL_SCHEMA, agentType: 'general-purpose' }
)

let nodes = (loaded && loaded.nodes) || []
const onlyIds = Array.isArray(args) && args.length ? new Set(args) : null
if (onlyIds) nodes = nodes.filter((n) => onlyIds.has(n.id))
log(`authoring ${nodes.length} nodes${onlyIds ? ' (subset)' : ''}`)

// ── Author (one agent per node) ─────────────────────────────────────────────
phase('Author')
const results = await parallel(
  nodes.map((n) => () =>
    agent(authorPrompt(n), {
      label: `${n.lang}:${n.id}`,
      phase: 'Author',
      agentType: 'general-purpose',
    }).then((r) => ({ id: n.id, ok: !!r })).catch(() => ({ id: n.id, ok: false }))
  )
)

const ok = results.filter((r) => r && r.ok).length
const failed = results.filter((r) => !r || !r.ok).map((r) => (r ? r.id : '?'))
log(`authored ok: ${ok}/${nodes.length}; agent-failed: ${failed.length}`)
return { total: nodes.length, ok, failed }
