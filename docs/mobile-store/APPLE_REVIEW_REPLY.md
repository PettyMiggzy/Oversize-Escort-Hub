# Apple App Review reply (Guideline 2.1, "Information Needed", 2026-10-27)

Apple asked for a screen recording from a physical device plus six written answers. Paste the reply below into App Store Connect
(App Review > the message > Reply) and ALSO into the "Notes" field of App Review Information. The reviewer passwords go in the Sign-In
fields and in Notes (the owner has them; they are never written in this repository).

## Reply and Notes text

1. Screen recording: attached. It was recorded on a physical iPhone (latest iOS) and starts with launching the app. It shows sign-in with a demo account,
   the load boards and the jobs board, a pilot car driver placing a bid, a carrier accepting it, reporting a load, and account deletion.

2. Purpose and audience: Oversize Escort Hub is a load board for the oversize and overweight trucking industry in the US and Canada. Carriers and freight brokers post loads
   that need a pilot car (also called an escort vehicle or P/EVO); pilot car drivers see the loads, bid or claim them, and the carrier accepts. It solves the problem of
   finding and filling pilot car work quickly. It is free to use. The audience is working professionals (adults): carriers, brokers, fleet managers and pilot car drivers.
   "Escort" in the app name means a pilot car escort for oversize trucks, not an adult service.

3. Access: Sign in with the demo accounts in the Sign-In fields. Pilot car driver account: [enter in App Store Connect]. Carrier account: [enter in App Store Connect].
   New accounts are created on our website (the app opens the browser for sign-up) and then sign in inside the app; nothing is sold in the app.
   Driver flow: open the Open bid board or Flat rate board, open a load, place a bid or claim it. Carrier flow: Post a load, then open the dashboard to see bids and accept one.
   Contact details are released only after a carrier accepts. Account deletion: signed in, open Delete my account (https://www.oversize-escort-hub.com/delete-account, linked in the footer).

4. External services: Supabase (database and sign-in), Vercel (hosting and basic page-view analytics), Resend (emails), Stripe (card payments for optional sponsored placements,
   on the website only; no purchases in the app), Anthropic (the AI model behind the optional help assistant; only the question typed into the assistant is sent, no account data),
   OpenStreetMap Nominatim (turns city names into map positions), US National Weather Service api.weather.gov (weather and road-weather alerts).

5. Regional differences: none. The app works the same in every region. It is aimed at the US and Canada, and pilot car rules differ by state and province; the app does not
   enforce or verify them.

6. Regulated industry: the app is a marketplace and is not itself regulated. Pilot car certification and permits are set by each state or province. The app does not issue,
   check or verify certificates, licences, insurance or documents, and says so in its Terms and on its screens. There is no protected third-party material.

User-generated content: loads, jobs and profiles are posted by users. Content can be reported with the Report button on a load, the Conduct page sets the rules, support is at
support@oversize-escort-hub.com, and our admin removes content and suspends accounts. There is no direct chat between users, and contact details are shared only after both
sides agree on a job. (Blocking users is planned for a next update.)

## The video (owner records it)

Install the build from TestFlight on a real iPhone (App Store Connect > TestFlight > Internal Testing > add yourself as a tester), then use Control Center > Screen Recording.
Record about 2 to 3 minutes, starting by tapping the app icon: sign in as the pilot car driver, show the boards, open a load, place a bid, sign out, sign in as the carrier,
accept the bid, tap Report on a load, open Delete my account (do not confirm), and sign out.
