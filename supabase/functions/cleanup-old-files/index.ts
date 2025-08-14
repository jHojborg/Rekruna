// Edge Function: cleanup-old-files
// Deletes Storage objects older than RETENTION_DAYS (default: 30)
// Buckets covered: job-descriptions, cvs, reports
// Secrets required (set in Supabase → Project Settings → Functions):
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - RETENTION_DAYS (optional)

import { serve } from 'https://deno.land/std@0.200.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type FileEntry = { path: string; created_at?: string }

async function listAllObjects(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  prefix = ''
): Promise<FileEntry[]> {
  const collected: FileEntry[] = []
  const stack: string[] = [prefix]
  while (stack.length > 0) {
    const current = stack.pop() as string
    const { data, error } = await supabase.storage.from(bucket).list(current, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) throw error
    for (const entry of data || []) {
      // Files have id/created_at; folders only name
      // deno-lint-ignore no-explicit-any
      const anyEntry: any = entry
      if (anyEntry.id) {
        const path = current ? `${current}/${entry.name}` : entry.name
        collected.push({ path, created_at: anyEntry.created_at })
      } else if (entry.name) {
        const next = current ? `${current}/${entry.name}` : entry.name
        stack.push(next)
      }
    }
  }
  return collected
}

serve(async () => {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const RETENTION_DAYS = Number(Deno.env.get('RETENTION_DAYS') || '30')

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const buckets = ['job-descriptions', 'cvs', 'reports'] as const
    const cutoffTs = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000

    let deleted = 0
    for (const bucket of buckets) {
      const items = await listAllObjects(supabase, bucket)
      const old = items.filter((it) => {
        const t = it.created_at ? Date.parse(it.created_at) : NaN
        return !Number.isNaN(t) && t < cutoffTs
      })
      const chunkSize = 100
      for (let i = 0; i < old.length; i += chunkSize) {
        const chunk = old.slice(i, i + chunkSize).map((o) => o.path)
        if (chunk.length === 0) continue
        const { error } = await supabase.storage.from(bucket).remove(chunk)
        if (error) throw error
        deleted += chunk.length
      }
    }

    return new Response(JSON.stringify({ ok: true, deleted }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), {
      headers: { 'content-type': 'application/json' },
      status: 500,
    })
  }
})



