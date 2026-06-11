import type { Metadata } from 'next'
import { AuthForm } from '@/components/auth/auth-form'
import { getServerLang } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang()
  return { title: lang === 'en' ? 'Sign up' : '注册' }
}

export default function RegisterPage() {
  return <AuthForm mode="register" />
}
