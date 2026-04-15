import { createBrowserClient } from '@supabase/ssr';

const adminEmails = ['bahmed3170@gmail.com', 'brian@precisionpilotservices.com'];

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
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('tier, subscription_status')
      .eq('user_id', userId)
      .single();

    if (error || !data) return false;

    if (data.subscription_status === 'canceled' || data.subscription_status === 'inactive') {
      return false;
    }

    const tierHierarchy = { trial: 0, member: 1, pro: 2 };
    return (tierHierarchy as Record<string, number>)[data?.tier ?? ""] >= (tierHierarchy as Record<string, number>)[requiredTier];
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
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

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
