// Report-Only for now: browsers log what the policy would block, nothing on the live site is blocked.
// Read the reports, then switch the key to 'Content-Security-Policy'.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.weather.gov https://vitals.vercel-insights.com https://va.vercel-scripts.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'none'",
].join('; ')

const nextConfig = {
  // No output: 'export' — we need server-side features for Supabase auth
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy-Report-Only', value: CSP },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/loads/bid',
        destination: '/bid-board',
        permanent: true, // 308
      },
      { source: '/privacy-policy', destination: '/privacy', permanent: true },
      { source: '/privacypolicy', destination: '/privacy', permanent: true },
      { source: '/terms-of-service', destination: '/terms', permanent: true },
      { source: '/terms-and-conditions', destination: '/terms', permanent: true },
    ]
  },
}

export default nextConfig as any
