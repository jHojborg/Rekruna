'use client'

/**
 * DemoVideoSection – Videoafspiller til /demo
 *
 * Understøtter lokal MP4-fil (fx /images/RekrunaDemo.mp4) eller
 * YouTube/Vimeo embed URL. Rediger DEMO_VIDEO_URL i lib/demo-content.ts.
 *
 * For lokale videoer: containeren tilpasser sig automatisk videoens
 * aspect ratio (vertikal/portrait eller horisontal/landscape), så der
 * ikke vises sorte bjælker.
 * pt-4 reducerer afstanden fra hero-headline (yderligere 50% mindre end oprindeligt).
 *
 * GA4 + Meta Pixel tracking: video_start, video_progress (50%), video_complete.
 * Kun for lokale MP4-videoer – YouTube/iframe understøttes ikke.
 */
import { useState, useCallback, useRef } from 'react'
import { DEMO_VIDEO_URL, DEMO_VIDEO_TITLE } from '@/lib/demo-content'

/** Tjek om URL er lokal fil (starter med /) – bruges til HTML5 video vs iframe */
const isLocalVideo = (url: string) => url.startsWith('/')

/** GA4 gtag + Meta fbq – defineret i layout.tsx */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

const VIDEO_CONTENT_NAME = DEMO_VIDEO_TITLE || 'Rekruna Demo'

/** Sender GA4 event hvis gtag er tilgængelig. Try-catch forhindrer crash. */
function sendGA4Event(eventName: string, params?: Record<string, string>) {
  try {
    if (typeof window === 'undefined' || !window.gtag) return
    window.gtag('event', eventName, {
      video_title: VIDEO_CONTENT_NAME,
      video_url: DEMO_VIDEO_URL,
      ...params,
    })
  } catch {
    // Ignorer – analytics må aldrig crashe appen
  }
}

/** Sender Meta Pixel event. VideoView/VideoComplete er standard-events, VideoProgress50 er custom. */
function sendMetaEvent(eventName: string, isCustom = false, params?: Record<string, string>) {
  try {
    if (typeof window === 'undefined' || !window.fbq) return
    const metaParams = { content_name: VIDEO_CONTENT_NAME, content_type: 'video', ...params }
    if (isCustom) {
      window.fbq('trackCustom', eventName, metaParams)
    } else {
      window.fbq('track', eventName, metaParams)
    }
  } catch {
    // Ignorer – analytics må aldrig crashe appen
  }
}

export function DemoVideoSection() {
  // Aspect ratio fra videoens metadata (width/height). Default 9:16 for vertikal video.
  const [aspectRatio, setAspectRatio] = useState<string | null>(null)
  // Track om vi allerede har sendt video_progress 50% – undgår dubletter
  const progress50Fired = useRef(false)

  const onVideoLoadedMetadata = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    if (video.videoWidth && video.videoHeight) {
      setAspectRatio(`${video.videoWidth} / ${video.videoHeight}`)
    }
  }, [])

  /** GA4 + Meta: video_start / VideoView – når bruger trykker play */
  const onPlay = useCallback(() => {
    sendGA4Event('video_start')
    sendMetaEvent('VideoView')
  }, [])

  /** GA4 + Meta: video_complete / VideoComplete – når videoen er færdig. Nulstiller 50%-flag. */
  const onEnded = useCallback(() => {
    sendGA4Event('video_complete')
    sendMetaEvent('VideoComplete')
    progress50Fired.current = false
  }, [])

  /** GA4 + Meta: video_progress 50% / VideoProgress50 – når bruger når halvvejs. Fires kun én gang. */
  const onTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (progress50Fired.current) return
    const video = e.currentTarget
    const duration = video.duration
    if (!duration || !isFinite(duration)) return
    if (video.currentTime / duration >= 0.5) {
      progress50Fired.current = true
      sendGA4Event('video_progress', { progress_percent: '50' })
      sendMetaEvent('VideoProgress50', true, { progress_percent: '50' })
    }
  }, [])

  return (
    <section className="pt-4 pb-16 bg-brand-base">
      {/* max-w-md ≈ 50% af tidligere max-w-4xl – videoen vises mindre og mere diskret */}
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          {DEMO_VIDEO_TITLE}
        </h2>
        {/* Container tilpasser sig videoens format – vertikal (9:16) eller horisontal (16:9) */}
        <div
          className="relative w-full rounded-xl overflow-hidden shadow-lg bg-gray-100"
          style={{
            // Lokal video: brug detekteret ratio, ellers 9:16 (vertikal). Iframe: 16:9 (YouTube/Vimeo).
            aspectRatio: isLocalVideo(DEMO_VIDEO_URL)
              ? (aspectRatio ?? '9 / 16')
              : '16 / 9'
          }}
        >
          {isLocalVideo(DEMO_VIDEO_URL) ? (
            <video
              src={DEMO_VIDEO_URL}
              title={DEMO_VIDEO_TITLE}
              controls
              playsInline
              onLoadedMetadata={onVideoLoadedMetadata}
              onPlay={onPlay}
              onEnded={onEnded}
              onTimeUpdate={onTimeUpdate}
              className="absolute inset-0 w-full h-full object-contain"
            >
              Din browser understøtter ikke videoafspilning.
            </video>
          ) : (
            <iframe
              src={DEMO_VIDEO_URL}
              title={DEMO_VIDEO_TITLE}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          )}
        </div>
      </div>
    </section>
  )
}
