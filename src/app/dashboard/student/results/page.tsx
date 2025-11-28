'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface FitnessTest {
  id: string
  test_type: string
  score: number
  ai_suggestions: string
  date: string
  video_url: string
}

export default function Results() {
  const { user } = useAuth()
  const router = useRouter()
  const [tests, setTests] = useState<FitnessTest[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchResults()
  }, [user, router])

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('fitness_tests')
        .select('*')
        .eq('student_id', user?.id)
        .order('date', { ascending: false })

      if (error) throw error
      setTests(data || [])
    } catch (error) {
      console.error('Error fetching results:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test result? This action cannot be undone.')) {
      return
    }

    setDeletingId(testId)

    try {
      const { error } = await supabase
        .from('fitness_tests')
        .delete()
        .eq('id', testId)

      if (error) throw error

      // Remove from local state
      setTests(tests.filter(test => test.id !== testId))
      
      alert('Test result deleted successfully!')
    } catch (error) {
      console.error('Error deleting test:', error)
      alert('Error deleting test result. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const getTestName = (testType: string) => {
    const names: { [key: string]: string } = {
      vertical_jump: 'Vertical Jump',
      shuttle_run: 'Shuttle Run',
      sit_ups: 'Sit-ups'
    }
    return names[testType] || testType
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
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
              <h1 className="text-xl font-semibold">My Results</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p>Loading your results...</p>
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500 mb-4">No test results yet.</p>
            <Link 
              href="/dashboard/student/take-test" 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Take Your First Test
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Your Test History ({tests.length} result{tests.length !== 1 ? 's' : ''})
              </h2>
              <button
                onClick={() => {
                  if (confirm('Delete all test results? This cannot be undone.')) {
                    tests.forEach(test => deleteTest(test.id))
                  }
                }}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Delete All
              </button>
            </div>

            {tests.map((test) => (
              <div key={test.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="p-6">
                  {/* Header with Delete Button */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getTestName(test.test_type)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(test.date).toLocaleDateString()} at{' '}
                        {new Date(test.date).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`text-2xl font-bold ${getScoreColor(test.score)}`}>
                        {test.score}/100
                      </span>
                      <button
                        onClick={() => deleteTest(test.id)}
                        disabled={deletingId === test.id}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50 p-2 rounded-full hover:bg-red-50"
                        title="Delete test result"
                      >
                        {deletingId === test.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* AI Feedback */}
                  {test.ai_suggestions && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-blue-800 mb-2">AI Feedback:</h4>
                      <p className="text-blue-700">{test.ai_suggestions}</p>
                    </div>
                  )}

                  {/* Test Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Test Type:</span>
                      <span className="ml-2 text-gray-900 capitalize">
                        {test.test_type.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Status:</span>
                      <span className="ml-2 text-green-600">Completed</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}