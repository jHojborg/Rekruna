import { supabase } from '@/lib/supabase/client'

export type ProgressFn = (processed: number, total: number, current?: string) => void

const MAX_MB = 10
const MAX_BYTES = MAX_MB * 1024 * 1024

function validatePdf(file: File) {
  if (file.type !== 'application/pdf') throw new Error('Kun PDF-filer accepteres')
  if (file.size > MAX_BYTES) throw new Error(`Filen er for stor (maks ${MAX_MB}MB)`) 
}

async function uploadOne(bucket: string, path: string, file: File) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) throw error
}

async function runWithConcurrency(tasks: Array<() => Promise<void>>, limit: number, onProgress?: () => void) {
  let index = 0
  const workers: Promise<void>[] = []
  async function next() {
    if (index >= tasks.length) return
    const i = index++
    await tasks[i]()
    onProgress?.()
    return next()
  }
  for (let i = 0; i < Math.min(limit, tasks.length); i++) {
    workers.push(next())
  }
  await Promise.all(workers)
}

export async function uploadCVsInBatches(
  files: File[],
  opts: {
    userId: string
    analysisId: string
    batchSize?: number
    concurrency?: number
    onProgress?: ProgressFn
  }
) {
  const { userId, analysisId, batchSize = 10, concurrency = 5, onProgress } = opts

  const total = files.length
  let processed = 0

  // Pre-validate
  for (const f of files) validatePdf(f)

  for (let start = 0; start < files.length; start += batchSize) {
    const batch = files.slice(start, start + batchSize)
    const tasks = batch.map((file) => async () => {
      const path = `${userId}/${analysisId}/${encodeURIComponent(file.name)}`
      await uploadOne('cvs', path, file)
    })
    await runWithConcurrency(tasks, concurrency, () => {
      processed += 1
      onProgress?.(processed, total, batch[Math.min(processed - 1, batch.length - 1)]?.name)
    })
  }
  return { uploaded: processed, total }
}

export async function uploadJobDescription(file: File, userId: string, analysisId: string) {
  validatePdf(file)
  const path = `${userId}/${analysisId}/job-description.pdf`
  await uploadOne('job-descriptions', path, file)
  return { path }
}

