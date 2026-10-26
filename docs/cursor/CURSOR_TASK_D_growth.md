# Cursor task D: three growth features (new files, no changes to payments, auth or the database)

Start from the CURRENT `origin/main` (it already has the sponsored-zone fix, the growth batch with the four-item menu and `/quick-post`, and the paid add-ons). Run `git pull` first.
This file lives in the repo at `docs/cursor/CURSOR_TASK_D_growth.md`. Other growth tests already on main (`growth-emails.test.ts`, `growth-static.test.ts`) are not yours: do not edit them.
Branch `cursor/growth-pages`. One commit per feature. Do NOT push `main`. No pull request. Do NOT run `next build`.
Do not touch `app/api/checkout`, `app/api/webhook`, `app/api/loads`, `lib/alerts.ts`, `middleware`, SQL files, or anything under `.github`.
Look: use the shared kit already in the repo (`ui-*` classes in `app/globals.css`, `components/PageTitle.tsx`, `components/EmptyState.tsx`, `SiteHeader`). Plain words, no new claims or numbers. Using the site is free; add-ons (BGC badge, P/EVO cert review, sponsored zones) are paid, so never call everything free.
Inside the phone app (`isNativeApp()` from `lib/native`) nothing may show a price or a pay button (these three features have none).

## Feature 1: public state pages for search engines
Route `app/pilot-car-escorts/[state]/page.tsx`, a SERVER component. `[state]` is a 2-letter US state or Canadian province code in any case; unknown codes call `notFound()`.
- `generateStaticParams` for the 50 states plus DC; `export const revalidate = 3600`.
- `generateMetadata`: title "Pilot car escorts in <State name> | Oversize Escort Hub", a plain description, `alternates.canonical` to the page.
- Content: heading, one honest paragraph (no statistics you cannot prove), then the escorts available in that state as cards (name, Pro badge if tier is pro, BGC badge, P/EVO badge, states covered). Each card links to `/escorts/<id>`.
- Data: use `serviceClient()` from `lib/service-client` and select ONLY the columns in `PUBLIC_PROFILE_COLUMNS` (`lib/profile-columns.ts`). NEVER select email, phone or any other column. Filter `role = 'escort'`, `suspended` not true (read suspended with the service client, but do not return it), and the state in `availability_states` OR `states_licensed` (check the column types in `tests/hostile-audit/schema-columns.test.ts`; arrays use `.contains`). Limit 60.
- A call to action: "Post a load" to `/post-load` and "Join as an escort" to `/signin?mode=signup`.
- Add every state URL to `app/sitemap.ts` (read that file first and follow its style).
- Add a small footer-style link list "Find escorts by state" on `app/find-escorts/page.tsx` below the results, linking all 50 pages.
- Test: `tests/hostile-audit/state-pages.test.ts` proving (a) an unknown code is a 404, (b) the page module never selects `email`, `phone` or `stripe` (string scan of the file is fine), (c) the sitemap lists all 51 URLs.

## Feature 2: share link and QR on an escort's own profile
On the signed-in escort's own page (`app/dashboard/_client.tsx`, escort section) add a card "Share your profile": the public link `https://www.oversize-escort-hub.com/escorts/<their id>`, a Copy button (use `navigator.clipboard`, with a text fallback), a Share button (`navigator.share` when it exists), and a QR code.
- QR: add the npm package `qrcode` and render an inline SVG with `QRCode.toString(url, { type: 'svg', margin: 1 })` on the client. Commit the lock file change.
- The link must be built from the signed-in user's own id only. No input field for the URL.
- Test: a source test that the card uses the user's own id and no other URL source.

## Feature 3: admin funnel card
New API route `app/api/admin/funnel/route.ts` (GET, `requireAdmin()` from `lib/api-auth`, `serviceClient()`): return counts only, no personal data:
signups total, signups in the last 7 and 30 days, by role (escort, carrier, broker, fleet_manager), accounts with a state set, accounts with BGC, accounts with P/EVO, loads posted total and in the last 7 and 30 days, loads with at least one bid, bids total, loads filled, open now.
Add a "Funnel" card at the top of `app/admin/page.tsx` that fetches it and shows the numbers with the kit styles (`ui-card`, `ui-k`/`ui-v`). Do not change anything else on that page.
- Test: the route returns 401/403 for a non-admin and only numbers for an admin (copy the pattern in `tests/hostile-audit/contact-privacy.test.ts`).

## Checks before each commit (paste real output in the report)
- `npx tsc --noEmit` exit 0
- `npm run test:hostile` all passing (do not edit an old test to make it pass)
- `npx eslint <files you changed>` no NEW errors
- Screenshots at 1440 and 390 for the two pages with UI (state page, dashboard share card, admin funnel card), looked at by you. Pages that need a login you cannot open: say so.

## Report
Short and plain: what changed, the exact commands with counts, what you could not run, anything you would not do without asking. Never say "done" for something you did not open in a browser.
