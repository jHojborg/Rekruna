// Route: POST /api/storage/ensure
// Purpose: Ensure required Supabase Storage buckets exist (idempotent).
// Security: This route runs on the server and uses supabaseAdmin (service role).
// Use only in trusted contexts (e.g., during setup). Consider protecting in production.

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

const REQUIRED_BUCKETS = ['job-descriptions', 'cvs', 'reports'] as const

async function ensureBucket(name: string) {
  // Check if bucket exists
  const { data: list, error: listError } = await supabaseAdmin.storage.listBuckets()
  if (listError) throw listError
  const exists = list?.some((b) => b.name === name)
  if (exists) return { name, created: false }

  // Create private bucket by default; adjust public as needed later
  const { data, error } = await supabaseAdmin.storage.createBucket(name, {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024, // 10 MB per file as agreed
  })
  if (error) throw error
  return { name, created: true, data }
}

export async function POST() {
  try {
    const results = [] as Array<{ name: string; created: boolean }>
    for (const bucket of REQUIRED_BUCKETS) {
      const res = await ensureBucket(bucket)
      results.push({ name: res.name, created: res.created })
    }
    return NextResponse.json({ ok: true, results })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'Unknown error' }, { status: 500 })
  }
}


