'use client'

/**
 * DemoVideoSection – Videoafspiller til /demo
 *
 * Understøtter lokal MP4-fil (fx /images/RekrunaDemo.mp4) eller
 * YouTube/Vimeo embed URL. Rediger DEMO_VIDEO_URL i lib/demo-content.ts.
 */
import { DEMO_VIDEO_URL, DEMO_VIDEO_TITLE } from '@/lib/demo-content'

/** Tjek om URL er lokal fil (starter med /) – bruges til HTML5 video vs iframe */
const isLocalVideo = (url: string) => url.startsWith('/')

export function DemoVideoSection() {
  return (
    <section className="py-16 bg-brand-base">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          {DEMO_VIDEO_TITLE}
        </h2>
        {/* 16:9 aspect ratio container for video */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-gray-100">
          {isLocalVideo(DEMO_VIDEO_URL) ? (
            <video
              src={DEMO_VIDEO_URL}
              title={DEMO_VIDEO_TITLE}
              controls
              playsInline
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
