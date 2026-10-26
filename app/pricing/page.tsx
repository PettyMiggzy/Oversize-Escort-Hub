'use client';
import SiteHeader from '@/components/SiteHeader';
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isNativeApp, openInBrowser, WEB_HOST } from "@/lib/native";
import { FREE_LAUNCH } from "@/lib/free-launch";
import PageTitle from "@/components/PageTitle";

const PRICES = {
  member:         "price_1TF00LLmfugPCRbAl6sF0Oup",
  pro:            "price_1TF021LmfugPCRbA7CGgLhC0",
  fleet_starter:  process.env.NEXT_PUBLIC_FLEET_STARTER_PRICE_ID || "price_1TMUvjLmfugPCRbAa1HHd7f3",
  fleet_plus:     process.env.NEXT_PUBLIC_FLEET_PLUS_PRICE_ID    || "price_1TMUwaLmfugPCRbAxwDBbslg",
  fleet_pro:      process.env.NEXT_PUBLIC_FLEET_PRO_PRICE_ID || "price_1TMT9fLmfugPCRbA0Tu65Ui0",
  pevo_member:    "price_1TF0D4LmfugPCRbAd4hMO22R",
  pevo_pro:       "price_1TF0DiLmfugPCRbAPWsN2K5x",
  bgc:            "price_1TF0EILmfugPCRbAvM6Q5rhW",
  sponsored_zone: "price_1TLSu3LmfugPCRbAsumfZjCf",
};

async function startCheckout(priceId: string, setLoading: (v: string) => void, zone?: string) {
  // While everything is free the plans are not sold; sponsored zones (ads) still are.
  if (FREE_LAUNCH && priceId !== PRICES.sponsored_zone) {
    const { data: { user } } = await createClient().auth.getUser();
    window.location.href = user ? '/dashboard' : '/signin';
    return;
  }
  // Purchases are made on the website, not inside the app.
  if (isNativeApp()) {
    openInBrowser('/pricing');
    if (typeof window !== 'undefined') {
      window.alert('Please continue on oversize-escort-hub.com in your browser.');
    }
    return;
  }
  const supabase = createClient();
  setLoading(priceId);
  try {
    let { data: { session } } = await supabase.auth.getSession();

    if (!session) {

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {

        window.location.href = "/signin?redirect=pricing";

        return;

      }

    }

    const user = session?.user ?? (await supabase.auth.getUser()).data.user!;
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, userId: user.id, ...(zone ? { zone } : {}) }),
    });
    const { url, error } = await res.json();
    if (error) { alert("Error: " + error); return; }
    if (!url) { alert("No checkout URL returned"); return; }
    window.location.href = url;
  } catch (e) {
    alert("Checkout failed");
  } finally {
    setLoading("");
  }
}

const TEXT = "var(--ui-text)";
const MUTED = "var(--ui-muted)";
const ORANGE = "var(--ui-or)";

function Card({ highlight, children }: { highlight?: boolean; children: React.ReactNode }) {
  return (
    <div className={highlight ? "ui-card warn" : "ui-card"} style={{ display: "flex", flexDirection: "column", position: "relative" }}>
      {children}
    </div>
  );
}

function CTA({ label, onClick, disabled, loading }: { label: string; onClick?: () => void; disabled?: boolean; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="ui-btn block"
      style={{ marginTop: "auto" }}
    >
      {loading ? "Processing..." : label}
    </button>
  );
}

function GhostCTA({ label, href }: { label: string; href: string }) {
  return (
    <a href={href} className="ui-btn ghost block" style={{ marginTop: "auto" }}>{label}</a>
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
      <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0, fontFamily: "'Plus Jakarta Sans', Inter, sans-serif", letterSpacing: "-.02em" }}>{children}</h2>
      {subtitle && <p style={{ color: MUTED, fontSize: 14, marginTop: 6 }}>{subtitle}</p>}
    </div>
  );
}

function PriceHeader({ label, price, period, highlight }: { label: string; price: string; period?: string; highlight?: boolean }) {
  return (
    <>
      {highlight && (
        <div className="ui-badge orange" style={{ position: "absolute", top: -11, right: 16 }}>Most popular</div>
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
    const supabase = createClient();
    const { data } = await supabase.from('sponsored_zones').select('state').eq('active', true);
    setTakenZones(((data || []) as Array<{ state: string }>).map((r) => r.state));
    setShowZoneModal(true);
  };

  const handleZoneCheckout = async () => {
    if (isNativeApp()) {
      openInBrowser('/pricing');
      if (typeof window !== 'undefined') {
        window.alert('Please continue on oversize-escort-hub.com in your browser.');
      }
      return;
    }
    const supabase = createClient();
    if (!selectedZone) return;
    setZoneLoading(true);
    try {
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (!u) { window.location.href = '/signin?redirect=pricing'; return; }
      }
      const user = session?.user ?? (await supabase.auth.getUser()).data.user!;
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: PRICES.sponsored_zone,
          userId: user.id,
          zone: selectedZone,
        }),
      });
      const d = await res.json();
      if (!d.url) { alert('Checkout error: ' + (d.error ?? 'Unknown')); return; }
      window.location.href = d.url;
    } catch (e: any) {
      alert('Checkout failed: ' + e.message);
    } finally {
      setZoneLoading(false);
    }
  };

  const [loading, setLoading] = useState("");

  return (
    <div className="ui-page">
      <SiteHeader />
      {isNativeApp() && (
        <div
          style={{
            background: 'rgba(255,255,255,.04)',
            borderBottom: '1px solid rgba(255,255,255,.09)',
            color: '#fff',
            padding: '14px 18px',
            fontSize: 13,
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <strong style={{ color: ORANGE }}>Plans and purchases are on our website.</strong>{' '}
            Please visit{' '}
            <a
              href={`${WEB_HOST}/pricing`}
              onClick={(e) => { e.preventDefault(); openInBrowser('/pricing'); }}
              style={{ color: ORANGE, textDecoration: 'underline' }}
            >
              oversize-escort-hub.com/pricing
            </a>
            {' '}in your browser. Your account works everywhere, web and app.
          </div>
        </div>
      )}
      <div className="ui-wrap">
        <PageTitle eyebrow="Plans" title="Pricing" lead="Plans for escorts, carriers, brokers and fleets." />
        {FREE_LAUNCH && (
          <div className="ui-card warn" style={{ padding: "18px 22px", margin: "0 auto 28px", maxWidth: 760, textAlign: "center" }}>
            <div style={{ color: ORANGE, fontFamily: "'Plus Jakarta Sans', Inter, sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: "-.02em" }}>Free while we launch</div>
            <p style={{ color: TEXT, fontSize: 15, margin: "8px 0 14px" }}>Every feature is unlocked for every account. No card needed. We will give plenty of notice before any plan costs anything.</p>
            <a href="/signin" className="ui-btn">Create your free account</a>
          </div>
        )}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          
          <p style={{ color: MUTED, fontSize: 15, marginTop: 8 }}>Simple plans for escorts, fleets, and carriers.</p>
        </div>

        {FREE_LAUNCH && (
          <div className="ui-fit" style={{ marginBottom: 40 }}>
            <Card>
              <PriceHeader label="Escorts" price="$0" period=" while we launch" />
              <Features items={["Flat-rate, open-bid and 5-minute bid boards", "Bid on loads and see contact info when matched", "Deadhead Minimizer", "Load and bid alerts by email", "Verification badges", "Reviews"]} />
              <CTA label="Join as an escort" onClick={() => { window.location.href = "/signin?mode=signup&role=escort"; }} />
            </Card>
            <Card highlight>
              <PriceHeader label="Carriers & brokers" price="$0" period=" while we launch" highlight />
              <Features items={["Post loads in minutes", "Get bids and claims from escorts", "Review certifications, ratings and badges", "Email and in-app alerts", "Match and confirm in the app"]} />
              <CTA label="Post a load" onClick={() => { window.location.href = "/signin?mode=signup&role=carrier"; }} />
            </Card>
            <Card>
              <PriceHeader label="Fleets" price="$0" period=" while we launch" />
              <Features items={["Manage several escorts in one account", "Fleet search", "Fleet deadhead planning", "Jobs, invoices and earnings in one dashboard"]} />
              <GhostCTA label="Set up a fleet" href="/join?role=fleet" />
            </Card>
          </div>
        )}
        {!FREE_LAUNCH && (<>
        {/* SECTION 1 — ESCORT TIERS */}
        <SectionTitle subtitle="For P/EVO operators">Escort Tiers</SectionTitle>
        <div className="ui-fit">
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
              "SMS alerts when loads drop (coming soon)",
              "SMS load posting (coming soon)",
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
        <div className="ui-fit">
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
        <div className="ui-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: MUTED, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Carrier</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: TEXT }}>Always Free</div>
            <div style={{ color: MUTED, fontSize: 13, marginTop: 8, maxWidth: 520, lineHeight: 1.6 }}>
              Post unlimited loads on all 3 boards, FMCSA-verified badge, permit directory, and carrier dashboard. No subscription required.
            </div>
          </div>
          <GhostCTA label="Sign Up Free" href="/signin" />
        </div>

        </>)}
        {/* SECTION 4 — ADD-ONS */}
        <SectionTitle subtitle="One-time purchases and boosts">Add-Ons</SectionTitle>
        <div className="ui-fit">
          <Card>
            <PriceHeader label="BGC Badge" price={FREE_LAUNCH ? "Free" : "$9.99"} period={FREE_LAUNCH ? " while we launch" : " one-time"} />
            <Features items={[
              "Background check review",
              "Badge appears on profile upon approval",
            ]} />
            <CTA label="Get BGC Badge" onClick={() => startCheckout(PRICES.bgc, setLoading)} loading={loading === PRICES.bgc} />
          </Card>
          <Card>
            <PriceHeader label={FREE_LAUNCH ? "P/EVO Cert Review" : "P/EVO Cert Review — Member"} price={FREE_LAUNCH ? "Free" : "$14.99"} period={FREE_LAUNCH ? " while we launch" : undefined} />
            <Features items={[
              FREE_LAUNCH ? "Cert document review" : "Cert document review for Member tier",
              "Covers Cert Review + Verification",
            ]} />
            <CTA label="Buy Review" onClick={() => startCheckout(PRICES.pevo_member, setLoading)} loading={loading === PRICES.pevo_member} />
          </Card>
          {!FREE_LAUNCH && (<Card>
            <PriceHeader label="P/EVO Cert Review — Pro" price="$9.99" />
            <Features items={[
              "Discounted for Pro tier",
              "Covers Cert Review + Verification",
            ]} />
            <CTA label="Buy Review" onClick={() => startCheckout(PRICES.pevo_pro, setLoading)} loading={loading === PRICES.pevo_pro} />
          </Card>)}
          {!isNativeApp() && (<Card>
            <div id="sponsored" />
            <PriceHeader label="Sponsored Zone" price="$29.99" period="/30 days" />
            <Features items={[
              "Featured at top of Find Escorts",
              "Highlighted badge",
              "State-specific targeting",
            ]} />
            <CTA label="Get Sponsored" onClick={handleSponsoredClick} loading={false} />
          </Card>)}
        </div>

        {/* SECTION 5 — PARTNER PERKS */}
        <SectionTitle subtitle="Included benefits from OEH partners">Partner Perks</SectionTitle>
        <div className="ui-fit">
          <div className="ui-card">
            <div className="ui-badge orange" style={{ marginBottom: 8 }}>Partner benefit</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Upside Fuel Cash Back</div>
            <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginBottom: 12 }}>
              Extra 15¢/gal cash back on your first fill-up. Use code <strong style={{ color: "#fff" }}>9WR232</strong> when signing up.
            </div>
            <a href="https://upside.app.link/9WR232" target="_blank" rel="noopener noreferrer" className="ui-link">Claim Upside Bonus →</a>
          </div>
        </div>
      </div>
          {showZoneModal && (
        <div
          onClick={() => !zoneLoading && setShowZoneModal(false)}
          className="ui-modal-back"
        >
          <div
            className="ui-modal wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: TEXT, margin: 0 }}>Pick Your Sponsored Zone</h2>
              <button
                onClick={() => !zoneLoading && setShowZoneModal(false)}
                className="ui-btn ghost"
                style={{ minWidth: 44, padding: '0 14px' }}
                aria-label="Close"
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
                    className={selected ? 'ui-chip on' : 'ui-chip'}
                    style={{ justifyContent: 'center', opacity: taken ? 0.45 : 1 }}
                  >
                    {code}{taken ? ' •' : ''}
                  </button>
                );
              })}
            </div>
            <button
              disabled={!selectedZone || zoneLoading}
              onClick={handleZoneCheckout}
              className="ui-btn block"
            >
              {zoneLoading ? 'Processing…' : selectedZone ? `Checkout — ${selectedZone}` : 'Select a zone'}
            </button>
          </div>
        </div>
      )}
</div>
  );
}
