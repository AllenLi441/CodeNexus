import type { Metadata, Viewport } from 'next'
import { Outfit, Geist_Mono } from 'next/font/google'
import { cookies } from 'next/headers'
import { Toaster } from '@/components/ui/sonner'
import { ErrorTap } from '@/components/system/error-tap'
import { LanguageProvider } from '@/contexts/language-context'
import { type Lang, LANG_COOKIE, DEFAULT_LANG } from '@/lib/i18n'
import { SITE_URL } from '@/lib/site'
import './globals.css'

const sans = Outfit({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const isEn = cookieStore.get(LANG_COOKIE)?.value === 'en'
  const title = isEn ? 'CodeNexus · AI Coding Hub' : 'CodeNexus · AI 编程中枢'
  const description = isEn
    ? 'CodeNexus is an AI-assisted platform for learning to code from zero — write and run real code right in your browser.'
    : 'CodeNexus 是面向零基础用户的 AI 辅助编程学习平台，浏览器内即时运行代码。'

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: '%s | CodeNexus',
    },
    description,
    openGraph: {
      siteName: 'CodeNexus',
      type: 'website',
      locale: isEn ? 'en_US' : 'zh_CN',
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0b0e13',
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
      className={`dark ${sans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden bg-background text-foreground">
        {/* React hoists these into <head>; warms up the Pyodide CDN handshake */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fastly.jsdelivr.net" />
        <LanguageProvider initialLang={initialLang}>
          {children}
        </LanguageProvider>
        <ErrorTap />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
