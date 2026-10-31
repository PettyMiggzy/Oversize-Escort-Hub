import { vi } from 'vitest'

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server')
  return { ...actual, after: () => {} }
})

vi.mock('@supabase/supabase-js', async () => {
  const { createMockClient } = await import('./mock-client')
  return { createClient: () => createMockClient('service') }
})

vi.mock('@/lib/supabase/server', async () => {
  const { createMockClient } = await import('./mock-client')
  return { createClient: async () => createMockClient('user') }
})

vi.mock('@/lib/push', async () => {
  const { getDb } = await import('./mock-client')
  return {
    sendWebPushToUser: async (userId: string, payload: unknown) => {
      getDb().pushes.push({ userId, payload })
    },
    sendWebPushToUsers: async () => {},
  }
})

vi.mock('resend', () => {
  class Resend {
    emails = { send: async () => ({ data: { id: 'email' }, error: null }) }
  }
  return { Resend }
})

vi.mock('stripe', async () => {
  const { getDb } = await import('./mock-client')
  class Stripe {
    webhooks = {
      constructEvent: () => {
        const event = getDb().stripeEvent
        if (!event) throw new Error('signature')
        return event
      },
    }
    subscriptions = {
      cancel: async (id: string) => {
        getDb().stripeCalls.push({ op: 'cancel', id })
        return { id, status: 'canceled' }
      },
      update: async (id: string, params: unknown) => {
        getDb().stripeCalls.push({ op: 'update', id, params })
        return { id }
      },
    }
    customers = {
      del: async (id: string) => {
        getDb().stripeCalls.push({ op: 'del', id })
        return { id, deleted: true }
      },
      retrieve: async (id: string) => {
        getDb().stripeCalls.push({ op: 'retrieve', id })
        return { id, email: null, deleted: false }
      },
      list: async () => ({ data: [] }),
      create: async () => ({ id: 'cus_new' }),
    }
    checkout = {
      sessions: {
        create: async (params: unknown) => { getDb().stripeCalls.push({ op: 'checkout', params }); return { id: 'cs_test', url: 'https://checkout.test/session' } },
      },
    }
    billingPortal = {
      sessions: {
        create: async (params: unknown) => { getDb().stripeCalls.push({ op: 'portal', params }); return { url: 'https://portal.test/session' } },
      },
    }
    prices = { retrieve: async () => ({ unit_amount: 999, recurring: { interval: 'month' } }) }
  }
  return { default: Stripe }
})
