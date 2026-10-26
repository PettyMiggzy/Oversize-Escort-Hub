'use client'
import SiteHeader from '@/components/SiteHeader'

export default function NotFound() {
  return (
    <html>
      <body style={{ margin: 0 }}>
        <div className="ui-page">
          <SiteHeader />
          <div className="ui-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
            <div style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
              <img src="/logo-wordmark.png" alt="OEH" style={{ width: 'min(220px, 80%)', height: 'auto', margin: '0 auto 24px', display: 'block' }} />
              <div style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif", fontWeight: 800, fontSize: 64, letterSpacing: '-.04em', color: 'var(--ui-or)', marginBottom: 8 }}>404</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 12, color: '#fff' }}>Page not found</div>
              <p style={{ color: 'var(--ui-muted)', marginBottom: 24 }}>This page doesn&apos;t exist. Get back on the road.</p>
              <a className="ui-btn" href="/">← Back to Home</a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
