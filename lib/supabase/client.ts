import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Validate required environment variables before creating client
// This provides clear error messages if configuration is missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error(
    '❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
    'Please add it to your .env.local file. ' +
    'Get this value from your Supabase project settings.'
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    '❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
    'Please add it to your .env.local file. ' +
    'Get this value from your Supabase project settings.'
  )
}

// Single global Supabase client instance (prevents multiple GoTrueClient warnings)
// Always use this instance in client-side code to avoid auth conflicts
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

// For backwards compatibility - but always returns the same singleton instance
export function createClient() {
  return supabase
}

