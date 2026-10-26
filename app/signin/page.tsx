'use client';

import { FREE_LAUNCH } from '@/lib/free-launch'
import { useState, Suspense, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isNativeApp, openInBrowser, WEB_HOST } from '@/lib/native';
import { useSearchParams } from 'next/navigation';
import { safeRedirectPath } from '@/lib/security';
import SiteHeader from '@/components/SiteHeader';
import PageTitle from '@/components/PageTitle';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&family=Inter:wght@400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#06080a;--p1:rgba(255,255,255,.06);--p2:rgba(255,255,255,.05);--l1:rgba(255,255,255,.12);--l2:rgba(255,255,255,.14);--or:#ff6a13;--am:#ff6a13;--gr:#35d489;--rd:#ff5a5a;--bl:#6aa8ff;--t1:#dce0e6;--t2:#9aa3b2;--t3:#6b7686}
body{background:var(--bg);color:var(--t1);font-family:'Inter',system-ui,sans-serif;font-size:16px;line-height:1.6;min-height:100vh}
.bb{font-family:'Plus Jakarta Sans','Inter',sans-serif;font-weight:800;letter-spacing:-.03em;text-transform:none}
.mo{font-family:'Inter',system-ui,sans-serif;font-weight:500}
input{font-family:'Inter',system-ui,sans-serif;background:var(--p2);border:1px solid var(--l2);color:var(--t1);padding:12px 14px;border-radius:12px;font-size:16px;outline:none;width:100%;min-height:44px}
input:focus{border-color:var(--or);box-shadow:0 0 0 3px rgba(255,106,19,.18)}
button{cursor:pointer;font-family:'Inter',system-ui,sans-serif}
.wrap{min-height:calc(100vh - 64px);display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,rgba(10,11,13,.72),rgba(10,11,13,.88)),url(/photos/band-account.webp) center/cover no-repeat;padding:28px 16px}
.box{background:linear-gradient(180deg,rgba(20,22,28,.78),rgba(10,12,16,.72));border:1px solid rgba(255,255,255,.14);border-radius:26px;padding:32px 28px;width:100%;max-width:440px;backdrop-filter:blur(22px) saturate(140%);-webkit-backdrop-filter:blur(22px) saturate(140%);box-shadow:0 30px 80px rgba(0,0,0,.45)}
.label{font-family:'Inter',system-ui,sans-serif;font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:var(--t2);display:block;margin-bottom:7px}
.field{margin-bottom:18px}
.btn{display:flex;align-items:center;justify-content:center;font-family:'Inter',system-ui,sans-serif;font-size:14px;letter-spacing:0;text-transform:none;font-weight:700;padding:11px 22px;min-height:44px;border:none;border-radius:999px;width:100%;margin-bottom:12px;cursor:pointer;box-shadow:0 8px 24px rgba(255,106,19,.28)}
.btn-or{background:var(--or);color:#160800}
.btn-am{background:var(--am);color:#160800}
.btn-fleet{background:var(--or);color:#160800}
.btn:disabled{opacity:.5;cursor:not-allowed;box-shadow:none}
.role-toggle{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px}
.role-btn{flex:1 1 46%;min-height:44px;padding:10px 8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.14);border-radius:999px;font-family:'Inter',system-ui,sans-serif;font-size:13px;font-weight:600;letter-spacing:0;text-transform:none;color:var(--t2);cursor:pointer}
.role-btn.active-escort,.role-btn.active-carrier,.role-btn.active-fleet{background:var(--or);color:#160800;border-color:var(--or)}
.error{background:rgba(255,90,90,.1);border:1px solid rgba(255,90,90,.35);color:#ff8a8a;font-family:'Inter',system-ui,sans-serif;font-size:14px;padding:12px 14px;border-radius:12px;margin-bottom:16px}
.success{background:rgba(53,212,137,.1);border:1px solid rgba(53,212,137,.35);color:var(--gr);font-family:'Inter',system-ui,sans-serif;font-size:14px;padding:12px 14px;border-radius:12px;margin-bottom:16px}
.switch{text-align:center;margin-top:4px}
.switch span{font-family:'Inter',system-ui,sans-serif;font-size:14px;font-weight:500;color:var(--t2)}
.switch button{background:none;border:none;color:var(--or);font-family:'Inter',system-ui,sans-serif;font-size:14px;font-weight:700;cursor:pointer;text-decoration:underline;margin-left:4px;min-height:44px}
@media(max-width:768px){.box{padding:24px 18px;max-width:100%}.wrap{padding:16px 12px}}
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
  const redirectPath = safeRedirectPath(redirectParam);
  const roleParamRaw = searchParams.get('role');
  const allowedRoles = ['escort', 'carrier', 'broker', 'fleet_manager'] as const;
  const initialRole = (allowedRoles as readonly string[]).includes(roleParamRaw ?? '')
    ? (roleParamRaw as 'escort' | 'carrier' | 'broker' | 'fleet_manager')
    : 'escort';
  const [mode, setMode] = useState<"signup" | "signin">(searchParams.get('mode') === 'signup' ? "signup" : "signin");
  const [role, setRole] = useState<"escort" | "carrier" | "fleet_manager" | "broker">(initialRole);
  const [plan, setPlan] = useState<"trial" | "member" | "pro" | null>(null);
  const [trialBlocked, setTrialBlocked] = useState(false);
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(searchParams.get('confirmed') === '1' ? 'Your email is confirmed. Sign in below.' : "");
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

  // Plan buttons only select the plan — Stripe runs after the account exists
  // (anonymous checkout cannot set profiles.tier because the webhook has no user).
  function selectPaidPlan(next: "member" | "pro") {
    setPlan(next);
    setTrialBlocked(false);
    setError("");
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

  async function handleForgot() {
    setResetMsg("")
    if (!email) { setResetMsg("Type your email above first, then tap Forgot password."); return }
    const { error: rErr } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?redirect=/reset-password` })
    // Same answer whether or not the email has an account
    setResetMsg(rErr ? "Could not send the email. Try again in a minute." : "If that email has an account, a reset link is on its way.")
  }

  async function handleSubmit() {
    setError("");
    setSuccess("");
    // In the app, new accounts are created on the website; the app signs the account in afterwards.
    if (mode === "signup" && isNativeApp()) {
      openInBrowser('/signin');
      setError("Your browser is opening so you can create your account on oversize-escort-hub.com. Come back here and sign in when you are done.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, company_name: company, role, ...(phone.trim() ? { phone: phone.trim().slice(0, 30) } : {}) },
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
        if (role === "escort" && (plan === "member" || plan === "pro")) {
          setSuccess("Check your email to confirm your account, then sign in — we'll take you to checkout for your plan.");
          // After confirm+sign-in, pricing is the safe paid path (session required).
        } else {
          setSuccess("Check your email to confirm your account, then sign in.");
        }
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
  // while everything is free there is no plan step and no one-trial-per-device block
  const showPlanStep = !FREE_LAUNCH && mode === "signup" && role === "escort" && plan === null && !trialBlocked;
  const showTrialBlocked = !FREE_LAUNCH && mode === "signup" && role === "escort" && trialBlocked;

  return (
    <>
      <style>{CSS}</style>
      {mode === "signup" && isNativeApp() && (
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            background: 'rgba(8,9,12,.92)',
            borderBottom: '1px solid rgba(255,255,255,.09)',
            color: '#fff',
            padding: '14px 18px',
            fontSize: 13,
            lineHeight: 1.5,
            textAlign: 'center',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <strong style={{ color: '#ff6a13' }}>Create your account on our website.</strong>{' '}
            New accounts are made at{' '}
            <a
              href={`${WEB_HOST}/signin`}
              onClick={(e) => { e.preventDefault(); openInBrowser('/signin'); }}
              style={{ color: '#ff6a13', textDecoration: 'underline' }}
            >
              oversize-escort-hub.com
            </a>
            {' '}in your browser. Once it is created, sign in here with the same email and password.
          </div>
        </div>
      )}
      <SiteHeader />
      <div className="wrap">
        <div className="box">
          <PageTitle
            eyebrow="Account"
            title={mode === 'signup' ? 'Create your account' : 'Sign in'}
            lead={mode === 'signup' ? 'Free while we launch. No credit card required.' : 'Use the email and password on your account.'}
          />
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
                  onClick={() => selectPaidPlan("member")}
                >
                  Member — $19.99/mo
                </button>
                {/* Pro */}
                <button
                  className="btn"
                  style={{ background: "var(--am)", color: "#000", opacity: loading ? 0.5 : 1 }}
                  disabled={loading}
                  onClick={() => selectPaidPlan("pro")}
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
                  onClick={() => selectPaidPlan("member")}
                >
                  Member — $19.99/mo
                </button>
                <button
                  className="btn"
                  style={{ background: "var(--am)", color: "#000" }}
                  disabled={loading}
                  onClick={() => selectPaidPlan("pro")}
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

              {mode === "signup" && (
                <div className="field">
                  <label className="label">Mobile phone (optional)</label>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="For load alerts when texting opens"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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

              {mode !== "signup" && (
                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <button type="button" onClick={handleForgot} style={{ background: "none", border: 0, color: "#ff9a5c", cursor: "pointer", fontSize: 14, fontWeight: 600, minHeight: 44 }}>Forgot password?</button>
                  {resetMsg && <div style={{ color: "#c3c9d4", fontSize: 13, marginTop: 4 }}>{resetMsg}</div>}
                </div>
              )}

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
                  {mode === "signup" ? "Sign In" : "Create Account"}
                </button>
              </div>
            </div>
          )}

          <div className="mo" style={{ fontSize: 9, color: "var(--t3)", textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
            Free while we launch · No credit card required<br />
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
