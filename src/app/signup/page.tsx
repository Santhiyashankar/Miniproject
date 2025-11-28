'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type UserRole = 'student' | 'coach' | 'organization'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const [sport, setSport] = useState('')
  const [certificate, setCertificate] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Starting signup process...')

  
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        console.error('Auth error:', authError)
        throw authError
      }

      if (!authData.user) {
        throw new Error('No user data returned from authentication')
      }

      console.log('Auth user created:', authData.user.id)

     
      await new Promise(resolve => setTimeout(resolve, 1000))

      
      const userData = {
        id: authData.user.id,
        email: email,
        password: 'oauth-user', 
        role: role,
        sport: sport,
        verified: role === 'student', 
        certificate_url: null
      }

      console.log('Creating user profile:', userData)

      const { error: dbError } = await supabase
        .from('users')
        .insert([userData])

      if (dbError) {
        console.error('Database insert error:', dbError)
        
       
        if (dbError.code === '23505') { 
          console.log('User already exists, updating profile...')
          const { error: updateError } = await supabase
            .from('users')
            .update(userData)
            .eq('id', authData.user.id)
          
          if (updateError) throw updateError
        } else {
          throw dbError
        }
      }

      console.log('User profile created/updated in database')

    
      if (certificate && (role === 'coach' || role === 'organization')) {
        console.log('Uploading certificate...')
        const fileExt = certificate.name.split('.').pop()
        const fileName = `${authData.user.id}/certificate-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('certificates')
          .upload(fileName, certificate)

        if (uploadError) {
          console.error('Upload error:', uploadError)
         
          console.warn('Certificate upload failed, but continuing with signup')
        } else {
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ certificate_url: fileName })
            .eq('id', authData.user.id)

          if (updateError) {
            console.error('Certificate update error:', updateError)
          } else {
            console.log('Certificate uploaded and user updated')
          }
        }
      }

      console.log('Signup successful!')
      
      if (authData.user.identities && authData.user.identities.length === 0) {
        
        alert('Account setup complete! You can now sign in.')
        router.push('/login')
      } else if (authData.session) {
        
        alert('Account created successfully! You are now signed in.')
        router.push('/dashboard')
      } else {
        
        alert('Account created successfully! Please check your email to verify your account.')
        router.push('/login')
      }

    } catch (error: any) {
      console.error('Full signup error:', error)
      
     
      let errorMessage = error.message || 'An error occurred during signup. Please try again.'
      
      if (error.message.includes('row-level security policy')) {
        errorMessage = 'Database security error. Please contact support.'
      } else if (error.message.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.'
      } else if (error.message.includes('Password should be at least 6 characters')) {
        errorMessage = 'Password must be at least 6 characters long.'
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your AthleteIQ account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join thousands of athletes and coaches
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-red-500 mr-3">⚠️</div>
                <div>
                  <h3 className="text-red-800 font-medium">Signup Error</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (min 6 characters)"
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10"
                required
                minLength={6}
              />
            </div>
          
          
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a:
              </label>
              <div className="grid grid-cols-1 gap-2">
                {(['student', 'coach', 'organization'] as UserRole[]).map((userRole) => (
                  <label key={userRole} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={userRole}
                      checked={role === userRole}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700 capitalize">
                      {userRole}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            
            <div>
              <label htmlFor="sport" className="block text-sm font-medium text-gray-700 mb-1">
                Primary Sport
              </label>
              <select
                id="sport"
                name="sport"
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10"
                required
              >
                <option value="">Select your sport</option>
                <option value="basketball">Basketball</option>
                <option value="football">Football</option>
                <option value="soccer">Soccer</option>
                <option value="track">Track & Field</option>
                <option value="volleyball">Volleyball</option>
                <option value="other">Other</option>
              </select>
            </div>

          
            {(role === 'coach' || role === 'organization') && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label htmlFor="certificate" className="block text-sm font-medium text-blue-800 mb-2">
                  Upload {role === 'coach' ? 'Coaching Certificate' : 'Organization Registration'}
                </label>
                <input
                  id="certificate"
                  name="certificate"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setCertificate(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-blue-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                  required
                />
                <p className="text-xs text-blue-600 mt-2">
                  Upload PDF, JPG, or PNG file (max 5MB). This will be verified by our team.
                </p>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}