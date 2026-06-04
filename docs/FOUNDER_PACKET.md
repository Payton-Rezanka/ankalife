# AnkaLife — Founder's Packet
### How to turn this prototype into a real, legal, profitable life-insurance lead company
*Prepared June 4, 2026. This is plain-English coaching, not legal advice — confirm specifics with an attorney and your state insurance department before you take money.*

---

## 0. Read this first: the 60-second reality check

You asked for a platform where **AI calls leads, closes them, and writes policies while you do nothing.** Here is the honest version of that dream, reshaped so it's legal and won't get you sued:

| What you imagined | What's legal & what we build instead |
|---|---|
| AI cold-calls anyone and sells them | AI calls **only people who opted in** (gave consent), scrubs Do-Not-Call lists, and stops instantly on "stop." |
| AI closes the sale and "writes the policy" | AI **qualifies, educates, handles objections, books the appointment, and pre-fills the application**. A **licensed human** does the final close/bind. |
| You never touch anything | You (or a licensed producer you hire) are the human in the loop for the *bind* step only. Everything else is automated. |
| Sell leads to other agents | Totally legal and a great business — this is your main revenue. |

**Why this matters (don't skip):**
- **TCPA** (Telephone Consumer Protection Act): since the FCC's Feb 2024 ruling, **AI-generated/prerecorded voice calls to cell phones require prior express *written* consent.** Penalty: **$500–$1,500 per call.** One bad auto-dial campaign to 1,000 non-consented cell numbers = up to **$1.5M** in exposure. This is the #1 thing that kills lead companies.
- **Insurance licensing:** selling or binding life insurance without a license is a crime in every state. **You cannot let an AI bind a policy.**
- **Good news:** "AI does 95% of the work, licensed human signs" is exactly how the best agencies already operate. You lose almost nothing by doing it right.

---

## 1. Pick your business model (choose one to start)

You actually have **three** businesses bundled in the prototype. Pick ONE as your wedge, add the others later.

### Model A — Lead Marketplace (recommended first) 💰
You generate or buy life-insurance leads, score them, and **resell them to licensed agents** on your platform.
- **You do NOT need an insurance license** to sell *data/leads* (but check your state — a few regulate lead generators).
- Revenue: margin between what a lead costs you to acquire and what agents pay.
- Lowest legal risk, fastest to launch, this is what the prototype is built around.

### Model B — Producer / Agency
You get licensed, the AI books appointments, and **you (or your hired producers) close and earn commissions** from carriers.
- Requires **your insurance license** + carrier appointments.
- Highest revenue per sale (commissions are 50–110% of first-year premium on life), but slower to start.

### Model C — Hybrid (the end state)
Run the AI sales engine on your own leads (Model B economics) **and** sell the overflow/lower-tier leads to other agents (Model A revenue). The prototype is already designed for this — the "owner" account is Model B, every other account is Model A.

> **Coach's pick:** Launch **Model A** in 30–60 days for cash flow, get licensed in parallel, then flip on **Model B** to become the **Hybrid**. That's the lowest-risk path to the full vision.

---

## 2. Form the company (the boring stuff that protects you) — ~1 week, ~$200–800

Do these in order. None require a lawyer, though a 1-hour consult is money well spent.

1. **Choose a name + check it's free.** Search your Secretary of State business database + the USPTO trademark search (tmsearch.uspto.gov) + domain availability (next section). confirm "AnkaLife" isn't already trademarked in insurance before you commit to it.
2. **Form an LLC** (start here; convert to C-corp later only if you raise venture money).
   - File "Articles of Organization" with your **state's Secretary of State** ($50–500 depending on state).
   - Easiest: do it directly on the SoS website. Services like Northwest Registered Agent or LegalZoom cost more but handle it for you.
   - Get a **Registered Agent** (you can be your own, or pay ~$100/yr for privacy).
3. **Get an EIN (free, 5 minutes):** irs.gov → "Apply for an EIN online." This is your business's tax ID. Never pay a third party for this.
4. **Operating Agreement:** even as a solo owner, write one (templates are fine). It proves the LLC is separate from you — that's what protects your personal assets.
5. **Open a business bank account** (Mercury, Relay, or any local bank). Use your EIN + Articles. **Never mix personal and business money** — it voids your liability protection.
6. **Business insurance:** get **E&O (Errors & Omissions)** and **General Liability**. For a lead/insurance business, E&O is essential — ~$500–1,500/yr (Hiscox, Next Insurance, Embroker).
7. **Bookkeeping from day one:** QuickBooks, Wave (free), or a spreadsheet. Track every dollar.

**Cost to be fully, legally formed: roughly $200–$800 + ~$500/yr insurance.**

---

## 3. Get licensed (only needed for Model B/C — do it in parallel)

To *sell/bind* life insurance you (or an employee) need a **resident life insurance producer license**:

1. **Pre-licensing course** (required in most states): ~20–40 hours, ~$100–300 online (Kaplan, ExamFX, A.D. Banker).
2. **Pass the state life insurance exam** at a testing center (~$50–150).
3. **Background check + fingerprints** (~$50).
4. **Apply for the license** via your state Department of Insurance, usually through **NIPR.com** (~$50–200). You'll receive your **NPN (National Producer Number)** — the same number the prototype verifies.
5. **Get carrier appointments:** apply to each carrier you want to sell (Banner, Mutual of Omaha, etc.) or join an **IMO/FMO** (Insurance Marketing Organization) which gives you appointments + higher commissions + support. Examples: Integrity, AmeriLife, Sest. **Joining an IMO is the fast path.**
6. **Sell in other states:** get **non-resident licenses** through NIPR (a few minutes + a fee each).

**Timeline: 2–6 weeks. Cost: ~$300–700 all-in.**

---

## 4. Get your domain and put the site online — ~1 hour, ~$15–50/yr

This is the "show me how to get the domain and link" part. Step by step:

### 4a. Buy the domain
1. Go to a registrar: **Cloudflare Registrar** (cheapest, at-cost), **Namecheap**, or **Porkbun**. Avoid GoDaddy upsells.
2. Search your name, e.g. `ankalife.com`. If `.com` is taken, consider `getanka.com`, `ankalife.ai`, `ankalifeleads.com`. **`.com` is worth paying for** — it's what people trust and type.
3. Buy it (~$10–15/yr for .com, ~$60/yr for .ai). Enable **auto-renew** and **WHOIS privacy** (free at Cloudflare/Namecheap).

### 4b. Put the current prototype online (free, today)
The prototype is a single `index.html` — you can host it for **free** in minutes:
- **Easiest:** drag the folder onto **Netlify Drop** (app.netlify.com/drop) or deploy with **Cloudflare Pages** / **GitHub Pages** / **Vercel**. You'll get a live URL instantly.
- **Connect your domain:** in the host's dashboard, "Add custom domain" → it gives you DNS records → paste them at your registrar (or, if you used Cloudflare for both, it's automatic). Done — `https://ankalife.com` is live with free SSL.

### 4c. Get a business email
- **Google Workspace** ($6/user/mo) or **Zoho Mail** (free tier) gives you `you@ankalife.com`. Looks professional and you need it for carrier/IMO applications and the magic-link login feature.

---

## 5. From prototype → real product (the tech build)

The current app stores everything in the browser (`localStorage`) — perfect for a demo, not for real customers. Here's the production stack, in priority order. **Don't build all of this at once.** Ship Model A first.

| Capability | Prototype today | Production tool | Priority |
|---|---|---|---|
| Hosting | Single HTML file | Cloudflare Pages / Vercel | 🟢 Now |
| Database / accounts | localStorage | **Supabase** or Firebase (auth + Postgres, generous free tier) | 🟢 Now |
| Magic-link / email login | (adding next) | Supabase Auth / Resend for email | 🟢 Now |
| Payments (agents buy leads) | Fake checkout | **Stripe** (Checkout + Connect for payouts) | 🟢 Now |
| **License verification** | Simulated NIPR logic | **NIPR PDB API** (real producer database) — apply at nipr.com; or Vertafore/FinAPI | 🟡 Soon |
| Lead intake forms | Survey in-app | Same survey + **TrustedForm/Jornaya** to *capture proof of consent* (critical for TCPA) | 🟡 Soon |
| **AI voice calling** | Browser speaks aloud | **Telephony:** Twilio / Telnyx. **Voice AI:** Vapi, Bland AI, Retell AI, or ElevenLabs Conversational AI (these give the "soothing, trustworthy" neural voice you wanted) | 🟡 Soon |
| Call script / objection AI | Hard-coded script | The LLM (Claude API) drives the conversation; the voice platform speaks it | 🟡 Soon |
| SMS/email follow-up | Mocked campaigns | Twilio (SMS) + Resend/SendGrid (email), all with opt-out handling | 🟡 Soon |
| DNC scrubbing | Note only | **Real DNC scrub** before every call (DNC.com, Contact Center Compliance) — legally required | 🔴 Before any real calls |

### The realistic "soothing voice" you asked for
You don't pick a voice in code — you pick a **provider**. Best options for a calm, trustworthy outbound voice in 2026:
- **ElevenLabs** — most natural/human voices; "Conversational AI" product does full phone agents.
- **Vapi / Retell AI / Bland AI** — purpose-built AI phone agents; plug in Twilio + an ElevenLabs/Cartesia voice + your Claude-driven script. These handle interruptions, latency, and call flow for you.
- Pick a warm, mid-pace, slightly lower-pitched voice and **set rate ~0.95×**. Always **disclose it's a recorded/AI line** at the top of the call (legally safer and, counterintuitively, builds trust).

---

## 6. Compliance checklist — print this and don't skip it

Before you make a single real call or sell a single real lead:

- [ ] **Consent capture:** every lead has documented prior express written consent to be contacted (use TrustedForm/Jornaya to store the certificate).
- [ ] **DNC scrub** against the National DNC Registry + your internal suppression list before every call.
- [ ] **AI disclosure:** the AI identifies itself and that the line is recorded.
- [ ] **Honor opt-outs instantly** ("stop," "remove me," "do not call") across call/SMS/email — forever.
- [ ] **Calling hours:** 8am–9pm in the *consumer's* time zone.
- [ ] **Licensed human binds every policy.** AI never binds.
- [ ] **Privacy policy + terms** on the site (covers data sale, GLBA for financial data, CCPA/state privacy).
- [ ] **State lead-gen rules:** a handful of states regulate insurance lead sellers — check yours.
- [ ] **Carrier rules:** if you sell their products, follow each carrier's marketing/advertising compliance.
- [ ] **Recordings + records:** keep call recordings and consent records (most rules want 4–5 years).

> Spend $500–$1,500 on **one hour with a TCPA/insurance-marketing attorney** before launch. It's the cheapest insurance you'll ever buy.

---

## 7. Unit economics (will this make money?)

Example, Model A (selling leads), using the prototype's researched prices:

- You acquire a shared life lead for **~$8–15** (your own paid ads or a wholesale source).
- You sell it as **shared to 3 agents** at **$25 each = $75**, or **exclusive to 1 agent at ~$90**.
- **Gross margin per lead: $60–80.** Sell 500 leads/month → **~$30–40k gross.**

Model B (you close): a single life policy commission is often **$600–$2,000** (first-year). Even a 5% close rate on 200 worked leads = 10 policies = **$6k–20k/month** on top.

**The AI's job is to lift connect-rate and close-rate** — that's the entire moat. A 2% better close rate at scale is the whole business.

---

## 8. Your 30 / 60 / 90-day launch plan

**Days 1–30 — Foundation & first revenue (Model A)**
- Form the LLC, EIN, bank account, E&O quote.
- Buy domain, deploy the prototype, set up business email.
- Stand up Supabase (real accounts) + Stripe (real payments) + magic-link login.
- Start a pre-licensing course (for Model B later).
- Get a privacy policy + terms (Termly/Termageddon templates, then attorney review).
- **Goal:** real agents can sign up, get verified, and buy a lead with a real card.

**Days 31–60 — Real leads & verification**
- Apply for NIPR PDB API access; replace the simulated check with the real one.
- Turn on real lead intake with TrustedForm consent capture.
- Buy/generate your first 100–500 real leads; recruit 5–10 agents to buy them.
- Pass your licensing exam.

**Days 61–90 — Turn on the AI engine (compliant)**
- Wire Twilio + Vapi/Retell + ElevenLabs + the Claude-driven script.
- DNC scrubbing + opt-out handling live.
- Run the AI *only* on consented leads; AI books → you (now licensed) close.
- Measure connect-rate, appointment-rate, close-rate; feed results back into the script.
- **Goal:** the autonomous-up-to-the-sale machine is running on real, consented leads.

---

## 9. What it costs to start (realistic)

| Item | One-time | Monthly |
|---|---|---|
| LLC + EIN + registered agent | $200–600 | — |
| E&O + liability insurance | — | ~$50–125 |
| Domain | $15–60/yr | — |
| Hosting (Cloudflare/Vercel) | — | $0–20 |
| Supabase + Stripe | — | $0–25 (+ Stripe fees) |
| Business email | — | $0–6 |
| Pre-licensing + exam + license | $300–700 | — |
| Voice AI + telephony (when live) | — | usage-based, ~$0.05–0.15/min |
| Lead acquisition | — | your ad/wholesale spend |
| Attorney consult | $500–1,500 | — |
| **Realistic launch budget** | **~$1,500–3,500** | **~$150–400 + lead spend** |

You can be **legally live selling leads for under ~$2k.** The AI calling layer is usage-based, so it only costs money once it's making you money.

---

## 10. Who to call when you're stuck

- **Forming the LLC / taxes:** a local CPA or your state SoS small-business hotline.
- **Licensing:** your state **Department of Insurance** + an **IMO/FMO** (they'll hold your hand for free because they earn override commissions).
- **TCPA / lead compliance:** a telemarketing/insurance-marketing attorney (search "TCPA attorney").
- **The tech:** that's me. Come back and we build the next layer together.

---

*This packet pairs with the working prototype in `index.html`. Next build steps live in `BUILD_NOTES.md`. You've got a real shot at this — let's do it right.*
