"use client";
import PushInit from './components/PushInit'
import { VERIFICATION_LIVE } from '@/lib/verification'
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { withFreeLaunch, FREE_LAUNCH } from "@/lib/free-launch";
import HomeLanding from "@/components/HomeLanding";
import HideInApp from "@/components/HideInApp";
import { isNativeApp } from "@/lib/native";

// True only inside the phone apps (false on the server and on first paint, so the page hydrates cleanly).
function useInApp() {
  const [inApp, setInApp] = useState(false);
  useEffect(() => { setInApp(isNativeApp()); }, []);
  return inApp;
}

const supabase = createClient();

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Role = "carrier" | "escort" | "broker" | "admin" | "fleet_manager" | null;
type Page = "home" | "flatboard" | "openboard" | "bidboard" | "escorts" | "escprofile" | "dashboard-e" | "dashboard-c" | "dashboard-b" | "postload" | "pricing" | "verification" | "signin" | "invoice" | "expenses" | "job-history" | "permits" | "deadhead" | "admin" | "dot-lookup" | "state-reqs" | "weather" | "cb-radio" | "fuel-calc" | "per-diem" | "cert-tracker" | "factoring" | "tools" | "available" | "how-it-works";

type Profile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  role: "escort" | "carrier" | "admin" | "fleet_manager";
  tier: "free" | "trial" | "member" | "pro" | "carrier_member" | "fleet_starter" | "fleet_plus" | "fleet_pro";
  email: string | null;
  phone: string | null;
  state: string | null;
  p_evo_verified: boolean;
  bgc_verified: boolean;
  vehicle_verified: boolean;
  admin_verified: boolean;
  rating: number;
  total_jobs: number;
  is_available: boolean;
  vehicle: string | null;
  states_licensed: string[] | null;
  availability_states: string[] | null;
  bgc_pending: boolean | null;
  bgc_document_url: string | null;
  pro_window_expires_at: string | null;
  avatar_url: string | null;
  cert_types: string[] | null;  notification_states: string[] | null;
};

type Load = {
  id: string;
  created_at: string;
  carrier_id: string;
  board_type: "flat-rate" | "bid" | "open-bid";
  pu_city: string;
  pu_state: string;
  dl_city: string;
  dl_state: string;
  miles: number;
  position: string;
  pay_type: string;
  status: string;
  per_mile_rate: number;
  day_rate: number;
  overnight_fee: number;
  no_go_fee: number;
  requires_p_evo: boolean;
  requires_witpac: boolean;
  requires_ny_cert: boolean;
  requires_twic: boolean;
  notes: string | null;
  start_date: string | null;
  poster_company: string | null;
  poster_rating: number | null;
  poster_jobs: number | null;
};

const TIERS = [
  { id: "trial", name: "Free Trial", price: 0, sub: "30 days · one per device", color: "#6e7a88", features: ["View load board (no contact info)", "Search escorts directory", "30-day limit", "No bidding · no alerts"], daily: null, popular: false, carrierPro: null },
  { id: "member", name: "Member", price: 19.99, sub: "per month", color: "#3d8ef8", features: ["Full bidding on all boards", "Email alerts on new loads", "60s after Pro on bid board", "In-platform messaging", "Multi-state load filters"], daily: 1.99, popular: false, carrierPro: null },
  { id: "pro", name: "Pro", price: 29.99, sub: "per month", color: "#f5a200", features: ["Instant access to bid loads (60s head start)", "Deadhead Minimizer + return load feed", "I'm Available broadcast", "Deadhead calculator + savings dashboard", "Invoice generator"], daily: 4.99, popular: true, carrierPro: null },];

// ─── STYLES ──────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&family=Inter:wght@400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#06080a;--p1:rgba(255,255,255,.05);--p2:rgba(255,255,255,.07);--l1:rgba(255,255,255,.1);--l2:rgba(255,255,255,.14);--or:#ff6a13;--am:#ff6a13;--gr:#00cc7a;--rd:#ff3535;--bl:#3d8ef8;--t1:#dce0e6;--t2:#9aa3b2;--t3:#6b7686}
body{background:var(--bg);color:var(--t1);font-family:'Inter',system-ui,sans-serif;font-size:16px;line-height:1.6;min-height:100vh}
.bb{font-family:'Plus Jakarta Sans','Inter',sans-serif;font-weight:800;letter-spacing:-.03em;text-transform:none}
.mo{font-family:'Inter',system-ui,sans-serif;font-weight:500}
a{color:inherit;text-decoration:none;cursor:pointer}
button{cursor:pointer;font-family:'Inter',system-ui,sans-serif}
input,select,textarea{font-family:'Inter',system-ui,sans-serif;background:var(--p2);border:1px solid var(--l2);color:var(--t1);padding:12px 14px;border-radius:12px;font-size:16px;min-height:44px;outline:none}
input:focus,select:focus,textarea:focus{border-color:var(--or)}
table{width:100%;border-collapse:collapse}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes scrolltick{from{transform:translateX(0)}to{transform:translateX(-50%)}}

.ticker{color:#ffffff;height:28px;background:#030507;border-bottom:1px solid var(--l1);overflow:hidden;display:flex;align-items:center}
.ticker-track{display:flex;animation:scrolltick 90s linear infinite;white-space:nowrap}
.tick-item{display:inline-flex;align-items:center;gap:8px;padding:0 28px;border-right:1px solid var(--l1);height:28px;font-family:'Inter',system-ui,sans-serif;font-weight:500;font-size:12px;color:#ffffff;letter-spacing:0}
.tick-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.dot-gr{background:var(--gr);box-shadow:0 0 5px var(--gr)}
.dot-am{background:var(--am);box-shadow:0 0 5px var(--am)}
.dot-or{background:var(--or)}

.nav{background:rgba(8,9,12,.82);border-bottom:1px solid var(--l1);min-height:64px;display:flex;flex-direction:row;align-items:center;padding:0 24px;gap:20px;position:sticky;top:var(--safe-top,0px);z-index:100;backdrop-filter:blur(18px) saturate(140%);-webkit-backdrop-filter:blur(18px) saturate(140%)}
.nav-name{font-family:'Plus Jakarta Sans','Inter',sans-serif;font-weight:800;font-size:18px;letter-spacing:-.02em;text-transform:none;color:#fff}
.nav-div{width:1px;height:28px;background:var(--l1)}
.nav-link{font-family:'Inter',system-ui,sans-serif;font-weight:500;font-size:14px;letter-spacing:0;text-transform:none;color:var(--t2);padding:0 10px;min-height:44px;display:flex;align-items:center;background:none;border:none;border-bottom:2px solid transparent;transition:color .15s}
.nav-link:hover,.nav-link.active{color:var(--t1)}
.nav-link.active{border-bottom-color:var(--or)}
.nav-bid{color:var(--am)!important;background:rgba(255,106,19,.06);border-bottom-color:var(--am)!important}
.nav-bid::before{content:'';display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--am);box-shadow:0 0 6px var(--am);margin-right:7px;animation:pulse 1.4s infinite}
.nav-cta{font-family:'Inter',system-ui,sans-serif;font-size:14px;letter-spacing:0;text-transform:none;background:var(--or);color:#160800;border:none;border-radius:999px;min-height:44px;padding:11px 18px;font-weight:700;margin-left:auto}
.nav-user{font-family:'Inter',system-ui,sans-serif;font-weight:500;font-size:14px;letter-spacing:0;color:var(--t2);display:flex;align-items:center;gap:8px;margin-left:auto}
.nav-signout{background:none;border:1px solid var(--l2);color:var(--t2);font-family:'Inter',system-ui,sans-serif;font-weight:500;font-size:14px;letter-spacing:0;text-transform:none;min-height:44px;padding:8px 14px;border-radius:999px}
.nav-signout:hover{color:var(--rd);border-color:var(--rd)}

.bid-strip{background:rgba(255,255,255,.04);border-bottom:1px solid var(--l1);padding:8px 24px;min-height:44px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.bid-live{display:flex;align-items:center;gap:7px;font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:13px;letter-spacing:0;text-transform:none;color:var(--am)}
.bid-live::before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--am);box-shadow:0 0 7px var(--am);animation:pulse 1.4s infinite}
.bid-cta{font-family:'Inter',system-ui,sans-serif;font-size:14px;letter-spacing:0;text-transform:none;font-weight:700;min-height:44px;padding:10px 18px;border-radius:999px;background:rgba(255,106,19,.1);border:1px solid var(--am);color:var(--am);margin-left:auto;transition:background .15s}
.bid-cta:hover{background:rgba(255,106,19,.18)}

.hero{padding:56px 48px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden;border-bottom:1px solid var(--l1)}
.hero-carrier{background:var(--bg)}
.hero-carrier::before{content:'';position:absolute;inset:0;background-image:repeating-linear-gradient(0deg,transparent,transparent 39px,var(--l1) 39px,var(--l1) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,var(--l1) 39px,var(--l1) 40px);opacity:.22;pointer-events:none}
.hero-escort{background:var(--p1)}
.hero-escort::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 80% 50%,rgba(255,106,19,.04) 0%,transparent 70%);pointer-events:none}
.hero-inner{position:relative;z-index:1;max-width:680px}
.hero-tag{font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:12px;letter-spacing:.16em;text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:8px}
.hero-tag::before{content:'';display:inline-block;width:18px;height:1px}
.tag-or{color:var(--or)}.tag-or::before{background:var(--or)}
.tag-am{color:var(--am)}.tag-am::before{background:var(--am)}
.hero-hl{font-family:'Plus Jakarta Sans','Inter',sans-serif;font-weight:800;font-size:64px;line-height:1.02;letter-spacing:-.03em;text-transform:none;margin-bottom:18px}
.hero-sub{font-size:13px;color:var(--t2);line-height:1.85;max-width:520px;margin-bottom:16px}
.stat-row{display:flex;gap:10px;margin-bottom:28px;max-width:680px;flex-wrap:wrap}
.stat{flex:1 1 140px;min-width:0;padding:14px 16px;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));border:1px solid var(--l1);border-radius:16px;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.stat:first-child,.stat:last-child{border-radius:16px}
.stat-n{font-family:'Plus Jakarta Sans','Inter',sans-serif;font-weight:800;font-size:20px;line-height:1.15;letter-spacing:-.02em;text-transform:none;margin-bottom:4px}
.stat-l{font-family:'Inter',system-ui,sans-serif;font-weight:500;font-size:13px;letter-spacing:0;text-transform:none;color:var(--t2)}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:'Inter',system-ui,sans-serif;font-size:14px;letter-spacing:0;text-transform:none;font-weight:700;min-height:44px;padding:11px 22px;border:none;border-radius:999px;transition:opacity .15s}
.btn:hover{opacity:.85}
.btn:disabled{opacity:.4;cursor:not-allowed}
.btn-or{background:var(--or);color:#000}
.btn-am{background:var(--am);color:#000}
.btn-gr{background:var(--gr);color:#000}
.btn-ghost{background:transparent;color:var(--t2);border:1px solid var(--l2)}
.btn-ghost:hover{color:var(--t1);border-color:var(--t2)}
.btn-sm{padding:10px 16px;font-size:14px;min-height:44px;border-radius:999px}
.btn-row{display:flex;gap:8px;flex-wrap:wrap}

.section{padding:52px 24px}
.section-header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:20px}
.eyebrow{font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:12px;letter-spacing:.16em;text-transform:uppercase;margin-bottom:6px}
.section-title{font-family:'Plus Jakarta Sans','Inter',sans-serif;font-weight:800;font-size:32px;color:#fff;line-height:1.08;letter-spacing:-.03em;text-transform:none}
.section-link{font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:14px;letter-spacing:0;text-transform:none;color:var(--t2);background:none;border:none;display:flex;align-items:center;gap:5px;min-height:44px}
.section-link::after{content:'→'}
.section-link:hover{color:var(--t1)}

.chip{display:inline-flex;align-items:center;gap:3px;font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:12px;letter-spacing:0;text-transform:none;padding:4px 10px;border-radius:999px}
.ch-gr{background:rgba(0,204,122,.1);color:var(--gr);border:1px solid rgba(0,204,122,.2)}
.ch-am{background:rgba(255,106,19,.1);color:var(--am);border:1px solid rgba(255,106,19,.2)}
.ch-or{background:rgba(255,106,19,.1);color:var(--or);border:1px solid rgba(255,106,19,.18)}
.ch-bl{background:rgba(61,142,248,.1);color:var(--bl);border:1px solid rgba(61,142,248,.18)}
.ch-dim{background:var(--p2);color:var(--t2);border:1px solid var(--l1)}
.ch-rd{background:rgba(255,53,53,.1);color:var(--rd);border:1px solid rgba(255,53,53,.2)}
.ch-sample{background:rgba(255,106,19,.06);color:var(--am);border:1px solid rgba(255,106,19,.15);font-size:7px}

.data-table{border:1px solid var(--l1);border-radius:16px;overflow:hidden;background:rgba(255,255,255,.03)}
.data-table table{font-family:'Inter',system-ui,sans-serif;font-size:11px}
.data-table thead th{background:var(--p2);padding:8px 12px;text-align:left;font-size:8px;letter-spacing:.16em;text-transform:uppercase;color:var(--t2);border-bottom:1px solid var(--l1);white-space:nowrap;font-weight:500}
.data-table tbody td{padding:11px 12px;border-bottom:1px solid rgba(28,34,41,.7);vertical-align:middle}
.data-table tbody tr:last-child td{border-bottom:none}
.data-table tbody tr:hover td{background:rgba(255,255,255,.015)}
/* ============================================
   MOBILE RESPONSIVE — 390px (iPhone 14)
   No desktop layout changes
   ============================================ */

/* Hero "Who Are You?" cards: stack vertically on mobile */
@media (max-width: 767px) {
  /* Hero cards: full width, vertical stack */
  .hero {
    padding: 40px 16px;
    width: 100%;
    box-sizing: border-box;
  }
  
  /* Section padding on mobile */
  .section {
    padding: 32px 16px;
  }
  
  /* Hero headline text size on mobile */
  .hero-hl {
    font-size: 40px;
    line-height: 1;
  }
  
  .hero-sub {
    font-size: 14px;
    max-width: 100%;
  }
  
  /* Buttons: min 48px tap target */
  .btn {
    min-height: 48px;
    padding: 14px 22px;
  }
  
  /* No horizontal scroll */
  body { overflow-x: hidden; }
  
  /* Section padding */
  .section-header { 
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  /* Load cards / bid cards: full width */
  .card {
    width: 100%;
    box-sizing: border-box;
  }
  
  /* Stat rows stack */
  .stat-row {
    flex-direction: column;
    gap: 8px;
  }
  
  /* Lock bar */
  .lock-bar {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  /* Bid strip */
  .bid-strip {
    flex-direction: column;
    gap: 4px;
  }
  
  /* Bid cta button */
  .bid-cta {
    min-height: 48px;
    padding: 14px 20px;
  }
  
  /* Data table: horizontal scroll allowed within container */
  .data-table {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  /* Dashboard grid: single column */
  .dash-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    min-height: auto;
  }
}


.ps{display:inline-flex;align-items:center;gap:4px;font-family:'Inter',system-ui,sans-serif;font-size:9px;padding:2px 7px;border-radius:2px}
.ps-hi{background:rgba(0,204,122,.1);color:var(--gr);border:1px solid rgba(0,204,122,.2)}
.ps-lo{background:rgba(255,106,19,.1);color:var(--am);border:1px solid rgba(255,106,19,.2)}
.ps-bad{background:rgba(255,53,53,.1);color:var(--rd);border:1px solid rgba(255,53,53,.2)}

.lock-bar{background:rgba(255,255,255,.04);border:1px solid var(--l1);border-radius:16px;padding:12px 16px;display:flex;align-items:center;gap:12px;margin-top:10px;flex-wrap:wrap}
.card{background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));border:1px solid var(--l1);border-radius:18px;padding:18px;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
.card:hover{border-color:var(--l2)}

.bid-timer{font-family:'Plus Jakarta Sans','Inter',sans-serif;font-weight:800;font-size:28px;line-height:1;letter-spacing:-.03em;text-transform:none}
.timer-red{color:var(--rd)}
.timer-am{color:var(--am)}

.dash-grid{display:flex;flex-direction:column;min-height:calc(100vh - 84px)}
.dash-nav{background:var(--p1);border-bottom:1px solid var(--l1);padding:0 8px;display:flex;flex-direction:row;flex-wrap:wrap;align-items:center}
.dash-nav-item{font-family:'Inter',system-ui,sans-serif;font-weight:500;font-size:14px;letter-spacing:0;text-transform:none;color:var(--t2);padding:11px 20px;min-height:44px;display:flex;align-items:center;gap:9px;cursor:pointer;transition:background .15s}
.dash-nav-item:hover,.dash-nav-item.active{background:rgba(255,255,255,.03);color:var(--t1)}
.dash-nav-item.active{border-bottom:2px solid var(--or)}
.dash-content{padding:32px 28px;background:var(--bg)}
.metric-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px}
.metric{background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));border:1px solid var(--l1);border-radius:16px;padding:14px 16px;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.metric-n{font-family:'Plus Jakarta Sans','Inter',sans-serif;font-weight:800;font-size:28px;line-height:1;letter-spacing:-.03em;text-transform:none;margin-bottom:2px}
.metric-l{font-family:'Inter',system-ui,sans-serif;font-weight:500;font-size:13px;letter-spacing:0;text-transform:none;color:var(--t2)}

.feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.feat-card{background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));border:1px solid var(--l1);border-top:2px solid;border-radius:18px;padding:18px;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.feat-title{font-family:'Plus Jakarta Sans','Inter',sans-serif;font-weight:800;font-size:18px;color:#fff;margin-bottom:7px;line-height:1.2;letter-spacing:-.02em;text-transform:none}
.feat-body{font-size:12px;color:var(--t2);line-height:1.75}

.price-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.price-card{background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));border:1px solid var(--l1);border-radius:18px;padding:20px;display:flex;flex-direction:column;gap:14px;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.price-card.popular{border-color:var(--am)}
.price-name{font-family:'Plus Jakarta Sans','Inter',sans-serif;font-weight:800;font-size:22px;line-height:1.1;letter-spacing:-.02em;text-transform:none}
.price-n{font-family:'Plus Jakarta Sans','Inter',sans-serif;font-weight:800;font-size:38px;line-height:1;letter-spacing:-.03em;text-transform:none}
.price-feat{font-family:'Inter',system-ui,sans-serif;font-size:10px;color:var(--t2);display:flex;align-items:flex-start;gap:6px;line-height:1.5}
.price-feat::before{content:'✓';color:var(--gr);flex-shrink:0}

.verify-tier{background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));border:1px solid var(--l1);border-left:3px solid;border-radius:18px;padding:18px 20px;display:flex;align-items:flex-start;gap:16px;margin-bottom:10px}

footer{background:rgba(8,9,12,.72);border-top:1px solid var(--l1);padding:40px 24px 24px;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.footer-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:44px;margin-bottom:28px}
.footer-col h4{font-family:'Plus Jakarta Sans','Inter',sans-serif;font-weight:800;font-size:14px;letter-spacing:-.01em;text-transform:none;color:#fff;margin-bottom:12px}
.footer-col a{display:block;font-size:12px;color:var(--t2);cursor:pointer;margin-bottom:8px}
.footer-col a:hover{color:var(--t1)}
.footer-bottom{display:flex;justify-content:space-between;padding-top:20px;border-top:1px solid var(--l1);font-family:'Inter',system-ui,sans-serif;font-size:9px;color:var(--t3);letter-spacing:.06em}

.platform-div{background:var(--p2);border-bottom:1px solid var(--l1);border-top:1px solid var(--l1);padding:12px 24px;display:flex;align-items:center;gap:20px;flex-wrap:wrap}
.esc-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.ob-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}

.role-picker-active{position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;background:var(--bg);padding:40px 24px;overflow-y:auto;}
/* centred when there is room, scrolls from the top when there is not (justify-content:center would clip the top on a short screen) */
.role-picker-active::before,.role-picker-active::after{content:"";flex:1 0 0;}
.role-card{background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));border:1px solid var(--l1);border-radius:22px;padding:36px 28px;cursor:pointer;transition:background .15s;flex:1;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.role-card:hover{background:rgba(255,255,255,.03)}
.role-bar{background:var(--p2);border-bottom:1px solid var(--l1);padding:6px 24px;display:flex;align-items:center;gap:12px}

.form-label{font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--t2);display:block;margin-bottom:6px}
.form-field{margin-bottom:16px}
.postload-wrap{max-width:780px;margin:0 auto;padding:40px 24px}
.signin-wrap{min-height:calc(100vh - 84px);display:flex;align-items:center;justify-content:center;background:var(--bg)}
.signin-box{background:linear-gradient(180deg,rgba(20,22,28,.78),rgba(10,12,16,.72));border:1px solid var(--l1);border-radius:22px;padding:36px;width:100%;max-width:420px;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px)}

.toast{position:fixed;bottom:24px;right:24px;background:var(--p2);border:1px solid var(--l1);border-radius:4px;padding:12px 20px;font-family:'Inter',system-ui,sans-serif;font-size:11px;z-index:999;display:flex;align-items:center;gap:10px;box-shadow:0 8px 32px rgba(0,0,0,.4)}
.toast-gr{border-left:3px solid var(--gr);color:var(--gr)}
.toast-rd{border-left:3px solid var(--rd);color:var(--rd)}
.toast-am{border-left:3px solid var(--am);color:var(--am)}

.early-banner{background:linear-gradient(135deg,rgba(255,106,19,.12),rgba(255,106,19,.05));border:1px solid rgba(255,106,19,.35);border-radius:18px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;gap:14px}

@media(max-width:900px){
  .price-grid{grid-template-columns:repeat(2,1fr)}
  .feat-grid{grid-template-columns:repeat(2,1fr)}
  .esc-grid{grid-template-columns:repeat(2,1fr)}
  .footer-grid{grid-template-columns:1fr 1fr}
  .dash-grid{flex-direction:column}
  .dash-nav{display:flex}
  .ham-btn{display:flex!important;flex-direction:column;align-items:center;justify-content:center}
  .nav-links{display:none!important}
  .nav{padding:0 14px;gap:10px;overflow:hidden}
  .nav-name{font-size:16px;white-space:nowrap}
  .nav-user-name,.nav-user .nav-signout,.nav-user select{display:none!important}
  .nav-right{gap:6px;min-width:0;flex-shrink:0}
  .nav-get-started{font-size:9px;padding:7px 12px}}
.ham-btn{display:none;background:none;border:none;cursor:pointer;padding:8px;color:var(--t1)}.nav-links{display:flex;flex-direction:row;align-items:center;gap:24px}
.ham-btn span{display:block;width:22px;height:2px;background:var(--t1);margin:4px 0;transition:.3s}
.mobile-drawer{display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:999;background:rgba(0,0,0,.7)}
.mobile-drawer-inner{position:absolute;top:0;right:0;width:80%;max-width:300px;height:100%;background:var(--p1);border-left:1px solid var(--l1);overflow-y:auto;padding:20px 0}
.drawer-header{display:flex;align-items:center;justify-content:space-between;padding:0 20px 20px;border-bottom:1px solid var(--l1);margin-bottom:10px}
.drawer-close{background:none;border:none;color:var(--t1);font-size:24px;cursor:pointer;padding:4px}
.drawer-link{display:block;width:100%;text-align:left;background:none;border:none;color:var(--t2);font-family:"Inter",system-ui,sans-serif;font-weight:500;font-size:15px;letter-spacing:0;text-transform:none;min-height:44px;padding:14px 20px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05)}
.drawer-link:hover,.drawer-link.active{color:var(--or);background:rgba(255,255,255,.03)}
.drawer-user{padding:16px 20px;border-top:1px solid var(--l1);margin-top:10px}
.drawer-signout{width:100%;margin-top:12px;background:none;border:1px solid var(--l2);color:var(--t2);font-family:"Inter",system-ui,sans-serif;font-weight:500;font-size:14px;letter-spacing:0;min-height:44px;padding:10px;cursor:pointer;border-radius:999px}
.drawer-signout:hover{border-color:var(--rd);color:var(--rd)}
}
`;

// ─── SUBCOMPONENTS ───────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }: { msg: string; type: "gr" | "rd" | "am"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`toast toast-${type}`}>
      {type === "gr" ? "✓" : type === "rd" ? "✕" : "⚠"} {msg}
      <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--t2)", marginLeft: 8, fontSize: 14 }}>×</button>
    </div>
  );
}

function Ticker() {
  const items = [
    { dot: "dot-gr", text: "Platform launching · Be an early member · Using the site is free while we launch" },
    { dot: "dot-am", text: "BID BOARD LIVE · 5-Min bids · Everyone sees new loads the moment they post" },
    { dot: "dot-gr", text: "Free to post · No commissions · Contact details stay private until a carrier accepts" },
    { dot: "dot-or", text: "OPEN BID BOARD · 24-72h window · Post your pitch · Carrier picks the best fit" },
    { dot: "dot-gr", text: "Standard rates: $2.00/mi or $500/day · $100 overnight · $250 no-go fee" },
    { dot: "dot-am", text: "Deadhead Minimizer · Return loads near your drop · Stop driving home empty" },
    { dot: "dot-gr", text: "No commissions · No job fees · Free while we launch" },
    { dot: "dot-or", text: "Carriers: Post loads free · Escorts: Find loads · Both: No middleman" },
    { dot: "dot-am", text: "• Fleet managers · Manage all your escorts · Full fleet dashboard" },
  ];
  return (
    <div className="ticker">
      <div className="ticker-track">
        {[...items, ...items].map((it, i) => (
          <span key={i} className="tick-item">
            <span className={`tick-dot ${it.dot}`} />
            {it.text}
          </span>
        ))}
      </div>
    </div>
  );
}

function Nav({ page, setPage, user, profile, onSignOut, unreadCount = 0, setSigninMode, profileOverride, setProfileOverride }: {
  page: Page; setPage: (p: Page) => void; user: User | null; profile: Profile | null; onSignOut: () => void; unreadCount?: number; setSigninMode: (m: "signup" | "signin") => void; profileOverride: Profile | null; setProfileOverride: (p: Profile | null) => void
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const inApp = useInApp();
  const navLinks: [Page, string][] = [
    ["flatboard", "Flat Rate"],
    ["openboard", "Open Loads"],
    ["bidboard", "Bid Board"],
    ["escorts", "Find Escorts"],
    ["postload", "Post a Load"],
    ["how-it-works", "How It Works"],
    ["pricing", "Pricing"],
  ].filter(([p]) => !(inApp && p === "pricing")) as [Page, string][];
  const closeDrawer = () => setDrawerOpen(false);
  return (
    <div className="nav">
      <div className="nav-name" style={{ cursor: "pointer" }} onClick={() => setPage("home")}>Oversize Escort Hub</div>
      {/* Desktop links */}
      <div className="nav-links">
        {navLinks.map(([p, label]) => (
          <button key={p} className={`nav-link${page === p ? " active" : ""}`} onClick={() => { const hardNav: Partial<Record<Page, string>> = { "how-it-works": "/how-it-works", pricing: "/pricing", verification: "/verification", flatboard: "/flat-rate", openboard: "/open-loads", bidboard: "/bid-board", escorts: "/find-escorts", postload: "/post-load" }; const href = hardNav[p]; if (href) { window.location.href = href; } else { setPage(p); } }}>{label}</button>
        ))}
      </div>
      {/* Desktop right */}
      <div className="nav-right" style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
        {user && profile ? (
          <span className="nav-user"><button onClick={()=>setPage(profile?.role==='escort'?'dashboard-e':'dashboard-c')} style={{position:'relative',background:'none',border:'none',cursor:'pointer',padding:'4px',color:'var(--t1)',fontSize:20}} title="Notifications">{String.fromCodePoint(128276)}{unreadCount>0&&<span style={{position:'absolute',top:0,right:0,background:'#ff6600',color:'#fff',borderRadius:'50%',fontSize:9,width:16,height:16,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>{unreadCount>9?'9+':unreadCount}</span>}</button>
            <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:profile.avatar_url?"transparent":"#ff6600",color:"#fff",fontSize:10,fontWeight:700,marginRight:6,flexShrink:0,overflow:"hidden" }}>{profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /> : (profile.full_name||"?").split(" ").filter(Boolean).map(function(w){return w[0]}).join("").toUpperCase().slice(0,2)||"?"}</span>
            <span className="nav-user-name">{profile.full_name || "there"}{" · "}
            <span style={{ color: "var(--or)", fontSize: 8 }}>{profile.tier?.replace(/_/g, " ").toUpperCase()}</span>{" "}</span>
            {profile?.role === "fleet_manager" && <button className="nav-signout" style={{ color:'#ff6600', borderColor:'#ff6600' }} onClick={() => { window.location.href = '/fleet-dashboard'; }}>FLEET DASHBOARD</button>}
            {profile?.role === "fleet_manager" && <button className="nav-signout" style={{ color:'#ff6600', borderColor:'#ff6600' }} onClick={() => { window.location.href = '/fleet-dashboard'; }}>FLEET DASHBOARD</button>} {profile?.role === 'admin' && (
            <select
              className="mo"
              style={{ background: 'var(--p2)', border: '1px solid var(--or)', color: 'var(--or)', fontSize: 9, padding: '5px 8px', borderRadius: 2, cursor: 'pointer' }}
              value={profileOverride?.role || ''}
              onChange={e => {
                const r = e.target.value;
                if (!r) { setProfileOverride(null); return; }
                setProfileOverride({ ...profile!, role: r as any, tier: r === 'fleet_manager' ? 'pro' : r === 'escort' ? 'pro' : 'carrier_member' });
              }}
            >
              <option value="">REAL ROLE</option>
              <option value="escort">TEST: Escort</option>
              <option value="carrier">TEST: Carrier</option>
              <option value="broker">TEST: Broker</option>
              <option value="fleet_manager">TEST: Fleet Mgr</option>
            </select>
          )}
          <button className="nav-signout" onClick={onSignOut}>SIGN OUT</button>
            <button className="nav-signout" style={{ marginLeft: 4 }} onClick={() => profile?.role === "fleet_manager" ? (window["location"]["href"] = "/fleet-dashboard") : setPage(profile.role === "carrier" ? "dashboard-c" : "dashboard-e")}>DASHBOARD →</button>
                  {profile?.role === 'admin' && (
                    <button className="nav-signout" style={{ marginLeft: 4 }} onClick={() => setPage('admin')}>Admin</button>
                  )}
          </span>
        ) : (
          <button className="nav-get-started btn btn-or btn-sm" onClick={() => { setSigninMode("signup"); setPage("signin"); }}>GET STARTED</button>
        )}
        {/* Hamburger */}
        <button className="ham-btn" onClick={() => setDrawerOpen(true)} aria-label="Menu">
          <span/><span/><span/>
        </button>
      </div>
      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="mobile-drawer" onClick={closeDrawer}>
          <div className="mobile-drawer-inner" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="mo" style={{ fontSize: 10, letterSpacing: ".1em", color: "var(--or)" }}>OVERSIZE ESCORT HUB</span>
              <button className="drawer-close" onClick={closeDrawer}>✕</button>
            </div>
            {navLinks.map(([p, label]) => (
              <button key={p} className={`drawer-link${page === p ? " active" : ""}`} onClick={() => { const hardNav: Partial<Record<Page, string>> = { "how-it-works": "/how-it-works", pricing: "/pricing", verification: "/verification", flatboard: "/flat-rate", openboard: "/open-loads", bidboard: "/bid-board", escorts: "/find-escorts", postload: "/post-load" }; const href = hardNav[p]; if (href) { window.location.href = href; return; } setPage(p); closeDrawer(); }}>{label}</button>
            ))}
            <div className="drawer-user">
              {user && profile ? (
                <>
                  <div className="mo" style={{ fontSize: 9, color: "var(--t2)", marginBottom: 4 }}>Signed in as <strong style={{ color: "var(--t1)" }}>{profile.full_name}</strong></div>
                  <div className="mo" style={{ fontSize: 8, color: "var(--or)", marginBottom: 10 }}>{profile.tier?.replace(/_/g, " ").toUpperCase()} · {profile.role?.replace(/_/g, " ").toUpperCase()}</div>
                  <button className="drawer-link" onClick={() => { profile?.role === "fleet_manager" ? (window["location"]["href"] = "/fleet-dashboard") : setPage(profile.role === "carrier" ? "dashboard-c" : "dashboard-e"); closeDrawer(); }}>→ Dashboard</button>
                  {profile?.role === 'admin' && (
                    <button className="drawer-link" onClick={() => { setPage('admin'); closeDrawer(); }}>Admin</button>
                  )}
                  <button className="drawer-signout" onClick={() => { onSignOut(); closeDrawer(); }}>SIGN OUT</button>
                  <a className="drawer-link" href="/delete-account" style={{ display: "block", marginTop: 8, fontSize: 11, opacity: 0.7 }}>Delete my account</a>
                </>
              ) : (
                <button className="btn btn-or btn-sm" style={{ width: "100%" }} onClick={() => { setSigninMode("signup"); setPage("signin"); closeDrawer(); }}>GET STARTED</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Footer({ setPage, signedIn = false }: { setPage: (p: Page) => void; signedIn?: boolean }) {
  return (
    <footer>
      <div className="footer-grid">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <img src="/logo.png" alt="OEH" style={{ width: 48, height: 48, objectFit: "contain" }} />
            <span className="bb" style={{ fontSize: 14, letterSpacing: ".06em" }}>Oversize Escort Hub</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.75, maxWidth: 230 }}>
            Marketplace for oversize carriers and P/EVO escorts. No commissions. No job fees. Ever.
          </p>
        </div>
        <div className="footer-col">
          <h4>Platform</h4>
          <><a href="/flat-rate">Flat Rate Board</a><a href="/bid-board">5-Min Bid Board</a><a href="/open-loads">Open Bid Board</a><a href="/post-load">Post a Load</a><a href="/find-escorts">Find Escorts</a><a href="/jobs">Jobs</a></>
        </div>
        <div className="footer-col">
          <h4>Membership</h4>
          {!signedIn && <a href="/signin?mode=signup">Create Account</a>}
          <a href={signedIn ? "/dashboard" : "/signin"}>{signedIn ? "My Dashboard" : "Sign in"}</a>
        </div>
        <div className="footer-col">
          <h4>Company</h4>
          <a href="/about" style={{color:"var(--t2)"}}>About</a><a href="mailto:support@oversize-escort-hub.com" style={{color:"var(--t2)"}}>Contact</a><a href="/privacy" style={{color:"var(--t2)"}}>Privacy Policy</a><a href="/terms" style={{color:"var(--t2)"}}>Terms of Service</a><a href="https://www.facebook.com/oversizeescorthub" target="_blank" rel="noopener noreferrer" style={{color:"var(--t2)"}}>Facebook</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Precision Pilot Services LLC. All rights reserved.</span>
        <span style={{ color: "var(--or)", letterSpacing: ".1em" }}>NO COMMISSIONS · NO JOB FEES · EVER</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <span title="American Flag" style={{ fontSize: 20 }}>🇺🇸</span>
          <span title="Thin Blue Line Flag" style={{ display: "inline-flex", flexDirection: "column", width: 28, height: 20, overflow: "hidden", borderRadius: 2 }}>
            <span style={{ flex: 2, background: "#000" }} />
            <span style={{ height: 5, background: "#1d4ed8" }} />
            <span style={{ flex: 2, background: "#000" }} />
          </span>
        </span>
        <div style={{ fontSize: 10, color: "var(--t3,#555)", textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
          Oversize Escort Hub is not affiliated with any government agency. Permit information is for reference only.
        </div>
      </div>
    </footer>
  );
}

function PayScore({ score }: { score: number }) {
  const cls = score >= 4.7 ? "ps-hi" : score >= 4.3 ? "ps-lo" : "ps-bad";
  return <span className={`ps ${cls}`}>{score} ⭐</span>;
}

function LockBar({ setPage }: { setPage: (p: Page) => void }) {
  // everything is free while we launch: no "member access required" or price on the sample load
  if (FREE_LAUNCH) return null;
  return (
    <div className="lock-bar">
      <div>
        <div className="mo" style={{ fontSize: 12, color: "var(--t3)" }}>📞 (XXX) XXX-XXXX &nbsp;·&nbsp; 📧 xxxxxxx@xxxxxx.com &nbsp;·&nbsp; 🏢 [Company Hidden]</div>
        <div className="mo" style={{ fontSize: 10, color: "var(--t2)", marginTop: 3 }}>🔒 Member access required — contact info hidden from free accounts</div>
      </div>
      <HideInApp>
      <button className="btn btn-or btn-sm" style={{ marginLeft: "auto" }} onClick={() => { window.location.href = '/pricing'; }}>Upgrade to Member — $19.99/mo →</button>
      </HideInApp>
    </div>
  );
}



// ─── HOME PAGE ────────────────────────────────────────────────────────────────

function HomePage({ setPage, user, profile, setSigninMode, setPendingRole }: { setPage: (p: Page) => void; user: User | null; profile: Profile | null; setSigninMode: (m: "signup" | "signin") => void; setPendingRole: (r: "escort"|"carrier"|"broker"|null) => void }) {
  const [role, setRole] = useState<Role>(null);
  // Scroll to top on mount
  useEffect(() => { window.scrollTo(0, 0); }, []);


  // If logged in, skip role picker and use their actual role
  useEffect(() => {
    if (profile) setRole(profile.role);
  }, [profile]);

  if (!role) {
    return (
      <HomeLanding
        onCarrier={() => { setPendingRole("carrier"); setSigninMode("signup"); setPage("signin"); }}
        onEscort={() => { setPendingRole("escort"); setSigninMode("signup"); setPage("signin"); }}
        onBroker={() => { setPendingRole("broker"); setSigninMode("signup"); setPage("signin"); }}
        onFleet={() => { window.location.href = "/join?role=fleet"; }}
        onSignIn={() => { setSigninMode("signin"); setPage("signin"); }}
      />
    );
  }

  const RoleBar = () => (
    <div className="role-bar">
      <span className="mo" style={{ fontSize: 9, color: "var(--t2)", letterSpacing: ".12em", textTransform: "uppercase" }}>Viewing as:</span>
      <span className="chip" style={{ background: role === "carrier" ? "rgba(255,98,0,.1)" : "rgba(245,162,0,.1)", color: role === "carrier" ? "var(--or)" : "var(--am)", border: `1px solid ${role === "carrier" ? "var(--or)" : "var(--am)"}` }}>
        {role === "carrier" ? "Oversize Carrier" : "Pilot Car / P/EVO"}
      </span>
      {!user && (
        <button className="mo" style={{ background: "none", border: "none", color: "var(--t2)", fontSize: 9, letterSpacing: ".1em", cursor: "pointer", textDecoration: "underline" }} onClick={() => setRole(null)}>
          Switch Role
        </button>
      )}
      {user && profile && (
        <span className="mo" style={{ fontSize: 9, color: "var(--t2)", marginLeft: "auto" }}>
          Welcome back, <strong style={{ color: "var(--t1)" }}>{profile.full_name || "there"}</strong>
          {" · "}
          <button className="mo" style={{ background: "none", border: "none", color: "var(--or)", fontSize: 9, cursor: "pointer" }} onClick={() => profile?.role === "fleet_manager" ? (window["location"]["href"] = "/fleet-dashboard") : setPage(profile.role === "carrier" ? "dashboard-c" : "dashboard-e")}>
            Go to Dashboard →
          </button>
        </span>
      )}
    </div>
  );

  if (role === "carrier") {
    return (
      <>
        <RoleBar />
        <div className="bid-strip">
          <div className="bid-live">5-Min Bid Board</div>
          <div style={{ width: 1, height: 18, background: "var(--l1)" }} />
          <div className="mo" style={{ fontSize: 10, color: "var(--t2)", flex: 1 }}>Loads close on timer · fill · or cancel</div>
          <button className="bid-cta" onClick={() => window.location.href = "/bid-board"}>View Live Board →</button>
        </div>
        <div className="hero hero-carrier">
          <div className="hero-inner">
            <div className="hero-tag tag-or">For Oversize Carriers &amp; Owner Operators</div>
            <div className="hero-hl" style={{ color: "var(--or)" }}>STOP<br />OVERPAYING<br />FOR<br />ESCORTS.</div>
            <p className="hero-sub">On many runs, permits and escorts come straight out of your load revenue — <strong style={{ color: "var(--t1)" }}>overhead that adds up fast with no tools to control it.</strong> Until now.</p>
            <p className="hero-sub">Industry standard is $2.00/mi or $500/day. Carriers who bid smart and book direct <strong style={{ color: "var(--t1)" }}>keep more of every load.</strong></p>
            <div className="stat-row">
              <div className="stat"><div className="stat-n" style={{ color: "var(--or)" }}>$0</div><div className="stat-l">Commissions</div></div>
              <div className="stat"><div className="stat-n" style={{ color: "var(--gr)" }}>Free</div><div className="stat-l">Always Post Loads</div></div>
              <div className="stat"><div className="stat-n" style={{ color: "var(--or)" }}>3</div><div className="stat-l">Load Boards</div></div>
            </div>
            <div className="btn-row">
              <button className="btn btn-or" onClick={() => setPage("postload")}>Post a Load Free →</button>
              <button className="btn btn-ghost" onClick={() => window.location.href = "/bid-board"}>See Bid Board</button>
            </div>
          </div>
        </div>
        <div className="platform-div">
          <span className="mo" style={{ fontSize: 9, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--t2)" }}>Platform</span>
          <span style={{ width: 1, height: 16, background: "var(--l1)" }} />
          <span className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>Three boards · Real-time bidding · No commissions · No job fees · Ever</span>
        </div>
        <FlatBoardPreview setPage={setPage} />
        <EscortsPreview setPage={setPage} />
        <FeatureSection setPage={setPage} />
      </>
    );
  }

  return (
    <>
      <RoleBar />
      <div className="bid-strip">
        <div className="bid-live">5-Min Bid Board</div>
        <div style={{ width: 1, height: 18, background: "var(--l1)" }} />
        <div className="mo" style={{ fontSize: 10, color: "var(--t2)", flex: 1 }}>Loads close on timer · fill · or cancel</div>
        <button className="bid-cta" onClick={() => window.location.href = "/bid-board"}>View Live Board →</button>
      </div>
      <div className="hero hero-escort">
        <div className="hero-inner">
          <div className="hero-tag tag-am">For Pilot Car Escorts / P/EVO Operators</div>
          <div className="hero-hl" style={{ color: "var(--am)" }}>STOP<br />DRIVING<br />HOME<br />EMPTY.</div>
          <p className="hero-sub">The average P/EVO escort deadheads home after <strong style={{ color: "var(--t1)" }}>40% of runs.</strong> At $2.00/mi that&apos;s real revenue sitting on the table every single week.</p>
          <p className="hero-sub">The Deadhead Minimizer surfaces return loads near your drop, sorted toward home state first. <strong style={{ color: "var(--am)" }}>Every recovered run is money back in your pocket.</strong></p>
          <div className="stat-row">
            <div className="stat"><div className="stat-n" style={{ color: "var(--am)" }}>$1,200</div><div className="stat-l">Recovered/Year</div></div>
            <div className="stat"><div className="stat-n" style={{ color: "var(--am)" }}>$0</div><div className="stat-l">While we launch</div></div>
            <div className="stat"><div className="stat-n" style={{ color: "var(--gr)" }}>Live</div><div className="stat-l">Bid board</div></div>
          </div>
          <div className="btn-row">
            {!FREE_LAUNCH && (
            <HideInApp>
            <button className="btn btn-am" onClick={() => { window.location.href = '/pricing'; }}>Go Pro — $29.99/mo →</button>
            </HideInApp>
            )}
            <button className="btn btn-ghost" onClick={() => setPage("signin")}>Create Free Account</button>
          </div>
        </div>
      </div>
      <div className="platform-div">
        <span className="mo" style={{ fontSize: 9, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--t2)" }}>Platform</span>
        <span style={{ width: 1, height: 16, background: "var(--l1)" }} />
        <span className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>Three boards · Real-time bidding · No commissions · No job fees · Ever</span>
      </div>
      <DeadheadSection setPage={setPage} />
      <FlatBoardPreview setPage={setPage} escortView />
      <FeatureSection setPage={setPage} />
    </>
  );
}

// ─── FLAT BOARD PREVIEW ───────────────────────────────────────────────────────

function FlatBoardPreview({ setPage, escortView }: { setPage: (p: Page) => void; escortView?: boolean }) {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLoads() {
      const { data } = await supabase
        .from("loads")
        .select("*")
        .eq("board_type", "flat-rate")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5);
      if (data && data.length > 0) {
        setLoads(data);
      } else {
        setLoads([]);
      }
      setLoading(false);
    }
    fetchLoads();
  }, []);

  return (
    <div className="section" style={{ paddingBottom: 0, paddingTop: escortView ? 0 : undefined }}>
      <div className="section-header">
        <div>
          <div className="eyebrow" style={{ color: "var(--gr)" }}>{escortView ? "Available Loads" : "Live Board"}</div>
          <div className="section-title">FLAT RATE LOADS</div>
        </div>
        <button className="section-link" onClick={() => window.location.href = "/flat-rate"}>View All Loads</button>
      </div>
      {loading ? (
        <div className="mo" style={{ fontSize: 10, color: "var(--t2)", padding: "20px 0" }}>Loading loads...</div>
      ) : loads.length === 0 ? (
        <div className="mo" style={{ fontSize: 11, color: "var(--t2)", padding: "24px 0", lineHeight: 1.6 }}>
          No open loads right now. New loads appear here the moment a carrier posts them.
        </div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr><th>Load ID</th><th>Route</th><th>Miles</th><th>Rate</th><th>Position</th><th>Pay Terms</th><th>Carrier Score</th><th>Contact</th><th>Status</th></tr>
            </thead>
            <tbody>
              {loads.map((l) => (
                <tr key={l.id} style={{ opacity: l.status === "filled" ? 0.42 : 1 }}>
                  <td className="mo" style={{ color: "var(--t2)", fontSize: 9 }}>
                    {l.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td style={{ fontWeight: 500, fontSize: 12 }}>{l.pu_city}, {l.pu_state} → {l.dl_city}, {l.dl_state}</td>
                  <td className="mo">{l.miles}</td>
                  <td className="mo" style={{ color: "var(--gr)", fontWeight: 600 }}>${l.per_mile_rate.toFixed(2)}/mi</td>
                  <td style={{ fontSize: 10 }}>{l.position}</td>
                  <td>{l.pay_type === "FastPay" ? <span className="chip ch-gr">⚡ FastPay</span> : <span className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>{l.pay_type}</span>}</td>
                  <td>{l.poster_rating ? <PayScore score={l.poster_rating} /> : <span className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>New</span>}</td>
                  <td>
                    <div className="mo" style={{ fontSize: 11, color: "var(--t3)" }}>📞 (XXX) XXX-XXXX</div>
                    <div className="mo" style={{ fontSize: 9, color: "var(--t3)" }}>🔒 Member only</div>
                  </td>
                  <td>{l.status === "filled" ? <span className="chip ch-dim">FILLED</span> : <span className="chip ch-gr">OPEN</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <LockBar setPage={setPage} />
    </div>
  );
}

// ─── ESCORTS PREVIEW ──────────────────────────────────────────────────────────

function EscortsPreview({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="section" style={{ paddingTop: 32 }}>
      <div className="section-header">
        <div>
          <div className="eyebrow" style={{ color: "var(--gr)" }}>P/EVO Professionals</div>
          <div className="section-title">ESCORT DIRECTORY</div>
        </div>
        <button className="section-link" onClick={() => { window.location.href = "/find-escorts"; }}>Browse Directory</button>
      </div>
      <div className="mo" style={{ fontSize: 11, color: "var(--t2)", padding: "14px 0", lineHeight: 1.6 }}>
        Escorts appear here as they join. We do not check or verify anyone: confirm licenses and insurance yourself before you hire.
      </div>
    </div>
  );
}

// ─── DEADHEAD SECTION ─────────────────────────────────────────────────────────

function DeadheadSection({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="eyebrow" style={{ color: "var(--am)" }}>Pro Exclusive</div>
          <div className="section-title">DEADHEAD MINIMIZER</div>
        </div>
      </div>
      <div style={{ background: "var(--p1)", border: "1px solid var(--l1)", borderLeft: "3px solid var(--am)", borderRadius: 4, padding: "24px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36 }}>
          <div>
            <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.85, marginBottom: 16 }}>6 empty return trips/month × 200mi avg = <strong style={{ color: "var(--rd)" }}>$240/month in fuel lost</strong> with zero revenue. Pro automatically surfaces return loads near your drop point, sorted toward home state first.</p>
            <div style={{ background: "var(--bg)", border: "1px solid var(--l1)", borderRadius: 3, padding: 14, marginBottom: 16 }}>
              <div className="mo" style={{ fontSize: 9, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--t2)", marginBottom: 10 }}>Deadhead Calculator · Example</div>
              {[["Deadhead cost (80mi × $0.67/mi)", "−$53.60", "var(--rd)"], ["Load pay ($2.00/mi × 340mi)", "+$680.00", "var(--gr)"], ["Net after deadhead", "$626.40", "var(--gr)"]].map(([l, v, c], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: i === 2 ? 13 : 11, padding: "5px 0", borderBottom: i < 2 ? "1px solid var(--l1)" : "none", fontWeight: i === 2 ? 600 : 400 }}>
                  <span style={{ color: i === 2 ? "var(--t1)" : "var(--t2)" }}>{l}</span>
                  <span style={{ color: c }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px 16px", background: "rgba(245,162,0,.07)", border: "1px solid rgba(245,162,0,.2)", borderRadius: 3, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
              <div className="mo" style={{ fontSize: 11, color: "var(--am)", lineHeight: 1.55 }}>One recovered run at 150mi = $300. That pays for Pro 10× over.</div>
              <button className="btn btn-am btn-sm" onClick={() => { window.location.href = '/pricing'; }}>GO PRO →</button>
            </div>
          </div>
          <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
            {[["Return Load Feed", "Phase 1 · Launch", "Mark job complete → loads within 100mi of drop sorted toward home. Refreshes every 15 min."],
              ["Pre-Arrival SMS Alerts", "Phase 2", "2hr before arrival: SMS showing return loads near destination."],
              ["I'm Available Broadcast", "Phase 2", "Toggle available → carriers with loads near you notified instantly."],
              ["Deadhead Savings Dashboard", "Always On", "Real dollar value tracked every time you open the app."],
            ].map(([title, badge, desc]) => (
              <div key={title} style={{ display: "flex", gap: 12, padding: "12px 14px", background: "var(--bg)", border: "1px solid var(--l1)", borderRadius: 3 }}>
                <div style={{ width: 6, borderRadius: 2, background: "var(--am)", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div className="mo" style={{ fontSize: 10, fontWeight: 500, marginBottom: 3 }}>{title} <span className="chip ch-am" style={{ fontSize: 8, marginLeft: 4 }}>{badge}</span></div>
                  <p style={{ fontSize: 11, color: "var(--t2)", lineHeight: 1.65 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureSection({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="section" style={{ paddingTop: 0 }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div className="eyebrow" style={{ color: "var(--t2)", textAlign: "center", marginBottom: 6 }}>Why the Industry Is Switching</div>
        <div className="bb" style={{ fontSize: 34, color: "var(--t1)" }}>EVERYTHING THE INDUSTRY WAS MISSING</div>
      </div>
      <div className="feat-grid">
        {[
          { c: "var(--am)", t: "5-Min Bid Board", d: "Industry first. Closes on timer, carrier fills it, or carrier cancels. Everyone sees new loads the moment they post." },
          { c: "var(--gr)", t: "Deal directly", d: "Carriers and escorts agree the work and pay between themselves. We do not check or verify anyone, so confirm licenses and insurance before any job." },
          { c: "var(--am)", t: "Deadhead Minimizer", d: "Return load feed sorted toward home state. I'm Available broadcast. Every empty mile is money left on the table." },
          { c: "var(--or)", t: "Carrier Pay Score (Public)", d: "Pay speed, communication, load accuracy, no-go fee history — all public. 4.9 fills in minutes. 2.8 sits on the board." },
          { c: "var(--bl)", t: "Open Bid Board", d: "24-72h window. Carrier reviews all bids, picks whoever they want. Escorts attach a personal pitch to every bid." },
          { c: "var(--gr)", t: "Two-Way Reviews", d: "Escorts rate carriers: pay speed, professionalism, accuracy. Carriers rate escorts: reliability, skill, communication." },
          { c: "var(--or)", t: "Contact Info Wall", d: "Phone, email, company name hidden behind membership. Every conversation on record." },
          { c: "var(--bl)", t: "Multi-Escort Coordinator", d: "One load needs Lead + Rear + High Pole. Post once, award all three from one screen." },
          { c: "var(--gr)", t: "No Commissions. Ever.", d: "Flat subscription. Zero job fees. Zero percentage cut. What you earn is yours. Not now, not at scale, not ever." },
        ].map((f) => (
          <div key={f.t} className="feat-card" style={{ borderTopColor: f.c }}>
            <div className="feat-title">{f.t}</div>
            <p className="feat-body">{f.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


const CURFEW_STATES: Record<string, string> = {
  NY: 'No oversize movement Fri 12pm-Mon 7am, holidays',
  NJ: 'No oversize Fri 3pm-Mon 7am',
  CT: 'No oversize Fri 12pm-Mon 7am',
  MA: 'No oversize Fri noon-Mon 7am',
  PA: 'No oversize Sunday, holidays',
  CA: 'Various restrictions by route - verify with Caltrans',
  IL: 'No oversize Sunday',
  OH: 'No oversize Sunday',
  IN: 'No oversize Sunday',
  TX: 'No movement during peak hours on certain corridors',
};
function EscortsPage({ setPage }: { setPage: (p: Page) => void }) {
  useEffect(() => { window.location.href = "/find-escorts"; }, []);
  return <div className="section"><div className="mo" style={{ fontSize: 11, color: "var(--t2)" }}>Opening the escort directory…</div></div>;
}

// ─── ESC PROFILE PAGE ─────────────────────────────────────────────────────────

function EscProfilePage({ setPage }: { setPage: (p: Page) => void }) {
  useEffect(() => { window.location.href = "/find-escorts"; }, []);
  return <div className="section"><div className="mo" style={{ fontSize: 11, color: "var(--t2)" }}>Opening the escort directory…</div></div>;
}

// ─── POST LOAD PAGE ───────────────────────────────────────────────────────────

function PostLoadPage({ setPage }: { setPage: (p: Page) => void; user?: User | null; profile?: Profile | null; showToast?: (msg: string, type: "gr" | "rd" | "am") => void }) {
  // Loads are posted on one screen only (it goes through the checked server route).
  useEffect(() => { window.location.href = "/post-load"; }, []);
  return <div className="section"><div className="mo" style={{ fontSize: 11, color: "var(--t2)" }}>Opening the post-a-load page…</div></div>;
}

function EscortDashPage({ setPage, profile, showToast }: { setPage: (p: Page) => void; profile: Profile | null; showToast?: (msg: string, type: "gr" | "rd" | "am") => void }) {
  const inApp = useInApp();
  const [tab, setTab] = useState("overview");
  const [myLoads, setMyLoads] = useState<Load[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [dhLoads, setDhLoads] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [disputeMsg, setDisputeMsg] = useState('');
  const [disputeJobId, setDisputeJobId] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);
    const [referralData, setReferralData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchLoads() {
      const { data } = await supabase.from("loads").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(10);
      if (data && data.length > 0) setMyLoads(data);
      else setMyLoads([]);
    }
    async function fetchJobs() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('loads')
        .select('*')
        .eq('matched_escort_id', user.id)
        .eq('status', 'filled')
        .order('created_at', { ascending: false });
      if (data) setMyJobs(data.map((l: any) => ({ id: l.id, status: l.status, loads: l })));
    }
    fetchLoads();
    fetchJobs();
    fetchDhLoads();
    fetchDisputes();
        fetchReferrals();
  }, []);

  async function fetchDhLoads() {
    const states = profile?.states_licensed || [];
    if (states.length === 0) return;
    const { data } = await supabase.from('loads').select('*').eq('board_type', 'flat-rate').eq('status', 'open').in('pu_state', states).limit(20);
    setDhLoads(data || []);
  }

  async function fetchDisputes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('disputes').select('*').eq('filed_by', user.id).order('created_at', { ascending: false });
    setDisputes(data || []);
  }

  async function submitDispute() {
    if (!disputeMsg.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setDisputeLoading(true);
    const { error } = await supabase.from('disputes').insert({
      filed_by: user.id,
      load_id: disputeJobId || null,
      description: disputeMsg,
      status: 'open',
    });
    if (error) {
      alert('Could not submit dispute: ' + error.message);
      setDisputeLoading(false);
      return;
    }
    setDisputeMsg('');
    setDisputeJobId('');
    setDisputeLoading(false);
    fetchDisputes();
  }

    async function fetchReferrals() {
        const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
                const { data } = await supabase.from('referrals').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false });
                    setReferralData(data || []);
                      }

  // ZONES_HOOK
  const [availStates, setAvailStates] = useState<string[]>(profile?.availability_states || [])
  const [zonesSaving, setZonesSaving] = useState(false)
  const [zonesMsg, setZonesMsg] = useState('')
  const [notifStates, setNotifStates] = useState<string[]>((profile?.notification_states as string[]) || [])
  const US_STATES_ALL = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarFileRef = useRef<HTMLInputElement>(null)
  async function handleAvatarUpload() {
    const file = avatarFileRef.current?.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAvatarUploading(false); return }
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
    setAvatarUploading(false)
  }
  
  async function saveZones() {
    setZonesSaving(true)
    const { data: { user: u } } = await supabase.auth.getUser()
    if (u) await supabase.from('profiles').update({ availability_states: availStates }).eq('id', u.id)
    setZonesMsg('Saved!'); setZonesSaving(false)
    setTimeout(() => setZonesMsg(''), 3000)
  }
  const tabs = [
    { id: "overview", label: "Overview" }, { id: "loads", label: "Available Loads" },
    { id: "dh", label: "Deadhead Minimizer" }, { id: "jobs", label: "My Jobs" },
    ...(VERIFICATION_LIVE ? [{ id: "certs", label: "Certifications" }] : []), { id: "dispute", label: "Dispute Center" },
    { id: "zones", label: "My States & Photo" },
  ];

  return (
    <div className="dash-grid">
      <div className="dash-nav">
        <div className="mo" style={{ fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--t3)", padding: "0 20px", marginBottom: 12 }}>Escort Dashboard</div>
        {tabs.map((t) => (
          <div key={t.id} className={`dash-nav-item${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</div>
        ))}
        <div style={{ padding: "20px 20px 0", marginTop: 20, borderTop: "1px solid var(--l1)" }}>
          <div className={`chip ${profile?.tier === "pro" ? "ch-am" : profile?.tier === "member" ? "ch-bl" : "ch-dim"}`} style={{ fontSize: 8, marginBottom: 8 }}>
            {(profile?.tier || "free").replace(/_/g, " ").toUpperCase()}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{profile?.full_name || "Your Name"}</div>
          <div className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>{profile?.company_name || "No company set"}</div>
          {profile?.tier === "free" && (
            <button className="btn btn-am btn-sm" style={{ marginTop: 12, width: "100%", fontSize: 8 }} onClick={() => { window.location.href = '/pricing'; }}>Upgrade to Pro →</button>
          )}
        </div>
      </div>
      <div className="dash-content">
        {tab === "overview" && (
          <>
            <div className="bb" style={{ fontSize: 24, marginBottom: 20 }}>OVERVIEW</div>
            <div className="metric-grid">
              {[["$0", "Deadhead Saved This Month", "var(--am)"], ["$0", "Total Earned This Year", "var(--gr)"], [profile?.rating ? profile.rating.toString() : "New", "Platform Rating", "var(--gr)"], [profile?.total_jobs ? `${profile.total_jobs}` : "0", "Jobs Completed", "var(--t1)"]].map(([n, l, c]) => (
                <div key={l} className="metric">
                  <div className="metric-n" style={{ color: c }}>{n}</div>
                  <div className="metric-l">{l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="card">
                <div className="mo" style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--t2)", marginBottom: 12 }}>Recent Jobs</div>
                <div className="mo" style={{ fontSize: 10, color: "var(--t3)", padding: "20px 0", textAlign: "center" }}>No jobs yet — find your first load →</div>
                <button className="btn btn-am btn-sm" style={{ width: "100%" }} onClick={() => setTab("loads")}>Browse Available Loads</button>
              </div>
              <div className="card">
                <div className="mo" style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--t2)", marginBottom: 12 }}>I&apos;m Available</div>
                <div style={{ background: "rgba(245,162,0,.07)", border: "1px solid rgba(245,162,0,.2)", borderRadius: 3, padding: 14, marginBottom: 12 }}>
                  <div className="mo" style={{ fontSize: 10, color: "var(--am)", marginBottom: 8 }}>Broadcast your availability to carriers with loads near you</div>
                  <button className="btn btn-am btn-sm" style={{ width: "100%" }} onClick={() => {
                    if (["pro", "fleet_starter", "fleet_plus", "fleet_pro"].includes(profile?.tier || "")) window.location.href = '/available';
                    else window.location.href = '/pricing';
                  }}>
                    {["pro", "fleet_starter", "fleet_plus", "fleet_pro"].includes(profile?.tier || "") ? "ACTIVATE BROADCAST" : "🔒 PRO FEATURE"}
                  </button>
                </div>
                <div className="mo" style={{ fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--t2)", marginBottom: 8 }}>Breakdown Protocol</div>
                <button className="btn btn-sm" style={{ width: "100%", background: "rgba(255,53,53,.1)", color: "var(--rd)", border: "1px solid rgba(255,53,53,.2)" }} onClick={async () => {
                  const res = await fetch('/api/escort/breakdown', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: true }) })
                  if (res.ok) showToast?.('Breakdown protocol activated', 'gr')
                  else showToast?.('Could not activate breakdown protocol', 'rd')
                }}>🚨 ACTIVATE BREAKDOWN PROTOCOL</button>
              </div>
            </div>
                        <div className="card" style={{ marginTop: 16 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Referral Rewards</div><p className="mo" style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 10 }}>Earn 1 free month of Pro for every escort you refer who signs up and joins.</p>{referralData.length === 0 ? (<div style={{ fontSize: 11, color: 'var(--t2)' }}>No referrals yet. Share your link to start earning!</div>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{referralData.map((r: any) => (<div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', borderBottom: '1px solid var(--t4)' }}><span>{r.referred_email || r.referred_id}</span><span className="chip ch-gr" style={{ fontSize: 9 }}>{r.referral_credit_months || 1} mo credit</span></div>))}</div>)}</div>
          </>
        )}
        {tab === "loads" && (
          <>
            <div className="bb" style={{ fontSize: 24, marginBottom: 8 }}>AVAILABLE LOADS</div>
            {myLoads.length === 0 && (
              <div className="mo" style={{ fontSize: 11, color: "var(--t2)", padding: "24px 0", lineHeight: 1.6 }}>
                No open loads right now. New loads appear here the moment a carrier posts them.
              </div>
            )}
            <div className="data-table" style={{ display: myLoads.length === 0 ? "none" : undefined }}>
              <table>
                <thead><tr><th>Load ID</th><th>Route</th><th>Miles</th><th>Rate</th><th>Est. Pay</th><th>Position</th><th>Pay Terms</th><th>Score</th><th></th></tr></thead>
                <tbody>
                  {myLoads.map((l) => (
                    <tr key={l.id}>
                      <td className="mo" style={{ color: "var(--t2)", fontSize: 9 }}>{l.id.slice(0, 8).toUpperCase()}</td>
                      <td style={{ fontWeight: 500, fontSize: 12 }}>{l.pu_city}, {l.pu_state} → {l.dl_city}, {l.dl_state}</td>
                      <td className="mo">{l.miles}</td>
                      <td className="mo" style={{ color: "var(--gr)", fontWeight: 600 }}>${l.per_mile_rate.toFixed(2)}/mi</td>
                      <td className="mo" style={{ color: "var(--gr)" }}>${((l.miles || 0) * l.per_mile_rate).toFixed(0)}</td>
                      <td style={{ fontSize: 10 }}>{l.position}</td>
                      <td>{l.pay_type === "FastPay" ? <span className="chip ch-gr">⚡ FastPay</span> : <span className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>{l.pay_type}</span>}</td>
                      <td>{l.poster_rating ? <PayScore score={l.poster_rating} /> : <span className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>New</span>}</td>
                      <td><button className="btn btn-am btn-sm" onClick={() => { window.location.href = `/loads/${l.id}`; }}>Respond →</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {tab === "dh" && (
          <>
            <div className="bb" style={{ fontSize: 24, marginBottom: 8 }}>DEADHEAD MINIMIZER</div>
            {profile?.tier !== "pro" ? (
              <div style={{ background: "rgba(245,162,0,.07)", border: "1px solid rgba(245,162,0,.2)", borderRadius: 4, padding: 24, textAlign: "center" }}>
                <div className="bb" style={{ fontSize: 28, color: "var(--am)", marginBottom: 8 }}>PRO FEATURE</div>
                <p className="mo" style={{ fontSize: 11, color: "var(--t2)", marginBottom: 16 }}>Return load feed, deadhead savings dashboard</p>
                <HideInApp>
                <button className="btn btn-am" onClick={() => { window.location.href = '/pricing'; }}>Upgrade to Pro — $29.99/mo →</button>
                </HideInApp>
              </div>
) : (
          <div>
            {dhLoads.length === 0 ? (
              <div style={{ color: 'var(--t2)', fontSize: 12, padding: '20px 0' }}>No flat-rate loads found in your licensed states right now. Check back soon.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {dhLoads.map((l: any) => (
                  <div key={l.id} className="load-card">
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{l.pu_city}, {l.pu_state} to {l.dl_city}, {l.dl_state}</div>
                    <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4 }}>{l.position} &middot; ${l.per_mile_rate?.toFixed(2)}/mi &middot; {l.miles} mi</div>
                    {l.start_date && <div style={{ fontSize: 10, color: 'var(--t2)' }}>{new Date(l.start_date).toLocaleDateString()}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}          </>
        )}
        {tab === "certs" && (
          <>
            <div className="bb" style={{ fontSize: 24, marginBottom: 20 }}>CERTIFICATIONS</div>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                { name: "P/EVO Verified", verified: profile?.p_evo_verified || (profile as any)?.pevo_verified, color: "var(--gr)" },
                { name: "Vehicle Verified", verified: profile?.vehicle_verified, color: "var(--bl)" },
                { name: "Background Checked", verified: profile?.bgc_verified, color: "var(--am)" },
                { name: "Admin Verified", verified: profile?.admin_verified, color: "var(--or)" },
              ].map((c) => (
                <div key={c.name} className="verify-tier" style={{ borderLeftColor: c.color }}>
                  <div style={{ minWidth: 160 }}>
                    <div className="chip" style={{ background: "transparent", color: c.color, border: `1px solid ${c.color}`, fontSize: 9 }}>
                      {c.verified ? "✓" : "○"} {c.name}
                    </div>
                  </div>
                  <div className="mo" style={{ fontSize: 10, color: c.verified ? "var(--gr)" : "var(--t2)" }}>
                    {c.verified ? "Verified ✓" : "Not yet verified"}
                  </div>
                  {!c.verified && <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }} onClick={() => setPage("verification")}>Get Verified</button>}
                </div>
              ))}
            </div>
                    <div className="card" style={{ marginTop: 20 }}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Upload Certification Document</div><p className="mo" style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 12 }}>Accepted: PDF, JPG, PNG. Max 10MB. Goes to admin review.</p><input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ marginBottom: 10 }} onChange={async (e) => { const file = e.target.files?.[0]; if (!file || !profile?.id) return; const fd = new FormData(); fd.append('pdf', file); fd.append('certType', 'pevo'); const exp = new Date(); exp.setFullYear(exp.getFullYear() + 1); fd.append('expiryDate', exp.toISOString().slice(0, 10)); const res = await fetch('/api/escort/cert-upload', { method: 'POST', body: fd }); const data = await res.json().catch(() => ({})); if (!res.ok) { alert('Upload failed: ' + (data.error || res.statusText)); return; } alert('Certificate uploaded for review!'); }} /></div>
          </>
        )}
{tab === "dispute" && (
        <>
          <div className="bb" style={{ fontSize: 24, marginBottom: 20 }}>DISPUTE CENTER</div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>File a New Dispute</div>
            <select className="input-field" style={{ width: '100%', marginBottom: 10 }} value={disputeJobId} onChange={e => setDisputeJobId(e.target.value)}>
              <option value="">Select a job (optional)</option>
              {myJobs.map((j: any) => <option key={j.id} value={j.id}>{j.loads?.pu_city} to {j.loads?.dl_city}</option>)}
            </select>
            <textarea className="input-field" style={{ width: '100%', minHeight: 80, marginBottom: 10 }} placeholder="Describe the issue..." value={disputeMsg} onChange={e => setDisputeMsg(e.target.value)} />
            <button className="btn btn-or btn-sm" onClick={submitDispute} disabled={disputeLoading}>{disputeLoading ? 'Submitting...' : 'Submit Dispute'}</button>
          </div>
          {disputes.length === 0 ? (
            <div style={{ color: 'var(--t2)', fontSize: 12 }}>No disputes filed yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {disputes.map((d: any) => (
                <div key={d.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className={`chip ${d.status === 'resolved' ? 'ch-gr' : d.status === 'open' ? 'ch-am' : 'ch-dim'}`}>{d.status}</span>
                    <span style={{ fontSize: 10, color: 'var(--t2)' }}>{new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--t2)' }}>{d.description}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}        {tab === "jobs" && (
        <div style={{ padding: "0 0 16px 0" }}>
          <div className="bb" style={{ fontSize: 18, marginBottom: 12 }}>My Jobs</div>
          {myJobs.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
              <div style={{ textAlign: "center" }}>
                <div className="bb" style={{ fontSize: 24, color: "var(--t2)", marginBottom: 8 }}>NO JOBS YET</div>
                <p className="mo" style={{ fontSize: 10, color: "var(--t3)", marginBottom: 16 }}>Complete your first load to see it here</p>
                <button className="btn btn-am btn-sm" onClick={() => setTab("loads")}>Browse Loads →</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {myJobs.map((j: any) => (
                <div key={j.id} style={{ background: "var(--card,#111)", border: "1px solid var(--l1,#222)", borderRadius: 8, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span className="bb" style={{ fontSize: 13 }}>{j.loads?.pu_city}, {j.loads?.pu_state} → {j.loads?.dl_city}, {j.loads?.dl_state}</span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: j.status === "confirmed" ? "var(--or,#f60)" : "var(--gr,#0a0)", color: "#fff", fontWeight: 700 }}>{j.status}</span>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--t2)" }}>
                    {j.loads?.commodity && <span>{j.loads.commodity}</span>}
                    {j.loads?.created_at && <span>{new Date(j.loads.created_at).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
              {/* ⛽ Upside Fuel Cash Back Card */}
              <div style={{ background: "var(--card,#111)", border: "1px solid var(--l1,#222)", borderLeft: "3px solid var(--or,#f60)", borderRadius: 8, padding: 20, marginTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>⛽</span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>Save on Every Fill-Up</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--t2,#888)", lineHeight: 1.6, marginBottom: 14 }}>
                  OEH members earn real cash back on fuel through Upside. The average escort saves $600+/year just by activating their free account.
                </p>
                <a href="https://upside.app.link/9WR232" target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-block", background: "var(--or,#f60)", color: "#000", fontWeight: 700, fontSize: 12, padding: "10px 20px", borderRadius: 6, textDecoration: "none" }}>
                  Activate Fuel Savings →
                </a>
              </div>
        {/* ── MY TOOLS ───────────────────────────────── */}
        <div style={{ marginTop: 24, background: "var(--card,#111)", border: "1px solid var(--l1,#222)", borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, letterSpacing: ".06em" }}>🧰 MY TOOLS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
            {[
              { icon: "🗺️", label: "Deadhead Minimizer", href: "#deadhead", tab: "dh" },
              { icon: "📋", label: "Permit Directory", href: "/tools/permits" },
              { icon: "📄", label: "Invoice Generator", href: "/tools/invoice", soon: true },
              { icon: "💰", label: "Expense Tracker", href: "/tools/expenses", soon: true },
              { icon: "⛽", label: "Fuel Savings (Upside)", href: "https://upside.app.link/9WR232", ext: true },
            ].filter(tool => !(inApp && tool.soon)).map(tool => (
              <a key={tool.label} href={tool.href} target={tool.ext ? "_blank" : "_self"} rel="noopener noreferrer"
                style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, background: "var(--p2,#1a1a1a)", border: "1px solid var(--l1,#222)", borderRadius: 8, padding: "12px 14px", textDecoration: "none", color: "var(--t1,#fff)", opacity: tool.soon ? 0.6 : 1, cursor: tool.soon ? "default" : "pointer" }}
                onClick={e => { if (tool.soon) e.preventDefault(); if (tool.tab) { e.preventDefault(); setTab(tool.tab); window.scrollTo({ top: 0, behavior: "smooth" }) } }}>
                <span style={{ fontSize: 20 }}>{tool.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600 }}>{tool.label}</span>
                {tool.soon && <span style={{ fontSize: 9, color: "var(--am,#f90)", fontWeight: 700 }}>COMING SOON</span>}
              </a>
            ))}
          </div>

          {tab === "zones" && (
            <div style={{ padding: 24 }}>
              <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Profile Photo</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
                  <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:80, height:80, borderRadius:'50%', background: profile?.avatar_url ? 'transparent' : '#ff6600', color:'#fff', fontSize:28, fontWeight:700, overflow:'hidden', flexShrink:0 }}>{profile?.avatar_url ? <img src={profile.avatar_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="avatar" /> : (profile?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase() || 'ME')}</span>
                  <div><input ref={avatarFileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarUpload} /><button className="btn btn-sm" onClick={() => avatarFileRef.current?.click()} disabled={avatarUploading}>{avatarUploading ? 'Uploading…' : 'Change Photo'}</button><div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>JPG or PNG shown on your profile card</div></div>
                </div>
              </div>
              <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📍 Load Alert States</div>
                <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 12 }}>Select states you run. Alerts only for these states. Leave blank for ALL loads.</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>{US_STATES_ALL.map((st: string) => { const sel = notifStates.includes(st); return (<button key={st} onClick={async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const cur: string[] = ((profile?.notification_states as string[]) || []); const next = sel ? cur.filter((s: string) => s !== st) : [...cur, st]; await supabase.from('profiles').update({ notification_states: next }).eq('id', user.id); setNotifStates(next); }} style={{ padding:'4px 10px', borderRadius:4, fontSize:11, fontWeight:600, border: sel ? '2px solid #ff6600' : '1px solid var(--l2)', background: sel ? '#ff6600' : 'var(--card)', color: sel ? '#fff' : 'var(--t1)', cursor:'pointer' }}>{st}</button>); })}</div>
                <div style={{ fontSize:11, color:'var(--t3)' }}>{notifStates.length === 0 ? 'All states (default)' : notifStates.join(', ')}</div>
              </div>
              <div className="card">
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🗺️ Availability Zones</div>
                <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 12 }}>States you are currently available to work in.</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>{US_STATES_ALL.map((st: string) => { const sel = availStates.includes(st); return (<button key={st} onClick={() => setAvailStates(sel ? availStates.filter((s: string) => s !== st) : [...availStates, st])} style={{ padding:'4px 10px', borderRadius:4, fontSize:11, fontWeight:600, border: sel ? '2px solid #ff6600' : '1px solid var(--l2)', background: sel ? '#ff6600' : 'var(--card)', color: sel ? '#fff' : 'var(--t1)', cursor:'pointer' }}>{st}</button>); })}</div>
                <button className="btn btn-or btn-sm" onClick={saveZones} disabled={zonesSaving}>{zonesSaving ? 'Saving…' : 'Save Availability'}</button>
                {zonesMsg && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--am)' }}>{zonesMsg}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CarrierDashPage({ setPage, user, profile, showToast }: { setPage: (p: Page) => void; user: User | null; profile: Profile | null; showToast: (msg: string, type: 'gr' | 'rd' | 'am') => void }) {
  const [tab, setTab] = useState<'active'|'requests'|'history'>('active')
  const [activeLoads, setActiveLoads] = useState<any[]>([])
  const [matchRequests, setMatchRequests] = useState<any[]>([])
  const [historyLoads, setHistoryLoads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user, tab])

  async function loadData() {
    if (!user) return
    setLoading(true)
    if (tab === 'active') {
      const { data } = await supabase.from('loads').select('*').eq('carrier_id', user.id).eq('status', 'open').order('created_at', { ascending: false })
      setActiveLoads(data || [])
    } else if (tab === 'requests') {
      // Pending match requests = this carrier's loads an escort has claimed.
      // Source of truth is loads (status 'pending_match' + matched_escort_id).
      const { data } = await supabase
        .from('loads')
        .select('*, profiles!matched_escort_id(full_name, tier, bgc_verified)')
        .eq('carrier_id', user.id)
        .eq('status', 'pending_match')
        .order('match_requested_at', { ascending: false })
      const mine = (data || []).map((l: any) => ({
        id: l.id, load_id: l.id, escort_id: l.matched_escort_id,
        created_at: l.match_requested_at || l.created_at, profiles: l.profiles, loads: l,
      }))
      setMatchRequests(mine)
    } else if (tab === 'history') {
      const { data } = await supabase.from('loads').select('*').eq('carrier_id', user.id).in('status', ['filled', 'expired']).order('created_at', { ascending: false })
      setHistoryLoads(data || [])
    }
    setLoading(false)
  }

  async function handleAccept(matchId: string, loadId: string, escortId: string) {
    if (!user) return
    const res = await fetch('/api/loads/match', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ load_id: loadId, action: 'accept', carrier_id: user.id }) })
    if (!res.ok) { showToast('Could not accept — please try again.', 'rd'); return }
    showToast('Match confirmed! Both parties will receive contact info.', 'gr')
    try{await fetch('/api/sms/match-confirm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({matchId: loadId, escortId})})}catch(e){}
    loadData()
  }

  async function handleDecline(matchId: string, loadId: string) {
    if (!user) return
    const res = await fetch('/api/loads/match', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ load_id: loadId, action: 'decline', carrier_id: user.id }) })
    if (!res.ok) { showToast('Could not decline — please try again.', 'rd'); return }
    showToast('Request declined. Load is back on the board.', 'am')
    loadData()
  }

  if (!user) return <div style={{ padding: 40, textAlign: 'center' }}>Please sign in to access your Carrier Hub.</div>

  const tabs = [
    { id: 'active', label: 'My Active Loads' },
    { id: 'requests', label: `Match Requests${matchRequests.length > 0 ? ` (${matchRequests.length})` : ''}` },
    { id: 'history', label: 'Load History' },
  ]

  return (
    <div className="dash-grid">
      <div className="dash-nav">
        <div className="mo" style={{ fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--t3)', padding: '0 20px', marginBottom: 12 }}>Carrier Hub</div>
        {tabs.map((t) => (
          <div key={t.id} className={`dash-nav-item${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id as any)}>{t.label}</div>
        ))}
        <div style={{ padding: '20px 20px 0' }}>
          <button className="btn btn-am" style={{ width: '100%' }} onClick={() => setPage('postload')}>+ POST A LOAD</button>
        </div>
        <div style={{ marginTop: 20, padding: '0 20px' }}>
          <div className={`chip ${profile?.tier === 'carrier_member' ? 'ch-or' : 'ch-dim'}`} style={{ fontSize: 8, marginBottom: 8 }}>
            {(profile?.tier || 'free').replace(/_/g, ' ').toUpperCase()}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{profile?.company_name || profile?.full_name || 'Your Company'}</div>
          <div className="mo" style={{ fontSize: 9, color: 'var(--t2)' }}>Carrier Account</div>
        </div>
      </div>
      <div style={{ padding: '20px 20px 0', marginTop: 20, borderTop: '1px solid var(--l1)' }}>
        {tab === 'active' && (
          <>
            <div className="bb" style={{ fontSize: 20, marginBottom: 16 }}>MY ACTIVE LOADS</div>
            {loading ? <div className="mo" style={{ color: 'var(--t2)' }}>Loading...</div> : activeLoads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <div className="bb" style={{ fontSize: 16, marginBottom: 8 }}>No active loads posted</div>
                <div className="mo" style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 20 }}>Post a load to start finding escorts</div>
                <button className="btn btn-am" onClick={() => setPage('postload')}>POST YOUR FIRST LOAD →</button>
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead><tr>
                    <th>Route</th><th>Date</th><th>Position</th><th>Certs</th><th>Pay Terms</th><th>Rate</th><th>Status</th>
                  </tr></thead>
                  <tbody>
                    {activeLoads.map((l) => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 500 }}>{l.pu_city}, {l.pu_state} → {l.dl_city}, {l.dl_state}</td>
                        <td className="mo" style={{ fontSize: 10 }}>{l.start_date ? new Date(l.start_date).toLocaleDateString() : '—'}</td>
                        <td>{l.position}</td>
                        <td style={{ fontSize: 10 }}>{(l.certs_required || []).slice(0, 3).join(', ')}{(l.certs_required || []).length > 3 ? '...' : ''}</td>
                        <td className="mo" style={{ fontSize: 10 }}>{l.pay_type}</td>
                        <td style={{ color: 'var(--gr)', fontWeight: 600 }}>{l.per_mile_rate ? `$${l.per_mile_rate}/mi` : l.day_rate ? `$${l.day_rate}/day` : '—'}</td>
                        <td><span className="chip ch-gr" style={{ fontSize: 8 }}>ACTIVE</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        {tab === 'requests' && (
          <>
            <div className="bb" style={{ fontSize: 20, marginBottom: 16 }}>MATCH REQUESTS</div>
            {loading ? <div className="mo" style={{ color: 'var(--t2)' }}>Loading...</div> : matchRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🤝</div>
                <div className="bb" style={{ fontSize: 16, marginBottom: 8 }}>No pending match requests</div>
                <div className="mo" style={{ fontSize: 11, color: 'var(--t2)' }}>When escorts request your loads, they'll appear here</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {matchRequests.map((m: any) => (
                  <div key={m.id} style={{ background: 'rgba(245,162,0,.05)', border: '1px solid rgba(245,162,0,.15)', borderRadius: 8, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{m.profiles?.full_name || 'Unknown Escort'}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span className={`chip ${m.profiles?.tier === 'pro' ? 'ch-am' : 'ch-dim'}`} style={{ fontSize: 8 }}>{(m.profiles?.tier || 'member').toUpperCase()}</span>
                          {VERIFICATION_LIVE && m.profiles?.bgc_verified && <span className="chip ch-gr" style={{ fontSize: 8 }}>✓ BGC</span>}
                          {(m.profiles?.certs || []).slice(0, 3).map((c: string) => (
                            <span key={c} className="chip ch-dim" style={{ fontSize: 8 }}>{c}</span>
                          ))}
                        </div>
                      </div>
                      <div className="mo" style={{ fontSize: 9, color: 'var(--t2)' }}>{new Date(m.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 12 }}>
                      Load: {m.loads?.pu_city}, {m.loads?.pu_state} → {m.loads?.dl_city}, {m.loads?.dl_state} | {m.loads?.position}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-am btn-sm" onClick={() => handleAccept(m.id, m.load_id, m.escort_id)} style={{ flex: 1 }}>✓ ACCEPT</button>
                      <button className="btn btn-sm" style={{ flex: 1, background: 'rgba(255,53,53,.1)', color: 'var(--rd)', border: '1px solid rgba(255,53,53,.2)' }} onClick={() => handleDecline(m.id, m.load_id)}>✗ DECLINE</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {tab === 'history' && (
          <>
            <div className="bb" style={{ fontSize: 20, marginBottom: 16 }}>LOAD HISTORY</div>
            {loading ? <div className="mo" style={{ color: 'var(--t2)' }}>Loading...</div> : historyLoads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📁</div>
                <div className="bb" style={{ fontSize: 16, marginBottom: 8 }}>No load history yet</div>
                <div className="mo" style={{ fontSize: 11, color: 'var(--t2)' }}>Completed and expired loads will appear here</div>
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead><tr>
                    <th>Route</th><th>Date</th><th>Position</th><th>Pay Terms</th><th>Rate</th><th>Status</th>
                  </tr></thead>
                  <tbody>
                    {historyLoads.map((l) => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 500 }}>{l.pu_city}, {l.pu_state} → {l.dl_city}, {l.dl_state}</td>
                        <td className="mo" style={{ fontSize: 10 }}>{l.start_date ? new Date(l.start_date).toLocaleDateString() : '—'}</td>
                        <td>{l.position}</td>
                        <td className="mo" style={{ fontSize: 10 }}>{l.pay_type}</td>
                        <td>{l.per_mile_rate ? `$${l.per_mile_rate}/mi` : l.day_rate ? `$${l.day_rate}/day` : '—'}</td>
                        <td><span className={`chip ${l.status === 'filled' ? 'ch-gr' : 'ch-dim'}`} style={{ fontSize: 8 }}>{l.status?.toUpperCase()}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        {/* ── CARRIER TOOLS ──────────────────────────── */}
        <div style={{ marginTop: 24, background: "var(--card,#111)", border: "1px solid var(--l1,#222)", borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, letterSpacing: ".06em" }}>🧰 CARRIER TOOLS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10, marginBottom: 16 }}>
            {[
              { icon: "📋", label: "Permit Directory", href: "/tools/permits" },
              { icon: "📤", label: "Post a Load", href: "#", action: () => setPage("postload") },
              { icon: "💰", label: "Upside Fuel Savings", href: "https://upside.app.link/9WR232", ext: true },
                            { icon: "🚛", label: "Available Escorts", href: "#", action: () => setPage("available") },
            ].map(tool => (
              <a key={tool.label} href={tool.href} target={tool.ext ? "_blank" : "_self"} rel="noopener noreferrer"
                style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, background: "var(--p2,#1a1a1a)", border: "1px solid var(--l1,#222)", borderRadius: 8, padding: "12px 14px", textDecoration: "none", color: "var(--t1,#fff)" }}
                onClick={e => { if(tool.action) { e.preventDefault(); tool.action(); } }}>
                <span style={{ fontSize: 20 }}>{tool.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600 }}>{tool.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


// ─── PRICING PAGE ─────────────────────────────────────────────────────────────

function PricingPage({ setPage }: { setPage: (p: Page) => void }) {
  const inApp = useInApp();
  if (inApp) {
    return (
      <div className="section" style={{ textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--t2)" }}>Everything is free while we launch.</p>
        <button className="btn" style={{ marginTop: 16 }} onClick={() => setPage("home")}>Back to home</button>
      </div>
    );
  }
  return (
    <div className="section">
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div className="eyebrow" style={{ color: "var(--t2)", textAlign: "center", marginBottom: 6 }}>No commissions. No job fees. Ever.</div>
        <div className="bb" style={{ fontSize: 38, color: "var(--t1)" }}>FLAT SUBSCRIPTION PRICING</div>
        <p style={{ fontSize: 13, color: "var(--t2)", marginTop: 8 }}>Annual discounts available · Daily passes available</p>
      </div>
      <div className="price-grid">
        {TIERS.map((tier) => (
          <div key={tier.id} className={`price-card${tier.popular ? " popular" : ""}`} style={{ borderTop: `2px solid ${tier.color}` }}>
            {tier.popular && <div className="chip ch-am" style={{ fontSize: 8, marginBottom: 4 }}>MOST POPULAR</div>}
            <div>
              <div className="price-name" style={{ color: tier.color }}>{tier.name}</div>
              <div className="price-n" style={{ color: tier.price === 0 ? "var(--t2)" : "var(--t1)" }}>{tier.price === 0 ? "FREE" : `$${tier.price}`}</div>
              <div className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>{tier.sub}</div>
              {tier.daily && <div className="mo" style={{ fontSize: 9, color: "var(--t2)", marginTop: 2 }}>or ${tier.daily} daily pass</div>}
              {tier.carrierPro && <div className="mo" style={{ fontSize: 9, color: "var(--or)", marginTop: 2 }}>Carrier Pro: ${tier.carrierPro}/mo</div>}
            </div>
            <div style={{ borderTop: "1px solid var(--l1)", paddingTop: 14, display: "grid", gap: 8 }}>
              {tier.features.map((f) => <div key={f} className="price-feat">{f}</div>)}
            </div>
            <button className="btn btn-sm" style={{ width: "100%", background: tier.popular ? "var(--am)" : "transparent", color: tier.popular ? "#000" : tier.color, border: `1px solid ${tier.color}` }} onClick={() => setPage("signin")}>
              {tier.price === 0 ? "Join Free" : "Get Started"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── VERIFICATION PAGE ────────────────────────────────────────────────────────

function VerificationPage() {
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef1 = useRef<HTMLInputElement>(null)
  const fileRef2 = useRef<HTMLInputElement>(null)
  const fileRef3 = useRef<HTMLInputElement>(null)

  async function handleUpload(tier: 1 | 2, fileRef: React.RefObject<HTMLInputElement | null>) {
    const file = fileRef.current?.files?.[0]
    if (!file) { setMsg('Please select a file first.'); return }
    if (file.size > 10 * 1024 * 1024) { setMsg('File exceeds 10 MB limit.'); return }
    setUploading(true); setMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMsg('Please sign in first.'); setUploading(false); return }
    const bucket = tier === 1 ? 'pevo-certs' : 'vehicle-docs'
    const path = `${user.id}/${Date.now()}-${file.name}`
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (upErr) { setMsg('Upload failed: ' + upErr.message); setUploading(false); return }
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
    const res = await fetch('/api/verify-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tier,
        fileName: file.name,
        storagePath: path,
        documentUrl: urlData.publicUrl,
      })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setMsg('Upload failed: ' + (data.error || res.statusText))
      setUploading(false)
      return
    }
    setMsg('✅ Submitted! Admin will review within 48 hours.')
    setUploading(false)
  }

  async function handleStripe() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMsg('Please sign in first.'); return }
    const res = await fetch('/api/bgc-checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else if (data.alreadyPaid) setMsg('Already paid — upload your BGC document.')
    else setMsg(data.error || 'Checkout failed. Please try again.')
  }

  const tiers = [
    { tier: 1, name: 'P/EVO Verified', color: 'var(--gr)', desc: 'Upload your current state P/EVO or EVO certification. Admin reviews and marks your profile.', action: 'upload1' },
    { tier: 2, name: 'Vehicle Verified', color: 'var(--bl)', desc: 'Submit vehicle registration, insurance card (min \$1M liability), and photo of your escort setup.', action: 'upload2' },
    { tier: 3, name: 'Background Checked', color: 'var(--am)', desc: 'Pay \$9.99 to unlock BGC tier. Then upload your background check PDF (Checkr, Sterling, or First Advantage — under 90 days).', action: 'stripe' },
    { tier: 4, name: 'Admin Verified', color: 'var(--or)', desc: 'Highest trust level. Complete Tiers 1–3 first. Admin verification is by invitation only.', action: 'locked' },
  ]

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="eyebrow" style={{ color: "var(--gr)" }}>Trust &amp; Safety</div>
          <div className="section-title">VERIFICATION SYSTEM</div>
        </div>
      </div>
      <div style={{ background: "var(--p2)", border: "1px solid var(--l1)", borderRadius: 3, padding: "14px 18px", marginBottom: 24 }} className="mo">
        <span style={{ fontSize: 10, color: "var(--t2)" }}>4-tier trust ladder. All opt-in. All standards published publicly. Fraudulent listings cannot exist here.</span>
      </div>
      {msg && <div style={{ background: msg.startsWith('✅') ? '#1a3a1a' : '#3a1a1a', border: `1px solid ${msg.startsWith('✅') ? 'var(--gr)' : '#f44'}`, borderRadius: 6, padding: '10px 16px', marginBottom: 16, fontSize: 12, color: msg.startsWith('✅') ? 'var(--gr)' : '#f88' }}>{msg}</div>}
      {tiers.map((v) => (
        <div key={v.tier} className="verify-tier" style={{ borderLeftColor: v.color }}>
          <div style={{ minWidth: 100, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: v.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              {v.tier === 4 ? '🔒' : v.action === 'locked' ? '🔒' : '✓'}
            </div>
            <div className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>Tier {v.tier}</div>
            <div className="chip" style={{ background: "transparent", color: v.color, border: `1px solid ${v.color}`, fontSize: 9 }}>✓ {v.name}</div>
          </div>
          <p style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.75 }}>{v.desc}</p>
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {v.action === 'upload1' && (
              <>
                <input ref={fileRef1} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} />
                <button className="btn btn-ghost btn-sm" onClick={() => fileRef1.current?.click()}>Choose File</button>
                <button className="btn btn-or btn-sm" onClick={() => handleUpload(1, fileRef1)} disabled={uploading}>{uploading ? 'Uploading…' : 'Submit Tier 1'}</button>
              </>
            )}
            {v.action === 'upload2' && (
              <>
                <input ref={fileRef2} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} />
                <button className="btn btn-ghost btn-sm" onClick={() => fileRef2.current?.click()}>Choose File</button>
                <button className="btn btn-or btn-sm" onClick={() => handleUpload(2, fileRef2)} disabled={uploading}>{uploading ? 'Uploading…' : 'Submit Tier 2'}</button>
              </>
            )}
            {v.action === 'stripe' && (
              <HideInApp>
              <button className="btn btn-or btn-sm" onClick={handleStripe}>Pay \$9.99 → Start BGC</button>
              </HideInApp>
            )}
            {v.action === 'locked' && (
              <button className="btn btn-ghost btn-sm" style={{ opacity: 0.5, cursor: 'not-allowed' }} onClick={() => setMsg('🔒 Complete Tiers 1–3 first. Admin verification is by invitation.')}>🔒 Locked</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── SIGN IN PAGE ─────────────────────────────────────────────────────────────

function SignInPage({ setPage, showToast, initialMode = "signup", initialRole = "escort" }: { setPage: (p: Page) => void; showToast: (msg: string, type: "gr" | "rd" | "am") => void; initialMode?: "signup" | "signin"; initialRole?: "escort"|"carrier"|"broker" }) {
  const [mode, setMode] = useState<"signup" | "signin">(initialMode);
  const [role, setRole] = useState<"escort" | "carrier" | "broker">(initialRole);
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [termsOptIn, setTermsOptIn] = useState(false);

  async function handleForgotPassword() {
    if (!email) { showToast("Enter your email address first", "rd"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/auth/callback" });
    if (error) showToast(error.message, "rd");
    else showToast("Password reset email sent! Check your inbox.", "gr");
  }

  async function handleSubmit() {
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, company_name: company, role, sms_opt_in: smsOptIn, sms_opt_in_at: smsOptIn ? new Date().toISOString() : null }, emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) showToast(error.message, "rd");
      else showToast("Check your email to confirm your account!", "gr");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) showToast(error.message, "rd");
      else if (data.user) {
        showToast("Welcome back!", "gr");
        setTimeout(() => setPage("home"), 500);
      }
    }
    setLoading(false);
  }

  return (
    <div className="signin-wrap">
      <div className="signin-box">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <img src="/logo.png" alt="OEH" style={{ width: 52, height: 52, objectFit: "contain" }} />
          <div>
            <div className="bb" style={{ fontSize: 20 }}>{mode === "signup" ? "Create Your Account" : "Welcome Back"}</div>
            <div className="mo" style={{ fontSize: 9, color: "var(--t2)", letterSpacing: ".1em" }}>OVERSIZE ESCORT HUB</div>
          </div>
        </div>
        {mode === "signup" && (
          <div style={{ display: "flex", border: "1px solid var(--l1)", borderRadius: 3, overflow: "hidden", marginBottom: 20 }}>
            {(["escort", "carrier", "broker"] as const).map((r) => (
              <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: "10px 0", background: role === r ? (r === "escort" ? "var(--am)" : "var(--or)") : "transparent", color: role === r ? "#000" : "var(--t2)", border: "none", fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase" as const, fontWeight: 700 }}>
                {r === "escort" ? "Escort / P/EVO" : r === "carrier" ? "Carrier" : "Freight Broker"}
              </button>
            ))}
          </div>
        )}
        {mode === "signup" && (
          <div style={{ marginTop: -10, marginBottom: 18, textAlign: "center" }}>
            <a href="/join?role=fleet" className="mo" style={{ fontSize: 10, color: "#4f8cff", letterSpacing: ".06em", textDecoration: "none" }}>Run a fleet? Sign up as a fleet manager →</a>
          </div>
        )}
        {mode === "signup" && (
          <div className="form-field">
            <label className="form-label">Full Name</label>
            <input type="text" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
        )}
        <div className="form-field">
          <label className="form-label">Email Address</label>
          <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Password</label>
          <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {mode === "signup" && (
          <div className="form-field">
            <label className="form-label">Company / Business Name (optional)</label>
            <input type="text" placeholder="Your company name" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
        )}
        <button className="btn btn-or" style={{ width: "100%", justifyContent: "center", marginBottom: 12 }} onClick={handleSubmit} disabled={loading || !email || !password}>
          {loading ? "Please wait..." : mode === "signup" ? "Create Free Account →" : "Sign In →"}
        </button>
        {mode === "signup" && (
        <div style={{ textAlign: "center" }}>
          <span className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>{mode === "signup" ? "Already have an account? " : "Don't have an account? "}</span>
          <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} style={{ background: "none", border: "none", color: "var(--or)", fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: "pointer" }}>
            {mode === "signup" ? "Sign In" : "Create Account"}
          </button>
        </div>
        )}
          {mode === "signin" && (
            <button onClick={() => handleForgotPassword()} style={{ background: "none", border: "none", color: "var(--t3)", fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: "pointer", marginTop: 8, display: "block", width: "100%", textAlign: "center" }}>Forgot Password?</button>
          )}
        {mode === "signup" && (
        <div style={{ borderTop: "1px solid var(--l1)", marginTop: 20, paddingTop: 16 }}>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "10px 12px", cursor: "pointer" }}>
            <input type="checkbox" checked={smsOptIn} onChange={e => setSmsOptIn(e.target.checked)} style={{ marginTop: 2, accentColor: "var(--or)", flexShrink: 0, width: 14, height: 14 }} />
            <span style={{ fontSize: 10, color: "#e5e7eb", lineHeight: 1.7 }}>
              I agree to receive text messages from Oversize Escort Hub at (855) 601-4751 about my account, load alerts, bids and matches, and texts I send to post loads. Consent is not a condition of using OEH. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Mobile information will not be shared with third parties or affiliates for marketing or promotional purposes. Program details{" "}
                    <a href="/sms" style={{ color: "#60a5fa" }}>here</a>. Privacy Policy can be found{" "}
                    <a href="/privacy" style={{ color: "#60a5fa" }}>here</a>. Terms &amp; Conditions can be found{" "}
                    <a href="/terms" style={{ color: "#60a5fa" }}>here</a>.</span>
          </label>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "10px 12px", cursor: "pointer", marginTop: 8 }}>
            <input type="checkbox" style={{ marginTop: 2, accentColor: "var(--or)", flexShrink: 0, width: 14, height: 14 }} />
            <span style={{ fontSize: 10, color: "#e5e7eb", lineHeight: 1.7 }}>
              I agree to the{" "}
              <a href="/privacy" style={{ color: "#60a5fa" }}>Privacy Policy</a> and{" "}
              <a href="/terms" style={{ color: "#60a5fa" }}>Terms of Service</a>.
            </span>
          </label>
        </div>
        )}
        <div className="mo" style={{ fontSize: 9, color: "var(--t2)", textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
          Free while we launch · No credit card required<br />
          $2.00/mi standard · $100 overnight · $250 no-go
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────


// ─── COMING SOON STUB ─────────────────────────────────────────────────────────
function Stub({ title, icon, desc, back, setPage }: { title: string; icon: string; desc: string; back: string; setPage: (p: any) => void }) {
  return (
    <div className="section">
      <button className="btn btn-ghost btn-sm" onClick={() => setPage(back)} style={{ marginBottom: 20 }}>← Back</button>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 32 }}>{icon}</span>
        <div>
          <h1 className="bb" style={{ fontSize: 22 }}>{title}</h1>
          <span style={{ background: "var(--or)", color: "#000", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 3, letterSpacing: ".1em" }}>COMING SOON</span>
        </div>
      </div>
      <div className="card" style={{ padding: 40, textAlign: "center" }}>
        <span style={{ fontSize: 48 }}>{icon}</span>
        <p style={{ color: "var(--t2)", fontSize: 13, maxWidth: 420, margin: "16px auto 0", lineHeight: 1.7 }}>{desc}</p>
        <div style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 8, padding: "14px 24px", marginTop: 24, display: "inline-block" }}>
          <span className="mo" style={{ fontSize: 10, color: "var(--or)" }}>BUILDING NOW — AVAILABLE SOON</span>
        </div>
      </div>
    </div>
  );
}

// ─── TOOLS HUB ────────────────────────────────────────────────────────────────
function ToolsPage({ setPage, profile }: { setPage: (p: any) => void; profile: any }) {
  const inApp = useInApp();
  const allTools = [
    { page: "invoice", icon: "🧾", title: "Invoice Generator", desc: "Create and send professional invoices to carriers", badge: "MEMBER" },
    { page: "expenses", icon: "📊", title: "Expense Tracker", desc: "Log jobs and expenses, export CSV/PDF for taxes", badge: "MEMBER" },
    { page: "job-history", icon: "📋", title: "Job History", desc: "View completed loads and earnings history", badge: "MEMBER" },
    { page: "permits", icon: "📄", title: "Permit Hub", desc: "Upload and receive permits day of load instantly", badge: "ALL" },
    { page: "deadhead", icon: "🚗", title: "Stop Driving Home Empty", desc: "Find return loads and recover ~$4,800/yr", badge: "PRO" },
    { page: "dot-lookup", icon: "🔍", title: "DOT Carrier Lookup", desc: "Look up a carrier through the FMCSA free API", badge: "MEMBER" },
    { page: "state-reqs", icon: "🗺️", title: "State Escort Requirements", desc: "Escort requirements by state and load dimensions", badge: "MEMBER" },
    { page: "weather", icon: "⛅", title: "Weather Alerts", desc: "Weather conditions on your route via NWS free API", badge: "MEMBER" },
    { page: "cb-radio", icon: "📻", title: "CB Radio Reference", desc: "Standard CB channels by state and highway", badge: "ALL" },
    { page: "fuel-calc", icon: "⛽", title: "Fuel Cost Estimator", desc: "Current diesel prices and trip fuel cost estimate", badge: "MEMBER" },
    { page: "per-diem", icon: "💰", title: "Per Diem Calculator", desc: "IRS standard rates for tax deductions", badge: "MEMBER" },
    { page: "cert-tracker", icon: "🏅", title: "Cert Expiry Tracker", desc: "Track cert expiry dates", badge: "ALL" },
    { page: "factoring", icon: "💳", title: "Invoice Factoring", desc: "Get paid fast via partner factoring network", badge: "SOON" },
  ];
  // In the phone apps only the tools that really work are listed; placeholder pages stay on the website.
  const tools = inApp ? allTools.filter(t => t.page === "deadhead" || t.page === "cb-radio") : allTools;
  const badgeColor: Record<string, string> = { MEMBER: "var(--gr)", PRO: "var(--or)", ALL: "var(--am)", SOON: "var(--t3)" };
  return (
    <div className="section">
      <div style={{ marginBottom: 24 }}>
        <h1 className="bb" style={{ fontSize: 24, marginBottom: 6 }}>Business Tools</h1>
        <p className="mo" style={{ fontSize: 11, color: "var(--t2)" }}>Everything you need to run your oversize escort business in one place.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {tools.map(t => (
          <div key={t.page} onClick={() => t.badge !== "SOON" && setPage(t.page as any)}
            style={{ background: "var(--p1)", border: "1px solid var(--l1)", borderRadius: 8, padding: 20, cursor: t.badge !== "SOON" ? "pointer" : "default", opacity: t.badge === "SOON" ? 0.5 : 1 }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{t.icon}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span className="bb" style={{ fontSize: 13 }}>{t.title}</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: badgeColor[t.badge], background: badgeColor[t.badge] + "20", padding: "2px 6px", borderRadius: 3 }}>{t.badge}</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.6, margin: 0 }}>{t.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ALL OTHER TOOL PAGES ──────────────────────────────────────────────────────
function InvoicePage({ setPage, user, profile }: any) { return <Stub title="Invoice Generator" icon="🧾" desc="Create professional invoices, track payment status, and send directly to carriers. Export to PDF for your records." back="tools" setPage={setPage} />; }
function ExpensesPage({ setPage, user, profile }: any) { return <Stub title="Expense & Job Tracker" icon="📊" desc="Log jobs and expenses. Track fuel, lodging, equipment. Export CSV or PDF at tax time." back="tools" setPage={setPage} />; }
function JobHistoryPage({ setPage }: any) { return <Stub title="Job History" icon="📋" desc="View all completed loads, earnings per job, and carrier history. Syncs automatically from OEH load board." back="tools" setPage={setPage} />; }
function PermitHubPage({ setPage, user, profile }: any) { return <Stub title="Permit Hub" icon="📄" desc="Carriers upload permits to your load." back="tools" setPage={setPage} />; }
function DeadheadPage({ setPage, profile }: any) {
  const isPro = ["pro", "fleet_starter", "fleet_plus", "fleet_pro"].includes(profile?.tier || "")
  const [mode, setMode] = useState<"single" | "fleet">("single")
  const [location, setLocation] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState("")
  // Fleet Manager fields
  const defaultEscort = { name: "", phone: "", city: "", state: "", available: true }
  const [escorts, setEscorts] = useState([{ ...defaultEscort }])
  const [fleetResults, setFleetResults] = useState<any[]>([])
  const [rateLimitMsg, setRateLimitMsg] = useState("")

  function updateEscort(i: number, field: string, val: any) {
    setEscorts(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e))
  }
  function addEscort() {
    if (escorts.length < 5) setEscorts(prev => [...prev, { ...defaultEscort }])
  }
  function removeEscort(i: number) {
    setEscorts(prev => prev.filter((_, idx) => idx !== i))
  }

  async function runSingleSearch() {
    if (!location.trim()) return
    setSearching(true); setError(""); setResults([])
    try {
      const [city, state] = location.split(",").map(s => s.trim())
      const stateCode = (state || city || "").toUpperCase()
      const { data: loads } = await supabase
        .from("loads")
        .select("id, pu_city, pu_state, dl_city, dl_state, per_mile_rate, status, board_type")
        .eq("board_type", "flat-rate")
        .eq("status", "open")
        .ilike("pu_state", stateCode)
        .limit(10)
      const nearby = loads ?? []
      setResults(nearby)
      if (!nearby.length) setError("No return loads found near your location. Check back soon.")
    } catch (e: any) {
      setError("Search failed. Please try again.")
    } finally {
      setSearching(false)
    }
  }

  async function runFleetSearch() {
    if (!profile?.id) { setError("You must be signed in."); return }
    setSearching(true); setError(""); setFleetResults([]); setRateLimitMsg("")
    try {
      const res = await fetch("/api/fleet-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id, escorts }),
      })
      const data = await res.json()
      if (res.status === 429) { setRateLimitMsg(data.error); return }
      if (!res.ok) { setError(data.error || "Fleet search failed."); return }
      setFleetResults(data.results ?? [])
    } catch (e: any) {
      setError("Fleet search failed. Please try again.")
    } finally {
      setSearching(false)
    }
  }

  const S = {
    page: { background: "#0a0a0a", minHeight: "100vh", color: "#fff", paddingBottom: 60 },
    header: { background: "#111", borderBottom: "1px solid #1a1a1a", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 },
    back: { background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 14, padding: "4px 8px" },
    body: { maxWidth: 760, margin: "0 auto", padding: "24px 16px" },
    toggle: { display: "flex", gap: 0, marginBottom: 28, borderRadius: 8, overflow: "hidden", border: "1px solid #333" },
    tab: (active: boolean) => ({ flex: 1, padding: "10px 0", textAlign: "center" as const, background: active ? "#ff6600" : "#1a1a1a", color: active ? "#fff" : "#888", border: "none", cursor: "pointer", fontSize: 14, fontWeight: active ? 700 : 400, transition: "all 0.2s" }),
    upgradeCard: { background: "#1a1a1a", border: "1px solid #ff6600", borderRadius: 12, padding: "28px 24px", textAlign: "center" as const, marginTop: 20 },
    input: { width: "100%", background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, padding: "12px 14px", color: "#fff", fontSize: 15, boxSizing: "border-box" as const, marginBottom: 12 },
    btn: { background: "#ff6600", border: "none", borderRadius: 8, padding: "12px 28px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 15 },
    slotCard: { background: "#161616", border: "1px solid #2a2a2a", borderRadius: 10, padding: "16px", marginBottom: 12 },
    resultCard: { background: "#161616", border: "1px solid #2a2a2a", borderRadius: 10, padding: "16px", marginBottom: 10 },
    shareBtn: { background: "none", border: "1px solid #555", borderRadius: 6, padding: "6px 12px", color: "#aaa", cursor: "pointer", fontSize: 12, marginTop: 8 },
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button style={S.back} onClick={() => setPage("tools")}>← Tools</button>
        <span style={{ fontSize: 20 }}>🚛</span>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Deadhead Minimizer</h1>
        {isPro && <span style={{ marginLeft: "auto", fontSize: 11, background: "#ff6600", color: "#fff", borderRadius: 4, padding: "2px 7px", fontWeight: 700 }}>PRO</span>}
      </div>

      <div style={S.body}>
        {!isPro ? (
          <div style={S.upgradeCard}>
            <p style={{ fontSize: 24, marginBottom: 8 }}>🚛</p>
            <h2 style={{ color: "#ff6600", marginBottom: 8 }}>Pro Feature</h2>
            <p style={{ color: "#aaa", marginBottom: 20, maxWidth: 400, margin: "0 auto 20px" }}>
              The Deadhead Minimizer and Fleet Manager Tools are available on Pro. The average escort recovers <strong style={{ color: "#fff" }}>$4,800/year</strong> with this feature.
            </p>
            <HideInApp>
            <button style={{ ...S.btn, fontSize: 16 }} onClick={() => { window.location.href = '/pricing'; }}>Upgrade to Pro — $29.99/mo</button>
            </HideInApp>
          </div>
        ) : (
          <>
            {/* Mode toggle */}
            <div style={S.toggle}>
              <button style={S.tab(mode === "single")} onClick={() => setMode("single")}>Single Escort</button>
              <button style={S.tab(mode === "fleet")} onClick={() => setMode("fleet")}>Fleet Manager</button>
            </div>

            {mode === "single" && (
              <div>
                <p style={{ color: "#aaa", marginBottom: 16, fontSize: 14 }}>Enter your current location to find return loads heading your way.</p>
                <input
                  style={S.input}
                  placeholder="City, State (e.g. Dallas, TX)"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && runSingleSearch()}
                />
                <button style={S.btn} onClick={runSingleSearch} disabled={searching}>
                  {searching ? "Searching..." : "Find Return Loads"}
                </button>
                {error && <p style={{ color: "#ff6600", marginTop: 12, fontSize: 14 }}>{error}</p>}
                {results.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <p style={{ color: "#888", fontSize: 13, marginBottom: 12 }}>{results.length} loads found near your location</p>
                    {results.map((load: any, i: number) => (
                      <div key={i} style={S.resultCard}>
                        <p style={{ margin: 0, fontWeight: 700 }}>{load.pu_city}, {load.pu_state} → {load.dl_city}, {load.dl_state}</p>
                        {load.per_mile_rate != null && <p style={{ color: "#00a8e8", margin: "4px 0 0", fontSize: 13 }}>${load.per_mile_rate}/mi</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mode === "fleet" && (
              <div>
                <p style={{ color: "#aaa", marginBottom: 4, fontSize: 14 }}>Add unlimited escort slots with Fleet Pro. Results show matching loads near each escort's location separately.</p>
                <p style={{ color: "#666", fontSize: 12, marginBottom: 16 }}>⚠️ Fleet Manager can share load links with escorts but cannot auto-match on their behalf. Escorts must confirm from their own account. Rate limit: 3 searches/hr.</p>
                {escorts.map((escort, i) => (
                  <div key={i} style={S.slotCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>Escort {i + 1}</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <label style={{ fontSize: 13, color: "#aaa", display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
                          <input type="checkbox" checked={escort.available} onChange={e => updateEscort(i, "available", e.target.checked)} />
                          Available
                        </label>
                        {escorts.length > 1 && (
                          <button style={{ ...S.shareBtn, border: "none", color: "#ff4444" }} onClick={() => removeEscort(i)}>Remove</button>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <input style={S.input} placeholder="Name" value={escort.name} onChange={e => updateEscort(i, "name", e.target.value)} />
                      <input style={S.input} placeholder="Phone" value={escort.phone} onChange={e => updateEscort(i, "phone", e.target.value)} />
                      <input style={S.input} placeholder="City" value={escort.city} onChange={e => updateEscort(i, "city", e.target.value)} />
                      <input style={S.input} placeholder="State" value={escort.state} onChange={e => updateEscort(i, "state", e.target.value)} />
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  {escorts.length < 5 && (
                    <button style={{ ...S.shareBtn, padding: "8px 16px" }} onClick={addEscort}>+ Add Escort Slot</button>
                  )}
                  <button style={S.btn} onClick={runFleetSearch} disabled={searching}>
                    {searching ? "Searching..." : "Run Fleet Search"}
                  </button>
                </div>
                {rateLimitMsg && <p style={{ color: "#ff6600", marginBottom: 12, fontSize: 14 }}>⏳ {rateLimitMsg}</p>}
                {error && <p style={{ color: "#ff4444", marginBottom: 12, fontSize: 14 }}>{error}</p>}
                {fleetResults.map((group: any, i: number) => (
                  <div key={i} style={{ marginBottom: 20 }}>
                    <h3 style={{ color: "#ff6600", fontSize: 15, marginBottom: 10 }}>
                      {group.escort.name || `Escort ${i + 1}`} — {group.escort.city}, {group.escort.state}
                    </h3>
                    {group.loads.length === 0 ? (
                      <p style={{ color: "#666", fontSize: 13 }}>No loads found near this location.</p>
                    ) : (
                      group.loads.map((load: any, j: number) => (
                        <div key={j} style={S.resultCard}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{load.pu_city}, {load.pu_state} → {load.dl_city}, {load.dl_state}</p>
                          {load.per_mile_rate != null && <p style={{ color: "#00a8e8", margin: "4px 0 0", fontSize: 13 }}>${load.per_mile_rate}/mi</p>}
                          <button style={S.shareBtn} onClick={() => {
                            const link = `${window.location.origin}/loads/${load.id}`
                            navigator.clipboard?.writeText(link).then(() => alert("Load link copied! Share with " + (group.escort.name || "escort") + " so they can confirm from their account."))
                          }}>📋 Copy Load Link to Share</button>
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function DotLookupPage({ setPage }: any) { return <Stub title="FMCSA DOT Carrier Lookup" icon="🔍" desc="Look up any carrier by DOT number. See safety rating, insurance status, inspection history, and out-of-service rate." back="tools" setPage={setPage} />; }
function StateReqsPage({ setPage }: any) { return <Stub title="State Escort Requirements" icon="🗺️" desc="Enter load dimensions and route to see escort requirements per state — number of escorts, cert requirements, travel restrictions." back="tools" setPage={setPage} />; }
function WeatherPage({ setPage }: any) { return <Stub title="Weather Alerts" icon="⛅" desc="Check weather and alerts along your route. Critical for wide loads — wind advisories, winter storms, visibility warnings." back="tools" setPage={setPage} />; }
function FuelCalcPage({ setPage }: any) { return <Stub title="Fuel Cost Estimator" icon="⛽" desc="Estimate trip fuel cost with current diesel prices. Enter miles and MPG to see what the job really costs." back="tools" setPage={setPage} />; }
function PerDiemPage({ setPage }: any) { return <Stub title="Per Diem Calculator" icon="💰" desc="IRS standard per diem rate for transportation workers is $69/day (80% deductible). Calculate your annual tax deduction." back="tools" setPage={setPage} />; }
function CertTrackerPage({ setPage, profile }: any) { return <Stub title="Cert Expiry Tracker" icon="🏅" desc="Track all your cert expiry dates. Never lose a job because of an expired cert." back="tools" setPage={setPage} />; }
function FactoringPage({ setPage }: any) { return <Stub title="Invoice Factoring" icon="💳" desc="Get paid within 24 hours. We are finalizing partnerships with RTS Financial, Triumph Business Capital, and OTR Solutions." back="tools" setPage={setPage} />; }

// ─── CB RADIO (has real content) ──────────────────────────────────────────────
function CbRadioPage({ setPage }: any) {
  const ch = [
    { n: "19", d: "Highway primary — national truckers channel" },
    { n: "9", d: "Emergency — national emergency channel" },
    { n: "17", d: "Highway alternate — west of Mississippi" },
    { n: "14", d: "Oversize convoy coordination (common)" },
    { n: "21", d: "Some states DOT communications" },
    { n: "1", d: "Convoy lead-rear communication (common)" },
  ];
  return (
    <div className="section">
      <button className="btn btn-ghost btn-sm" onClick={() => setPage("tools")} style={{ marginBottom: 20 }}>← Back to Tools</button>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 32 }}>📻</span>
        <div><h1 className="bb" style={{ fontSize: 22 }}>CB Radio Reference</h1><p className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>STANDARD CHANNELS · OVERSIZE CONVOY GUIDE</p></div>
      </div>
      <div className="card">
        {ch.map((x, i) => (
          <div key={x.n} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: i < ch.length - 1 ? "1px solid var(--l1)" : "none" }}>
            <div style={{ background: "var(--or)", color: "#000", fontWeight: 900, fontSize: 18, width: 46, height: 46, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{x.n}</div>
            <span style={{ fontSize: 13 }}>{x.d}</span>
          </div>
        ))}
      </div>
      <p className="mo" style={{ fontSize: 9, color: "var(--t3)", marginTop: 12 }}>More channels and state-specific references coming soon. Verify local channel usage with your carrier before each load.</p>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPage({ setPage, user, profile }: any) {
  // BGC_ADMIN_HOOK
  const [bgcQueue, setBgcQueue] = useState<any[]>([])
  const [bgcTab, setBgcTab] = useState(false)
    const [adminStats, setAdminStats] = useState<Record<string,number>>({});
  async function fetchBgcQueue() {
    // the review rows (with their private document links) come from the server, after the admin check
    try {
      const d = await fetch('/api/admin/cert-queue').then(r => r.json())
      setBgcQueue((d.bgc || []).map((r: any) => ({ id: r.user_id, full_name: r.profiles?.full_name, email: r.profiles?.email, bgc_document_url: r.document_url })))
    } catch { setBgcQueue([]) }
  }

    async function fetchAdminStats() {
        const [u, m, p, l] = await Promise.all([
              supabase.from('profiles').select('id', { count: 'exact', head: true }),
                    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('tier', 'member'),
                          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('tier', 'pro'),
                                supabase.from('loads').select('id', { count: 'exact', head: true }),
                                    ]);
                                        setAdminStats({ users: u.count || 0, members: m.count || 0, pro: p.count || 0, loads: l.count || 0 });
                                          }
  async function approveBgc(userId: string) {
    // Prefer cert API so certifications + profile stay in sync; fall back to set-user.
    const { data: certs } = await supabase.from('certifications').select('id').eq('user_id', userId).eq('type', 'bgc').eq('status', 'pending')
    if (certs && certs.length > 0) {
      for (const c of certs) {
        await fetch('/api/bgc/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cert_id: c.id }) })
      }
    } else {
      await fetch('/api/admin/set-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, bgc_verified: true }) })
      await supabase.from('profiles').update({ bgc_pending: false }).eq('id', userId)
    }
    try { await fetch('/api/sms/bgc-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, status: 'approved' }) }) } catch {}
    fetchBgcQueue()
  }
  async function denyBgc(userId: string) {
    const { data: certs } = await supabase.from('certifications').select('id').eq('user_id', userId).eq('type', 'bgc').eq('status', 'pending')
    if (certs && certs.length > 0) {
      for (const c of certs) {
        await fetch('/api/bgc/reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cert_id: c.id }) })
      }
    } else {
      await supabase.from('profiles').update({ bgc_pending: false }).eq('id', userId)
    }
    try { await fetch('/api/sms/bgc-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, status: 'denied' }) }) } catch {}
    fetchBgcQueue()
  }
  useEffect(() => { fetchBgcQueue(); fetchAdminStats(); }, [])

  if (!user || profile?.role !== "admin") {
    return (
      <div className="section" style={{ textAlign: "center", paddingTop: 80 }}>
        <span style={{ fontSize: 48 }}>🔒</span>
        <h2 className="bb" style={{ fontSize: 20, marginTop: 16 }}>Admin Access Only</h2>
        <p style={{ color: "var(--t2)", marginTop: 8 }}>This area is restricted to platform administrators.</p>
        <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={() => setPage("home")}>← Go Home</button>
      </div>
    );
  }
  return (
    <div className="section">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 28 }}>⚙️</span>
        <div><h1 className="bb" style={{ fontSize: 22 }}>Admin Panel</h1><p className="mo" style={{ fontSize: 10, color: "var(--or)" }}>BRIAN AHMED · PLATFORM ADMINISTRATOR</p></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[["👥","Total Users",String(adminStats.users||0),"var(--am)"],["✅","Members",String(adminStats.members||0),"var(--gr)"],["⭐","Pro Members",String(adminStats.pro||0),"var(--or)"],["💰","MRR","$0","var(--am)"],["🔍","BGC Pending","0","var(--or)"],["📋","Certs Pending","0","var(--or)"]].map(([icon,label,val,color]) => (
          <div key={label as string} className="card" style={{ padding: 18, textAlign: "center" }}>
            <div style={{ fontSize: 22 }}>{icon}</div>
            <div className="bb" style={{ fontSize: 22, color: color as string, marginTop: 6 }}>{val}</div>
            <div className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <a href="/admin" className="btn btn-am btn-sm" style={{ fontSize: 11, textDecoration: 'none' }}>Open Full Admin →</a>
      </div>
      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <p style={{ color: "var(--t2)", fontSize: 13 }}>Quick BGC queue below. For users, certs, loads, and revenue use the full admin panel.</p>
        <div style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 8, padding: "14px 24px", marginTop: 20, display: "inline-block" }}>
          <span className="mo" style={{ fontSize: 10, color: "var(--or)" }}>QUICK BGC QUEUE</span>
        {/* BGC QUEUE */}
        <div style={{ marginTop: 24 }}>
        <div className="bb" style={{ fontSize: 15, marginBottom: 12, cursor: 'pointer' }} onClick={() => { setBgcTab(!bgcTab); fetchBgcQueue() }}>📋 BGC Submissions {bgcTab ? '▲' : '▼'}</div>
        {bgcTab && (bgcQueue.length === 0 ? (
        <p className="mo" style={{ fontSize: 11, color: 'var(--t2)' }}>No pending BGC submissions.</p>
        ) : bgcQueue.map(p => (
        <div key={p.id} className="card" style={{ padding: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
        <div className="mo" style={{ fontSize: 12, fontWeight: 600 }}>{p.full_name || p.email}</div>
        <a href={p.bgc_document_url} target="_blank" className="mo" style={{ fontSize: 10, color: 'var(--bl)' }}>View Document ↗</a>
        </div>
        <button className="btn btn-am btn-sm" onClick={() => approveBgc(p.id)}>✓ Approve</button>
        <button className="btn btn-sm" style={{ background: 'var(--rd)', color: '#fff' }} onClick={() => denyBgc(p.id)}>✕ Deny</button>
        </div>
        )))}
        </div>
        </div>
      </div>
    </div>
  );
}


// ─── COMING SOON STUB ─────────────────────────────────────────────────────────

function AvailabilityBoard({ setPage, profile }: { setPage: (p: Page) => void; profile: Profile | null }) {
  const [avails, setAvails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('escort_availability')
        .select('*, profiles!escort_id(full_name, company_name, states_licensed, vehicle, rating, total_jobs, is_available)')
        .order('created_at', { ascending: false });
      setAvails((data || []).filter((a: any) => a.profiles?.is_available !== false));
      setLoading(false);
    }
    load();
  }, []);
  if (profile?.role !== 'carrier' && profile?.role !== 'fleet_manager' && profile?.role !== 'admin') {
    return (<div style={{ padding: '40px 24px', textAlign: 'center' }}><div className="bb" style={{ fontSize: 20, marginBottom: 12 }}>Available Escorts</div><p className="mo" style={{ fontSize: 12, color: 'var(--t2)' }}>This board is for carriers and fleet managers.</p><button className="btn btn-am btn-sm" style={{ marginTop: 16 }} onClick={() => setPage('home')}>Go Home</button></div>);
  }
  return (
    <div style={{ padding: '20px 16px', maxWidth: 700, margin: '0 auto' }}>
      <div className="bb" style={{ fontSize: 24, marginBottom: 8 }}>Availability Board</div>
      <p className="mo" style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 20 }}>Escorts currently marked available in your area.</p>
      {loading ? (<div style={{ textAlign: 'center', padding: 40, color: 'var(--t2)' }}>Loading...</div>) : avails.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--t2)' }}>No escorts currently available.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {avails.map((a: any) => (
            <div key={a.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{a.profiles?.full_name || 'Escort'}</div>
                  <div className="mo" style={{ fontSize: 10, color: 'var(--t2)' }}>{a.profiles?.company_name || ''}</div>
                </div>
                <span className="chip ch-gr" style={{ fontSize: 9 }}>Available</span>
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(a.profiles?.states_licensed || []).slice(0, 5).map((s: string) => (<span key={s} className="chip ch-dim" style={{ fontSize: 9 }}>{s}</span>))}
                {(a.profiles?.cert_types || []).slice(0, 3).map((c: string) => (<span key={c} className="chip ch-dim" style={{ fontSize: 9 }}>{c}</span>))}
              </div>
              <div className="mo" style={{ fontSize: 10, color: 'var(--t2)', marginTop: 6 }}>
                {a.profiles?.vehicle || 'Vehicle not specified'} - Rating: {(a.profiles?.rating || 0).toFixed(1)} - {a.profiles?.total_jobs || 0} jobs
              </div>
              {a.notes && <div className="mo" style={{ fontSize: 10, color: 'var(--t2)', marginTop: 4, fontStyle: 'italic' }}>{a.notes}</div>}
            </div>
          ))}
        </div>
      )}
      <button className="btn btn-ghost btn-sm" style={{ marginTop: 20 }} onClick={() => setPage('home')}>Back</button>
    </div>
  );
}
export default function OEHPlatform() {
  const [page, setPage] = useState<Page>("home");
  const [signinMode, setSigninMode] = useState<"signup" | "signin">("signup");
  const [pendingRole, setPendingRole] = useState<"escort"|"carrier"|"broker"|null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileOverride, setProfileOverride] = useState<Profile | null>(null);
  const activeProfile = profileOverride || profile;
  const [toast, setToast] = useState<{ msg: string; type: "gr" | "rd" | "am" } | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [reviewPrompt, setReviewPrompt] = useState<{loadId:string,targetName:string,targetId:string}|null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
    
  function showToast(msg: string, type: "gr" | "rd" | "am") {
    setToast({ msg, type });
  }

  async function loadProfile(userId: string) {
    const res = await fetch('/api/profile/me')
    const body = await res.json().catch(() => ({}))
    const data = res.ok ? body.profile : null
    if (data) { setProfile(withFreeLaunch(data) as Profile); loadUnreadCount(userId, (data as Profile).role); }
  }
  async function loadUnreadCount(userId: string, role: string) {
    if (role === 'escort') {
      // Loads this escort has been confirmed on (carrier accepted -> filled).
      const { count } = await supabase.from('loads').select('id', { count: 'exact', head: true }).eq('matched_escort_id', userId).eq('status', 'filled');
      setUnreadCount(count || 0);
    } else if (role === 'carrier') {
      // This carrier's loads awaiting accept/decline.
      const { count } = await supabase.from('loads').select('id', { count: 'exact', head: true }).eq('carrier_id', userId).eq('status', 'pending_match');
      setUnreadCount(count || 0);
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null);
      if (user) loadProfile(user.id);
      setLoadingAuth(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setPage("home");
    showToast("Signed out successfully", "gr");
  }


  return (
    <>
      <style>{CSS}</style>
      <Ticker />
      <PushInit userId={user?.id} />
      <Nav page={page} setPage={setPage} user={user} profile={profile} onSignOut={handleSignOut} unreadCount={unreadCount} setSigninMode={setSigninMode} profileOverride={profileOverride} setProfileOverride={setProfileOverride} />
      {page === "home" && <HomePage setPage={setPage} user={user} profile={activeProfile} setSigninMode={setSigninMode} setPendingRole={setPendingRole} />}
      {page === "signin" && <SignInPage setPage={setPage} showToast={showToast} initialMode={signinMode} initialRole={pendingRole ?? "escort"} />}
      
                    {page === "home" && (<>
{/* MEMBER PERKS SECTION - desktop only */}
          <div className="hidden md:block" style={{ background: "var(--bg2,#0a0a0a)", padding: "60px 0", borderTop: "1px solid var(--l1,#222)", borderBottom: "1px solid var(--l1,#222)" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
              <div style={{ textAlign: "center", marginBottom: 36 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--or,#f60)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>MEMBER PERKS — BUILT FOR THE ROAD</p>
                <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Benefits That Travel With You</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                {/* Upside */}
                <div style={{ background: "var(--card,#111)", border: "1px solid var(--l1,#222)", borderLeft: "3px solid var(--or,#f60)", borderRadius: 10, padding: 28 }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>⛽</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Save on Every Fill-Up</div>
                  <p style={{ fontSize: 12, color: "var(--t2,#888)", lineHeight: 1.7, marginBottom: 16 }}>
                    OEH members earn real cash back on fuel through Upside. The average escort saves $600+/year just by activating their free account.
                  </p>
                  <a href="https://upside.app.link/9WR232" target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-block", background: "var(--or,#f60)", color: "#000", fontWeight: 700, fontSize: 12, padding: "10px 20px", borderRadius: 6, textDecoration: "none" }}>
                    Activate Fuel Savings →
                  </a>
                
              {/* Evergreen Certification Partner */}
              <div style={{ background: "var(--card,#111)", border: "1px solid var(--l1,#222)", borderLeft: "3px solid #4ade80", borderRadius: 10, padding: 28 }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🎓</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Get Certified — Save 5%</div>
                <p style={{ fontSize: 12, color: "var(--t2,#888)", lineHeight: 1.7, marginBottom: 16 }}>
                  P/EVO, WITPAC, Flagger, and TCS certs from Evergreen Safety Council, which OEH is a member of (not endorsed by Evergreen). Member &amp; Pro subscribers save 5%.
                </p>
                <a href="/getting-started" style={{ display: "inline-block", background: "#4ade80", color: "#000", fontWeight: 700, fontSize: 12, padding: "10px 20px", borderRadius: 6, textDecoration: "none" }}>
                  Learn More →
                </a>
              </div>
              </div>
                {/* Factoring - Coming Soon */}
                <div style={{ background: "var(--card,#111)", border: "1px solid var(--l1,#222)", borderLeft: "3px solid #444", borderRadius: 10, padding: 28, opacity: 0.6 }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>💸</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Get Paid Faster</div>
                  <p style={{ fontSize: 12, color: "var(--t2,#888)", lineHeight: 1.7, marginBottom: 16 }}>
                    Factoring partnerships coming soon — Triumph Business Capital, OTR Solutions, and more.
                  </p>
                  <span style={{ fontSize: 11, color: "#666", fontWeight: 600, background: "#1a1a1a", padding: "6px 12px", borderRadius: 4 }}>COMING SOON</span>
                </div>
                {/* Permit Tools - Coming Soon */}
                <div style={{ background: "var(--card,#111)", border: "1px solid var(--l1,#222)", borderLeft: "3px solid #444", borderRadius: 10, padding: 28, opacity: 0.6 }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>📋</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Permit Management</div>
                  <p style={{ fontSize: 12, color: "var(--t2,#888)", lineHeight: 1.7, marginBottom: 16 }}>
                    Streamlined permit management tools for oversize routes — powered by Oversize.io.
                  </p>
                  <span style={{ fontSize: 11, color: "#666", fontWeight: 600, background: "#1a1a1a", padding: "6px 12px", borderRadius: 4 }}>COMING SOON</span>
                </div>
              </div>
            </div>
          </div>
          </>
          )}
      {page === "verification" && (VERIFICATION_LIVE ? <VerificationPage /> : <div className="card" style={{ margin: 24 }}>Badges and document checks are not live. We do not check or vouch for people or documents. <a href="/coming-later">What is not live</a></div>)}
      {page === "escorts" && <EscortsPage setPage={setPage} />}
      {page === "escprofile" && <EscProfilePage setPage={setPage} />}
      {page === "postload" && <PostLoadPage setPage={setPage} user={user} profile={activeProfile} showToast={showToast} />}
        {page === "dashboard-c" && <CarrierDashPage setPage={setPage} user={user} profile={activeProfile} showToast={showToast} />}
        {page === "dashboard-e" && <EscortDashPage setPage={setPage} profile={activeProfile} showToast={showToast} />}
        {page === "admin" && <AdminPage setPage={setPage} user={user} profile={activeProfile} />}
              {page === "available" && <AvailabilityBoard setPage={setPage} profile={activeProfile} />}
      <Footer setPage={setPage} signedIn={!!user} />
      {reviewPrompt && (<div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}><div className="card" style={{ maxWidth:440, width:'100%', padding:28 }}><div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>⭐ How was your experience?</div><div style={{ fontSize:13, color:'var(--t2)', marginBottom:16 }}>Leave a review for {reviewPrompt.targetName}</div><div style={{ display:'flex', gap:8, marginBottom:16 }}>{[1,2,3,4,5].map(n => (<button key={n} onClick={() => setReviewRating(n)} style={{ fontSize:24, background:'none', border:'none', cursor:'pointer', opacity: n <= reviewRating ? 1 : 0.3 }}>⭐</button>))}</div><textarea value={reviewText} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewText(e.target.value)} placeholder="Optional written review (500 chars max)" maxLength={500} style={{ width:'100%', minHeight:80, padding:10, borderRadius:6, border:'1px solid var(--l2)', background:'var(--bg)', color:'var(--t1)', fontSize:13, resize:'vertical', marginBottom:16 }} /><div style={{ display:'flex', gap:10 }}><button className="btn btn-or" disabled={reviewSubmitting} onClick={async () => { setReviewSubmitting(true); const __revRes = await fetch('/api/reviews', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ loadId: reviewPrompt.loadId, targetUserId: reviewPrompt.targetId, rating: reviewRating, comment: reviewText }) }); setReviewSubmitting(false); if (!__revRes.ok) { const __d = await __revRes.json().catch(() => ({})); showToast(__d.error || 'Could not submit review', 'rd'); return; } setReviewPrompt(null); setReviewRating(5); setReviewText(''); showToast('Thanks for your review!', 'gr') }}>{reviewSubmitting ? 'Submitting…' : 'Submit Review'}</button><button className="btn" onClick={() => setReviewPrompt(null)}>Skip</button></div></div></div>)}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
