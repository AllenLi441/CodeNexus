'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

// useActionState calls the action as (prevState, formData) — both params are required.
type ActionState = { error?: string; needsConfirmation?: boolean } | null

function readableAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const cause = error && typeof error === 'object' && 'cause' in error
    ? (error as { cause?: { code?: string; hostname?: string } }).cause
    : undefined

  if (
    message === 'fetch failed' ||
    cause?.code === 'ENOTFOUND' ||
    cause?.code === 'ECONNREFUSED' ||
    cause?.code === 'ETIMEDOUT'
  ) {
    console.error('[auth] service unreachable:', message, cause?.code)
    return '认证服务暂时连接不上，请稍后再试。'
  }

  // Map known Supabase errors to stable strings the i18n layer can translate;
  // log and genericize the rest instead of echoing vendor internals to users.
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) return '邮箱或密码不对。'
  if (lower.includes('already registered')) return '这个邮箱已经注册过了。'
  if (lower.includes('email not confirmed')) return '邮箱还没验证，先去收件箱点确认链接。'
  if (lower.includes('rate limit')) return '尝试次数过多，请稍后再试。'
  if (lower.includes('password should be')) return '密码至少需要 6 位字符。'

  console.error('[auth] unmapped auth error:', message)
  return '请求失败，请稍后再试。'
}

async function getRequestOrigin() {
  const headerStore = await headers()
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL

  if (configuredUrl) {
    const value = configuredUrl.startsWith('http') ? configuredUrl : `https://${configuredUrl}`
    return value.replace(/\/$/, '')
  }

  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
  const proto = headerStore.get('x-forwarded-proto') ?? 'http'
  if (host) return `${proto}://${host}`

  const origin = headerStore.get('origin')
  return origin ? origin.replace(/\/$/, '') : 'http://localhost:3000'
}

export async function login(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  if (!(formData instanceof FormData)) {
    return { error: '表单数据无效，请刷新页面后重试。' }
  }

  const email = formData.get('email')
  const password = formData.get('password')

  if (!email || !password) {
    return { error: '请填写邮箱和密码。' }
  }

  const supabase = await createClient()
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email as string,
      password: password as string,
    })

    if (error) return { error: readableAuthError(error) }
  } catch (error) {
    return { error: readableAuthError(error) }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function register(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  if (!(formData instanceof FormData)) {
    return { error: '表单数据无效，请刷新页面后重试。' }
  }

  const email = formData.get('email')
  const password = formData.get('password')

  if (!email || !password) {
    return { error: '请填写邮箱和密码。' }
  }

  const supabase = await createClient()
  const origin = await getRequestOrigin()
  let data
  try {
    const result = await supabase.auth.signUp({
      email: email as string,
      password: password as string,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
      },
    })
    data = result.data

    if (result.error) return { error: readableAuthError(result.error) }
  } catch (error) {
    return { error: readableAuthError(error) }
  }

  // When email confirmation is enabled, session is null — user must confirm first.
  if (!data.session) {
    return { needsConfirmation: true }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
