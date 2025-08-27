// Performance utilities for CV screening optimization
// Created to support the optimized analyze/route.ts

export interface ProcessingMetrics {
  totalFiles: number
  processedFiles: number
  failedFiles: number
  startTime: number
  downloadTime?: number
  extractionTime?: number
  aiProcessingTime?: number
}

/**
 * Advanced concurrency control with better memory management
 * Prevents overwhelming the system while maximizing throughput
 */
export async function processWithAdvancedConcurrency<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  maxConcurrency: number,
  onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
  const results: (R | null)[] = new Array(items.length).fill(null)
  const executing = new Set<Promise<void>>()
  let processed = 0
  
  for (let index = 0; index < items.length; index++) {
    // Control concurrency - wait if we've reached max concurrent operations
    while (executing.size >= maxConcurrency) {
      await Promise.race(executing)
    }
    
    const promise = processor(items[index], index)
      .then(result => {
        results[index] = result
        processed++
        onProgress?.(processed, items.length)
      })
      .catch(error => {
        console.warn(`Processing failed for item ${index}:`, error?.message || error)
        results[index] = null // Keep null for failed items
        processed++
        onProgress?.(processed, items.length)
      })
      .finally(() => {
        executing.delete(wrappedPromise)
      })
    
    const wrappedPromise = promise
    executing.add(wrappedPromise)
  }
  
  // Wait for all remaining operations to complete
  await Promise.all(executing)
  return results as R[]
}

/**
 * Performance timer utility for measuring operation durations
 */
export class PerformanceTimer {
  private startTime: number
  private marks: Map<string, number> = new Map()
  
  constructor() {
    this.startTime = Date.now()
  }
  
  mark(label: string): void {
    this.marks.set(label, Date.now())
  }
  
  getDuration(label?: string): number {
    if (label) {
      const markTime = this.marks.get(label)
      return markTime ? markTime - this.startTime : 0
    }
    return Date.now() - this.startTime
  }
  
  getMarkDuration(fromLabel: string, toLabel: string): number {
    const fromTime = this.marks.get(fromLabel)
    const toTime = this.marks.get(toLabel)
    if (!fromTime || !toTime) return 0
    return toTime - fromTime
  }
  
  logSummary(): void {
    const totalTime = this.getDuration()
    console.log(`📊 Performance Summary (Total: ${totalTime}ms):`)
    
    for (const [label, time] of this.marks.entries()) {
      const duration = time - this.startTime
      const percentage = ((duration / totalTime) * 100).toFixed(1)
      console.log(`  - ${label}: ${duration}ms (${percentage}%)`)
    }
  }
}

/**
 * Memory-efficient chunk processor for large file sets
 * Processes files in chunks to prevent memory issues
 */
export async function processInChunks<T, R>(
  items: T[],
  processor: (chunk: T[]) => Promise<R[]>,
  chunkSize: number = 10
): Promise<R[]> {
  const results: R[] = []
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    const chunkResults = await processor(chunk)
    results.push(...chunkResults)
    
    // Small delay to prevent overwhelming the system
    if (i + chunkSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }
  
  return results
}
