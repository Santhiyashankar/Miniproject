'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Student {
  id: string
  email: string
  sport: string
  total_score: number
}


function ContactContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedStudent = searchParams.get('student')

  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>(preSelectedStudent || '')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchStudents()
  }, [user, router])

  const fetchStudents = async () => {
    try {
      const { data: studentsData, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          sport,
          fitness_tests (
            score
          )
        `)
        .eq('role', 'student')
        .eq('verified', true)

      if (error) throw error

      const processedStudents: Student[] = studentsData.map(student => {
        const tests = student.fitness_tests || []
        const totalScore = tests.length > 0 
          ? Math.round(tests.reduce((sum: number, test: any) => sum + test.score, 0) / tests.length)
          : 0

        return {
          id: student.id,
          email: student.email,
          sport: student.sport,
          total_score: totalScore
        }
      }).sort((a, b) => b.total_score - a.total_score)

      setStudents(processedStudents)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!selectedStudent || !message.trim() || !user) return

  setSending(true)

  try {
    console.log('Sending message to student:', selectedStudent)
    

    const { data, error } = await supabase
      .from('contacts')
      .insert([
        {
          coach_id: user.id,
          student_id: selectedStudent,
          message: message.trim(),
          read: false
        }
      ])
      .select()

    if (error) {
      console.error('Supabase error details:', error)
      throw error
    }

    console.log('Message sent successfully:', data)
    setSent(true)
    setMessage('')
    setSelectedStudent('')
    
    setTimeout(() => setSent(false), 5000)
  } catch (error: any) {
    console.error('Full error:', error)
    alert('Error sending message: ' + error.message)
  } finally {
    setSending(false)
  }
}
  
  

  

  
  





  
  
  
  
  
  
  

  
  
  
  

  
  
  
  
  
  
  
  
  
  
  
  
  
  

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
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
              <h1 className="text-xl font-semibold">Contact Students</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {sent && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-green-600 text-lg mr-3">✓</div>
              <div>
                <h3 className="text-green-800 font-semibold">Message Sent!</h3>
                <p className="text-green-700">Your message has been sent to the student.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Send Message</h2>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Student
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose a student...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.email} ({student.sport}) - Avg: {student.total_score}/100
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  placeholder="Introduce yourself and explain why you're interested in this student. Include your contact information for them to respond."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!selectedStudent || !message.trim() || sending}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? 'Sending...' : 'Send Message to Student'}
              </button>
            </form>
          </div>

          {/* Student List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Top Performing Students</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">👥</div>
                <p className="text-gray-500">No students available.</p>
                <p className="text-gray-400 text-sm mt-1">Students need to complete tests to appear here.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {students.slice(0, 10).map((student) => (
                  <div
                    key={student.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedStudent === student.id ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedStudent(student.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{student.email}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full capitalize">
                            {student.sport}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getScoreColor(student.total_score)}`}>
                            {student.total_score}/100
                          </span>
                        </div>
                      </div>
                      {selectedStudent === student.id && (
                        <div className="text-green-600 text-lg ml-2">✓</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-1">Tips for Contacting Students:</h3>
              <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                <li>Introduce yourself and your organization</li>
                <li>Mention specific strengths you noticed</li>
                <li>Provide clear contact information</li>
                <li>Be professional and respectful</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Main component with Suspense boundary
export default function ContactPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading contact form...</div>
      </div>
    }>
      <ContactContent />
    </Suspense>
  )
}