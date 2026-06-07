export type MentorTrigger = 'idle' | 'error' | 'failed-test'

export function tauntModeLabel(frequency: number) {
  if (frequency < 25) return '低嘲讽：少损人，多给关键提示。'
  if (frequency > 74) return '高嘲讽：嘴可以更毒，但必须对事不对人。'
  return '标准嘲讽：带刺、精确、别废话。'
}

export function mentorWelcome(codename: string, tauntFrequency: number) {
  const fire = tauntFrequency > 74
    ? '我会说得直一点，毕竟温柔解释通常救不了缩进。'
    : tauntFrequency < 25
    ? '今天先少扎你两句，重点看逻辑。'
    : '我会盯着你的逻辑，顺手戳破那些看起来很努力的错误。'

  return `上线了，**${codename}**。\n\n我是 **Nexus 老炮**。${fire}\n\n代码卡住就贴过来；如果你停太久，我也会自己冒出来提醒你，免得编辑器先退休。`
}

export function mentorFallback() {
  return '导师暂时离线。先别甩锅给网络，把报错第一行读完，很多问题已经把答案写脸上了。'
}

function firstNonEmptyLine(code: string) {
  return code.split('\n').map((line) => line.trim()).find(Boolean) ?? ''
}

function likelyIntent(code: string, objective: string, languageName = 'Python') {
  const head = firstNonEmptyLine(code)
  if (!head) return `目标是：${objective}`
  if (/\bdef\s+\w+/.test(code)) return '你像是在写函数。先确认函数名、参数、返回值三件事对齐。'
  if (/\bfunction\s+\w+|static\s+\w+|Function\s+\w+/i.test(code)) return '你像是在写函数。先确认函数名、参数、返回值三件事对齐。'
  if (/\bfor\b|\bwhile\b/.test(code)) return '你像是在写循环。先确认循环范围和缩进，不然它只会原地表演。'
  if (/\bif\b|\belif\b|\belse\b/.test(code)) return '你像是在写条件判断。先确认冒号、缩进和条件分支是否覆盖目标情况。'
  if (/\bprint\s*\(|console\.log|printf|Console\.WriteLine|System\.out\.println/.test(code)) return '你像是在做输出题。先确认打印内容完全匹配目标，大小写和标点别装看不见。'
  if (languageName !== 'Python') return `你已经起手写了 \`${head.slice(0, 42)}\`。现在别套 Python 习惯，按 ${languageName} 的入口、类型和语句结束规则对齐目标：${objective}`
  return `你已经起手写了 \`${head.slice(0, 42)}\`。现在把它和目标对齐：${objective}`
}

// Walk source character by character, respecting string state, escapes, and
// line comments, and report bracket / quote balance.
//
// Why hand-roll instead of regex: the previous version counted raw quotes
// across the entire file, so legitimate code like `print("It's me")` or
// `a = "she said \"hi\""` was reported as "quotes not closed". A real lint
// must know whether each quote is inside a string body or starting one.
//
// Sample cases this fixes (regression set):
//   - print("It's me")
//   - msg = 'He said "hi"'
//   - print("escaped: \"")
//   - x = "abc # not a comment"
//   - r"raw" + b"bytes"  (prefixes ignored, just inspect quote pairing)
//
// And still catches the real bugs:
//   - print("hello)              → unclosed double-quoted string
//   - if x > 0\n    print(x)     → missing colon on `if`
//   - y = (1 + 2                 → unbalanced parens
function scanStringsAndBrackets(code: string, opts: { commentChar: '#' | '//' | null }) {
  let i = 0
  let parens = 0
  let braces = 0
  let unclosedString = false
  while (i < code.length) {
    const c = code[i]

    // Line comment — skip to end of line.
    if (opts.commentChar === '#' && c === '#') {
      while (i < code.length && code[i] !== '\n') i++
      continue
    }
    if (opts.commentChar === '//' && c === '/' && code[i + 1] === '/') {
      while (i < code.length && code[i] !== '\n') i++
      continue
    }

    // String literal. Triple-quoted not handled — we just need to know whether
    // the file ends inside a string. Triple quotes are rare in beginner code
    // and false-positive risk is much lower.
    if (c === '"' || c === "'") {
      const quote = c
      i++
      let closed = false
      while (i < code.length) {
        if (code[i] === '\\' && i + 1 < code.length) {
          i += 2
          continue
        }
        if (code[i] === quote) {
          closed = true
          i++
          break
        }
        // Bare newline ends a regular string in Python — treat as unclosed,
        // but for generic langs we still consider the string open until a
        // matching quote. Simpler rule: any newline closes the string check
        // and we don't flag it (avoids noise for multi-line concatenation
        // tricks). Behavior: just continue scanning.
        i++
      }
      if (!closed) {
        unclosedString = true
        break
      }
      continue
    }

    if (c === '(') parens++
    else if (c === ')') parens--
    else if (c === '{') braces++
    else if (c === '}') braces--
    i++
  }
  return { parens, braces, unclosedString }
}

export function detectPythonLint(code: string): string | null {
  const trimmed = code.trim()
  if (!trimmed) return '编辑器还是空的。空白确实不会报错，因为它什么也没干。'

  const lines = code.split('\n')
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    if (/^(if|elif|else|for|while|def|class|try|except|finally)\b/.test(line) && !line.endsWith(':')) {
      return `\`${line.slice(0, 56)}\` 这一行大概率少了冒号。Python 对冒号的执念，比你想象得严重。`
    }
  }

  const scan = scanStringsAndBrackets(code, { commentChar: '#' })
  if (scan.unclosedString) {
    return '有字符串没闭合。开了引号就要收，解释器记性比你好。'
  }
  if (scan.parens !== 0) {
    return '括号数量对不上。解释器不是读心术，它不会替你脑补右括号。'
  }

  return null
}

function stripPythonLiteralsAndComments(code: string) {
  let output = ''
  let i = 0

  while (i < code.length) {
    const c = code[i]

    if (c === '#') {
      while (i < code.length && code[i] !== '\n') {
        output += ' '
        i++
      }
      continue
    }

    const stringStart = code.slice(i).match(/^[rRuUbBfF]{0,2}("""|'''|"|')/)
    if (stringStart) {
      const token = stringStart[0]
      const quote = stringStart[1]
      const prefixLength = token.length - quote.length
      const previous = i > 0 ? code[i - 1] : ''

      if (prefixLength === 0 || !/[A-Za-z0-9_]/.test(previous)) {
        output += ' '.repeat(token.length)
        i += token.length

        const isTriple = quote.length === 3
        while (i < code.length) {
          if (isTriple && code.startsWith(quote, i)) {
            output += ' '.repeat(quote.length)
            i += quote.length
            break
          }
          if (!isTriple && code[i] === '\\' && i + 1 < code.length) {
            output += code[i + 1] === '\n' ? ' \n' : '  '
            i += 2
            continue
          }
          if (!isTriple && code[i] === quote) {
            output += ' '
            i++
            break
          }
          output += code[i] === '\n' ? '\n' : ' '
          i++
        }
        continue
      }
    }

    output += c
    i++
  }

  return output
}

function indentation(line: string) {
  return line.match(/^\s*/)?.[0].length ?? 0
}

function hasExplicitLoopExit(lines: string[], lineIndex: number, parentIndent: number) {
  for (let i = lineIndex + 1; i < Math.min(lines.length, lineIndex + 14); i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed) continue
    if (indentation(line) <= parentIndent) break
    if (/\b(break|return|raise)\b|(?:\bsys\s*\.\s*exit\s*\()/.test(trimmed)) {
      return true
    }
  }
  return false
}

// A while-condition that is a compile-time-constant truthy value → infinite loop.
// Covers True / 1 / any non-zero number / `not False|None|0` / tautologies (1==1).
const CONSTANT_TRUTHY_CONDITION = [
  /^true$/i,
  /^-?\d+(?:\.\d+)?$/, // numeric literal (zero excluded by the guard below)
  /^not\s+(?:false|none|0|0\.0|'')$/i,
  /^([\w.]+)\s*==\s*\1$/i, // tautology: 1==1, True==True, x==x
  /^true\s*(?:and|or)\s*true$/i
]

function isConstantTruthyCondition(cond: string): boolean {
  // Strip one layer of wrapping parens so `while (True):` is caught like `while True:`.
  const c = cond.trim().replace(/^\((.*)\)$/, '$1').trim()
  if (!c) return false
  if (/^-?0+(?:\.0+)?$/.test(c)) return false // `while 0:` is falsy — never runs
  return CONSTANT_TRUTHY_CONDITION.some((re) => re.test(c))
}

// Does an expression contain an astronomically large literal (>= 1e8)?
// Catches range() loop bombs and list/string memory bombs (10**12, 1e9, 9-digit ints).
function hasHugeMagnitude(expr: string): boolean {
  const pow = expr.match(/(\d+)\s*\*\*\s*(\d+)/)
  if (pow) {
    const value = Math.pow(Number(pow[1]), Number(pow[2]))
    if (Number.isFinite(value) && value >= 1e8) return true
  }
  const sci = expr.match(/\d+(?:\.\d+)?[eE]\+?(\d+)/)
  if (sci && Number(sci[1]) >= 8) return true
  for (const lit of expr.match(/\d[\d_]{7,}/g) ?? []) {
    if (lit.replace(/_/g, '').length >= 9) return true
  }
  return false
}

/**
 * Pre-execution guard against code that would freeze or crash the browser tab.
 *
 * ⚠️ STOPGAP, NOT A SANDBOX. Pyodide runs synchronously on the UI thread, so a
 * busy loop / huge allocation freezes the tab and even the "force stop" button
 * can't repaint. Regex pre-screening of Turing-complete code is fundamentally
 * incomplete — the real fix is to run Pyodide in a Web Worker with a wall-clock
 * timeout + worker.terminate() (audit SBX-2). This catches the high-frequency
 * beginner cases so they fail fast with a helpful message instead of a dead tab.
 */
export function detectRunawayPython(code: string): string | null {
  const stripped = stripPythonLiteralsAndComments(code)
  const lines = stripped.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const line = rawLine.trim()
    if (!line) continue

    // while <constant-truthy>:  (True / 1 / 2 / not False / 1==1 / ...)
    const whileMatch = line.match(/^while\b\s*(.+?)\s*:\s*(.*)$/)
    if (whileMatch && isConstantTruthyCondition(whileMatch[1])) {
      const tail = whileMatch[2].trim()
      if (/\b(break|return|raise)\b|(?:\bsys\s*\.\s*exit\s*\()/.test(tail)) continue
      if (!tail && hasExplicitLoopExit(lines, i, indentation(rawLine))) continue
      return '检测到明显无退出条件的循环。`while True` / `while 1` / `while 2` / `while not False` 这类恒真条件会把浏览器主线程冻住；先加退出条件或 `break`，再运行。'
    }

    const countMatch = line.match(/^for\s+.+\s+in\s+itertools\s*\.\s*count\s*\([^)]*\)\s*:\s*(.*)$/)
    if (countMatch) {
      const tail = countMatch[1].trim()
      if (/\b(break|return|raise)\b|(?:\bsys\s*\.\s*exit\s*\()/.test(tail)) continue
      if (!tail && hasExplicitLoopExit(lines, i, indentation(rawLine))) continue
      return '检测到 `itertools.count()` 无限计数循环，但没看到退出口。别把浏览器当跑分机器，先写 `break` 或边界条件。'
    }

    // range(<astronomically large>) → loop bomb that freezes the tab
    const rangeMatch = line.match(/\brange\s*\(([^)]*)\)/)
    if (rangeMatch && hasHugeMagnitude(rangeMatch[1])) {
      return '检测到 `range()` 里是个天文数字，这个循环会把页面冻死。浏览器不是超算，先把范围改小。'
    }

    // [..]*HUGE / (..)*HUGE → memory bomb that OOM-crashes the tab
    if (/(?:\]|\))\s*\*/.test(line) && hasHugeMagnitude(line)) {
      return '检测到用巨大的倍数复制列表/序列，会瞬间吃光浏览器内存、直接崩页；先把倍数改小。'
    }
  }

  // def f(...): that calls itself with no base case → infinite recursion
  for (let i = 0; i < lines.length; i++) {
    const defMatch = lines[i].trim().match(/^def\s+([A-Za-z_]\w*)\s*\(/)
    if (!defMatch) continue
    const name = defMatch[1]
    const defIndent = indentation(lines[i])
    const body: string[] = []
    for (let j = i + 1; j < lines.length; j++) {
      if (!lines[j].trim()) continue
      if (indentation(lines[j]) <= defIndent) break
      body.push(lines[j])
    }
    const bodyText = body.join('\n')
    const callsSelf = new RegExp(`\\b${name}\\s*\\(`).test(bodyText)
    const hasBaseCase = /\b(return|if|elif|while|for|raise|break|yield|assert)\b/.test(bodyText)
    if (callsSelf && !hasBaseCase) {
      return `检测到函数 \`${name}\` 直接调用自己却没有任何 \`return\`/\`if\` 退出条件，会无限递归把浏览器撑爆；先写一个 base case（终止条件）。`
    }
  }

  return null
}

function detectGenericLint(code: string, languageName: string): string | null {
  const trimmed = code.trim()
  if (!trimmed) return '编辑器还是空的。空白确实不会报错，因为它什么也没干。'

  const scan = scanStringsAndBrackets(code, { commentChar: '//' })
  if (scan.unclosedString) {
    return '有字符串没闭合。开了引号就要收，编译器记性比你好。'
  }
  if (scan.parens !== 0) {
    return '括号数量对不上。编译器不是读心术，它不会替你脑补右括号。'
  }
  if (languageName !== 'Visual Basic' && scan.braces !== 0) {
    return '花括号数量对不上。代码块没收口，后面全是连环事故。'
  }

  return null
}

export function composeMentorAnalysis({
  codename,
  code,
  objective,
  trigger,
  error,
  failedHint,
  tauntFrequency,
  languageName = 'Python',
}: {
  codename: string
  code: string
  objective: string
  trigger: MentorTrigger
  error?: string
  failedHint?: string
  tauntFrequency: number
  languageName?: string
}) {
  const lint = languageName === 'Python' ? detectPythonLint(code) : detectGenericLint(code, languageName)
  const intent = likelyIntent(code, objective, languageName)
  const bite = tauntFrequency > 74
    ? `**${codename}**，这段代码已经开始散发"我差一点就懂了"的气味。`
    : tauntFrequency < 25
    ? `**${codename}**，先停一下。`
    : `**${codename}**，别硬敲了，键盘不是许愿池。`

  if (trigger === 'error') {
    const firstErrorLine = error?.split('\n').find((line) => line.trim())?.trim()
    return `${bite}\n\n报错核心：${firstErrorLine ? `\`${firstErrorLine.slice(0, 140)}\`` : '解释器已经不想配合你了。'}\n\n${lint ?? intent}\n\n先修这一个点，再运行。别一次改十处，调试不是抽奖。`
  }

  if (trigger === 'failed-test') {
    return `${bite}\n\n测试没过，说明代码能跑不等于写对。关键线索：${failedHint ?? objective}\n\n${lint ?? intent}`
  }

  return `${bite}\n\n你已经停了 60 秒。${lint ?? intent}\n\n下一步只做一件事：写出能验证目标的最小代码。`
}
