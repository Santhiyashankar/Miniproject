'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  role: string
  sport: string
  verified: boolean
}

interface RecentTest {
  id: string
  test_type: string
  score: number
  date: string
}

interface Message {
  id: string
  message: string
  created_at: string
  read: boolean
  is_from_coach: boolean
  parent_id: string | null
  coaches: {
    email: string
    sport: string
  }[]
  replies?: Message[]
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [recentTests, setRecentTests] = useState<RecentTest[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchDashboardData()
    fetchMessages()
  }, [user, router])

  const fetchDashboardData = async () => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('role, sport, verified')
        .eq('id', user?.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      // Fetch recent tests
      const { data: testsData, error: testsError } = await supabase
        .from('fitness_tests')
        .select('id, test_type, score, date')
        .eq('student_id', user?.id)
        .order('date', { ascending: false })
        .limit(3)

      if (testsError) throw testsError
      setRecentTests(testsData || [])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      setMessagesLoading(true)
      const { data: messagesData, error } = await supabase
        .from('contacts')
        .select(`
          id,
          message,
          created_at,
          read,
          is_from_coach,
          parent_id,
          coaches:coach_id (
            email,
            sport
          )
        `)
        .eq('student_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Organize messages into threads
      const threadedMessages = organizeMessages(messagesData || [])
      setMessages(threadedMessages)
      
      // Count unread coach messages
      const unread = messagesData?.filter(msg => !msg.read && msg.is_from_coach).length || 0
      setUnreadCount(unread)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }

  const organizeMessages = (messages: Message[]): Message[] => {
    const parentMessages = messages.filter(msg => msg.parent_id === null)
    return parentMessages.map(parent => ({
      ...parent,
      replies: messages.filter(msg => msg.parent_id === parent.id)
    }))
  }

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ read: true })
        .eq('id', messageId)
      
      if (!error) {
        fetchMessages() // Refresh messages
      }
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const sendReply = async (parentMessageId: string) => {
  if (!replyText.trim() || !user) return

  setSendingReply(true)
  try {
    console.log('🔄 Sending reply from student:', user.id, 'to parent message:', parentMessageId)

    // Get the original message to find the coach_id
    const { data: originalMessage, error: fetchError } = await supabase
      .from('contacts')
      .select('coach_id')
      .eq('id', parentMessageId)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching original message:', fetchError)
      throw new Error(`Could not find the original message: ${fetchError.message}`)
    }

    console.log('✅ Found original message with coach:', originalMessage.coach_id)

    if (!originalMessage.coach_id) {
      throw new Error('Original message does not have a valid coach_id')
    }

    // Insert the student's reply
    const { data, error } = await supabase
      .from('contacts')
      .insert([
        {
          coach_id: originalMessage.coach_id,
          student_id: user.id,
          message: replyText.trim(),
          parent_id: parentMessageId,
          is_from_coach: false,
          read: false
        }
      ])
      .select()

    if (error) {
      console.error('❌ Supabase insert error:', error)
      
      // Handle RLS error specifically
      if (error.code === '42501') {
        throw new Error('Permission denied. Please contact administrator to fix database permissions.')
      }
      
      throw error
    }

    console.log('✅ Reply sent successfully:', data)

    // Reset form and refresh messages
    setReplyText('')
    setReplyingTo(null)
    fetchMessages()
    
  } catch (error: any) {
    console.error('❌ Error in sendReply:', error)
    
    // Show user-friendly error message
    let errorMessage = 'Failed to send reply. Please try again.'
    
    if (error.message?.includes('row-level security')) {
      errorMessage = 'Database permissions issue. Please contact administrator.'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    alert(`Error: ${errorMessage}`)
  } finally {
    setSendingReply(false)
  }
}


   



   
   
   
   
   
   

   
   
   

   

   
   
   

   
   
   
   
   
   
   
   
   
   
   
   
   
   

   
   
   
   
   
   
   
   
   
   

   

   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
  

  // Helper to get coach data safely (since coaches is an array)
  const getCoachData = (message: Message) => {
    return message.coaches && message.coaches[0] ? message.coaches[0] : null
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">AthleteIQ</h1>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <Link href="/dashboard/student" className="bg-gray-100 text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Dashboard
                  </Link>
                  <Link href="/dashboard/student/take-test" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Take Test
                  </Link>
                  <Link href="/dashboard/student/results" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    My Results
                  </Link>
                  <Link href="/dashboard/student/leaderboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Leaderboard
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex flex-col text-right">
                <span className="text-sm font-medium text-gray-700">{user.email}</span>
                <span className="text-xs text-gray-500 capitalize">{profile?.role}</span>
              </div>
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

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <div className="flex space-x-4 overflow-x-auto pb-2">
            <Link href="/dashboard/student" className="bg-gray-100 text-gray-900 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap">
              Dashboard
            </Link>
            <Link href="/dashboard/student/take-test" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap">
              Take Test
            </Link>
            <Link href="/dashboard/student/results" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap">
              My Results
            </Link>
            <Link href="/dashboard/student/leaderboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap">
              Leaderboard
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 sm:px-0 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{profile?.sport ? `, ${profile.sport} Athlete` : ''}!
          </h1>
          <p className="text-gray-600 mt-2">
            Track your performance and compete with other athletes.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-4 sm:px-0">
          <Link href="/dashboard/student/take-test" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xl">🎯</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Take Fitness Test</h3>
                <p className="text-gray-600 text-sm">Record and submit your fitness tests</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/student/results" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-xl">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">My Results</h3>
                <p className="text-gray-600 text-sm">View your performance history</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/student/leaderboard" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-xl">🏆</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Leaderboard</h3>
                <p className="text-gray-600 text-sm">See how you rank against others</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity & Messages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 sm:px-0">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading activities...</p>
                </div>
              ) : recentTests.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📝</div>
                  <p className="text-gray-500 mb-4">No tests completed yet.</p>
                  <Link 
                    href="/dashboard/student/take-test" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Take Your First Test
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{getTestName(test.test_type)}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(test.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`text-lg font-semibold ${getScoreColor(test.score)}`}>
                        {test.score}/100
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-4">
                    <Link 
                      href="/dashboard/student/results" 
                      className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                    >
                      View All Results →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Messages Section with Reply Feature */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Coach Messages 
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </h2>
              <button 
                onClick={fetchMessages}
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                disabled={messagesLoading}
              >
                {messagesLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {messagesLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">✉️</div>
                  <p className="text-gray-500">No messages from coaches yet.</p>
                  <p className="text-gray-400 text-sm mt-1">Coaches will contact you about your performance!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message) => {
                    const coach = getCoachData(message)
                    return (
                      <div key={message.id} className="border border-gray-200 rounded-lg">
                        {/* Original Message */}
                        <div className={`p-4 rounded-t-lg ${
                          message.read ? 'bg-gray-50' : 'bg-blue-50'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              <span className="font-medium text-gray-900">
                                Coach {coach?.email || 'Unknown'}
                              </span>
                              {coach?.sport && (
                                <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded capitalize">
                                  {coach.sport}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {new Date(message.created_at).toLocaleDateString()}
                              </span>
                              {!message.read && (
                                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                  New
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap mb-3">{message.message}</p>
                          
                          <div className="flex justify-between items-center">
                            {!message.read && (
                              <button
                                onClick={() => markAsRead(message.id)}
                                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                              >
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={() => setReplyingTo(replyingTo === message.id ? null : message.id)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            >
                              {replyingTo === message.id ? 'Cancel' : 'Reply'}
                            </button>
                          </div>
                        </div>

                        {/* Reply Form */}
                        {replyingTo === message.id && (
                          <div className="p-4 bg-green-50 border-t">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type your reply to the coach..."
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                            />
                            <div className="flex justify-end space-x-2 mt-2">
                              <button
                                onClick={() => setReplyingTo(null)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => sendReply(message.id)}
                                disabled={!replyText.trim() || sendingReply}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                {sendingReply ? 'Sending...' : 'Send Reply'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Replies */}
                        {message.replies && message.replies.length > 0 && (
                          <div className="bg-gray-50 border-t">
                            {message.replies.map((reply) => (
                              <div key={reply.id} className="p-4 border-b border-gray-200 last:border-b-0">
                                <div className="flex justify-between items-start mb-2">
                                  <span className={`font-medium ${
                                    reply.is_from_coach ? 'text-blue-900' : 'text-green-900'
                                  }`}>
                                    {reply.is_from_coach ? `Coach ${coach?.email || 'Unknown'}` : 'You'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(reply.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 px-4 sm:px-0">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{recentTests.length}</div>
            <div className="text-sm text-blue-800">Tests Completed</div>
          </div>
          
          {recentTests.length > 0 && (
            <>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(recentTests.reduce((acc, test) => acc + test.score, 0) / recentTests.length)}
                </div>
                <div className="text-sm text-green-800">Average Score</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.max(...recentTests.map(test => test.score))}
                </div>
                <div className="text-sm text-purple-800">Best Score</div>
              </div>
            </>
          )}

          {profile?.sport && (
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600 capitalize">{profile.sport}</div>
              <div className="text-sm text-orange-800">Primary Sport</div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}