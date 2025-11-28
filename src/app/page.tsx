import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="text-center text-white">
        <h1 className="text-5xl font-bold mb-4">AthleteIQ</h1>
        <p className="text-xl mb-8">Next Generation Sports Performance Tracking</p>
        <div className="space-x-4">
          <Link href="/signup" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">
            Get Started
          </Link>
          <Link href="/login" className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}