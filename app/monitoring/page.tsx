import { redirect } from 'next/navigation'

import { getCurrentUser, getUserPlan } from '@/lib/auth'
import MonitoringDashboard from './MonitoringDashboard'

export const dynamic = 'force-dynamic'

export default async function MonitoringPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent('/monitoring')}`)
  }

  const plan = await getUserPlan(user.id)
  if (plan !== 'ultimate') {
    redirect('/dashboard')
  }

  return <MonitoringDashboard />
}
