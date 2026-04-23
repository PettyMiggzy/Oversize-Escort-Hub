export function BoardAdSidebar() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24, minWidth: 220, maxWidth: 260 }}>
      {/* Sponsored Zone ad */}
      <a href="/pricing" style={{ textDecoration: 'none' }}>
        <div style={{ background: '#111', border: '1px solid #f0a500', borderRadius: 10, padding: '18px 16px', cursor: 'pointer' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#f0a500', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>⭐ Sponsored</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Get Featured Here</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>Your profile shown to carriers in your zone. BGC badge displayed. Direct contact unlocked.</div>
          <div style={{ background: '#f0a500', color: '#000', borderRadius: 6, padding: '8px 0', textAlign: 'center', fontWeight: 700, fontSize: 13 }}>
            $29.99/mo — Get Started
          </div>
        </div>
      </a>

      {/* Upside fuel ad */}
      <a href="https://upside.app.link/9WR232" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
        <div style={{ background: '#111', border: '1px solid #22c55e', borderRadius: 10, padding: '18px 16px', cursor: 'pointer' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>⛽ Save on Fuel</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Upside Cash Back</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>15¢/gal extra cash back on your first fill-up.</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>Average escort saves $600+/year.</div>
          <div style={{ background: '#22c55e', color: '#000', borderRadius: 6, padding: '8px 0', textAlign: 'center', fontWeight: 700, fontSize: 13 }}>
            Use Code: 9WR232
          </div>
        </div>
      </a>
    </div>
  )
}
