'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'
import { createClient } from '@/lib/supabase/client'

type Item = { desc: string; qty: string; price: string }
type Client = { name: string; email: string; address: string }
type Form = {
  fromName: string; fromEmail: string; fromPhone: string; fromAddress: string
  toName: string; toEmail: string; toAddress: string
  number: string; date: string; terms: string; tax: string; notes: string; accent: string
  items: Item[]
}

const KEY = 'oeh-invoice-draft-v2'
const LOGO_KEY = 'oeh-invoice-logo-v1'
const CLIENTS_KEY = 'oeh-invoice-clients-v1'
const NEXT_KEY = 'oeh-invoice-next-v1'
const today = () => new Date().toISOString().slice(0, 10)
const money = (n: number) => `$${n.toFixed(2)}`
const num = (s: string) => { const n = Number(s); return Number.isFinite(n) && n >= 0 ? n : 0 }
const TERM_DAYS: Record<string, number> = { 'Due on receipt': 0, 'Net 7': 7, 'Net 15': 15, 'Net 30': 30 }
const ACCENTS: [string, string][] = [['#ff6a13', 'Orange'], ['#1f6feb', 'Blue'], ['#1a9d5a', 'Green'], ['#222222', 'Black']]

const BLANK: Form = {
  fromName: '', fromEmail: '', fromPhone: '', fromAddress: '',
  toName: '', toEmail: '', toAddress: '',
  number: '', date: today(), terms: 'Net 15', tax: '', notes: '', accent: '#ff6a13',
  items: [{ desc: '', qty: '1', price: '' }],
}

const QUICK: [string, string][] = [
  ['Per mile', 'Escort service, per mile'],
  ['Day rate', 'Escort service, day rate'],
  ['Overnight', 'Overnight fee'],
  ['No-go', 'No-go fee'],
  ['Wait time', 'Wait time'],
  ['Fuel / tolls', 'Fuel and tolls'],
]

const rgb = (hex: string): [number, number, number] => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
const addDays = (iso: string, d: number) => { const t = new Date(iso + 'T12:00:00'); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10) }
const read = <T,>(k: string, fallback: T): T => { try { const r = localStorage.getItem(k); return r ? (JSON.parse(r) as T) : fallback } catch { return fallback } }
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

// shrink a chosen picture to a small PNG, in the browser; it never leaves this device
function shrinkLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg)$/.test(file.type)) return reject(new Error('Use a PNG or JPG picture.'))
    if (file.size > 3_000_000) return reject(new Error('That picture is too big. Use one under 3 MB.'))
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const max = 480, k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k))
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url); resolve(c.toDataURL('image/png'))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that picture.')) }
    img.src = url
  })
}

async function toDataUrl(src: string): Promise<string | null> {
  try {
    const r = await fetch(src); const b = await r.blob()
    return await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = () => res(null); fr.readAsDataURL(b) })
  } catch { return null }
}
const imgSize = (u: string): Promise<[number, number]> => new Promise((res) => { const i = new Image(); i.onload = () => res([i.width, i.height]); i.onerror = () => res([1, 1]); i.src = u })

export default function InvoiceTool() {
  const [f, setF] = useState<Form>(BLANK)
  const [logo, setLogo] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [msg, setMsg] = useState('')
  const [ready, setReady] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = read<Partial<Form> | null>(KEY, null)
    setLogo(read<string | null>(LOGO_KEY, null))
    setClients(read<Client[]>(CLIENTS_KEY, []))
    const next = read<number>(NEXT_KEY, 1)
    if (saved && Array.isArray(saved.items)) {
      setF({ ...BLANK, ...saved, date: today(), number: saved.number || `INV-${String(next).padStart(4, '0')}` })
    } else {
      setF((c) => ({ ...c, number: `INV-${String(next).padStart(4, '0')}` }))
      // first visit: fill the From box from the signed-in profile (everything stays editable)
      createClient().auth.getUser().then(async ({ data }) => {
        const u = data.user; if (!u) return
        const { data: p } = await createClient().from('profiles').select('full_name, company_name, phone').eq('id', u.id).maybeSingle()
        setF((cur) => ({ ...cur, fromName: (p as any)?.company_name || (p as any)?.full_name || '', fromEmail: u.email ?? '', fromPhone: (p as any)?.phone ?? '' }))
      }).catch(() => {})
    }
    setReady(true)
  }, [])
  useEffect(() => { if (ready) write(KEY, f) }, [f, ready])

  const subtotal = useMemo(() => f.items.reduce((a, i) => a + num(i.qty) * num(i.price), 0), [f.items])
  const taxAmt = subtotal * (num(f.tax) / 100)
  const total = subtotal + taxAmt
  const set = (k: keyof Form, v: string) => setF((c) => ({ ...c, [k]: v }))
  const setItem = (i: number, k: keyof Item, v: string) => setF((c) => ({ ...c, items: c.items.map((it, x) => (x === i ? { ...it, [k]: v } : it)) }))
  const addItem = (desc = '') => setF((c) => ({ ...c, items: [...c.items, { desc, qty: '1', price: '' }] }))
  const removeItem = (i: number) => setF((c) => ({ ...c, items: c.items.length > 1 ? c.items.filter((_, x) => x !== i) : c.items }))

  async function pickLogo(file?: File) {
    if (!file) return
    try { const d = await shrinkLogo(file); setLogo(d); write(LOGO_KEY, d); setMsg('Logo added. It stays on this device only.') }
    catch (e: any) { setMsg(e.message || 'Could not use that picture.') }
  }
  function removeLogo() { setLogo(null); try { localStorage.removeItem(LOGO_KEY) } catch {}; if (fileRef.current) fileRef.current.value = '' }

  function saveClient() {
    if (!f.toName.trim()) return setMsg('Type the client name first.')
    const c: Client = { name: f.toName.trim(), email: f.toEmail.trim(), address: f.toAddress.trim() }
    const next = [c, ...clients.filter((x) => x.name.toLowerCase() !== c.name.toLowerCase())].slice(0, 30)
    setClients(next); write(CLIENTS_KEY, next); setMsg('Client saved on this device.')
  }
  function pickClient(name: string) {
    const c = clients.find((x) => x.name === name); if (!c) return
    setF((cur) => ({ ...cur, toName: c.name, toEmail: c.email, toAddress: c.address }))
  }

  async function download() {
    setMsg('')
    const lines = f.items.filter((i) => i.desc.trim() && num(i.qty) * num(i.price) > 0)
    if (!f.fromName.trim()) return setMsg('Add your name or company in the From box.')
    if (!f.toName.trim()) return setMsg('Add who you are billing.')
    if (!lines.length) return setMsg('Add at least one line with a description and an amount.')
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth(), ph = doc.internal.pageSize.getHeight()
    const accent = rgb(/^#[0-9a-f]{6}$/i.test(f.accent) ? f.accent : '#ff6a13')

    // top bar and your logo
    doc.setFillColor(...accent); doc.rect(0, 0, pw, 6, 'F')
    let textX = 20
    if (logo) {
      const [w, h] = await imgSize(logo); const H = 20, W = Math.min(60, (w / h) * H)
      doc.addImage(logo, 'PNG', 20, 14, W, W * (h / w) > H ? H : W * (h / w))
    }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(26); doc.setTextColor(...accent)
    doc.text('INVOICE', pw - 20, 26, { align: 'right' })
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(90)
    const due = addDays(f.date, TERM_DAYS[f.terms] ?? 0)
    const meta: [string, string][] = [['Invoice #', f.number.trim()], ['Date', f.date], ['Due', f.terms === 'Due on receipt' ? 'On receipt' : due], ['Terms', f.terms]]
    let my = 34
    meta.filter(([, v]) => v).forEach(([k, v]) => { doc.setTextColor(140); doc.text(k, pw - 62, my); doc.setTextColor(30); doc.text(v, pw - 20, my, { align: 'right' }); my += 5.5 })

    let y = Math.max(my + 8, 56)
    const block = (title: string, rows: string[], x: number) => {
      doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...accent); doc.text(title, x, y)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(25)
      let yy = y + 6
      rows.filter(Boolean).forEach((r, i) => { const w = doc.splitTextToSize(r, 78); doc.setFont('helvetica', i === 0 ? 'bold' : 'normal'); doc.text(w, x, yy); yy += w.length * 5 })
      return yy
    }
    const a = block('FROM', [f.fromName, f.fromEmail, f.fromPhone, f.fromAddress], textX)
    const b = block('BILL TO', [f.toName, f.toEmail, f.toAddress], 112)

    const body = lines.map((i) => [i.desc.trim(), String(num(i.qty)), money(num(i.price)), money(num(i.qty) * num(i.price))])
    const sub = lines.reduce((s, i) => s + num(i.qty) * num(i.price), 0)
    const tax = sub * (num(f.tax) / 100)
    const foot: string[][] = []
    if (tax > 0) { foot.push(['', '', 'Subtotal', money(sub)]); foot.push(['', '', `Tax (${num(f.tax)}%)`, money(tax)]) }
    foot.push(['', '', 'Total due', money(sub + tax)])
    autoTable(doc, {
      startY: Math.max(a, b) + 10, margin: { left: 20, right: 20 },
      head: [['Description', 'Qty', 'Price', 'Amount']], body, foot,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: { top: 3.2, bottom: 3.2, left: 2, right: 2 }, textColor: 30, lineColor: [225, 225, 225], lineWidth: { bottom: 0.2 } },
      headStyles: { fillColor: accent, textColor: 255, fontStyle: 'bold', lineWidth: 0 },
      footStyles: { textColor: 20, fontStyle: 'bold', fillColor: [255, 255, 255], lineWidth: 0 },
      columnStyles: { 0: { cellWidth: 'auto' }, 1: { halign: 'right', cellWidth: 20 }, 2: { halign: 'right', cellWidth: 32 }, 3: { halign: 'right', cellWidth: 34 } },
      didParseCell: (d) => { if (d.section === 'foot' && d.row.index === foot.length - 1 && d.column.index >= 2) { d.cell.styles.fontSize = 12; d.cell.styles.textColor = accent as any } },
    })
    let ny = (doc as any).lastAutoTable.finalY + 12
    if (f.notes.trim()) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...accent); doc.text('NOTES AND PAYMENT', 20, ny)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(60)
      const w = doc.splitTextToSize(f.notes.trim(), pw - 40); doc.text(w, 20, ny + 6); ny += 6 + w.length * 5
    }

    // our small footer on every page: logo and site
    const oeh = await toDataUrl('/email-logo.png')
    const pages = doc.getNumberOfPages()
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p)
      doc.setDrawColor(225); doc.line(20, ph - 18, pw - 20, ph - 18)
      doc.setFontSize(8); doc.setTextColor(130); doc.setFont('helvetica', 'normal')
      if (oeh) { const [w, h] = await imgSize(oeh); const H = 6; doc.addImage(oeh, 'PNG', 20, ph - 15, H * (w / h), H) }
      doc.text('Made free with Oversize Escort Hub  |  oversize-escort-hub.com', pw - 20, ph - 11, { align: 'right' })
    }

    const safe = (f.number.trim() || f.date).replace(/[^A-Za-z0-9_-]/g, '')
    doc.save(`Invoice-${safe}.pdf`)
    // next invoice number
    const m = f.number.match(/^(.*?)(\d+)$/)
    if (m) { const n = String(Number(m[2]) + 1).padStart(m[2].length, '0'); set('number', m[1] + n); const k = Number(m[2]) + 1; write(NEXT_KEY, k) }
    setMsg('Downloaded. Send it to your carrier yourself. Nothing was sent or saved on our servers.')
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
          <PageTitle eyebrow="Tools" title="Invoice maker" lead="Your own business, your own invoice. Add your logo, pick a color, download a clean PDF and send it to your carrier. Free. Made in your browser, nothing is stored on our servers." />
          <div className="ui-stack">
            <div className="ui-card">
              <h2>Your business</h2>
              <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                <div style={{ width: 120, height: 72, borderRadius: 12, border: '1px dashed rgba(255,255,255,.25)', display: 'grid', placeItems: 'center', overflow: 'hidden', background: '#fff' }}>
                  {logo ? <img src={logo} alt="Your logo" style={{ maxWidth: '100%', maxHeight: '100%' }} /> : <span style={{ color: '#777', fontSize: 12 }}>No logo</span>}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={(e) => pickLogo(e.target.files?.[0])} />
                  <button type="button" className="ui-btn ghost" onClick={() => fileRef.current?.click()}>{logo ? 'Change logo' : 'Add your logo'}</button>
                  {logo && <button type="button" className="ui-btn ghost" onClick={removeLogo}>Remove</button>}
                </div>
                <div>
                  <span style={{ ...label, margin: '0 0 6px' }}>Color</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {ACCENTS.map(([c, n]) => (
                      <button key={c} type="button" aria-label={n} title={n} onClick={() => set('accent', c)}
                        style={{ width: 30, height: 30, borderRadius: '50%', background: c, border: f.accent === c ? '3px solid #fff' : '2px solid rgba(255,255,255,.25)', cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>
              </div>
              <p className="ui-note" style={{ margin: '4px 0 0' }}>Your logo is kept on this device only. A PNG or JPG works best.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
                <div>{field('fromName', 'Business or your name', 'Your business name')}{field('fromEmail', 'Email', 'you@example.com', 'email')}</div>
                <div>{field('fromPhone', 'Phone')}{field('fromAddress', 'Address (optional)')}</div>
              </div>
            </div>

            <div className="ui-card">
              <h2>Bill to</h2>
              {clients.length > 0 && (
                <label style={{ display: 'block' }}>
                  <span style={label}>Saved clients</span>
                  <select className="ui-select" value="" onChange={(e) => pickClient(e.target.value)}>
                    <option value="">Pick a saved client…</option>
                    {clients.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </label>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
                <div>{field('toName', 'Carrier or broker', 'Company name')}{field('toEmail', 'Their email', '', 'email')}</div>
                <div>{field('toAddress', 'Their address (optional)')}</div>
              </div>
              <button type="button" className="ui-btn ghost" style={{ marginTop: 14, minHeight: 38 }} onClick={saveClient}>Save this client for next time</button>
            </div>

            <div className="ui-card">
              <h2>Details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
                {field('number', 'Invoice number', 'INV-0001')}
                {field('date', 'Date', '', 'date')}
                <label style={{ display: 'block' }}>
                  <span style={label}>Payment terms</span>
                  <select className="ui-select" value={f.terms} onChange={(e) => set('terms', e.target.value)}>
                    {Object.keys(TERM_DAYS).map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label style={{ display: 'block' }}>
                  <span style={label}>Tax % (optional)</span>
                  <input className="ui-input" inputMode="decimal" value={f.tax} onChange={(e) => set('tax', e.target.value)} placeholder="0" />
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
              <div style={{ textAlign: 'right', marginTop: 16, color: '#b5bdc9', lineHeight: 1.7 }}>
                {taxAmt > 0 && <div>Subtotal {money(subtotal)} · Tax {money(taxAmt)}</div>}
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Total {money(total)}</div>
              </div>
              <label style={{ display: 'block' }}>
                <span style={label}>Notes and how to pay you (optional)</span>
                <textarea className="ui-textarea" rows={3} value={f.notes} onChange={(e) => set('notes', e.target.value)} maxLength={600} placeholder="Load number, how to pay you, anything the carrier needs." />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="button" className="ui-btn" onClick={download}>Download PDF</button>
              <button type="button" className="ui-btn ghost" onClick={() => { setF({ ...BLANK, date: today(), number: f.number, accent: f.accent, fromName: f.fromName, fromEmail: f.fromEmail, fromPhone: f.fromPhone, fromAddress: f.fromAddress }); setMsg('') }}>New invoice</button>
              <Link href="/tools/expenses" className="ui-note" style={{ color: 'var(--ui-or)' }}>Expense tracker →</Link>
            </div>
            {msg && <p className="ui-note" role="status" style={{ margin: 0 }}>{msg}</p>}
            <p className="ui-note">This tool only makes a document. Oversize Escort Hub does not send it, collect payment, or check the amounts, and it is not tax advice. Your draft, logo and saved clients are kept in this browser only. The invoice carries a small &ldquo;Made free with Oversize Escort Hub&rdquo; line at the bottom.</p>
          </div>
        </div>
      </div>
    </>
  )
}
