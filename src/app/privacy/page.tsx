import type { Metadata } from 'next'
import { InfoPage, InfoSection } from '@/components/layout/info-page'
import { getServerLang } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang()
  return lang === 'en'
    ? { title: 'Privacy Policy', description: 'What data CodeNexus collects and how it is used.', alternates: { canonical: '/privacy' } }
    : { title: '隐私政策', description: 'CodeNexus 收集哪些数据，以及如何使用。', alternates: { canonical: '/privacy' } }
}

const CONTENT = {
  zh: {
    title: '隐私政策',
    updated: '更新于 2026-06-10',
    sections: [
      {
        heading: '我们收集什么',
        paragraphs: [
          '注册账号时：邮箱地址。使用过程中：学习进度、成就、个人设置，以及你主动公开的分享内容（代码片段、标题、语录）。',
          '我们不出售你的数据，也不投放广告。',
        ],
      },
      {
        heading: '数据存储在哪里',
        paragraphs: [
          '账号和学习数据存储在云端数据库，传输全程加密（HTTPS）。',
          '语言偏好通过 Cookie 记录；代码草稿和你自己填写的 AI API Key 只保存在你浏览器的本地存储里。调用 AI 时，Key 会随请求经我们的服务器转发给所配置的 AI 服务商，我们不会记录或存储它。',
        ],
      },
      {
        heading: '代码执行',
        paragraphs: [
          'Python 代码完全在你的浏览器内运行，不会离开你的设备。',
          '编译型语言（C、C++、Java、C#）在云端环境运行时，代码会发送到第三方远程沙箱编译执行。请不要在代码里包含个人隐私信息。',
        ],
      },
      {
        heading: 'AI 对话',
        paragraphs: [
          '你发给 AI 助手的消息会发送到所配置的 AI 服务商以生成回复。试玩模式使用你自己提供的 API Key，该 Key 只保存在你的浏览器里，仅在请求时经服务器转发、不被记录或存储。',
        ],
      },
      {
        heading: '删除数据',
        paragraphs: [
          '如需删除账号及全部数据，请在 GitHub 仓库（github.com/AllenLi441/CodeNexus）提交 Issue，我们会在合理时间内处理。',
        ],
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    updated: 'Updated 2026-06-10',
    sections: [
      {
        heading: 'What we collect',
        paragraphs: [
          'When you sign up: your email address. As you learn: progress, achievements, personal settings, and anything you choose to share publicly (code snippets, titles, quotes).',
          'We do not sell your data and we do not show ads.',
        ],
      },
      {
        heading: 'Where data lives',
        paragraphs: [
          'Account and learning data are stored in a cloud database, encrypted in transit (HTTPS).',
          'Your language preference is kept in a cookie; code drafts and any AI API key you enter are stored only in your browser’s local storage. When you talk to the AI, the key travels with that request through our server to the configured AI provider — we never log or store it.',
        ],
      },
      {
        heading: 'Code execution',
        paragraphs: [
          'Python code runs entirely inside your browser and never leaves your device.',
          'When compiled languages (C, C++, Java, C#) run in the cloud environment, your code is sent to a third-party remote sandbox to compile and execute. Do not include personal information in code.',
        ],
      },
      {
        heading: 'AI conversations',
        paragraphs: [
          'Messages you send to the AI assistant are forwarded to the configured AI provider to generate replies. Trial mode uses your own API key, which is stored only in your browser and forwarded per-request — never logged or stored on our side.',
        ],
      },
      {
        heading: 'Deleting your data',
        paragraphs: [
          'To delete your account and all associated data, open an issue on GitHub (github.com/AllenLi441/CodeNexus) and we will handle it within a reasonable time.',
        ],
      },
    ],
  },
} as const

export default async function PrivacyPage() {
  const lang = await getServerLang()
  const content = CONTENT[lang]
  return (
    <InfoPage lang={lang} title={content.title} updated={content.updated}>
      {content.sections.map((s) => (
        <InfoSection key={s.heading} heading={s.heading} paragraphs={[...s.paragraphs]} />
      ))}
    </InfoPage>
  )
}
