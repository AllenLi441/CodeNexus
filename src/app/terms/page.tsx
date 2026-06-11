import type { Metadata } from 'next'
import { InfoPage, InfoSection } from '@/components/layout/info-page'
import { getServerLang } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang()
  return lang === 'en'
    ? { title: 'Terms of Service', description: 'The terms for using CodeNexus.', alternates: { canonical: '/terms' } }
    : { title: '服务条款', description: '使用 CodeNexus 的条款。', alternates: { canonical: '/terms' } }
}

const CONTENT = {
  zh: {
    title: '服务条款',
    updated: '更新于 2026-06-10',
    sections: [
      {
        heading: '服务说明',
        paragraphs: [
          'CodeNexus 是一个编程学习平台，按"现状"提供。我们会尽力保持服务稳定，但不对可用性、准确性作任何保证，功能可能随时调整。',
        ],
      },
      {
        heading: '账号',
        paragraphs: [
          '注册需要一个有效邮箱，用于登录和接收验证邮件。请妥善保管密码；账号下的活动由你本人负责。',
        ],
      },
      {
        heading: '你的内容',
        paragraphs: [
          '你在平台上编写的代码归你所有。当你生成分享链接或发布到公开吐槽墙时，对应内容会对所有人可见；你授权我们为提供服务而展示这些内容。',
        ],
      },
      {
        heading: '可接受的使用',
        paragraphs: [
          '不要利用代码执行环境从事攻击、挖矿、爬取等与学习无关的行为；不要发布违法或侵权内容。我们可能移除滥用内容或限制相关账号。',
        ],
      },
      {
        heading: '条款变更',
        paragraphs: [
          '条款更新后会修改本页顶部的日期。继续使用即视为接受更新后的条款。',
        ],
      },
    ],
  },
  en: {
    title: 'Terms of Service',
    updated: 'Updated 2026-06-10',
    sections: [
      {
        heading: 'The service',
        paragraphs: [
          'CodeNexus is a programming-learning platform provided "as is". We work to keep it stable, but make no guarantees about availability or accuracy, and features may change at any time.',
        ],
      },
      {
        heading: 'Accounts',
        paragraphs: [
          'Signing up requires a valid email address, used for login and verification emails. Keep your password safe; you are responsible for activity under your account.',
        ],
      },
      {
        heading: 'Your content',
        paragraphs: [
          'Code you write on the platform belongs to you. When you create a share link or publish to the public wall, that content becomes visible to everyone; you grant us the right to display it as part of the service.',
        ],
      },
      {
        heading: 'Acceptable use',
        paragraphs: [
          'Do not use the code-execution environments for attacks, mining, scraping, or anything unrelated to learning, and do not publish illegal or infringing content. We may remove abusive content or restrict accounts involved.',
        ],
      },
      {
        heading: 'Changes',
        paragraphs: [
          'When the terms change, the date at the top of this page is updated. Continued use means you accept the updated terms.',
        ],
      },
    ],
  },
} as const

export default async function TermsPage() {
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
