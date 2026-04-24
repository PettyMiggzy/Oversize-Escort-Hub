'use client';
import SiteHeader from '@/components/SiteHeader';
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const PRICES = {
  member:         "price_1TF00LLmfugPCRbAl6sF0Oup",
  pro:            "price_1TF021LmfugPCRbA7CGgLhC0",
  fleet_starter:  process.env.NEXT_PUBLIC_FLEET_STARTER_PRICE_ID || "price_1TMUvjLmfugPCRbAa1HHd7f3",
  fleet_plus:     process.env.NEXT_PUBLIC_FLEET_PLUS_PRICE_ID    || "price_1TMUwaLmfugPCRbAxwDBbslg",
  fleet_pro:      "price_1TMT9fLmfugPCRbA0Tu65Ui0",
  pevo_member:    "price_1TF0D4LmfugPCRbAd4hMO22R",
  pevo_pro:       "price_1TF0DiLmfugPCRbAPWsN2K5x",
  bgc:            "price_1TF0EILmfugPCRbAvM6Q5rhW",
  sponsored_zone: "price_1TLSu3LmfugPCRbAsumfZjCf",
};

async function startCheckout(priceId: string, setLoading: (v: string) => void, zone?: string) {
  setLoading(priceId);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "/signin?redirect=pricing";
      return;
    }
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, userId: session.user.id, ...(zone ? { zone } : {}) }),
    });
    const { url, error } = await res.json();
    if (error) { alert("Error: " + error); return; }
    window.location.href = url;
  } catch (e) {
    alert("Checkout failed");
  } finally {
    setLoading("");
  }
}

const BG = "#0a0a0a";
const CARD = "#111";
const BORDER = "#222";
const ORANGE = "#f0a500";
const TEXT = "#fff";
const MUTED = "#9ca3af";

function Card({ highlight, children }: { highlight?: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      background: CARD,
      border: highlight ? `2px solid ${ORANGE}` : `1px solid ${BORDER}`,
      borderRadius: 12,
      padding: "24px 22px",
      display: "flex",
      flexDirection: "column",
      position: "relative",
    }}>
      {children}
    </div>
  );
}

function CTA({ label, onClick, disabled, loading }: { label: string; onClick?: () => void; disabled?: boolean; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        marginTop: "auto",
        background: ORANGE,
        color: "#000",
        border: "none",
        borderRadius: 6,
        padding: "12px 20px",
        fontWeight: 700,
        fontSize: 15,
        cursor: disabled || loading ? "default" : "pointer",
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? "Processing..." : label}
    </button>
  );
}

function GhostCTA({ label, href }: { label: string; href: string }) {
  return (
    <a href={href} style={{
      marginTop: "auto",
      background: "transparent",
      color: ORANGE,
      border: `1px solid ${ORANGE}`,
      borderRadius: 6,
      padding: "12px 20px",
      fontWeight: 700,
      fontSize: 15,
      textAlign: "center",
      textDecoration: "none",
      display: "block",
    }}>{label}</a>
  );
}

function Features({ items }: { items: string[] }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((f, i) => (
        <li key={i} style={{ color: MUTED, fontSize: 13, lineHeight: 1.5, paddingLeft: 18, position: "relative" }}>
          <span style={{ position: "absolute", left: 0, color: ORANGE }}>✓</span>{f}
        </li>
      ))}
    </ul>
  );
}

function SectionTitle({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <div style={{ margin: "32px 0 20px", textAlign: "center" }}>
      <h2 style={{ color: TEXT, fontSize: 26, fontWeight: 800, margin: 0 }}>{children}</h2>
      {subtitle && <p style={{ color: MUTED, fontSize: 14, marginTop: 6 }}>{subtitle}</p>}
    </div>
  );
}

function PriceHeader({ label, price, period, highlight }: { label: string; price: string; period?: string; highlight?: boolean }) {
  return (
    <>
      {highlight && (
        <div style={{
          position: "absolute", top: -11, right: 16, background: ORANGE, color: "#000",
          fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 99, letterSpacing: "0.08em"
        }}>MOST POPULAR</div>
      )}
      <div style={{ color: MUTED, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ color: TEXT, fontSize: 32, fontWeight: 800 }}>{price}</span>
        {period && <span style={{ color: MUTED, fontSize: 14 }}>{period}</span>}
      </div>
    </>
  );
}

export default function PricingPage() {
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState('');
  const [zoneLoading, setZoneLoading] = useState(false);
  const [takenZones, setTakenZones] = useState<string[]>([]);

  const handleSponsoredClick = async () => {
    const { data } = await supabase.from('sponsored_zones').select('state').eq('active', true);
    setTakenZones(((data || []) as Array<{ state: string }>).map((r) => r.state));
    setShowZoneModal(true);
  };

  const handleZoneCheckout = async () => {
    if (!selectedZone) return;
    setZoneLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = '/signin?redirect=pricing'; return; }
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: PRICES.sponsored_zone,
          userId: session.user.id,
          zone: selectedZone,
        }),
      });
      const d = await res.json();
      if (d.url) window.location.href = d.url;
      else alert('Checkout error: ' + (d.error ?? 'Unknown'));
    } catch (e: any) {
      alert('Checkout failed: ' + e.message);
    } finally {
      setZoneLoading(false);
    }
  };

  const [loading, setLoading] = useState("");

  return (
    <div style={{ background: BG, minHeight: "100vh", color: TEXT }}>
      <SiteHeader />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <h1 style={{ fontSize: 40, fontWeight: 900, margin: 0 }}>Pricing</h1>
          <p style={{ color: MUTED, fontSize: 15, marginTop: 8 }}>Simple plans for escorts, fleets, and carriers.</p>
        </div>

        {/* SECTION 1 — ESCORT TIERS */}
        <SectionTitle subtitle="For P/EVO operators">Escort Tiers</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          <Card>
            <PriceHeader label="Free Trial" price="Free" />
            <Features items={[
              "Create escort profile",
              "See blurred boards (preview)",
              "Preview all tools",
              "No bidding or contact info access",
            ]} />
            <GhostCTA label="Start Free" href="/signin" />
          </Card>
          <Card>
            <PriceHeader label="Member" price="$19.99" period="/mo" />
            <Features items={[
              "Load board access (60s delay)",
              "Bid on loads",
              "See carrier contact info",
              "Push notifications",
              "Permit directory — all 50 states + Canada",
              "Reviews system",
            ]} />
            <CTA label="Get Member" onClick={() => startCheckout(PRICES.member, setLoading)} loading={loading === PRICES.member} />
          </Card>
          <Card highlight>
            <PriceHeader label="Pro" price="$29.99" period="/mo" highlight />
            <Features items={[
              "Instant load access — 60s head start over Member",
              "SMS alerts when loads drop",
              "SMS load posting",
              "Deadhead Minimizer",
              "Escort Availability Board",
              "First cert verification free",
              "Priority listing + Invoice Generator",
            ]} />
            <CTA label="Get Pro" onClick={() => startCheckout(PRICES.pro, setLoading)} loading={loading === PRICES.pro} />
          </Card>
        </div>

        {/* SECTION 2 — FLEET TIERS */}
        <SectionTitle subtitle="Manage multiple escorts">Fleet Tiers</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          <Card>
            <PriceHeader label="Fleet Starter" price="$29.99" period="/mo" />
            <Features items={[
              "Up to 5 escorts",
              "Basic load board access",
              "Fleet dashboard",
            ]} />
            <CTA label="Get Fleet Starter" onClick={() => startCheckout(PRICES.fleet_starter, setLoading)} loading={loading === PRICES.fleet_starter} />
          </Card>
          <Card>
            <PriceHeader label="Fleet Plus" price="$49.99" period="/mo" />
            <Features items={[
              "Up to 15 escorts",
              "Priority notifications",
              "Advanced reporting",
            ]} />
            <CTA label="Get Fleet Plus" onClick={() => startCheckout(PRICES.fleet_plus, setLoading)} loading={loading === PRICES.fleet_plus} />
          </Card>
          <Card>
            <PriceHeader label="Fleet Pro" price="$99.99" period="/mo" />
            <Features items={[
              "Unlimited escorts",
              "White-label capabilities",
              "Custom integrations",
              "Dedicated account manager",
            ]} />
            <CTA label="Get Fleet Pro" onClick={() => startCheckout(PRICES.fleet_pro, setLoading)} loading={loading === PRICES.fleet_pro} />
          </Card>
        </div>

        {/* SECTION 3 — CARRIER */}
        <SectionTitle>Carrier</SectionTitle>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: MUTED, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Carrier</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: TEXT }}>Always Free</div>
            <div style={{ color: MUTED, fontSize: 13, marginTop: 8, maxWidth: 520, lineHeight: 1.6 }}>
              Post unlimited loads on all 3 boards, FMCSA-verified badge, permit directory, and carrier dashboard. No subscription required.
            </div>
          </div>
          <GhostCTA label="Sign Up Free" href="/signin" />
        </div>

        {/* SECTION 4 — ADD-ONS */}
        <SectionTitle subtitle="One-time purchases and boosts">Add-Ons</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          <Card>
            <PriceHeader label="BGC Badge" price="$9.99" period=" one-time" />
            <Features items={[
              "Background check review",
              "Badge appears on profile upon approval",
            ]} />
            <CTA label="Get BGC Badge" onClick={() => startCheckout(PRICES.bgc, setLoading)} loading={loading === PRICES.bgc} />
          </Card>
          <Card>
            <PriceHeader label="P/EVO Cert Review — Member" price="$14.99" />
            <Features items={[
              "Cert document review for Member tier",
              "Covers Cert Review + Verification",
            ]} />
            <CTA label="Buy Review" onClick={() => startCheckout(PRICES.pevo_member, setLoading)} loading={loading === PRICES.pevo_member} />
          </Card>
          <Card>
            <PriceHeader label="P/EVO Cert Review — Pro" price="$9.99" />
            <Features items={[
              "Discounted for Pro tier",
              "Covers Cert Review + Verification",
            ]} />
            <CTA label="Buy Review" onClick={() => startCheckout(PRICES.pevo_pro, setLoading)} loading={loading === PRICES.pevo_pro} />
          </Card>
          <Card>
            <PriceHeader label="Sponsored Zone" price="$29.99" period="/mo" />
            <Features items={[
              "Featured at top of Find Escorts",
              "Highlighted badge",
              "State-specific targeting",
            ]} />
            <CTA label="Get Sponsored" onClick={handleSponsoredClick} loading={false} />
          </Card>
        </div>

        {/* SECTION 5 — PARTNER PERKS */}
        <SectionTitle subtitle="Included benefits from OEH partners">Partner Perks</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "24px 26px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: ORANGE, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
              ⛽ Partner Benefit
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 8 }}>Upside Fuel Cash Back</div>
            <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginBottom: 12 }}>
              Extra 15¢/gal cash back on your first fill-up. Use code <strong style={{ color: TEXT }}>9WR232</strong> when signing up.
            </div>
            <a href="https://upside.app.link/9WR232" target="_blank" rel="noopener noreferrer" style={{
              color: ORANGE, fontSize: 13, fontWeight: 700, textDecoration: "none", borderBottom: `1px solid ${ORANGE}`
            }}>Claim Upside Bonus →</a>
          </div>
        </div>
      </div>
          {showZoneModal && (
        <div
          onClick={() => !zoneLoading && setShowZoneModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12,
              padding: 24, maxWidth: 720, width: '100%', maxHeight: '85vh', overflow: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: TEXT, margin: 0 }}>Pick Your Sponsored Zone</h2>
              <button
                onClick={() => !zoneLoading && setShowZoneModal(false)}
                style={{ background: 'transparent', border: 'none', color: MUTED, fontSize: 24, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>
              One carrier per state/province. Taken zones are greyed out.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8, marginBottom: 20 }}>
              {[
                'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
                'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
                'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
                'AB','BC','MB','NB','NL','NS','ON','PE','QC','SK',
              ].map((code) => {
                const taken = takenZones.includes(code);
                const selected = selectedZone === code;
                return (
                  <button
                    key={code}
                    disabled={taken || zoneLoading}
                    onClick={() => setSelectedZone(code)}
                    style={{
                      padding: '10px 8px', borderRadius: 6, fontSize: 13, fontWeight: 700,
                      border: selected ? `2px solid ${ORANGE}` : `1px solid ${BORDER}`,
                      background: taken ? '#1a1a1a' : (selected ? ORANGE : CARD),
                      color: taken ? '#555' : (selected ? '#000' : TEXT),
                      cursor: taken ? 'not-allowed' : 'pointer',
                      opacity: taken ? 0.5 : 1,
                    }}
                  >
                    {code}{taken ? ' •' : ''}
                  </button>
                );
              })}
            </div>
            <button
              disabled={!selectedZone || zoneLoading}
              onClick={handleZoneCheckout}
              style={{
                width: '100%', padding: '12px 20px', background: ORANGE, color: '#000',
                border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 700,
                cursor: !selectedZone || zoneLoading ? 'default' : 'pointer',
                opacity: !selectedZone || zoneLoading ? 0.6 : 1,
              }}
            >
              {zoneLoading ? 'Processing…' : selectedZone ? `Checkout — ${selectedZone}` : 'Select a zone'}
            </button>
          </div>
        </div>
      )}
</div>
  );
}
