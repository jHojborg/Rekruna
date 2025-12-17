/**
 * ADMIN AUTHENTICATION UTILITIES
 * 
 * Centralized admin role checking.
 * Uses environment variable for admin emails (more secure than hardcoding).
 * 
 * SECURITY:
 * - Admin emails are stored in environment variable
 * - No hardcoded credentials in source code
 * - Easy to update without code changes
 */

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase admin client for auth verification
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Get admin email whitelist from environment variable
 * 
 * Set in .env.local:
 * ADMIN_EMAILS=jan@rekruna.dk,support@rekruna.dk,janhojborghenriksen@gmail.com
 * 
 * @returns Array of admin email addresses
 */
function getAdminEmails(): string[] {
  const adminEmailsEnv = process.env.ADMIN_EMAILS || ''
  
  if (!adminEmailsEnv) {
    console.warn('⚠️ ADMIN_EMAILS environment variable is not set!')
    return []
  }
  
  // Split by comma and trim whitespace
  return adminEmailsEnv
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0)
}

/**
 * Check if a user is an admin based on their email
 * 
 * @param email - User email to check
 * @returns true if user is admin, false otherwise
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  
  const adminEmails = getAdminEmails()
  const normalizedEmail = email.trim().toLowerCase()
  
  return adminEmails.includes(normalizedEmail)
}

/**
 * Check if authenticated request is from an admin user
 * 
 * Usage in API routes:
 * ```typescript
 * const authHeader = request.headers.get('authorization')
 * if (!authHeader) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 * }
 * 
 * const isAdmin = await isAdminRequest(authHeader)
 * if (!isAdmin) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
 * }
 * ```
 * 
 * @param authHeader - Authorization header value (e.g., "Bearer token...")
 * @returns Promise<boolean> - true if admin, false otherwise
 */
export async function isAdminRequest(authHeader: string): Promise<boolean> {
  try {
    // Extract token from Bearer header
    const token = authHeader.replace('Bearer ', '')
    
    // Verify token and get user
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error || !user) {
      console.error('Admin auth check failed:', error?.message)
      return false
    }
    
    // Check if user email is in admin whitelist
    return isAdminEmail(user.email)
    
  } catch (error: any) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Verify admin access or throw error (for use with try/catch)
 * 
 * @param authHeader - Authorization header value
 * @throws Error if not admin
 */
export async function requireAdmin(authHeader: string | null): Promise<void> {
  if (!authHeader) {
    throw new Error('Missing authorization header')
  }
  
  const isAdmin = await isAdminRequest(authHeader)
  
  if (!isAdmin) {
    throw new Error('Admin access required')
  }
}

/**
 * Get list of configured admin emails (for debugging)
 * WARNING: Only use in server-side code, never expose to client
 * 
 * @returns Array of admin emails (masked for security)
 */
export function getAdminEmailsMasked(): string[] {
  const emails = getAdminEmails()
  
  // Mask emails for security (show first 2 chars and domain)
  return emails.map(email => {
    const [local, domain] = email.split('@')
    return `${local.substring(0, 2)}***@${domain}`
  })
}


