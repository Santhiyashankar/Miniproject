'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { fitnessAI } from '@/lib/ai-analysis'

type TestType = 'vertical_jump' | 'shuttle_run' | 'sit_ups'

// VideoUpload component remains the same...
function VideoUpload({ 
  onVideoUrlChange, 
  currentVideoUrl 
}: { 
  onVideoUrlChange: (url: string) => void
  currentVideoUrl?: string 
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return

      if (!file.type.startsWith('video/')) {
        alert('Please select a video file')
        return
      }

      if (file.size > 50 * 1024 * 1024) {
        alert('Video file must be less than 50MB')
        return
      }

      setUploading(true)
      setUploadProgress(0)

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
      const filePath = `videos/${fileName}`

      console.log('📤 Uploading video:', filePath)

      const { data, error } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl
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

  const removeVideo = () => {
    onVideoUrlChange('')
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

export default function TakeTest() {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedTest, setSelectedTest] = useState<TestType | null>(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
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
    setAnalyzing(true)
    setAnalysisProgress(0)

    try {
      console.log('🚀 Starting AI analysis for user:', user.id)

      // Simulate analysis progress
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 15
        })
      }, 400)

      let analysis;

      if (videoUrl) {
        console.log('🎯 Analyzing video with AI...');
        
        switch (selectedTest) {
          case 'vertical_jump':
            analysis = await fitnessAI.analyzeVerticalJump(videoUrl);
            break;
          case 'shuttle_run':
            analysis = await fitnessAI.analyzeShuttleRun(videoUrl);
            break;
          case 'sit_ups':
            analysis = await fitnessAI.analyzeSitUps(videoUrl);
            break;
          default:
            analysis = await fitnessAI.analyzeVerticalJump(videoUrl);
        }
      } else {
        console.log('ℹ️ No video provided, using AI assessment');
        analysis = await fitnessAI.analyzeVerticalJump('');
      }

      clearInterval(progressInterval)
      setAnalysisProgress(100)

      console.log('🤖 AI Analysis Results:', analysis);

      // Create test record with AI analysis
      const { data, error: dbError } = await supabase
        .from('fitness_tests')
        .insert([
          {
            student_id: user.id,
            test_type: selectedTest,
            video_url: videoUrl,
            score: analysis.score,
            ai_suggestions: analysis.suggestions.join('. '),
            ai_metrics: analysis.metrics,
            analysis_type: analysis.analysis_type,
            date: new Date().toISOString()
          }
        ])
        .select()

      if (dbError) throw dbError

      console.log('✅ Test record created with AI analysis:', data)

      setTimeout(() => {
        alert('✅ Test submitted successfully! AI analysis complete.')
        router.push('/dashboard/student/results')
      }, 500)

    } catch (error: any) {
      console.error('❌ Error:', error)
      alert('Error: ' + (error.message || 'Unknown error occurred'))
    } finally {
      setUploading(false)
      setAnalyzing(false)
      setAnalysisProgress(0)
    }
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <p className="text-blue-800 text-sm font-medium">🤖 AI-Powered Analysis</p>
                  <p className="text-blue-600 text-xs">Computer vision technology</p>
                </div>
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

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">AI</span>
                </div>
                <div>
                  <p className="text-purple-800 font-medium">AI Analysis Ready</p>
                  <p className="text-purple-600 text-sm">Computer vision will analyze your technique and form</p>
                </div>
              </div>
            </div>
        
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
              <h3 className="text-lg font-semibold mb-4">Performance Video (Recommended)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload your performance video for detailed AI analysis of your technique and form.
              </p>
              
              <VideoUpload 
                onVideoUrlChange={setVideoUrl}
                currentVideoUrl={videoUrl}
              />
            </div>

            <form onSubmit={handleTestSubmit} className="space-y-6">
              {/* AI Analysis Progress */}
              {analyzing && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    <div className="flex-1">
                      <p className="text-purple-800 font-medium">AI Analysis in Progress</p>
                      <p className="text-purple-600 text-sm">Analyzing movement patterns and technique...</p>
                      <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${analysisProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-purple-600 text-xs mt-1">{analysisProgress}% complete</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || analyzing}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-md hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-medium transition-all duration-200"
              >
                {analyzing ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    AI Analysis in Progress...
                  </span>
                ) : uploading ? (
                  'Submitting...'
                ) : (
                  'Submit Test with AI Analysis'
                )}
              </button>
            </form>

            {videoUrl && !analyzing && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">
                  <strong>✅ Video Ready for AI Analysis</strong> - Your performance video will be analyzed by computer vision AI.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}