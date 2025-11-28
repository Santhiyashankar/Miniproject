'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const fetchUserRole = async () => {
      try {
        console.log('🔍 DEBUG: Fetching role for user:', user.id)
        
        const { data: profile, error } = await supabase
          .from('users')
          .select('role, verified')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('❌ Error fetching user role:', error)
          router.push('/dashboard/student')
          return
        }

        console.log('📋 DEBUG: User profile:', profile)

        if (profile?.role === 'coach' && profile?.verified) {
          console.log('🎯 DEBUG: Redirecting to COACH dashboard')
          router.push('/dashboard/coach')
        } else {
          console.log('👨‍🎓 DEBUG: Redirecting to STUDENT dashboard')
          router.push('/dashboard/student')
        }
      } catch (error) {
        console.error('❌ Error in dashboard router:', error)
        router.push('/dashboard/student')
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [user, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  )
}