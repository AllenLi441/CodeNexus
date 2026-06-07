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

  // Broadened guard (audit SBX-2): catch the bypasses that froze/crashed the tab.
  it('blocks non-literal constant-truthy while conditions', () => {
    expect(detectRunawayPython('while 2:\n    print("x")')).toContain('恒真条件')
    expect(detectRunawayPython('while 1 == 1:\n    print("x")')).toContain('恒真条件')
    expect(detectRunawayPython('while not False:\n    print("x")')).toContain('恒真条件')
    // audit fix: parenthesized / no-space constant-truthy conditions must not bypass detection
    expect(detectRunawayPython('while (True):\n    print("x")')).toContain('恒真条件')
    expect(detectRunawayPython('while(True):\n    print("x")')).toContain('恒真条件')
  })

  it('blocks astronomically large range() loop bombs', () => {
    expect(detectRunawayPython('for i in range(10**12):\n    pass')).toContain('天文数字')
    expect(detectRunawayPython('for i in range(100000000000):\n    pass')).toContain('天文数字')
  })

  it('blocks list/string memory bombs', () => {
    expect(detectRunawayPython('x = [0] * 10**12')).toContain('巨大的倍数')
  })

  it('blocks self-recursion with no base case', () => {
    expect(detectRunawayPython('def f():\n    f()')).toContain('无限递归')
  })

  it('does NOT flag bounded ranges or correct recursion (no new false alarms)', () => {
    expect(detectRunawayPython('for i in range(100):\n    print(i)')).toBeNull()
    expect(detectRunawayPython('nums = [0] * 100')).toBeNull()
    expect(detectRunawayPython('while 0:\n    print("never")')).toBeNull()
    expect(
      detectRunawayPython('def fib(n):\n    if n < 2:\n        return n\n    return fib(n-1) + fib(n-2)')
    ).toBeNull()
  })
})
