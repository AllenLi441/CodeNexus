import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { cookies } from 'next/headers'
import { Toaster } from '@/components/ui/sonner'
import { ErrorTap } from '@/components/system/error-tap'
import { LanguageProvider } from '@/contexts/language-context'
import { type Lang, LANG_COOKIE, DEFAULT_LANG } from '@/lib/i18n'
import './globals.css'

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'CodeNexus · AI 编程中枢',
  description: 'CodeNexus 是面向零基础用户的 AI 辅助编程学习平台，浏览器内即时运行代码。',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const rawLang = cookieStore.get(LANG_COOKIE)?.value
  const initialLang: Lang = rawLang === 'en' || rawLang === 'zh' ? rawLang : DEFAULT_LANG

  return (
    <html
      lang={initialLang === 'zh' ? 'zh-CN' : 'en'}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden bg-black text-white">
        <LanguageProvider initialLang={initialLang}>
          {children}
        </LanguageProvider>
        <ErrorTap />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
