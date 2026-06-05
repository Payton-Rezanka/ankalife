# AnkaLife — Launch Readiness Audit

A frank list of what's solid, what's simulated, and what must be handled before real
agents and real money flow through the platform. Grouped by priority.

## 🔴 Critical — do BEFORE real agents sign up or any money changes hands

1. **Custom SMTP for email (in progress).** Supabase's built-in email is rate-limited
   *project-wide* — every user's signup/login email shares one small hourly bucket.
   Connect Brevo (or similar) SMTP so logins actually work at scale. *(Setup underway.)*

2. **Real license verification (NIPR).** Today the check is *simulated* — it only validates
   the NPN *format*, so anyone could create an "approved" agent account with a fake-but-
   well-formed number. Before selling real leads you must verify against the **NIPR Producer
   Database API** (via a Supabase Edge Function with a secret key). Letting unlicensed people
   buy/work life leads is a serious compliance problem.

3. **Real payments (Stripe).** The wallet is *demo dollars*. Agents aren't actually paying.
   Wire **Stripe** (Edge Function) before charging anyone. Until then, no real revenue and
   no real "balance."

4. **Move purchases + wallet to the cloud.** Right now an agent's bought leads and balance
   live only in *their browser* — they won't sync across devices, and the secure
   "unlock contact info after purchase" isn't enforced server-side yet. Needs the
   `purchases`/`transactions` tables wired with RLS. (Schema already exists.)

5. **Privacy Policy + Terms of Service pages.** You're collecting personal info and TCPA
   consent — you legally need real, linked Privacy Policy and Terms pages (GLBA/CCPA/state
   privacy). The footer references compliance but there are no actual pages yet. Use
   Termly/Termageddon to generate, then have an attorney review.

6. **Spam / bot protection on the public survey.** The survey can be submitted by anyone
   (by design, so your link works) — which means bots could flood your `leads` table with
   junk. Add a **CAPTCHA** (Cloudflare Turnstile or hCaptcha — both free) before launch.

7. **Remove demo data + the demo owner before launch.** Seeded sample leads, sample
   "policy placed" tickers, and the local `owner@ankalife.ai` demo account should be stripped
   so real data isn't mixed with fake. (Your real owner is your email-based Supabase account.)

8. **TCPA / DNC for real outreach.** Any real calling/texting needs documented prior express
   written consent (you capture it ✓), **DNC scrubbing before every call**, instant opt-out,
   and licensed-human binding. See `FOUNDER_PACKET.md`. Don't dial real consumers until this
   is in place.

## 🟡 Soon — needed shortly after launch

9. **Real SMS/email to clients.** The confirmation message is *shown*, not *sent*. Wire
   Brevo/Twilio (Edge Function) to actually deliver it.

10. **Realtime placements.** The "policy placed" toasts are currently local/seeded. Wire the
    `placements` table + Supabase Realtime so they're genuinely live across all visitors.

11. **Authenticate your domain for email.** Right now login emails send from a personal
    address. Add DNS records (SPF/DKIM) so they come from `noreply@ankalifeleads.com` —
    better trust and far better inbox deliverability.

12. **Open Graph / link preview.** When you post the survey link, add OG tags so it shows a
    nice title/image/description instead of a bare URL. Boosts click-through a lot.

13. **Lead de-duplication + return/credit tied to real payments.** Handle duplicate
    submissions and connect the existing credit flow to real Stripe refunds.

## 🟢 Operational / nice-to-have

14. **Supabase plan.** Free tier **pauses the project after ~7 days of inactivity** and caps
    the DB at 500MB. Before real traffic, upgrade to **Pro ($25/mo)** so it never sleeps and
    you get daily backups.
15. **Analytics** (traffic + conversion) — Plausible/Cloudflare Web Analytics (privacy-friendly).
16. **Error monitoring** (Sentry free tier) so you see problems before users report them.
17. **Business basics** — LLC, EIN, E&O insurance, and check state lead-generator
    registration rules. (All in `FOUNDER_PACKET.md`.)

## Recommended order from here
1. Finish **SMTP** → confirm you can log in as owner. *(now)*
2. Wire **purchases + wallet → cloud** + secure lead unlock. *(next, no secrets needed)*
3. Wire **realtime placements**. *(next, no secrets needed)*
4. **Edge Functions** for the secret-key features, in this order: **Stripe** → **NIPR** →
   **real SMS/email**.
5. Add **CAPTCHA**, **Privacy/Terms pages**, **OG tags**, strip demo data → **soft launch**.
6. Upgrade Supabase to **Pro**, add analytics/monitoring → **scale**.
