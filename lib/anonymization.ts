/**
 * CV Anonymization Module
 * 
 * Removes personally identifiable information and potential bias factors
 * from CV text while preserving professional qualifications and experience.
 * 
 * This ensures GDPR compliance and bias-free AI analysis.
 */

/**
 * Anonymize CV text by removing personal and bias-inducing information
 * 
 * Removes:
 * - Contact information (phone, email, CPR)
 * - Address and location details
 * - Age, date of birth, gender indicators
 * - Social media profiles
 * - Photo references
 * - Marital status and family information
 * 
 * Preserves:
 * - Candidate name (for UI/UX purposes)
 * - Professional experience and job titles
 * - Technical skills and competencies
 * - Education and certifications
 * - Work history dates and duration
 * 
 * @param cvText - Original extracted CV text
 * @param candidateName - Candidate's name to preserve (extracted separately)
 * @returns Anonymized CV text safe for AI processing
 */
export function anonymizeCVText(cvText: string, candidateName: string): string {
  if (!cvText || typeof cvText !== 'string') {
    return '';
  }

  let anonymized = cvText;
  
  // ============================================
  // 1. CONTACT INFORMATION REMOVAL
  // ============================================
  
  // Danish CPR numbers (DDMMYY-XXXX or DDMMYYXXXX)
  anonymized = anonymized.replace(/\b\d{6}-?\d{4}\b/g, '[CPR]');
  
  // Phone numbers (various Danish formats)
  // Matches: +45 12 34 56 78, 12345678, +4512345678, 12 34 56 78
  anonymized = anonymized.replace(
    /\b(\+?45)?\s?(\d{2}\s?\d{2}\s?\d{2}\s?\d{2}|\d{8})\b/g, 
    '[TELEFON]'
  );
  
  // Email addresses (comprehensive pattern)
  anonymized = anonymized.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, 
    '[EMAIL]'
  );
  
  // ============================================
  // 2. ADDRESS AND LOCATION REMOVAL
  // ============================================
  
  // Danish postal codes with city names (e.g., "2100 København Ø")
  anonymized = anonymized.replace(
    /\b\d{4}\s+[A-ZÆØÅa-zæøå][A-ZÆØÅa-zæøå\s\-]+\b/g, 
    '[ADRESSE]'
  );
  
  // Street addresses (common patterns)
  anonymized = anonymized.replace(
    /\b([A-ZÆØÅ][a-zæøå]+(?:vej|gade|allé|vænget|parken|stræde|torv|plads))\s+\d+[A-Za-z]?\b/gi,
    '[ADRESSE]'
  );
  
  // ============================================
  // 3. AGE AND DATE OF BIRTH REMOVAL (Bias Factor)
  // ============================================
  
  // Age mentions (e.g., "25 år", "Age: 30", "alder 45")
  anonymized = anonymized.replace(
    /\b(?:alder|age|år|years?\s+old)[:\s]*\d{1,2}(?:\s*år)?\b/gi, 
    '[ALDER]'
  );
  
  // Birth dates (various formats)
  anonymized = anonymized.replace(
    /\b(?:født|born|fødselsdato|date of birth)[:\s]*\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/gi,
    '[FØDSELSDATO]'
  );
  
  // Birth years (e.g., "født i 1990", "born 1985")
  anonymized = anonymized.replace(
    /\b(?:født|born)\s+(?:i\s+)?(?:19|20)\d{2}\b/gi,
    '[FØDSELSÅR]'
  );
  
  // Standalone birth dates in CV headers
  anonymized = anonymized.replace(
    /\b(?:19|20)\d{2}-\d{2}-\d{2}\b/g,
    '[FØDSELSDATO]'
  );
  
  // ============================================
  // 4. GENDER INDICATORS REMOVAL (Bias Factor)
  // ============================================
  
  // Gender pronouns (Danish: han/hun/hans/hendes)
  anonymized = anonymized.replace(
    /\b(han|hun|hans|hendes)\b/gi,
    'vedkommende'
  );
  
  // Gender-specific titles
  anonymized = anonymized.replace(
    /\b(Hr\.|Fru|Frk\.)\s+/gi,
    ''
  );
  
  // ============================================
  // 5. SOCIAL MEDIA AND WEB PROFILES
  // ============================================
  
  // LinkedIn profiles
  anonymized = anonymized.replace(
    /\b(?:linkedin\.com)\/(?:in\/)?[\w\-]+\b/gi,
    '[LINKEDIN]'
  );
  
  // General social media profiles
  anonymized = anonymized.replace(
    /\b(?:facebook\.com|twitter\.com|instagram\.com|github\.com)\/[\w\-]+\b/gi,
    '[SOCIAL_PROFIL]'
  );
  
  // Personal websites/portfolios
  anonymized = anonymized.replace(
    /\b(?:https?:\/\/)?(?:www\.)?[\w\-]+\.(?:dk|com|net|org)(?:\/[\w\-]+)*\b/gi,
    '[WEBSITE]'
  );
  
  // ============================================
  // 6. PHOTO AND IMAGE REFERENCES
  // ============================================
  
  anonymized = anonymized.replace(
    /\b(?:foto|billede|picture|photo|image|portræt)\b/gi,
    '[BILLEDE]'
  );
  
  // ============================================
  // 7. MARITAL STATUS AND FAMILY (Bias Factor)
  // ============================================
  
  // Marital status
  anonymized = anonymized.replace(
    /\b(?:gift|ugift|skilt|samlevende|single|married|divorced)[,\s]/gi,
    '[CIVILSTAND] '
  );
  
  // Children/family mentions
  anonymized = anonymized.replace(
    /\b(?:\d+\s+)?(?:barn|børn|child|children|kids)[,\s]/gi,
    '[FAMILIE] '
  );
  
  // ============================================
  // 8. NATIONALITY (Potential Bias Factor)
  // ============================================
  
  // Nationality mentions (be careful not to remove language skills)
  anonymized = anonymized.replace(
    /\b(?:nationalitet|nationality|statsborgerskab|citizenship)[:\s]*[A-ZÆØÅ][a-zæøå]+\b/gi,
    '[NATIONALITET]'
  );
  
  // ============================================
  // 9. DRIVER'S LICENSE (Can indicate age/lifestyle)
  // ============================================
  
  anonymized = anonymized.replace(
    /\b(?:kørekort|driver'?s?\s*license|kategori\s+[ABC])\b/gi,
    '[KØREKORT]'
  );
  
  // ============================================
  // 10. CLEAN UP EXCESS WHITESPACE
  // ============================================
  
  // Replace multiple spaces with single space
  anonymized = anonymized.replace(/\s{2,}/g, ' ');
  
  // Remove multiple newlines (but preserve paragraph structure)
  anonymized = anonymized.replace(/\n{3,}/g, '\n\n');
  
  // Trim leading/trailing whitespace
  anonymized = anonymized.trim();
  
  return anonymized;
}

/**
 * Check if text contains potentially sensitive information
 * Useful for validation and testing
 * 
 * @param text - Text to check
 * @returns Object indicating types of sensitive data found
 */
export function detectSensitiveInfo(text: string): {
  hasCPR: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  hasAddress: boolean;
  hasAge: boolean;
  hasSocialMedia: boolean;
} {
  return {
    hasCPR: /\b\d{6}-?\d{4}\b/.test(text),
    hasPhone: /\b(\+?45)?\s?(\d{2}\s?\d{2}\s?\d{2}\s?\d{2}|\d{8})\b/.test(text),
    hasEmail: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(text),
    hasAddress: /\b\d{4}\s+[A-ZÆØÅa-zæøå]/.test(text),
    hasAge: /\b(?:alder|age|år|years?\s+old)[:\s]*\d{1,2}/.test(text),
    hasSocialMedia: /\b(?:linkedin|facebook|twitter|instagram)\.com/.test(text),
  };
}

/**
 * Get anonymization statistics for logging/debugging
 * 
 * @param originalText - Original CV text
 * @param anonymizedText - Anonymized CV text
 * @returns Statistics about the anonymization process
 */
export function getAnonymizationStats(
  originalText: string, 
  anonymizedText: string
): {
  originalLength: number;
  anonymizedLength: number;
  reductionPercent: number;
  placeholdersCount: number;
} {
  const placeholders = anonymizedText.match(/\[([A-ZÆØÅ_]+)\]/g) || [];
  
  return {
    originalLength: originalText.length,
    anonymizedLength: anonymizedText.length,
    reductionPercent: Math.round(
      ((originalText.length - anonymizedText.length) / originalText.length) * 100
    ),
    placeholdersCount: placeholders.length,
  };
}

