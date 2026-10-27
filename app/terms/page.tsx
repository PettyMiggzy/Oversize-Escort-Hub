import Link from 'next/link';
import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the Terms of Service for Oversize Escort Hub.',
  alternates: { canonical: '/terms' },
  openGraph: {
    title: 'Terms of Service | Oversize Escort Hub',
    description: 'Read the Terms of Service for Oversize Escort Hub.',
    url: 'https://www.oversize-escort-hub.com/terms',
    siteName: 'Oversize Escort Hub',
  },
}


export default function TermsOfService() {
  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#ccc", fontFamily: "sans-serif" }}>
      <SiteHeader />
      <div style={{ background: "#0f0f0f", borderBottom: "1px solid #1a1a1a", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/" style={{ background: "none", border: "1px solid #333", color: "#888", fontFamily: "DM Mono, monospace", fontSize: 10, letterSpacing: ".1em", padding: "6px 14px", cursor: "pointer", borderRadius: 2, textDecoration: "none" }}>← BACK</Link>
        <span style={{ fontSize: 10, letterSpacing: ".2em", color: "#f90" }}>OVERSIZE ESCORT HUB</span>
      </div>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px", lineHeight: 1.8 }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 10, letterSpacing: ".2em", color: "#f90", marginBottom: 8 }}>OVERSIZE ESCORT HUB</div>
          <h1 style={{ fontSize: 32, color: "#fff", marginBottom: 8 }}>Terms of Service</h1>
          <p style={{ fontSize: 12, color: "#666" }}>Effective Date: April 2, 2026 | Last updated: October 26, 2026</p>
          <p style={{ fontSize: 12, color: "#888", marginTop: 6 }}>Oversize Escort Hub is operated by Precision Pilot Services, LLC, doing business as Oversize Escort Hub.</p>
        </div>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>1. Acceptance of Terms</h2>
          <p>By accessing or using Oversize Escort Hub you agree to be bound by these Terms in full. If you do not agree, do not use the Platform.</p>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>2. Platform Description</h2>
          <p>Oversize Escort Hub is a marketplace connecting oversize load carriers with pilot car (P/EVO) escorts and freight brokers. We do not check or verify users, licenses, certifications, insurance or vehicles. We are not a party to agreements between users and do not guarantee load or escort availability.</p>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>3. Eligibility</h2>
          <p>You must be at least 18 years old and legally authorized to operate in the transportation industry. By registering you confirm all information provided is accurate and current.</p>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>4. Accounts & Subscriptions</h2>
          <p>You are responsible for your account security and all activity under it. While plans are free (see section 35), nothing is charged and every account has every plan feature. The paid-plan terms in this section apply only if we start charging, after notice. Subscriptions auto-renew monthly through Stripe. No refunds for partial billing periods. Pricing may change with 30 days notice.</p>
        </section>
        <section style={{ marginBottom: 32, background: "rgba(249,144,0,0.04)", border: "1px solid rgba(249,144,0,0.2)", borderRadius: 6, padding: 24 }}>
          <h2 style={{ color: "#f90", fontSize: 18, marginBottom: 12 }}>5. Intellectual Property Rights</h2>
          <p style={{ marginBottom: 12 }}>All content, features, functionality, design, code, data structures, algorithms, trade names, logos, trademarks, and branding on the Platform are the exclusive property of Oversize Escort Hub, protected by U.S. and international copyright, trademark, and trade secret law.</p>
          <p style={{ marginBottom: 10, color: "#fff", fontWeight: 600 }}>Without our express written permission you may not:</p>
          <ul style={{ paddingLeft: 24, marginBottom: 12 }}>
            <li>Copy, reproduce, republish, upload, transmit, or distribute any part of the Platform</li>
            <li>Modify, reverse engineer, decompile, or create derivative works from the Platform</li>
            <li>Use our name, logo, or branding in any manner</li>
            <li>Frame or mirror any Platform content on any other site or app</li>
            <li>Sell, license, or commercially exploit any portion of the Platform</li>
            <li>Remove or alter any proprietary notices on the Platform</li>
          </ul>
          <p>Unauthorized use constitutes a material breach and may result in account termination, civil liability, and criminal prosecution to the fullest extent of the law.</p>
        </section>
        <section style={{ marginBottom: 32, background: "rgba(249,144,0,0.04)", border: "1px solid rgba(249,144,0,0.2)", borderRadius: 6, padding: 24 }}>
          <h2 style={{ color: "#f90", fontSize: 18, marginBottom: 12 }}>6. Prohibited Conduct & Anti-Scraping</h2>
          <p style={{ marginBottom: 10, color: "#fff", fontWeight: 600 }}>You expressly agree NOT to:</p>
          <ul style={{ paddingLeft: 24, marginBottom: 12 }}>
            <li><strong style={{ color: "#fff" }}>Scrape, crawl, or harvest</strong> any data, load listings, escort profiles, or user information from the Platform by any means including bots, spiders, or automated scripts</li>
            <li><strong style={{ color: "#fff" }}>Build competing products or services</strong> using data, concepts, or features obtained from the Platform</li>
            <li>Use data mining, robots, or similar extraction tools on any part of the Platform</li>
            <li>Access the Platform through unauthorized automated means</li>
            <li>Use Platform content to train AI or machine learning models</li>
            <li>Circumvent any security or access-control features</li>
            <li>Post false, misleading, or fraudulent information</li>
            <li>Impersonate any user, person, or entity</li>
            <li>Collect or store other users personal data without their consent</li>
            <li>Interfere with the Platform infrastructure or performance</li>
          </ul>
          <p>Violations may result in immediate termination, injunctive relief, and damages including lost profits, statutory damages, and attorneys fees.</p>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>7. User Content</h2>
          <p>By submitting content you grant Oversize Escort Hub a non-exclusive, worldwide, royalty-free license to display and distribute it to operate the Platform. You confirm you own or have rights to the content submitted.</p>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>8. No verification</h2>
          <p>Profiles, load posts, documents and credentials are entered by the users themselves. Oversize Escort Hub does not check, verify, vouch for or guarantee any of it, including licenses, certifications, background, insurance, vehicles, operating authority or identity. Check before you hire or accept work.</p>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>9. Limitation of Liability</h2>
          <p>The Platform is provided as-is. To the maximum extent permitted by law, Oversize Escort Hub is not liable for indirect, incidental, or consequential damages. Our total liability shall not exceed amounts paid by you in the preceding 12 months.</p>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>10. Indemnification</h2>
          <p>You agree to indemnify and hold harmless Oversize Escort Hub and its officers, employees, and agents from any claims arising from your use of the Platform or violation of these Terms.</p>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>11. Governing Law</h2>
          <p>These Terms are governed by the laws of the State of Indiana. Disputes shall be resolved exclusively in state or federal courts in Indiana.</p>
        </section>
                  <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>13. Matching Engine &amp; Load Request System</h2>
            <p style={{ color: "#ccc" }}>The Platform includes an automated load-request system that allows carriers and freight brokers to post loads and allows escorts to submit interest requests. When an escort submits a request, the carrier receives a notification and has sole discretion to accept or decline. Accepted matches result in a temporary 1-hour hold during which the load is removed from active boards. If the carrier or escort does not confirm within 1 hour, the hold expires and the load is reposted automatically. OEH does not guarantee any match, job placement, or completed transaction. All engagements are directly between the carrier and escort.</p>
          </section>
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>14. Reviews &amp; Ratings</h2>
            <p style={{ color: "#ccc" }}>Users may submit reviews and star ratings following a completed job. Reviews are user-generated content and represent the opinions of individual users, not OEH. OEH reserves the right to remove reviews that violate these Terms, contain false information, or are submitted in bad faith. Ratings are used to improve search placement and build escort reputation on the Platform. By submitting a review, you grant OEH a non-exclusive, royalty-free license to display and use that content on the Platform.</p>
          </section>
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>15. Referral Program</h2>
            <p style={{ color: "#ccc" }}>OEH offers a referral program through which existing users may earn rewards for referring new paying subscribers. Referral codes are tracked by OEH and rewards are credited after the referred user completes their first paid billing cycle. Referral rewards have no cash value and may not be transferred or redeemed for cash unless explicitly stated. OEH reserves the right to modify, suspend, or terminate the referral program at any time. Fraudulent referrals will result in forfeiture of rewards and may result in account termination.</p>
          </section>
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>16. Fleet Manager Tools</h2>
            <p style={{ color: "#ccc" }}>Fleet Manager Tools are available exclusively to Pro tier subscribers. Pro subscribers may enter information about unlimited escorts (Fleet Pro) (name, phone number, city, state, and availability) to search for loads near each escort&apos;s location. Fleet Managers may share load links with escorts but may not auto-match, accept loads, or take any action on behalf of escorts. Escorts must independently review and confirm any load from their own account. Fleet searches are rate-limited to 3 per hour per Pro account. Accounts exceeding 20 fleet searches per day may be flagged for administrative review. By using Fleet Manager Tools, you represent that you have consent from the escorts whose information you enter to process that information on this Platform.</p>
          </section>
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>17. Multi-Board Load Posting &amp; Duplicate Prevention</h2>
            <p style={{ color: "#ccc" }}>When a carrier posts a load to multiple boards (Flat Rate, Open Loads, Bid Board), OEH stores the load as a single database record with a boards array field. The load appears simultaneously on all selected boards. When any board version of a load receives an accepted match, the load status changes to pending across all boards simultaneously. If a carrier declines or a match expires, the load reappears on all boards simultaneously. Once filled, the load is hidden from all board views. Cross-posted loads display a tag indicating which other boards they appear on.</p>
          </section>
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>18. FMCSA DOT Number Collection &amp; Verification</h2>
            <p style={{ color: "#ccc" }}>When carriers post loads, they may optionally provide their USDOT number. OEH does not check or verify the number and displays no verified badge. A DOT number a carrier provides is entered by the carrier and may be visible to Platform users. OEH does not guarantee that any DOT number or other carrier information is accurate or current.</p>
          </section>
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>19. Weather Data Display</h2>
            <p style={{ color: "#ccc" }}>OEH displays weather information sourced from the National Weather Service (NWS) API, a free public government service. Location coordinates are obtained via the Nominatim geocoding service (OpenStreetMap). Weather data is displayed for informational purposes only and is not a substitute for professional meteorological advice. OEH is not responsible for inaccuracies or outages in weather data. Always consult official sources when making driving decisions in adverse weather.</p>
          </section>
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>20. Profile Pictures</h2>
            <p style={{ color: "#ccc" }}>Users may upload a profile picture to their OEH account. By uploading a profile picture, you represent that you have the right to use and share that image, and you grant OEH a non-exclusive, royalty-free license to store, display, and use that image in connection with your account and the Platform. Profile pictures are visible to other Platform users. OEH reserves the right to remove any profile image that violates these Terms.</p>
          </section>
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>21. Upside Affiliate Partnership</h2>
            <p style={{ color: "#ccc" }}>OEH participates in the Upside affiliate program. Links to Upside on the Platform are referral links, and OEH may receive compensation when users sign up or make purchases through those links. Upside is a third-party service not affiliated with OEH. Cash back or rewards earned through Upside are governed solely by Upside&apos;s own terms of service and privacy policy.</p>
          </section>
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>22. MC/DOT Number Collection for Fraud Prevention</h2>
            <p style={{ color: "#ccc" }}>OEH may collect MC (Motor Carrier) and DOT numbers from carriers. OEH does not verify them. They are used for account records and fraud prevention. MC/DOT numbers are stored securely and are not sold to third parties. Providing false or invalid MC/DOT numbers violates these Terms and may result in immediate account termination.</p>
          </section> <section style={{marginBottom:32}}><h2 style={{color:"#fff",fontSize:18,marginBottom:12}}>23. Escort Availability Board</h2><p style={{color:"#ccc"}}>The Escort Availability Board allows licensed P/EVO escorts to post their availability window, location, and certifications. Carriers may contact escorts directly. OEH does not guarantee job placement or successful matching through the board.</p></section><section style={{marginBottom:32}}><h2 style={{color:"#fff",fontSize:18,marginBottom:12}}>24. SMS Load Posting</h2><p style={{color:"#ccc"}}>Pro subscribers and carriers may post loads via SMS. Standard carrier messaging rates may apply. OEH is not responsible for delivery failures. SMS load posting requires opt-in and compliance with all applicable 10DLC messaging regulations.</p></section><section style={{marginBottom:32}}><h2 style={{color:"#fff",fontSize:18,marginBottom:12}}>25. No Verification or Background Checks</h2><p style={{color:"#ccc"}}>OEH does not check or verify people, companies, licenses, certifications, insurance, vehicles or documents, and does not offer background checks or verified badges. Everything on a profile or load post is entered by the user. Check before you hire or accept work.</p></section><section style={{marginBottom:32}}><h2 style={{color:"#fff",fontSize:18,marginBottom:12}}>26. Canadian Province Support</h2><p style={{color:"#ccc"}}>OEH supports load posting and escort operations across Canadian provinces. Users are solely responsible for complying with all applicable provincial permits, regulations, and cross-border transportation laws.</p></section><section style={{marginBottom:32}}><h2 style={{color:"#fff",fontSize:18,marginBottom:12}}>27. Curfew and State Route Disclaimer</h2><p style={{color:"#ccc"}}>Curfew hours, travel time restrictions, and permit information displayed on OEH are for reference only and may not be current. Users must verify all requirements with the appropriate state or provincial authority before each trip.</p></section>
          
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>28. Evergreen Safety Council Membership</h2>
          <p style={{ color: "#ccc" }}>Oversize Escort Hub is a member of the Evergreen Safety Council (membership INV14545). As a member, OEH has a promo code that gives OEH Member, Pro, and Fleet subscribers receive a 5% discount on all bookable Evergreen Safety Council courses — including P/EVO, WITPAC, Flagger, TCS, and related certifications. Use promo code <strong style={{ color: '#f0a500' }}>OSEH2026</strong> at checkout on the Evergreen Safety Council site. The Evergreen Safety Council is an independent third party and does not endorse OEH; OEH does not operate, accredit, or guarantee their courses. Enrollment, course content, scheduling, and certification issuance are governed solely by the Evergreen Safety Council's own terms.</p>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>29. OSEH2026 Promo Code Terms</h2>
          <p style={{ color: "#ccc" }}>The <strong style={{ color: '#f0a500' }}>OSEH2026</strong> promo code is valid through April 30, 2027, and provides a 5% discount on Evergreen Safety Council course enrollment at the time of checkout on the Evergreen Safety Council's platform. The code is available only to active OEH Member, Pro, and Fleet subscribers in good standing. The discount is non-transferable, cannot be combined with other offers, applies only to courses Evergreen Safety Council designates as bookable, and may be suspended, modified, or withdrawn by OEH or by the Evergreen Safety Council at any time without notice. OEH is not responsible for promo code honoring on the third-party Evergreen Safety Council site.</p>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>30. Marketplace Liability Waiver</h2>
          <p style={{ color: "#ccc" }}>Oversize Escort Hub is a neutral marketplace that facilitates discovery and communication between independent carriers, brokers, escorts (P/EVO, WITPAC, Flagger, TCS), and related transportation professionals. <strong>OEH is not a party to any contract, engagement, booking, agreement, or transaction between users.</strong> OEH does not provide escort, pilot car, flagging, or motor carrier services and makes no warranty regarding the accuracy of user-submitted credentials, the performance of any service, the suitability of any match, the outcome of any trip, or the resolution of any dispute. Users engage one another at their own risk and are solely responsible for independently verifying licensure, insurance, permits, and operating authority before performing or accepting any work. To the fullest extent permitted by law, OEH disclaims all liability arising from or relating to agreements formed between users on the Platform.</p>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>31. Broker Self-Certification</h2>
          <p style={{ color: "#ccc" }}>Freight brokers and broker-carriers who use the Platform to post loads represent and warrant that they hold a valid MC/DOT authority with appropriate broker authority, are in good standing with the FMCSA, maintain the surety bond (BMC-84) or trust fund (BMC-85) required by 49 CFR § 387.307, and are not subject to any suspension, revocation, or out-of-service order. By posting a load, the broker self-certifies compliance with all applicable federal and state brokerage laws and agrees to honor posted rates, provide accurate load information, and pay carriers and escorts in accordance with industry-standard terms. OEH may suspend or remove broker accounts that fail to maintain valid authority or that receive repeated verified complaints regarding non-payment or misrepresentation.</p>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>32. Fleet Manager Multi-Escort Coordination</h2>
          <p style={{ color: "#ccc" }}>Fleet Manager tools (available on the Pro and Fleet tiers) allow a single operator to coordinate load assignments, availability, and communications on behalf of multiple escort operators. By using Fleet Manager tools, the Fleet Manager represents that they have obtained prior written consent from each escort whose information is entered, accept, or relay on the Platform. Each escort remains an independent operator responsible for their own licensure, insurance, equipment, and acceptance of any specific job. OEH does not act as an employer, dispatcher, or agent of any escort, and fleet coordination through the Platform does not create an employment, agency, or partnership relationship between OEH, the Fleet Manager, and the escorts they coordinate. Fleet search activity is rate-limited and logged for abuse prevention.</p>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>33. SMS Messaging & 10DLC Compliance</h2>
          <p style={{ color: "#ccc" }}>Text messaging is not turned on yet; this section describes how it will work when it starts. OEH's SMS features — including load-posting notifications, match alerts, and transactional account messages — will be delivered over a 10DLC-registered A2P messaging campaign once our registration is approved, following CTIA guidelines and applicable carrier requirements. You may receive messages only after explicit opt-in. Standard messaging and data rates may apply. Reply <strong>STOP</strong> to unsubscribe or <strong>HELP</strong> for assistance at any time. OEH does not share your phone number or SMS opt-in with third parties for marketing purposes. Consent to receive SMS is not a condition of using the Platform or purchasing a subscription.</p>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>34. In-App Purchase & Subscription Management Policy</h2>
          <p style={{ color: "#ccc" }}>While plans are free, the apps are free for every account and nothing is sold in them. If paid plans start, subscriptions to OEH Member, Pro, Fleet, P/EVO Member, P/EVO Pro, and related tiers are sold, managed, and billed exclusively through our website at <a href="https://oversize-escort-hub.com" style={{ color: '#f90' }}>oversize-escort-hub.com</a> using Stripe. <strong>Subscriptions are not sold through the Apple App Store or Google Play in-app purchase systems.</strong> The OEH mobile apps (iOS and Android) are free tools that let active subscribers sign in and use features they have already purchased on the web. To upgrade, downgrade, change payment methods, update billing information, or cancel a subscription, visit your account billing page on oversize-escort-hub.com. Refunds, proration, and billing disputes are handled under Section 4 (Accounts & Subscriptions) of these Terms and are not subject to Apple or Google's refund policies.</p>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>35. Paid Add-Ons and Refunds</h2>
          <p style={{ color: "#ccc" }}>Using the Platform is free while we launch. Paid extras are one-time purchases made on our website, never inside the mobile app. Today the only one is a Sponsored Zone ($29.99 for 30 days, one sponsor per state). A Sponsored Zone can be refunded in full if you ask within 24 hours of purchase and your listing has not been shown; after that it runs for its 30 days and is not refundable, and it ends on its own without renewing. We may remove a listing or refuse a purchase that breaks these Terms, and in that case we will refund the unused part. Payments are handled by Stripe. We do not store your card number.</p>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>36. Jobs board</h2>
          <p>Oversize Escort Hub is a marketplace, not the employer. Posters and applicants agree the work, pay and classification between themselves. Do not put contact details in posts or applications. Oversize Escort Hub may remove posts.</p>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>37. Documents on profiles</h2>
          <p>Escorts may upload a certificate, proof of insurance or other papers and choose to show them on their public profile. The escort alone is responsible for what is uploaded and for keeping it current. Oversize Escort Hub does not check, verify, endorse or guarantee these documents, and showing one is not a statement that it is genuine, valid or enough for any job. Anyone who relies on a document must confirm it with the issuer or insurer first. We may remove any document or profile at any time.</p>
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>38. Contact</h2>
          <p>Oversize Escort Hub is operated by Precision Pilot Services, LLC, doing business as Oversize Escort Hub.</p>
          <p>Questions? <a href="mailto:support@oversize-escort-hub.com" style={{ color: "#f90" }}>support@oversize-escort-hub.com</a></p>
        </section>
        <div style={{ borderTop: "1px solid #333", paddingTop: 24, fontSize: 11, color: "#555" }}>
          © 2026 Oversize Escort Hub. All rights reserved. · <a href="/privacy" style={{ color: "#f90" }}>Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}
