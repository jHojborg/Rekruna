import { pdf } from '@react-pdf/renderer'
import { PdfReportTemplate } from '@/components/pdf/PdfReportTemplate'

// Types matching your existing results structure
interface ResultItem {
  name: string
  overall: number
  scores: Record<string, number>
  strengths: string[]
  concerns: string[]
}

interface GeneratePdfOptions {
  results: ResultItem[]
  filename?: string
}

/**
 * Generates a PDF report from analysis results
 * Uses React-PDF to create a professional report matching the design specifications
 */
export async function generateAnalysisReportPdf({ 
  results, 
  filename = 'cv-analyse-resultat.pdf' 
}: GeneratePdfOptions): Promise<Blob> {
  try {
    // Create the PDF document using our template
    const document = PdfReportTemplate({ results })
    
    // Generate the PDF blob
    const blob = await pdf(document).toBlob()
    
    return blob
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate PDF report')
  }
}

/**
 * Downloads the PDF report directly to the user's device
 */
export async function downloadAnalysisReportPdf({ 
  results, 
  filename = 'cv-analyse-resultat.pdf' 
}: GeneratePdfOptions): Promise<void> {
  try {
    // Generate the PDF blob
    const blob = await generateAnalysisReportPdf({ results, filename })
    
    // Create download link and trigger download
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading PDF:', error)
    throw new Error('Failed to download PDF report')
  }
}

/**
 * Generates PDF blob for upload to storage (Supabase, etc.)
 */
export async function generatePdfForUpload({ results }: { results: ResultItem[] }): Promise<Blob> {
  return generateAnalysisReportPdf({ results })
}
