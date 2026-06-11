import type { Metadata } from 'next'
import { AuthForm } from '@/components/auth/auth-form'
import { getServerLang } from '@/lib/i18n-server'
import { translate } from '@/lib/i18n'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang()
  return { title: lang === 'en' ? 'Log in' : '登录' }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const lang = await getServerLang()
  const initialError = error === 'auth_callback'
    ? translate('确认链接已失效或和当前设备地址不匹配。请重新注册/登录，并确保邮件链接回到同一个站点。', lang)
    : undefined

  return <AuthForm mode="login" initialError={initialError} />
}
