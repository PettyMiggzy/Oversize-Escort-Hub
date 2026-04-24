
const nextConfig = {
  // No output: 'export' — we need server-side features for Supabase auth
  typescript: {
    ignoreBuildErrors: false,
  },
}

export default nextConfig as any
