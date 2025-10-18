import toast from 'react-hot-toast'
import React from 'react'

// Error types for categorization
export type ErrorType = 
  | 'credit'
  | 'network'
  | 'validation'
  | 'pdf'
  | 'ai'
  | 'auth'
  | 'unknown'

// Structured error object
export interface AppError {
  type: ErrorType
  message: string // User-friendly Danish message
  technical?: string // Technical error for logging
  action?: 'retry' | 'buy-credits' | 'contact-support' | 'login' | 'upload-again'
  data?: any // Additional context data
}

// Map technical errors to user-friendly Danish messages
export function parseError(error: any): AppError {
  const errorMessage = error?.message || error?.error || String(error)
  const errorCode = error?.code || error?.status
  
  // Credit errors
  if (errorMessage.includes('credit') || errorMessage.includes('Insufficient credits')) {
    return {
      type: 'credit',
      message: 'Du har ikke nok credits til denne analyse',
      technical: errorMessage,
      action: 'buy-credits',
      data: {
        required: error?.required,
        available: error?.available,
        shortfall: error?.shortfall
      }
    }
  }
  
  // Authentication errors
  if (errorCode === 401 || errorMessage.includes('Unauthorized') || errorMessage.includes('token')) {
    return {
      type: 'auth',
      message: 'Din session er udløbet. Log venligst ind igen.',
      technical: errorMessage,
      action: 'login'
    }
  }
  
  // Network/timeout errors
  if (
    errorMessage.includes('timeout') || 
    errorMessage.includes('network') ||
    errorMessage.includes('fetch failed') ||
    errorCode === 408 ||
    errorCode === 503
  ) {
    return {
      type: 'network',
      message: 'Forbindelsesfejl. Tjek din internetforbindelse og prøv igen.',
      technical: errorMessage,
      action: 'retry'
    }
  }
  
  // Rate limiting
  if (errorCode === 429 || errorMessage.includes('For mange analyser')) {
    return {
      type: 'network',
      message: 'For mange anmodninger. Vent venligst et øjeblik og prøv igen.',
      technical: errorMessage,
      action: 'retry'
    }
  }
  
  // PDF extraction errors
  if (
    errorMessage.includes('PDF') || 
    errorMessage.includes('pdf') ||
    errorMessage.includes('extraction') ||
    errorMessage.includes('Could not extract text')
  ) {
    return {
      type: 'pdf',
      message: 'Kunne ikke læse PDF-filen. Den kan være scannet eller beskadiget. Upload en tekst-baseret PDF.',
      technical: errorMessage,
      action: 'upload-again'
    }
  }
  
  // OpenAI/AI errors
  if (
    errorMessage.includes('OpenAI') ||
    errorMessage.includes('AI') ||
    errorMessage.includes('model') ||
    errorCode === 500
  ) {
    return {
      type: 'ai',
      message: 'AI-analysen fejlede midlertidigt. Dette kan skyldes høj belastning. Prøv igen om lidt.',
      technical: errorMessage,
      action: 'retry'
    }
  }
  
  // Validation errors
  if (
    errorMessage.includes('Missing') ||
    errorMessage.includes('Invalid') ||
    errorMessage.includes('required') ||
    errorCode === 400
  ) {
    return {
      type: 'validation',
      message: 'Ugyldig forespørgsel. Tjek at alle felter er udfyldt korrekt.',
      technical: errorMessage,
      action: 'upload-again'
    }
  }
  
  // SSE/Stream errors
  if (errorMessage.includes('SSE') || errorMessage.includes('Stream')) {
    return {
      type: 'network',
      message: 'Real-time opdateringer fejlede. Analysen fortsætter i baggrunden.',
      technical: errorMessage,
      action: 'retry'
    }
  }
  
  // Generic/unknown error
  return {
    type: 'unknown',
    message: 'Der opstod en uventet fejl. Kontakt support hvis problemet fortsætter.',
    technical: errorMessage,
    action: 'contact-support'
  }
}

// Toast notification helpers interface
interface ErrorToastHelper {
  showWithRetry: (error: AppError, onRetry: () => void) => void
  showCreditError: (error: AppError, onBuyCredits: () => void) => void
  show: (error: AppError) => void
  success: (message: string) => void
  info: (message: string) => void
  showPartialSuccess: (successCount: number, totalCount: number, failedFiles: Array<{ name: string; reason: string }>) => void
}

// Toast notification helpers with Danish messages
export const errorToast: ErrorToastHelper = {
  // Show error with retry button
  showWithRetry: (error: AppError, onRetry: () => void) => {
    toast.error(
      (t) => React.createElement(
        'div',
        { className: 'flex flex-col gap-2' },
        React.createElement('div', { className: 'font-semibold' }, error.message),
        React.createElement(
          'button',
          {
            onClick: () => {
              toast.dismiss(t.id)
              onRetry()
            },
            className: 'self-start px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary/90 transition-colors'
          },
          '↻ Prøv igen'
        )
      ),
      { duration: 6000 }
    )
  },
  
  // Show credit error with buy button
  showCreditError: (error: AppError, onBuyCredits: () => void) => {
    const { required, available, shortfall } = error.data || {}
    toast.error(
      (t) => React.createElement(
        'div',
        { className: 'flex flex-col gap-2 min-w-[280px]' },
        React.createElement('div', { className: 'font-semibold' }, '💳 Ikke nok credits'),
        required && available !== undefined ? React.createElement(
          'div',
          { className: 'text-sm space-y-1' },
          React.createElement('div', null, `Du har: ${available} credits`),
          React.createElement('div', null, `Du skal bruge: ${required} credits`),
          shortfall ? React.createElement('div', { className: 'font-medium' }, `Du mangler: ${shortfall} credits`) : null
        ) : null,
        React.createElement(
          'div',
          { className: 'flex gap-2 mt-1' },
          React.createElement(
            'button',
            {
              onClick: () => {
                toast.dismiss(t.id)
                onBuyCredits()
              },
              className: 'px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors'
            },
            'Køb credits'
          ),
          React.createElement(
            'button',
            {
              onClick: () => toast.dismiss(t.id),
              className: 'px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors'
            },
            'Luk'
          )
        )
      ),
      { duration: 8000 }
    )
  },
  
  // Show simple error message
  show: (error: AppError) => {
    toast.error(error.message, { duration: 5000 })
  },
  
  // Show success message
  success: (message: string) => {
    toast.success(message, { duration: 4000 })
  },
  
  // Show info message
  info: (message: string) => {
    toast(message, { 
      icon: 'ℹ️',
      duration: 4000 
    })
  },
  
  // Show partial success with details
  showPartialSuccess: (successCount: number, totalCount: number, failedFiles: Array<{ name: string; reason: string }>) => {
    toast.success(
      (t) => React.createElement(
        'div',
        { className: 'flex flex-col gap-2 max-w-md' },
        React.createElement(
          'div',
          { className: 'font-semibold' },
          `✅ ${successCount} af ${totalCount} CVer analyseret`
        ),
        failedFiles.length > 0 ? React.createElement(
          'div',
          { className: 'text-sm' },
          React.createElement('div', { className: 'font-medium mb-1' }, `${failedFiles.length} CVer kunne ikke analyseres:`),
          React.createElement(
            'ul',
            { className: 'space-y-1 text-xs' },
            ...failedFiles.slice(0, 3).map((file, i) =>
              React.createElement('li', { key: i, className: 'truncate' }, `• ${file.name} (${file.reason})`)
            ),
            failedFiles.length > 3 ? React.createElement('li', { className: 'text-gray-500' }, `... og ${failedFiles.length - 3} flere`) : null
          )
        ) : null,
        React.createElement(
          'button',
          {
            onClick: () => toast.dismiss(t.id),
            className: 'self-start px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors'
          },
          'OK'
        )
      ),
      { duration: 10000 }
    )
  }
}

// Loading toast helper
export const loadingToast = {
  start: (message: string = 'Behandler...') => {
    return toast.loading(message)
  },
  
  success: (toastId: string, message: string) => {
    toast.success(message, { id: toastId })
  },
  
  error: (toastId: string, message: string) => {
    toast.error(message, { id: toastId })
  },
  
  dismiss: (toastId: string) => {
    toast.dismiss(toastId)
  }
}

