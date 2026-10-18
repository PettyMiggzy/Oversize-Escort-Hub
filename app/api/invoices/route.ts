// The invoices page lists the signed-in user's invoices from /api/invoices; the list itself is the GET of
// /api/invoices/create (one place for the query).
export { GET } from './create/route'
export const dynamic = 'force-dynamic'
