/**
 * RECRUITMENT FLOW SERVICE
 * Phase 4: 1 stillingsopslag = 1 flow, max 75 dage fra første CV-screening.
 * 
 * - Tjek om flow eksisterer eller er nyt
 * - For nyt flow: tjek job_slots, deduct, opret flow
 * - For eksisterende: tjek om udløbet
 */

import { supabaseAdmin } from '@/lib/supabase/server'

const FLOW_DAYS = 75

/**
 * Check if user is EVENT (demo) - skip slot check
 */
async function isEventAccount(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('user_profiles')
    .select('account_type')
    .eq('user_id', userId)
    .single()
  return data?.account_type === 'EVENT'
}

/**
 * Ensure user can start/continue analysis for this analysis_id.
 * - New flow: check job_slots_available >= 1, deduct, create flow
 * - Existing flow: check not expired
 * Returns error message if blocked.
 * 
 * Graceful fallback: If recruitment_flows table doesn't exist (migration not run),
 * allow access to avoid breaking production.
 */
export async function ensureFlowAccess(
  userId: string,
  analysisId: string
): Promise<{ ok: true } | { ok: false; error: string; code?: number }> {
  // EVENT accounts: demo access, no slot limit
  const eventUser = await isEventAccount(userId)
  if (eventUser) {
    return { ok: true }
  }

  // Check if flow already exists (user adding more CVs to same job)
  const { data: existingFlow, error: flowErr } = await supabaseAdmin
    .from('recruitment_flows')
    .select('expires_at, status')
    .eq('analysis_id', analysisId)
    .single()

  // Graceful: if table doesn't exist (migration not run), allow access
  if (flowErr?.message?.includes('relation') || flowErr?.code === '42P01') {
    console.warn('Phase 4: recruitment_flows table missing, allowing access')
    return { ok: true }
  }

  if (existingFlow) {
    const now = new Date()
    const expiresAt = new Date(existingFlow.expires_at)
    if (expiresAt < now) {
      return {
        ok: false,
        error: 'Dette rekrutteringsflow er udløbet (75 dage). Start et nyt stillingsopslag.',
        code: 410
      }
    }
    return { ok: true }
  }

  // New flow: need to consume 1 job slot
  const { data: sub, error: subErr } = await supabaseAdmin
    .from('user_subscriptions')
    .select('job_slots_available')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  // Graceful: if job_slots_available column doesn't exist (phase3 not run), allow
  if (subErr?.message?.includes('job_slots') || subErr?.message?.includes('column')) {
    console.warn('Phase 4: job_slots_available column missing, allowing access')
    return { ok: true }
  }

  const slots = sub?.job_slots_available ?? 0
  if (slots < 1) {
    return {
      ok: false,
      error: 'Ingen stillingsopslag tilbage. Køb en ny pakke for at fortsætte.',
      code: 402
    }
  }

  // Deduct slot and create flow (atomic-ish: we do both, rollback on failure)
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + FLOW_DAYS)

  const { error: updateErr } = await supabaseAdmin
    .from('user_subscriptions')
    .update({
      job_slots_available: slots - 1,
      updated_at: now.toISOString()
    })
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('job_slots_available', 1)

  if (updateErr) {
    console.error('Failed to deduct job slot:', updateErr)
    return {
      ok: false,
      error: 'Kunne ikke reservere stillingsopslag. Prøv igen.',
      code: 500
    }
  }

  const { error: insertErr } = await supabaseAdmin
    .from('recruitment_flows')
    .insert({
      user_id: userId,
      analysis_id: analysisId,
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: 'active'
    })

  if (insertErr) {
    // Rollback slot deduction
    await supabaseAdmin
      .from('user_subscriptions')
      .update({
        job_slots_available: slots,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
    console.error('Failed to create recruitment flow:', insertErr)
    return {
      ok: false,
      error: 'Kunne ikke oprette flow. Prøv igen.',
      code: 500
    }
  }

  console.log(`✅ New recruitment flow: ${analysisId} (expires ${expiresAt.toISOString()})`)
  return { ok: true }
}

// Wrap in try/catch for graceful fallback when migration not yet run
export async function ensureFlowAccessSafe(
  userId: string,
  analysisId: string
): Promise<{ ok: true } | { ok: false; error: string; code?: number }> {
  try {
    return await ensureFlowAccess(userId, analysisId)
  } catch (e: any) {
    const msg = e?.message || ''
    if (msg.includes('relation') || msg.includes('does not exist') || msg.includes('recruitment_flows')) {
      console.warn('Phase 4: recruitment_flows table missing, allowing access (migration not run)')
      return { ok: true }
    }
    throw e
  }
}

/**
 * Get flow info for an analysis (for 14-day warning banner)
 */
export async function getFlowInfo(
  userId: string,
  analysisId: string
): Promise<{
  exists: boolean
  expiresAt?: string
  daysRemaining?: number
  warning14Days?: boolean
} | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('recruitment_flows')
      .select('expires_at')
      .eq('user_id', userId)
      .eq('analysis_id', analysisId)
      .single()

    if (error || !data?.expires_at) return { exists: false }

    const expiresAt = new Date(data.expires_at)
    const now = new Date()
    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

    return {
      exists: true,
      expiresAt: data.expires_at,
      daysRemaining: Math.max(0, daysRemaining),
      warning14Days: daysRemaining > 0 && daysRemaining <= 14
    }
  } catch {
    return { exists: false }
  }
}
