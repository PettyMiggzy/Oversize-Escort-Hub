// What the site helper knows. Everything here must be true today; when a rule or price changes, change it here too.
// The helper answers only from this text and sends anything else to the team.
export const HELPER_KNOWLEDGE = `
ABOUT
Oversize Escort Hub (OEH) is a marketplace where oversize-load carriers, freight brokers and fleets find pilot car / P/EVO escorts. It is a marketplace, not an employer and not a dispatcher: carriers and escorts agree the work and pay between themselves. There are no commissions on loads.

PRICE RIGHT NOW
Using the site is free while we launch: every account gets every plan feature, no card needed. We will give plenty of notice before any plan costs anything. The paid things are one-time add-ons: BGC badge $9.99 (background check review, badge shows on the profile once approved), P/EVO cert review $14.99 (document review that covers verification), and a Sponsored Zone $29.99 for 30 days (featured at the top of Find Escorts for one state; one sponsor per state, taken states are greyed out). Add-ons are bought on the website at oversize-escort-hub.com/pricing. When plans start costing money, the listed plan prices will be Member $19.99/month, Pro $29.99/month and fleet plans from $29.99/month; none of that is charged now.

HOW IT WORKS FOR ESCORTS
Create a free account and pick the pilot car / P/EVO role. Build the profile: certifications, states you cover, vehicle. Browse the three boards: Flat Rate (fixed pay, direct hire), Open Bid (escorts bid, carriers compare), and the 5-Minute Bid Board (live loads on a timer). Claim a load or place a bid. The carrier reviews your profile and accepts; then you both get an alert and each other's phone and email. After the job you rate each other. On the Dashboard, "Choose my states" sets the states you want load alerts for. Escorts with no states set get alerts for every new load. Profiles have a public share link and QR code on the dashboard.

HOW IT WORKS FOR CARRIERS AND BROKERS
Create a free account (carrier or freight broker role). Post a load in about two minutes: pickup, destination, date, positions needed (lead, chase, high pole, and so on), certifications, rate. Pick the board: flat rate, open bid or 5-minute bid. You get an email and in-app alert when an escort bids or claims. Check their profile, ratings and badges, then Accept or Decline. Accept and both sides get contact details; decline and the load goes back on the board. Loads expire after a set time.
Quick post: a carrier can also post a load without an account at oversize-escort-hub.com/quick-post. We email a confirmation link, creating the account when they confirm. Without an account the limit is 3 loads an hour; signed-up accounts have no such limit.

FLEETS
Fleet managers can add escort drivers, set coverage for the whole fleet and see jobs and invoices on the fleet dashboard.

JOBS BOARD
Separate from loads: companies and fleets post jobs when they want to hire pilot car subcontractors (1099) or drivers (W-2 or either). Browse at oversize-escort-hub.com/jobs; anyone with an account can apply, and posting a job needs an account (free while we launch). A job says who provides the vehicle and gear, how the pay works (percent of the load, flat weekly, day rate, per mile, hourly or negotiable), the schedule, travel and the states. Do not put phone numbers or links in a post or application; the company and the applicant get each other's contact details only after the company accepts. A poster can have up to 5 open jobs at once. We are the marketplace, not the employer: the company and the worker agree the pay and the work between themselves. Applications show in the dashboard under My applications, and posters see applicants under My jobs.

DEADHEAD MINIMIZER
When an escort is on a matched job with a drop-off set, and a new load posts within about 150 miles of that drop-off, they get a heads-up first (in the app and by email) so they do not drive home empty.

BADGES AND VERIFICATION
BGC badge = background check reviewed by us. P/EVO badge = certification document reviewed. FMCSA badge = carrier DOT number checked. Upload documents under Verify on the site. Review takes a short time; we email when it is done.

PRIVACY
Phone numbers and emails are never shown on public pages. They are shared only between the carrier and the escort after the carrier accepts. Please keep phone numbers and links out of load notes.

REPORTING AND SAFETY
Any signed-in user can report a load (scam, spam, fake rate, duplicate) with the Report button on the load page. Several reports take a load off the board until an admin checks it. Admins can remove posts and suspend accounts that break the rules.

NOT AVAILABLE YET
Text-message alerts are not on yet (email and in-app alerts only). Phone numbers entered at sign-up are saved for when texting opens. The mobile app is in testing; paid add-ons and upgrades are bought on the website, not inside the app.

ACCOUNT HELP
Forgot password: Sign in page > Forgot password. Confirmation email not arriving: check spam, then try again after a minute; it comes from noreply@oversize-escort-hub.com. Delete account: Dashboard > Delete account. Support email: support@oversize-escort-hub.com.

WHAT WE DO NOT DO
We do not give legal advice, permit advice or rules for a specific state or province; those come from the state's permit office and the carrier's permit. We do not guarantee loads, rates, or that any escort or carrier will pay or show up. We do not take part in payment between carrier and escort.
`.trim()
