import { AuthForm } from '@/components/auth/auth-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const initialError = error === 'auth_callback'
    ? '确认链接已失效或和当前设备地址不匹配。请重新注册/登录，并确保邮件链接回到同一个站点。'
    : undefined

  return <AuthForm mode="login" initialError={initialError} />
}
