/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // appDir is now default in Next.js 15
  },
  sentry: {
    // Upload sourcemaps only if DSN present
    hideSourceMaps: true,
    autoInstrumentServerFunctions: true,
  },
  images: {
    // "domains" is deprecated; use remotePatterns
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },
  // Enable TypeScript strict mode
  typescript: {
    ignoreBuildErrors: false,
  },
  // Security headers for production
  async headers() {
    const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === '1'
    const baseHeaders = [
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
    ]
    if (!allowIndexing) {
      baseHeaders.push({ key: 'X-Robots-Tag', value: 'noindex, nofollow' })
    }
    return [
      {
        source: '/(.*)',
        headers: baseHeaders,
      },
    ]
  },
}

module.exports = nextConfig 