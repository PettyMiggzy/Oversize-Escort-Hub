import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // No output: 'export' — we need server-side features for Supabase auth
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
