import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/hostile-audit/**/*.test.ts'],
    setupFiles: ['tests/hostile-audit/setup.ts'],
    fileParallelism: false,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-test',
      SUPABASE_SERVICE_ROLE_KEY: 'service-test',
      STRIPE_SECRET_KEY: 'sk_test_hostile',
      STRIPE_WEBHOOK_SECRET: 'whsec_hostile',
      CRON_SECRET: 'cron-test-secret',
      NEXT_PUBLIC_FREE_LAUNCH: 'true',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
})
