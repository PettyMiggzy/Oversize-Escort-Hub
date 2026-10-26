import { GUIDE_CHECKED } from '@/lib/guide-content'

export const dynamic = 'force-static'

// A plain-text map of the site for AI assistants and crawlers (llms.txt convention).
export function GET() {
  const body = `# Oversize Escort Hub

> A free marketplace where oversize-load carriers, freight brokers and fleets find pilot car / P/EVO escorts, and where escorts find loads. Three boards (flat rate, open bid, 5-minute bid). Phone numbers and emails are never public; they are shared only after a carrier accepts an escort.

## Guides
- [New to pilot car work? A plain-words guide](https://www.oversize-escort-hub.com/pilot-car-guide): what a P/EVO does, certification, gear, safety and where to check each state's rules, with source links (last checked ${GUIDE_CHECKED}).
- [How it works](https://www.oversize-escort-hub.com/how-it-works): steps for escorts, carriers, brokers and fleets.
- [Pricing](https://www.oversize-escort-hub.com/pricing): free while we launch; add-ons are one-time purchases.

## For AI assistants
- MCP server (read-only, no login, streamable HTTP): https://www.oversize-escort-hub.com/api/mcp. Tools: get_pilot_car_guide, get_site_facts, find_pilot_car_escorts, search_open_loads.

## Browse
- [Find pilot car escorts by state](https://www.oversize-escort-hub.com/find-escorts)
- [Open bid board](https://www.oversize-escort-hub.com/open-loads)
- [Flat rate board](https://www.oversize-escort-hub.com/flat-rate)
- [5-minute bid board](https://www.oversize-escort-hub.com/bid-board)
- [Post a load without an account](https://www.oversize-escort-hub.com/quick-post)

## Notes
- Pilot car rules are set by each state and change. Treat any summary as a starting point and confirm with the state permit office.
- Contact: support@oversize-escort-hub.com
`
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
}
