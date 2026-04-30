'use client';

import { useState, Suspense, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isNativeApp, openInBrowser, WEB_HOST } from '@/lib/native';
import { useSearchParams } from 'next/navigation';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#06080a;--p1:#0f1318;--p2:#141a1f;--l1:#1c2229;--l2:#252d36;--or:#ff6200;--am:#f5a200;--gr:#00cc7a;--rd:#ff3535;--bl:#3d8ef8;--t1:#dce0e6;--t2:#6e7a88;--t3:#363f4a}
body{background:var(--bg);color:var(--t1);font-family:'Inter',system-ui,sans-serif;font-size:13px;line-height:1.6;min-height:100vh}
.bb{font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:.03em;text-transform:uppercase}
.mo{font-family:'DM Mono','Courier New',monospace}
input{font-family:'Inter',system-ui,sans-serif;background:var(--p2);border:1px solid var(--l2);color:var(--t1);padding:10px 14px;border-radius:3px;font-size:13px;outline:none;width:100%}
input:focus{border-color:var(--or)}
button{cursor:pointer;font-family:'Inter',system-ui,sans-serif}
.wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg)}
.box{background:var(--p1);border:1px solid var(--l1);border-radius:4px;padding:40px;width:100%;max-width:440px}
.label{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--t2);display:block;margin-bottom:6px}
.field{margin-bottom:18px}
.btn{display:flex;align-items:center;justify-content:center;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;padding:13px 22px;border:none;width:100%;margin-bottom:12px;cursor:pointer}
.btn-or{background:var(--or);color:#000}
.btn-am{background:var(--am);color:#000}
.btn-fleet{background:var(--bl);color:#fff}
.btn:disabled{opacity:.5;cursor:not-allowed}
.role-toggle{display:flex;border:1px solid var(--l1);border-radius:3px;overflow:hidden;margin-bottom:20px}
.role-btn{flex:1;padding:10px;background:transparent;border:none;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--t2);cursor:pointer}
.role-btn.active-escort{background:var(--am);color:#000}
.role-btn.active-carrier{background:var(--or);color:#000}
.role-btn.active-fleet{background:var(--bl);color:#fff}
.error{background:rgba(255,53,53,.1);border:1px solid rgba(255,53,53,.2);color:var(--rd);font-family:'DM Mono',monospace;font-size:10px;padding:10px 14px;border-radius:3px;margin-bottom:16px}
.success{background:rgba(0,204,122,.1);border:1px solid rgba(0,204,122,.2);color:var(--gr);font-family:'DM Mono',monospace;font-size:10px;padding:10px 14px;border-radius:3px;margin-bottom:16px}
.switch{text-align:center;margin-top:4px}
.switch span{font-family:'DM Mono',monospace;font-size:10px;color:var(--t2)}
.switch button{background:none;border:none;color:var(--or);font-family:'DM Mono',monospace;font-size:10px;cursor:pointer;text-decoration:underline;margin-left:4px}
`;

function SignInInner() {
  const supabase = createClient();
  // One-time migration: older clients stored the session in localStorage only
  // (@supabase/supabase-js default). The rest of the app now reads cookies via
  // @supabase/ssr, so lift that token into cookies on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!url) return;
        const ref = new URL(url).hostname.split('.')[0];
        const key = `sb-${ref}-auth-token`;
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
        if (!raw) return;

        // If cookies already have a session, nothing to do.
        const { data: { session: existing } } = await supabase.auth.getSession();
        if (existing) { window.localStorage.removeItem(key); return; }

        let parsed: any = null;
        try { parsed = JSON.parse(raw); } catch { /* ignore */ }
        const access_token = parsed?.access_token ?? parsed?.currentSession?.access_token;
        const refresh_token = parsed?.refresh_token ?? parsed?.currentSession?.refresh_token;
        if (!access_token || !refresh_token) return;

        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) return;
        window.localStorage.removeItem(key);
        if (cancelled) return;
        // Full nav so the cookie is sent on the next request and server components see it.
        window.location.href = redirectPath;
      } catch { /* swallow: failed migration just means the user signs in again */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const redirectPath = redirectParam ? '/' + redirectParam.replace(/^\/+/, '') : '/dashboard';
  const roleParamRaw = searchParams.get('role');
  const allowedRoles = ['escort', 'carrier', 'broker', 'fleet_manager'] as const;
  const initialRole = (allowedRoles as readonly string[]).includes(roleParamRaw ?? '')
    ? (roleParamRaw as 'escort' | 'carrier' | 'broker' | 'fleet_manager')
    : 'escort';
  const [mode, setMode] = useState<"signup" | "signin">("signin");
  const [role, setRole] = useState<"escort" | "carrier" | "fleet_manager" | "broker">(initialRole);
  const [plan, setPlan] = useState<"trial" | "member" | "pro" | null>(null);
  const [trialBlocked, setTrialBlocked] = useState(false);
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string>("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendNotice, setResendNotice] = useState<string>("");

  function getFingerprint() {
    const raw = navigator.userAgent + screen.width + screen.height + navigator.language;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  async function handleCheckout(priceId: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || 'Checkout failed');
    } catch {
      setError('Checkout failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleTrialSelect() {
    setLoading(true);
    setError("");
    const fp = getFingerprint();
    try {
      const res = await fetch(`/api/check-trial?fp=${fp}`);
      const data = await res.json();
      if (data.used) {
        setTrialBlocked(true);
      } else {
        setPlan("trial");
      }
    } catch {
      setPlan("trial");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendConfirmation() {
    if (!unconfirmedEmail) return;
    setResendLoading(true);
    setResendNotice("");
    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email: unconfirmedEmail,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (resendErr) {
        setResendNotice(resendErr.message || 'Could not resend.');
      } else {
        setResendNotice('Confirmation email sent. Check your inbox.');
      }
    } catch (e: any) {
      setResendNotice(e?.message || 'Could not resend.');
    } finally {
      setResendLoading(false);
    }
  }

  async function handleSubmit() {
    setError("");
    setSuccess("");
    // Block in-app sign-up to avoid Apple/Google IAP 30% fee funnel.
    if (mode === "signup" && isNativeApp()) {
      setError("To create your account, visit oversize-escort-hub.com in your browser. This keeps your subscription cost lower \u2014 no app store fees passed to you.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, company_name: company, role },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) throw signUpError;
        // Record fingerprint for free trial
        if (role === "escort" && plan === "trial") {
          const fp = getFingerprint();
          await fetch('/api/check-trial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fp }),
          });
        }
        setSuccess("Check your email to confirm your account, then sign in.");
      } else {
        // Sign In
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        window.location.href = redirectPath;
      }
    } catch (err: any) {
      const msg = err?.message || "Something went wrong";
      // Supabase returns this exact phrase for unconfirmed accounts.
      if (/email not confirmed/i.test(msg) || err?.code === 'email_not_confirmed') {
        setUnconfirmedEmail(email);
        setError("Your email isn't confirmed yet. Check your inbox or resend the confirmation link below.");
      } else {
        setUnconfirmedEmail("");
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // Plan selection step for escort signup
  const showPlanStep = mode === "signup" && role === "escort" && plan === null && !trialBlocked;
  const showTrialBlocked = mode === "signup" && role === "escort" && trialBlocked;

  return (
    <>
      <style>{CSS}</style>
      {mode === "signup" && isNativeApp() && (
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            background: '#111',
            borderBottom: '1px solid #222',
            color: '#fff',
            padding: '14px 18px',
            fontSize: 13,
            lineHeight: 1.5,
            textAlign: 'center',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <strong style={{ color: '#f0a500' }}>Create your account on the web.</strong>{' '}
            To keep your subscription cost lower (no app store fees), please visit{' '}
            <a
              href={`${WEB_HOST}/signin`}
              onClick={(e) => { e.preventDefault(); openInBrowser('/signin'); }}
              style={{ color: '#f0a500', textDecoration: 'underline' }}
            >
              oversize-escort-hub.com
            </a>
            {' '}in your browser. You can sign in here once your account is created.
          </div>
        </div>
      )}
      <div className="wrap">
        <div className="box">
          <div className="role-toggle">
            <button
              className={`role-btn ${role === "escort" ? "active-escort" : ""}`}
              onClick={() => { setRole("escort"); setPlan(null); setTrialBlocked(false); setError(""); setSuccess(""); }}
            >
              P/EVO
            </button>
            <button
              className={`role-btn ${role === "carrier" ? "active-carrier" : ""}`}
              onClick={() => { setRole("carrier"); setPlan(null); setTrialBlocked(false); setError(""); setSuccess(""); }}
            >
              Carrier
            </button>
            <button
              className={`role-btn ${role === "broker" ? "active-carrier" : ""}`}
              onClick={() => { setRole("broker"); setPlan(null); setTrialBlocked(false); setError(""); setSuccess(""); }}
            >
              Freight Broker
            </button>
            <button
              className={`role-btn ${role === "fleet_manager" ? "active-fleet" : ""}`}
              onClick={() => setRole("fleet_manager")}
            >
              Fleet Manager
            </button>
          </div>

          {error && <div className="error">{error}</div>}
            {unconfirmedEmail && (
              <div style={{ marginBottom: 16 }}>
                <button
                  type="button"
                  className="btn"
                  style={{ background: 'var(--bl)', color: '#fff', marginBottom: 6 }}
                  disabled={resendLoading}
                  onClick={handleResendConfirmation}
                >
                  {resendLoading ? 'Sending…' : 'Resend confirmation email'}
                </button>
                {resendNotice && (
                  <div className="mo" style={{ fontSize: 10, color: 'var(--t2)', textAlign: 'center' }}>
                    {resendNotice}
                  </div>
                )}
              </div>
            )}
          {success && <div className="success">{success}</div>}

          {/* Plan selection step — escort signup only */}
          {showPlanStep && (
            <div>
              <div className="mo" style={{ fontSize: 11, color: "var(--t2)", marginBottom: 20, textAlign: "center" }}>
                Choose your P/EVO plan
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Free Trial */}
                <button
                  className="btn"
                  style={{ background: "var(--t2)", color: "var(--bg)", opacity: loading ? 0.5 : 1 }}
                  disabled={loading}
                  onClick={handleTrialSelect}
                >
                  {loading ? "Checking..." : "Free Trial — 30 days · one per device"}
                </button>
                {/* Member */}
                <button
                  className="btn btn-am"
                  disabled={loading}
                  onClick={() => handleCheckout("price_1TF00LLmfugPCRbAl6sF0Oup")}
                >
                  Member — $19.99/mo
                </button>
                {/* Pro */}
                <button
                  className="btn"
                  style={{ background: "var(--am)", color: "#000", opacity: loading ? 0.5 : 1 }}
                  disabled={loading}
                  onClick={() => handleCheckout("price_1TF021LmfugPCRbA7CGgLhC0")}
                >
                  Pro — $29.99/mo
                </button>
              </div>
              <div className="switch" style={{ marginTop: 16 }}>
                <button onClick={() => { setMode("signin"); setPlan(null); setError(""); setSuccess(""); }}>
                  Already have an account? Sign In
                </button>
              </div>
            </div>
          )}

          {/* Trial blocked message */}
          {showTrialBlocked && (
            <div>
              <div className="error" style={{ marginBottom: 16 }}>
                You've already used your free trial on this device. Choose Member or Pro to continue.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button
                  className="btn btn-am"
                  disabled={loading}
                  onClick={() => handleCheckout("price_1TF00LLmfugPCRbAl6sF0Oup")}
                >
                  Member — $19.99/mo
                </button>
                <button
                  className="btn"
                  style={{ background: "var(--am)", color: "#000" }}
                  disabled={loading}
                  onClick={() => handleCheckout("price_1TF021LmfugPCRbA7CGgLhC0")}
                >
                  Pro — $29.99/mo
                </button>
              </div>
              <div className="switch" style={{ marginTop: 16 }}>
                <button onClick={() => { setTrialBlocked(false); setPlan(null); setError(""); }}>
                  ← Back to plans
                </button>
              </div>
            </div>
          )}

          {/* Account creation / sign-in form */}
          {!showPlanStep && !showTrialBlocked && (
            <div>
              {mode === "signup" && (
                <div className="field">
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              )}

              <div className="field">
                <label className="label">Email Address</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
              </div>

              <div className="field">
                <label className="label">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
              </div>

              {mode === "signup" && (
                <div className="field">
                  <label className="label">Company / Business Name (optional)</label>
                  <input
                    type="text"
                    placeholder="Your company name"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
              )}

              <button
                className={`btn ${role === "carrier" ? "btn-or" : role === "fleet_manager" ? "btn-fleet" : "btn-am"}`}
                onClick={handleSubmit}
                disabled={loading || !email || !password}
              >
                {loading
                  ? "Please wait..."
                  : mode === "signup"
                  ? "Create Free Account →"
                  : "Sign In →"}
              </button>

              <div className="switch">
                <span>{mode === "signup" ? "Already have an account?" : "Don't have an account?"}</span>
                <button
                  onClick={() => {
                    setMode(mode === "signup" ? "signin" : "signup");
                    setPlan(null);
                    setTrialBlocked(false);
                    setError("");
                    setSuccess("");
                  }}
                >
                  {mode === "signup" ? "Sign In" : "Start Free Trial"}
                </button>
              </div>
            </div>
          )}

          <div className="mo" style={{ fontSize: 9, color: "var(--t3)", textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
            30-day free trial · No credit card required<br />
            $2.00/mi standard · $100 overnight · $250 no-go
          </div>
        </div>
      </div>
    </>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#fff' }}>Loading...</div>}>
      <SignInInner />
    </Suspense>
  );
}
