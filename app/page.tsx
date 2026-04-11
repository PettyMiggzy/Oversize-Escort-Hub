"use client";
import PushInit from './components/PushInit'
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Role = "carrier" | "escort" | "broker" | "admin" | "fleet_manager" | null;
type Page = "home" | "flatboard" | "openboard" | "bidboard" | "escorts" | "escprofile" | "dashboard-e" | "dashboard-c" | "dashboard-b" | "postload" | "pricing" | "verification" | "signin" | "invoice" | "expenses" | "job-history" | "permits" | "deadhead" | "admin" | "dot-lookup" | "state-reqs" | "weather" | "cb-radio" | "fuel-calc" | "per-diem" | "cert-tracker" | "factoring" | "tools";

type Profile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  role: "escort" | "carrier" | "admin" | "fleet_manager";
  tier: "free" | "member" | "pro" | "carrier_member";
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
  board_type: "flat" | "bid" | "open";
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
  isSample?: boolean;
};

// ─── SEED DATA (shown until real loads exist) ────────────────────────────────

const SEED_LOADS: Load[] = [
  { id: "seed-1", created_at: new Date().toISOString(), carrier_id: "seed", board_type: "flat", pu_city: "Jacksonville", pu_state: "FL", dl_city: "Montgomery", dl_state: "AL", miles: 344, position: "Lead", pay_type: "FastPay", status: "open", per_mile_rate: 2.00, day_rate: 500, overnight_fee: 100, no_go_fee: 250, requires_p_evo: true, requires_witpac: false, requires_ny_cert: false, requires_twic: false, notes: null, start_date: null, poster_company: "Sunshine State Oversize", poster_rating: 4.8, poster_jobs: 47, isSample: true },
  { id: "seed-2", created_at: new Date().toISOString(), carrier_id: "seed", board_type: "flat", pu_city: "Houston", pu_state: "TX", dl_city: "Oklahoma City", dl_state: "OK", miles: 488, position: "Rear", pay_type: "7-Day", status: "open", per_mile_rate: 2.00, day_rate: 500, overnight_fee: 100, no_go_fee: 250, requires_p_evo: true, requires_witpac: false, requires_ny_cert: false, requires_twic: false, notes: null, start_date: null, poster_company: "Gulf Coast Transport LLC", poster_rating: 4.6, poster_jobs: 112, isSample: true },
  { id: "seed-3", created_at: new Date().toISOString(), carrier_id: "seed", board_type: "flat", pu_city: "Bakersfield", pu_state: "CA", dl_city: "Las Vegas", dl_state: "NV", miles: 280, position: "Lead+Rear", pay_type: "10-Day", status: "open", per_mile_rate: 2.00, day_rate: 500, overnight_fee: 100, no_go_fee: 250, requires_p_evo: true, requires_witpac: true, requires_ny_cert: false, requires_twic: false, notes: null, start_date: null, poster_company: "Desert Wind Transport", poster_rating: 4.7, poster_jobs: 83, isSample: true },
];

const SEED_BID_LOADS = [
  { id: "BID-771", from: "Dallas, TX", to: "Memphis, TN", mi: 473, rate: 2.00, pos: "Lead", certs: ["P/EVO"], score: 4.7, bids: 3, timer: 187, status: "live", isSample: true },
  { id: "BID-664", from: "Phoenix, AZ", to: "Albuquerque, NM", mi: 467, rate: 2.00, pos: "Lead", certs: ["P/EVO", "Witpac"], score: 4.8, bids: 1, timer: 44, status: "live", isSample: true },
];

const SEED_ESCORTS = [
  { id: "e1", name: "Marcus T.", co: "Thompson Escort Services", loc: "Houston, TX", jobs: 284, rating: 4.97, rank: 1, region: "TX", resp: "< 2 min", rel: 98, badges: ["P/EVO Verified", "BGC", "Vehicle"], vehicle: "2021 Ford F-250", states: ["TX", "LA", "OK", "AR", "NM"], reviewCount: 271, proMember: true, isSample: true },
  { id: "e2", name: "Dale R.", co: "Desert State Pilot", loc: "Phoenix, AZ", jobs: 412, rating: 4.98, rank: 1, region: "SW", resp: "< 2 min", rel: 99, badges: ["P/EVO Verified", "BGC", "Vehicle"], vehicle: "2022 Ford F-350", states: ["AZ", "NM", "NV", "CA", "UT"], reviewCount: 398, proMember: true, isSample: true },
  { id: "e3", name: "Sarah M.", co: "Southeast Escort LLC", loc: "Atlanta, GA", jobs: 156, rating: 4.93, rank: 3, region: "SE", resp: "< 5 min", rel: 96, badges: ["P/EVO Verified", "Vehicle"], vehicle: "2020 Chevy Silverado", states: ["GA", "FL", "SC", "NC", "TN"], reviewCount: 149, proMember: false, isSample: true },
  { id: "e4", name: "Rick B.", co: "MidAmerica Pilot Car", loc: "Nashville, TN", jobs: 88, rating: 4.91, rank: 2, region: "MID", resp: "< 8 min", rel: 94, badges: ["P/EVO Verified", "Vehicle"], vehicle: "2019 Ford F-150", states: ["TN", "KY", "AL", "MS", "MO"], reviewCount: 84, proMember: false, isSample: true },
];

const TIERS = [
  { id: "trial", name: "Free Trial", price: 0, sub: "30 days · one per device", color: "#6e7a88", features: ["View load board (no contact info)", "Search escorts directory", "30-day limit", "No bidding · no alerts"], daily: null, popular: false, carrierPro: null },
  { id: "member", name: "Member", price: 19.99, sub: "per month", color: "#3d8ef8", features: ["Full bidding on all boards", "Email alerts on new loads", "60s after Pro on bid board", "In-platform messaging", "Multi-state load filters"], daily: 1.99, popular: false, carrierPro: null },
  { id: "pro", name: "Pro", price: 29.99, sub: "per month", color: "#f5a200", features: ["SMS instant on bid loads (60s head start)", "Deadhead Minimizer + return load feed", "I'm Available broadcast", "Deadhead calculator + savings dashboard", "Invoice generator", "First cert verification free"], daily: 4.99, popular: true, carrierPro: null },];

// ─── STYLES ──────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#06080a;--p1:#0f1318;--p2:#141a1f;--l1:#1c2229;--l2:#252d36;--or:#ff6200;--am:#f5a200;--gr:#00cc7a;--rd:#ff3535;--bl:#3d8ef8;--t1:#dce0e6;--t2:#6e7a88;--t3:#363f4a}
body{background:var(--bg);color:var(--t1);font-family:'Inter',system-ui,sans-serif;font-size:13px;line-height:1.6;min-height:100vh}
.bb{font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:.03em;text-transform:uppercase}
.mo{font-family:'DM Mono','Courier New',monospace}
a{color:inherit;text-decoration:none;cursor:pointer}
button{cursor:pointer;font-family:'Inter',system-ui,sans-serif}
input,select,textarea{font-family:'Inter',system-ui,sans-serif;background:var(--p2);border:1px solid var(--l2);color:var(--t1);padding:8px 12px;border-radius:3px;font-size:12px;outline:none}
input:focus,select:focus,textarea:focus{border-color:var(--or)}
table{width:100%;border-collapse:collapse}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes scrolltick{from{transform:translateX(0)}to{transform:translateX(-50%)}}

.ticker{color:#ffffff;height:28px;background:#030507;border-bottom:1px solid var(--l1);overflow:hidden;display:flex;align-items:center}
.ticker-track{display:flex;animation:scrolltick 90s linear infinite;white-space:nowrap}
.tick-item{display:inline-flex;align-items:center;gap:8px;padding:0 28px;border-right:1px solid var(--l1);height:28px;font-family:'DM Mono',monospace;font-size:10px;color:#ffffff;letter-spacing:.05em}
.tick-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.dot-gr{background:var(--gr);box-shadow:0 0 5px var(--gr)}
.dot-am{background:var(--am);box-shadow:0 0 5px var(--am)}
.dot-or{background:var(--or)}

.nav{background:rgba(6,8,10,.98);border-bottom:1px solid var(--l1);height:56px;display:flex;align-items:center;padding:0 24px;gap:20px;position:sticky;top:0;z-index:100;backdrop-filter:blur(8px)}
.nav-name{font-family:'Bebas Neue',Impact,sans-serif;font-size:15px;letter-spacing:.08em;color:var(--t1)}
.nav-div{width:1px;height:28px;background:var(--l1)}
.nav-link{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--t2);padding:0 10px;height:56px;display:flex;align-items:center;background:none;border:none;border-bottom:2px solid transparent;transition:color .15s}
.nav-link:hover,.nav-link.active{color:var(--t1)}
.nav-link.active{border-bottom-color:var(--or)}
.nav-bid{color:var(--am)!important;background:rgba(245,162,0,.06);border-bottom-color:var(--am)!important}
.nav-bid::before{content:'';display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--am);box-shadow:0 0 6px var(--am);margin-right:7px;animation:pulse 1.4s infinite}
.nav-cta{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;background:var(--or);color:#000;border:none;padding:8px 16px;font-weight:700;margin-left:auto}
.nav-user{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.08em;color:var(--t2);display:flex;align-items:center;gap:8px;margin-left:auto}
.nav-signout{background:none;border:1px solid var(--l2);color:var(--t2);font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.1em;text-transform:uppercase;padding:5px 10px;border-radius:2px}
.nav-signout:hover{color:var(--rd);border-color:var(--rd)}

.bid-strip{background:var(--p2);border-bottom:1px solid var(--l1);padding:0 24px;height:44px;display:flex;align-items:center;gap:16px}
.bid-live{display:flex;align-items:center;gap:7px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:var(--am)}
.bid-live::before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--am);box-shadow:0 0 7px var(--am);animation:pulse 1.4s infinite}
.bid-cta{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;padding:7px 16px;background:rgba(245,162,0,.1);border:1px solid var(--am);color:var(--am);margin-left:auto;transition:background .15s}
.bid-cta:hover{background:rgba(245,162,0,.18)}

.hero{padding:56px 48px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden;border-bottom:1px solid var(--l1)}
.hero-carrier{background:var(--bg)}
.hero-carrier::before{content:'';position:absolute;inset:0;background-image:repeating-linear-gradient(0deg,transparent,transparent 39px,var(--l1) 39px,var(--l1) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,var(--l1) 39px,var(--l1) 40px);opacity:.22;pointer-events:none}
.hero-escort{background:var(--p1)}
.hero-escort::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 80% 50%,rgba(245,162,0,.04) 0%,transparent 70%);pointer-events:none}
.hero-inner{position:relative;z-index:1;max-width:680px}
.hero-tag{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.22em;text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:8px}
.hero-tag::before{content:'';display:inline-block;width:18px;height:1px}
.tag-or{color:var(--or)}.tag-or::before{background:var(--or)}
.tag-am{color:var(--am)}.tag-am::before{background:var(--am)}
.hero-hl{font-family:'Bebas Neue',Impact,sans-serif;font-size:64px;line-height:.92;letter-spacing:.02em;margin-bottom:18px}
.hero-sub{font-size:13px;color:var(--t2);line-height:1.85;max-width:520px;margin-bottom:16px}
.stat-row{display:flex;gap:0;margin-bottom:28px;max-width:480px}
.stat{flex:1;padding:12px 16px;background:var(--p2);border:1px solid var(--l1)}
.stat:first-child{border-radius:3px 0 0 3px}.stat:last-child{border-radius:0 3px 3px 0}
.stat-n{font-family:'Bebas Neue',Impact,sans-serif;font-size:26px;line-height:1;margin-bottom:2px}
.stat-l{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--t2)}

.btn{display:inline-flex;align-items:center;gap:8px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;padding:12px 22px;border:none;transition:opacity .15s}
.btn:hover{opacity:.85}
.btn:disabled{opacity:.4;cursor:not-allowed}
.btn-or{background:var(--or);color:#000}
.btn-am{background:var(--am);color:#000}
.btn-gr{background:var(--gr);color:#000}
.btn-ghost{background:transparent;color:var(--t2);border:1px solid var(--l2)}
.btn-ghost:hover{color:var(--t1);border-color:var(--t2)}
.btn-sm{padding:7px 14px;font-size:8px}
.btn-row{display:flex;gap:8px;flex-wrap:wrap}

.section{padding:52px 24px}
.section-header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:20px}
.eyebrow{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.2em;text-transform:uppercase;margin-bottom:6px}
.section-title{font-family:'Bebas Neue',Impact,sans-serif;font-size:32px;color:var(--t1);line-height:1.05}
.section-link{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--t2);background:none;border:none;display:flex;align-items:center;gap:5px}
.section-link::after{content:'→'}
.section-link:hover{color:var(--t1)}

.chip{display:inline-flex;align-items:center;gap:3px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;padding:2px 8px;border-radius:2px}
.ch-gr{background:rgba(0,204,122,.1);color:var(--gr);border:1px solid rgba(0,204,122,.2)}
.ch-am{background:rgba(245,162,0,.1);color:var(--am);border:1px solid rgba(245,162,0,.2)}
.ch-or{background:rgba(255,98,0,.1);color:var(--or);border:1px solid rgba(255,98,0,.18)}
.ch-bl{background:rgba(61,142,248,.1);color:var(--bl);border:1px solid rgba(61,142,248,.18)}
.ch-dim{background:var(--p2);color:var(--t2);border:1px solid var(--l1)}
.ch-rd{background:rgba(255,53,53,.1);color:var(--rd);border:1px solid rgba(255,53,53,.2)}
.ch-sample{background:rgba(245,162,0,.06);color:var(--am);border:1px solid rgba(245,162,0,.15);font-size:7px}

.data-table{border:1px solid var(--l1);border-radius:4px;overflow:hidden}
.data-table table{font-family:'DM Mono',monospace;font-size:11px}
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


.ps{display:inline-flex;align-items:center;gap:4px;font-family:'DM Mono',monospace;font-size:9px;padding:2px 7px;border-radius:2px}
.ps-hi{background:rgba(0,204,122,.1);color:var(--gr);border:1px solid rgba(0,204,122,.2)}
.ps-lo{background:rgba(245,162,0,.1);color:var(--am);border:1px solid rgba(245,162,0,.2)}
.ps-bad{background:rgba(255,53,53,.1);color:var(--rd);border:1px solid rgba(255,53,53,.2)}

.lock-bar{background:var(--p2);border:1px solid var(--l1);border-radius:3px;padding:10px 16px;display:flex;align-items:center;gap:12px;margin-top:10px;flex-wrap:wrap}
.card{background:var(--p1);border:1px solid var(--l1);border-radius:4px;padding:18px}
.card:hover{border-color:var(--l2)}

.bid-timer{font-family:'Bebas Neue',Impact,sans-serif;font-size:28px;line-height:1;letter-spacing:.04em}
.timer-red{color:var(--rd)}
.timer-am{color:var(--am)}

.dash-grid{display:grid;grid-template-columns:240px 1fr;gap:0;min-height:calc(100vh - 84px)}
.dash-nav{background:var(--p1);border-right:1px solid var(--l1);padding:20px 0}
.dash-nav-item{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--t2);padding:11px 20px;display:flex;align-items:center;gap:9px;cursor:pointer;transition:background .15s}
.dash-nav-item:hover,.dash-nav-item.active{background:rgba(255,255,255,.03);color:var(--t1)}
.dash-nav-item.active{border-right:2px solid var(--or)}
.dash-content{padding:32px 28px;background:var(--bg)}
.metric-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px}
.metric{background:var(--p2);border:1px solid var(--l1);border-radius:3px;padding:14px 16px}
.metric-n{font-family:'Bebas Neue',Impact,sans-serif;font-size:28px;line-height:1;margin-bottom:2px}
.metric-l{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--t2)}

.feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.feat-card{background:var(--p1);border:1px solid var(--l1);border-top:2px solid;border-radius:4px;padding:18px}
.feat-title{font-family:'Bebas Neue',Impact,sans-serif;font-size:18px;color:var(--t1);margin-bottom:7px;line-height:1.1}
.feat-body{font-size:12px;color:var(--t2);line-height:1.75}

.price-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.price-card{background:var(--p1);border:1px solid var(--l1);border-radius:4px;padding:20px;display:flex;flex-direction:column;gap:14px}
.price-card.popular{border-color:var(--am)}
.price-name{font-family:'Bebas Neue',Impact,sans-serif;font-size:22px;line-height:1}
.price-n{font-family:'Bebas Neue',Impact,sans-serif;font-size:38px;line-height:1}
.price-feat{font-family:'DM Mono',monospace;font-size:10px;color:var(--t2);display:flex;align-items:flex-start;gap:6px;line-height:1.5}
.price-feat::before{content:'✓';color:var(--gr);flex-shrink:0}

.verify-tier{background:var(--p1);border:1px solid var(--l1);border-left:3px solid;border-radius:4px;padding:18px 20px;display:flex;align-items:flex-start;gap:16px;margin-bottom:10px}

footer{background:var(--p1);border-top:1px solid var(--l1);padding:40px 24px 24px}
.footer-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:44px;margin-bottom:28px}
.footer-col h4{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--t2);margin-bottom:12px}
.footer-col a{display:block;font-size:12px;color:var(--t2);cursor:pointer;margin-bottom:8px}
.footer-col a:hover{color:var(--t1)}
.footer-bottom{display:flex;justify-content:space-between;padding-top:20px;border-top:1px solid var(--l1);font-family:'DM Mono',monospace;font-size:9px;color:var(--t3);letter-spacing:.06em}

.platform-div{background:var(--p2);border-bottom:1px solid var(--l1);border-top:1px solid var(--l1);padding:12px 24px;display:flex;align-items:center;gap:20px;flex-wrap:wrap}
.esc-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.ob-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}

.role-picker{min-height:calc(100vh - 84px);display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg);padding:40px 24px}
.role-card{background:var(--p1);border-radius:4px;padding:36px 28px;cursor:pointer;transition:background .15s;flex:1}
.role-card:hover{background:rgba(255,255,255,.03)}
.role-bar{background:var(--p2);border-bottom:1px solid var(--l1);padding:6px 24px;display:flex;align-items:center;gap:12px}

.form-label{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--t2);display:block;margin-bottom:6px}
.form-field{margin-bottom:16px}
.postload-wrap{max-width:780px;margin:0 auto;padding:40px 24px}
.signin-wrap{min-height:calc(100vh - 84px);display:flex;align-items:center;justify-content:center;background:var(--bg)}
.signin-box{background:var(--p1);border:1px solid var(--l1);border-radius:4px;padding:36px;width:100%;max-width:420px}

.toast{position:fixed;bottom:24px;right:24px;background:var(--p2);border:1px solid var(--l1);border-radius:4px;padding:12px 20px;font-family:'DM Mono',monospace;font-size:11px;z-index:999;display:flex;align-items:center;gap:10px;box-shadow:0 8px 32px rgba(0,0,0,.4)}
.toast-gr{border-left:3px solid var(--gr);color:var(--gr)}
.toast-rd{border-left:3px solid var(--rd);color:var(--rd)}
.toast-am{border-left:3px solid var(--am);color:var(--am)}

.early-banner{background:linear-gradient(135deg,rgba(245,162,0,.08),rgba(255,98,0,.06));border:1px solid rgba(245,162,0,.2);border-radius:4px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;gap:14px}

@media(max-width:900px){
  .price-grid{grid-template-columns:repeat(2,1fr)}
  .feat-grid{grid-template-columns:repeat(2,1fr)}
  .esc-grid{grid-template-columns:repeat(2,1fr)}
  .footer-grid{grid-template-columns:1fr 1fr}
  .dash-grid{grid-template-columns:1fr}
  .dash-nav{display:none}
  .ham-btn{display:flex;align-items:center;justify-content:center}
  .nav-links{display:none}
  .nav-right{gap:6px}
  .nav-get-started{font-size:9px;padding:7px 12px}
.ham-btn{display:none;background:none;border:none;cursor:pointer;padding:8px;color:var(--t1)}
.ham-btn span{display:block;width:22px;height:2px;background:var(--t1);margin:4px 0;transition:.3s}
.mobile-drawer{display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:999;background:rgba(0,0,0,.7)}
.mobile-drawer-inner{position:absolute;top:0;right:0;width:80%;max-width:300px;height:100%;background:var(--p1);border-left:1px solid var(--l1);overflow-y:auto;padding:20px 0}
.drawer-header{display:flex;align-items:center;justify-content:space-between;padding:0 20px 20px;border-bottom:1px solid var(--l1);margin-bottom:10px}
.drawer-close{background:none;border:none;color:var(--t1);font-size:24px;cursor:pointer;padding:4px}
.drawer-link{display:block;width:100%;text-align:left;background:none;border:none;color:var(--t2);font-family:"DM Mono",monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;padding:14px 20px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05)}
.drawer-link:hover,.drawer-link.active{color:var(--or);background:rgba(255,255,255,.03)}
.drawer-user{padding:16px 20px;border-top:1px solid var(--l1);margin-top:10px}
.drawer-signout{width:100%;margin-top:12px;background:none;border:1px solid var(--l2);color:var(--t2);font-family:"DM Mono",monospace;font-size:9px;letter-spacing:.1em;padding:10px;cursor:pointer;border-radius:2px}
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
    { dot: "dot-gr", text: "Platform launching · Be an early member · $2.00/mi standard rate" },
    { dot: "dot-am", text: "BID BOARD LIVE · 5-Min bids · Pro gets SMS instant · Member gets 60s delay" },
    { dot: "dot-gr", text: "Verified P/EVO escorts · Background checked · Vehicle verified · Admin approved" },
    { dot: "dot-or", text: "OPEN BID BOARD · 24-72h window · Post your pitch · Carrier picks the best fit" },
    { dot: "dot-gr", text: "Standard rates: $2.00/mi or $500/day · $100 overnight · $250 no-go fee" },
    { dot: "dot-am", text: "Deadhead Minimizer · Return loads near your drop · Stop driving home empty" },
    { dot: "dot-gr", text: "No commissions · No job fees · Ever · Flat subscription only" },
    { dot: "dot-or", text: "Carriers: Post loads free · Escorts: Find loads · Both: No middleman" },
    { dot: "dot-am", text: "• Fleet Manager Tools — Pro only · Manage up to 5 escorts · Find loads for your fleet" },
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

function Nav({ page, setPage, user, profile, onSignOut }: {
  page: Page; setPage: (p: Page) => void; user: User | null; profile: Profile | null; onSignOut: () => void
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navLinks: [Page, string][] = [
    ["flatboard", "Flat Rate"],
    ["openboard", "Open Loads"],
    ["bidboard", "Bid Board"],
    ["escorts", "Find Escorts"],
    ["postload", "Post a Load"],
    ["pricing", "Pricing"],
    ["verification", "Verification"],
  ];
  const closeDrawer = () => setDrawerOpen(false);
  return (
    <div className="nav">
      <div className="nav-name" style={{ cursor: "pointer" }} onClick={() => setPage("home")}>Oversize Escort Hub</div>
      {/* Desktop links */}
      <div className="nav-links" style={{ display: "flex", gap: 2, alignItems: "center" }}>
        {navLinks.map(([p, label]) => (
          <button key={p} className={`nav-link${page === p ? " active" : ""}`} onClick={() => setPage(p)}>{label}</button>
        ))}
      </div>
      {/* Desktop right */}
      <div className="nav-right" style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
        {user && profile ? (
          <span className="nav-user">
            <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:profile.avatar_url?"transparent":"#ff6600",color:"#fff",fontSize:10,fontWeight:700,marginRight:6,flexShrink:0,overflow:"hidden" }}>{profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /> : (profile.full_name||"?").split(" ").filter(Boolean).map(function(w){return w[0]}).join("").toUpperCase().slice(0,2)||"?"}</span>
            {profile.full_name || "there"}{" · "}
            <span style={{ color: "var(--or)", fontSize: 8 }}>{profile.tier?.toUpperCase()}</span>{" "}
            {profile?.role === "fleet_manager" && <button className="nav-signout" style={{ color:'#ff6600', borderColor:'#ff6600' }} onClick={() => { window.location.href = '/fleet-dashboard'; }}>FLEET DASHBOARD</button>}
            {profile?.role === "fleet_manager" && <button className="nav-signout" style={{ color:'#ff6600', borderColor:'#ff6600' }} onClick={() => { window.location.href = '/fleet-dashboard'; }}>FLEET DASHBOARD</button>} <button className="nav-signout" onClick={onSignOut}>SIGN OUT</button>
            <button className="nav-signout" style={{ marginLeft: 4 }} onClick={() => profile?.role === "fleet_manager" ? (window["location"]["href"] = "/fleet-dashboard") : setPage(profile.role === "carrier" ? "dashboard-c" : "dashboard-e")}>DASHBOARD →</button>
                  {profile?.role === 'admin' && (
                    <button className="nav-signout" style={{ marginLeft: 4 }} onClick={() => setPage('admin')}>Admin</button>
                  )}
          </span>
        ) : (
          <button className="nav-get-started btn btn-or btn-sm" onClick={() => setPage("signin")}>GET STARTED</button>
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
              <button key={p} className={`drawer-link${page === p ? " active" : ""}`} onClick={() => { setPage(p); closeDrawer(); }}>{label}</button>
            ))}
            <div className="drawer-user">
              {user && profile ? (
                <>
                  <div className="mo" style={{ fontSize: 9, color: "var(--t2)", marginBottom: 4 }}>Signed in as <strong style={{ color: "var(--t1)" }}>{profile.full_name}</strong></div>
                  <div className="mo" style={{ fontSize: 8, color: "var(--or)", marginBottom: 10 }}>{profile.tier?.toUpperCase()} · {profile.role?.toUpperCase()}</div>
                  <button className="drawer-link" onClick={() => { profile?.role === "fleet_manager" ? (window["location"]["href"] = "/fleet-dashboard") : setPage(profile.role === "carrier" ? "dashboard-c" : "dashboard-e"); closeDrawer(); }}>→ Dashboard</button>
                  {profile?.role === 'admin' && (
                    <button className="drawer-link" onClick={() => { setPage('admin'); closeDrawer(); }}>Admin</button>
                  )}
                  <button className="drawer-signout" onClick={() => { onSignOut(); closeDrawer(); }}>SIGN OUT</button>
                </>
              ) : (
                <button className="btn btn-or btn-sm" style={{ width: "100%" }} onClick={() => { setPage("signin"); closeDrawer(); }}>GET STARTED</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Footer({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <footer>
      <div className="footer-grid">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <img src="/logo.png" alt="OEH" style={{ width: 28, height: 28, objectFit: "contain" }} />
            <span className="bb" style={{ fontSize: 14, letterSpacing: ".06em" }}>Oversize Escort Hub</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.75, maxWidth: 230 }}>
            Verified marketplace for oversize carriers and P/EVO escorts. No commissions. No job fees. Ever.
          </p>
        </div>
        <div className="footer-col">
          <h4>Platform</h4>
          {[["flatboard", "Flat Rate Board"], ["bidboard", "5-Min Bid Board"], ["openboard", "Open Bid Board"], ["postload", "Post a Load"], ["escorts", "Find Escorts"]].map(([p, l]) => (
            <a key={p} onClick={() => setPage(p as Page)}>{l}</a>
          ))}
        </div>
        <div className="footer-col">
          <h4>Membership</h4>
          {[["pricing", "Pricing"], ["verification", "Verification"], ["signin", "Start Free Trial"], ["dashboard-e", "Escort Dashboard"], ["dashboard-c", "Carrier Dashboard"]].map(([p, l]) => (
            <a key={p} onClick={() => setPage(p as Page)}>{l}</a>
          ))}
        </div>
        <div className="footer-col">
          <h4>Company</h4>
          <a href="/about" style={{color:"var(--t2)"}}>About</a><a href="mailto:support@oversize-escort-hub.com" style={{color:"var(--t2)"}}>Contact</a><a href="/privacy" style={{color:"var(--t2)"}}>Privacy Policy</a><a href="/terms" style={{color:"var(--t2)"}}>Terms of Service</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2025 Precision Pilot Services LLC. All rights reserved.</span>
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
  return (
    <div className="lock-bar">
      <div>
        <div className="mo" style={{ fontSize: 12, color: "var(--t3)" }}>📞 (XXX) XXX-XXXX &nbsp;·&nbsp; 📧 xxxxxxx@xxxxxx.com &nbsp;·&nbsp; 🏢 [Company Hidden]</div>
        <div className="mo" style={{ fontSize: 10, color: "var(--t2)", marginTop: 3 }}>🔒 Member access required — contact info hidden from free accounts</div>
      </div>
      <button className="btn btn-or btn-sm" style={{ marginLeft: "auto" }} onClick={() => setPage("pricing")}>Upgrade to Member — $19.99/mo →</button>
    </div>
  );
}

function SampleBadge() {
  return <span className="chip ch-sample" style={{ marginLeft: 6 }}>SAMPLE</span>;
}

function EarlyBanner({ role }: { role: "carrier" | "escort" }) {
  return (
    <div className="early-banner">
      <div style={{ fontSize: 22 }}>🚀</div>
      <div>
        <div className="mo" style={{ fontSize: 10, color: "var(--am)", fontWeight: 600, marginBottom: 3 }}>
          {role === "carrier" ? "Be Among the First Carriers on the Platform" : "Be Among the First Escorts on the Platform"}
        </div>
        <div className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>
          {role === "carrier"
            ? "Sample loads shown below. Post the first real load in your region and get seen by every escort who joins."
            : "Sample data shown below. Early members get first access to every load posted. Lock in your spot now."}
        </div>
      </div>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────

function HomePage({ setPage, user, profile }: { setPage: (p: Page) => void; user: User | null; profile: Profile | null }) {
  const [role, setRole] = useState<Role>(null);
  // Scroll to top on mount
  useEffect(() => { window.scrollTo(0, 0); }, []);


  // If logged in, skip role picker and use their actual role
  useEffect(() => {
    if (profile) setRole(profile.role);
  }, [profile]);

  if (!role) {
    return (
      <div className="role-picker">
        <div className="bb" style={{ fontSize: 52, textAlign: "center", marginBottom: 6 }}>WHO ARE YOU?</div>
        <p className="mo" style={{ fontSize: 11, color: "var(--t2)", marginBottom: 48, letterSpacing: ".12em", textTransform: "uppercase" }}>Select your role to get started</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, width: "100%", maxWidth: 720 }}>
          <div className="role-card" style={{ border: "2px solid var(--or)" }} onClick={() => setRole("carrier")}>
            <div className="bb" style={{ fontSize: 34, color: "var(--or)", marginBottom: 10 }}>OVERSIZE CARRIER</div>
            <p style={{ fontSize: 11, color: "var(--t2)", lineHeight: 1.5, marginBottom: 16 }}>Carriers hauling oversize/overweight loads who need permits, escorts, and load boards.</p>
            <div className="mo" style={{ fontSize: 10, color: "var(--or)", letterSpacing: ".1em" }}>POST LOADS · BID BOARD · FIND ESCORTS</div>
          </div>
          <div className="role-card" style={{ border: "2px solid var(--am)" }} onClick={() => setRole("escort")}>
            <div className="bb" style={{ fontSize: 34, color: "var(--am)", marginBottom: 10 }}>PILOT CAR / P/EVO</div>
            <p style={{ fontSize: 11, color: "var(--t2)", lineHeight: 1.5, marginBottom: 16 }}>Pilot car operators and P/EVO escorts looking for loads, routes, and work opportunities.</p>
            <div className="mo" style={{ fontSize: 10, color: "var(--am)", letterSpacing: ".1em" }}>FIND LOADS · DEADHEAD MINIMIZER · BID</div>
          </div>
          <div className="role-card" style={{ border: "2px solid var(--t2)" }} onClick={() => setRole("broker")}>
            <div className="bb" style={{ fontSize: 34, color: "var(--t2)", marginBottom: 10 }}>FREIGHT BROKER</div>
            <p style={{ fontSize: 11, color: "var(--t2)", lineHeight: 1.5, marginBottom: 16 }}>Licensed freight brokers who need verified P/EVO escorts for oversize shipments.</p>
            <div className="mo" style={{ fontSize: 9, color: "var(--t2)", letterSpacing: ".1em" }}>POST LOADS · FIND ESCORTS · MANAGE SHIPMENTS</div>
          </div>
          <div className="role-card" style={{ border: "2px solid #3b82f6" }} onClick={() => setRole("fleet_manager")}>
            <div className="bb" style={{ fontSize: 34, color: "#3b82f6", marginBottom: 10 }}>FLEET MANAGER</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ background: "rgba(59,130,246,0.18)", color: "#3b82f6", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, letterSpacing: 1 }}>PRO REQUIRED</span>
            </div>
            <p style={{ lineHeight: 1.5, marginBottom: 16 }}>Manage multiple P/EVO escorts across loads. Find work for your fleet, track jobs, and maximize every mile.</p>
            <div className="mo" style={{ fontSize: 11, color: "var(--t2)", marginBottom: 20, letterSpacing: ".06em", lineHeight: 1.8 }}>FIND LOADS · FLEET DEADHEAD · MANAGE ESCORTS</div>
            <a href="/signin" className="mo" style={{ display: "inline-block", padding: "11px 18px", background: "#3b82f6", color: "#fff", borderRadius: 4, fontWeight: 700, fontSize: 10, letterSpacing: ".1em", textDecoration: "none" }}>GET STARTED</a>
          </div>
        </div>
        <button className="mo" style={{ marginTop: 28, background: "none", border: "none", color: "var(--t3)", fontSize: 10, letterSpacing: ".1em", cursor: "pointer" }} onClick={() => setRole("carrier")}>
          Browse as guest
        </button>
      </div>
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
          <div className="mo" style={{ fontSize: 10, color: "var(--t2)", flex: 1 }}>Loads close on timer · fill · or cancel — Pro SMS instant · Member 60s delay</div>
          <button className="bid-cta" onClick={() => setPage("bidboard")}>View Live Board →</button>
        </div>
        <div className="hero hero-carrier">
          <div className="hero-inner">
            <div className="hero-tag tag-or">For Oversize Carriers &amp; Owner Operators</div>
            <div className="hero-hl" style={{ color: "var(--or)" }}>STOP<br />OVERPAYING<br />FOR<br />ESCORTS.</div>
            <p className="hero-sub">On many runs, permits and escorts come straight out of your load revenue — <strong style={{ color: "var(--t1)" }}>overhead that adds up fast with no tools to control it.</strong> Until now.</p>
            <p className="hero-sub">Industry standard is $2.00/mi or $500/day. Carriers who bid smart and book direct <strong style={{ color: "var(--t1)" }}>keep more of every load.</strong></p>
            <div className="stat-row">
              <div className="stat"><div className="stat-n" style={{ color: "var(--or)" }}>$800+</div><div className="stat-l">Saved/Month (Top Users)</div></div>
              <div className="stat"><div className="stat-n" style={{ color: "var(--gr)" }}>Free</div><div className="stat-l">Always Post Loads</div></div>
              <div className="stat"><div className="stat-n" style={{ color: "var(--or)" }}>3×</div><div className="stat-l">FastPay Fill Speed</div></div>
            </div>
            <div className="btn-row">
              <button className="btn btn-or" onClick={() => setPage("postload")}>Post a Load Free →</button>
              <button className="btn btn-ghost" onClick={() => setPage("bidboard")}>See Bid Board</button>
            </div>
          </div>
        </div>
        <div className="platform-div">
          <span className="mo" style={{ fontSize: 9, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--t2)" }}>Platform</span>
          <span style={{ width: 1, height: 16, background: "var(--l1)" }} />
          <span className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>Three boards · Verified escorts · Real-time bidding · No commissions · No job fees · Ever</span>
          <span className="mo" style={{ marginLeft: "auto", fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--t2)" }}>$670M US Market · 50,000+ P/EVO Operators</span>
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
        <div className="mo" style={{ fontSize: 10, color: "var(--t2)", flex: 1 }}>Loads close on timer · fill · or cancel — Pro SMS instant · Member 60s delay</div>
        <button className="bid-cta" onClick={() => setPage("bidboard")}>View Live Board →</button>
      </div>
      <div className="hero hero-escort">
        <div className="hero-inner">
          <div className="hero-tag tag-am">For Pilot Car Escorts / P/EVO Operators</div>
          <div className="hero-hl" style={{ color: "var(--am)" }}>STOP<br />DRIVING<br />HOME<br />EMPTY.</div>
          <p className="hero-sub">The average P/EVO escort deadheads home after <strong style={{ color: "var(--t1)" }}>40% of runs.</strong> At $2.00/mi that&apos;s real revenue sitting on the table every single week.</p>
          <p className="hero-sub">Pro surfaces return loads near your drop, sorted toward home state first. <strong style={{ color: "var(--am)" }}>One recovered run at 150mi pays for a month of Pro.</strong></p>
          <div className="stat-row">
            <div className="stat"><div className="stat-n" style={{ color: "var(--am)" }}>$1,200</div><div className="stat-l">Recovered/Year</div></div>
            <div className="stat"><div className="stat-n" style={{ color: "var(--am)" }}>3×</div><div className="stat-l">ROI at $29.99/mo</div></div>
            <div className="stat"><div className="stat-n" style={{ color: "var(--gr)" }}>60s</div><div className="stat-l">Pro Head Start</div></div>
          </div>
          <div className="btn-row">
            <button className="btn btn-am" onClick={() => setPage("pricing")}>Go Pro — $29.99/mo →</button>
            <button className="btn btn-ghost" onClick={() => setPage("signin")}>Start Free Trial</button>
          </div>
        </div>
      </div>
      <div className="platform-div">
        <span className="mo" style={{ fontSize: 9, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--t2)" }}>Platform</span>
        <span style={{ width: 1, height: 16, background: "var(--l1)" }} />
        <span className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>Three boards · Verified escorts · Real-time bidding · No commissions · No job fees · Ever</span>
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
        .eq("board_type", "flat")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5);
      if (data && data.length > 0) {
        setLoads(data);
      } else {
        setLoads(SEED_LOADS.slice(0, 5));
      }
      setLoading(false);
    }
    fetchLoads();
  }, []);

  const hasSamples = loads.some(l => l.isSample);

  return (
    <div className="section" style={{ paddingBottom: 0 }}>
      <div className="section-header">
        <div>
          <div className="eyebrow" style={{ color: "var(--gr)" }}>{escortView ? "Available Loads" : "Live Board"}</div>
          <div className="section-title">FLAT RATE LOADS</div>
        </div>
        <button className="section-link" onClick={() => setPage("flatboard")}>View All Loads</button>
      </div>
      {hasSamples && <EarlyBanner role={escortView ? "escort" : "carrier"} />}
      {loading ? (
        <div className="mo" style={{ fontSize: 10, color: "var(--t2)", padding: "20px 0" }}>Loading loads...</div>
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
                    {l.isSample ? `SAMPLE-${l.id.slice(-3).toUpperCase()}` : l.id.slice(0, 8).toUpperCase()}
                    {l.isSample && <SampleBadge />}
                  </td>
                  <td style={{ fontWeight: 500, fontSize: 12 }}>{l.pu_city}, {l.pu_state} → {l.dl_city}, {l.dl_state}</td>
                  <td className="mo">{l.miles}</td>
                  <td className="mo" style={{ color: "var(--gr)", fontWeight: 600 }}>${l.per_mile_rate.toFixed(2)}/mi</td>
                  <td style={{ fontSize: 10 }}>{l.position}</td>
                  <td>{l.pay_type === "FastPay" ? <span className="chip ch-gr">⚡ FastPay</span> : <span className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>{l.pay_type}</span>}</td>
                  <td><PayScore score={l.poster_rating || 4.5} /></td>
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
          <div className="eyebrow" style={{ color: "var(--gr)" }}>Verified P/EVO Professionals</div>
          <div className="section-title">TOP RANKED ESCORTS</div>
        </div>
        <button className="section-link" onClick={() => setPage("escorts")}>View All</button>
      </div>
      <EarlyBanner role="carrier" />
      <div className="esc-grid">
        {SEED_ESCORTS.map((e) => <EscortCard key={e.id} e={e} setPage={setPage} />)}
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
              <button className="btn btn-am btn-sm" onClick={() => setPage("pricing")}>GO PRO →</button>
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
          { c: "var(--am)", t: "5-Min Bid Board", d: "Industry first. Closes on timer, carrier fills it, or carrier cancels. Pro gets SMS instantly, Members see it 60 seconds later." },
          { c: "var(--gr)", t: "Verified P/EVO Escorts", d: "4-tier trust ladder: P/EVO cert, vehicle verified, background check, admin verified. Fraudulent listings cannot exist here." },
          { c: "var(--am)", t: "Deadhead Minimizer", d: "Return load feed sorted toward home state. Pre-arrival SMS. I'm Available broadcast. Every empty mile is money left on the table." },
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

// ─── ESCORT CARD ──────────────────────────────────────────────────────────────

function EscortCard({ e, setPage }: { e: typeof SEED_ESCORTS[0]; setPage: (p: Page) => void }) {
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 1 }}>
            {e.name}
            {e.isSample && <SampleBadge />}
          </div>
          <div className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>{e.co}</div>
          <div className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>{e.loc}</div>
          <div className="mo" style={{ fontSize: 10, color: "var(--am)" }}>Resp: {e.resp} avg</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="bb" style={{ fontSize: 20, color: "var(--am)", lineHeight: 1 }}>#{e.rank} {e.region}</div>
          <div className="mo" style={{ fontSize: 8, color: "var(--t2)", letterSpacing: ".1em" }}>RANK</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const, marginBottom: 10 }}>
        {e.badges.slice(0, 3).map((b) => (
          <span key={b} className="chip ch-gr" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            {b === "P/EVO Verified" && <img src="/verified.png" alt="" style={{ width: 12, height: 12, objectFit: "contain" }} />}
            {b !== "P/EVO Verified" && "✓"} {b}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, padding: "9px 0", borderTop: "1px solid var(--l1)", borderBottom: "1px solid var(--l1)", marginBottom: 10 }}>
        {[{ n: e.jobs, l: "Jobs", c: undefined }, { n: e.rating, l: "Rating", c: "var(--gr)" }, { n: `${e.rel}%`, l: "Reliability", c: "var(--bl)" }].map((s) => (
          <div key={s.l} style={{ textAlign: "center" }}>
            <div className="bb" style={{ fontSize: 20, lineHeight: 1, color: s.c || "var(--t1)" }}>{s.n}</div>
            <div className="mo" style={{ fontSize: 8, color: "var(--t2)", letterSpacing: ".08em", textTransform: "uppercase" }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div className="mo" style={{ fontSize: 9, color: "var(--t2)", marginBottom: 10 }}>{e.vehicle}</div>
      <div style={{ display: "flex", gap: 6 }}>
        <button className="btn btn-or btn-sm" style={{ flex: 1, fontSize: 8 }} onClick={() => setPage("pricing")}>🔒 CONTACT (MEMBER)</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setPage("escprofile")}>Profile →</button>
      </div>
    </div>
  );
}

// ─── FLAT BOARD PAGE ──────────────────────────────────────────────────────────

// ——— FLAT RATE BOARD ————————————————————————————————————
function ExternalLoadCard({ el }: { el: any }) {
  const [expanded, setExpanded] = useState(false);
  const isRaw = el.pickup_city === 'See details' || el.pickup_state === 'N/A';
  return (
    <div className="load-card" style={{ borderLeft: '3px solid #555' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{isRaw ? (el.raw_title || 'External Load') : `${el.pickup_city}, ${el.pickup_state} → ${el.destination_city}, ${el.destination_state}`}</div>
          <span style={{ fontSize: 9, background: '#333', color: '#aaa', borderRadius: 3, padding: '2px 6px', fontWeight: 600 }}>EXTERNAL LOAD</span>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => setExpanded(x => !x)}>{expanded ? 'Hide ▲' : 'View Details ▼'}</button>
      </div>
      {expanded && (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--t2)', lineHeight: 1.7, borderTop: '1px solid var(--l1)', paddingTop: 10 }}>
          {isRaw && el.raw_text ? el.raw_text : `${el.pickup_city}, ${el.pickup_state} → ${el.destination_city}, ${el.destination_state}${el.rate ? ' · Rate: ' + el.rate : ''}${el.raw_text ? '\n' + el.raw_text : ''}`}
        </div>
      )}
    </div>
  );
}

function FlatBoardPage({ setPage, user, profile, showToast }: { setPage: (p: Page) => void; user: User | null; profile: Profile | null; showToast: (msg: string, type: 'gr' | 'rd' | 'am') => void }) {
  const [loads, setLoads] = useState<any[]>([])
  const [externalLoads, setExternalLoads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterState, setFilterState] = useState('')
  const [filterCert, setFilterCert] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [matchModal, setMatchModal] = useState<any>(null)
  const [matchLoading, setMatchLoading] = useState(false)

  useEffect(() => { fetchLoads() }, [filterState, filterCert, filterDate])

  async function fetchLoads() {
    setLoading(true)
    let q = supabase.from('loads').select('*').eq('board_type', 'flat').eq('status', 'active').order('created_at', { ascending: false })
    if (filterState) q = q.eq('pu_state', filterState)
    if (filterCert) q = q.contains('certs_required', [filterCert])
    if (filterDate) q = q.gte('start_date', filterDate)
    // Filter pro window
    const now = new Date().toISOString()
    if (!profile || profile.tier !== 'pro') {
      q = q.or(`pro_window_expires_at.is.null,pro_window_expires_at.lte.${now}`)
    }
    const { data } = await q.limit(50)
    setLoads(data || [])
    setLoading(false)
    // Fetch external loads
    const { data: extData } = await supabase.from('external_loads').select('*').eq('status','open').order('created_at',{ascending:false}).limit(20)
    setExternalLoads(extData || [])
  }

  async function handleRequestLoad(load: any) {
    if (!user) { showToast('Sign in to request loads', 'rd'); return }
    setMatchLoading(true)
    const { error: matchErr } = await supabase.from('load_matches').insert({
      load_id: load.id, escort_id: user.id, carrier_id: load.posted_by, status: 'pending'
    })
    if (matchErr) { showToast('Error submitting request: ' + matchErr.message, 'rd'); setMatchLoading(false); return }
    await supabase.from('loads').update({ status: 'pending_match' }).eq('id', load.id)
    // PUSH_MATCH_HOOK
          try { fetch('/api/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: load.posted_by, title: 'New Escort Request', body: 'An escort has requested your load. Login to review.', url: '/' }) }) } catch {}
          showToast('Load request submitted! Carrier will review.', 'gr')
    setMatchModal(null)
    setMatchLoading(false)
    fetchLoads()
  }

  const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
  const CERTS = ['Lead','Chase','High Pole','Lineman','Rear Steer','Survey','Flagger','NY Cert','CSE (Ontario MTO)','BC Pilot Car','WITPAC','TWIC','AZ Cert','CTTS BC/AB','OAPC Ontario','Saskatchewan']

  function timeAgo(dt: string) {
    const diff = Date.now() - new Date(dt).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  return (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div className="bb" style={{ fontSize: 28 }}>FLAT RATE BOARD</div>
          <div className="mo" style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4 }}>Fixed-rate loads · Direct hire · No bidding</div>
        </div>
        <button className="btn btn-am btn-sm" onClick={() => setPage('postload')}>+ POST A LOAD</button>
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '14px 16px', background: 'rgba(255,255,255,.03)', border: '1px solid var(--l1)', borderRadius: 6, marginBottom: 20 }}>
        <select value={filterState} onChange={e => setFilterState(e.target.value)} className="input-field" style={{ minWidth: 140, fontSize: 11 }}>
          <option value="">All States</option>
          {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterCert} onChange={e => setFilterCert(e.target.value)} className="input-field" style={{ minWidth: 140, fontSize: 11 }}>
          <option value="">All Cert Types</option>
          {CERTS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="input-field" style={{ fontSize: 11 }} />
        {(filterState || filterCert || filterDate) && (
          <button className="btn btn-sm" style={{ fontSize: 10 }} onClick={() => { setFilterState(''); setFilterCert(''); setFilterDate('') }}>✕ CLEAR</button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><div className="mo" style={{ color: 'var(--t2)' }}>Loading loads...</div></div>
      ) : loads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
          <div className="bb" style={{ fontSize: 20, marginBottom: 8 }}>No loads posted yet</div>
          <div className="mo" style={{ color: 'var(--t2)', marginBottom: 24 }}>No loads posted yet — check back soon.</div>
          <button className="btn btn-am" onClick={() => setPage('postload')}>POST THE FIRST LOAD →</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loads.map((l) => (
            <div key={l.id} className="load-card" style={{ cursor: 'pointer' }} onClick={() => setMatchModal(l)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{l.pu_city}, {l.pu_state} → {l.dl_city}, {l.dl_state}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span className="chip ch-dim" style={{ fontSize: 9 }}>{l.position}</span>
                    {(l.certs_required || []).slice(0, 4).map((c: string) => (
                      <span key={c} className="chip ch-dim" style={{ fontSize: 9 }}>{c}</span>
                    ))}
                    {(l.certs_required || []).length > 4 && <span className="chip ch-dim" style={{ fontSize: 9 }}>+{(l.certs_required || []).length - 4}</span>}
                  </div>
                {l.permit_miles_agreement && (
                  <div style={{ display: 'inline-block', background: '#064e3b', color: '#6ee7b7', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, marginBottom: 4 }} title="Carrier has agreed bid price applies to actual permitted miles">
                    ✓ Permit Miles Protected
                  </div>
                )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gr)' }}>
                    {l.per_mile_rate ? `$${l.per_mile_rate}/mi` : l.day_rate ? `$${l.day_rate}/day` : 'Negotiable'}
                  </div>
                  <div className="mo" style={{ fontSize: 9, color: 'var(--t2)' }}>{timeAgo(l.created_at)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--t2)' }}>
                {l.miles && <span>~{l.miles} mi</span>}
                {l.start_date && <span>📅 {new Date(l.start_date).toLocaleDateString()}</span>}
                <span className="mo">{l.pay_type}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {externalLoads.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 11, color: 'var(--t2)', letterSpacing: '.1em', marginBottom: 12 }}>EXTERNAL LOADS</div>
          {externalLoads.map(el => <ExternalLoadCard key={el.id} el={el} />)}
        </div>
      )}


      {/* MATCH MODAL */}
      {matchModal && (
        <div className="modal-overlay" onClick={() => setMatchModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="bb" style={{ fontSize: 18, marginBottom: 12 }}>REQUEST THIS LOAD</div>
            <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 6, padding: 14, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{matchModal.pu_city}, {matchModal.pu_state} → {matchModal.dl_city}, {matchModal.dl_state}</div>
              <div style={{ fontSize: 11, color: 'var(--t2)', display: 'flex', gap: 12 }}>
                <span>{matchModal.position}</span>
                {matchModal.start_date && <span>{new Date(matchModal.start_date).toLocaleDateString()}</span>}
                <span style={{ color: 'var(--gr)', fontWeight: 600 }}>
                  {matchModal.per_mile_rate ? `$${matchModal.per_mile_rate}/mi` : `$${matchModal.day_rate}/day`}
                </span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 20, lineHeight: 1.6 }}>
              By requesting this load you confirm you hold all required certifications and meet all posted requirements.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-am" style={{ flex: 1 }} onClick={() => handleRequestLoad(matchModal)} disabled={matchLoading}>
                {matchLoading ? 'SUBMITTING...' : 'CONFIRM REQUEST'}
              </button>
              <button className="btn" style={{ flex: 1 }} onClick={() => setMatchModal(null)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ——— BID BOARD PAGE ——————————————————————————————————————
function BidBoardPage({ setPage, user, profile, showToast }: { setPage: (p: Page) => void; user: User | null; profile: Profile | null; showToast: (msg: string, type: 'gr' | 'rd' | 'am') => void }) {
  const [loads, setLoads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterState, setFilterState] = useState('')
  const [filterCert, setFilterCert] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [timers, setTimers] = useState<Record<string, number>>({})
  const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
  const CERTS = ['Lead','Chase','3rd Car','4th Car','High Pole','Rear Steer','Lineman','Route Survey','Flagger','NY Cert','NITPAC','TWIC']

  useEffect(() => { fetchLoads() }, [filterState, filterCert, filterDate])
  useEffect(() => {
    const iv = setInterval(() => {
      setTimers(prev => {
        const next = { ...prev }
        Object.keys(next).forEach(k => { if (next[k] > 0) next[k] -= 1 })
        return next
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  async function fetchLoads() {
    setLoading(true)
    const now = new Date().toISOString()
    let q = supabase.from('loads').select('*').eq('board_type', 'bid5min').eq('status', 'active').gt('expires_at', now).order('created_at', { ascending: false })
    if (filterState) q = q.eq('pu_state', filterState)
    if (filterCert) q = q.contains('certs_required', [filterCert])
    if (filterDate) q = q.gte('start_date', filterDate)
    const { data } = await q.limit(50)
    const d = data || []
    setLoads(d)
    const t: Record<string, number> = {}
    d.forEach((l: any) => {
      if (l.expires_at) t[l.id] = Math.max(0, Math.floor((new Date(l.expires_at).getTime() - Date.now()) / 1000))
    })
    setTimers(t)
    setLoading(false)
  }

  function fmtTimer(s: number) {
    const m = Math.floor(s / 60), sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  function timeAgo(dt: string) {
    const diff = Date.now() - new Date(dt).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
  }

  return (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div className="bb" style={{ fontSize: 28 }}>5-MIN BID BOARD</div>
          <div className="mo" style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4 }}>Act fast · Carrier picks best fit · Clock is ticking</div>
        </div>
        <button className="btn btn-am btn-sm" onClick={() => setPage('postload')}>+ POST A LOAD</button>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '14px 16px', background: 'rgba(255,255,255,.03)', border: '1px solid var(--l1)', borderRadius: 6, marginBottom: 20 }}>
        <select value={filterState} onChange={e => setFilterState(e.target.value)} className="input-field" style={{ minWidth: 140, fontSize: 11 }}>
          <option value="">All States</option>
          {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterCert} onChange={e => setFilterCert(e.target.value)} className="input-field" style={{ minWidth: 140, fontSize: 11 }}>
          <option value="">All Cert Types</option>
          {CERTS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="input-field" style={{ fontSize: 11 }} />
        {(filterState || filterCert || filterDate) && (
          <button className="btn btn-sm" style={{ fontSize: 10 }} onClick={() => { setFilterState(''); setFilterCert(''); setFilterDate('') }}>✕ CLEAR</button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><div className="mo" style={{ color: 'var(--t2)' }}>Loading...</div></div>
      ) : loads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⏱</div>
          <div className="bb" style={{ fontSize: 20, marginBottom: 8 }}>No active bid loads</div>
          <div className="mo" style={{ color: 'var(--t2)' }}>No loads posted yet — check back soon.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loads.map((l) => (
            <div key={l.id} className="load-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{l.pu_city}, {l.pu_state} → {l.dl_city}, {l.dl_state}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span className="chip ch-dim" style={{ fontSize: 9 }}>{l.position}</span>
                    {(l.certs_required || []).slice(0, 3).map((c: string) => (
                      <span key={c} className="chip ch-dim" style={{ fontSize: 9 }}>{c}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t2)', display: 'flex', gap: 12 }}>
                    {l.miles && <span>~{l.miles} mi</span>}
                    {l.start_date && <span>📅 {new Date(l.start_date).toLocaleDateString()}</span>}
                    <span className="mo">{l.pay_type}</span>
                    <span className="mo">{timeAgo(l.created_at)}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {timers[l.id] !== undefined && timers[l.id] > 0 ? (
                    <div style={{ fontSize: 20, fontWeight: 700, color: timers[l.id] < 60 ? 'var(--rd)' : 'var(--am)', fontFamily: 'monospace' }}>
                      ⏱ {fmtTimer(timers[l.id])}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: 'var(--rd)' }}>EXPIRED</div>
                  )}
                  <div className="mo" style={{ fontSize: 9, color: 'var(--t2)', marginTop: 2 }}>remaining</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ——— OPEN BID BOARD ——————————————————————————————————————
function OpenBidPage({ setPage, user, profile, showToast }: { setPage: (p: Page) => void; user: User | null; profile: Profile | null; showToast: (msg: string, type: 'gr' | 'rd' | 'am') => void }) {
  const [loads, setLoads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterState, setFilterState] = useState('')
  const [filterCert, setFilterCert] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [bidModal, setBidModal] = useState<any>(null)
  const [bidAmount, setBidAmount] = useState('')
  const [bidLoading, setBidLoading] = useState(false)
  const [bidCounts, setBidCounts] = useState<Record<string, number>>({})

  const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
  const CERTS = ['Lead','Chase','3rd Car','4th Car','High Pole','Rear Steer','Lineman','Route Survey','Flagger','NY Cert','NITPAC','TWIC']

  useEffect(() => { fetchLoads() }, [filterState, filterCert, filterDate])

  async function fetchLoads() {
    setLoading(true)
    const now = new Date().toISOString()
    let q = supabase.from('loads').select('*').eq('board_type', 'open_bid').eq('status', 'active').or(`expires_at.is.null,expires_at.gt.${now}`).order('created_at', { ascending: false })
    if (filterState) q = q.eq('pu_state', filterState)
    if (filterCert) q = q.contains('certs_required', [filterCert])
    if (filterDate) q = q.gte('start_date', filterDate)
    const { data } = await q.limit(50)
    const d = data || []
    setLoads(d)
    // Fetch bid counts
    if (d.length > 0) {
      const ids = d.map((l: any) => l.id)
      const { data: bids } = await supabase.from('bids').select('load_id').in('load_id', ids)
      const counts: Record<string, number> = {}
      ;(bids || []).forEach((b: any) => { counts[b.load_id] = (counts[b.load_id] || 0) + 1 })
      setBidCounts(counts)
    }
    setLoading(false)
  }

  async function handlePlaceBid() {
    if (!user) { showToast('Sign in to place bids', 'rd'); return }
    if (!bidAmount || isNaN(parseFloat(bidAmount))) { showToast('Enter a valid day rate', 'rd'); return }
    setBidLoading(true)
    const { error } = await supabase.from('bids').insert({
      load_id: bidModal.id, escort_id: user.id, amount: parseFloat(bidAmount)
    })
    if (error) { showToast('Error placing bid: ' + error.message, 'rd'); setBidLoading(false); return }
    showToast('Bid placed! Carrier will review all bids.', 'gr')
    setBidModal(null)
    setBidAmount('')
    setBidLoading(false)
    fetchLoads()
  }

  function timeAgo(dt: string) {
    const diff = Date.now() - new Date(dt).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
  }

  return (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div className="bb" style={{ fontSize: 28 }}>OPEN BID BOARD</div>
          <div className="mo" style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4 }}>24-72hr window · Post your pitch · Carrier picks best fit</div>
        </div>
        <button className="btn btn-am btn-sm" onClick={() => setPage('postload')}>+ POST A LOAD</button>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '14px 16px', background: 'rgba(255,255,255,.03)', border: '1px solid var(--l1)', borderRadius: 6, marginBottom: 20 }}>
        <select value={filterState} onChange={e => setFilterState(e.target.value)} className="input-field" style={{ minWidth: 140, fontSize: 11 }}>
          <option value="">All States</option>
          {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterCert} onChange={e => setFilterCert(e.target.value)} className="input-field" style={{ minWidth: 140, fontSize: 11 }}>
          <option value="">All Cert Types</option>
          {CERTS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="input-field" style={{ fontSize: 11 }} />
        {(filterState || filterCert || filterDate) && (
          <button className="btn btn-sm" style={{ fontSize: 10 }} onClick={() => { setFilterState(''); setFilterCert(''); setFilterDate('') }}>✕ CLEAR</button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><div className="mo" style={{ color: 'var(--t2)' }}>Loading...</div></div>
      ) : loads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
          <div className="bb" style={{ fontSize: 20, marginBottom: 8 }}>No open bids right now</div>
          <div className="mo" style={{ color: 'var(--t2)' }}>No loads posted yet — check back soon.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loads.map((l) => (
            <div key={l.id} className="load-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{l.pu_city}, {l.pu_state} → {l.dl_city}, {l.dl_state}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span className="chip ch-dim" style={{ fontSize: 9 }}>{l.position}</span>
                    {(l.certs_required || []).slice(0, 3).map((c: string) => (
                      <span key={c} className="chip ch-dim" style={{ fontSize: 9 }}>{c}</span>
                    ))}
                    <span className="chip ch-am" style={{ fontSize: 9 }}>OPEN BID</span>
                    {bidCounts[l.id] > 0 && (
                      <span className="chip ch-dim" style={{ fontSize: 9 }}>{bidCounts[l.id]} bid{bidCounts[l.id] !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t2)', display: 'flex', gap: 12 }}>
                    {l.miles && <span>~{l.miles} mi</span>}
                    {l.start_date && <span>📅 {new Date(l.start_date).toLocaleDateString()}</span>}
                    <span className="mo">{l.pay_type}</span>
                    <span className="mo">{timeAgo(l.created_at)}</span>
                  </div>
                </div>
                <div>
                  <button className="btn btn-am btn-sm" onClick={() => { setBidModal(l); setBidAmount('') }} style={{ fontSize: 10 }}>
                    PLACE BID
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BID MODAL */}
      {bidModal && (
        <div className="modal-overlay" onClick={() => setBidModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="bb" style={{ fontSize: 18, marginBottom: 12 }}>PLACE YOUR BID</div>
            <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 6, padding: 14, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{bidModal.pu_city}, {bidModal.pu_state} → {bidModal.dl_city}, {bidModal.dl_state}</div>
              <div style={{ fontSize: 11, color: 'var(--t2)' }}>{bidModal.position} · {bidModal.pay_type}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="mo" style={{ fontSize: 10, display: 'block', marginBottom: 6 }}>YOUR DAY RATE ($)</label>
              <input
                type="number"
                className="input-field"
                placeholder="e.g. 450"
                value={bidAmount}
                onChange={e => setBidAmount(e.target.value)}
                style={{ width: '100%', fontSize: 16, fontWeight: 600 }}
                min="0"
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-am" style={{ flex: 1 }} onClick={handlePlaceBid} disabled={bidLoading}>
                {bidLoading ? 'SUBMITTING...' : 'SUBMIT BID'}
              </button>
              <button className="btn" style={{ flex: 1 }} onClick={() => setBidModal(null)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


function EscortsPage({ setPage }: { setPage: (p: Page) => void }) {
  const [filterState, setFilterState] = useState('');
  const [filterCert, setFilterCert] = useState('');
  const [filterAvailNow, setFilterAvailNow] = useState(false);
  const [filterBGC, setFilterBGC] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const CERT_TYPES = ['Lead','Chase','High Pole','Lineman','Rear Steer','Survey','Flagger','NY Cert','CSE (Ontario MTO)','BC Pilot Car','WITPAC','TWIC','AZ Cert','CTTS BC/AB','OAPC Ontario','Saskatchewan'];
  const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
  let escorts: any[] = [...SEED_ESCORTS];
  if (filterState) escorts = escorts.filter(e => e.states?.includes(filterState));
  if (filterCert) escorts = escorts.filter(e => (e.cert_types || e.badges || []).includes(filterCert));
  if (filterAvailNow) escorts = escorts.filter(e => (e as any).is_available !== false);
  if (filterBGC) escorts = escorts.filter(e => (e as any).bgc_verified);
  if (sortBy === 'rating') escorts.sort((a,b) => (b.rating||0) - (a.rating||0));
  else if (sortBy === 'jobs') escorts.sort((a,b) => (b.total_jobs||0) - (a.total_jobs||0));
  else if (sortBy === 'newest') escorts.reverse();
  else if (sortBy === 'available') escorts.sort((a,b) => (b.is_available ? 1 : 0) - (a.is_available ? 1 : 0));
  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="eyebrow" style={{ color: "var(--gr)" }}>Verified P/EVO Directory</div>
          <div className="section-title">FIND ESCORTS</div>
        </div>
      </div>
      <EarlyBanner role="carrier" />
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" as const, alignItems: "center" }}>
        <select value={filterState} onChange={e => setFilterState(e.target.value)} style={{ minWidth: 120 }}>
          <option value="">All States</option>
          {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterCert} onChange={e => setFilterCert(e.target.value)} style={{ minWidth: 160 }}>
          <option value="">All Certifications</option>
          {CERT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="rating">Sort: Highest Rated</option>
          <option value="jobs">Most Jobs</option>
          <option value="newest">Newest</option>
          <option value="available">Available First</option>
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
          <input type="checkbox" checked={filterAvailNow} onChange={e => setFilterAvailNow(e.target.checked)} />
          Available Now
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
          <input type="checkbox" checked={filterBGC} onChange={e => setFilterBGC(e.target.checked)} />
          BGC Badge
        </label>
      </div>
      <div className="esc-grid">
        {escorts.length > 0 ? escorts.map((e) => <EscortCard key={e.id} e={e} setPage={setPage} />) : (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--t2)' }}>No escorts match your filters.</div>
        )}
      </div>
    </div>
  );
}

// ─── ESC PROFILE PAGE ─────────────────────────────────────────────────────────

function EscProfilePage({ setPage }: { setPage: (p: Page) => void }) {
  const profile = { name: "Jane Doe", tier: "Pro", bgc_verified: true, cert_types: ["FSSW", "STI"], id: "prof1" };
  const user = { id: "1" };
  
  const reviews = [
    { rating: 5, reviewer: "John", text: "Amazing service!" },
    { rating: 4.5, reviewer: "Mike", text: "Very professional" },
    { rating: 5, reviewer: "Alex", text: "Highly recommend" }
  ];
  
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0;
  
  return (
    <div className="section" style={{ padding: "20px" }}>
      <div className="mo" style={{ fontSize: 9, color: "var(--am)", marginBottom: 16 }}>Profile</div>
      
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: "600", color: "var(--am)" }}>{profile.name}</div>
        {profile.tier && <span style={{ backgroundColor: profile.tier === "Pro" ? "#ff9800" : "#757575", color: "white", padding: "4px 8px", borderRadius: "4px", fontSize: 12 }}>{profile.tier}</span>}
        {profile.bgc_verified && <span style={{ backgroundColor: "#4caf50", color: "white", padding: "4px 8px", borderRadius: "4px", fontSize: 12 }}>✓ BGC Verified</span>}
      </div>
      
      {profile.cert_types && profile.cert_types.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 8 }}>Certifications</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {profile.cert_types.map((cert: string) => <span key={cert} style={{ backgroundColor: "rgba(255,152,0,0.1)", color: "#ff9800", padding: "4px 8px", borderRadius: "4px", fontSize: 12 }}>{cert}</span>)}
          </div>
        </div>
      )}
      
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: "600", color: "var(--am)" }}>★ {avgRating} / 5 ({reviews.length} reviews)</div>
      </div>
      
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 12, fontWeight: "600" }}>Recent Reviews</div>
        {reviews.slice(0, 5).map((review, i) => <div key={i} style={{ marginBottom: 12, padding: "12px", backgroundColor: "rgba(0,0,0,0.02)", borderRadius: "4px" }}><div style={{ fontSize: 11, color: "var(--t2)" }}>{review.reviewer} • ★ {review.rating}</div><div style={{ fontSize: 11, color: "var(--t2)", marginTop: 4 }}>{review.text}</div></div>)}
      </div>
      
      {user?.id === profile?.id && <button className="btn btn-ghost btn-sm" style={{ width: "100%" }} onClick={() => setPage("pricing")}>Edit Profile</button>}
    </div>
  );
  }

// ─── POST LOAD PAGE ───────────────────────────────────────────────────────────

function PostLoadPage({ setPage, user, profile, showToast }: {
  setPage: (p: Page) => void;
  user: User | null;
  profile: Profile | null;
  showToast: (msg: string, type: "gr" | "rd" | "am") => void;
}) {
  // Role guard: carriers and freight brokers only
  if (!user) {
    return (
      <div style={{ padding: "40px 24px", textAlign: "center" }}>
        <p style={{ color: "var(--t2)", marginBottom: 16 }}>You must be signed in as a carrier or freight broker to post a load.</p>
        <button className="btn btn-prime" onClick={() => setPage("signin")}>Sign In</button>
      </div>
    );
  }
  if ((profile as any)?.role === "escort") {
    return (
      <div style={{ padding: "40px 24px", textAlign: "center" }}>
        <p style={{ color: "var(--t2)", marginBottom: 8 }}>Load posting is for carriers and freight brokers only.</p>
        <p className="mo" style={{ fontSize: 11, color: "var(--t3)" }}>Escorts use Find Escorts to connect with carriers directly.</p>
        <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => setPage("escorts")}>Browse Open Loads</button>
      </div>
    );
  }
  const [boardType, setBoardType] = useState<"flat" | "bid" | "open">("flat");
  const [form, setForm] = useState({
    puCity: "", puState: "", dlCity: "", dlState: "",
    miles: "", rate: "2.00", dayRate: "500", positions: ["Lead"], payTerm: "FastPay", payTermCustom: "",
    notes: "", startDate: "", permitFile: null as File | null,
				certTypes: [] as string[], certOther: "", mc_number: "", dot_number: "",
  });
  const [saving, setSaving] = useState(false);
	const [permitUploading, setPermitUploading] = useState(false);
  const [noGoFee] = useState('250');
  const [overnightRate] = useState('100');
  // Auto-rate: >250mi = $2/mi, <=250mi = $500/day
  useEffect(() => {
    const m = parseFloat(form.miles);
    if (!isNaN(m) && m > 0) {
      if (m > 250) setForm(f => ({ ...f, rate: '2.00' }));
      else setForm(f => ({ ...f, dayRate: '500' }));
    }
  }, [form.miles]);
  const estPay = (() => {
    const m = parseFloat(form.miles); const r = parseFloat(form.rate);
    if (!isNaN(m) && !isNaN(r) && m > 0 && r > 0) return (m * r).toFixed(2);
    return null;
  })();

  function set(k: string, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSubmit() {
    if (!user || !profile) { setPage("signin"); return; }
    if (!form.puCity || !form.puState || !form.dlCity || !form.dlState) {
        // positions merged into certTypes - validation removed
      showToast("Please fill in origin and destination", "rd"); return;
    }
    setSaving(true);
			// Upload permit if provided
			let permit_url: string | null = null;
			if (form.permitFile) {
				setPermitUploading(true);
				const ext = form.permitFile.name.split(".").pop();
				const fileName = `permit_${Date.now()}.${ext}`;
				const { data: upData, error: upErr } = await supabase.storage.from("permits").upload(fileName, form.permitFile, { upsert: true });
				setPermitUploading(false);
				if (upErr) { showToast("Permit upload failed: " + upErr.message, "rd"); setSaving(false); return; }
				const { data: urlData } = supabase.storage.from("permits").getPublicUrl(upData.path);
				permit_url = urlData.publicUrl;
			}
        // Insert one load card per selected escort position
        let firstError = null;
        for (const pos of form.positions) {
          const { error: posErr } = await supabase.from("loads").insert({
        carrier_id: user.id,
        board_type: boardType,
        pu_city: form.puCity,
        pu_state: form.puState.toUpperCase(),
        dl_city: form.dlCity,
        dl_state: form.dlState.toUpperCase(),
        position: pos,
  				pay_term: form.payTerm === "Custom" ? (form.payTermCustom || "Custom") : form.payTerm,
        miles: parseInt(form.miles) || null,
          per_mile_rate: parseFloat(form.rate) || 2.00,
        day_rate: parseFloat(form.dayRate) || 500,
        overnight_fee: 100,
        no_go_fee: 250,
  				cert_types: form.certTypes,
        notes: form.notes || null,
  				permit_url: permit_url,
        start_date: form.startDate || null,
        status: "open",
        poster_company: profile.company_name,
        poster_rating: profile.rating || null,
        poster_jobs: profile.total_jobs || null,
          });
          if (posErr && !firstError) firstError = posErr;
        }
        const error = firstError;
    setSaving(false);
    if (error) {
      showToast("Error posting load: " + error.message, "rd");
    } else {
      // SMS_BLAST_HOOK
          try {
            fetch('/api/sms', { method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ loadId: (await supabase.from('loads').select('id').eq('posted_by', user?.id).order('created_at', { ascending: false }).limit(1).single()).data?.id, pickup: form.puCity + ', ' + form.puState, destination: form.dlCity + ', ' + form.dlState, date: form.startDate, certs: form.certTypes, rate: form.rate || '' }) })
          } catch {}
          // PUSH_MEMBER_BROADCAST: notify Member escorts after Pro window expires
          try {
            const broadcastPayload = { pickupState: form.puState, pickup: form.puCity + ', ' + form.puState, destination: form.dlCity + ', ' + form.dlState, date: form.startDate, certs: form.certTypes, rate: form.rate || '' }
            setTimeout(() => { fetch('/api/push/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(broadcastPayload) }).catch(() => {}) }, 5 * 60 * 1000)
          } catch {}
          showToast("Load posted successfully!", "gr");
      setPage("flatboard");
    }
  }

  if ((profile as any)?.role === "escort") {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <div className="bb" style={{ fontSize: 18, marginBottom: 8 }}>Carriers and Brokers Only</div>
        <p className="mo" style={{ fontSize: 11, color: "var(--t2)", marginBottom: 20 }}>Carriers and freight brokers post loads free. Always.</p>
        <button className="btn btn-or btn-sm" onClick={() => setPage("flatboard")}>Browse Available Loads</button>
      </div>
    );
  }

  return (
    <div className="postload-wrap">
      <div className="bb" style={{ fontSize: 28, marginBottom: 4 }}>POST A LOAD</div>
      <p className="mo" style={{ fontSize: 10, color: "var(--t2)", marginBottom: 16 }}>Free for all carriers. Choose your board type.</p>
      <div style={{ background: "rgba(0,204,122,.07)", border: "1px solid rgba(0,204,122,.2)", borderRadius: 3, padding: "10px 16px", marginBottom: 24 }} className="mo">
        <span style={{ fontSize: 10, color: "var(--gr)" }}>Standard Rates: </span>
        <span style={{ fontSize: 10, color: "var(--t2)" }}>$2.00/mi or $500/day &middot; $100 overnight &middot; $250 no-go (auto-applied)</span>
      </div>
      {!user && (
        <div style={{ background: "rgba(255,98,0,.08)", border: "1px solid rgba(255,98,0,.2)", borderRadius: 3, padding: "12px 16px", marginBottom: 20 }}>
          <span className="mo" style={{ fontSize: 10, color: "var(--or)" }}>You need an account to post loads. </span>
          <button className="mo" style={{ background: "none", border: "none", color: "var(--or)", fontSize: 10, cursor: "pointer", textDecoration: "underline" }} onClick={() => setPage("signin")}>Sign up free</button>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
        {([["flat", "var(--gr)", "Flat Rate", "First to respond wins"], ["bid", "var(--am)", "5-Min Bid", "5-min price competition"], ["open", "var(--bl)", "Open Bid", "You pick the escort"]] as const).map(([type, c, label, desc]) => (
          <div key={type} className="card" style={{ flex: 1, borderTop: "2px solid " + c, cursor: "pointer", opacity: boardType === type ? 1 : 0.5 }} onClick={() => setBoardType(type)}>
            <div className="bb" style={{ fontSize: 14, color: c, marginBottom: 4 }}>{label}</div>
            <div className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>{desc}</div>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 560 }}>
        <div className="form-field">
          <label className="form-label">Pickup Location</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="text" placeholder="City" value={form.puCity} onChange={(e) => setForm(f => ({ ...f, puCity: e.target.value }))} style={{ flex: 2, width: "100%" }} />
            <input type="text" placeholder="ST" value={form.puState} onChange={(e) => setForm(f => ({ ...f, puState: e.target.value.toUpperCase().slice(0,2) }))} style={{ flex: 1, width: "100%", maxWidth: 56 }} maxLength={2} />
          </div>
        </div>
        <div className="form-field">
          <label className="form-label">Delivery Location</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="text" placeholder="City" value={form.dlCity} onChange={(e) => setForm(f => ({ ...f, dlCity: e.target.value }))} style={{ flex: 2, width: "100%" }} />
            <input type="text" placeholder="ST" value={form.dlState} onChange={(e) => setForm(f => ({ ...f, dlState: e.target.value.toUpperCase().slice(0,2) }))} style={{ flex: 1, width: "100%", maxWidth: 56 }} maxLength={2} />
          </div>
        </div>
        <div className="form-field">
          <label className="form-label">Approx Miles</label>
          <input type="number" placeholder="e.g. 350" value={form.miles} onChange={(e) => setForm(f => ({ ...f, miles: e.target.value }))} style={{ width: "100%" }} min="1" />
        </div>
        {boardType !== "bid" && (<>
          <div className="form-field">
            <label className="form-label">Rate Per Mile <span className="mo" style={{ fontSize: 10, color: "var(--t2)", fontWeight: 400 }}>($/mi)</span></label>
            <input type="number" placeholder="2.00" step="0.25" value={form.rate} onChange={(e) => setForm(f => ({ ...f, rate: e.target.value }))} style={{ width: "100%" }} min="0" />
          </div>
          <div className="form-field">
                <label className="form-label">MC Number <span className="mo" style={{ fontSize: 10, color: "var(--or)", fontWeight: 400 }}>(required)</span></label>
                <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="e.g. 1234567" value={form.mc_number || ""} onChange={(e) => setForm(f => ({ ...f, mc_number: e.target.value.replace(/\D/g, "") }))} style={{ width: "100%" }} />
              </div>
              <div className="form-field">
                <label className="form-label">DOT Number <span className="mo" style={{ fontSize: 10, color: "var(--or)", fontWeight: 400 }}>(required)</span></label>
                <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="e.g. 7654321" value={form.dot_number || ""} onChange={(e) => setForm(f => ({ ...f, dot_number: e.target.value.replace(/\D/g, "") }))} style={{ width: "100%" }} />
                <p className="mo" style={{ fontSize: 10, color: "var(--t2)", marginTop: 4 }}>Your MC/DOT number is verified against FMCSA public records. Fraudulent postings will result in permanent ban.</p>
              </div>
              <div className="form-field">
            <label className="form-label">Day Rate <span className="mo" style={{ fontSize: 10, color: "var(--t2)", fontWeight: 400 }}>($/day)</span></label>
            <input type="number" placeholder="500" step="50" value={form.dayRate} onChange={(e) => setForm(f => ({ ...f, dayRate: e.target.value }))} style={{ width: "100%" }} min="0" />
          </div>
        </>)}
        
        <div className="form-field" style={{ marginTop: 4 }}>
          <label className="form-label">Certifications / Escort Types Required</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", marginTop: 8 }}>
            {(["Lead","Chase","3rd Car","4th Car","High Pole","Rear Steer","Lineman","Route Survey","Flagger","NY Cert","CSE (Ontario MTO)","WITPAC","TWIC","Other"] as string[]).map((opt) => (
              <label key={opt} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", padding: "4px 6px", borderRadius: 4, background: form.certTypes.includes(opt) ? "rgba(249,115,22,0.10)" : "rgba(255,255,255,0.03)", border: "1px solid " + (form.certTypes.includes(opt) ? "rgba(249,115,22,0.45)" : "rgba(255,255,255,0.07)"), transition: "all 0.15s" }}>
                <input type="checkbox" checked={form.certTypes.includes(opt)} onChange={(e) => { const next = e.target.checked ? [...form.certTypes, opt] : form.certTypes.filter((x: string) => x !== opt); setForm(f => ({ ...f, certTypes: next, certOther: e.target.checked ? f.certOther : "" })); }} style={{ accentColor: "var(--or)" }} />
                <span className="mo" style={{ fontSize: 10, color: form.certTypes.includes(opt) ? "var(--or)" : "var(--t2)", letterSpacing: ".02em" }}>{opt}</span>
              </label>
            ))}
          </div>
          {form.certTypes.includes("Other") && (
            <input type="text" placeholder="Describe other cert/escort type..." value={form.certOther} onChange={(e) => setForm(f => ({ ...f, certOther: e.target.value }))} style={{ marginTop: 8, width: "100%" }} />
          )}
        </div>
        <div className="form-field">
          <label className="form-label">Pay Terms</label>
          <select value={form.payTerm} onChange={(e) => setForm(f => ({ ...f, payTerm: e.target.value }))} style={{ width: "100%" }}>
            <option value="FastPay">Fast Pay (same day / next day)</option>
            <option value="SameDay">Same Day</option>
            <option value="Net7">Net 7 Days</option>
            <option value="Net14">Net 14 Days</option>
            <option value="Net30">Net 30 Days</option>
            <option value="Custom">Custom...</option>
          </select>
          {form.payTerm === "Custom" && (
            <input type="text" placeholder="e.g. Net 45, COD, upon delivery..." value={form.payTermCustom} onChange={(e) => setForm(f => ({ ...f, payTermCustom: e.target.value }))} style={{ marginTop: 8, width: "100%" }} />
          )}
        </div>
        <div className="form-field">
          <label className="form-label">Preferred Start Date</label>
          <input type="date" style={{ width: "100%" }} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Permit Upload <span className="mo" style={{ color: "var(--t2)", fontWeight: 400 }}>(optional)</span></label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setForm(f => ({ ...f, permitFile: e.target.files?.[0] ?? null }))} style={{ width: "100%", fontSize: 12, color: "var(--t2)" }} />
          {form.permitFile && <span className="mo" style={{ fontSize: 10, color: "var(--gr)", marginTop: 4, display: "block" }}>Permit: {form.permitFile.name}</span>}
          {permitUploading && <span className="mo" style={{ fontSize: 10, color: "var(--or)" }}>Uploading permit...</span>}
        </div>
        <div className="form-field">
          <label className="form-label">Special Instructions / Notes</label>
          <textarea placeholder="Route details, access notes, timing requirements..." style={{ width: "100%", minHeight: 80 }} value={form.notes} maxLength={500} onChange={(e) => set("notes", e.target.value)} />
          <div style={{ fontSize: 10, color: "var(--t3,#555)", textAlign: "right", marginTop: 2 }}>{form.notes.length}/500</div>
        </div>
        {/* Estimated pay + fees */}
        <div style={{ background: "var(--p2,#1a1a1a)", border: "1px solid var(--l1,#222)", borderRadius: 8, padding: "12px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>📊 RATE SUMMARY</div>
          {estPay && <div style={{ fontSize: 12, color: "var(--gr,#0c0)" }}>Estimated escort pay: <strong>${estPay}</strong></div>}
          <div style={{ fontSize: 11, color: "var(--t2,#888)", marginTop: 6 }}>No-Go Fee: <strong>$250</strong> · Overnight Rate: <strong>$100/night</strong></div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button className="btn btn-or" onClick={handleSubmit} disabled={saving}>
            {saving ? "Posting..." : "Post Load Free"}
          </button>
          <button className="btn btn-ghost" onClick={() => setPage("home")}>Cancel</button>
        </div>
      </div>
    </div>
  );
}



function EscortDashPage({ setPage, profile }: { setPage: (p: Page) => void; profile: Profile | null }) {
  const [tab, setTab] = useState("overview");
  const [myLoads, setMyLoads] = useState<Load[]>([]);

  useEffect(() => {
    async function fetchLoads() {
      const { data } = await supabase.from("loads").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(10);
      if (data && data.length > 0) setMyLoads(data);
      else setMyLoads(SEED_LOADS);
    }
    fetchLoads();
  }, []);

  // ZONES_HOOK
  const [availStates, setAvailStates] = useState<string[]>(profile?.availability_states || [])
  const [zonesSaving, setZonesSaving] = useState(false)
  const [zonesMsg, setZonesMsg] = useState('')
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
    { id: "certs", label: "Certifications" }, { id: "dispute", label: "Dispute Center" },
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
            {(profile?.tier || "free").toUpperCase()}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{profile?.full_name || "Your Name"}</div>
          <div className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>{profile?.company_name || "No company set"}</div>
          {profile?.tier === "free" && (
            <button className="btn btn-am btn-sm" style={{ marginTop: 12, width: "100%", fontSize: 8 }} onClick={() => setPage("pricing")}>Upgrade to Pro →</button>
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
                  <button className="btn btn-am btn-sm" style={{ width: "100%" }} onClick={() => setPage("pricing")}>
                    {profile?.tier === "pro" ? "ACTIVATE BROADCAST" : "🔒 PRO FEATURE"}
                  </button>
                </div>
                <div className="mo" style={{ fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--t2)", marginBottom: 8 }}>Breakdown Protocol</div>
                <button className="btn btn-sm" style={{ width: "100%", background: "rgba(255,53,53,.1)", color: "var(--rd)", border: "1px solid rgba(255,53,53,.2)" }}>🚨 ACTIVATE BREAKDOWN PROTOCOL</button>
              </div>
            </div>
          </>
        )}
        {tab === "loads" && (
          <>
            <div className="bb" style={{ fontSize: 24, marginBottom: 8 }}>AVAILABLE LOADS</div>
            {myLoads.some(l => l.isSample) && <EarlyBanner role="escort" />}
            <div className="data-table">
              <table>
                <thead><tr><th>Load ID</th><th>Route</th><th>Miles</th><th>Rate</th><th>Est. Pay</th><th>Position</th><th>Pay Terms</th><th>Score</th><th></th></tr></thead>
                <tbody>
                  {myLoads.map((l) => (
                    <tr key={l.id}>
                      <td className="mo" style={{ color: "var(--t2)", fontSize: 9 }}>{l.isSample ? "SAMPLE" : l.id.slice(0, 8).toUpperCase()}{l.isSample && <SampleBadge />}</td>
                      <td style={{ fontWeight: 500, fontSize: 12 }}>{l.pu_city}, {l.pu_state} → {l.dl_city}, {l.dl_state}</td>
                      <td className="mo">{l.miles}</td>
                      <td className="mo" style={{ color: "var(--gr)", fontWeight: 600 }}>${l.per_mile_rate.toFixed(2)}/mi</td>
                      <td className="mo" style={{ color: "var(--gr)" }}>${((l.miles || 0) * l.per_mile_rate).toFixed(0)}</td>
                      <td style={{ fontSize: 10 }}>{l.position}</td>
                      <td>{l.pay_type === "FastPay" ? <span className="chip ch-gr">⚡ FastPay</span> : <span className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>{l.pay_type}</span>}</td>
                      <td><PayScore score={l.poster_rating || 4.5} /></td>
                      <td><button className="btn btn-am btn-sm" onClick={() => setPage("pricing")}>Respond →</button></td>
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
                <p className="mo" style={{ fontSize: 11, color: "var(--t2)", marginBottom: 16 }}>Return load feed, pre-arrival SMS alerts, deadhead savings dashboard</p>
                <button className="btn btn-am" onClick={() => setPage("pricing")}>Upgrade to Pro — $29.99/mo →</button>
              </div>
            ) : (
              <div className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>Return load feed coming in Phase 2 — you&apos;re on the early access list.</div>
            )}
          </>
        )}
        {tab === "certs" && (
          <>
            <div className="bb" style={{ fontSize: 24, marginBottom: 20 }}>CERTIFICATIONS</div>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                { name: "P/EVO Verified", verified: profile?.p_evo_verified, color: "var(--gr)" },
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
          </>
        )}
        {tab === "dispute" && (
          <>
            <div className="bb" style={{ fontSize: 24, marginBottom: 20 }}>DISPUTE CENTER</div>
            <div className="mo" style={{ fontSize: 10, color: "var(--t2)", marginBottom: 16 }}>No open disputes.</div>
            <button className="btn btn-or btn-sm">+ File New Dispute</button>
          </>
        )}
        {tab === "jobs" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
            <div style={{ textAlign: "center" }}>
              <div className="bb" style={{ fontSize: 24, color: "var(--t2)", marginBottom: 8 }}>NO JOBS YET</div>
              <p className="mo" style={{ fontSize: 10, color: "var(--t3)", marginBottom: 16 }}>Complete your first load to see it here</p>
              <button className="btn btn-am btn-sm" onClick={() => setTab("loads")}>Browse Loads →</button>
            </div>
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
                <a href="https://upside.app.link/OEH" target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-block", background: "var(--or,#f60)", color: "#000", fontWeight: 700, fontSize: 12, padding: "10px 20px", borderRadius: 6, textDecoration: "none" }}>
                  Activate Fuel Savings →
                </a>
              </div>
        {/* ── MY TOOLS ───────────────────────────────── */}
        <div style={{ marginTop: 24, background: "var(--card,#111)", border: "1px solid var(--l1,#222)", borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, letterSpacing: ".06em" }}>🧰 MY TOOLS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
            {[
              { icon: "🗺️", label: "Deadhead Minimizer", href: "/deadhead" },
              { icon: "📋", label: "Permit Directory", href: "/tools/permits" },
              { icon: "📄", label: "Invoice Generator", href: "/tools/invoice", soon: true },
              { icon: "💰", label: "Expense Tracker", href: "/tools/expenses", soon: true },
              { icon: "⛽", label: "Fuel Savings (Upside)", href: "https://upside.app.link/OEH", ext: true },
            ].map(tool => (
              <a key={tool.label} href={tool.href} target={tool.ext ? "_blank" : "_self"} rel="noopener noreferrer"
                style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, background: "var(--p2,#1a1a1a)", border: "1px solid var(--l1,#222)", borderRadius: 8, padding: "12px 14px", textDecoration: "none", color: "var(--t1,#fff)", opacity: tool.soon ? 0.6 : 1, cursor: tool.soon ? "default" : "pointer" }}
                onClick={e => tool.soon && e.preventDefault()}>
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
                <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 12 }}>Select states you run. SMS alerts only for these states. Leave blank for ALL loads.</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>{US_STATES_ALL.map((st: string) => { const sel = ((profile?.notification_states as string[]) || []).includes(st); return (<button key={st} onClick={async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const cur: string[] = ((profile?.notification_states as string[]) || []); const next = sel ? cur.filter((s: string) => s !== st) : [...cur, st]; await supabase.from('profiles').update({ notification_states: next }).eq('id', user.id); }} style={{ padding:'4px 10px', borderRadius:4, fontSize:11, fontWeight:600, border: sel ? '2px solid #ff6600' : '1px solid var(--l2)', background: sel ? '#ff6600' : 'var(--card)', color: sel ? '#fff' : 'var(--t1)', cursor:'pointer' }}>{st}</button>); })}</div>
                <div style={{ fontSize:11, color:'var(--t3)' }}>{((profile?.notification_states as string[])?.length || 0) === 0 ? '📡 All states' : `📡 ${((profile?.notification_states as string[]) || []).join(', ')}`}</div>
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
      const { data } = await supabase.from('loads').select('*').eq('posted_by', user.id).eq('status', 'active').order('created_at', { ascending: false })
      setActiveLoads(data || [])
    } else if (tab === 'requests') {
      const { data } = await supabase.from('load_matches').select('*, loads(*), profiles!load_matches_escort_id_fkey(full_name, tier, bgc_verified, certs)').eq('status', 'pending').order('created_at', { ascending: false })
      const mine = (data || []).filter((m: any) => m.loads?.posted_by === user.id)
      setMatchRequests(mine)
    } else if (tab === 'history') {
      const { data } = await supabase.from('loads').select('*').eq('posted_by', user.id).in('status', ['filled', 'expired', 'cancelled']).order('created_at', { ascending: false })
      setHistoryLoads(data || [])
    }
    setLoading(false)
  }

  async function handleAccept(matchId: string, loadId: string, escortId: string) {
    await supabase.from('load_matches').update({ status: 'confirmed' }).eq('id', matchId)
    await supabase.from('loads').update({ status: 'filled' }).eq('id', loadId)
    // PUSH_ESCORT_ACCEPT
    try { fetch('/api/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: escortId, title: 'Match Confirmed!', body: 'A carrier has accepted your request. Login to view contact info.', url: '/' }) }) } catch {}
    showToast('Match confirmed! Both parties will receive contact info.', 'gr')
    loadData()
  }

  async function handleDecline(matchId: string, loadId: string) {
    await supabase.from('load_matches').update({ status: 'declined' }).eq('id', matchId)
    await supabase.from('loads').update({ status: 'active' }).eq('id', loadId)
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
            {(profile?.tier || 'free').toUpperCase()}
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
                          {m.profiles?.bgc_verified && <span className="chip ch-gr" style={{ fontSize: 8 }}>✓ BGC</span>}
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
              { icon: "💰", label: "Upside Fuel Savings", href: "https://upside.app.link/OEH", ext: true },
            ].map(tool => (
              <a key={tool.label} href={tool.href} target={tool.ext ? "_blank" : "_self"} rel="noopener noreferrer"
                style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, background: "var(--p2,#1a1a1a)", border: "1px solid var(--l1,#222)", borderRadius: 8, padding: "12px 14px", textDecoration: "none", color: "var(--t1,#fff)" }}
                onClick={e => { if(tool.action) { e.preventDefault(); tool.action(); } }}>
                <span style={{ fontSize: 20 }}>{tool.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600 }}>{tool.label}</span>
              </a>
            ))}
          </div>
          {/* SMS Post Instructions */}
          <div style={{ background: "var(--p2,#1a1a1a)", border: "1px solid var(--l1,#222)", borderLeft: "3px solid var(--or,#f60)", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>📱 SMS Load Posting</div>
            <p style={{ fontSize: 11, color: "var(--t2,#888)", lineHeight: 1.7, margin: 0 }}>
              Text your load to our number. Format:<br/>
              <code style={{ fontSize: 10, color: "var(--or,#f60)", background: "#1a1a1a", padding: "2px 6px", borderRadius: 3 }}>OEH [TYPE] pickup [CITY] [STATE] destination [CITY] [STATE] [DATE] [RATE]</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


// ─── PRICING PAGE ─────────────────────────────────────────────────────────────

function PricingPage({ setPage }: { setPage: (p: Page) => void }) {
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
              {tier.price === 0 ? "Start Free Trial" : "Get Started"}
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
    const subject = tier === 1 ? 'Tier 1 P/EVO Cert Submission' : 'Tier 2 Vehicle Submission'
    await fetch('/api/verify-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, tier, subject, fileName: file.name })
    })
    setMsg('✅ Submitted! Admin will review within 48 hours.')
    setUploading(false)
  }

  async function handleStripe() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMsg('Please sign in first.'); return }
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId: 'price_1TF0EILmfugPCRbAvM6Q5rhW', userId: user.id, redirectPath: '/verify?success=bgc' })
    })
    const { url } = await res.json()
    if (url) window['location']['href'] = url
    else setMsg('Checkout failed. Please try again.')
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
              <button className="btn btn-or btn-sm" onClick={handleStripe}>Pay \$9.99 → Start BGC</button>
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

function SignInPage({ setPage, showToast }: { setPage: (p: Page) => void; showToast: (msg: string, type: "gr" | "rd" | "am") => void }) {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [role, setRole] = useState<"escort" | "carrier" | "broker">("escort");
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
        options: { data: { full_name: fullName, company_name: company, role }, emailRedirectTo: `${window.location.origin}/auth/callback` },
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
          <img src="/logo.png" alt="OEH" style={{ width: 36, height: 36, objectFit: "contain" }} />
          <div>
            <div className="bb" style={{ fontSize: 20 }}>{mode === "signup" ? "Start Free Trial" : "Welcome Back"}</div>
            <div className="mo" style={{ fontSize: 9, color: "var(--t2)", letterSpacing: ".1em" }}>OVERSIZE ESCORT HUB</div>
          </div>
        </div>
        {mode === "signup" && (
          <div style={{ display: "flex", border: "1px solid var(--l1)", borderRadius: 3, overflow: "hidden", marginBottom: 20 }}>
            {(["escort", "carrier", "broker"] as const).map((r) => (
              <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: "10px 0", background: role === r ? (r === "escort" ? "var(--am)" : "var(--or)") : "transparent", color: role === r ? "#000" : "var(--t2)", border: "none", fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase" as const, fontWeight: 700 }}>
                {r === "escort" ? "Escort / P/EVO" : "Carrier / Operator"}
              </button>
            ))}
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
            {mode === "signup" ? "Sign In" : "Start Free Trial"}
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
              I agree to receive texts from (214) 949-4213 about oversize load escort services. Mobile information will not be shared with third parties/affiliates for marketing/promotional purposes. Text messaging originator opt-in data and consent will not be shared with any third parties. Message frequency varies. Message and data rates apply. Reply HELP for more information. Reply STOP to opt out. Privacy Policy can be found{" "}
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
          30-day free trial · No credit card required<br />
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
  const tools = [
    { page: "invoice", icon: "🧾", title: "Invoice Generator", desc: "Create and send professional invoices to carriers", badge: "MEMBER" },
    { page: "expenses", icon: "📊", title: "Expense Tracker", desc: "Log jobs and expenses, export CSV/PDF for taxes", badge: "MEMBER" },
    { page: "job-history", icon: "📋", title: "Job History", desc: "View completed loads and earnings history", badge: "MEMBER" },
    { page: "permits", icon: "📄", title: "Permit Hub", desc: "Upload and receive permits day of load instantly", badge: "ALL" },
    { page: "deadhead", icon: "🚗", title: "Stop Driving Home Empty", desc: "Find return loads and recover ~$4,800/yr", badge: "PRO" },
    { page: "dot-lookup", icon: "🔍", title: "DOT Carrier Lookup", desc: "Verify carrier safety rating via FMCSA free API", badge: "MEMBER" },
    { page: "state-reqs", icon: "🗺️", title: "State Escort Requirements", desc: "Escort requirements by state and load dimensions", badge: "MEMBER" },
    { page: "weather", icon: "⛅", title: "Weather Alerts", desc: "Weather conditions on your route via NWS free API", badge: "MEMBER" },
    { page: "cb-radio", icon: "📻", title: "CB Radio Reference", desc: "Standard CB channels by state and highway", badge: "ALL" },
    { page: "fuel-calc", icon: "⛽", title: "Fuel Cost Estimator", desc: "Current diesel prices and trip fuel cost estimate", badge: "MEMBER" },
    { page: "per-diem", icon: "💰", title: "Per Diem Calculator", desc: "IRS standard rates for tax deductions", badge: "MEMBER" },
    { page: "cert-tracker", icon: "🏅", title: "Cert Expiry Tracker", desc: "Track cert expiry with 30-day SMS alerts", badge: "ALL" },
    { page: "factoring", icon: "💳", title: "Invoice Factoring", desc: "Get paid fast via partner factoring network", badge: "SOON" },
  ];
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
function PermitHubPage({ setPage, user, profile }: any) { return <Stub title="Permit Hub" icon="📄" desc="Carriers upload permits to your load. You get an instant SMS the moment they upload — even if it happens 6am day of load." back="tools" setPage={setPage} />; }
function DeadheadPage({ setPage, profile }: any) {
  const isPro = profile?.subscription_tier === "pro"
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
      // Geocode with Nominatim then fetch nearby loads
      const [city, state] = location.split(",").map(s => s.trim())
      const res = await fetch(`/api/loads?board=flat_rate`)
      const data = await res.json()
      const nearby = (data.loads ?? []).filter((l: any) =>
        l.pickup_state?.toLowerCase() === (state || city)?.toLowerCase()
      ).slice(0, 10)
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
            <button style={{ ...S.btn, fontSize: 16 }} onClick={() => setPage("pricing")}>Upgrade to Pro — $29.99/mo</button>
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
                        <p style={{ margin: 0, fontWeight: 700 }}>{load.pickup_city}, {load.pickup_state} → {load.delivery_city}, {load.delivery_state}</p>
                        {load.rate_per_mile && <p style={{ color: "#00a8e8", margin: "4px 0 0", fontSize: 13 }}>${load.rate_per_mile}/mi</p>}
                        {load.boards?.length > 1 && <p style={{ color: "#666", fontSize: 11, marginTop: 4 }}>Also on: {load.boards.filter((b: string) => b !== "flat_rate").join(" · ")}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mode === "fleet" && (
              <div>
                <p style={{ color: "#aaa", marginBottom: 4, fontSize: 14 }}>Add up to 5 escort slots. Results show matching loads near each escort's location separately.</p>
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
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{load.pickup_city}, {load.pickup_state} → {load.delivery_city}, {load.delivery_state}</p>
                          {load.rate_per_mile && <p style={{ color: "#00a8e8", margin: "4px 0 0", fontSize: 13 }}>${load.rate_per_mile}/mi</p>}
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
function CertTrackerPage({ setPage, profile }: any) { return <Stub title="Cert Expiry Tracker" icon="🏅" desc="Track all your cert expiry dates. Get a 30-day SMS reminder before any cert lapses. Never lose a job because of an expired cert." back="tools" setPage={setPage} />; }
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
  async function fetchBgcQueue() {
    const { data } = await supabase.from('profiles').select('*').eq('bgc_pending', true)
    setBgcQueue(data || [])
  }
  async function approveBgc(id: string) {
    await supabase.from('profiles').update({ bgc_verified: true, bgc_pending: false }).eq('id', id)
    fetchBgcQueue()
  }
  async function denyBgc(id: string) {
    await supabase.from('profiles').update({ bgc_pending: false }).eq('id', id)
    fetchBgcQueue()
  }
  useEffect(() => { fetchBgcQueue() }, [])

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
        {[["👥","Total Users","0","var(--am)"],["✅","Members","0","var(--gr)"],["⭐","Pro Members","0","var(--or)"],["💰","MRR","$0","var(--am)"],["🔍","BGC Pending","0","var(--or)"],["📋","Certs Pending","0","var(--or)"]].map(([icon,label,val,color]) => (
          <div key={label as string} className="card" style={{ padding: 18, textAlign: "center" }}>
            <div style={{ fontSize: 22 }}>{icon}</div>
            <div className="bb" style={{ fontSize: 22, color: color as string, marginTop: 6 }}>{val}</div>
            <div className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {["Users","BGC Queue","Certs Queue","Revenue","Refunds","Loads","SMS Blast","Settings"].map(t => (
          <button key={t} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>{t}</button>
        ))}
      </div>
      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <p style={{ color: "var(--t2)", fontSize: 13 }}>Full admin functionality — user management, BGC approvals, cert verification, refunds, revenue dashboard — building now.</p>
        <div style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 8, padding: "14px 24px", marginTop: 20, display: "inline-block" }}>
          <span className="mo" style={{ fontSize: 10, color: "var(--or)" }}>BUILDING NOW — AVAILABLE SOON</span>
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

export default function OEHPlatform() {
  const [page, setPage] = useState<Page>("home");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "gr" | "rd" | "am" } | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [reviewPrompt, setReviewPrompt] = useState<{loadId:string,targetName:string,targetId:string}|null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
    
  function showToast(msg: string, type: "gr" | "rd" | "am") {
    setToast({ msg, type });
  }

  async function loadProfile(userId: string) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) setProfile(data as Profile);
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
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
      <Nav page={page} setPage={setPage} user={user} profile={profile} onSignOut={handleSignOut} />
      {page === "home" && <HomePage setPage={setPage} user={user} profile={profile} />}
      {page === "signin" && <SignInPage setPage={setPage} showToast={showToast} />}
      
          {/* MEMBER PERKS SECTION - desktop only */}
          <div className="hidden md:block" style={{ background: "var(--bg2,#0a0a0a)", padding: "60px 0", borderTop: "1px solid var(--l1,#222)", borderBottom: "1px solid var(--l1,#222)" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
              <div style={{ textAlign: "center", marginBottom: 36 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--or,#f60)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>MEMBER PERKS — BUILT FOR THE ROAD</p>
                <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Benefits That Travel With You</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                {/* Upside */}
                <div style={{ background: "var(--card,#111)", border: "1px solid var(--l1,#222)", borderLeft: "3px solid var(--or,#f60)", borderRadius: 10, padding: 28 }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>⛽</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Save on Every Fill-Up</div>
                  <p style={{ fontSize: 12, color: "var(--t2,#888)", lineHeight: 1.7, marginBottom: 16 }}>
                    OEH members earn real cash back on fuel through Upside. The average escort saves $600+/year just by activating their free account.
                  </p>
                  <a href="https://upside.app.link/OEH" target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-block", background: "var(--or,#f60)", color: "#000", fontWeight: 700, fontSize: 12, padding: "10px 20px", borderRadius: 6, textDecoration: "none" }}>
                    Activate Fuel Savings →
                  </a>
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
          {page === "pricing" && <PricingPage setPage={setPage} />}
      {page === "verification" && <VerificationPage />}
      {page === "flatboard" && <FlatBoardPage setPage={setPage} user={user} profile={profile} showToast={showToast} />}
      {page === "bidboard" && <BidBoardPage setPage={setPage} user={user} profile={profile} showToast={showToast} />}
      {page === "openboard" && <OpenBidPage setPage={setPage} user={user} profile={profile} showToast={showToast} />}
      {page === "escorts" && <EscortsPage setPage={setPage} />}
      {page === "escprofile" && <EscProfilePage setPage={setPage} />}
      {page === "postload" && <PostLoadPage setPage={setPage} user={user} profile={profile} showToast={showToast} />}
        {page === "dashboard-c" && <CarrierDashPage setPage={setPage} user={user} profile={profile} showToast={showToast} />}
        {page === "dashboard-e" && <EscortDashPage setPage={setPage} profile={profile} />}
        {page === "admin" && <AdminPage setPage={setPage} user={user} profile={profile} />}
      <Footer setPage={setPage} />
      {reviewPrompt && (<div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}><div className="card" style={{ maxWidth:440, width:'100%', padding:28 }}><div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>⭐ How was your experience?</div><div style={{ fontSize:13, color:'var(--t2)', marginBottom:16 }}>Leave a review for {reviewPrompt.targetName}</div><div style={{ display:'flex', gap:8, marginBottom:16 }}>{[1,2,3,4,5].map(n => (<button key={n} onClick={() => setReviewRating(n)} style={{ fontSize:24, background:'none', border:'none', cursor:'pointer', opacity: n <= reviewRating ? 1 : 0.3 }}>⭐</button>))}</div><textarea value={reviewText} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewText(e.target.value)} placeholder="Optional written review (500 chars max)" maxLength={500} style={{ width:'100%', minHeight:80, padding:10, borderRadius:6, border:'1px solid var(--l2)', background:'var(--bg)', color:'var(--t1)', fontSize:13, resize:'vertical', marginBottom:16 }} /><div style={{ display:'flex', gap:10 }}><button className="btn btn-or" disabled={reviewSubmitting} onClick={async () => { setReviewSubmitting(true); await fetch('/api/reviews', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ load_id: reviewPrompt.loadId, target_id: reviewPrompt.targetId, rating: reviewRating, text: reviewText }) }); setReviewSubmitting(false); setReviewPrompt(null); setReviewRating(5); setReviewText(''); showToast('Thanks for your review!', 'gr') }}>{reviewSubmitting ? 'Submitting…' : 'Submit Review'}</button><button className="btn" onClick={() => setReviewPrompt(null)}>Skip</button></div></div></div>)}
      {reviewPrompt && (<div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}><div className="card" style={{ maxWidth:440, width:'100%', padding:28 }}><div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>How was your experience?</div><div style={{ fontSize:13, color:'var(--t2)', marginBottom:16 }}>Leave a review for {reviewPrompt.targetName}</div><div style={{ display:'flex', gap:8, marginBottom:16 }}>{[1,2,3,4,5].map(n => (<button key={n} onClick={() => setReviewRating(n)} style={{ fontSize:24, background:'none', border:'none', cursor:'pointer', opacity: n <= reviewRating ? 1 : 0.3 }}>*</button>))}</div><textarea value={reviewText} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewText(e.target.value)} placeholder="Optional written review (500 chars max)" maxLength={500} style={{ width:'100%', minHeight:80, padding:10, borderRadius:6, border:'1px solid var(--l2)', background:'var(--bg)', color:'var(--t1)', fontSize:13, resize:'vertical', marginBottom:16 }} /><div style={{ display:'flex', gap:10 }}><button className="btn btn-or" disabled={reviewSubmitting} onClick={async () => { setReviewSubmitting(true); await fetch('/api/reviews', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ load_id: reviewPrompt.loadId, target_id: reviewPrompt.targetId, rating: reviewRating, text: reviewText }) }); setReviewSubmitting(false); setReviewPrompt(null); setReviewRating(5); setReviewText(''); showToast('Thanks for your review!', 'gr') }}>{reviewSubmitting ? 'Submitting...' : 'Submit Review'}</button><button className="btn" onClick={() => setReviewPrompt(null)}>Skip</button></div></div></div>)} {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
