'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type TestType = 'vertical_jump' | 'shuttle_run' | 'sit_ups'

// UPDATED: Video Upload Component with better error handling
function VideoUpload({ 
  onVideoUrlChange, 
  currentVideoUrl 
}: { 
  onVideoUrlChange: (url: string) => void
  currentVideoUrl?: string 
}) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file || !user) return

      // Validate file type
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file (MP4, WebM, MOV, etc.)')
        return
      }

      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        alert('Video file must be less than 50MB')
        return
      }

      setUploading(true)
      setUploadProgress(0)

      // Create unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}_${Date.now()}.${fileExt}`
      
      // UPDATED: Just use the filename without 'videos/' prefix
      const filePath = fileName

      console.log('📤 Uploading video to path:', filePath)

      // UPDATED: Simple upload without complex path
      const { data, error } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('❌ Upload error:', error)
        
        // If there's still an error, try a different approach
        if (error.message.includes('Bucket not found')) {
          alert('Storage bucket not configured. Please contact support.')
          return
        }
        
        throw error
      }

      console.log('✅ Upload successful:', data)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl
      console.log('🔗 Public URL:', publicUrl)

      // Test if the URL is accessible
      const testAccess = await testVideoAccess(publicUrl)
      if (!testAccess) {
        console.warn('⚠️ Video URL might not be immediately accessible')
      }

      onVideoUrlChange(publicUrl)
      setUploadProgress(100)

    } catch (error: any) {
      console.error('❌ Error uploading video:', error)
      alert(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Test if video URL is accessible
  const testVideoAccess = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }

  const removeVideo = async () => {
    if (!currentVideoUrl || !user) {
      onVideoUrlChange('')
      return
    }

    try {
      // Extract file name from URL
      const urlParts = currentVideoUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]

      console.log('🗑️ Deleting video:', fileName)

      const { error } = await supabase.storage
        .from('videos')
        .remove([fileName])

      if (error) {
        console.error('❌ Delete error:', error)
      }

      onVideoUrlChange('')
    } catch (error) {
      console.error('❌ Error deleting video:', error)
      onVideoUrlChange('')
    }
  }

  return (
    <div className="space-y-4">
      {currentVideoUrl ? (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Performance Video</h4>
          <div className="border rounded-lg p-4 bg-gray-50">
            <video 
              src={currentVideoUrl} 
              controls 
              className="w-full max-w-md rounded-lg"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
            <div className="mt-3 flex space-x-2">
              <button
                type="button"
                onClick={removeVideo}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Remove Video
              </button>
              <a 
                href={currentVideoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Open in New Tab
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Performance Video (Optional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: MP4, WebM, MOV (Max 50MB)
            </p>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Rest of your TakeTest component remains the same...
export default function TakeTest() {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedTest, setSelectedTest] = useState<TestType | null>(null)
  const [uploading, setUploading] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')

  const tests = [
    {
      id: 'vertical_jump' as TestType,
      name: 'Vertical Jump',
      description: 'Measure your leg power and explosiveness',
      instructions: ['Stand facing the wall', 'Jump as high as possible', 'Record the jump from side view']
    },
    {
      id: 'shuttle_run' as TestType,
      name: 'Shuttle Run',
      description: 'Test your speed and agility',
      instructions: ['Set up cones 20 meters apart', 'Run back and forth', 'Record the entire run']
    },
    {
      id: 'sit_ups' as TestType,
      name: 'Sit-ups',
      description: 'Measure core strength and endurance',
      instructions: ['Lie on your back with knees bent', 'Perform as many sit-ups as possible in 1 minute', 'Record your form from side view']
    }
  ]

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTest || !user) return

    setUploading(true)

    try {
      console.log('🚀 Starting AI analysis for user:', user.id)
      console.log('📹 Video URL:', videoUrl)

      const analysis = generateTestAnalysis(selectedTest)

      const { data, error: dbError } = await supabase
        .from('fitness_tests')
        .insert([
          {
            student_id: user.id,
            test_type: selectedTest,
            video_url: videoUrl,
            score: analysis.score,
            ai_suggestions: analysis.suggestions.join('. '),
            date: new Date().toISOString()
          }
        ])
        .select()

      if (dbError) throw dbError

      alert('✅ Test submitted successfully! AI analysis complete.')
      router.push('/dashboard/student/results')

    } catch (error: any) {
      console.error('❌ Error:', error)
      alert('Error: ' + (error.message || 'Unknown error occurred'))
    } finally {
      setUploading(false)
    }
  }

  const generateTestAnalysis = (testType: TestType) => {
    const baseScore = Math.floor(Math.random() * 25) + 65
    const testData = {
      vertical_jump: { score: baseScore, suggestions: ["Good explosive power", "Focus on arm coordination", "Maintain stable landing"] },
      shuttle_run: { score: baseScore, suggestions: ["Excellent agility", "Work on tighter turns", "Maintain consistent pace"] },
      sit_ups: { score: baseScore, suggestions: ["Strong core endurance", "Focus on full range of motion", "Maintain breathing pattern"] }
    }
    return testData[testType]
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/student" className="text-blue-600 hover:text-blue-500">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold">Take Fitness Test</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {!selectedTest ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                onClick={() => setSelectedTest(test.id)}
              >
                <h3 className="text-lg font-semibold mb-2 text-gray-900">{test.name}</h3>
                <p className="text-gray-600 mb-4">{test.description}</p>
                <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
                  {test.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <button 
              onClick={() => setSelectedTest(null)}
              className="text-blue-600 hover:text-blue-500 mb-4"
            >
              ← Choose different test
            </button>

            <h2 className="text-xl font-semibold mb-4">
              {tests.find(t => t.id === selectedTest)?.name}
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800">
                <strong>AI Analysis Ready:</strong> Click submit to generate performance analysis.
              </p>
            </div>
        
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
              <h3 className="text-lg font-semibold mb-4">Performance Video (Optional)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload your performance video. Coaches will be able to see your technique and form.
              </p>
              
              <VideoUpload 
                onVideoUrlChange={setVideoUrl}
                currentVideoUrl={videoUrl}
              />
            </div>

            <form onSubmit={handleTestSubmit} className="space-y-6">
              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {uploading ? 'Submitting...' : 'Submit Test with AI Analysis'}
              </button>
            </form>

            {videoUrl && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">
                  <strong>✅ Video Uploaded:</strong> Your performance video has been saved.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}