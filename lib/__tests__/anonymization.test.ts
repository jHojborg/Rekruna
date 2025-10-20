/**
 * CV Anonymization Tests
 * 
 * Validates that the anonymization function correctly removes
 * personal information and bias factors while preserving
 * professional qualifications.
 */

import { anonymizeCVText, detectSensitiveInfo, getAnonymizationStats } from '../anonymization'

describe('CV Anonymization', () => {
  const candidateName = 'John Doe'

  describe('anonymizeCVText', () => {
    it('should remove CPR numbers', () => {
      const cv = 'John Doe\nCPR: 150390-1234\nSenior Developer'
      const result = anonymizeCVText(cv, candidateName)
      
      expect(result).not.toContain('150390-1234')
      expect(result).toContain('[CPR]')
      expect(result).toContain('Senior Developer')
    })

    it('should remove phone numbers in various formats', () => {
      const cv = `
        Telefon: +45 12 34 56 78
        Mobil: 12345678
        Tlf: +4587654321
      `
      const result = anonymizeCVText(cv, candidateName)
      
      expect(result).not.toContain('12 34 56 78')
      expect(result).not.toContain('12345678')
      expect(result).not.toContain('+4587654321')
      expect(result).toContain('[TELEFON]')
    })

    it('should remove email addresses', () => {
      const cv = 'john.doe@email.com\njohn_doe123@company.dk'
      const result = anonymizeCVText(cv, candidateName)
      
      expect(result).not.toContain('john.doe@email.com')
      expect(result).not.toContain('john_doe123@company.dk')
      expect(result).toContain('[EMAIL]')
    })

    it('should remove addresses and postal codes', () => {
      const cv = 'Adresse: Hovedgaden 123, 2100 København Ø'
      const result = anonymizeCVText(cv, candidateName)
      
      expect(result).not.toContain('2100 København')
      expect(result).toContain('[ADRESSE]')
    })

    it('should remove age and date of birth', () => {
      const cv = `
        Født: 15-03-1990
        Alder: 34 år
        Age: 35 years old
      `
      const result = anonymizeCVText(cv, candidateName)
      
      expect(result).not.toContain('1990')
      expect(result).not.toContain('34 år')
      expect(result).toContain('[FØDSELSDATO]')
      expect(result).toContain('[ALDER]')
    })

    it('should replace gender pronouns', () => {
      const cv = 'Han har arbejdet som udvikler. Hun har erfaring med React.'
      const result = anonymizeCVText(cv, candidateName)
      
      expect(result).not.toContain('Han har')
      expect(result).not.toContain('Hun har')
      expect(result).toContain('vedkommende')
    })

    it('should remove social media profiles', () => {
      const cv = `
        LinkedIn: linkedin.com/in/johndoe
        GitHub: github.com/johndoe
        Twitter: twitter.com/johndoe
      `
      const result = anonymizeCVText(cv, candidateName)
      
      expect(result).not.toContain('linkedin.com/in/johndoe')
      expect(result).toContain('[LINKEDIN]')
      expect(result).toContain('[SOCIAL_PROFIL]')
    })

    it('should remove marital status and family info', () => {
      const cv = 'Gift, 2 børn\nCivilstand: Samlevende'
      const result = anonymizeCVText(cv, candidateName)
      
      expect(result).not.toContain('Gift')
      expect(result).not.toContain('2 børn')
      expect(result).toContain('[CIVILSTAND]')
      expect(result).toContain('[FAMILIE]')
    })

    it('should preserve candidate name', () => {
      const cv = `${candidateName}\nSenior Developer\nReact Expert`
      const result = anonymizeCVText(cv, candidateName)
      
      expect(result).toContain(candidateName)
    })

    it('should preserve professional qualifications', () => {
      const cv = `
        Senior Software Developer
        Kompetencer: React, TypeScript, Node.js
        Erfaring: 5+ år med webudvikling
        Uddannelse: Datamatiker
        Certificering: AWS Certified Developer
      `
      const result = anonymizeCVText(cv, candidateName)
      
      expect(result).toContain('Senior Software Developer')
      expect(result).toContain('React')
      expect(result).toContain('TypeScript')
      expect(result).toContain('5+ år')
      expect(result).toContain('Datamatiker')
      expect(result).toContain('AWS Certified')
    })

    it('should handle empty or invalid input', () => {
      expect(anonymizeCVText('', candidateName)).toBe('')
      expect(anonymizeCVText('   ', candidateName)).toBe('')
    })

    it('should handle real-world CV example', () => {
      const cv = `
John Doe
Født: 15-03-1990 (34 år)
Email: john.doe@email.com
Telefon: +45 12 34 56 78
Adresse: Hovedgaden 123, 2100 København Ø
LinkedIn: linkedin.com/in/johndoe
Civilstand: Gift, 2 børn

PROFIL
Senior Software Developer med 8+ års erfaring inden for full-stack udvikling.
Han har arbejdet med moderne teknologier og ledet mindre teams.

ERFARING
Lead Developer - Microsoft Danmark (2020-2024)
- Ledede team på 5 udviklere
- Implementerede microservices arkitektur
- Arbejdede med React, TypeScript, Azure

Senior Developer - TDC Net (2018-2020)
- Full-stack udvikling med Node.js og React
- CI/CD pipelines med Jenkins

KOMPETENCER
Frontend: React, Vue.js, TypeScript, HTML5, CSS3
Backend: Node.js, Python, C#, .NET
Cloud: Azure, AWS
Sprog: Dansk (modersmål), Engelsk (flydende)

UDDANNELSE
Datamatiker - KEA København (2014-2016)
BSc i Softwareudvikling - ITU (2016-2018)

KØREKORT: Kategori B
      `
      
      const result = anonymizeCVText(cv, candidateName)
      
      // Should remove personal data
      expect(result).not.toContain('15-03-1990')
      expect(result).not.toContain('34 år')
      expect(result).not.toContain('john.doe@email.com')
      expect(result).not.toContain('+45 12 34 56 78')
      expect(result).not.toContain('2100 København')
      expect(result).not.toContain('linkedin.com/in/johndoe')
      expect(result).not.toContain('Gift, 2 børn')
      expect(result).not.toContain('Han har')
      
      // Should preserve professional info
      expect(result).toContain('John Doe')
      expect(result).toContain('Senior Software Developer')
      expect(result).toContain('8+ års erfaring')
      expect(result).toContain('Microsoft Danmark')
      expect(result).toContain('React')
      expect(result).toContain('TypeScript')
      expect(result).toContain('Node.js')
      expect(result).toContain('Datamatiker')
      
      // Should have anonymization placeholders
      expect(result).toContain('[EMAIL]')
      expect(result).toContain('[TELEFON]')
      expect(result).toContain('[ADRESSE]')
      expect(result).toContain('[LINKEDIN]')
      expect(result).toContain('vedkommende')
    })
  })

  describe('detectSensitiveInfo', () => {
    it('should detect CPR numbers', () => {
      const text = 'CPR: 150390-1234'
      const result = detectSensitiveInfo(text)
      expect(result.hasCPR).toBe(true)
    })

    it('should detect phone numbers', () => {
      const text = 'Telefon: +45 12 34 56 78'
      const result = detectSensitiveInfo(text)
      expect(result.hasPhone).toBe(true)
    })

    it('should detect email addresses', () => {
      const text = 'Email: john@example.com'
      const result = detectSensitiveInfo(text)
      expect(result.hasEmail).toBe(true)
    })

    it('should detect addresses', () => {
      const text = '2100 København Ø'
      const result = detectSensitiveInfo(text)
      expect(result.hasAddress).toBe(true)
    })

    it('should detect age mentions', () => {
      const text = 'Alder: 34 år'
      const result = detectSensitiveInfo(text)
      expect(result.hasAge).toBe(true)
    })

    it('should detect social media', () => {
      const text = 'linkedin.com/in/johndoe'
      const result = detectSensitiveInfo(text)
      expect(result.hasSocialMedia).toBe(true)
    })

    it('should return all false for clean text', () => {
      const text = 'Senior Developer with React experience'
      const result = detectSensitiveInfo(text)
      
      expect(result.hasCPR).toBe(false)
      expect(result.hasPhone).toBe(false)
      expect(result.hasEmail).toBe(false)
      expect(result.hasAddress).toBe(false)
      expect(result.hasAge).toBe(false)
      expect(result.hasSocialMedia).toBe(false)
    })
  })

  describe('getAnonymizationStats', () => {
    it('should calculate statistics correctly', () => {
      const original = 'John Doe\nEmail: john@email.com\nPhone: 12345678\nSenior Developer'
      const anonymized = 'John Doe\nEmail: [EMAIL]\nPhone: [TELEFON]\nSenior Developer'
      
      const stats = getAnonymizationStats(original, anonymized)
      
      expect(stats.originalLength).toBe(original.length)
      expect(stats.anonymizedLength).toBe(anonymized.length)
      expect(stats.placeholdersCount).toBe(2) // [EMAIL] and [TELEFON]
      expect(stats.reductionPercent).toBeGreaterThan(0)
    })

    it('should handle no reduction', () => {
      const text = 'Senior Developer with React experience'
      const stats = getAnonymizationStats(text, text)
      
      expect(stats.reductionPercent).toBe(0)
      expect(stats.placeholdersCount).toBe(0)
    })
  })
})

