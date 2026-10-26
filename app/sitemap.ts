import { spawnSync } from "node:child_process";
import { MetadataRoute } from "next";
import { STATIC_STATE_CODES } from "@/lib/state-codes";

const SITE = "https://www.oversize-escort-hub.com";

// This stays a normal function because the state-page test calls sitemap().map.
// Open jobs are read with the anon client in a short child process so that call can finish.
function openJobEntries(): MetadataRoute.Sitemap {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("example.supabase.co")) return [];
  const script = `
    import { createClient } from '@supabase/supabase-js'
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
    sb.from('job_posts').select('id, created_at').eq('status', 'open').gt('expires_at', new Date().toISOString()).limit(1000)
      .then(({ data, error }) => { process.stdout.write(JSON.stringify((error || !Array.isArray(data)) ? [] : data)) })
      .catch(() => { process.stdout.write('[]') })
  `;
  try {
    const res = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      encoding: "utf8",
      timeout: 8000,
      env: process.env,
      cwd: process.cwd(),
    });
    const raw = (res.stdout || "").trim();
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((row: { id?: unknown; created_at?: unknown }) => {
      if (!row || typeof row.id !== "string" || !/^[0-9a-f-]{36}$/i.test(row.id)) return [];
      const lastModified = new Date(String(row.created_at ?? ""));
      return [{
        url: `${SITE}/jobs/${row.id}`,
        lastModified: Number.isNaN(lastModified.getTime()) ? new Date() : lastModified,
        changeFrequency: "daily" as const,
        priority: 0.6,
      }];
    });
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.oversize-escort-hub.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://www.oversize-escort-hub.com/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.oversize-escort-hub.com/privacy",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://www.oversize-escort-hub.com/terms",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...STATIC_STATE_CODES.map((code) => ({
      url: `https://www.oversize-escort-hub.com/pilot-car-escorts/${code.toLowerCase()}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    {
      url: `${SITE}/jobs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...openJobEntries(),
  ];
}
