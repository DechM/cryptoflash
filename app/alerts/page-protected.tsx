'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/useSession'
import AlertsPageContent from './alerts-content'

export default function AlertsPage() {
  const router = useRouter()
  const { user, loading } = useSession()

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?next=${encodeURIComponent('/alerts')}`)
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00ff88] mx-auto mb-4"></div>
          <p className="text-[#b8c5d6]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Redirect will happen
  }

  return <AlertsPageContent />
}

