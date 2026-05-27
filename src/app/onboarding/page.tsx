import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingClient } from './onboarding-client'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Already completed onboarding
  if (user.user_metadata?.onboarding_completed) {
    redirect('/dashboard')
  }

  return <OnboardingClient />
}
