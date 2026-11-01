# Promo kit: get people to sign up (2026-11-01)

Copy and paste. Nothing here has been posted. Posting, DMs and group posts need the owner's OK (`docs/outreach-drafts.md` rule).
The posters, the 60-second ad and the 30-second cut are sent in chat (they are too big for the repo).

## Links to use
- Pilot car driver sign-up: https://www.oversize-escort-hub.com/signin?mode=signup&role=escort
- Carrier sign-up: https://www.oversize-escort-hub.com/signin?mode=signup&role=carrier
- Wraith page (shows what it does, has a free sign-up button): https://www.oversize-escort-hub.com/wraith/updates
- Android app: https://play.google.com/store/apps/details?id=pevo.oversizeescorthub.app
- iPhone: not yet (waiting on Apple's review). Say "iPhone coming soon" and send iPhone users to the website.
- To see which post brings people in, add `&utm_source=facebook` (or tiktok, instagram, x) to a sign-up link.

## Say
Free to join. No commissions on loads. Wraith, the voice assistant. Five free Wraith questions a day. Pilot car. Android app on Google Play.

## Do not say
"Verified", "vetted", "background checked". "Official partner" (Evergreen is a membership). Guaranteed work or income. A date for the iPhone app.
Do not use the word "escort" in Google Ads or the Google Business Profile (say "pilot car"). No prices inside app-store text.

## First lines (hooks)
- Drivers: "Still refreshing Facebook groups for loads?" / "New loads in your states, out loud." / "Driving home empty? Find a return load."
- Carriers: "Post an oversize load in about 2 minutes. Pilot cars see it right away."
- Fleets: "Who's free right now? Just ask."
- Anyone: "Your load board. Hands free."

## Posts (copy-ready)
1. **Launch (60-second ad)**
   Meet Wraith, the voice assistant inside Oversize Escort Hub. Ask what's new, check your bids, bid by voice (you press the final button). Free to join: https://www.oversize-escort-hub.com/wraith/updates
   #PilotCar #OversizeLoad #Trucking #LoadBoard
2. **Drivers (poster: feed, new loads)**
   Pilot car drivers: new loads in your states, a free account, and a voice assistant that reads them to you. Join free: https://www.oversize-escort-hub.com/signin?mode=signup&role=escort
3. **Carriers (poster: square)**
   Carriers: post an oversize load in about 2 minutes. Everyone sees it right away and you pick who to accept. Free to join, no commissions on loads: https://www.oversize-escort-hub.com/signin?mode=signup&role=carrier
4. **Fleets (poster: feed, who's free)**
   Running a fleet? Ask "who's free right now?" and hear the answer. Join free: https://www.oversize-escort-hub.com/wraith/updates
5. **Story (poster: story)**
   Ask. Hear it. Tap to confirm. Wraith never bids for you; you press the final button.
6. **30-second cut**
   Ask Wraith about new loads and bid by voice. Free to try: oversize-escort-hub.com
7. **Question (to get comments)**
   What's the longest you've ever driven home empty? Tell us below.
8. **Update post (from the Wraith update log)**
   Wraith update: [paste the newest line from the log at /wraith/updates]
9. **Your story (fill in, in your own words)**
   I built Oversize Escort Hub because [your reason]. It's free to join. [link]

## 14-day plan
- Day 1: post 1 everywhere. Day 2: post 2. Day 3: post 3. Day 4: post 7. Day 5: post 6. Day 6: post 4. Day 7: ask for ideas and answer comments.
- Days 8 to 14: repeat with different hooks. Answer every comment within the hour.
- Best times: early morning (5 to 7 am) and evening (6 to 9 pm) in your time zone.
- One or two posts a day per platform at most.
- Facebook groups: ask the group admin first, follow the group's rules, never paste the same post in many groups.

## Replies
- "Is it free?" Yes. Free to join while we launch, no commissions on loads. Wraith gives everyone 5 free questions a day. Wraith Pro is $9.99 a month if you want more.
- "Do you check people?" No. We do not check or verify anyone. Check licenses, insurance and permits yourself. It is a place to find each other.
- "Is there an iPhone app?" It is waiting on Apple's review. Use oversize-escort-hub.com in your phone browser for now. The Android app is on Google Play.
- "Does Wraith bid for me?" No. It fills in the bid and you press the final button.
- "Does it work in my truck?" Voice works best in Chrome and on Android. On an iPhone you may need to type.
- "How do you make money?" It is free for now. Extras like Wraith Pro and sponsored zones are paid.

## Paid ads (owner's money, owner's call)
- Facebook and Instagram: start at $5 to $10 a day. Use the feed posters and the 30-second cut. Goal: sign-ups or website visits. Target people interested in trucking and heavy haul.
- Google Ads: wait until the listing settles, say "pilot car", and claim the $500 new-advertiser credit only when ready to run.

## Drafts (not sent)
- Group post: "Hi all, I run Oversize Escort Hub, a free load board for pilot car drivers and oversize carriers. We just added a voice assistant that reads you new loads. Admins: is it OK to share? Happy to answer questions."
- DM to a carrier or fleet: "Hi [name], I run Oversize Escort Hub. It is free to post a load, and pilot cars see it right away. Want me to show you? [carrier sign-up link]"

## Count sign-ups (Supabase SQL editor)
select date_trunc('day', created_at) as day, role, count(*) from public.profiles group by 1, 2 order by 1 desc limit 30;
