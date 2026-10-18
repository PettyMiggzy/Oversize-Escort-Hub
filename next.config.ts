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
    ]
  },
}

export default nextConfig as any
