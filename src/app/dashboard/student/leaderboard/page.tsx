'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface LeaderboardEntry {
  student_id: string
  email: string
  sport: string
  total_score: number
  vertical_jump_score: number
  shuttle_run_score: number
  sit_ups_score: number
  rank: number
}

interface TestWithUser {
  student_id: string
  test_type: string
  score: number
  users: {
    email: string
    sport: string
    verified: boolean
  }
}

export default function Leaderboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [sportFilter, setSportFilter] = useState('all')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchLeaderboard()
  }, [user, router, sportFilter])

  const fetchLeaderboard = async () => {
    try {
      // First, get all students with their latest test scores
      const { data: tests, error } = await supabase
        .from('fitness_tests')
        .select(`
          student_id,
          test_type,
          score,
          users!inner (
            email,
            sport,
            verified
          )
        `)
        .eq('users.verified', true) as { data: TestWithUser[] | null, error: any }

      if (error) throw error

      // Process data to calculate combined scores
      const studentScores: { [key: string]: LeaderboardEntry } = {}

      tests?.forEach(test => {
        const studentId = test.student_id
        if (!studentScores[studentId]) {
          studentScores[studentId] = {
            student_id: studentId,
            email: test.users.email,
            sport: test.users.sport,
            total_score: 0,
            vertical_jump_score: 0,
            shuttle_run_score: 0,
            sit_ups_score: 0,
            rank: 0
          }
        }

        // Update individual test scores (take highest score for each test)
        if (test.test_type === 'vertical_jump') {
          studentScores[studentId].vertical_jump_score = Math.max(
            studentScores[studentId].vertical_jump_score,
            test.score
          )
        } else if (test.test_type === 'shuttle_run') {
          studentScores[studentId].shuttle_run_score = Math.max(
            studentScores[studentId].shuttle_run_score,
            test.score
          )
        } else if (test.test_type === 'sit_ups') {
          studentScores[studentId].sit_ups_score = Math.max(
            studentScores[studentId].sit_ups_score,
            test.score
          )
        }
      })

      // Calculate total scores and filter by sport
      let entries = Object.values(studentScores)
        .map(entry => ({
          ...entry,
          total_score: entry.vertical_jump_score + entry.shuttle_run_score + entry.sit_ups_score
        }))
        .filter(entry => sportFilter === 'all' || entry.sport === sportFilter)
        .sort((a, b) => b.total_score - a.total_score)

      // Add ranks
      entries = entries.map((entry, index) => ({
        ...entry,
        rank: index + 1
      }))

      setLeaderboard(entries)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 border-yellow-300'
    if (rank === 2) return 'bg-gray-100 border-gray-300'
    if (rank === 3) return 'bg-orange-100 border-orange-300'
    return 'bg-white border-gray-200'
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return rank
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/student" className="text-blue-600 hover:text-blue-500">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold">Leaderboard</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-lg font-semibold">Top Performers</h2>
              <p className="text-gray-600">See how you rank against other athletes</p>
            </div>
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sports</option>
              <option value="basketball">Basketball</option>
              <option value="football">Football</option>
              <option value="soccer">Soccer</option>
              <option value="track">Track & Field</option>
              <option value="volleyball">Volleyball</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p>Loading leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500">No results found for the selected sport.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.slice(0, 20).map((entry) => (
              <div
                key={entry.student_id}
                className={`border rounded-lg p-4 shadow-sm ${getRankColor(entry.rank)} ${
                  entry.student_id === user.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl font-bold w-8 text-center">
                      {getRankBadge(entry.rank)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">
                          {entry.email}
                          {entry.student_id === user.id && ' (You)'}
                        </span>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {entry.sport}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Vertical Jump: {entry.vertical_jump_score} • 
                        Shuttle Run: {entry.shuttle_run_score} • 
                        Sit-ups: {entry.sit_ups_score}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {entry.total_score}
                    </div>
                    <div className="text-sm text-gray-500">Total Score</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Your Position */}
        {leaderboard.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Position</h3>
            {leaderboard.find(entry => entry.student_id === user.id) ? (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-blue-800">
                    Ranked #{leaderboard.find(entry => entry.student_id === user.id)?.rank} out of {leaderboard.length}
                  </span>
                  <p className="text-blue-600 text-sm mt-1">
                    Keep training to improve your ranking!
                  </p>
                </div>
                <Link 
                  href="/dashboard/student/take-test"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Take New Test
                </Link>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-blue-800 mb-4">You haven't completed all tests yet!</p>
                <Link 
                  href="/dashboard/student/take-test"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Complete Your Tests
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}