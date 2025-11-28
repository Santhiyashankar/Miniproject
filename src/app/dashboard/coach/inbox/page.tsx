'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Student {
  email: string
  sport: string
}

interface Message {
  id: string
  message: string
  created_at: string
  is_from_coach: boolean
  read: boolean
  parent_id: string | null
  student: Student
}

interface Thread {
  id: string
  message: string
  created_at: string
  is_from_coach: boolean
  read: boolean
  parent_id: string | null
  student: Student
  replies: Message[]
}

export default function CoachInbox() {
  const { user } = useAuth()
  const router = useRouter()
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchThreads()
  }, [user, router])

  const fetchThreads = async () => {
    if (!user) return
    
    try {
      setError(null)
      console.log('🔄 Fetching threads for coach:', user.id)

      // Get all initial messages sent by this coach (parent messages)
      const { data: coachMessages, error: coachError } = await supabase
        .from('contacts')
        .select(`
          id,
          message,
          created_at,
          is_from_coach,
          read,
          parent_id,
          student:student_id (
            email,
            sport
          )
        `)
        .eq('coach_id', user.id)
        .is('parent_id', null)
        .order('created_at', { ascending: false })

      if (coachError) {
        console.error('❌ Error fetching coach messages:', coachError)
        setError(`Error: ${coachError.message}`)
        throw coachError
      }

      console.log('✅ Coach messages:', coachMessages)

      
      const threadsWithReplies = await Promise.all(
        (coachMessages || []).map(async (coachMessage) => {
          const { data: replies, error: repliesError } = await supabase
            .from('contacts')
            .select(`
              id,
              message,
              created_at,
              is_from_coach,
              read,
              parent_id,
              student:student_id (
                email,
                sport
              )
            `)
            .eq('parent_id', coachMessage.id)
            .order('created_at', { ascending: true })

          if (repliesError) {
            console.error('❌ Error fetching replies:', repliesError)
            return {
              ...coachMessage,
              student: coachMessage.student?.[0] || { email: 'Unknown', sport: '' },
              replies: []
            } as Thread
          }

          // Format replies properly
          const formattedReplies: Message[] = (replies || []).map(reply => ({
            id: reply.id,
            message: reply.message,
            created_at: reply.created_at,
            is_from_coach: reply.is_from_coach,
            read: reply.read,
            parent_id: reply.parent_id,
            student: reply.student?.[0] || { email: 'Unknown', sport: '' }
          }))

          return {
            ...coachMessage,
            student: coachMessage.student?.[0] || { email: 'Unknown', sport: '' },
            replies: formattedReplies
          } as Thread
        })
      )

      console.log('✅ Threads with replies:', threadsWithReplies)
      setThreads(threadsWithReplies)
    } catch (error: any) {
      console.error('❌ Error in fetchThreads:', error)
      setError(error.message || 'Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const getUnreadRepliesCount = (thread: Thread) => {
    return thread.replies.filter(reply => !reply.is_from_coach && !reply.read).length
  }

  const markReplyAsRead = async (replyId: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ read: true })
        .eq('id', replyId)

      if (!error) {
        fetchThreads() 
      }
    } catch (error) {
      console.error('Error marking reply as read:', error)
    }
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
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/coach" className="text-blue-600 hover:text-blue-500">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold">Coach Inbox</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 text-lg mr-3">⚠️</div>
              <div>
                <h3 className="text-red-800 font-semibold">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
                <button 
                  onClick={fetchThreads}
                  className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Student Conversations</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage your conversations with students
              </p>
            </div>
            <button 
              onClick={fetchThreads}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading conversations...</p>
              </div>
            ) : threads.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">💬</div>
                <p className="text-gray-500">No conversations yet.</p>
                <p className="text-gray-400 text-sm mt-1">
                  When students reply to your messages, they will appear here.
                </p>
                <Link 
                  href="/dashboard/coach/contact" 
                  className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Send Your First Message
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {threads.map((thread) => {
                  const unreadCount = getUnreadRepliesCount(thread)
                  return (
                    <div key={thread.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{thread.student.email}</h3>
                          <p className="text-sm text-gray-500 capitalize">{thread.student.sport}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(thread.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                 
                 
                      <div className="bg-blue-50 p-3 rounded-lg mb-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-blue-800">Your message:</span>
                        </div>
                        <p className="text-blue-700 whitespace-pre-wrap">{thread.message}</p>
                      </div>

                 
                      {thread.replies.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-700">Conversation:</h4>
                          {thread.replies.map((reply) => (
                            <div 
                              key={reply.id} 
                              className={`p-3 rounded-lg ${
                                reply.is_from_coach ? 'bg-blue-50' : 'bg-green-50'
                              } ${!reply.read && !reply.is_from_coach ? 'border-2 border-green-200' : ''}`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className={`text-sm font-medium ${
                                  reply.is_from_coach ? 'text-blue-800' : 'text-green-800'
                                }`}>
                                  {reply.is_from_coach ? 'You' : thread.student.email}
                                </span>
                                <div className="flex items-center space-x-2">
                                  {!reply.read && !reply.is_from_coach && (
                                    <button
                                      onClick={() => markReplyAsRead(reply.id)}
                                      className="text-green-600 hover:text-green-800 text-xs"
                                    >
                                      Mark read
                                    </button>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {new Date(reply.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <p className={`whitespace-pre-wrap ${
                                reply.is_from_coach ? 'text-blue-700' : 'text-green-700'
                              }`}>
                                {reply.message}
                              </p>
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
      </main>
    </div>
  )
}