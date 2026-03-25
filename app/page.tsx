"use client";
import { useState, useEffect, useRef } from "react";

// ─── DATA ───────────────────────────────────────────────────────────────────

const FLAT_LOADS = [
  { id: "FL-4481", from: "Jacksonville, FL", to: "Montgomery, AL", mi: 344, rate: 2.95, pos: "Lead", certs: ["P/EVO"], pay: "FastPay", status: "open", carrier: "Sunshine State Oversize", score: 4.8 },
  { id: "FL-4490", from: "Houston, TX", to: "Oklahoma City, OK", mi: 488, rate: 2.75, pos: "Rear", certs: ["P/EVO"], pay: "7-Day", status: "open", carrier: "Gulf Coast Transport LLC", score: 4.6 },
  { id: "FL-4391", from: "Columbus, OH", to: "Indianapolis, IN", mi: 174, rate: 3.10, pos: "Lead", certs: ["P/EVO", "TWIC"], pay: "FastPay", status: "filled", carrier: "Buckeye Heavy Haul", score: 4.9 },
  { id: "FL-4402", from: "Bakersfield, CA", to: "Las Vegas, NV", mi: 280, rate: 3.40, pos: "Lead+Rear", certs: ["P/EVO", "Witpac"], pay: "10-Day", status: "open", carrier: "Desert Wind Transport", score: 4.7 },
  { id: "FL-4388", from: "Memphis, TN", to: "Birmingham, AL", mi: 210, rate: 2.65, pos: "Lead", certs: ["P/EVO"], pay: "7-Day", status: "open", carrier: "MidSouth Oversize", score: 4.4 },
  { id: "FL-4510", from: "Dallas, TX", to: "Shreveport, LA", mi: 193, rate: 2.80, pos: "Rear", certs: ["P/EVO"], pay: "FastPay", status: "open", carrier: "Lone Star Oversize LLC", score: 4.9 },
];

const BID_LOADS = [
  { id: "BID-771", from: "Dallas, TX", to: "Memphis, TN", mi: 473, rate: 2.90, pos: "Lead", certs: ["P/EVO"], carrier: "Tex-Ark Oversize", score: 4.7, bids: 3, timer: 187, status: "live" },
  { id: "BID-664", from: "Phoenix, AZ", to: "Albuquerque, NM", mi: 467, rate: 3.50, pos: "Lead", certs: ["P/EVO", "Witpac"], carrier: "Desert Run LLC", score: 4.8, bids: 1, timer: 44, status: "live" },
  { id: "BID-559", from: "Nashville, TN", to: "St. Louis, MO", mi: 312, rate: 2.20, pos: "Rear", certs: ["P/EVO"], carrier: "MidAmerica Heavy", score: 4.5, bids: 4, timer: 0, status: "filled" },
  { id: "BID-601", from: "Chicago, IL", to: "Detroit, MI", mi: 281, rate: 2.45, pos: "Lead", certs: ["P/EVO"], carrier: "Great Lakes Transport", score: 4.6, bids: 2, timer: 0, status: "expired" },
];

const OPEN_BIDS = [
  { id: "OB-331", from: "Houston, TX", to: "New Orleans, LA", mi: 349, rate: 2.55, pos: "Lead", certs: ["P/EVO"], carrier: "Gulf Coast Transport", score: 4.6, bids: 6, closes: "18h 22m", minPay: 2.30, maxPay: 2.75 },
  { id: "OB-288", from: "Chicago, IL", to: "Detroit, MI", mi: 281, rate: 2.30, pos: "Lead+Rear", certs: ["P/EVO", "TWIC"], carrier: "Great Lakes Heavy", score: 4.8, bids: 9, closes: "22h 05m", minPay: 2.10, maxPay: 2.55 },
  { id: "OB-299", from: "Atlanta, GA", to: "Charlotte, NC", mi: 244, rate: 2.70, pos: "Rear", certs: ["P/EVO"], carrier: "Southeast Oversize", score: 4.4, bids: 4, closes: "41h 10m", minPay: 2.40, maxPay: 2.70 },
];

const ESCORTS = [
  { id: "e1", name: "Marcus T.", co: "Thompson Escort Services", loc: "Houston, TX", jobs: 284, rating: 4.97, rank: 1, region: "TX", resp: "< 2 min", rel: 98, badges: ["P/EVO Verified", "BGC", "Vehicle", "Rate Reliable"], vehicle: "2021 Ford F-250", states: ["TX", "LA", "OK", "AR", "NM"], reviewCount: 271, proMember: true },
  { id: "e2", name: "Dale R.", co: "Desert State Pilot", loc: "Phoenix, AZ", jobs: 412, rating: 4.98, rank: 1, region: "SW", resp: "< 2 min", rel: 99, badges: ["P/EVO Verified", "Witpac", "BGC", "Vehicle", "Rate Reliable"], vehicle: "2022 Ford F-350", states: ["AZ", "NM", "NV", "CA", "UT"], reviewCount: 398, proMember: true },
  { id: "e3", name: "Sarah M.", co: "Southeast Escort LLC", loc: "Atlanta, GA", jobs: 156, rating: 4.93, rank: 3, region: "SE", resp: "< 5 min", rel: 96, badges: ["P/EVO Verified", "NY", "TWIC", "Vehicle"], vehicle: "2020 Chevy Silverado", states: ["GA", "FL", "SC", "NC", "TN"], reviewCount: 149, proMember: false },
  { id: "e4", name: "Rick B.", co: "MidAmerica Pilot Car", loc: "Nashville, TN", jobs: 88, rating: 4.91, rank: 2, region: "MID", resp: "< 8 min", rel: 94, badges: ["P/EVO Verified", "Vehicle"], vehicle: "2019 Ford F-150", states: ["TN", "KY", "AL", "MS", "MO"], reviewCount: 84, proMember: false },
];

const TIERS = [
  { id: "trial", name: "Free Trial", price: 0, sub: "30 days · one per device", color: "#6e7a88", features: ["View load board (no contact info)", "Search escorts directory", "30-day limit · FingerprintJS enforced", "No bidding · no alerts"] },
  { id: "member", name: "Member", price: 19.99, sub: "per month", color: "#3d8ef8", features: ["Full bidding on all boards", "Email alerts on new loads", "60s after Pro on bid board loads", "In-platform messaging", "Multi-state load filters"], daily: 1.99 },
  { id: "pro", name: "Pro", price: 29.99, sub: "per month", color: "#f5a200", features: ["SMS instant on bid loads (60s head start)", "Deadhead Minimizer + return load feed", "I'm Available broadcast", "Deadhead calculator + savings dashboard", "Invoice generator", "First cert verification free"], daily: 4.99, popular: true },
  { id: "carrier", name: "Carrier Member", price: 9.99, sub: "per month", color: "#00cc7a", features: ["Post unlimited loads free", "Permit Management Hub", "True Cost Per Load Tracker", "Preferred Escort Network", "Quick Rebook (3+ jobs same escort)"], carrierPro: 19.99 },
];

const PAGES = ["home", "flatboard", "openboard", "bidboard", "escorts", "escprofile", "dashboard-e", "dashboard-c", "postload", "pricing", "verification", "signin"] as const;
type Page = typeof PAGES[number];

// ─── STYLES ─────────────────────────────────────────────────────────────────

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

/* TICKER */
.ticker{height:28px;background:#030507;border-bottom:1px solid var(--l1);overflow:hidden;display:flex;align-items:center}
.ticker-track{display:flex;animation:scrolltick 90s linear infinite;white-space:nowrap}
.tick-item{display:inline-flex;align-items:center;gap:8px;padding:0 28px;border-right:1px solid var(--l1);height:28px;font-family:'DM Mono',monospace;font-size:10px;color:var(--t2);letter-spacing:.05em}
.tick-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.dot-gr{background:var(--gr);box-shadow:0 0 5px var(--gr)}
.dot-am{background:var(--am);box-shadow:0 0 5px var(--am)}
.dot-or{background:var(--or)}

/* NAV */
.nav{background:rgba(6,8,10,.98);border-bottom:1px solid var(--l1);height:56px;display:flex;align-items:center;padding:0 24px;gap:20px;position:sticky;top:0;z-index:100;backdrop-filter:blur(8px)}
.nav-mark{width:34px;height:34px;background:var(--or);display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',Impact,sans-serif;font-size:19px;color:#000;letter-spacing:.02em;flex-shrink:0}
.nav-name{font-family:'Bebas Neue',Impact,sans-serif;font-size:15px;letter-spacing:.08em;color:var(--t1)}
.nav-div{width:1px;height:28px;background:var(--l1)}
.nav-link{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--t2);padding:0 10px;height:56px;display:flex;align-items:center;background:none;border:none;border-bottom:2px solid transparent;transition:color .15s}
.nav-link:hover,.nav-link.active{color:var(--t1)}
.nav-link.active{border-bottom-color:var(--or)}
.nav-bid{color:var(--am)!important;background:rgba(245,162,0,.06);border-bottom-color:var(--am)!important}
.nav-bid::before{content:'';display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--am);box-shadow:0 0 6px var(--am);margin-right:7px;animation:pulse 1.4s infinite}
.nav-cta{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;background:var(--or);color:#000;border:none;padding:8px 16px;font-weight:700;margin-left:auto}

/* BID STRIP */
.bid-strip{background:var(--p2);border-bottom:1px solid var(--l1);padding:0 24px;height:44px;display:flex;align-items:center;gap:16px}
.bid-live{display:flex;align-items:center;gap:7px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:var(--am)}
.bid-live::before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--am);box-shadow:0 0 7px var(--am);animation:pulse 1.4s infinite}
.bid-cta{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;padding:7px 16px;background:rgba(245,162,0,.1);border:1px solid var(--am);color:var(--am);margin-left:auto;transition:background .15s}
.bid-cta:hover{background:rgba(245,162,0,.18)}

/* HERO */
.hero{display:grid;grid-template-columns:1fr 1fr;min-height:520px;border-bottom:1px solid var(--l1)}
.hero-carrier{background:var(--bg);border-right:1px solid var(--l1);padding:56px 48px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden}
.hero-carrier::before{content:'';position:absolute;inset:0;background-image:repeating-linear-gradient(0deg,transparent,transparent 39px,var(--l1) 39px,var(--l1) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,var(--l1) 39px,var(--l1) 40px);opacity:.22;pointer-events:none}
.hero-escort{background:var(--p1);padding:56px 48px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden}
.hero-escort::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 80% 50%,rgba(245,162,0,.04) 0%,transparent 70%);pointer-events:none}
.hero-inner{position:relative;z-index:1}
.hero-tag{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.22em;text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:8px}
.hero-tag::before{content:'';display:inline-block;width:18px;height:1px}
.tag-or{color:var(--or)}.tag-or::before{background:var(--or)}
.tag-am{color:var(--am)}.tag-am::before{background:var(--am)}
.hero-hl{font-family:'Bebas Neue',Impact,sans-serif;font-size:64px;line-height:.92;letter-spacing:.02em;margin-bottom:18px}
.hero-sub{font-size:13px;color:var(--t2);line-height:1.85;max-width:380px;margin-bottom:16px}
.stat-row{display:flex;gap:0;margin-bottom:28px}
.stat{flex:1;padding:12px 16px;background:var(--p2);border:1px solid var(--l1)}
.stat:first-child{border-radius:3px 0 0 3px}.stat:last-child{border-radius:0 3px 3px 0}
.stat-n{font-family:'Bebas Neue',Impact,sans-serif;font-size:26px;line-height:1;margin-bottom:2px}
.stat-l{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--t2)}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;gap:8px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;padding:12px 22px;border:none;transition:opacity .15s}
.btn:hover{opacity:.85}
.btn-or{background:var(--or);color:#000}
.btn-am{background:var(--am);color:#000}
.btn-gr{background:var(--gr);color:#000}
.btn-ghost{background:transparent;color:var(--t2);border:1px solid var(--l2)}
.btn-ghost:hover{color:var(--t1);border-color:var(--t2)}
.btn-sm{padding:7px 14px;font-size:8px}
.btn-row{display:flex;gap:8px;flex-wrap:wrap}

/* SECTION */
.section{padding:52px 24px}
.section-header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:20px}
.eyebrow{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.2em;text-transform:uppercase;margin-bottom:6px}
.section-title{font-family:'Bebas Neue',Impact,sans-serif;font-size:32px;color:var(--t1);line-height:1.05}
.section-link{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--t2);background:none;border:none;display:flex;align-items:center;gap:5px}
.section-link::after{content:'→'}
.section-link:hover{color:var(--t1)}

/* CHIP */
.chip{display:inline-flex;align-items:center;gap:3px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;padding:2px 8px;border-radius:2px}
.ch-gr{background:rgba(0,204,122,.1);color:var(--gr);border:1px solid rgba(0,204,122,.2)}
.ch-am{background:rgba(245,162,0,.1);color:var(--am);border:1px solid rgba(245,162,0,.2)}
.ch-or{background:rgba(255,98,0,.1);color:var(--or);border:1px solid rgba(255,98,0,.18)}
.ch-bl{background:rgba(61,142,248,.1);color:var(--bl);border:1px solid rgba(61,142,248,.18)}
.ch-dim{background:var(--p2);color:var(--t2);border:1px solid var(--l1)}
.ch-rd{background:rgba(255,53,53,.1);color:var(--rd);border:1px solid rgba(255,53,53,.2)}

/* TABLE */
.data-table{border:1px solid var(--l1);border-radius:4px;overflow:hidden}
.data-table table{font-family:'DM Mono',monospace;font-size:11px}
.data-table thead th{background:var(--p2);padding:8px 12px;text-align:left;font-size:8px;letter-spacing:.16em;text-transform:uppercase;color:var(--t2);border-bottom:1px solid var(--l1);white-space:nowrap;font-weight:500}
.data-table tbody td{padding:11px 12px;border-bottom:1px solid rgba(28,34,41,.7);vertical-align:middle}
.data-table tbody tr:last-child td{border-bottom:none}
.data-table tbody tr:hover td{background:rgba(255,255,255,.015)}

/* PAY SCORE */
.ps{display:inline-flex;align-items:center;gap:4px;font-family:'DM Mono',monospace;font-size:9px;padding:2px 7px;border-radius:2px}
.ps-hi{background:rgba(0,204,122,.1);color:var(--gr);border:1px solid rgba(0,204,122,.2)}
.ps-lo{background:rgba(245,162,0,.1);color:var(--am);border:1px solid rgba(245,162,0,.2)}
.ps-bad{background:rgba(255,53,53,.1);color:var(--rd);border:1px solid rgba(255,53,53,.2)}

/* LOCK */
.lock-bar{background:var(--p2);border:1px solid var(--l1);border-radius:3px;padding:10px 16px;display:flex;align-items:center;gap:12px;margin-top:10px;flex-wrap:wrap}
.lock-phone{font-family:'DM Mono',monospace;font-size:12px;color:var(--t3)}
.lock-msg{font-family:'DM Mono',monospace;font-size:10px;color:var(--t2)}

/* CARD */
.card{background:var(--p1);border:1px solid var(--l1);border-radius:4px;padding:18px}
.card:hover{border-color:var(--l2)}

/* BID TIMER */
.bid-timer{font-family:'Bebas Neue',Impact,sans-serif;font-size:28px;line-height:1;letter-spacing:.04em}
.timer-red{color:var(--rd)}
.timer-am{color:var(--am)}
.timer-gr{color:var(--gr)}

/* DASHBOARD */
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

/* FEAT GRID */
.feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.feat-card{background:var(--p1);border:1px solid var(--l1);border-top:2px solid;border-radius:4px;padding:18px}
.feat-title{font-family:'Bebas Neue',Impact,sans-serif;font-size:18px;color:var(--t1);margin-bottom:7px;line-height:1.1}
.feat-body{font-size:12px;color:var(--t2);line-height:1.75}

/* PRICING */
.price-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.price-card{background:var(--p1);border:1px solid var(--l1);border-radius:4px;padding:20px;display:flex;flex-direction:column;gap:14px}
.price-card.popular{border-color:var(--am)}
.price-name{font-family:'Bebas Neue',Impact,sans-serif;font-size:22px;line-height:1}
.price-n{font-family:'Bebas Neue',Impact,sans-serif;font-size:38px;line-height:1}
.price-feat{font-family:'DM Mono',monospace;font-size:10px;color:var(--t2);display:flex;align-items:flex-start;gap:6px;line-height:1.5}
.price-feat::before{content:'✓';color:var(--gr);flex-shrink:0}

/* VERIFICATION */
.verify-tier{background:var(--p1);border:1px solid var(--l1);border-left:3px solid;border-radius:4px;padding:18px 20px;display:flex;align-items:flex-start;gap:16px;margin-bottom:10px}

/* FOOTER */
footer{background:var(--p1);border-top:1px solid var(--l1);padding:40px 24px 24px}
.footer-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:44px;margin-bottom:28px}
.footer-col h4{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--t2);margin-bottom:12px}
.footer-col a{display:block;font-size:12px;color:var(--t2);cursor:pointer;margin-bottom:8px}
.footer-col a:hover{color:var(--t1)}
.footer-bottom{display:flex;justify-content:space-between;padding-top:20px;border-top:1px solid var(--l1);font-family:'DM Mono',monospace;font-size:9px;color:var(--t3);letter-spacing:.06em}

/* PLATFORM DIVIDER */
.platform-div{background:var(--p2);border-bottom:1px solid var(--l1);border-top:1px solid var(--l1);padding:12px 24px;display:flex;align-items:center;gap:20px;flex-wrap:wrap}

/* ESC GRID */
.esc-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}

/* OPEN BID CARDS */
.ob-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}

/* SIGNIN */
.signin-wrap{min-height:calc(100vh - 84px);display:flex;align-items:center;justify-content:center;background:var(--bg)}
.signin-box{background:var(--p1);border:1px solid var(--l1);border-radius:4px;padding:36px;width:100%;max-width:420px}
.form-label{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--t2);display:block;margin-bottom:6px}
.form-field{margin-bottom:16px}

/* POSTLOAD */
.postload-wrap{max-width:780px;margin:0 auto;padding:40px 24px}

@media(max-width:900px){
  .hero{grid-template-columns:1fr}
  .hero-carrier{border-right:none;border-bottom:1px solid var(--l1)}
  .price-grid{grid-template-columns:repeat(2,1fr)}
  .feat-grid{grid-template-columns:repeat(2,1fr)}
  .esc-grid{grid-template-columns:repeat(2,1fr)}
  .footer-grid{grid-template-columns:1fr 1fr}
  .dash-grid{grid-template-columns:1fr}
  .dash-nav{display:none}
}
`;

// ─── SUBCOMPONENTS ───────────────────────────────────────────────────────────

function Ticker() {
  const items = [
    { dot: "dot-gr", text: "FL-4481 · Jacksonville FL→Montgomery AL · 344mi · $2.95/mi · FILLED · FastPay" },
    { dot: "dot-am", text: "BID BOARD LIVE · BID-771 · Dallas TX→Memphis TN · 3:12 remaining · 3 bids · low $2.65" },
    { dot: "dot-gr", text: "Marcus T. · Background Check badge approved · #1 TX · 284 jobs · 4.97 rating" },
    { dot: "dot-or", text: "OPEN BID · OB-331 · Houston TX→New Orleans LA · closes in 18h · 6 bids received" },
    { dot: "dot-gr", text: "Pro SMS sent · BID-664 dropped · AZ→NM · $3.50 ceiling · 60s head start" },
    { dot: "dot-am", text: "BID-559 FILLED · Nashville→St. Louis · Rick B. wins · $2.20/mi" },
    { dot: "dot-gr", text: "Lone Star Oversize LLC · Pay Score 4.9 · load filled in 3 min" },
    { dot: "dot-or", text: "OPEN BID · IL→MI · 281mi · 9 bids · low $2.30/mi · 22h remaining" },
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

function Nav({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  return (
    <div className="nav">
      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setPage("home")}>
        <div className="nav-mark">OEH</div>
        <div className="nav-name">Oversize Escort Hub</div>
      </div>
      <div className="nav-div" />
      <div style={{ display: "flex", flex: 1 }}>
        {(["flatboard", "openboard", "escorts", "postload", "pricing", "verification"] as Page[]).map((p) => (
          <button key={p} className={`nav-link${page === p ? " active" : ""}`} onClick={() => setPage(p)}>
            {p === "flatboard" ? "Flat Rate" : p === "openboard" ? "Open Bids" : p === "escorts" ? "Find Escorts" : p === "postload" ? "Post a Load" : p === "pricing" ? "Pricing" : "Verification"}
          </button>
        ))}
        <button className={`nav-link nav-bid${page === "bidboard" ? " active" : ""}`} onClick={() => setPage("bidboard")}>
          Bid Board
        </button>
      </div>
      <button className="nav-cta" onClick={() => setPage("signin")}>Get Started</button>
    </div>
  );
}

function Footer({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <footer>
      <div className="footer-grid">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div className="nav-mark" style={{ width: 28, height: 28, fontSize: 15 }}>OEH</div>
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
          <a>About</a><a>Contact</a><a>Privacy Policy</a><a>Terms of Service</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Oversize Escort Hub. All rights reserved.</span>
        <span style={{ color: "var(--or)", letterSpacing: ".1em" }}>NO COMMISSIONS · NO JOB FEES · EVER</span>
      </div>
    </footer>
  );
}

function LockBar({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="lock-bar">
      <div>
        <div className="lock-phone">📞 (XXX) XXX-XXXX &nbsp;·&nbsp; 📧 xxxxxxx@xxxxxx.com &nbsp;·&nbsp; 🏢 [Company Name Hidden]</div>
        <div className="lock-msg" style={{ marginTop: 3 }}>🔒 Member access required — carrier phone, email, and company name are hidden from free accounts</div>
      </div>
      <button className="btn btn-or btn-sm" style={{ marginLeft: "auto" }} onClick={() => setPage("pricing")}>Upgrade to Member — $19.99/mo →</button>
    </div>
  );
}

function PayScore({ score }: { score: number }) {
  const cls = score >= 4.7 ? "ps-hi" : score >= 4.3 ? "ps-lo" : "ps-bad";
  return <span className={`ps ${cls}`}>{score} ⭐</span>;
}

// ─── PAGES ───────────────────────────────────────────────────────────────────

function HomePage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <>
      <div className="bid-strip">
        <div className="bid-live">5-Min Bid Board</div>
        <div style={{ width: 1, height: 18, background: "var(--l1)" }} />
        <div className="mo" style={{ fontSize: 10, color: "var(--t2)", flex: 1 }}>3 loads live · Pro: SMS instant · Member: 60s delay · Closes on timer / fill / cancel — whichever comes first</div>
        <button className="bid-cta" onClick={() => setPage("bidboard")}>View Live Board →</button>
      </div>

      <div className="hero">
        <div className="hero-carrier">
          <div className="hero-inner">
            <div className="hero-tag tag-or">For Oversize Carriers &amp; Owner Operators</div>
            <div className="hero-hl" style={{ color: "var(--or)" }}>STOP<br />OVERPAYING<br />FOR<br />ESCORTS.</div>
            <p className="hero-sub">You pay permits AND escorts out of your own cut. <strong style={{ color: "var(--t1)" }}>Potentially $2,000+ overhead before you make a dollar</strong> — with zero tools to control it. Until now.</p>
            <p className="hero-sub">Standard $2.50/mi run. Winning bids on our board come in at $2.10. On 3–4 loads/week that's <strong style={{ color: "var(--t1)" }}>$1,500–$2,000 back in your pocket monthly.</strong></p>
            <div className="stat-row">
              <div className="stat"><div className="stat-n" style={{ color: "var(--or)" }}>$800</div><div className="stat-l">Avg Saved/Month</div></div>
              <div className="stat"><div className="stat-n" style={{ color: "var(--gr)" }}>Free</div><div className="stat-l">Always Post Loads</div></div>
              <div className="stat"><div className="stat-n" style={{ color: "var(--or)" }}>3×</div><div className="stat-l">FastPay Fill Speed</div></div>
            </div>
            <div className="btn-row">
              <button className="btn btn-or" onClick={() => setPage("postload")}>Post a Load Free →</button>
              <button className="btn btn-ghost" onClick={() => setPage("bidboard")}>See Bid Board</button>
            </div>
          </div>
        </div>

        <div className="hero-escort">
          <div className="hero-inner">
            <div className="hero-tag tag-am">For Pilot Car Escorts / P/EVO Operators</div>
            <div className="hero-hl" style={{ color: "var(--am)" }}>STOP<br />DRIVING<br />HOME<br />EMPTY.</div>
            <p className="hero-sub">The average P/EVO escort deadheads home after <strong style={{ color: "var(--t1)" }}>40% of runs.</strong> ~6 empty trips/month × 200mi = <strong style={{ color: "var(--rd)" }}>$804/month lost</strong> in fuel and zero revenue miles.</p>
            <p className="hero-sub">Pro surfaces return loads near your drop, sorted toward home state first. At $29.99/mo that's a <strong style={{ color: "var(--am)" }}>26× return.</strong></p>
            <div className="stat-row">
              <div className="stat"><div className="stat-n" style={{ color: "var(--am)" }}>$4,800</div><div className="stat-l">Recovered/Year</div></div>
              <div className="stat"><div className="stat-n" style={{ color: "var(--am)" }}>26×</div><div className="stat-l">ROI at $29.99/mo</div></div>
              <div className="stat"><div className="stat-n" style={{ color: "var(--gr)" }}>60s</div><div className="stat-l">Pro Head Start</div></div>
            </div>
            <div className="btn-row">
              <button className="btn btn-am" onClick={() => setPage("pricing")}>Go Pro — $29.99/mo →</button>
              <button className="btn btn-ghost" onClick={() => setPage("signin")}>Start Free Trial</button>
            </div>
          </div>
        </div>
      </div>

      <div className="platform-div">
        <span className="mo" style={{ fontSize: 9, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--t2)" }}>Platform</span>
        <span style={{ width: 1, height: 16, background: "var(--l1)" }} />
        <span className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>Three boards · Verified escorts · Real-time bidding · No commissions · No job fees · Ever</span>
        <span className="mo" style={{ marginLeft: "auto", fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--t2)" }}>$670M US Market · 50,000+ P/EVO Operators</span>
      </div>

      {/* FLAT BOARD PREVIEW */}
      <div className="section" style={{ paddingBottom: 0 }}>
        <div className="section-header">
          <div>
            <div className="eyebrow" style={{ color: "var(--gr)" }}>Live Board</div>
            <div className="section-title">FLAT RATE LOADS</div>
          </div>
          <button className="section-link" onClick={() => setPage("flatboard")}>View All Loads</button>
        </div>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Load ID</th><th>Route</th><th>Miles</th><th>Rate</th><th>Position</th><th>Certs</th><th>Pay Terms</th><th>Carrier Pay Score</th><th>Carrier Contact</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {FLAT_LOADS.slice(0, 5).map((l) => (
                <tr key={l.id} style={{ opacity: l.status === "filled" ? 0.42 : 1 }}>
                  <td className="mo" style={{ color: "var(--t2)", fontSize: 9 }}>{l.id}</td>
                  <td style={{ fontWeight: 500, fontSize: 12 }}>{l.from} → {l.to}</td>
                  <td className="mo">{l.mi}</td>
                  <td className="mo" style={{ color: "var(--gr)", fontWeight: 600 }}>${l.rate.toFixed(2)}/mi</td>
                  <td style={{ fontSize: 10 }}>{l.pos}</td>
                  <td>{l.certs.map((c) => <span key={c} className="chip ch-dim">{c}</span>)}</td>
                  <td>{l.pay === "FastPay" ? <span className="chip ch-gr">⚡ FastPay</span> : <span className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>{l.pay}</span>}</td>
                  <td><PayScore score={l.score} /></td>
                  <td>
                    <div className="mo" style={{ fontSize: 11, color: "var(--t3)" }}>📞 (XXX) XXX-XXXX</div>
                    <div className="mo" style={{ fontSize: 9, color: "var(--t3)" }}>🔒 Member only</div>
                  </td>
                  <td>{l.status === "filled" ? <span className="chip ch-dim">FILLED</span> : <span className="chip ch-gr">OPEN</span>}</td>
                  <td>{l.status !== "filled" && <button className="mo" style={{ background: "none", border: "none", color: "var(--or)", fontSize: 9, letterSpacing: ".1em" }}>RESPOND →</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <LockBar setPage={setPage} />
      </div>

      {/* DEADHEAD MINIMIZER */}
      <div className="section">
        <div className="section-header">
          <div>
            <div className="eyebrow" style={{ color: "var(--am)" }}>Pro Exclusive · Escort Acquisition #1 Feature</div>
            <div className="section-title">DEADHEAD MINIMIZER</div>
          </div>
        </div>
        <div style={{ background: "var(--p1)", border: "1px solid var(--l1)", borderLeft: "3px solid var(--am)", borderRadius: 4, padding: "24px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36 }}>
            <div>
              <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.85, marginBottom: 16 }}>6 empty return trips/month × 200mi avg = <strong style={{ color: "var(--rd)" }}>$804/month lost.</strong> Pro automatically surfaces return loads near your drop point, sorted toward home state first, refreshed every 15 min.</p>
              <div style={{ background: "var(--bg)", border: "1px solid var(--l1)", borderRadius: 3, padding: 14, marginBottom: 16 }}>
                <div className="mo" style={{ fontSize: 9, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--t2)", marginBottom: 10 }}>Deadhead Calculator · Live Example</div>
                {[["Deadhead cost (80mi × $0.67/mi)", "−$53.60", "var(--rd)"], ["Load pay ($2.60/mi × 340mi)", "+$884.00", "var(--gr)"], ["Net after deadhead", "$830.40", "var(--gr)"]].map(([l, v, c], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: i === 2 ? 13 : 11, padding: "5px 0", borderBottom: i < 2 ? "1px solid var(--l1)" : "none", fontWeight: i === 2 ? 600 : 400 }}>
                    <span style={{ color: i === 2 ? "var(--t1)" : "var(--t2)" }}>{l}</span>
                    <span style={{ color: c }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: "12px 16px", background: "rgba(245,162,0,.07)", border: "1px solid rgba(245,162,0,.2)", borderRadius: 3, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
                <div className="mo" style={{ fontSize: 11, color: "var(--am)", lineHeight: 1.55 }}>"Average Pro escort recovers $4,800/year.<br />At $29.99/mo that&apos;s a 26× return."</div>
                <button className="btn btn-am btn-sm" onClick={() => setPage("pricing")}>GO PRO →</button>
              </div>
            </div>
            <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
              {[
                ["Return Load Feed", "Phase 1 · Launch", "Mark job complete → loads within 100mi of drop, sorted toward home first. Refreshes every 15 min."],
                ["Pre-Arrival SMS Alerts", "Phase 2", "2hr before arrival: SMS showing return loads near destination. Arrive with next job already lined up."],
                ["I'm Available Broadcast", "Phase 2", "Toggle available → carriers with loads near you notified. Direct job offers before it hits the public board."],
                ["Deadhead Savings Dashboard", "Always On", "\"Savings This Month: $920 · This Year: $4,820\" — real dollar value every time you open the app."],
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

      {/* TOP ESCORTS */}
      <div className="section" style={{ paddingTop: 0 }}>
        <div className="section-header">
          <div>
            <div className="eyebrow" style={{ color: "var(--gr)" }}>Verified P/EVO Professionals</div>
            <div className="section-title">TOP RANKED ESCORTS</div>
          </div>
          <button className="section-link" onClick={() => setPage("escorts")}>View All</button>
        </div>
        <div className="esc-grid">
          {ESCORTS.map((e) => <EscortCard key={e.id} e={e} setPage={setPage} />)}
        </div>
      </div>

      {/* FEATURES */}
      <div className="section" style={{ paddingTop: 0 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div className="eyebrow" style={{ color: "var(--t2)", textAlign: "center", marginBottom: 6 }}>Why the Industry Is Switching</div>
          <div className="bb" style={{ fontSize: 34, color: "var(--t1)" }}>EVERYTHING THE INDUSTRY WAS MISSING</div>
        </div>
        <div className="feat-grid">
          {[
            { c: "var(--am)", t: "5-Min Bid Board", d: "Industry first. Closes on timer, carrier fills it, or carrier cancels — whichever comes first. Pro gets SMS instantly, Members see it 60 seconds later." },
            { c: "var(--gr)", t: "Verified P/EVO Escorts", d: "4-tier trust ladder: P/EVO cert, vehicle verified, background check badge, admin verified. Fraudulent listings cannot exist here." },
            { c: "var(--am)", t: "Deadhead Minimizer", d: "Return load feed sorted toward home state. Pre-arrival SMS. I'm Available broadcast. Recovers avg $4,800/year at $29.99/mo." },
            { c: "var(--or)", t: "Carrier Pay Score (Public)", d: "Pay speed, communication, load accuracy, no-go fee history — all public. 4.9 fills in minutes. 2.8 sits on the board." },
            { c: "var(--bl)", t: "Open Bid Board", d: "24-72h window. Carrier reviews all bids, picks whoever they want. Escorts attach a personal pitch to every bid." },
            { c: "var(--gr)", t: "Two-Way Reviews", d: "Escorts rate carriers: pay speed, professionalism, accuracy. Carriers rate escorts: reliability, skill, communication." },
            { c: "var(--or)", t: "Contact Info Wall", d: "Phone, email, company name hidden behind membership. Free trial sees redacted info. Every conversation on record." },
            { c: "var(--bl)", t: "Multi-Escort Coordinator", d: "One load needs Lead + Rear + High Pole. Post once, award all three from one screen. All get same load package and comms." },
            { c: "var(--gr)", t: "No Commissions. Ever.", d: "Flat subscription. Zero job fees. Zero percentage cut. You bid what you want. What you earn is yours. Not now, not at scale, not ever." },
          ].map((f) => (
            <div key={f.t} className="feat-card" style={{ borderTopColor: f.c }}>
              <div className="feat-title">{f.t}</div>
              <p className="feat-body">{f.d}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, background: "var(--p2)", border: "1px solid var(--l1)", borderRadius: 3, padding: "11px 18px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" as const }}>
          <span className="mo" style={{ fontSize: 10, color: "var(--rd)" }}>⚠ Load Covered: killed SMS Aug 2025 · fraudulent listings · website looks like 2005</span>
          <span style={{ color: "var(--l2)" }}>|</span>
          <span className="mo" style={{ fontSize: 10, color: "var(--rd)" }}>⚠ Pilot Car Loads: persistent login failures · zero verification · no bidding</span>
          <button className="mo" style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--t2)", fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase" }} onClick={() => setPage("pricing")}>See full comparison →</button>
        </div>
      </div>
    </>
  );
}

function EscortCard({ e, setPage }: { e: typeof ESCORTS[0]; setPage: (p: Page) => void }) {
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 1 }}>{e.name}</div>
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
        {e.badges.slice(0, 3).map((b) => <span key={b} className={`chip ${b === "Rate Reliable" ? "ch-am" : "ch-gr"}`}>✓ {b}</span>)}
      </div>
      <div style={{ display: "flex", gap: 12, padding: "9px 0", borderTop: "1px solid var(--l1)", borderBottom: "1px solid var(--l1)", marginBottom: 10 }}>
        {[{ n: e.jobs, l: "Jobs" }, { n: e.rating, l: "Rating", c: "var(--gr)" }, { n: `${e.rel}%`, l: "Reliability", c: "var(--bl)" }].map((s) => (
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

function FlatBoardPage({ setPage }: { setPage: (p: Page) => void }) {
  const [stateFilter, setStateFilter] = useState("ALL");
  const [posFilter, setPosFilter] = useState("ALL");
  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="eyebrow" style={{ color: "var(--gr)" }}>Live Board</div>
          <div className="section-title">FLAT RATE LOAD BOARD</div>
        </div>
        <button className="btn btn-or btn-sm" onClick={() => setPage("postload")}>+ Post a Load</button>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" as const }}>
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
          <option value="ALL">All States</option>
          <option value="TX">Texas</option><option value="FL">Florida</option><option value="CA">California</option>
          <option value="TN">Tennessee</option><option value="OH">Ohio</option>
        </select>
        <select value={posFilter} onChange={(e) => setPosFilter(e.target.value)}>
          <option value="ALL">All Positions</option>
          <option value="Lead">Lead</option><option value="Rear">Rear</option><option value="Lead+Rear">Lead+Rear</option>
        </select>
        <select><option>All Pay Terms</option><option>FastPay Only</option><option>7-Day</option><option>10-Day</option></select>
        <select><option>Min Pay/Mi: Any</option><option>$2.50+</option><option>$3.00+</option><option>$3.50+</option></select>
      </div>
      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Load ID</th><th>Route</th><th>Miles</th><th>Rate</th><th>Est. Pay</th><th>Position</th><th>Certs Required</th><th>Pay Terms</th><th>Pay Score</th><th>Contact</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {FLAT_LOADS.map((l) => (
              <tr key={l.id} style={{ opacity: l.status === "filled" ? 0.42 : 1 }}>
                <td className="mo" style={{ color: "var(--t2)", fontSize: 9 }}>{l.id}</td>
                <td style={{ fontWeight: 500, fontSize: 12 }}>{l.from} → {l.to}</td>
                <td className="mo">{l.mi}</td>
                <td className="mo" style={{ color: "var(--gr)", fontWeight: 600 }}>${l.rate.toFixed(2)}/mi</td>
                <td className="mo" style={{ color: "var(--gr)" }}>${(l.mi * l.rate).toFixed(0)}</td>
                <td style={{ fontSize: 10 }}>{l.pos}</td>
                <td>{l.certs.map((c) => <span key={c} className="chip ch-dim" style={{ marginRight: 4 }}>{c}</span>)}</td>
                <td>{l.pay === "FastPay" ? <span className="chip ch-gr">⚡ FastPay</span> : <span className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>{l.pay}</span>}</td>
                <td><PayScore score={l.score} /></td>
                <td>
                  <div className="mo" style={{ fontSize: 11, color: "var(--t3)" }}>📞 (XXX) XXX-XXXX</div>
                  <div className="mo" style={{ fontSize: 9, color: "var(--t3)" }}>🔒 Member only</div>
                </td>
                <td>{l.status === "filled" ? <span className="chip ch-dim">FILLED</span> : <span className="chip ch-gr">OPEN</span>}</td>
                <td>{l.status !== "filled" && <button className="btn btn-or btn-sm">Respond →</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <LockBar setPage={setPage} />
    </div>
  );
}

function BidBoardPage({ setPage }: { setPage: (p: Page) => void }) {
  const [timers, setTimers] = useState<Record<string, number>>(
    Object.fromEntries(BID_LOADS.map((l) => [l.id, l.timer]))
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
      <div style={{ background: "var(--p2)", border: "1px solid var(--l1)", borderLeft: "3px solid var(--am)", borderRadius: 4, padding: "16px 20px", marginBottom: 20 }}>
        <div className="bb" style={{ fontSize: 22, color: "var(--am)", marginBottom: 6 }}>5-MINUTE BID BOARD</div>
        <p className="mo" style={{ fontSize: 10, color: "var(--t2)", lineHeight: 1.75 }}>
          Loads close when: <span style={{ color: "var(--am)" }}>① Timer hits zero</span> · <span style={{ color: "var(--gr)" }}>② Carrier fills it</span> · <span style={{ color: "var(--t2)" }}>③ Carrier cancels</span> — whichever comes first.<br />
          <span style={{ color: "var(--am)" }}>Pro members:</span> SMS instant on load drop · <span style={{ color: "var(--bl)" }}>Members:</span> 60 second delay · <span style={{ color: "var(--t2)" }}>Free trial:</span> View only, no bidding
        </p>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {BID_LOADS.map((l) => {
          const t = timers[l.id] ?? 0;
          const isLive = l.status === "live" && t > 0;
          const isFilled = l.status === "filled";
          const isExpired = l.status === "expired" || (l.status === "live" && t === 0);
          const timerCls = t > 60 ? "timer-am" : t > 20 ? "timer-am" : "timer-red";
          return (
            <div key={l.id} className="card" style={{ opacity: (isFilled || isExpired) ? 0.5 : 1, borderColor: isLive ? "var(--am)" : "var(--l1)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" as const }}>
                  <div>
                    <div className="mo" style={{ fontSize: 9, color: "var(--t2)", marginBottom: 2 }}>{l.id}</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{l.from} → {l.to}</div>
                    <div className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>{l.mi} mi · {l.pos}</div>
                  </div>
                  <div>
                    <div className="bb" style={{ fontSize: 26, color: "var(--gr)", lineHeight: 1 }}>${l.rate.toFixed(2)}/mi</div>
                    <div className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>Ceiling rate</div>
                  </div>
                  <div>
                    <div><PayScore score={l.score} /></div>
                    <div className="mo" style={{ fontSize: 9, color: "var(--t2)", marginTop: 3 }}>Carrier Pay Score</div>
                  </div>
                  <div>
                    <div className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>{l.bids} bid{l.bids !== 1 ? "s" : ""} placed</div>
                    <div>{l.certs.map((c) => <span key={c} className="chip ch-dim" style={{ marginRight: 3 }}>{c}</span>)}</div>
                  </div>
                </div>
                <div style={{ textAlign: "center", minWidth: 120 }}>
                  {isLive && (
                    <>
                      <div className={`bid-timer ${timerCls}`}>{fmtTimer(t)}</div>
                      <div className="mo" style={{ fontSize: 8, color: "var(--t2)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Time Remaining</div>
                      <button className="btn btn-am btn-sm" style={{ width: "100%" }}>🔒 BID (MEMBER)</button>
                    </>
                  )}
                  {isFilled && <span className="chip ch-gr" style={{ fontSize: 11, padding: "6px 14px" }}>FILLED</span>}
                  {isExpired && !isFilled && <span className="chip ch-dim" style={{ fontSize: 11, padding: "6px 14px" }}>EXPIRED</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 16 }}>
        <LockBar setPage={setPage} />
      </div>
    </div>
  );
}

function OpenBidPage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="eyebrow" style={{ color: "var(--bl)" }}>24-72 Hour Window</div>
          <div className="section-title">OPEN BID BOARD</div>
        </div>
        <button className="btn btn-or btn-sm" onClick={() => setPage("postload")}>+ Post a Load</button>
      </div>
      <div style={{ background: "var(--p2)", border: "1px solid var(--l1)", borderRadius: 3, padding: "12px 16px", marginBottom: 20 }} className="mo">
        <span style={{ fontSize: 10, color: "var(--t2)" }}>Carrier reviews all bids and selects the escort they want — best price, certs, rank, or the pitch that stood out. Attach a note to every bid. </span>
        <span style={{ fontSize: 10, color: "var(--am)" }}>Member+ can bid on open board loads.</span>
      </div>
      <div className="ob-grid">
        {OPEN_BIDS.map((l) => (
          <div key={l.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div className="mo" style={{ fontSize: 9, color: "var(--t2)", marginBottom: 3 }}>{l.id}</div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{l.from}</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--t2)" }}>→ {l.to}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className="chip ch-bl">OPEN BID</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[["Miles", `${l.mi} mi`], ["Ceiling", `$${l.rate.toFixed(2)}/mi`], ["Position", l.pos], ["Bids In", `${l.bids} bids`], ["Bid Range", `$${l.minPay}–$${l.maxPay}/mi`], ["Closes", l.closes]].map(([lbl, val]) => (
                <div key={lbl}>
                  <div className="mo" style={{ fontSize: 8, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--t2)", marginBottom: 2 }}>{lbl}</div>
                  <div className="mo" style={{ fontSize: 11, color: val.toString().startsWith("$") && lbl === "Ceiling" ? "var(--gr)" : "var(--t1)", fontWeight: 500 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <PayScore score={l.score} />
              <div>{l.certs.map((c) => <span key={c} className="chip ch-dim" style={{ marginLeft: 4 }}>{c}</span>)}</div>
            </div>
            <textarea placeholder="Add your bid note / pitch to carrier..." style={{ width: "100%", minHeight: 56, resize: "vertical", marginBottom: 8, fontSize: 11 }} />
            <input placeholder="Your bid ($/mi)" style={{ width: "100%", marginBottom: 8 }} />
            <button className="btn btn-or btn-sm" style={{ width: "100%" }} onClick={() => setPage("pricing")}>🔒 SUBMIT BID (MEMBER)</button>
          </div>
        ))}
      </div>
      <LockBar setPage={setPage} />
    </div>
  );
}

function EscortsPage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="eyebrow" style={{ color: "var(--gr)" }}>Verified P/EVO Directory</div>
          <div className="section-title">FIND ESCORTS</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" as const }}>
        <select><option>All States</option><option>Texas</option><option>Arizona</option><option>Georgia</option><option>Tennessee</option></select>
        <select><option>All Certifications</option><option>P/EVO Verified</option><option>Witpac</option><option>NY</option><option>TWIC</option></select>
        <select><option>All Tiers</option><option>Admin Verified</option><option>Background Checked</option><option>Vehicle Verified</option></select>
        <select><option>Sort: Highest Rated</option><option>Most Jobs</option><option>Fastest Response</option><option>Highest Reliability</option></select>
      </div>
      <div className="esc-grid">
        {ESCORTS.map((e) => <EscortCard key={e.id} e={e} setPage={setPage} />)}
      </div>
    </div>
  );
}

function EscProfilePage({ setPage }: { setPage: (p: Page) => void }) {
  const e = ESCORTS[0];
  return (
    <div className="section">
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
        <div>
          <div className="card" style={{ marginBottom: 10 }}>
            <div className="bb" style={{ fontSize: 28, color: "var(--am)", marginBottom: 2 }}>{e.name}</div>
            <div className="mo" style={{ fontSize: 11, color: "var(--t2)", marginBottom: 12 }}>{e.co} · {e.loc}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const, marginBottom: 12 }}>
              {e.badges.map((b) => <span key={b} className={`chip ${b === "Rate Reliable" ? "ch-am" : "ch-gr"}`}>✓ {b}</span>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14, padding: "10px 0", borderTop: "1px solid var(--l1)", borderBottom: "1px solid var(--l1)" }}>
              {[["bb", e.jobs.toString(), "Jobs", "var(--t1)"], ["bb", e.rating.toString(), "Rating", "var(--gr)"], ["bb", `${e.rel}%`, "Reliability", "var(--bl)"]].map(([, n, l, c]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div className="bb" style={{ fontSize: 22, color: c, lineHeight: 1 }}>{n}</div>
                  <div className="mo" style={{ fontSize: 8, color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".08em" }}>{l}</div>
                </div>
              ))}
            </div>
            <div className="mo" style={{ fontSize: 10, color: "var(--t2)", marginBottom: 10 }}>Response Speed: {e.resp} avg</div>
            <div className="mo" style={{ fontSize: 10, color: "var(--t2)", marginBottom: 10 }}>Vehicle: {e.vehicle}</div>
            <div className="mo" style={{ fontSize: 10, color: "var(--t2)", marginBottom: 10 }}>Licensed States: {e.states.join(", ")}</div>
            <button className="btn btn-or btn-sm" style={{ width: "100%" }} onClick={() => setPage("pricing")}>🔒 Contact {e.name} (Member)</button>
          </div>
          <div className="card">
            <div className="mo" style={{ fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--t2)", marginBottom: 12 }}>Reliability Score Breakdown</div>
            {[["Vehicle Age & Condition", 98], ["On-Time Completion", 97], ["Equipment Compliance", 100], ["Breakdown History", 96], ["Load Accuracy", 99]].map(([label, val]) => (
              <div key={label as string} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--t2)" }}>{label}</span>
                  <span className="mo" style={{ fontSize: 11, color: "var(--gr)" }}>{val}%</span>
                </div>
                <div style={{ height: 3, background: "var(--l1)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${val}%`, background: "var(--gr)", borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="mo" style={{ fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--t2)", marginBottom: 12 }}>Reviews from Carriers ({e.reviewCount})</div>
            {[
              { carrier: "Lone Star Oversize LLC", score: 5.0, date: "Mar 18, 2026", text: "Marcus showed up early, had all equipment, communicated throughout the load. Will specifically request him on future loads." },
              { carrier: "Gulf Coast Transport LLC", score: 5.0, date: "Mar 11, 2026", text: "Third time using Marcus. Never a problem. Gives you a heads up if anything on route changes. Platform rank is accurate." },
              { carrier: "Desert Wind Transport", score: 4.8, date: "Feb 28, 2026", text: "Professional, on time, well equipped. Minor comms lag during the run but nothing that caused issues." },
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
          <div style={{ background: "var(--p2)", border: "1px solid var(--l1)", borderRadius: 3, padding: "12px 16px" }}>
            <div className="mo" style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--rd)", marginBottom: 4 }}>⚠ Breakdown Protocol</div>
            <p className="mo" style={{ fontSize: 10, color: "var(--t2)", lineHeight: 1.65 }}>If {e.name} activates the breakdown protocol button: carrier is notified immediately + nearest 3 available escorts within 100mi are alerted to cover the load.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EscortDashPage({ setPage }: { setPage: (p: Page) => void }) {
  const [tab, setTab] = useState("overview");
  const tabs = [
    { id: "overview", label: "Overview" }, { id: "loads", label: "Available Loads" }, { id: "dh", label: "Deadhead Minimizer" },
    { id: "jobs", label: "My Jobs" }, { id: "reviews", label: "Reviews" }, { id: "invoice", label: "Invoice Generator" }, { id: "certs", label: "Certifications" }, { id: "dispute", label: "Dispute Center" },
  ];
  return (
    <div className="dash-grid">
      <div className="dash-nav">
        <div className="mo" style={{ fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--t3)", padding: "0 20px", marginBottom: 12 }}>Escort Dashboard</div>
        {tabs.map((t) => (
          <div key={t.id} className={`dash-nav-item${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</div>
        ))}
        <div style={{ padding: "20px 20px 0", marginTop: 20, borderTop: "1px solid var(--l1)" }}>
          <div className="chip ch-am" style={{ fontSize: 8, marginBottom: 8 }}>PRO MEMBER</div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Marcus T.</div>
          <div className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>Thompson Escort Services</div>
        </div>
      </div>
      <div className="dash-content">
        {tab === "overview" && (
          <>
            <div className="bb" style={{ fontSize: 24, marginBottom: 20 }}>OVERVIEW</div>
            <div className="metric-grid">
              {[["$4,820", "Deadhead Saved This Year", "var(--am)"], ["$920", "Deadhead Saved This Month", "var(--am)"], ["4.97", "Platform Rating", "var(--gr)"], ["#1 TX", "Regional Rank", "var(--or)"]].map(([n, l, c]) => (
                <div key={l} className="metric">
                  <div className="metric-n" style={{ color: c }}>{n}</div>
                  <div className="metric-l">{l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="card">
                <div className="mo" style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--t2)", marginBottom: 12 }}>Recent Jobs</div>
                {[["FL-4481", "Jacksonville → Montgomery", "$1,015", "FastPay"], ["BID-559", "Nashville → St. Louis", "$686", "7-Day"], ["FL-4344", "Houston → Shreveport", "$537", "FastPay"]].map(([id, route, pay, terms]) => (
                  <div key={id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--l1)", fontSize: 12 }}>
                    <div>
                      <div className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>{id}</div>
                      <div>{route}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "var(--gr)", fontWeight: 600 }}>{pay}</div>
                      <div className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>{terms}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="mo" style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--t2)", marginBottom: 12 }}>I&apos;m Available</div>
                <div style={{ background: "rgba(245,162,0,.07)", border: "1px solid rgba(245,162,0,.2)", borderRadius: 3, padding: 14, marginBottom: 12 }}>
                  <div className="mo" style={{ fontSize: 10, color: "var(--am)", marginBottom: 8 }}>Broadcast your availability to carriers with loads near you</div>
                  <button className="btn btn-am btn-sm" style={{ width: "100%" }}>ACTIVATE BROADCAST</button>
                </div>
                <div className="mo" style={{ fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--t2)", marginBottom: 8 }}>Breakdown Protocol</div>
                <button className="btn btn-sm" style={{ width: "100%", background: "rgba(255,53,53,.1)", color: "var(--rd)", border: "1px solid rgba(255,53,53,.2)" }}>🚨 ACTIVATE BREAKDOWN PROTOCOL</button>
              </div>
            </div>
          </>
        )}
        {tab === "dh" && (
          <>
            <div className="bb" style={{ fontSize: 24, marginBottom: 8 }}>DEADHEAD MINIMIZER</div>
            <div style={{ background: "rgba(245,162,0,.07)", border: "1px solid rgba(245,162,0,.2)", borderRadius: 3, padding: "12px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between" }}>
              <span className="mo" style={{ fontSize: 11, color: "var(--am)" }}>Deadhead Saved This Month: <strong>$920</strong></span>
              <span className="mo" style={{ fontSize: 11, color: "var(--am)" }}>This Year: <strong>$4,820</strong></span>
            </div>
            <div className="mo" style={{ fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--t2)", marginBottom: 10 }}>Return Loads Near Your Last Drop (within 100mi)</div>
            <div className="data-table">
              <table>
                <thead><tr><th>Load ID</th><th>Route</th><th>Miles</th><th>Rate</th><th>Est. Pay</th><th>Carrier Score</th><th>Contact</th><th></th></tr></thead>
                <tbody>
                  {FLAT_LOADS.slice(0, 3).map((l) => (
                    <tr key={l.id}>
                      <td className="mo" style={{ color: "var(--t2)", fontSize: 9 }}>{l.id}</td>
                      <td style={{ fontWeight: 500, fontSize: 12 }}>{l.from} → {l.to}</td>
                      <td className="mo">{l.mi}</td>
                      <td className="mo" style={{ color: "var(--gr)", fontWeight: 600 }}>${l.rate.toFixed(2)}/mi</td>
                      <td className="mo" style={{ color: "var(--gr)" }}>${(l.mi * l.rate).toFixed(0)}</td>
                      <td><PayScore score={l.score} /></td>
                      <td><div className="mo" style={{ fontSize: 11, color: "var(--gr)" }}>📞 [Unlocked]</div></td>
                      <td><button className="btn btn-am btn-sm">Respond →</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {tab === "dispute" && (
          <>
            <div className="bb" style={{ fontSize: 24, marginBottom: 20 }}>DISPUTE CENTER</div>
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="mo" style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--t2)", marginBottom: 14 }}>Open Disputes</div>
              <div style={{ padding: "14px 0", borderBottom: "1px solid var(--l1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div><span className="chip ch-am" style={{ marginRight: 8 }}>In Review</span><span style={{ fontWeight: 600, fontSize: 12 }}>FL-4322 — No-Go Fee Dispute</span></div>
                  <span className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>Filed Mar 12, 2026</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.65 }}>Carrier charged $150 no-go fee. Escort claims load dimensions were different from posting. Admin review in progress — expected resolution within 48 hours.</p>
              </div>
              <p className="mo" style={{ fontSize: 10, color: "var(--t2)", marginTop: 12 }}>No other open disputes.</p>
            </div>
            <button className="btn btn-or btn-sm">+ File New Dispute</button>
          </>
        )}
        {!["overview", "dh", "dispute"].includes(tab) && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
            <span className="mo" style={{ color: "var(--t2)", fontSize: 11 }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} — coming soon in full build
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function CarrierDashPage({ setPage }: { setPage: (p: Page) => void }) {
  const [tab, setTab] = useState("overview");
  const tabs = [
    { id: "overview", label: "Overview" }, { id: "myloads", label: "My Loads" }, { id: "escorts", label: "Preferred Escorts" },
    { id: "multi", label: "Multi-Escort" }, { id: "permits", label: "Permit Hub" }, { id: "cost", label: "True Cost Tracker" }, { id: "dispute", label: "Dispute Center" },
  ];
  return (
    <div className="dash-grid">
      <div className="dash-nav">
        <div className="mo" style={{ fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--t3)", padding: "0 20px", marginBottom: 12 }}>Carrier Dashboard</div>
        {tabs.map((t) => (
          <div key={t.id} className={`dash-nav-item${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</div>
        ))}
        <div style={{ padding: "20px 20px 0", marginTop: 20, borderTop: "1px solid var(--l1)" }}>
          <div className="chip ch-or" style={{ fontSize: 8, marginBottom: 8 }}>CARRIER PRO</div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Lone Star Oversize LLC</div>
          <div className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>Pay Score: 4.9 ⭐</div>
        </div>
      </div>
      <div className="dash-content">
        {tab === "overview" && (
          <>
            <div className="bb" style={{ fontSize: 24, marginBottom: 20 }}>OVERVIEW</div>
            <div className="metric-grid">
              {[["6", "Active Loads", "var(--or)"], ["$2,340", "Saved vs Market Rate", "var(--gr)"], ["4.9", "Carrier Pay Score", "var(--gr)"], ["18 min", "Avg Fill Time", "var(--bl)"]].map(([n, l, c]) => (
                <div key={l} className="metric">
                  <div className="metric-n" style={{ color: c }}>{n}</div>
                  <div className="metric-l">{l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <button className="btn btn-or btn-sm" onClick={() => setPage("postload")}>+ Post New Load</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setTab("multi")}>Multi-Escort Coordinator</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setTab("permits")}>Permit Hub</button>
            </div>
          </>
        )}
        {tab === "multi" && (
          <>
            <div className="bb" style={{ fontSize: 24, marginBottom: 8 }}>MULTI-ESCORT COORDINATOR</div>
            <p style={{ fontSize: 12, color: "var(--t2)", marginBottom: 20, lineHeight: 1.75 }}>One load that requires Lead + Rear + High Pole. Post it once. Specify each position. Award all three from one screen. All escorts receive the same load package, comms thread, and location share.</p>
            <div className="card">
              <div className="mo" style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--t2)", marginBottom: 14 }}>Load FL-4481 — Position Awards</div>
              {[["Lead", ESCORTS[0], "var(--gr)"], ["Rear", ESCORTS[1], "var(--gr)"], ["High Pole", null, "var(--am)"]].map(([pos, esc, c]) => (
                <div key={pos as string} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--l1)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span className="chip ch-dim">{pos}</span>
                    {esc ? (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{(esc as typeof ESCORTS[0]).name}</div>
                        <div className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>{(esc as typeof ESCORTS[0]).co}</div>
                      </div>
                    ) : (
                      <span className="mo" style={{ fontSize: 11, color: "var(--am)" }}>Position unfilled — searching board</span>
                    )}
                  </div>
                  <div>{esc ? <span className="chip ch-gr">AWARDED</span> : <span className="chip ch-am">OPEN</span>}</div>
                </div>
              ))}
              <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                <button className="btn btn-or btn-sm">Send Load Package to All</button>
                <button className="btn btn-ghost btn-sm">Open Comms Thread</button>
              </div>
            </div>
          </>
        )}
        {tab === "permits" && (
          <>
            <div className="bb" style={{ fontSize: 24, marginBottom: 20 }}>PERMIT MANAGEMENT HUB</div>
            <div className="data-table">
              <table>
                <thead><tr><th>Permit #</th><th>State</th><th>Load</th><th>Issued</th><th>Expires</th><th>Status</th></tr></thead>
                <tbody>
                  {[["TX-2026-48812", "TX", "FL-4510", "Mar 20, 2026", "Mar 27, 2026", "active"], ["LA-2026-19341", "LA", "FL-4510", "Mar 20, 2026", "Mar 27, 2026", "active"], ["OK-2026-77023", "OK", "FL-4490", "Mar 15, 2026", "Mar 22, 2026", "expired"]].map(([pn, st, ld, iss, exp, status]) => (
                    <tr key={pn as string}>
                      <td className="mo" style={{ fontSize: 10 }}>{pn}</td>
                      <td className="mo" style={{ fontSize: 10 }}>{st}</td>
                      <td className="mo" style={{ fontSize: 10, color: "var(--bl)" }}>{ld}</td>
                      <td className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>{iss}</td>
                      <td className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>{exp}</td>
                      <td>{status === "active" ? <span className="chip ch-gr">Active</span> : <span className="chip ch-dim">Expired</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {!["overview", "multi", "permits"].includes(tab) && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
            <span className="mo" style={{ color: "var(--t2)", fontSize: 11 }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} — coming soon in full build
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function PostLoadPage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="postload-wrap">
      <div className="bb" style={{ fontSize: 28, marginBottom: 4 }}>POST A LOAD</div>
      <p className="mo" style={{ fontSize: 10, color: "var(--t2)", marginBottom: 28 }}>Free for all carriers. Choose your board type: Flat Rate (first escort to respond wins) · 5-Min Bid (fastest price competition) · Open Bid (24-72h, you pick the escort)</p>
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {[["Flat Rate", "var(--gr)", "First to respond wins"], ["5-Min Bid Board", "var(--am)", "Fast price competition"], ["Open Bid Board", "var(--bl)", "You pick the escort"]].map(([name, c, desc]) => (
          <div key={name} className="card" style={{ flex: 1, borderTop: `2px solid ${c}`, cursor: "pointer" }}>
            <div className="bb" style={{ fontSize: 16, color: c, marginBottom: 4 }}>{name}</div>
            <div className="mo" style={{ fontSize: 9, color: "var(--t2)" }}>{desc}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[["Origin City, State", "text"], ["Destination City, State", "text"], ["Total Miles", "number"], ["Rate ($/mi)", "number"], ["Load Width (ft)", "number"], ["Load Height (ft)", "number"], ["Load Weight (lbs)", "number"]].map(([label, type]) => (
          <div key={label} className="form-field">
            <label className="form-label">{label}</label>
            <input type={type} placeholder={label} style={{ width: "100%" }} />
          </div>
        ))}
        <div className="form-field">
          <label className="form-label">Position Required</label>
          <select style={{ width: "100%" }}>
            <option>Lead</option><option>Rear</option><option>Lead + Rear</option><option>Lead + Rear + High Pole</option>
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Certifications Required</label>
          <select style={{ width: "100%" }}>
            <option>P/EVO Only</option><option>P/EVO + Witpac</option><option>P/EVO + NY</option><option>P/EVO + TWIC</option>
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Pay Terms</label>
          <select style={{ width: "100%" }}>
            <option>FastPay (same-day)</option><option>7-Day</option><option>10-Day</option><option>15-Day</option>
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Preferred Start Date</label>
          <input type="date" style={{ width: "100%" }} />
        </div>
      </div>
      <div className="form-field" style={{ marginTop: 4 }}>
        <label className="form-label">Special Instructions / Notes</label>
        <textarea placeholder="Route details, access notes, timing requirements..." style={{ width: "100%", minHeight: 80 }} />
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button className="btn btn-or">Post Load Free →</button>
        <button className="btn btn-ghost">Save as Draft</button>
      </div>
    </div>
  );
}

function PricingPage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="section">
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div className="eyebrow" style={{ color: "var(--t2)", textAlign: "center", marginBottom: 6 }}>No commissions. No job fees. Ever.</div>
        <div className="bb" style={{ fontSize: 38, color: "var(--t1)" }}>FLAT SUBSCRIPTION PRICING</div>
        <p style={{ fontSize: 13, color: "var(--t2)", marginTop: 8 }}>Annual discounts: Member 15% off · Pro 20% off · Daily passes available</p>
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
      <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {[["Cert Verification", ["P/EVO, Witpac, NY, TWIC, HAZMAT", "Member: $9.99/cert · Pro: $3.99/cert · First cert FREE for Pro"]],
          ["Background Check Review", ["Upload from Checkr/Sterling/First Advantage", "Member: $14.99 · Pro: $9.99 · Renewal: $9.99/$3.99"]],
          ["Carrier Verified Badge", ["One-time $24.99 · Manual review by admin", "Brian reviews with law enforcement background"]]].map(([title, items]) => (
          <div key={title as string} className="card">
            <div className="mo" style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--t2)", marginBottom: 10 }}>{title}</div>
            {(items as string[]).map((item) => <p key={item} style={{ fontSize: 11, color: "var(--t2)", lineHeight: 1.65, marginBottom: 4 }}>{item}</p>)}
          </div>
        ))}
      </div>
    </div>
  );
}

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
        <span style={{ fontSize: 10, color: "var(--t2)" }}>4-tier trust ladder. All opt-in — no verification is required to use the platform. All standards published publicly. Fraudulent listings cannot exist here.</span>
      </div>
      {[
        { tier: "Tier 1", name: "P/EVO Verified", c: "var(--gr)", desc: "Upload your current state P/EVO or EVO certification. Admin reviews and marks your profile. Cert must be current — expired certs are flagged. Carriers can filter for verified-only escorts." },
        { tier: "Tier 2", name: "Vehicle Verified", c: "var(--bl)", desc: "Submit your vehicle registration, insurance card (min $1M liability), and a photo of your escort setup with required equipment. Vehicle age, condition, and equipment compliance are reviewed." },
        { tier: "Tier 3", name: "Background Checked", c: "var(--am)", desc: "You run your own background check through Checkr, Sterling, or First Advantage (must be under 90 days old). Must include criminal history AND MVR. Upload the PDF report. Brian reviews with law enforcement background. $14.99 Member / $9.99 Pro." },
        { tier: "Tier 4", name: "Admin Verified", c: "var(--or)", desc: "Highest trust level. Requires all three previous tiers plus additional review. Admin-verified escorts appear first in carrier searches. Reserved for escorts with proven track record on the platform." },
      ].map((v) => (
        <div key={v.tier} className="verify-tier" style={{ borderLeftColor: v.c }}>
          <div style={{ minWidth: 90 }}>
            <div className="mo" style={{ fontSize: 9, color: "var(--t2)", marginBottom: 2 }}>{v.tier}</div>
            <div className="chip" style={{ background: "transparent", color: v.c, border: `1px solid ${v.c}`, fontSize: 9 }}>✓ {v.name}</div>
          </div>
          <p style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.75 }}>{v.desc}</p>
          <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>Start Verification</button>
        </div>
      ))}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="mo" style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--t2)", marginBottom: 12 }}>Equipment Checklist (Escort Compliance)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {["Amber/Yellow Lights", "OVERSIZE Signs (Front & Rear)", "Height Pole", "CB Radio", "Warning Flags", "Traffic Cones (4 min)", "Hard Hat", "Safety Vest", "STOP/SLOW Paddle", "Emergency Kit"].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="chip ch-gr" style={{ width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0 }}>✓</span>
              <span style={{ fontSize: 11, color: "var(--t2)" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SignInPage({ setPage }: { setPage: (p: Page) => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [role, setRole] = useState<"escort" | "carrier">("escort");
  return (
    <div className="signin-wrap">
      <div className="signin-box">
        <div className="bb" style={{ fontSize: 26, marginBottom: 4 }}>
          {mode === "signup" ? "START FREE" : "SIGN IN"}
        </div>
        <p className="mo" style={{ fontSize: 10, color: "var(--t2)", marginBottom: 20 }}>
          {mode === "signup" ? "30-day free trial. No credit card required." : "Welcome back to Oversize Escort Hub."}
        </p>
        {mode === "signup" && (
          <div style={{ display: "flex", gap: 0, marginBottom: 20, border: "1px solid var(--l1)", borderRadius: 3, overflow: "hidden" }}>
            {(["escort", "carrier"] as const).map((r) => (
              <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: "9px 0", background: role === r ? (r === "escort" ? "var(--am)" : "var(--or)") : "transparent", color: role === r ? "#000" : "var(--t2)", border: "none", fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 700 }}>
                {r === "escort" ? "Escort / P/EVO" : "Carrier / Operator"}
              </button>
            ))}
          </div>
        )}
        {mode === "signup" && (
          <div className="form-field">
            <label className="form-label">Full Name</label>
            <input type="text" placeholder="Your full name" style={{ width: "100%" }} />
          </div>
        )}
        <div className="form-field">
          <label className="form-label">Email Address</label>
          <input type="email" placeholder="your@email.com" style={{ width: "100%" }} />
        </div>
        <div className="form-field">
          <label className="form-label">Password</label>
          <input type="password" placeholder="••••••••" style={{ width: "100%" }} />
        </div>
        {mode === "signup" && (
          <div className="form-field">
            <label className="form-label">Company / Business Name</label>
            <input type="text" placeholder="Optional" style={{ width: "100%" }} />
          </div>
        )}
        <button className="btn btn-or" style={{ width: "100%", justifyContent: "center", marginBottom: 12 }}
          onClick={() => setPage(role === "carrier" ? "dashboard-c" : "dashboard-e")}>
          {mode === "signup" ? "Create Free Account →" : "Sign In →"}
        </button>
        <div style={{ textAlign: "center" }}>
          <span className="mo" style={{ fontSize: 10, color: "var(--t2)" }}>
            {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
          </span>
          <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} style={{ background: "none", border: "none", color: "var(--or)", fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: "pointer", letterSpacing: ".06em" }}>
            {mode === "signup" ? "Sign In" : "Start Free Trial"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────────────────────────────────

export default function OEHPlatform() {
  const [page, setPage] = useState<Page>("home");

  return (
    <>
      <style>{CSS}</style>
      <Ticker />
      <Nav page={page} setPage={setPage} />
      {page === "home" && <HomePage setPage={setPage} />}
      {page === "flatboard" && <FlatBoardPage setPage={setPage} />}
      {page === "bidboard" && <BidBoardPage setPage={setPage} />}
      {page === "openboard" && <OpenBidPage setPage={setPage} />}
      {page === "escorts" && <EscortsPage setPage={setPage} />}
      {page === "escprofile" && <EscProfilePage setPage={setPage} />}
      {page === "dashboard-e" && <EscortDashPage setPage={setPage} />}
      {page === "dashboard-c" && <CarrierDashPage setPage={setPage} />}
      {page === "postload" && <PostLoadPage setPage={setPage} />}
      {page === "pricing" && <PricingPage setPage={setPage} />}
      {page === "verification" && <VerificationPage />}
      {page === "signin" && <SignInPage setPage={setPage} />}
      <Footer setPage={setPage} />
    </>
  );
}
