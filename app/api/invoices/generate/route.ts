import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { load_id } = await req.json()
    if (!load_id) return NextResponse.json({ error: 'load_id required' }, { status: 400 })

    const supabase = await createClient()

    const { data: load } = await supabase
      .from('loads')
      .select('*, profiles!carrier_id(full_name, email, company_name, phone)')
      .eq('id', load_id)
      .single()

    if (!load) return NextResponse.json({ error: 'Load not found' }, { status: 404 })

    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.setTextColor(240, 165, 0)
    doc.text('OVERSIZE ESCORT HUB', 20, 20)
    doc.setFontSize(10)
    doc.setTextColor(150)
    doc.text('Precision Pilot Services | brian@precisionpilotservices.com', 20, 27)

    // Invoice details
    doc.setTextColor(0)
    doc.setFontSize(16)
    doc.text('INVOICE', 160, 20)
    doc.setFontSize(10)
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 160, 27)
    doc.text(`Load ID: ${String(load_id).slice(0, 8).toUpperCase()}`, 160, 33)

    // Carrier info (bill-to)
    const carrier = (load as any).profiles || {}
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text('BILL TO', 20, 42)
    doc.setFontSize(10)
    const billLines = [
      carrier.company_name || carrier.full_name || '—',
      carrier.email || '',
      carrier.phone || '',
    ].filter(Boolean)
    billLines.forEach((line: string, i: number) => doc.text(line, 20, 48 + i * 5))

    // Route
    const routeY = 48 + billLines.length * 5 + 6
    doc.setFontSize(12)
    doc.text('ROUTE', 20, routeY)
    doc.setFontSize(10)
    doc.text(`${load.pu_city || ''}, ${load.pu_state || ''} → ${load.dl_city || ''}, ${load.dl_state || ''}`, 20, routeY + 7)
    doc.text(`Date: ${load.start_date || 'TBD'}`, 20, routeY + 13)
    doc.text(`Board Type: ${load.board_type || '—'}`, 20, routeY + 19)

    // Rate breakdown table
    const perMile = Number(load.per_mile_rate || 0)
    const miles = Number(load.miles || 0)
    const lineTotal = perMile * miles
    const overnightFee = Number(load.overnight_fee ?? 100)
    const noGoFee = Number(load.no_go_fee ?? 250)
    const escortCount = Number(load.escort_count || 1)

    const tableData: any[] = [
      ['Per Mile Rate', `$${perMile.toFixed(2)}/mi`],
      ['Estimated Miles', miles ? String(miles) : 'TBD'],
      ['Line Haul Subtotal', miles ? `$${lineTotal.toFixed(2)}` : 'TBD'],
      ['Overnight Fee', `$${overnightFee.toFixed(2)}`],
      ['No-Go Fee', `$${noGoFee.toFixed(2)}`],
      ['Escort Count', String(escortCount)],
    ]

    autoTable(doc, {
      startY: routeY + 26,
      head: [['Item', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [240, 165, 0], textColor: 0 },
    })

    // Payment terms
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.text('Payment Terms: Net 15 days from job completion', 20, finalY)
    doc.text('Payment Methods: Check, ACH, Zelle', 20, finalY + 6)
    doc.text('Questions: brian@precisionpilotservices.com', 20, finalY + 12)

    const pdfBase64 = doc.output('datauristring')
    return NextResponse.json({ pdf: pdfBase64 })
  } catch (e: any) {
    console.error('Invoice generate error:', e)
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 })
  }
}
