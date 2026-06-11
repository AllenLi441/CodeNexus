import type { Metadata } from 'next'
import { InfoPage, InfoSection } from '@/components/layout/info-page'
import { getServerLang } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang()
  return lang === 'en'
    ? { title: 'About', description: 'What CodeNexus is and how it works.', alternates: { canonical: '/about' } }
    : { title: '关于', description: 'CodeNexus 是什么，以及它如何工作。', alternates: { canonical: '/about' } }
}

const CONTENT = {
  zh: {
    title: '关于 CodeNexus',
    sections: [
      {
        heading: '这是什么',
        paragraphs: [
          'CodeNexus 是一个 AI 辅助的编程学习平台：课程讲解、代码编辑器、真实运行结果和 AI 助手在同一个工作台里。不是把视频搬进网页，而是让你边理解边动手。',
          '无需注册即可试玩。注册后会保存学习进度、成就和个性化路线。',
        ],
      },
      {
        heading: '代码如何运行',
        paragraphs: [
          'Python 通过 WebAssembly 直接在你的浏览器里真实运行，不需要安装任何环境。',
          'C、C++、Java、C# 等编译型语言的代码会发送到服务器编译运行（生产环境使用远程沙箱）；JavaScript 由服务端 Node.js 运行。',
        ],
      },
      {
        heading: '开源与反馈',
        paragraphs: [
          '项目代码以 MIT 许可证开源。问题反馈、功能建议欢迎到 GitHub 仓库提 Issue：github.com/AllenLi441/CodeNexus。',
        ],
      },
    ],
  },
  en: {
    title: 'About CodeNexus',
    sections: [
      {
        heading: 'What this is',
        paragraphs: [
          'CodeNexus is an AI-assisted platform for learning to code: lessons, a code editor, real run results, and an AI assistant all live in one workspace. It is not videos moved onto a web page — you understand while you do.',
          'You can try it without signing up. An account saves your progress, achievements, and personalized learning route.',
        ],
      },
      {
        heading: 'How code runs',
        paragraphs: [
          'Python runs for real inside your browser via WebAssembly — no setup required.',
          'Compiled languages (C, C++, Java, C#) are sent to a server to compile and run (a remote sandbox in production); JavaScript runs on server-side Node.js.',
        ],
      },
      {
        heading: 'Open source & feedback',
        paragraphs: [
          'The code is open source under the MIT license. For bug reports and feature requests, open an issue on GitHub: github.com/AllenLi441/CodeNexus.',
        ],
      },
    ],
  },
} as const

export default async function AboutPage() {
  const lang = await getServerLang()
  const content = CONTENT[lang]
  return (
    <InfoPage lang={lang} title={content.title}>
      {content.sections.map((s) => (
        <InfoSection key={s.heading} heading={s.heading} paragraphs={[...s.paragraphs]} />
      ))}
    </InfoPage>
  )
}
