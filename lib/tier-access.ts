import { createClient } from '@/lib/supabase/server';

const adminEmails = ['bahmed3170@gmail.com', 'brian@precisionpilotservices.com'];

// Numeric rank for every tier value that can appear in profiles.tier.
// Anything not listed (null/undefined/'free') ranks 0.
const TIER_RANK: Record<string, number> = {
  free: 0,
  trial: 0,
  member: 1,
  carrier_member: 1,
  pro: 2,
  fleet_starter: 2,
  fleet_plus: 2,
  fleet_pro: 2,
};

const REQUIRED_RANK: Record<'trial' | 'member' | 'pro', number> = {
  trial: 0,
  member: 1,
  pro: 2,
};

export async function checkTierAccess(userId: string, email: string, requiredTier: 'trial' | 'member' | 'pro', userRole?: string): Promise<boolean> {
  // Admin bypass
  if (userRole === 'admin' || adminEmails.includes(email)) {
    return true;
  }

  // Carriers are always free
  if (userRole === 'carrier') {
    return true;
  }

  if (!userId) return false;

  try {
    const supabase = await createClient();

    // Source of truth for tier is profiles.tier (matches the rest of the app).
    const { data, error } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', userId)
      .single();

    if (error || !data) return false;

    const rank = TIER_RANK[((data as { tier?: string }).tier) ?? 'free'] ?? 0;
    return rank >= REQUIRED_RANK[requiredTier];
  } catch {
    return false;
  }
}

export function getTierFeatures(tier: 'trial' | 'member' | 'pro') {
  const features = {
    trial: {
      jobLogsMax: 5,
      canApply: false,
      canContact: false,
      canInvoice: false,
      canHeadStart: false,
      canDeadheadMinimizer: false,
      canPDF: false,
    },
    member: {
      jobLogsMax: Infinity,
      canApply: true,
      canContact: true,
      canInvoice: true,
      canHeadStart: false,
      canDeadheadMinimizer: false,
      canPDF: false,
    },
    pro: {
      jobLogsMax: Infinity,
      canApply: true,
      canContact: true,
      canInvoice: true,
      canHeadStart: true,
      canDeadheadMinimizer: true,
      canPDF: true,
    },
  };
  return features[tier];
}

export async function enforceTierLimit(userId: string, feature: 'jobLogs', tier: 'trial' | 'member' | 'pro'): Promise<boolean> {
  if (feature === 'jobLogs' && tier === 'trial') {
    try {
      const supabase = await createClient();

      const { count, error } = await supabase
        .from('job_logs')
        .select('*', { count: 'exact' })
        .eq('escort_id', userId);

      if (error) return false;
      return (count || 0) < 5;
    } catch {
      return false;
    }
  }
  return true;
}
