'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { useLanguage } from '@/contexts/language-context'
import { login, register } from '@/app/(auth)/actions'
import { BrandHeader } from '@/components/layout/logo'

type Mode = 'login' | 'register'
type ActionState = { error?: string; needsConfirmation?: boolean } | null

export function AuthForm({ mode, initialError }: { mode: Mode; initialError?: string }) {
  const { t } = useLanguage()
  const isLogin = mode === 'login'
  const strings = isLogin ? t.auth.login : t.auth.register

  const [state, action, isPending] = useActionState<ActionState, FormData>(
    isLogin ? login : register,
    null
  )

  // Email confirmation screen
  if (state?.needsConfirmation) {
    return (
      <div className="flex min-h-[100dvh] items-start justify-center overflow-y-auto bg-background px-4 py-6 sm:items-center sm:py-8">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="inline-flex justify-center mb-2">
            <BrandHeader />
          </div>
          <Card className="shadow-lg border-border/60">
            <CardContent className="pt-8 pb-8 space-y-4">
              <div className="text-5xl">📬</div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">{t.auth.confirmTitle}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t.auth.confirmDesc}
                  <br />
                  {t.auth.confirmSub}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg px-4 py-3 text-xs text-muted-foreground">
                {t.auth.noEmailHint}
              </div>
              <Link href="/register">
                <Button variant="outline" className="w-full mt-2">
                  {t.auth.backToRegister}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] items-start justify-center overflow-y-auto bg-background px-4 py-5 sm:items-center sm:py-8">
      <div className="w-full max-w-md space-y-4 sm:space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex justify-center mb-2">
            <BrandHeader />
          </div>
          <p className="text-sm text-muted-foreground">{t.auth.tagline}</p>
        </div>

        <Card className="shadow-lg border-border/60">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex flex-col gap-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
              <CardTitle className="text-xl">{strings.title}</CardTitle>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <span>{t.nav.language}:</span>
                <LanguageToggle variant="minimal" />
              </div>
            </div>
            <CardDescription>{strings.desc}</CardDescription>
          </CardHeader>

          <form action={action}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.auth.emailLabel}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete={isLogin ? 'username' : 'email'}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.auth.passwordLabel}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={isLogin ? t.auth.passwordPlaceholderLogin : t.auth.passwordPlaceholderRegister}
                  required
                  minLength={6}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  className="h-11"
                />
              </div>

              {(state?.error || initialError) && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {state?.error ?? initialError}
                </p>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button type="submit" className="w-full h-11 font-semibold" disabled={isPending}>
                {isPending ? t.auth.loading : strings.submit}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                {strings.switchText}{' '}
                <Link
                  href={isLogin ? '/register' : '/login'}
                  className="font-medium text-primary hover:underline underline-offset-4"
                >
                  {strings.switchLink}
                </Link>
              </p>

              <Link
                href="/play"
                className="text-sm font-medium text-primary hover:underline underline-offset-4"
              >
                先不注册，试玩第一关
              </Link>
            </CardFooter>
          </form>
        </Card>

        <p className="px-2 text-center text-xs leading-relaxed text-muted-foreground sm:px-4">{t.auth.terms}</p>
      </div>
    </div>
  )
}
