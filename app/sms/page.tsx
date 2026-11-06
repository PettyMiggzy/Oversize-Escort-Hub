import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Text Your Load',
  description: 'Post an oversize load to Oversize Escort Hub by text message. Free, no app, no login. How it works, what we send, how to opt in, and how to stop.',
}

const box = { background: '#12141a', border: '1px solid #232733', borderRadius: 12, padding: 20, marginBottom: 16 } as const
const h2 = { fontSize: 20, marginBottom: 8 } as const
const link = { color: '#60a5fa' } as const

export default function SmsProgramPage() {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px', color: '#e6e9ef', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 34, marginBottom: 6 }}>Text your load</h1>
      <p style={{ color: '#9aa3b2', marginBottom: 28 }}>Oversize Escort Hub (oversize-escort-hub.com) &middot; Text number: <strong style={{ color: '#fff' }}>(855) 601-4751</strong></p>

      <section style={{ ...box, borderColor: '#ff6a13' }}>
        <p style={{ fontSize: 18, marginBottom: 10 }}><strong>Too busy to open an app? Text it.</strong> Free, no app, no login.</p>
        <p style={{ marginBottom: 6 }}>Text this number a load the way you would say it:</p>
        <p style={{ background: '#0c0d11', borderLeft: '3px solid #ff6a13', borderRadius: 6, padding: '12px 14px', color: '#fff', fontWeight: 600 }}>Dallas TX to Oklahoma City OK Nov 20 lead 2.25</p>
        <p style={{ color: '#c9ced8', marginTop: 10 }}>That posts a lead car at $2.25 a mile from Dallas, TX to Oklahoma City, OK on Nov 20. Pilot cars in those states are told about it. Add more positions like <em>lead/chase</em>, or add <em>3d</em> at the end to keep it posted for three days.</p>
      </section>

      <section style={box}>
        <h2 style={h2}>How it works</h2>
        <ol style={{ paddingLeft: 20, color: '#c9ced8' }}>
          <li>Text your load to (855) 601-4751.</li>
          <li>The first time, we text back and ask for your email so nobody can post in your name. Reply with it, then tap the confirm link we email you. You only do this once.</li>
          <li>After that, every load is just a text. We reply to confirm it posted.</li>
        </ol>
        <p style={{ color: '#9aa3b2', marginTop: 10 }}>Oversize Escort Hub is a free load board. We do not check posts or the people behind them, so confirm the details with the other side.</p>
      </section>

      <section style={box}>
        <h2 style={h2}>What we send</h2>
        <p>Replies to the texts you send us: confirmations that your load posted, help if we could not read a text, and the one-time email request above. We do not send marketing or promotional texts, and we do not share your number with anyone for their marketing. Text alerts about new loads for pilot cars are not available yet. If they launch, they will be a separate opt-in and will be described here first.</p>
      </section>

      <section style={box}>
        <h2 style={h2}>How you opt in</h2>
        <p>Texting a load to (855) 601-4751 is how you opt in to our replies to that conversation. You can also tick this optional box (unticked by default) when you create an account at oversize-escort-hub.com:</p>
        <blockquote style={{ margin: '12px 0 0', padding: '12px 14px', background: '#0c0d11', borderLeft: '3px solid #ff6a13', borderRadius: 6, fontSize: 14, color: '#c9ced8' }}>
          I agree to receive text messages from Oversize Escort Hub at (855) 601-4751 about my account, load alerts, bids and matches, and texts I send to post loads. Consent is not a condition of using OEH. Message frequency varies. Message and data rates may apply. Reply STOP to cancel, HELP for help. See the Privacy Policy and Terms.
        </blockquote>
      </section>

      <section style={box}>
        <h2 style={h2}>Sample messages</h2>
        <ul style={{ paddingLeft: 20, color: '#c9ced8' }}>
          <li>OEH: Load posted. flat-rate Dallas TX → Oklahoma City OK, Nov 20, Lead $2.25/mi.</li>
          <li>OEH: Got your load. One quick step so nobody posts in your name: reply with your email address and we will send a link to confirm. You only do this once.</li>
          <li>OEH: I could not read the date. Use 11/10 or Nov 10. Text it like this: Dallas TX to Oklahoma City OK 11/10 lead 2.25.</li>
        </ul>
      </section>

      <section style={box}>
        <h2 style={h2}>Stop or get help</h2>
        <p>Reply <strong>STOP</strong> to any text to stop receiving messages. Reply <strong>HELP</strong> for help, or contact us at <a href="/contact" style={link}>oversize-escort-hub.com/contact</a>. Message frequency varies. Message and data rates may apply. Consent is not a condition of using Oversize Escort Hub.</p>
      </section>

      <p style={{ color: '#9aa3b2', fontSize: 14 }}>See our <a href="/privacy" style={link}>Privacy Policy</a> and <a href="/terms" style={link}>Terms &amp; Conditions</a>.</p>
    </main>
  )
}
