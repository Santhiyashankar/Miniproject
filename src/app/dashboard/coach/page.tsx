'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface FitnessTest {
  video_url: string
  score: number
  date: string
}

interface Student {
  id: string
  email: string
  sport: string
  fitness_tests: FitnessTest[]
  has_videos?: boolean
  recent_score?: number
}

export default function CoachDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    verifyCoachRole()
    fetchStudents()
    fetchUnreadCount()
  }, [user, router])

  const verifyCoachRole = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('role, verified')
        .eq('id', user?.id)
        .single()

      if (error || profile?.role !== 'coach' || !profile?.verified) {
        console.log('Not a coach, redirecting to student dashboard')
        router.push('/dashboard/student')
        return
      }
    } catch (error) {
      console.error('Error verifying coach role:', error)
      router.push('/dashboard/student')
    }
  }

  const fetchStudents = async () => {
    try {
      const { data: studentsData, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          sport,
          fitness_tests (
            video_url,
            score,
            date
          )
        `)
        .eq('role', 'student')
        .eq('verified', true)
        .limit(5)

      if (error) throw error
      
     
      const studentsWithVideos = (studentsData || []).map(student => ({
        ...student,
        has_videos: student.fitness_tests?.some((test: FitnessTest) => test.video_url),
        recent_score: student.fitness_tests?.[0]?.score || 0
      }))
      
      setStudents(studentsWithVideos)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    if (!user) return
    
    try {
     
      const { data: unreadReplies, error } = await supabase
        .from('contacts')
        .select('id')
        .eq('coach_id', user.id)
        .eq('is_from_coach', false) 
        .eq('read', false) 

      if (error) {
        console.error('Error fetching unread count:', error)
        setUnreadCount(0)
        return
      }

      setUnreadCount(unreadReplies?.length || 0)
    } catch (error) {
      console.error('Error fetching unread count:', error)
      setUnreadCount(0)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">AthleteIQ Coach</h1>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <Link 
                    href="/dashboard/coach" 
                    className="bg-gray-100 text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/dashboard/coach/students" 
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    View Students
                  </Link>
                  <Link 
                    href="/dashboard/coach/leaderboard" 
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Leaderboard
                  </Link>
                  <Link 
                    href="/dashboard/coach/contact" 
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Contact Students
                  </Link>
                  <Link 
                    href="/dashboard/coach/inbox" 
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium relative"
                  >
                    Inbox
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Coach Dashboard</span>
              <button 
                onClick={() => supabase.auth.signOut()}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      
      <div className="md:hidden bg-white border-b">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <div className="flex space-x-4 overflow-x-auto pb-2">
            <Link href="/dashboard/coach" className="bg-gray-100 text-gray-900 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap">
              Dashboard
            </Link>
            <Link href="/dashboard/coach/students" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap">
              View Students
            </Link>
            <Link href="/dashboard/coach/leaderboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap">
              Leaderboard
            </Link>
            <Link href="/dashboard/coach/contact" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap">
              Contact
            </Link>
            <Link href="/dashboard/coach/inbox" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap relative">
              Inbox
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Coach Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage and discover talented athletes.
          </p>
        </div>

     
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-4 sm:px-0">
          <Link 
            href="/dashboard/coach/students" 
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xl">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">View Students</h3>
                <p className="text-gray-600 text-sm">Browse all athletes</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/dashboard/coach/leaderboard" 
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-xl">🏆</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Leaderboard</h3>
                <p className="text-gray-600 text-sm">Discover top performers</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/dashboard/coach/contact" 
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-xl">✉️</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact</h3>
                <p className="text-gray-600 text-sm">Reach out to athletes</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/dashboard/coach/inbox" 
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 text-xl">💬</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center transform translate-x-1 -translate-y-1">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Message Inbox</h3>
                <p className="text-gray-600 text-sm">
                  {unreadCount > 0 ? `${unreadCount} new replies` : 'View student replies'}
                </p>
              </div>
            </div>
          </Link>
        </div>

       
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-4 sm:px-0">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xl">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{students.length}</h3>
                <p className="text-gray-600 text-sm">Total Students</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-xl">🎬</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {students.filter(s => s.has_videos).length}
                </h3>
                <p className="text-gray-600 text-sm">Students with Videos</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-xl">💬</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{unreadCount}</h3>
                <p className="text-gray-600 text-sm">Unread Replies</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Students</h2>
            <Link 
              href="/dashboard/coach/students" 
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              View All →
            </Link>
            // In your recent students section:









          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">👥</div>
                <p className="text-gray-500">No students registered yet.</p>
                <p className="text-gray-400 text-sm mt-1">Students will appear here once they register and complete tests.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((student) => (
                  <div key={student.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-900 truncate">{student.email}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-gray-500 capitalize">{student.sport}</p>
                      {student.has_videos && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          Videos
                        </span>
                      )}
                    </div>
           
                    {student.recent_score !== undefined && student.recent_score > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        Recent Score: <span className="font-semibold">{student.recent_score}</span>
                      </p>
                    )}
                    <Link 
                      href={`/dashboard/coach/students/${student.id}`}
                      className="inline-block mt-2 text-blue-600 hover:text-blue-500 text-sm font-medium"
                    >
                      View Performance →Videos 
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}