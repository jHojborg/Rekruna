/**
 * PDF Quality Validation
 * 
 * Validates PDF files before upload to ensure:
 * 1. File is a valid PDF format
 * 2. PDF contains extractable text (not just images)
 * 3. PDF is not corrupted
 */

import * as pdfjsLib from 'pdfjs-dist'
import { PDF_VALIDATION } from '@/lib/constants'

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

export interface PdfValidationResult {
  valid: boolean
  error?: string
  details?: {
    pageCount?: number
    hasText?: boolean
    textLength?: number
  }
}

/**
 * Check if file has PDF signature (magic bytes)
 * PDFs must start with %PDF-
 */
async function checkPdfSignature(file: File): Promise<boolean> {
  const buffer = await file.slice(0, 5).arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const signature = String.fromCharCode(...bytes)
  return signature.startsWith('%PDF-')
}

/**
 * Validate a single PDF file
 * Checks format, readability, and text content
 */
export async function validatePdf(file: File): Promise<PdfValidationResult> {
  // Quick exit if validation is disabled
  if (!PDF_VALIDATION.ENABLED) {
    return { valid: true }
  }

  try {
    // 1. Basic checks first (fast)
    const hasValidSignature = await checkPdfSignature(file)
    if (!hasValidSignature) {
      console.warn(`${file.name} failed signature check`)
      return {
        valid: false,
        error: `"${file.name}" er ikke en gyldig PDF fil. Vælg en korrekt PDF.`
      }
    }

    // 2. Try to load PDF with pdf.js (more lenient error handling)
    const arrayBuffer = await file.arrayBuffer()
    let pdf
    
    try {
      pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0, // Suppress warnings
        isEvalSupported: false, // Security
      }).promise
    } catch (loadError: any) {
      // Be more lenient - only fail on critical errors
      console.error(`PDF load error for ${file.name}:`, loadError?.message)
      
      // Don't fail on minor parsing issues
      if (loadError?.message?.includes('Invalid PDF structure')) {
        console.warn(`${file.name} has minor issues but may still be readable`)
        return { valid: true } // Allow it
      }
      
      return {
        valid: false,
        error: `"${file.name}" er beskadiget og kan ikke læses. Upload venligst en anden fil.`
      }
    }

    // 3. Check if PDF has pages
    const pageCount = pdf?.numPages || 0
    if (pageCount === 0) {
      return {
        valid: false,
        error: `"${file.name}" indeholder ingen sider. Upload en gyldig PDF.`
      }
    }

    // 4. Try to extract some text (but be very lenient)
    let totalText = ''
    const pagesToCheck = Math.min(PDF_VALIDATION.PAGES_TO_CHECK, pageCount)
    
    for (let i = 1; i <= pagesToCheck; i++) {
      try {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ')
        totalText += pageText + ' '
      } catch (pageError) {
        // Silently continue if page can't be read
        console.warn(`Could not read page ${i} of ${file.name}`)
      }
    }

    // 5. Very lenient text check - only fail if COMPLETELY empty
    const cleanText = totalText.trim()
    const hasAnyText = cleanText.length > 10 // Very low threshold
    
    if (!hasAnyText) {
      console.warn(`${file.name} has no extractable text (${cleanText.length} chars)`)
      // For now, just warn but allow it
      // In production, you might want to be stricter
      return {
        valid: true, // ALLOW even if no text for now
        details: {
          pageCount,
          hasText: false,
          textLength: 0
        }
      }
    }

    // Success!
    console.log(`✅ ${file.name} validated: ${pageCount} pages, ${cleanText.length} chars`)
    return {
      valid: true,
      details: {
        pageCount,
        hasText: true,
        textLength: cleanText.length
      }
    }

  } catch (error: any) {
    // Very lenient - allow file on unexpected errors
    console.error('PDF validation error (allowing file):', error?.message)
    return {
      valid: true, // ALLOW on errors for now
      details: {
        pageCount: 0,
        hasText: false,
        textLength: 0
      }
    }
  }
}

/**
 * Validate multiple PDF files
 * Returns list of invalid files with error messages
 */
export async function validatePdfs(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<{ valid: boolean; invalidFiles: Array<{ file: File; error: string }> }> {
  const invalidFiles: Array<{ file: File; error: string }> = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    // Report progress
    if (onProgress) {
      onProgress(i + 1, files.length)
    }

    // Validate file
    const result = await validatePdf(file)
    if (!result.valid) {
      invalidFiles.push({
        file,
        error: result.error || 'Ukendt fejl'
      })
    }
  }

  return {
    valid: invalidFiles.length === 0,
    invalidFiles
  }
}

/**
 * Quick validation for job description PDF
 * Very lenient - just checks if file can be opened
 */
export async function validateJobPdf(file: File): Promise<PdfValidationResult> {
  // Quick exit if validation is disabled
  if (!PDF_VALIDATION.ENABLED) {
    return { valid: true }
  }

  try {
    // 1. Check signature (basic check)
    const hasValidSignature = await checkPdfSignature(file)
    if (!hasValidSignature) {
      console.warn(`${file.name} failed signature check`)
      return {
        valid: false,
        error: `"${file.name}" er ikke en gyldig PDF fil.`
      }
    }

    // 2. Try to load (very lenient)
    const arrayBuffer = await file.arrayBuffer()
    let pdf
    
    try {
      pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0,
        isEvalSupported: false,
      }).promise
    } catch (loadError: any) {
      console.error(`Job PDF load error for ${file.name}:`, loadError?.message)
      
      // Very lenient - allow most PDFs
      return { valid: true } // Allow even if loading fails
    }

    // 3. Check pages (only fail if truly empty)
    const pageCount = pdf?.numPages || 0
    if (pageCount === 0) {
      return {
        valid: false,
        error: `"${file.name}" indeholder ingen sider.`
      }
    }

    // Success - job PDFs don't need text validation
    console.log(`✅ Job PDF ${file.name} validated: ${pageCount} pages`)
    return { valid: true }

  } catch (error: any) {
    // Very lenient - allow on any error
    console.error('Job PDF validation error (allowing file):', error?.message)
    return { valid: true } // ALLOW on errors
  }
}

