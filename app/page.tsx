"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Role = "carrier" | "escort" | "broker" | "admin" | null;
type Page = "home" | "flatboard" | "openboard" | "bidboard" | "escorts" | "escprofile" | "dashboard-e" | "dashboard-c" | "dashboard-b" | "postload" | "pricing" | "verification" | "signin" | "invoice" | "expenses" | "job-history" | "permits" | "deadhead" | "admin" | "dot-lookup" | "state-reqs" | "weather" | "cb-radio" | "fuel-calc" | "per-diem" | "cert-tracker" | "factoring" | "tools";

type Profile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  role: "escort" | "carrier" | "admin";
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
  { id: "pro", name: "Pro", price: 29.99, sub: "per month", color: "#f5a200", features: ["SMS instant on bid loads (60s head start)", "Deadhead Minimizer + return load feed", "I'm Available broadcast", "Deadhead calculator + savings dashboard", "Invoice generator", "First cert verification free"], daily: 4.99, popular: true, carrierPro: null },
  { id: "carrier", name: "Carrier Member", price: 9.99, sub: "per month", color: "#00cc7a", features: ["Post unlimited loads free", "Permit Management Hub", "True Cost Per Load Tracker", "Preferred Escort Network", "Quick Rebook (3+ jobs same escort)"], daily: null, popular: false, carrierPro: 19.99 },
];

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

.ticker{height:28px;background:#030507;border-bottom:1px solid var(--l1);overflow:hidden;display:flex;align-items:center}
.ticker-track{display:flex;animation:scrolltick 90s linear infinite;white-space:nowrap}
.tick-item{display:inline-flex;align-items:center;gap:8px;padding:0 28px;border-right:1px solid var(--l1);height:28px;font-family:'DM Mono',monospace;font-size:10px;color:var(--t2);letter-spacing:.05em}
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
    ["openboard", "Open Bids"],
    ["escorts", "Find Escorts"],
    ["postload", "Post a Load"],
    ["pricing", "Pricing"],
    ["verification", "Verification"],
    ["bidboard", "Bid Board"],
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
            {profile.full_name || "there"}{" · "}
            <span style={{ color: "var(--or)", fontSize: 8 }}>{profile.tier?.toUpperCase()}</span>{" "}
            <button className="nav-signout" onClick={onSignOut}>SIGN OUT</button>
            <button className="nav-signout" style={{ marginLeft: 4 }} onClick={() => setPage(profile.role === "carrier" ? "dashboard-c" : "dashboard-e")}>DASHBOARD →</button>
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
                  <button className="drawer-link" onClick={() => { setPage(profile.role === "carrier" ? "dashboard-c" : "dashboard-e"); closeDrawer(); }}>→ Dashboard</button>
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
        <span>© 2026 Oversize Escort Hub. All rights reserved.</span>
        <span style={{ color: "var(--or)", letterSpacing: ".1em" }}>NO COMMISSIONS · NO JOB FEES · EVER</span>
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
            <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.8, marginBottom: 20 }}>Owner operators &amp; carriers who need verified P/EVO escorts for oversize loads.</p>
            <div className="mo" style={{ fontSize: 10, color: "var(--or)", letterSpacing: ".1em" }}>POST LOADS · BID BOARD · FIND ESCORTS →</div>
          </div>
          <div className="role-card" style={{ border: "2px solid var(--am)" }} onClick={() => setRole("escort")}>
            <div className="bb" style={{ fontSize: 34, color: "var(--am)", marginBottom: 10 }}>PILOT CAR / P/EVO</div>
            <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.8, marginBottom: 20 }}>Licensed pilot car escorts &amp; P/EVO operators looking for oversize loads to run.</p>
            <div className="mo" style={{ fontSize: 10, color: "var(--am)", letterSpacing: ".1em" }}>FIND LOADS · DEADHEAD MINIMIZER · BID →</div>
          </div>
        </div>
        <button className="mo" style={{ marginTop: 28, background: "none", border: "none", color: "var(--t3)", fontSize: 10, letterSpacing: ".1em", cursor: "pointer" }} onClick={() => setRole("carrier")}>
          <div className="role-card" style={{ border: "2px solid var(--t2)", marginTop: 12 }} onClick={() => setRole("broker")}>
            <div className="bb" style={{ fontSize: 34, color: "var(--t2)", marginBottom: 10 }}>FREIGHT BROKER</div>
            <p style={{ fontSize: 11, color: "var(--t2)", lineHeight: 1.5, marginBottom: 16 }}>Licensed freight brokers who need verified P/EVO escorts for oversize shipments.</p>
            <div className="mo" style={{ fontSize: 9, color: "var(--t2)", letterSpacing: ".1em" }}>POST LOADS · FIND ESCORTS · MANAGE SHIPMENTS →</div>
          </div>
          Browse as guest →
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
          <button className="mo" style={{ background: "none", border: "none", color: "var(--or)", fontSize: 9, cursor: "pointer" }} onClick={() => setPage(profile.role === "carrier" ? "dashboard-c" : "dashboard-e")}>
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

function FlatBoardPage({ setPage }: { setPage: (p: Page) => void }) {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState("ALL");
  const [posFilter, setPosFilter] = useState("ALL");

  useEffect(() => {
    async function fetchLoads() {
      const { data } = await supabase
        .from("loads")
        .select("*")
        .eq("board_type", "flat")
        .order("created_at", { ascending: false });
      if (data && data.length > 0) {
        setLoads(data);
      } else {
        setLoads(SEED_LOADS);
      }
      setLoading(false);
    }
    fetchLoads();
  }, []);

  const filtered = loads.filter(l => {
    if (stateFilter !== "ALL" && l.pu_state !== stateFilter && l.dl_state !== stateFilter) return false;
    if (posFilter !== "ALL" && l.position !== posFilter) return false;
    return true;
  });

  const hasSamples = loads.some(l => l.isSample);

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="eyebrow" style={{ color: "var(--gr)" }}>Live Board</div>
          <div className="section-title">FLAT RATE LOAD BOARD</div>
        </div>
        <button className="btn btn-or btn-sm" onClick={() => setPage("postload")}>+ Post a Load</button>
      </div>
      {hasSamples && <EarlyBanner role="escort" />}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" as const }}>
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
          <option value="ALL">All States</option>
          {["TX", "FL", "CA", "TN", "OH", "AZ", "GA", "IL", "OK", "LA", "NV", "AL", "NM"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={posFilter} onChange={(e) => setPosFilter(e.target.value)}>
          <option value="ALL">All Positions</option>
          <option value="Lead">Lead</option><option value="Rear">Rear</option><option value="Lead+Rear">Lead+Rear</option>
        </select>
        <select><option>All Pay Terms</option><option>FastPay Only</option><option>7-Day</option><option>10-Day</option></select>
      </div>
      {loading ? (
        <div className="mo" style={{ fontSize: 10, color: "var(--t2)", padding: "20px 0" }}>Loading loads...</div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr><th>Load ID</th><th>Route</th><th>Miles</th><th>Rate</th><th>Est. Pay</th><th>Position</th><th>Certs</th><th>Pay Terms</th><th>Pay Score</th><th>Contact</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} style={{ opacity: l.status === "filled" ? 0.42 : 1 }}>
                  <td className="mo" style={{ color: "var(--t2)", fontSize: 9 }}>
                    {l.isSample ? `SAMPLE` : l.id.slice(0, 8).toUpperCase()}
                    {l.isSample && <SampleBadge />}
                  </td>
                  <td style={{ fontWeight: 500, fontSize: 12 }}>{l.pu_city}, {l.pu_state} → {l.dl_city}, {l.dl_state}</td>
                  <td className="mo">{l.miles}</td>
                  <td className="mo" style={{ color: "var(--gr)", fontWeight: 600 }}>${l.per_mile_rate.toFixed(2)}/mi</td>
                  <td className="mo" style={{ color: "var(--gr)" }}>${((l.miles || 0) * l.per_mile_rate).toFixed(0)}</td>
                  <td style={{ fontSize: 10 }}>{l.position}</td>
                  <td>
                    {l.requires_p_evo && <span className="chip ch-dim" style={{ marginRight: 3 }}>P/EVO</span>}
                    {l.requires_witpac && <span className="chip ch-dim" style={{ marginRight: 3 }}>Witpac</span>}
                    {l.requires_twic && <span className="chip ch-dim" style={{ marginRight: 3 }}>TWIC</span>}
                    {l.requires_ny_cert && <span className="chip ch-dim" style={{ marginRight: 3 }}>NY</span>}
                  </td>
                  <td>{l.pay_type === "FastPay" ? <span className="chip ch-gr">⚡ FastPay</span> : <span className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>{l.pay_type || "7-Day"}</span>}</td>
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

// ─── BID BOARD PAGE ───────────────────────────────────────────────────────────

function BidBoardPage({ setPage }: { setPage: (p: Page) => void }) {
  const [timers, setTimers] = useState<Record<string, number>>(
    Object.fromEntries(SEED_BID_LOADS.map((l) => [l.id, l.timer]))
  );
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => { if (next[k] > 0) next[k]--; });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function fmtTimer(s: number) {
    if (s <= 0) return "0:00";
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div className="section">
      <div style={{ background: "var(--p2)", border: "1px solid var(--l1)", borderLeft: "3px solid var(--am)", borderRadius: 4, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
        <img src="/bid.png" alt="Bid Board" style={{ width: 52, height: 52, objectFit: "contain", flexShrink: 0 }} />
        <div>
          <div className="bb" style={{ fontSize: 22, color: "var(--am)", marginBottom: 6 }}>5-MINUTE BID BOARD</div>
          <p className="mo" style={{ fontSize: 10, color: "var(--t2)", lineHeight: 1.75 }}>
            Closes when: <span style={{ color: "var(--am)" }}>① Timer hits zero</span> · <span style={{ color: "var(--gr)" }}>② Carrier fills it</span> · <span style={{ color: "var(--t2)" }}>③ Carrier cancels</span><br />
            <span style={{ color: "var(--am)" }}>Pro:</span> SMS instant · <span style={{ color: "var(--bl)" }}>Member:</span> 60s delay · <span style={{ color: "var(--t2)" }}>Free:</span> View only
          </p>
        </div>
      </div>
      <EarlyBanner role="escort" />
      <div style={{ display: "grid", gap: 12 }}>
        {SEED_BID_LOADS.map((l) => {
          const t = timers[l.id] ?? 0;
          const isLive = l.status === "live" && t > 0;
          const timerCls = t > 60 ? "timer-am" : "timer-red";
          return (
            <div key={l.id} className="card" style={{ borderColor: isLive ? "var(--am)" : "var(--l1)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" as const }}>
                  <div>
                    <div className="mo" style={{ fontSize: 9, color: "var(--t2)", marginBottom: 2 }}>
                      {l.id} {l.isSample && <SampleBadge />}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{l.from} → {l.to}</div>
                    <div className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>{l.mi} mi · {l.pos}</div>
                  </div>
                  <div>
                    <div className="bb" style={{ fontSize: 26, color: "var(--gr)", lineHeight: 1 }}>${l.rate.toFixed(2)}/mi</div>
                    <div className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>Ceiling rate</div>
                  </div>
                  <div>
                    <PayScore score={l.score} />
                    <div className="mo" style={{ fontSize: 9, color: "var(--t2)", marginTop: 3 }}>Carrier Pay Score</div>
                  </div>
                  <div>
                    <div className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>{l.bids} bids placed</div>
                    <div>{l.certs.map((c) => <span key={c} className="chip ch-dim" style={{ marginRight: 3 }}>{c}</span>)}</div>
                  </div>
                </div>
                <div style={{ textAlign: "center", minWidth: 120 }}>
                  {isLive && (
                    <>
                      <div className={`bid-timer ${timerCls}`}>{fmtTimer(t)}</div>hh
                      <div className="mo" style={{ fontSize: 8, color: "var(--t2)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Time Remaining</div>
                      <button className="btn btn-am btn-sm" style={{ width: "100%" }} onClick={() => setPage("pricing")}>🔒 BID (MEMBER)</button>
                    </>
                  )}
                  {!isLive && <span className="chip ch-dim" style={{ fontSize: 11, padding: "6px 14px" }}>EXPIRED</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 16 }}><LockBar setPage={setPage} /></div>
    </div>
  );
}

// ─── OPEN BID PAGE ────────────────────────────────────────────────────────────

function OpenBidPage({ setPage }: { setPage: (p: Page) => void }) {
  const OPEN_BIDS = [
    { id: "OB-331", from: "Houston, TX", to: "New Orleans, LA", mi: 349, rate: 2.00, pos: "Lead", certs: ["P/EVO"], score: 4.6, bids: 6, closes: "18h 22m", minPay: 1.75, maxPay: 2.00 },
    { id: "OB-288", from: "Chicago, IL", to: "Detroit, MI", mi: 281, rate: 2.00, pos: "Lead+Rear", certs: ["P/EVO", "TWIC"], score: 4.8, bids: 9, closes: "22h 05m", minPay: 1.70, maxPay: 2.00 },
    { id: "OB-299", from: "Atlanta, GA", to: "Charlotte, NC", mi: 244, rate: 2.00, pos: "Rear", certs: ["P/EVO"], score: 4.4, bids: 4, closes: "41h 10m", minPay: 1.80, maxPay: 2.00 },
  ];
  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="eyebrow" style={{ color: "var(--bl)" }}>24-72 Hour Window</div>
          <div className="section-title">OPEN BID BOARD</div>
        </div>
        <button className="btn btn-or btn-sm" onClick={() => setPage("postload")}>+ Post a Load</button>
      </div>
      <EarlyBanner role="escort" />
      <div className="ob-grid">
        {OPEN_BIDS.map((l) => (
          <div key={l.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div className="mo" style={{ fontSize: 9, color: "var(--t2)", marginBottom: 3 }}>{l.id} <SampleBadge /></div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{l.from}</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--t2)" }}>→ {l.to}</div>
              </div>
              <span className="chip ch-bl">OPEN BID</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[["Miles", `${l.mi} mi`], ["Ceiling", `$${l.rate.toFixed(2)}/mi`], ["Position", l.pos], ["Bids In", `${l.bids} bids`], ["Bid Range", `$${l.minPay}–$${l.maxPay}/mi`], ["Closes", l.closes]].map(([lbl, val]) => (
                <div key={lbl}>
                  <div className="mo" style={{ fontSize: 8, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--t2)", marginBottom: 2 }}>{lbl}</div>
                  <div className="mo" style={{ fontSize: 11, color: "var(--t1)", fontWeight: 500 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <PayScore score={l.score} />
              <div>{l.certs.map((c) => <span key={c} className="chip ch-dim" style={{ marginLeft: 4 }}>{c}</span>)}</div>
            </div>
            <textarea placeholder="Add your bid note / pitch to carrier..." style={{ width: "100%", minHeight: 56, resize: "vertical", marginBottom: 8, fontSize: 11 }} />
            <input placeholder="Your bid ($/mi) — max $2.00/mi" style={{ width: "100%", marginBottom: 8 }} />
            <button className="btn btn-or btn-sm" style={{ width: "100%" }} onClick={() => setPage("pricing")}>🔒 SUBMIT BID (MEMBER)</button>
          </div>
        ))}
      </div>
      <LockBar setPage={setPage} />
    </div>
  );
}

// ─── ESCORTS PAGE ─────────────────────────────────────────────────────────────

function EscortsPage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="eyebrow" style={{ color: "var(--gr)" }}>Verified P/EVO Directory</div>
          <div className="section-title">FIND ESCORTS</div>
        </div>
      </div>
      <EarlyBanner role="carrier" />
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" as const }}>
        <select><option>All States</option><option>Texas</option><option>Arizona</option><option>Georgia</option><option>Tennessee</option></select>
        <select><option>All Certifications</option><option>P/EVO Verified</option><option>Witpac</option><option>NY</option><option>TWIC</option></select>
        <select><option>All Tiers</option><option>Admin Verified</option><option>Background Checked</option><option>Vehicle Verified</option></select>
        <select><option>Sort: Highest Rated</option><option>Most Jobs</option><option>Fastest Response</option></select>
      </div>
      <div className="esc-grid">
        {SEED_ESCORTS.map((e) => <EscortCard key={e.id} e={e} setPage={setPage} />)}
      </div>
    </div>
  );
}

// ─── ESC PROFILE PAGE ─────────────────────────────────────────────────────────

function EscProfilePage({ setPage }: { setPage: (p: Page) => void }) {
  const e = SEED_ESCORTS[0];
  return (
    <div className="section">
      <div className="mo" style={{ fontSize: 9, color: "var(--am)", marginBottom: 16 }}>⚠ Sample profile — real escort profiles will appear here</div>
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
        <div>
          <div className="card" style={{ marginBottom: 10 }}>
            <div className="bb" style={{ fontSize: 28, color: "var(--am)", marginBottom: 2 }}>{e.name}</div>
            <div className="mo" style={{ fontSize: 11, color: "var(--t2)", marginBottom: 12 }}>{e.co} · {e.loc}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const, marginBottom: 12 }}>
              {e.badges.map((b) => <span key={b} className="chip ch-gr">✓ {b}</span>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14, padding: "10px 0", borderTop: "1px solid var(--l1)", borderBottom: "1px solid var(--l1)" }}>
              {[{ n: e.jobs.toString(), l: "Jobs", c: "var(--t1)" }, { n: e.rating.toString(), l: "Rating", c: "var(--gr)" }, { n: `${e.rel}%`, l: "Reliability", c: "var(--bl)" }].map((s) => (
                <div key={s.l} style={{ textAlign: "center" }}>
                  <div className="bb" style={{ fontSize: 22, color: s.c, lineHeight: 1 }}>{s.n}</div>
                  <div className="mo" style={{ fontSize: 8, color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".08em" }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div className="mo" style={{ fontSize: 10, color: "var(--t2)", marginBottom: 6 }}>Vehicle: {e.vehicle}</div>
            <div className="mo" style={{ fontSize: 10, color: "var(--t2)", marginBottom: 10 }}>Licensed: {e.states.join(", ")}</div>
            <button className="btn btn-or btn-sm" style={{ width: "100%" }} onClick={() => setPage("pricing")}>🔒 Contact (Member)</button>
          </div>
        </div>
        <div className="card">
          <div className="mo" style={{ fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--t2)", marginBottom: 12 }}>Reviews ({e.reviewCount})</div>
          {[
            { carrier: "Lone Star Oversize LLC", score: 5.0, date: "Mar 18, 2026", text: "Showed up early, had all equipment, communicated throughout the load." },
            { carrier: "Gulf Coast Transport LLC", score: 5.0, date: "Mar 11, 2026", text: "Third time using. Never a problem. Platform rank is accurate." },
          ].map((r) => (
            <div key={r.date} style={{ padding: "14px 0", borderBottom: "1px solid var(--l1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{r.carrier}</span>
                <span className="chip ch-gr">{r.score} ⭐</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.7 }}>{r.text}</p>
              <div className="mo" style={{ fontSize: 9, color: "var(--t3)", marginTop: 6 }}>{r.date}</div>
            </div>
          ))}
        </div>
      </div>
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
  const [boardType, setBoardType] = useState<"flat" | "bid" | "open">("flat");
  const [form, setForm] = useState({
    puCity: "", puState: "", dlCity: "", dlState: "",
    miles: "", rate: "2.00", position: "Lead", payType: "FastPay",
    width: "", height: "", weight: "", notes: "", startDate: "",
    reqPevo: true, reqWitpac: false, reqNy: false, reqTwic: false,
  });
  const [saving, setSaving] = useState(false);

  function set(k: string, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSubmit() {
    if (!user || !profile) { setPage("signin"); return; }
    if (!form.puCity || !form.puState || !form.dlCity || !form.dlState) {
      showToast("Please fill in origin and destination", "rd"); return;
    }
    setSaving(true);
    const { error } = await supabase.from("loads").insert({
      carrier_id: user.id,
      board_type: boardType,
      pu_city: form.puCity,
      pu_state: form.puState.toUpperCase(),
      dl_city: form.dlCity,
      dl_state: form.dlState.toUpperCase(),
      miles: parseInt(form.miles) || null,
      position: form.position,
      pay_type: form.payType,
      per_mile_rate: parseFloat(form.rate) || 2.00,
      day_rate: 500,
      overnight_fee: 100,
      no_go_fee: 250,
      requires_p_evo: form.reqPevo,
      requires_witpac: form.reqWitpac,
      requires_ny_cert: form.reqNy,
      requires_twic: form.reqTwic,
      load_width: parseFloat(form.width) || null,
      load_height: parseFloat(form.height) || null,
      load_weight: parseFloat(form.weight) || null,
      notes: form.notes || null,
      start_date: form.startDate || null,
      status: "open",
      poster_company: profile.company_name,
      poster_rating: profile.rating || null,
      poster_jobs: profile.total_jobs || null,
    });
    setSaving(false);
    if (error) {
      showToast("Error posting load: " + error.message, "rd");
    } else {
      showToast("Load posted successfully!", "gr");
      setPage("flatboard");
    }
  }

  return (
    <div className="postload-wrap">
      <div className="bb" style={{ fontSize: 28, marginBottom: 4 }}>POST A LOAD</div>
      <p className="mo" style={{ fontSize: 10, color: "var(--t2)", marginBottom: 16 }}>Free for all carriers. Choose your board type.</p>
      <div style={{ background: "rgba(0,204,122,.07)", border: "1px solid rgba(0,204,122,.2)", borderRadius: 3, padding: "10px 16px", marginBottom: 24 }} className="mo">
        <span style={{ fontSize: 10, color: "var(--gr)" }}>📋 Standard Rates: </span>
        <span style={{ fontSize: 10, color: "var(--t2)" }}>$2.00/mi or $500/day · $100 overnight · $250 no-go (auto-applied)</span>
      </div>
      {!user && (
        <div style={{ background: "rgba(255,98,0,.08)", border: "1px solid rgba(255,98,0,.2)", borderRadius: 3, padding: "12px 16px", marginBottom: 20 }}>
          <span className="mo" style={{ fontSize: 10, color: "var(--or)" }}>You need an account to post loads. </span>
          <button className="mo" style={{ background: "none", border: "none", color: "var(--or)", fontSize: 10, cursor: "pointer", textDecoration: "underline" }} onClick={() => setPage("signin")}>Sign up free →</button>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {([["flat", "var(--gr)", "First to respond wins"], ["bid", "var(--am)", "5-min price competition"], ["open", "var(--bl)", "You pick the escort"]] as const).map(([type, c, desc]) => (
          <div key={type} className="card" style={{ flex: 1, borderTop: `2px solid ${c}`, cursor: "pointer", opacity: boardType === type ? 1 : 0.5 }} onClick={() => setBoardType(type)}>
            <div className="bb" style={{ fontSize: 16, color: c, marginBottom: 4 }}>{type === "flat" ? "Flat Rate" : type === "bid" ? "5-Min Bid" : "Open Bid"}</div>
            <div className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>{desc}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {([["puCity", "Origin City", "text"], ["puState", "Origin State (abbr)", "text"], ["dlCity", "Destination City", "text"], ["dlState", "Destination State (abbr)", "text"], ["miles", "Total Miles", "number"], ["rate", "Rate ($/mi) — max $2.00", "number"], ["width", "Load Width (ft)", "number"], ["height", "Load Height (ft)", "number"], ["weight", "Load Weight (lbs)", "number"]] as [keyof typeof form, string, string][]).map(([k, label, type]) => (
          <div key={k} className="form-field">
            <label className="form-label">{label}</label>
            <input type={type} placeholder={label} value={form[k] as string} onChange={(e) => set(k, e.target.value)} style={{ width: "100%" }} />
          </div>
        ))}
        <div className="form-field">
          <label className="form-label">Position Required</label>
          <select style={{ width: "100%" }} value={form.position} onChange={(e) => set("position", e.target.value)}>
            <option>Lead</option><option>Rear</option><option value="Lead+Rear">Lead + Rear</option><option value="Lead+Rear+HighPole">Lead + Rear + High Pole</option>
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Pay Terms</label>
          <select style={{ width: "100%" }} value={form.payType} onChange={(e) => set("payType", e.target.value)}>
            <option>FastPay</option><option value="7-Day">7-Day</option><option value="10-Day">10-Day</option><option value="15-Day">15-Day</option>
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Preferred Start Date</label>
          <input type="date" style={{ width: "100%" }} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </div>
      </div>
      <div className="form-field" style={{ marginTop: 4 }}>
        <label className="form-label">Certifications Required</label>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const, marginTop: 6 }}>
          {([ ["reqPevo", "P/EVO"], ["reqWitpac", "Witpac"], ["reqNy", "NY Cert"], ["reqTwic", "TWIC"]] as [keyof typeof form, string][]).map(([k, label]) => (
            <label key={k} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={form[k] as boolean} onChange={(e) => set(k, e.target.checked)} style={{ width: "auto", padding: 0 }} />
              <span className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>{label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="form-field">
        <label className="form-label">Special Instructions / Notes</label>
        <textarea placeholder="Route details, access notes, timing requirements..." style={{ width: "100%", minHeight: 80 }} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button className="btn btn-or" onClick={handleSubmit} disabled={saving}>
          {saving ? "Posting..." : "Post Load Free →"}
        </button>
        <button className="btn btn-ghost" onClick={() => setPage("home")}>Cancel</button>
      </div>
    </div>
  );
}

// ─── DASHBOARDS ───────────────────────────────────────────────────────────────

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

  const tabs = [
    { id: "overview", label: "Overview" }, { id: "loads", label: "Available Loads" },
    { id: "dh", label: "Deadhead Minimizer" }, { id: "jobs", label: "My Jobs" },
    { id: "certs", label: "Certifications" }, { id: "dispute", label: "Dispute Center" },
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
      </div>
    </div>
  );
}

function CarrierDashPage({ setPage, user, profile }: { setPage: (p: Page) => void; user: User | null; profile: Profile | null }) {
  const [tab, setTab] = useState("overview");
  const [myLoads, setMyLoads] = useState<Load[]>([]);

  useEffect(() => {
    if (!user) return;
    async function fetchMyLoads() {
      const { data } = await supabase.from("loads").select("*").eq("carrier_id", user!.id).order("created_at", { ascending: false });
      if (data) setMyLoads(data);
    }
    fetchMyLoads();
  }, [user]);

  const tabs = [
    { id: "overview", label: "Overview" }, { id: "myloads", label: "My Loads" },
    { id: "escorts", label: "Find Escorts" }, { id: "permits", label: "Permit Hub" },
    { id: "dispute", label: "Dispute Center" },
  ];

  return (
    <div className="dash-grid">
      <div className="dash-nav">
        <div className="mo" style={{ fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--t3)", padding: "0 20px", marginBottom: 12 }}>Carrier Dashboard</div>
        {tabs.map((t) => (
          <div key={t.id} className={`dash-nav-item${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</div>
        ))}
        <div style={{ padding: "20px 20px 0", marginTop: 20, borderTop: "1px solid var(--l1)" }}>
          <div className={`chip ${profile?.tier === "carrier_member" ? "ch-or" : "ch-dim"}`} style={{ fontSize: 8, marginBottom: 8 }}>
            {(profile?.tier || "free").toUpperCase()}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{profile?.company_name || profile?.full_name || "Your Company"}</div>
          <div className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>Pay Score: New</div>
          {profile?.tier === "free" && (
            <button className="btn btn-or btn-sm" style={{ marginTop: 12, width: "100%", fontSize: 8 }} onClick={() => setPage("pricing")}>Upgrade →</button>
          )}
        </div>
      </div>
      <div className="dash-content">
        {tab === "overview" && (
          <>
            <div className="bb" style={{ fontSize: 24, marginBottom: 20 }}>OVERVIEW</div>
            <div className="metric-grid">
              {[[myLoads.length.toString(), "Total Loads Posted", "var(--or)"], [myLoads.filter(l => l.status === "open").length.toString(), "Active Loads", "var(--gr)"], ["New", "Carrier Pay Score", "var(--gr)"], ["—", "Avg Fill Time", "var(--bl)"]].map(([n, l, c]) => (
                <div key={l} className="metric">
                  <div className="metric-n" style={{ color: c }}>{n}</div>
                  <div className="metric-l">{l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <button className="btn btn-or btn-sm" onClick={() => setPage("postload")}>+ Post New Load</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage("escorts")}>Find Escorts</button>
            </div>
            {myLoads.length === 0 && (
              <div style={{ background: "rgba(255,98,0,.06)", border: "1px solid rgba(255,98,0,.15)", borderRadius: 4, padding: 24, textAlign: "center" }}>
                <div className="bb" style={{ fontSize: 24, color: "var(--or)", marginBottom: 8 }}>POST YOUR FIRST LOAD</div>
                <p className="mo" style={{ fontSize: 10, color: "var(--t2)", marginBottom: 16 }}>Be the first carrier in your region. Verified escorts are waiting.</p>
                <button className="btn btn-or" onClick={() => setPage("postload")}>Post a Load Free →</button>
              </div>
            )}
          </>
        )}
        {tab === "myloads" && (
          <>
            <div className="bb" style={{ fontSize: 24, marginBottom: 20 }}>MY LOADS</div>
            {myLoads.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div className="mo" style={{ fontSize: 11, color: "var(--t2)", marginBottom: 16 }}>No loads posted yet</div>
                <button className="btn btn-or btn-sm" onClick={() => setPage("postload")}>+ Post a Load</button>
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead><tr><th>Load ID</th><th>Route</th><th>Miles</th><th>Rate</th><th>Position</th><th>Board</th><th>Status</th></tr></thead>
                  <tbody>
                    {myLoads.map((l) => (
                      <tr key={l.id}>
                        <td className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>{l.id.slice(0, 8).toUpperCase()}</td>
                        <td style={{ fontWeight: 500, fontSize: 12 }}>{l.pu_city}, {l.pu_state} → {l.dl_city}, {l.dl_state}</td>
                        <td className="mo">{l.miles || "—"}</td>
                        <td className="mo" style={{ color: "var(--gr)" }}>${l.per_mile_rate.toFixed(2)}/mi</td>
                        <td style={{ fontSize: 10 }}>{l.position}</td>
                        <td><span className={`chip ${l.board_type === "flat" ? "ch-gr" : l.board_type === "bid" ? "ch-am" : "ch-bl"}`}>{l.board_type.toUpperCase()}</span></td>
                        <td>{l.status === "open" ? <span className="chip ch-gr">OPEN</span> : l.status === "filled" ? <span className="chip ch-dim">FILLED</span> : <span className="chip ch-rd">CANCELLED</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        {tab === "escorts" && (
          <>
            <div className="bb" style={{ fontSize: 24, marginBottom: 20 }}>FIND ESCORTS</div>
            <EarlyBanner role="carrier" />
            <div className="esc-grid">
              {SEED_ESCORTS.map((e) => <EscortCard key={e.id} e={e} setPage={setPage} />)}
            </div>
          </>
        )}
        {tab === "permits" && (
          <>
            <div className="bb" style={{ fontSize: 24, marginBottom: 20 }}>PERMIT MANAGEMENT HUB</div>
            <div className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>No permits tracked yet. Post a load and permits will appear here.</div>
          </>
        )}
        {tab === "dispute" && (
          <>
            <div className="bb" style={{ fontSize: 24, marginBottom: 20 }}>DISPUTE CENTER</div>
            <div className="mo" style={{ fontSize: 10, color: "var(--t2)", marginBottom: 16 }}>No open disputes.</div>
            <button className="btn btn-or btn-sm">+ File New Dispute</button>
          </>
        )}
      </div>
    </div>
  );
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
      {[
        { tier: "Tier 1", name: "P/EVO Verified", c: "var(--gr)", img: "/verified.png", desc: "Upload your current state P/EVO or EVO certification. Admin reviews and marks your profile. Expired certs are flagged." },
        { tier: "Tier 2", name: "Vehicle Verified", c: "var(--bl)", img: "/pending.png", desc: "Submit vehicle registration, insurance card (min $1M liability), and photo of your escort setup." },
        { tier: "Tier 3", name: "Background Checked", c: "var(--am)", img: "/pending.png", desc: "Run your own check through Checkr, Sterling, or First Advantage (under 90 days). Upload PDF. $14.99 Member / $9.99 Pro." },
        { tier: "Tier 4", name: "Admin Verified", c: "var(--or)", img: "/verified.png", desc: "Highest trust level. Requires all 3 previous tiers. Admin-verified escorts appear first in carrier searches." },
      ].map((v) => (
        <div key={v.tier} className="verify-tier" style={{ borderLeftColor: v.c }}>
          <div style={{ minWidth: 100, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <img src={v.img} alt={v.name} style={{ width: 48, height: 48, objectFit: "contain" }} />
            <div className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>{v.tier}</div>
            <div className="chip" style={{ background: "transparent", color: v.c, border: `1px solid ${v.c}`, fontSize: 9 }}>✓ {v.name}</div>
          </div>
          <p style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.75 }}>{v.desc}</p>
          <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>Start Verification</button>
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
            <input type="checkbox" style={{ marginTop: 2, accentColor: "var(--or)", flexShrink: 0, width: 14, height: 14 }} />
            <span style={{ fontSize: 10, color: "#e5e7eb", lineHeight: 1.7 }}>
              I agree to receive texts from (214) 949-4213 about oversize load escort services. Mobile information will not be shared with third parties/affiliates for marketing/promotional purposes. Text messaging originator opt-in data and consent will not be shared with any third parties. Message frequency varies. Message and data rates apply. Reply HELP for more information. Reply STOP to opt out. Privacy Policy can be found{" "}
              <a href="/privacy" style={{ color: "#60a5fa" }}>Privacy Policy</a> &amp;{" "}
              <a href="/terms" style={{ color: "#60a5fa" }}>Terms &amp; Conditions</a>.
            </span>
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
function DeadheadPage({ setPage, profile }: any) { return <Stub title="Stop Driving Home Empty" icon="🚗" desc="Find return loads going your home direction. The average escort recovers $4,800/yr with this feature. Pro members only." back="tools" setPage={setPage} />; }
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
function AdminPage({ setPage, user }: any) {
  if (!user || user.email !== "bahmed3170@gmail.com") {
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
      <Nav page={page} setPage={setPage} user={user} profile={profile} onSignOut={handleSignOut} />
      {page === "home" && <HomePage setPage={setPage} user={user} profile={profile} />}
      {page === "flatboard" && <FlatBoardPage setPage={setPage} />}
      {page === "bidboard" && <BidBoardPage setPage={setPage} />}
      {page === "openboard" && <OpenBidPage setPage={setPage} />}
      {page === "escorts" && <EscortsPage setPage={setPage} />}
      {page === "escprofile" && <EscProfilePage setPage={setPage} />}
      {page === "dashboard-e" && <EscortDashPage setPage={setPage} profile={profile} />}
      {page === "dashboard-c" && <CarrierDashPage setPage={setPage} user={user} profile={profile} />}
      {page === "postload" && <PostLoadPage setPage={setPage} user={user} profile={profile} showToast={showToast} />}
      {page === "pricing" && <PricingPage setPage={setPage} />}
      {page === "verification" && <VerificationPage />}
      {page === "signin" && <SignInPage setPage={setPage} showToast={showToast} />}
      {page === "tools" && <ToolsPage setPage={setPage} profile={profile} />}
      {page === "invoice" && <InvoicePage setPage={setPage} user={user} profile={profile} />}
      {page === "expenses" && <ExpensesPage setPage={setPage} user={user} profile={profile} />}
      {page === "job-history" && <JobHistoryPage setPage={setPage} />}
      {page === "permits" && <PermitHubPage setPage={setPage} user={user} profile={profile} />}
      {page === "deadhead" && <DeadheadPage setPage={setPage} profile={profile} />}
      {page === "admin" && <AdminPage setPage={setPage} user={user} />}
      {page === "dot-lookup" && <DotLookupPage setPage={setPage} />}
      {page === "state-reqs" && <StateReqsPage setPage={setPage} />}
      {page === "weather" && <WeatherPage setPage={setPage} />}
      {page === "cb-radio" && <CbRadioPage setPage={setPage} />}
      {page === "fuel-calc" && <FuelCalcPage setPage={setPage} />}
      {page === "per-diem" && <PerDiemPage setPage={setPage} />}
      {page === "cert-tracker" && <CertTrackerPage setPage={setPage} profile={profile} />}
      {page === "factoring" && <FactoringPage setPage={setPage} />}
      <Footer setPage={setPage} />
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
