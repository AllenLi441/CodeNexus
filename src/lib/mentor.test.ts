import { describe, expect, it } from 'vitest'
import { composeMentorAnalysis, detectPythonLint, detectRunawayPython } from './mentor'

function genericAnalysis(code: string, languageName = 'JavaScript') {
  return composeMentorAnalysis({
    codename: 'Test',
    code,
    objective: '输出指定内容',
    trigger: 'idle',
    tauntFrequency: 50,
    languageName,
  })
}

describe('detectPythonLint', () => {
  it('does not flag valid mixed quote strings', () => {
    expect(detectPythonLint(`print("It's me")`)).toBeNull()
    expect(detectPythonLint(`msg = 'He said "hi"'`)).toBeNull()
  })

  it('flags a real unclosed string', () => {
    expect(detectPythonLint(`print("hello)`)).toContain('字符串没闭合')
  })
})

describe('generic mentor lint', () => {
  it('does not flag valid strings or balanced brackets in other languages', () => {
    expect(genericAnalysis(`console.log("It's fine");`)).not.toContain('字符串没闭合')
    expect(genericAnalysis(`Console.WriteLine("It's fine");`, 'C#')).not.toContain('字符串没闭合')
  })

  it('still flags real unclosed strings in other languages', () => {
    expect(genericAnalysis(`console.log("oops);`)).toContain('字符串没闭合')
  })
})

describe('detectRunawayPython', () => {
  it('blocks obvious infinite loops before Pyodide runs', () => {
    expect(detectRunawayPython('while True: pass')).toContain('明显无退出条件')
    expect(detectRunawayPython('while 1:\n    print("loop")')).toContain('明显无退出条件')
    expect(detectRunawayPython('import itertools\nfor i in itertools.count():\n    print(i)')).toContain('itertools.count')
  })

  it('does not block bounded loops or harmless string/comment text', () => {
    expect(detectRunawayPython('while x < 5:\n    x += 1')).toBeNull()
    expect(detectRunawayPython('print("while True: pass")')).toBeNull()
    expect(detectRunawayPython('# while True: pass\nprint("ok")')).toBeNull()
    expect(detectRunawayPython('while True:\n    if x > 5:\n        break\n    x += 1')).toBeNull()
  })
})
