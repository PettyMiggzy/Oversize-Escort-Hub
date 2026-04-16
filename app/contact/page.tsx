'use client'
import { useState } from 'react'

const S = {
  page: { minHeight: '100vh', background: '#060b16', color: '#eee', padding: '40px 20px' },
  container: { maxWidth: 600, margin: '0 auto' },
  heading: { fontSize: 28, fontWeight: 700, color: '#f60', marginBottom: 8 },
  sub: { fontSize: 16, color: '#aaa', marginBottom: 32 },
  label: { display: 'block', fontSize: 13, color: '#ccc', marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, color: '#eee', fontSize: 14, boxSizing: 'border-box' as const, marginBottom: 16 },
  btn: { background: '#f60', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  success: { background: '#1a3a1a', border: '1px solid #2d6a2d', borderRadius: 8, padding: 16, color: '#7ef07e', fontSize: 15, marginTop: 24 },
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'General Inquiry', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setSent(true)
      } else {
        const d = await res.json()
        setError(d.error || 'Failed to send. Try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setSending(false)
  }

  return (
    <div style={S.page}>
      <div style={S.container}>
        <h1 style={S.heading}>Contact Us</h1>
        <p style={S.sub}>Questions, issues, or partnership inquiries — we respond within 1 business day.</p>
        {sent ? (
          <div style={S.success}>✓ Message sent! We'll be in touch shortly.</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={S.label}>Name</label>
            <input style={S.input} required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <label style={S.label}>Email</label>
            <input style={S.input} type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            <label style={S.label}>Subject</label>
            <select style={S.input} value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}>
              <option>General Inquiry</option>
              <option>Technical Support</option>
              <option>Billing</option>
              <option>Partnership</option>
              <option>Report a User</option>
            </select>
            <label style={S.label}>Message</label>
            <textarea style={{...S.input, minHeight: 140, resize: 'vertical' as const}} required value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
            {error && <p style={{color: '#f66', marginBottom: 12}}>{error}</p>}
            <button style={S.btn} type="submit" disabled={sending}>{sending ? 'Sending...' : 'Send Message'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
