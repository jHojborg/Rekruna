/**
 * Demo landingsider – indholdskonfiguration
 *
 * Rediger dette fil for at rette alt indhold på /demo-a og /demo-b.
 * Brugernes formular-data sendes til support@rekruna.dk.
 */

// ============================================
// HERO BILLEDE (fælles for begge demo-sider)
// ============================================
// Billede bruges som baggrund. 50% højde af forside-hero (100vh → 50vh).
export const DEMO_HERO_IMAGE = '/images/Hero-Temp-Image.jpeg'
export const DEMO_HERO_IMAGE_ALT = 'Rekruna demo'

// ============================================
// VIDEO SEKTION (kun demo-a)
// ============================================
// YouTube embed URL. Eksempel: "https://www.youtube.com/embed/VIDEO_ID"
// Eller Vimeo: "https://player.vimeo.com/video/VIDEO_ID"
export const DEMO_VIDEO_URL = 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Erstat med din demo-video URL

export const DEMO_VIDEO_TITLE = 'Se Rekruna i aktion'

// ============================================
// TEKSTFELT "Se hele demovideo.."
// ============================================
export const DEMO_VIDEO_CTA_TEXT =
  'Se hele demovideo og få en personlig gennemgang af, hvordan Rekruna kan hjælpe jeres virksomhed med at spare tid på CV-screening.'

// ============================================
// KONTAKTFORMULAR
// ============================================
export const DEMO_FORM = {
  // Labels og pladsholdere
  nameLabel: 'Navn',
  namePlaceholder: 'Dit fulde navn',
  companyLabel: 'Firma',
  companyPlaceholder: 'Dit firmanavn',
  emailLabel: 'E-mail',
  emailPlaceholder: 'din@email.dk',
  // Checkbox tekst – "Ja tak til at modtage video samt ...."
  checkboxLabel:
    'Ja tak til at modtage video samt relevante opdateringer om Rekruna',
  submitButton: 'Send – så sender vi dig videoen',
  submitLoading: 'Sender...',
  // Success/tak besked
  successTitle: 'Tak for din interesse!',
  successMessage: 'Vi sender dig videoen på mail inden længe.',
}
