import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Text Alerts',
  description: 'How Oversize Escort Hub text alerts work: what we send, how to opt in, and how to stop.',
}

const box = { background: '#12141a', border: '1px solid #232733', borderRadius: 12, padding: 20, marginBottom: 16 } as const

export default function SmsProgramPage() {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px', color: '#e6e9ef', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 34, marginBottom: 6 }}>Oversize Escort Hub text alerts</h1>
      <p style={{ color: '#9aa3b2', marginBottom: 28 }}>Text number: (855) 601-4751 &middot; Operated by Oversize Escort Hub (oversize-escort-hub.com)</p>

      <section style={box}>
        <p><strong>Text alerts are not turned on yet.</strong> This page describes how they will work when they start. Nothing is sent until then.</p>
      </section>

      <section style={box}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>What we send</h2>
        <p>Account notices, alerts about new loads in the states you cover, updates on your bids and matches, and replies when you text us to post a load. We do not send marketing or promotional texts, and we do not share your number with anyone for their marketing.</p>
      </section>

      <section style={box}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>How you opt in</h2>
        <p>Text alerts are optional. When you create an account at oversize-escort-hub.com, you can tick this box, which is unticked by default:</p>
        <blockquote style={{ margin: '12px 0 0', padding: '12px 14px', background: '#0c0d11', borderLeft: '3px solid #ff6a13', borderRadius: 6, fontSize: 14, color: '#c9ced8' }}>
          I agree to receive text messages from Oversize Escort Hub at (855) 601-4751 about my account, load alerts, bids and matches, and texts I send to post loads. Consent is not a condition of using OEH. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Mobile information will not be shared with third parties or affiliates for marketing or promotional purposes.
        </blockquote>
      </section>

      <section style={box}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Sample messages</h2>
        <ul style={{ paddingLeft: 20, color: '#c9ced8' }}>
          <li>Oversize Escort Hub: You&apos;re subscribed to account, load and bid text alerts. Msg frequency varies. Msg &amp; data rates may apply. Reply HELP for help, STOP to cancel.</li>
          <li>Oversize Escort Hub: New load in TX: Dallas, TX to Tulsa, OK. Open the app to view and claim it.</li>
          <li>Oversize Escort Hub: Your bid was accepted. Open the load for details.</li>
        </ul>
      </section>

      <section style={box}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Stop or get help</h2>
        <p>Reply <strong>STOP</strong> to any text to stop receiving messages. Reply <strong>HELP</strong> for help, or contact us at <a href="/contact" style={{ color: '#60a5fa' }}>oversize-escort-hub.com/contact</a>. Message frequency varies. Message and data rates may apply.</p>
      </section>

      <p style={{ color: '#9aa3b2', fontSize: 14 }}>See our <a href="/privacy" style={{ color: '#60a5fa' }}>Privacy Policy</a> and <a href="/terms" style={{ color: '#60a5fa' }}>Terms &amp; Conditions</a>.</p>
    </main>
  )
}
