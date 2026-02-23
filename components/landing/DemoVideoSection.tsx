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
 */
import { useState, useCallback } from 'react'
import { DEMO_VIDEO_URL, DEMO_VIDEO_TITLE } from '@/lib/demo-content'

/** Tjek om URL er lokal fil (starter med /) – bruges til HTML5 video vs iframe */
const isLocalVideo = (url: string) => url.startsWith('/')

export function DemoVideoSection() {
  // Aspect ratio fra videoens metadata (width/height). Default 9:16 for vertikal video.
  const [aspectRatio, setAspectRatio] = useState<string | null>(null)

  const onVideoLoadedMetadata = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    if (video.videoWidth && video.videoHeight) {
      setAspectRatio(`${video.videoWidth} / ${video.videoHeight}`)
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
