import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Check if Supabase is configured
const isSupabaseConfigured = supabaseUrl && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseUrl !== '' &&
  supabaseServiceKey &&
  supabaseServiceKey !== 'placeholder-service-key' &&
  supabaseServiceKey !== ''

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Server-side client with service role key (for admin operations)
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-service-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Export flag to check if Supabase is configured
export { isSupabaseConfigured }

