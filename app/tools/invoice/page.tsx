'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'
import { createClient } from '@/lib/supabase/client'

type Item = { desc: string; qty: string; price: string }
type Form = {
  fromName: string; fromEmail: string; fromPhone: string; fromAddress: string
  toName: string; toEmail: string; toAddress: string
  number: string; date: string; terms: string; notes: string
  items: Item[]
}

const KEY = 'oeh-invoice-draft-v1'
const today = () => new Date().toISOString().slice(0, 10)
const money = (n: number) => `$${n.toFixed(2)}`
const num = (s: string) => { const n = Number(s); return Number.isFinite(n) && n >= 0 ? n : 0 }

const BLANK: Form = {
  fromName: '', fromEmail: '', fromPhone: '', fromAddress: '',
  toName: '', toEmail: '', toAddress: '',
  number: '', date: today(), terms: 'Due on receipt', notes: '',
  items: [{ desc: '', qty: '1', price: '' }],
}

const QUICK: [string, string][] = [
  ['Per mile', 'Escort service, per mile'],
  ['Day rate', 'Escort service, day rate'],
  ['Overnight', 'Overnight fee'],
  ['No-go', 'No-go fee'],
  ['Fuel / tolls', 'Fuel and tolls'],
]

export default function InvoiceTool() {
  const [f, setF] = useState<Form>(BLANK)
  const [msg, setMsg] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let saved: Partial<Form> | null = null
    try { const raw = localStorage.getItem(KEY); if (raw) saved = JSON.parse(raw) } catch {}
    if (saved && Array.isArray(saved.items)) setF({ ...BLANK, ...saved, date: today() })
    else {
      // first visit: fill the From box from the signed-in profile (the person can change everything)
      createClient().auth.getUser().then(async ({ data }) => {
        const u = data.user; if (!u) return
        const { data: p } = await createClient().from('profiles').select('full_name, company_name, phone').eq('id', u.id).maybeSingle()
        setF((cur) => ({ ...cur, fromName: (p as any)?.company_name || (p as any)?.full_name || '', fromEmail: u.email ?? '', fromPhone: (p as any)?.phone ?? '' }))
      }).catch(() => {})
    }
    setReady(true)
  }, [])

  useEffect(() => { if (ready) { try { localStorage.setItem(KEY, JSON.stringify(f)) } catch {} } }, [f, ready])

  const total = useMemo(() => f.items.reduce((a, i) => a + num(i.qty) * num(i.price), 0), [f.items])
  const set = (k: keyof Form, v: string) => setF((c) => ({ ...c, [k]: v }))
  const setItem = (i: number, k: keyof Item, v: string) => setF((c) => ({ ...c, items: c.items.map((it, x) => (x === i ? { ...it, [k]: v } : it)) }))
  const addItem = (desc = '') => setF((c) => ({ ...c, items: [...c.items, { desc, qty: '1', price: '' }] }))
  const removeItem = (i: number) => setF((c) => ({ ...c, items: c.items.length > 1 ? c.items.filter((_, x) => x !== i) : c.items }))

  async function download() {
    setMsg('')
    const lines = f.items.filter((i) => i.desc.trim() && num(i.qty) * num(i.price) > 0)
    if (!f.fromName.trim()) return setMsg('Add your name or company in the From box.')
    if (!f.toName.trim()) return setMsg('Add who you are billing.')
    if (!lines.length) return setMsg('Add at least one line with a description and an amount.')
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()
    doc.setFontSize(22); doc.setTextColor(30); doc.text('INVOICE', 20, 24)
    doc.setFontSize(10); doc.setTextColor(90)
    const hasNo = f.number.trim() !== ''
    if (hasNo) doc.text(`Invoice #: ${f.number.trim()}`, 140, 18)
    doc.text(`Date: ${f.date}`, 140, hasNo ? 24 : 18)
    doc.text(`Terms: ${f.terms}`, 140, hasNo ? 30 : 24)
    let y = 42
    const block = (title: string, rows: string[], x: number) => {
      doc.setFontSize(9); doc.setTextColor(140); doc.text(title, x, y)
      doc.setFontSize(11); doc.setTextColor(20)
      rows.filter(Boolean).forEach((r, i) => doc.text(doc.splitTextToSize(r, 80), x, y + 6 + i * 5.5))
    }
    block('FROM', [f.fromName, f.fromEmail, f.fromPhone, f.fromAddress], 20)
    block('BILL TO', [f.toName, f.toEmail, f.toAddress], 110)
    autoTable(doc, {
      startY: y + 38,
      head: [['Description', 'Qty', 'Price', 'Amount']],
      body: lines.map((i) => [i.desc.trim(), String(num(i.qty)), money(num(i.price)), money(num(i.qty) * num(i.price))]),
      foot: [['', '', 'Total', money(lines.reduce((a, i) => a + num(i.qty) * num(i.price), 0))]],
      theme: 'striped',
      headStyles: { fillColor: [40, 40, 40], textColor: 255 },
      footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    })
    const end = (doc as any).lastAutoTable.finalY + 10
    if (f.notes.trim()) { doc.setFontSize(10); doc.setTextColor(60); doc.text(doc.splitTextToSize(f.notes.trim(), 170), 20, end) }
    const name = `Invoice-${(f.number.trim() || f.date).replace(/[^A-Za-z0-9_-]/g, '')}.pdf`
    doc.save(name)
    setMsg('Downloaded. Send it to your carrier yourself; nothing was sent or saved on our servers.')
  }

  const label = { fontSize: 12, color: 'var(--ui-mute, #8b95a5)', display: 'block', margin: '12px 0 4px' } as const
  const field = (k: keyof Form, text: string, ph = '', type = 'text') => (
    <label style={{ display: 'block' }}>
      <span style={label}>{text}</span>
      <input className="ui-input" type={type} value={f[k] as string} placeholder={ph} onChange={(e) => set(k, e.target.value)} maxLength={200} />
    </label>
  )

  return (
    <>
      <SiteHeader />
      <div className="ui-page">
        <div className="ui-wrap" style={{ maxWidth: 900 }}>
          <PageTitle eyebrow="Tools" title="Invoice maker" lead="Fill it in, download a clean PDF, send it to your carrier. Free. Your invoice is made in your browser and is not saved on our servers." />
          <div className="ui-stack">
            <div className="ui-card">
              <h2>From and bill to</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
                <div>
                  {field('fromName', 'Your name or company', 'Your business name')}
                  {field('fromEmail', 'Your email', 'you@example.com', 'email')}
                  {field('fromPhone', 'Your phone')}
                  {field('fromAddress', 'Your address (optional)')}
                </div>
                <div>
                  {field('toName', 'Bill to (carrier or broker)', 'Company name')}
                  {field('toEmail', 'Their email', '', 'email')}
                  {field('toAddress', 'Their address (optional)')}
                </div>
              </div>
            </div>
            <div className="ui-card">
              <h2>Details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
                {field('number', 'Invoice number', 'e.g. 1001')}
                {field('date', 'Date', '', 'date')}
                <label style={{ display: 'block' }}>
                  <span style={label}>Payment terms</span>
                  <select className="ui-select" value={f.terms} onChange={(e) => set('terms', e.target.value)}>
                    {['Due on receipt', 'Net 7', 'Net 15', 'Net 30'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
              </div>
            </div>
            <div className="ui-card">
              <h2>Lines</h2>
              <p className="ui-note" style={{ margin: '0 0 10px' }}>Use whatever you and the carrier agreed. Quick add:</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {QUICK.map(([l, d]) => <button key={l} type="button" className="ui-btn ghost" style={{ minHeight: 36, padding: '6px 14px' }} onClick={() => addItem(d)}>+ {l}</button>)}
              </div>
              {f.items.map((it, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(160px,3fr) 80px 110px auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input className="ui-input" placeholder="Description" value={it.desc} onChange={(e) => setItem(i, 'desc', e.target.value)} maxLength={200} aria-label="Description" />
                  <input className="ui-input" placeholder="Qty" inputMode="decimal" value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} aria-label="Quantity" />
                  <input className="ui-input" placeholder="Price" inputMode="decimal" value={it.price} onChange={(e) => setItem(i, 'price', e.target.value)} aria-label="Price" />
                  <button type="button" className="ui-btn ghost" style={{ minHeight: 44, padding: '6px 12px' }} onClick={() => removeItem(i)} aria-label="Remove line">✕</button>
                </div>
              ))}
              <button type="button" className="ui-btn ghost" style={{ marginTop: 6 }} onClick={() => addItem()}>+ Add a line</button>
              <div style={{ textAlign: 'right', marginTop: 16, fontSize: 22, fontWeight: 800, color: '#fff' }}>Total {money(total)}</div>
              <label style={{ display: 'block' }}>
                <span style={label}>Notes (optional)</span>
                <textarea className="ui-textarea" rows={3} value={f.notes} onChange={(e) => set('notes', e.target.value)} maxLength={600} placeholder="How to pay you, load number, anything the carrier needs." />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="button" className="ui-btn" onClick={download}>Download PDF</button>
              <button type="button" className="ui-btn ghost" onClick={() => { setF({ ...BLANK, date: today(), fromName: f.fromName, fromEmail: f.fromEmail, fromPhone: f.fromPhone, fromAddress: f.fromAddress }); setMsg('') }}>New invoice</button>
              <Link href="/tools/expenses" className="ui-note" style={{ color: 'var(--ui-or)' }}>Expense tracker →</Link>
            </div>
            {msg && <p className="ui-note" role="status" style={{ margin: 0 }}>{msg}</p>}
            <p className="ui-note">This tool only makes a document. Oversize Escort Hub does not send it, collect payment, or check the amounts. Your draft is kept in this browser only.</p>
          </div>
        </div>
      </div>
    </>
  )
}
