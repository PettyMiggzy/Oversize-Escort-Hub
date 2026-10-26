# Brief for the browser assistant: Google Play Console, Oversize Escort Hub

You are driving the owner's own browser, signed in as the owner. Work one step at a time and tell the owner what you did.

## Hard rules
- Never type, paste, read aloud or store any password, key, token, bank detail or ID number. The owner types those.
- Stop and hand over to the owner at: payment or merchant setup, identity or organization verification, any "I agree" legal box the owner has not seen, and the final **production** submit.
- Do not change the owner's account, billing or email settings. Do not delete anything. Do not publish to production.
- If a form asks something this brief does not answer, stop and ask the owner. Never guess.

## Facts
- App name: Oversize Escort Hub. Package: `pevo.oversizeescorthub.app`. Category: Business. Free app, no ads, no in-app purchases.
- Website https://www.oversize-escort-hub.com. Privacy https://www.oversize-escort-hub.com/privacy. Terms https://www.oversize-escort-hub.com/terms.
- Account deletion: https://www.oversize-escort-hub.com/delete-account. Support email: support@oversize-escort-hub.com.
- All store text, data-safety answers and review notes are in `docs/mobile-store/STORE_LISTING.md` in the repository (github.com/PettyMiggzy/Oversize-Escort-Hub): copy from there.
- Images: 512x512 icon and 1024x500 feature graphic are in `docs/mobile-store/assets/`; the owner has the seven phone screenshots (1080x1920) in a folder and will name it.

## Steps
1. Play Console > Create app: name, English (US), App, Free; accept only the declarations the owner confirms.
2. Store listing: short description (80 chars) and full description from the listing kit; upload icon, feature graphic and the phone screenshots in order 1 to 7.
3. App content: privacy policy URL; ads = No; app access = "all or some functionality is restricted", add two reviewer logins (escort and carrier) **typed by the owner**; content rating questionnaire (no violence, sexual content, gambling, user chat or location sharing: expect "Everyone"); target audience 18 and over; data safety using the table in the listing kit (data is encrypted in transit; users can request deletion at the URL above; nothing is sold); government app = No; financial features = None; health = None; account deletion URL as above.
4. Testing: create a **closed testing** release (not production). The owner uploads the signed `.aab` produced by the GitHub "Android release" workflow (Actions tab > Android release > Run workflow; the owner sets the signing secrets themselves, see `SIGNING_KEY.md`). Turn on Play App Signing. Add testers by the email list the owner gives you.
5. Report back: what is complete, what Play flagged, and the exact wording of any warning. Do not click **Send for review** on production.
