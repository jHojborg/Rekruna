// Server-only Supabase admin client
// This uses the Service Role Key and must NEVER be imported in client components.
// Purpose: allow server routes/actions to manage resources (e.g., create Storage buckets).

import { createClient } from '@supabase/supabase-js'

// Validate required environment variables early to fail fast if misconfigured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing env NEXT_PUBLIC_SUPABASE_URL for Supabase')
}

if (!serviceRoleKey) {
  throw new Error('Missing env SUPABASE_SERVICE_ROLE_KEY for Supabase admin')
}

// Export a single admin client instance
// Notes:
// - auth.autoRefreshToken/persistSession disabled for server usage
// - NEVER expose serviceRoleKey on the client
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})



