'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface FitnessTest {
  id: string
  test_type: string
  video_url: string
  score: number
  ai_suggestions: string
  date: string
}

interface Student {
  id: string
  email: string
  sport: string
}

export default function StudentDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string
  
  const [student, setStudent] = useState<Student | null>(null)
  const [tests, setTests] = useState<FitnessTest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchStudentData()
  }, [user, studentId])

  const fetchStudentData = async () => {
    try {
    
      const { data: studentData, error: studentError } = await supabase
        .from('users')
        .select('id, email, sport')
        .eq('id', studentId)
        .single()

      if (studentError) throw studentError
      setStudent(studentData)

  
      const { data: testsData, error: testsError } = await supabase
        .from('fitness_tests')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false })

      if (testsError) throw testsError
      setTests(testsData || [])

    } catch (error) {
      console.error('Error fetching student data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Student not found</h2>
          <Link href="/dashboard/coach/students" className="text-blue-600 hover:text-blue-500">
            ← Back to Students
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/coach/students" className="text-blue-600 hover:text-blue-500">
                ← Back to Students
              </Link>
              <h1 className="text-xl font-semibold">Student Performance</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{student.email}</h2>
          <p className="text-gray-600 capitalize">Sport: {student.sport}</p>
          <p className="text-gray-600">Total Tests: {tests.length}</p>
        </div>

        
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900">Performance Tests</h3>
          
          {tests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-gray-400 text-4xl mb-4">🎬</div>
              <p className="text-gray-500">No tests completed yet.</p>
              <p className="text-gray-400 text-sm mt-1">Tests will appear here once the student completes them.</p>
            </div>
          ) : (
            tests.map((test) => (
              <div key={test.id} className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 capitalize">
                        {test.test_type.replace('_', ' ')}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {new Date(test.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{test.score}</p>
                      <p className="text-sm text-gray-500">Score</p>
                    </div>
                  </div>

                  {/* Video Section */}
                  {test.video_url ? (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Performance Video</h5>
                      <div className="bg-black rounded-lg overflow-hidden">
                        <video 
                          controls 
                          className="w-full max-w-2xl mx-auto"
                          preload="metadata"
                        >
                          <source src={test.video_url} type="video/mp4" />
                          <source src={test.video_url} type="video/webm" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                      <div className="mt-2 flex space-x-2">
                        <a 
                          href={test.video_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-500 text-sm"
                        >
                          Open video in new tab →
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-sm">No video submitted for this test</p>
                    </div>
                  )}

                 
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">AI Analysis</h5>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 text-sm">{test.ai_suggestions}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}