import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Only warn in development if keys are missing
if (typeof window !== 'undefined' && (supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder'))) {
  console.warn('Supabase environment variables are missing. Using placeholder values.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)