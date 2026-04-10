'use client'
export default function NotFound() {
  return (
    <html>
      <body style={{ margin: 0, background: '#0a0a0a', color: '#fff', fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <img src="/logo.png" alt="OEH" style={{ width: 48, marginBottom: 24 }} />
          <div style={{ fontSize: 64, fontWeight: 900, color: '#ff6600', marginBottom: 8 }}>404</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, letterSpacing: '.1em' }}>PAGE NOT FOUND</div>
          <p style={{ color: '#888', marginBottom: 24 }}>This page doesn&apos;t exist. Get back on the road.</p>
          <a href="/" style={{ display: 'inline-block', background: '#ff6600', color: '#000', fontWeight: 700, padding: '12px 24px', borderRadius: 6, textDecoration: 'none', fontSize: 14 }}>
            ← Back to Home
          </a>
        </div>
      </body>
    </html>
  );
}
