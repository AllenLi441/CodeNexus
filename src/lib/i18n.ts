import { EN_MAP } from './i18n-en'

export type Lang = 'zh' | 'en'
export const LANG_COOKIE = 'zf-lang'
export const DEFAULT_LANG: Lang = 'zh'

// zh→en lookup. The Chinese string is the key; a missing key falls back to the
// Chinese, so partial coverage is always safe. Use this everywhere display text
// needs to switch language (client via useTr(), server via translate(s, lang)).
export function translate(zh: string, lang: Lang): string {
  return lang === 'en' ? (EN_MAP[zh] ?? zh) : zh
}

const t = {
  zh: {
    auth: {
      tagline: '编程，从零开始，触手可及。',
      emailLabel: '邮箱地址',
      passwordLabel: '密码',
      passwordPlaceholderLogin: '输入密码',
      passwordPlaceholderRegister: '至少 6 位字符',
      loading: '处理中...',
      login: {
        title: '欢迎回来',
        desc: '登录后继续你的编程学习之旅',
        submit: '登录',
        switchText: '还没有账号？',
        switchLink: '免费注册',
      },
      register: {
        title: '创建账号',
        desc: '注册即可免费开始学习多语言编程',
        submit: '注册并开始',
        switchText: '已有账号？',
        switchLink: '立即登录',
      },
      confirmTitle: '请验证你的邮箱',
      confirmDesc: '我们已向 {email} 发送了一封确认邮件。',
      confirmSub: '点击邮件中的链接后即可开始学习。',
      backToRegister: '← 返回注册页',
      noEmailHint: '没有收到邮件？检查垃圾邮件文件夹，或等待几分钟后重试。',
    },
    nav: {
      logout: '退出',
      back: '← 返回',
      run: '▶ 运行',
      running: '运行中',
      ready: '就绪',
      settings: '设置',
      language: '语言',
    },
    dashboard: {
      greeting: (name: string) => `你好，${name} 👋`,
      noProgress: '开始你的 CodeNexus 编程之旅 ⚡',
      allDone: '所有关卡已通关！你完成了核心路径。',
      progress: (done: number, total: number) => `已完成 ${done} / ${total} 关卡，继续学习！`,
      progressTitle: '基础进度',
      progressSub: (done: number, total: number) => `已完成 ${done} / ${total} 个基础节点`,
      continueTitle: '继续学习',
      continueSub: (n: number) => `进入 Lv.${n} 编程实验室`,
      continueBtn: '进入 →',
      quote: '"别问天赋，先把第一个 print() 写对。"',
      quoteAuthor: '— CodeNexus',
    },
    workshop: {
      back: '← 返回',
      run: '▶ 运行',
      running: '运行中',
      graphicsLoading: '📦 载入绘图库...',
      ready: '就绪',
      cmdHint: '⌘+Enter 运行',
      clearOutput: '清空',
      share: '分享',
      guide: '攻略',
      anvil: '编码台',
      output: '结果',
    },
  },
  en: {
    auth: {
      tagline: 'Code from zero. Within reach.',
      emailLabel: 'Email address',
      passwordLabel: 'Password',
      passwordPlaceholderLogin: 'Enter password',
      passwordPlaceholderRegister: 'At least 6 characters',
      loading: 'Loading...',
      login: {
        title: 'Welcome back',
        desc: 'Log in to continue your coding journey',
        submit: 'Log in',
        switchText: "Don't have an account?",
        switchLink: 'Sign up free',
      },
      register: {
        title: 'Create account',
        desc: 'Sign up to start learning programming languages for free',
        submit: 'Sign up & start',
        switchText: 'Already have an account?',
        switchLink: 'Log in',
      },
      confirmTitle: 'Verify your email',
      confirmDesc: "We've sent a confirmation email to {email}.",
      confirmSub: 'Click the link in the email to get started.',
      backToRegister: '← Back to sign up',
      noEmailHint: "Didn't receive it? Check your spam folder or try again in a few minutes.",
    },
    nav: {
      logout: 'Log out',
      back: '← Back',
      run: '▶ Run',
      running: 'Running',
      ready: 'Ready',
      settings: 'Settings',
      language: 'Language',
    },
    dashboard: {
      greeting: (name: string) => `Hello, ${name} 👋`,
      noProgress: 'Start your CodeNexus journey ⚡',
      allDone: 'All levels complete. Core path cleared.',
      progress: (done: number, total: number) => `Completed ${done} / ${total} levels — keep going!`,
      progressTitle: 'Foundation progress',
      progressSub: (done: number, total: number) => `${done} / ${total} foundation nodes complete`,
      continueTitle: 'Continue Learning',
      continueSub: (n: number) => `Enter Lv.${n} Lab`,
      continueBtn: 'Enter →',
      quote: '"Get the first print() right before asking about talent."',
      quoteAuthor: '— CodeNexus',
    },
    workshop: {
      back: '← Back',
      run: '▶ Run',
      running: 'Running',
      graphicsLoading: '📦 Loading graphics...',
      ready: 'Ready',
      cmdHint: '⌘+Enter to run',
      clearOutput: 'Clear',
      share: 'Share',
      guide: 'Guide',
      anvil: 'Editor',
      output: 'Output',
    },
  },
} as const

export type Translations = typeof t.zh
export { t as TRANSLATIONS }
