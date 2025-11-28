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
  test_count: number
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

export default function CoachLeaderboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [sportFilter, setSportFilter] = useState('all')
  const [testFilter, setTestFilter] = useState('all')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchLeaderboard()
  }, [user, router, sportFilter])

  const fetchLeaderboard = async () => {
    try {
      // Get all verified students with their test data
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

      // Process data to calculate scores
      const studentScores: { [key: string]: LeaderboardEntry } = {}
      const studentTestCounts: { [key: string]: number } = {}

      tests?.forEach(test => {
        const studentId = test.student_id
        
        // Count tests per student
        studentTestCounts[studentId] = (studentTestCounts[studentId] || 0) + 1

        if (!studentScores[studentId]) {
          studentScores[studentId] = {
            student_id: studentId,
            email: test.users.email,
            sport: test.users.sport,
            total_score: 0,
            vertical_jump_score: 0,
            shuttle_run_score: 0,
            sit_ups_score: 0,
            rank: 0,
            test_count: 0
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
          total_score: entry.vertical_jump_score + entry.shuttle_run_score + entry.sit_ups_score,
          test_count: studentTestCounts[entry.student_id] || 0
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
    return `#${rank}`
  }

  const getDisplayScore = (entry: LeaderboardEntry) => {
    if (testFilter === 'vertical_jump') return entry.vertical_jump_score
    if (testFilter === 'shuttle_run') return entry.shuttle_run_score
    if (testFilter === 'sit_ups') return entry.sit_ups_score
    return entry.total_score
  }

  const getTestName = (testType: string) => {
    const names: { [key: string]: string } = {
      vertical_jump: 'Vertical Jump',
      shuttle_run: 'Shuttle Run',
      sit_ups: 'Sit-ups',
      all: 'Combined Score'
    }
    return names[testType] || testType
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/coach" className="text-blue-600 hover:text-blue-500">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold">Athlete Leaderboard</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Sport
              </label>
              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sports</option>
                <option value="basketball">Basketball</option>
                <option value="football">Football</option>
                <option value="soccer">Soccer</option>
                <option value="track">Track & Field</option>
                <option value="volleyball">Volleyball</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Score Type
              </label>
              <select
                value={testFilter}
                onChange={(e) => setTestFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Combined Score</option>
                <option value="vertical_jump">Vertical Jump</option>
                <option value="shuttle_run">Shuttle Run</option>
                <option value="sit_ups">Sit-ups</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p>Loading leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500">No results found for the selected filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top 3 Cards */}
            {leaderboard.slice(0, 3).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {leaderboard.slice(0, 3).map((entry, index) => (
                  <div
                    key={entry.student_id}
                    className={`border-2 rounded-lg p-6 text-center ${getRankColor(entry.rank)}`}
                  >
                    <div className="text-4xl mb-2">{getRankBadge(entry.rank)}</div>
                    <h3 className="font-semibold text-lg mb-1">{entry.email}</h3>
                    <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full inline-block mb-2">
                      {entry.sport}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {getDisplayScore(entry)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {getTestName(testFilter)}
                    </div>
                    <div className="mt-3">
                      <Link
                        href={`/dashboard/coach/students/${entry.student_id}`}
                        className="text-blue-600 hover:text-blue-500 text-sm"
                      >
                        View Profile →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Rest of Leaderboard */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">
                  Full Leaderboard ({leaderboard.length} athletes)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Athlete
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sport
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tests
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vertical Jump
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shuttle Run
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sit-ups
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaderboard.map((entry) => (
                      <tr key={entry.student_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            {getRankBadge(entry.rank)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {entry.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {entry.sport}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{entry.test_count}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{entry.vertical_jump_score}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{entry.shuttle_run_score}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{entry.sit_ups_score}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{entry.total_score}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/dashboard/coach/students/${entry.student_id}`}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            View
                          </Link>
                          <Link
                            href={`/dashboard/coach/contact?student=${entry.student_id}`}
                            className="text-green-600 hover:text-green-900"
                          >
                            Contact
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}