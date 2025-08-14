import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

async function listAllObjects(bucket: string, prefix = ''): Promise<Array<{ path: string; created_at?: string }>> {
  const collected: Array<{ path: string; created_at?: string }> = []
  const stack: string[] = [prefix]
  while (stack.length > 0) {
    const current = stack.pop() as string
    const { data, error } = await supabaseAdmin.storage.from(bucket).list(current, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) throw error
    for (const entry of data || []) {
      if ((entry as any).id) {
        // file
        const path = current ? `${current}/${entry.name}` : entry.name
        collected.push({ path, created_at: (entry as any).created_at })
      } else if ((entry as any).name) {
        // folder
        const next = current ? `${current}/${entry.name}` : entry.name
        stack.push(next)
      }
    }
  }
  return collected
}

// Manual trigger for cleanup (developer/admin only). Protect behind env flag.
export async function POST() {
  try {
    if (process.env.NEXT_PUBLIC_ENABLE_ADMIN_CLEANUP !== '1') {
      return NextResponse.json({ ok: false, error: 'Disabled' }, { status: 403 })
    }

    const buckets = ['job-descriptions', 'cvs', 'reports'] as const
    const cutoffTs = Date.now() - 30 * 24 * 60 * 60 * 1000

    let deleted = 0
    for (const bucket of buckets) {
      const items = await listAllObjects(bucket)
      const old = items.filter((it) => {
        const t = it.created_at ? Date.parse(it.created_at) : NaN
        return !Number.isNaN(t) ? t < cutoffTs : false
      })
      if (old.length === 0) continue
      const chunkSize = 100
      for (let i = 0; i < old.length; i += chunkSize) {
        const chunk = old.slice(i, i + chunkSize).map((o) => o.path)
        const { error } = await supabaseAdmin.storage.from(bucket).remove(chunk)
        if (error) throw error
        deleted += chunk.length
      }
    }

    return NextResponse.json({ ok: true, deleted })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'Unknown error' }, { status: 500 })
  }
}


