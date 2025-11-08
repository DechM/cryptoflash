import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import MonitoringDashboard from './MonitoringDashboard'

export const dynamic = 'force-dynamic'

export default async function MonitoringPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent('/monitoring')}`)
  }

  if (!isAdminEmail(user.email)) {
    redirect('/dashboard')
  }

  return <MonitoringDashboard />
}
