const nextConfig = {
  // No output: 'export' — we need server-side features for Supabase auth
  typescript: {
    ignoreBuildErrors: false,
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
