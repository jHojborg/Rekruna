/**
 * Upload Limits Configuration
 * 
 * Central place to manage all file upload limits.
 * Easy to adjust for scaling up capacity.
 */

export const UPLOAD_LIMITS = {
  // Max number of CVs per analysis
  // Current: 50 (good balance of UX and processing time)
  // Can scale to 75, 100, or more as needed
  MAX_CV_COUNT: 50,
  
  // Max total size for all CVs combined
  // 25 MB allows for ~50 CVs at 500KB each
  MAX_TOTAL_SIZE_MB: 25,
  
  // Max size per individual file
  // 5 MB per CV is generous for most PDF resumes
  MAX_FILE_SIZE_MB: 5,
  
  // Job description max size
  MAX_JOB_FILE_SIZE_MB: 10,
} as const

/**
 * PDF Quality Validation Configuration
 * 
 * Settings for validating PDF content and quality
 * 
 * IMPORTANT: Set ENABLED to false to completely disable validation
 */
export const PDF_VALIDATION = {
  // Enable/disable PDF quality validation
  // Set to false to skip all validation (files will be accepted as-is)
  // ⚠️ DISABLED FOR NOW - TOO AGGRESSIVE ⚠️
  ENABLED: false,
  
  // Minimum text length (characters) required in PDF
  // PDFs with less text are warned but still allowed (very lenient)
  MIN_TEXT_LENGTH: 10, // Very low - just checking for ANY text
  
  // Number of pages to check for text content
  // Checking first N pages for performance
  PAGES_TO_CHECK: 2, // Reduced from 3 for faster validation
} as const

// Helper functions for size calculations
export const uploadHelpers = {
  // Convert MB to bytes
  mbToBytes: (mb: number) => mb * 1024 * 1024,
  
  // Format bytes to human-readable
  formatBytes: (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  },
  
  // Check if files exceed limits
  validateFiles: (files: File[]): { valid: boolean; error?: string } => {
    // Check count
    if (files.length > UPLOAD_LIMITS.MAX_CV_COUNT) {
      return {
        valid: false,
        error: `Max ${UPLOAD_LIMITS.MAX_CV_COUNT} CVer pr. analyse. Vælg færre filer.`
      }
    }
    
    // Check total size
    const totalSize = files.reduce((sum, f) => sum + f.size, 0)
    const maxTotalSize = uploadHelpers.mbToBytes(UPLOAD_LIMITS.MAX_TOTAL_SIZE_MB)
    if (totalSize > maxTotalSize) {
      return {
        valid: false,
        error: `Total filstørrelse må max være ${UPLOAD_LIMITS.MAX_TOTAL_SIZE_MB} MB. Aktuel: ${uploadHelpers.formatBytes(totalSize)}`
      }
    }
    
    // Check individual file size
    const maxFileSize = uploadHelpers.mbToBytes(UPLOAD_LIMITS.MAX_FILE_SIZE_MB)
    const oversizedFile = files.find(f => f.size > maxFileSize)
    if (oversizedFile) {
      return {
        valid: false,
        error: `"${oversizedFile.name}" er for stor (${uploadHelpers.formatBytes(oversizedFile.size)}). Max ${UPLOAD_LIMITS.MAX_FILE_SIZE_MB} MB per fil.`
      }
    }
    
    return { valid: true }
  }
}

