'use client';
import SiteHeader from '@/components/SiteHeader';
export default function PrivacyPolicy() {
  const s = { section: { marginBottom: 36 }, h2: { color: "#fff", fontSize: 17, marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #1a1a1a" }, p: { lineHeight: 1.85, marginBottom: 12, color: "#aaa" }, li: { lineHeight: 1.85, color: "#aaa", marginBottom: 6 }, ul: { paddingLeft: 22, marginBottom: 12 } };
  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#ccc", fontFamily: "system-ui, sans-serif" }}>
      <SiteHeader />
      <div style={{ background: "#0f0f0f", borderBottom: "1px solid #1a1a1a", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <a href="/" style={{ background: "none", border: "1px solid #333", color: "#888", fontFamily: "DM Mono, monospace", fontSize: 10, letterSpacing: ".1em", padding: "6px 14px", cursor: "pointer", borderRadius: 2, textDecoration: "none" }}>
          ← BACK
        </a>
        <span style={{ fontSize: 10, letterSpacing: ".2em", color: "#f90" }}>OVERSIZE ESCORT HUB</span>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "56px 24px 80px" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 10, letterSpacing: ".2em", color: "#f90", marginBottom: 10 }}>LEGAL</div>
          <h1 style={{ fontSize: 34, color: "#fff", marginBottom: 8, fontWeight: 700 }}>Privacy Policy</h1>
          <p style={{ fontSize: 12, color: "#555" }}>Effective Date: April 2, 2026 &nbsp;|&nbsp; Last Updated: April 2, 2026</p>
        </div>

        <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>1. Introduction & Company Information</h2>
          <p style={{ ...s.p }}>This Privacy Policy describes how Oversize Escort Hub ("Company," "we," "us," or "our") collects, uses, and protects your personal information when you access or use our platform at <a href="https://www.oversize-escort-hub.com" style={{ color: "#f90" }}>www.oversize-escort-hub.com</a> (the "Platform").</p>
          <p style={{ ...s.p }}>Oversize Escort Hub is a verified marketplace connecting oversize load carriers with licensed pilot car (P/EVO) escorts and freight brokers.</p>
          <p style={{ ...s.p }}><strong style={{ color: "#fff" }}>Contact:</strong> <a href="mailto:support@oversize-escort-hub.com" style={{ color: "#f90" }}>support@oversize-escort-hub.com</a></p>
        </div>

        <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>2. Information We Collect</h2>
          <p style={{ ...s.p }}>We may collect personal information when you:</p>
          <ul style={{ ...s.ul }}>
            <li style={{ ...s.li }}>Create an account or register on the Platform</li>
            <li style={{ ...s.li }}>Post a load, respond to a load listing, or submit a bid</li>
            <li style={{ ...s.li }}>Submit a verification or background check request</li>
            <li style={{ ...s.li }}>Contact us via email, phone, or any contact form on the Platform</li>
            <li style={{ ...s.li }}>Opt in to receive SMS or email communications from us</li>
            <li style={{ ...s.li }}>Purchase a subscription or complete a payment transaction</li>
            <li style={{ ...s.li }}>Use any feature of the Platform</li>
          </ul>
          <p style={{ ...s.p }}>Information collected may include: full name, company name, email address, phone number, physical address, state of operation, vehicle information, license or certification numbers, and payment information processed securely through Stripe.</p>
          <p style={{ ...s.p }}>We also automatically collect usage data such as IP addresses, browser type, device type, pages visited, and referring URLs to improve Platform performance and security.</p>
        </div>

        <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>3. How We Use Your Information</h2>
          <p style={{ ...s.p }}>We use your personal information to:</p>
          <ul style={{ ...s.ul }}>
            <li style={{ ...s.li }}>Operate, maintain, and improve the Platform</li>
            <li style={{ ...s.li }}>Connect oversize load carriers with verified P/EVO escorts and brokers</li>
            <li style={{ ...s.li }}>Process payments, subscriptions, and background check fees</li>
            <li style={{ ...s.li }}>Verify your identity and professional credentials</li>
            <li style={{ ...s.li }}>Send transactional messages including load alerts, bid notifications, and account updates</li>
            <li style={{ ...s.li }}>Send SMS notifications you have opted in to receive</li>
            <li style={{ ...s.li }}>Respond to your support requests and communications</li>
            <li style={{ ...s.li }}>Enforce our Terms of Service and protect the safety and integrity of the Platform</li>
            <li style={{ ...s.li }}>Comply with applicable laws and legal obligations</li>
          </ul>
        </div>

        <div style={{ ...s.section, background: "rgba(249,144,0,0.04)", border: "1px solid rgba(249,144,0,0.15)", borderRadius: 8, padding: 24 }}>
          <h2 style={{ ...s.h2, borderColor: "rgba(249,144,0,0.2)", color: "#f90" }}>4. Information Sharing & Third Parties</h2>
          <p style={{ ...s.p, color: "#fff", fontWeight: 600, fontSize: 15 }}>We do not sell, rent, or share your personal contact information with third parties for marketing or promotional purposes.</p>
          <p style={{ ...s.p }}><strong style={{ color: "#fff" }}>Mobile information will not be shared with third parties or affiliates for marketing or promotional purposes. All categories described in this policy exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties under any circumstances.</strong></p>
          <p style={{ ...s.p }}>We may share information only in these limited circumstances:</p>
          <ul style={{ ...s.ul }}>
            <li style={{ ...s.li }}><strong style={{ color: "#ddd" }}>Service Providers:</strong> We work with trusted third-party vendors (payment processors, hosting providers, analytics services) who process data solely to operate the Platform and are bound by confidentiality obligations.</li>
            <li style={{ ...s.li }}><strong style={{ color: "#ddd" }}>Legal Requirements:</strong> We may disclose information if required by law, court order, or governmental authority, or to protect the rights, property, or safety of our users or the public.</li>
            <li style={{ ...s.li }}><strong style={{ color: "#ddd" }}>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction, subject to this Privacy Policy.</li>
          </ul>
        </div>

        <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>5. Cookies & Tracking Technologies</h2>
          <p style={{ ...s.p }}>We use session cookies to maintain your login state and improve your experience on the Platform. We do not use third-party advertising cookies or tracking pixels for behavioral advertising purposes. You may disable cookies in your browser settings, but this may affect your ability to use certain Platform features.</p>
        </div>

        <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>6. Data Security</h2>
          <p style={{ ...s.p }}>We implement industry-standard technical and organizational security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. Your data is stored in encrypted databases. Payment card information is processed exclusively through Stripe and is never stored on our servers.</p>
          <p style={{ ...s.p }}>No method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security.</p>
        </div>

        <div style={{ ...s.section, background: "rgba(249,144,0,0.04)", border: "1px solid rgba(249,144,0,0.15)", borderRadius: 8, padding: 24 }}>
          <h2 style={{ ...s.h2, borderColor: "rgba(249,144,0,0.2)", color: "#f90" }}>7. SMS Terms & Conditions</h2>
          <p style={{ ...s.p }}><strong style={{ color: "#fff" }}>Company:</strong> Oversize Escort Hub</p>

          <h3 style={{ color: "#ddd", fontSize: 14, marginTop: 20, marginBottom: 8 }}>Types of SMS Messages</h3>
          <p style={{ ...s.p }}>By opting in to receive SMS notifications from Oversize Escort Hub, you may receive messages including, but not limited to:</p>
          <ul style={{ ...s.ul }}>
            <li style={{ ...s.li }}>New load alerts and load board updates in your selected states or regions</li>
            <li style={{ ...s.li }}>Bid board notifications — new bids, bid accepted, bid rejected, timer expiration</li>
            <li style={{ ...s.li }}>Load status updates — filled, cancelled, expired, or modified</li>
            <li style={{ ...s.li }}>Account notifications including verification status and subscription updates</li>
            <li style={{ ...s.li }}>Platform announcements and service updates</li>
          </ul>
          <p style={{ ...s.p }}>Message frequency may vary based on load activity in your area and your notification preferences.</p>

          <h3 style={{ color: "#ddd", fontSize: 14, marginTop: 20, marginBottom: 8 }}>How to Opt In</h3>
          <p style={{ ...s.p }}>You may opt in to receive SMS messages from Oversize Escort Hub by checking the optional SMS consent checkbox during account registration or in your account notification settings. By opting in, you agree to receive the messages described above from Oversize Escort Hub at the phone number you provide. Consent to receive SMS messages is not required as a condition of using the Platform or purchasing any subscription.</p>

          <h3 style={{ color: "#ddd", fontSize: 14, marginTop: 20, marginBottom: 8 }}>How to Opt Out</h3>
          <p style={{ ...s.p }}>You can cancel SMS notifications at any time. Simply reply <strong style={{ color: "#fff" }}>STOP</strong> to any SMS message you receive from us. After sending STOP, we will send you one final SMS confirming that you have been unsubscribed. You will no longer receive SMS messages from us after that confirmation. To re-subscribe, text <strong style={{ color: "#fff" }}>START</strong> or opt back in through your account notification settings.</p>

          <h3 style={{ color: "#ddd", fontSize: 14, marginTop: 20, marginBottom: 8 }}>How to Get Help</h3>
          <p style={{ ...s.p }}>If you are experiencing issues with our SMS messaging program, reply <strong style={{ color: "#fff" }}>HELP</strong> for assistance, or contact us directly at <a href="mailto:support@oversize-escort-hub.com" style={{ color: "#f90" }}>support@oversize-escort-hub.com</a>.</p>

          <h3 style={{ color: "#ddd", fontSize: 14, marginTop: 20, marginBottom: 8 }}>Rates & Carrier Liability</h3>
          <p style={{ ...s.p }}>Message and data rates may apply for any messages sent to you from us and to us from you. If you have any questions about your text plan or data plan, contact your wireless provider. Carriers are not liable for delayed or undelivered messages.</p>

          <h3 style={{ color: "#ddd", fontSize: 14, marginTop: 20, marginBottom: 8 }}>Privacy of SMS Data</h3>
          <p style={{ ...s.p }}>Your phone number and SMS opt-in consent will not be shared with third parties or affiliates for marketing or promotional purposes. For full privacy details, see this Privacy Policy at <a href="https://www.oversize-escort-hub.com/privacy" style={{ color: "#f90" }}>www.oversize-escort-hub.com/privacy</a>.</p>
        </div>

        <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>8. Data Retention</h2>
          <p style={{ ...s.p }}>We retain your personal information for as long as your account is active or as needed to provide you with the Platform. You may request deletion of your account and associated data by contacting us at support@oversize-escort-hub.com. We may retain certain information as required by law or for legitimate business purposes such as fraud prevention.</p>
        </div>

        <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>9. Your Rights & Choices</h2>
          <p style={{ ...s.p }}>Depending on your location, you may have certain rights regarding your personal information, including:</p>
          <ul style={{ ...s.ul }}>
            <li style={{ ...s.li }}>The right to access the personal information we hold about you</li>
            <li style={{ ...s.li }}>The right to correct inaccurate or incomplete information</li>
            <li style={{ ...s.li }}>The right to request deletion of your personal information</li>
            <li style={{ ...s.li }}>The right to opt out of marketing communications at any time</li>
            <li style={{ ...s.li }}>The right to data portability where technically feasible</li>
          </ul>
          <p style={{ ...s.p }}>To exercise these rights, contact us at <a href="mailto:support@oversize-escort-hub.com" style={{ color: "#f90" }}>support@oversize-escort-hub.com</a>. We will respond within 30 days.</p>
        </div>

        <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>10. Children's Privacy</h2>
          <p style={{ ...s.p }}>The Platform is not directed to individuals under the age of 18. We do not knowingly collect personal information from minors. If we become aware that a minor has provided us with personal information, we will take steps to delete that information promptly.</p>
        </div>

        <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>11. Third-Party Links</h2>
          <p style={{ ...s.p }}>The Platform may contain links to third-party websites or services. We are not responsible for the privacy practices or content of those third parties. We encourage you to review the privacy policies of any third-party sites you visit.</p>
        </div>

        <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>12. California Privacy Rights (CCPA)</h2>
          <p style={{ ...s.p }}>If you are a California resident, you have the right to request disclosure of the categories and specific pieces of personal information we have collected about you, the categories of sources from which it was collected, and the business purpose for collecting it. You also have the right to request deletion of your personal information and to opt out of any sale of personal information. We do not sell personal information. To make a request, contact us at support@oversize-escort-hub.com.</p>
        </div>

        <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>13. Changes to This Policy</h2>
          <p style={{ ...s.p }}>We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. We will notify registered users of material changes via email or Platform notification. The "Last Updated" date at the top of this page reflects when it was last revised. Continued use of the Platform after any changes constitutes acceptance of the updated Policy.</p>
        </div>

                <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>15. Matching Engine &amp; Load Request Data</h2>
          <p style={{ ...s.p }}>When you use the load request / matching feature, OEH records your request, match status, acceptance or decline decisions, and timestamp. This data is used to operate the matching system, enforce the 1-hour hold, and send relevant notifications. Match history may be retained for dispute resolution and platform analytics.</p>
        </div>
        <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>16. Reviews &amp; Ratings Data</h2>
          <p style={{ ...s.p }}>Reviews and star ratings you submit are associated with your account and are visible to other Platform users. We store review text, rating scores, and the date of submission. You may not submit reviews anonymously. OEH may use aggregated rating data for search ranking and analytics.</p>
        </div>
        <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>17. Referral Program Data</h2>
          <p style={{ ...s.p }}>If you participate in our referral program, we collect and store your referral code, the identity of users referred by you, and the status of referral rewards. We use this data solely to administer the referral program. Referral data is not shared with third parties except as required to fulfill rewards.</p>
        </div>
        <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>18. Fleet Manager Data</h2>
          <p style={{ ...s.p }}>Fleet Manager Tools allow Pro subscribers to enter information about third-party escorts (name, phone number, city, state, and availability) into the Platform. By entering this data, you represent that you have obtained appropriate consent from each escort to process their information. OEH stores fleet search data and logs to enforce rate limits and flag anomalous activity. Fleet escort data entered by a fleet manager is not used for any purpose beyond facilitating the fleet search and is not shared or sold.</p>
        </div>
        <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>19. Multi-Board Load Posting Data</h2>
          <p style={{ ...s.p }}>When you post a load to multiple boards, OEH stores a single load record with a boards field indicating which boards the load appears on. Status changes (pending, filled, open) are applied atomically to the single record and reflected across all boards simultaneously. Load records, status history, and board selections are stored for operational, audit, and dispute resolution purposes.</p>
        </div>
        <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>20. FMCSA DOT Number &amp; Verification Data</h2>
          <p style={{ ...s.p }}>When you provide a USDOT number, OEH queries the FMCSA QCMobile public API using that number. The API response, including carrier legal name and operating status, is stored alongside your load record. This data originates from the publicly available FMCSA government database. We do not sell FMCSA data. Verification results are displayed to other Platform users as part of the load card to promote safety and transparency.</p>
        </div>
        <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>21. Weather Data</h2>
          <p style={{ ...s.p }}>OEH displays weather information from the National Weather Service (NWS) API and uses the Nominatim geocoding service (OpenStreetMap) to convert city/state inputs to geographic coordinates. We do not store weather data permanently; it is fetched in real time or cached briefly for performance. We do not share location inputs used for weather lookups with third parties beyond the NWS and Nominatim services.</p>
        </div>
        <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>22. Profile Pictures</h2>
          <p style={{ ...s.p }}>Profile pictures you upload are stored securely in our cloud storage (Supabase Storage). Your profile picture is visible to other authenticated Platform users. You may update or remove your profile picture at any time from your account settings. We do not use profile pictures for facial recognition or share them with third parties.</p>
        </div>
        <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>23. Upside Affiliate Partnership</h2>
          <p style={{ ...s.p }}>OEH participates in the Upside affiliate program. If you click an Upside referral link and sign up or make a purchase, Upside may share limited transaction data with OEH for affiliate commission purposes. We do not receive or store your Upside account credentials or payment information. Your use of Upside is governed by Upside&apos;s own privacy policy.</p>
        </div>
        <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>24. MC/DOT Numbers for Fraud Prevention</h2>
          <p style={{ ...s.p }}>MC (Motor Carrier) and DOT numbers collected from carrier accounts are used for identity verification and fraud prevention. This data is cross-referenced with FMCSA public records. MC/DOT data is stored securely, is not sold, and is only shared with law enforcement or regulatory authorities when required by law or to investigate fraud on the Platform.</p>
        </div> <div style={{...s.section}}><h2 style={{...s.h2}}>25. Escort Availability Board</h2><p style={{...s.p}}>When escorts post on the Availability Board, their stated location, certifications, and availability window are stored and displayed to carriers. This information is public within the platform.</p></div><div style={{...s.section}}><h2 style={{...s.h2}}>26. SMS Load Posting</h2><p style={{...s.p}}>When you use SMS load posting, your phone number and message content are processed to create load listings. Message logs are retained for moderation purposes. You must have opted in to SMS services.</p></div><div style={{...s.section}}><h2 style={{...s.h2}}>27. BGC Badge</h2><p style={{...s.p}}>Background check data is processed by a third-party provider. OEH stores only the verification status (pass/fail) and badge issuance date. Raw background check results are not stored by OEH.</p></div><div style={{...s.section}}><h2 style={{...s.h2}}>28. Canadian Operations</h2><p style={{...s.p}}>Users in Canadian provinces are subject to applicable Canadian privacy laws including PIPEDA. Location and load data involving Canadian addresses is processed on the same infrastructure as US data.</p></div>
        <div style={{ ...s.section }}>
          <h2 style={{ ...s.h2 }}>14. Contact Us</h2>
          <p style={{ ...s.p }}>If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your personal information, please contact us:</p>
          <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 6, padding: 20, marginTop: 12 }}>
            <p style={{ color: "#fff", marginBottom: 4, fontWeight: 600 }}>Oversize Escort Hub</p>
            <p style={{ color: "#888", marginBottom: 4 }}>Email: <a href="mailto:support@oversize-escort-hub.com" style={{ color: "#f90" }}>support@oversize-escort-hub.com</a></p>
            <p style={{ color: "#888" }}>Website: <a href="https://www.oversize-escort-hub.com" style={{ color: "#f90" }}>www.oversize-escort-hub.com</a></p>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 24, marginTop: 40, fontSize: 11, color: "#444" }}>
          © 2026 Oversize Escort Hub. All rights reserved. &nbsp;|&nbsp;
          <a href="/terms" style={{ color: "#555" }}>Terms of Service</a>
        </div>
      </div>
    </div>
  );
}
