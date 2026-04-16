import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Veteran Discount | Oversize Escort Hub',
  description: 'Upload your DD-214 to receive 30% off your OEH membership. Coming soon.',
  openGraph: {
    title: 'Veteran Discount | Oversize Escort Hub',
    description: 'Upload your DD-214 to receive 30% off your OEH membership. Coming soon.',
    url: 'https://www.oversize-escort-hub.com/veteran-discount',
    siteName: 'Oversize Escort Hub',
  },
}

export default function VeteranDiscountPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1a', color: '#fff' }}>
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ background: '#16213a', border: '1px solid #1e3a5f', borderRadius: 12, padding: '24px 32px', marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎖️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f60', marginBottom: 8 }}>Veteran Discount — Coming Soon</h1>
          <p style={{ color: '#9ca3af', fontSize: 14 }}>We honor your service. This feature is being rolled out shortly.</p>
        </div>

        <div style={{ background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 12, padding: 32, opacity: 0.6, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 24 }}>🔒</div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#e2e8f0' }}>DD-214 Upload</h2>
          <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>
            Upload your DD-214 to receive <strong style={{ color: '#f60' }}>30% off</strong> your membership. Available soon.
          </p>
          <div style={{ border: '2px dashed #1e3a5f', borderRadius: 8, padding: 32, textAlign: 'center', color: '#4a5568', cursor: 'not-allowed' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
            <p style={{ fontSize: 13 }}>Click to upload DD-214 (PDF)</p>
            <p style={{ fontSize: 11, marginTop: 4 }}>Upload disabled — coming soon</p>
          </div>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button disabled style={{ background: '#1e3a5f', color: '#4a5568', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 600, cursor: 'not-allowed' }}>
              Submit for Review
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
