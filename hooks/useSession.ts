'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useSession() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
      router.refresh() // Refresh server components
    })

    return () => subscription.unsubscribe()
  }, [router])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  }
}

