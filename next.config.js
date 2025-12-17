/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // appDir is now default in Next.js 15
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
    
    // Content Security Policy (CSP)
    // Prevents XSS attacks and unauthorized resource loading
    const ContentSecurityPolicy = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https: blob:;
      font-src 'self' data:;
      connect-src 'self' https://*.supabase.co https://api.openai.com https://api.stripe.com;
      frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim()
    
    const baseHeaders = [
      // Prevent clickjacking attacks
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      // Prevent MIME type sniffing
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      // Control referrer information
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      // Enable browser XSS protection (legacy, but doesn't hurt)
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      // Content Security Policy (primary XSS defense)
      {
        key: 'Content-Security-Policy',
        value: ContentSecurityPolicy,
      },
      // Permissions Policy (restrict browser features)
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
      },
    ]
    
    // Add noindex header for staging/development
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