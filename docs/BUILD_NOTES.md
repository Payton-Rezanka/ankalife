# Aegis Life — Build Notes (prototype → production)

This is the engineering companion to `FOUNDER_PACKET.md`. It turns the single-file
`index.html` prototype into a real product. Hand this to a developer, or come back and
we'll build it together. Nothing here needs to happen all at once — ship Section 2 first.

---

## 1. Architecture at a glance

```
                ┌─────────────────────────────────────────────┐
   Consumer ───▶│  Marketing site + survey  (static, today)    │
                └───────────────┬─────────────────────────────┘
                                │ lead + CONSENT proof (TrustedForm)
                                ▼
   Agent ──▶ Auth (Supabase) ──▶  Postgres DB (Supabase)  ◀── NIPR PDB verify
                                │   accounts, leads, purchases, calls
                                ├──▶ Stripe (agents buy leads / payouts)
                                ▼
                       AI Calling Service (server)
              Twilio/Telnyx (phone) + Vapi/Retell (orchestration)
              + ElevenLabs (voice) + Claude API (the brain/script)
                                │
                                ├──▶ DNC scrub  (required before each call)
                                └──▶ SMS/email follow-up (Twilio + Resend)
```

Everything in `index.html` (scoring, recommendation, pricing, verification *logic*)
is already correct — production just swaps localStorage for the DB and the simulated
checks for real APIs.

---

## 2. Phase 1 — Real accounts, payments, hosting (do this first)

### 2a. Supabase (auth + database) — free tier is plenty to launch
Create a project at supabase.com, then run this SQL (the schema mirrors the prototype):

```sql
-- agents/owner accounts (Supabase Auth handles passwords + magic links)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'agent',          -- 'owner' | 'agent'
  name text, agency text,
  npn text, license_number text, license_state text,
  line_life boolean default true,
  states text[] default '{}', carriers text[] default '{}',
  status text default 'pending',               -- 'approved' | 'denied' | 'pending'
  deny_reasons text[], verify jsonb,
  created_at timestamptz default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  first text, last text, state text, city text, phone text, email text,
  answers jsonb,                               -- the survey object
  score int, tier text, factors jsonb,         -- scoreLead() output
  recs jsonb,                                  -- recommend() output
  type text, days_ago int, price int,
  consent jsonb,                               -- TrustedForm cert + timestamp (TCPA!)
  status text default 'new',
  exclusive_sold_to uuid,
  created_at timestamptz default now()
);

create table purchases (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references profiles(id),
  lead_id uuid references leads(id),
  paid int, status text default 'new',
  stripe_payment_intent text,
  bought_at timestamptz default now()
);

create table calls (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id),
  outcome text, duration int, transcript jsonb, recording_url text,
  at timestamptz default now()
);

-- Row Level Security: agents only see their own purchases + unlocked leads
alter table purchases enable row level security;
create policy "own purchases" on purchases for all using (agent_id = auth.uid());
```

Port the prototype's pure functions verbatim to the server: `scoreLead`, `recommend`,
`priceLead`, `verifyLicense`, `OBJECTIONS`, `buildScript`. They're framework-agnostic JS.

### 2b. Magic-link auth (the passwordless flow the prototype simulates)
Supabase Auth does this natively:
```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(URL, ANON_KEY)
// sends the real email with a one-time signed link:
await supabase.auth.signInWithOtp({ email, options:{ emailRedirectTo:'https://aegislife.com/onboard' }})
```
New users land on `/onboard` → run the same wizard → write to `profiles`.

### 2c. Stripe (agents pay for leads)
- Use **Stripe Checkout** for one-off lead purchases; **Stripe Connect** later if agencies pay out sub-agents.
- Flow: agent clicks Buy → server creates a Checkout Session for `lead.price` → on
  `checkout.session.completed` webhook, insert into `purchases` and unlock contact info.
- Never trust the client for price — recompute `priceLead(lead)` server-side.

### 2d. Deploy
- Host `index.html` (or the React/Next rebuild) on **Cloudflare Pages / Vercel** (free).
- Put the server functions (Stripe webhook, AI call trigger) on Vercel/Cloudflare Workers or Supabase Edge Functions.
- Point your domain (see Founder Packet §4). Free SSL.

---

## 3. Phase 2 — Real license verification (replace the simulation)

The prototype's `verifyLicense()` already encodes the right rules (valid NPN format,
license present, state match, life line active, no regulatory action). To make it real:

- Apply for **NIPR PDB (Producer Database) API** access at nipr.com, or use a reseller
  like **Vertafore Sircon** or **FinAPI**. They return: license status, lines of
  authority, expiration, and any regulatory actions for an NPN.
- Server pseudocode:
```js
const pdb = await niprLookup(npn)                 // real API call
const reasons = []
if (pdb.status !== 'Active')           reasons.push('License is not active per NIPR ('+pdb.status+').')
if (!pdb.lines.includes('Life'))       reasons.push('Life line of authority is not active on this license.')
if (pdb.regulatoryActions?.length)     reasons.push('An open regulatory action was found on this NPN.')
if (pdb.residentState !== app.state)   reasons.push('Resident state does not match the NIPR record.')
return { approved: reasons.length===0, reasons, source:'NIPR Producer Database', checkedAt:Date.now() }
```
Keep the friendly, specific denial messages the prototype already writes — that UX is good.

---

## 4. Phase 3 — The AI caller (the soothing, autonomous voice)

**Do NOT make a single real call until DNC scrubbing + consent capture + opt-out
handling are live. See Compliance below — this is the part with $500–$1,500/call risk.**

### Stack
- **Telephony:** Twilio or Telnyx (the phone number + the actual call).
- **Voice agent orchestration:** **Vapi**, **Retell AI**, or **Bland AI** — they manage
  latency, interruptions ("barge-in"), and turn-taking so it sounds human.
- **Voice:** **ElevenLabs** (most natural). Pick a warm, mid-pace voice; set
  `stability ~0.5`, `style ~0.3`, speaking rate ~0.95×. Cartesia is a fast alternative.
- **Brain:** **Claude API** drives the conversation using the playbook below. The
  prototype's `OBJECTIONS` and `buildScript` become Claude's system prompt + tools.

### Claude system prompt (drop-in starting point)
```
You are "Avery," a warm, calm, trustworthy life-insurance phone concierge for Aegis Life.
You are an AI on a RECORDED line; disclose this in your first 1–2 sentences.
Goal: confirm interest, qualify, handle objections, and BOOK AN APPOINTMENT with a
licensed human agent. You NEVER quote a binding price, never collect payment, and never
bind a policy — a licensed human does that. Speak in short, natural sentences.

Lead context: {{name, state, age, coverage, trigger, best_fit_product, score_tier}}

Playbook:
- Open: greet by name, disclose recorded line + AI, state why you're calling (their request),
  ask permission for 2 minutes.
- Discover: confirm who they want to protect and the coverage amount.
- Objections — acknowledge, reframe, trial-close. Library:
   PRICE → "less than a streaming subscription; rate is based on today's age" then requote range.
   SPOUSE/DELAY → "lock the quote now, bring real numbers to that conversation; set a joint call."
   TRUST → "recorded line, everything in writing, licensed human reviews; I'll text my info."
   ALREADY HAVE → "employer coverage ends when the job does and is usually too small; find the gap."
   TOO YOUNG → "youth+health = lowest rate you'll ever get; lock it in."
   BUSY → "90 seconds; or schedule a firm callback."
- Close: offer two appointment times. Confirm. Trigger SMS+email confirmation.
- Stop immediately and flag DO-NOT-CALL on any opt-out ("stop", "remove me", "don't call").
Tone: soothing, unhurried, never pushy. If they're not interested, thank them and end warmly.
```

Give Claude tools: `book_appointment(time)`, `send_sms(template)`, `mark_dnc()`,
`log_outcome(outcome)`. The orchestrator (Vapi/Retell) streams Claude's text to ElevenLabs.

### Cost
~$0.05–0.15/min all-in (telephony + voice + LLM). Usage-based — it only costs money
once it's working leads that make you money.

---

## 5. Phase 4 — Multi-touch follow-up (the Campaigns page, made real)

- Sequences as DB rows: `{trigger, steps:[{channel, delay, template}]}`.
- A scheduler (cron / Supabase pg_cron / a queue) fires each step.
- **Channels:** Twilio (SMS), Resend or SendGrid (email).
- Every message includes opt-out; any opt-out writes to a suppression table consulted
  before *every* future send/call. This is the prototype's "auto-DNC" made real.

---

## 6. Compliance — wire these BEFORE the first real call

| Requirement | Implementation |
|---|---|
| Prior express **written** consent | Capture TrustedForm/Jornaya cert on the survey; store in `leads.consent`. |
| DNC scrub | Call DNC.com / Contact Center Compliance API before each dial; block if listed. |
| AI disclosure | First lines of the Claude prompt (already included). |
| Instant opt-out | `mark_dnc()` tool + suppression table checked everywhere. |
| Calling hours | Gate the dialer to 8am–9pm in the lead's timezone (derive from state/zip). |
| Licensed human binds | AI books an appointment only; a licensed producer completes the sale. |
| Recordings & records | Store recording_url + transcript in `calls`; retain 4–5 years. |
| Privacy/terms | Publish privacy policy + terms (GLBA/CCPA); link in footer. |

---

## 7. Suggested rebuild (when you outgrow the single file)

- **Next.js + Tailwind** front-end (port the existing views/components 1:1).
- **Supabase** (auth, Postgres, storage, edge functions).
- **Stripe** payments. **Claude API** for scoring explanations + the caller.
- **Vapi/Retell + Twilio + ElevenLabs** for voice.
- Keep the prototype as the living spec — it already defines every screen and rule.

The hard thinking (scoring model, recommendation logic, pricing, objection playbook,
denial UX, onboarding flow) is **done** and proven in the prototype. Production is
mostly plumbing from here.
