'use client';
import { useState } from 'react';
import Link from 'next/link';

/* ── Hardcoded permit data for all 50 states ── */
const PERMIT_DATA: Record<string, { name: string; phone: string; url: string; notes: string }> = {
  AL: { name: 'Alabama', phone: '(334) 242-6350', url: 'permits.dot.state.al.us', notes: 'No Sunday/holiday travel for superloads without prior approval.' },
  AK: { name: 'Alaska', phone: '(907) 465-8990', url: 'dot.alaska.gov/stwddes/dcsspermit', notes: 'Contact district office for routes. Seasonal weight restrictions apply.' },
  AZ: { name: 'Arizona', phone: '(602) 712-7355', url: 'azdot.gov/permits', notes: 'Permits valid 10 days. Over 14 ft wide requires special routing.' },
  AR: { name: 'Arkansas', phone: '(501) 569-2381', url: 'ardot.gov/permits', notes: 'No travel on Sunday or holidays for loads over 16 ft wide.' },
  CA: { name: 'California', phone: '(916) 654-2852', url: 'dot.ca.gov/permits', notes: 'Caltrans district approval required for overwidth. Pilot cars at 14ft+.' },
  CO: { name: 'Colorado', phone: '(303) 757-9539', url: 'codot.gov/permits', notes: 'Mountain corridor restrictions. I-70 chain law may apply.' },
  CT: { name: 'Connecticut', phone: '(860) 594-2860', url: 'portal.ct.gov/dot/permits', notes: 'Permit required for loads over 8ft 6in wide. No movement on holidays.' },
  DE: { name: 'Delaware', phone: '(302) 659-4090', url: 'deldot.gov/permits', notes: 'Superload routes reviewed case by case. Bridge clearances critical.' },
  FL: { name: 'Florida', phone: '(850) 410-5777', url: 'fdot.gov/permits', notes: 'E-TRIP online permit system. Hurricane evacuation routes restricted.' },
  GA: { name: 'Georgia', phone: '(404) 635-8176', url: 'gdot.org/permits', notes: 'Permit valid for 5 days. Pilot car required over 12 ft wide.' },
  HI: { name: 'Hawaii', phone: '(808) 831-6706', url: 'hidot.hawaii.gov', notes: 'Island-specific permits. Contact county for additional requirements.' },
  ID: { name: 'Idaho', phone: '(208) 334-8420', url: 'itd.idaho.gov/permits', notes: 'Seasonal restrictions on US-95. Daylight travel only for superloads.' },
  IL: { name: 'Illinois', phone: '(217) 785-1477', url: 'idot.illinois.gov/permits', notes: 'IDOT permit portal online. Chicago metro requires special routing.' },
  IN: { name: 'Indiana', phone: '(317) 232-5078', url: 'in.gov/indot/permits', notes: 'OSOW permit system. I-94 and I-65 corridors heavily monitored.' },
  IA: { name: 'Iowa', phone: '(515) 239-1890', url: 'iowadot.gov/permits', notes: 'Spring weight restrictions typically March-May. Call for current dates.' },
  KS: { name: 'Kansas', phone: '(785) 296-3801', url: 'ksdot.org/permits', notes: 'Online permits available. Wind energy corridors require advance notice.' },
  KY: { name: 'Kentucky', phone: '(502) 564-4556', url: 'transportation.ky.gov/permits', notes: 'No Sunday travel for oversize loads on state highways.' },
  LA: { name: 'Louisiana', phone: '(225) 379-1839', url: 'dotd.la.gov/permits', notes: 'Requires 72-hour notice for superloads. Bayou bridge restrictions.' },
  ME: { name: 'Maine', phone: '(207) 624-3648', url: 'maine.gov/mdot/permits', notes: 'Spring weight restrictions apply. Contact for current road bans.' },
  MD: { name: 'Maryland', phone: '(410) 582-5523', url: 'mdot.maryland.gov/permits', notes: 'SHA coordinates with Bay Bridge authority. No holiday travel.' },
  MA: { name: 'Massachusetts', phone: '(617) 973-7800', url: 'mass.gov/dot/permits', notes: 'Boston metro restricted hours. Historic district routing required.' },
  MI: { name: 'Michigan', phone: '(517) 373-2120', url: 'michigan.gov/mdot/permits', notes: 'Spring weight restrictions. Bridge permit required for Mackinac crossings.' },
  MN: { name: 'Minnesota', phone: '(651) 296-6000', url: 'dot.state.mn.us/permits', notes: 'Spring load restrictions March-May. Twin Cities metro restrictions.' },
  MS: { name: 'Mississippi', phone: '(601) 359-7011', url: 'mdot.ms.gov/permits', notes: 'No Sunday travel on state highways for oversize loads.' },
  MO: { name: 'Missouri', phone: '(573) 751-7163', url: 'modot.org/permits', notes: 'St. Louis metro special routing. Night travel may be required.' },
  MT: { name: 'Montana', phone: '(406) 444-6130', url: 'mdt.mt.gov/permits', notes: 'Mountain passes have seasonal restrictions. Contact district office.' },
  NE: { name: 'Nebraska', phone: '(402) 471-0034', url: 'dot.nebraska.gov/permits', notes: 'Wind turbine corridor routes available. Online system preferred.' },
  NV: { name: 'Nevada', phone: '(775) 888-7582', url: 'dot.nv.gov/permits', notes: 'Las Vegas metro restricted hours. US-93 superload route review required.' },
  NH: { name: 'New Hampshire', phone: '(603) 271-2691', url: 'nh.gov/dot/permits', notes: 'No Sunday travel for loads over 12ft wide. Spring restrictions apply.' },
  NJ: { name: 'New Jersey', phone: '(609) 530-2002', url: 'nj.gov/dot/permits', notes: 'Turnpike authority coordinates separately. Urban routing restrictions.' },
  NM: { name: 'New Mexico', phone: '(505) 827-0427', url: 'dot.nm.gov/permits', notes: 'Tribal land crossing may require additional permits. High wind areas.' },
  NY: { name: 'New York', phone: '(518) 457-6520', url: 'dot.ny.gov/permits', notes: 'NY Certificate required. Thruway authority permit separate. Complex routing.' },
  NC: { name: 'North Carolina', phone: '(919) 707-2820', url: 'ncdot.gov/permits', notes: 'No Sunday travel. Permits valid 3-5 days. Online NCDOT system.' },
  ND: { name: 'North Dakota', phone: '(701) 328-2500', url: 'dot.nd.gov/permits', notes: 'Oil field traffic corridors. Spring weight restrictions apply.' },
  OH: { name: 'Ohio', phone: '(614) 351-2300', url: 'dot.state.oh.us/permits', notes: 'OHGO permit system online. Columbus and Cleveland metro restrictions.' },
  OK: { name: 'Oklahoma', phone: '(405) 521-6458', url: 'odot.org/permits', notes: 'Oil and gas field routes. No Sunday travel for superloads without variance.' },
  OR: { name: 'Oregon', phone: '(503) 378-6699', url: 'oregon.gov/odot/permits', notes: 'OS/OW permit portal. Requires 72-hour advance notice for superloads.' },
  PA: { name: 'Pennsylvania', phone: '(717) 787-6653', url: 'dot.state.pa.us/permits', notes: 'Turnpike authority permit separate. Bridge analysis may be required.' },
  RI: { name: 'Rhode Island', phone: '(401) 222-2053', url: 'dot.ri.gov/permits', notes: 'Small state. Most routes reviewed individually. Contact in advance.' },
  SC: { name: 'South Carolina', phone: '(803) 737-6880', url: 'scdot.org/permits', notes: 'No Sunday travel on state highways. Port of Charleston routing available.' },
  SD: { name: 'South Dakota', phone: '(605) 773-3265', url: 'dot.sd.gov/permits', notes: 'Wind energy corridor routes. Spring weight restrictions apply.' },
  TN: { name: 'Tennessee', phone: '(615) 741-3821', url: 'tn.gov/tdot/permits', notes: 'No Sunday or holiday travel. Nashville and Memphis metro restrictions.' },
  TX: { name: 'Texas', phone: '(512) 486-5800', url: 'sos.state.tx.us/permits', notes: 'TxDMV permit system. Large state. Multi-district routing required for superloads.' },
  UT: { name: 'Utah', phone: '(801) 965-4508', url: 'udot.utah.gov/permits', notes: 'Mountain corridor restrictions. Seasonal weight limits on I-80.' },
  VT: { name: 'Vermont', phone: '(802) 828-2063', url: 'vtrans.vermont.gov/permits', notes: 'Spring weight restrictions. Low bridge clearances on rural routes.' },
  VA: { name: 'Virginia', phone: '(804) 786-2905', url: 'vdot.virginia.gov/permits', notes: 'No Sunday travel. Northern Virginia DC area restricted hours.' },
  WA: { name: 'Washington', phone: '(360) 704-6340', url: 'wsdot.wa.gov/permits', notes: 'Online WSDOT OAP portal. Seattle metro night-only for wide loads.' },
  WV: { name: 'West Virginia', phone: '(304) 558-9500', url: 'transportation.wv.gov/permits', notes: 'Mountain routes. Pilot cars required. Many low bridge clearances.' },
  WI: { name: 'Wisconsin', phone: '(608) 266-7320', url: 'dot.wi.gov/permits', notes: 'Spring weight restrictions. No Sunday travel for loads over 15ft wide.' },
  WY: { name: 'Wyoming', phone: '(307) 777-4375', url: 'dot.state.wy.us/permits', notes: 'High wind closures on I-80. No travel restrictions during severe weather.' },
};

const STATE_ADJACENCY: Record<string, string[]> = {
  AL: ['MS','TN','GA','FL'],
  AK: [],
  AZ: ['CA','NV','UT','CO','NM'],
  AR: ['MO','TN','MS','LA','TX','OK'],
  CA: ['OR','NV','AZ'],
  CO: ['WY','NE','KS','OK','NM','AZ','UT'],
  CT: ['NY','MA','RI'],
  DE: ['MD','PA','NJ'],
  FL: ['GA','AL'],
  GA: ['TN','NC','SC','FL','AL'],
  HI: [],
  ID: ['MT','WY','UT','NV','OR','WA'],
  IL: ['WI','IN','KY','MO','IA'],
  IN: ['MI','OH','KY','IL'],
  IA: ['MN','WI','IL','MO','NE','SD'],
  KS: ['NE','MO','OK','CO'],
  KY: ['OH','WV','VA','TN','MO','IL','IN'],
  LA: ['TX','AR','MS'],
  ME: ['NH'],
  MD: ['PA','DE','VA','WV'],
  MA: ['NH','VT','NY','CT','RI'],
  MI: ['OH','IN','WI'],
  MN: ['ND','SD','IA','WI'],
  MS: ['TN','AL','LA','AR'],
  MO: ['IA','IL','KY','TN','AR','OK','KS','NE'],
  MT: ['ND','SD','WY','ID'],
  NE: ['SD','IA','MO','KS','CO','WY'],
  NV: ['OR','ID','UT','AZ','CA'],
  NH: ['ME','VT','MA'],
  NJ: ['NY','PA','DE'],
  NM: ['CO','OK','TX','AZ'],
  NY: ['PA','NJ','CT','MA','VT'],
  NC: ['VA','TN','SC','GA'],
  ND: ['MT','SD','MN'],
  OH: ['PA','WV','KY','IN','MI'],
  OK: ['KS','MO','AR','TX','NM','CO'],
  OR: ['WA','ID','NV','CA'],
  PA: ['NY','NJ','DE','MD','WV','OH'],
  RI: ['CT','MA'],
  SC: ['NC','GA'],
  SD: ['ND','MN','IA','NE','WY','MT'],
  TN: ['KY','VA','NC','GA','AL','MS','AR','MO'],
  TX: ['NM','OK','AR','LA'],
  UT: ['ID','WY','CO','NM','AZ','NV'],
  VT: ['NY','NH','MA'],
  VA: ['MD','WV','KY','TN','NC'],
  WA: ['OR','ID'],
  WV: ['OH','PA','MD','VA','KY'],
  WI: ['MN','MI','IL','IA'],
  WY: ['MT','SD','NE','CO','UT','ID'],
};

function getRouteStates(from: string, to: string): string[] {
  if (from === to) return [from];
  if (!STATE_ADJACENCY[from] || !STATE_ADJACENCY[to]) return [from, to];
  const queue: string[][] = [[from]];
  const visited = new Set<string>([from]);
  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    for (const neighbor of STATE_ADJACENCY[current] || []) {
      if (!visited.has(neighbor)) {
        const newPath = [...path, neighbor];
        if (neighbor === to) return newPath;
        visited.add(neighbor);
        queue.push(newPath);
      }
    }
  }
  return [from, to];
}

const STATE_LIST = Object.entries(PERMIT_DATA)
  .sort((a, b) => a[1].name.localeCompare(b[1].name))
  .map(([code]) => code);

const S: Record<string, React.CSSProperties> = {
  page: { background: '#0a0a0a', minHeight: '100vh', color: '#e5e7eb', fontFamily: 'sans-serif', padding: '0 0 80px' },
  hero: { background: 'linear-gradient(135deg,#111 0%,#1a1a2e 100%)', borderBottom: '1px solid #1f2937', padding: '40px 24px 32px', textAlign: 'center' },
  heroTitle: { fontSize: 'clamp(24px,5vw,38px)', fontWeight: 800, color: '#f97316', margin: '0 0 8px' },
  heroSub: { color: '#9ca3af', fontSize: 14, margin: 0 },
  container: { maxWidth: 900, margin: '0 auto', padding: '0 16px' },
  card: { background: '#111', border: '1px solid #1f2937', borderRadius: 12, padding: '24px', marginTop: 24 },
  label: { display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6, fontWeight: 600 },
  select: { width: '100%', background: '#1a1a1a', border: '1px solid #374151', borderRadius: 8, color: '#e5e7eb', padding: '10px 12px', fontSize: 14 },
  btn: { background: '#f97316', color: '#000', border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', width: '100%', marginTop: 16 },
  resultCard: { background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 10, padding: '16px 20px', marginTop: 12 },
  stateName: { fontSize: 16, fontWeight: 700, color: '#60a5fa', marginBottom: 6 },
  notes: { color: '#9ca3af', fontSize: 12, fontStyle: 'italic', marginTop: 6 },
  badge: { display: 'inline-block', background: '#0c4a6e', color: '#7dd3fc', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, marginBottom: 8 },
  disclaimer: { background: '#1a1200', border: '1px solid #92400e', borderRadius: 8, padding: '16px', marginTop: 32, color: '#fbbf24', fontSize: 12 },
  routeRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const, marginBottom: 12 },
  stateChip: { background: '#1e3a5f', color: '#93c5fd', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20 },
  arrow: { color: '#374151', fontSize: 14 },
  noData: { color: '#6b7280', textAlign: 'center' as const, padding: '32px 0', fontSize: 14 },
  backLink: { color: '#9ca3af', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 },
  gridTwo: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 },
  infoRow: { display: 'flex', gap: 8, marginBottom: 4, alignItems: 'flex-start' },
  infoLabel: { color: '#6b7280', fontSize: 12, minWidth: 60 },
  infoVal: { color: '#e5e7eb', fontSize: 13 },
};

export default function PermitDirectoryPage() {
  const [fromState, setFromState] = useState('');
  const [toState, setToState] = useState('');
  const [routeStates, setRouteStates] = useState<string[]>([]);
  const [searched, setSearched] = useState(false);

  function handleCheck() {
    if (!fromState || !toState) return;
    const states = getRouteStates(fromState, toState);
    setRouteStates(states);
    setSearched(true);
  }

  return (
    <div style={S.page}>
      <div style={S.hero}>
        <h1 style={S.heroTitle}>State Permit Directory</h1>
        <p style={S.heroSub}>Oversize load permit contacts for all 50 states</p>
      </div>
      <div style={S.container}>
        <div style={{ marginTop: 24 }}>
          <Link href="/dashboard" style={S.backLink}>Back to Dashboard</Link>
        </div>
        <div style={S.card}>
          <h2 style={{ color: '#f97316', fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Route Permit Lookup</h2>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 20px' }}>Enter origin and destination to see permit contacts on your route.</p>
          <div style={S.gridTwo}>
            <div>
              <label style={S.label}>From State</label>
              <select style={S.select} value={fromState} onChange={e => setFromState(e.target.value)}>
                <option value="">Select origin state...</option>
                {STATE_LIST.map(code => (
                  <option key={code} value={code}>{PERMIT_DATA[code].name} ({code})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={S.label}>To State</label>
              <select style={S.select} value={toState} onChange={e => setToState(e.target.value)}>
                <option value="">Select destination state...</option>
                {STATE_LIST.map(code => (
                  <option key={code} value={code}>{PERMIT_DATA[code].name} ({code})</option>
                ))}
              </select>
            </div>
          </div>
          <button style={S.btn} onClick={handleCheck} disabled={!fromState || !toState}>
            Check Permit Requirements
          </button>
        </div>

        {searched && routeStates.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ color: '#e5e7eb', fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>
              {routeStates.length} state{routeStates.length !== 1 ? 's' : ''} on your route
            </h3>
            <div style={S.routeRow}>
              {routeStates.map((s, i) => (
                <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={S.stateChip}>{s}</span>
                  {i < routeStates.length - 1 && <span style={S.arrow}>-&gt;</span>}
                </span>
              ))}
            </div>
            {routeStates.map(code => {
              const d = PERMIT_DATA[code];
              if (!d) return null;
              return (
                <div key={code} style={S.resultCard}>
                  <div style={S.badge}>PERMIT REQUIRED</div>
                  <div style={S.stateName}>{d.name}</div>
                  <div style={S.infoRow}>
                    <span style={S.infoLabel}>Phone:</span>
                    <a href={'tel:' + d.phone.replace(/[^0-9]/g,'')} style={{ color: '#34d399', fontSize: 13, textDecoration: 'none' }}>{d.phone}</a>
                  </div>
                  <div style={S.infoRow}>
                    <span style={S.infoLabel}>Website:</span>
                    <a href={'https://' + d.url} target="_blank" rel="noopener noreferrer" style={{ color: '#f97316', fontSize: 13, textDecoration: 'none' }}>{d.url}</a>
                  </div>
                  <div style={S.notes}>{d.notes}</div>
                </div>
              );
            })}
          </div>
        )}

        {searched && routeStates.length === 0 && (
          <div style={S.noData}>No route data found for selected states.</div>
        )}

        <div style={S.card}>
          <h2 style={{ color: '#f97316', fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>All 50 States Quick Reference</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 10 }}>
            {STATE_LIST.map(code => {
              const d = PERMIT_DATA[code];
              return (
                <div key={code} style={{ background: '#0d0d0d', border: '1px solid #1f2937', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{d.name} ({code})</div>
                  <div style={{ color: '#34d399', fontSize: 13 }}>{d.phone}</div>
                  <a href={'https://' + d.url} target="_blank" rel="noopener noreferrer" style={{ color: '#f97316', fontSize: 11, textDecoration: 'none', display: 'block', marginTop: 2 }}>{d.url}</a>
                </div>
              );
            })}
          </div>
        </div>

        <div style={S.disclaimer}>
          <strong>Disclaimer:</strong> Permit contact information is provided as a reference tool only. Always verify current requirements directly with each state. OEH is not responsible for permit compliance.
        </div>
      </div>
    </div>
  );
}
