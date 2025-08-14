import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format score with proper Danish decimal formatting
export const formatScore = (score: number): string => {
  return score.toFixed(1).replace('.', ',')
}

// Format date with Danish locale
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('da-DK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

// Get score color based on scoring system from specifications
export const getScoreColor = (score: number): string => {
  if (score >= 9) return "text-score-excellent"      // 9-10: Deep green
  if (score >= 7) return "text-score-good"           // 7-8: Light green
  if (score >= 5) return "text-score-adequate"       // 5-6: Yellow
  if (score >= 3) return "text-score-below"          // 3-4: Orange
  return "text-score-poor"                           // 0-2: Red
}

// Get score background color for badges
export const getScoreBgColor = (score: number): string => {
  if (score >= 9) return "bg-score-excellent"
  if (score >= 7) return "bg-score-good"
  if (score >= 5) return "bg-score-adequate"
  if (score >= 3) return "bg-score-below"
  return "bg-score-poor"
} 