# Stripe setup — accept payments & get paid

Goal: agents click "Buy" → get redirected to **Stripe's secure checkout** → pay → come back
and the lead unlocks with full client info. Stripe also emails them a receipt automatically.

There are two halves: **(A) what you do** (create the account, add your bank, get keys) and
**(B) what I build** (the redirect + unlock). You can't be charged for a lead until A is done.

---

## A. What YOU do in Stripe

### 1. Create the account (~5 min)
- Go to **stripe.com** → **Sign up** → email, name, password → verify your email.

### 2. Activate payments / business profile (required to accept real money)
Dashboard → **Activate** (or "Complete your profile"). You'll provide:
- **Business type:** Individual / Sole proprietor, or Company (LLC). (If you formed an LLC, choose Company.)
- **Legal name + address**, and **EIN** (company) or **SSN** (sole prop) — Stripe is legally required to verify identity (KYC).
- **Industry / product description:** "Life-insurance lead marketplace."
- **Business website:** `https://ankalifeleads.com`
- **Representative details** (you) for identity verification.

### 3. Add your bank account (so you get paid out)
- **Settings → Business → Bank accounts** (or **Balance → Payouts**) → add your **routing + account number**.
- Set a **payout schedule** (daily, weekly, or monthly). Stripe deposits your sales there automatically (minus its fee — ~2.9% + 30¢ per charge).

### 4. Get your API keys
- **Developers → API keys.** You'll see:
  - **Publishable key** — `pk_test_…` (test) and `pk_live_…` (live). Safe for the website.
  - **Secret key** — `sk_test_…` / `sk_live_…`. ⛔ SECRET — never in the website or chat.
- **Start in TEST mode** (toggle in the dashboard) so we can test with fake cards first.

### 5. Turn on receipt emails
- **Settings → Customer emails → "Successful payments"** = ON. Now Stripe emails every buyer a receipt automatically.

### 6. Send me (only) these
- Your **test Publishable key** (`pk_test_…`) — safe to paste.
- Put your **test Secret key** into Supabase as an Edge-Function secret yourself (instructions below) — don't paste it in chat.

---

## B. What I build (once your keys exist)

1. **Supabase Edge Function `create-checkout`** — receives the lead(s) + price, creates a
   **Stripe Checkout Session**, returns the URL.
2. The site does `window.location = session.url` → agent lands on **Stripe's hosted, PCI-compliant
   checkout** → pays.
3. **Success URL** brings them back to AnkaLife (e.g., `/?paid=ORDER`).
4. **Webhook Edge Function `stripe-webhook`** verifies the `checkout.session.completed` event
   (using a signing secret) → writes the purchase + **unlocks the lead's full contact info** in
   the database. (Webhook = the trustworthy "did they really pay?" confirmation.)
5. Stripe emails the receipt automatically (Step A5).

**Secrets you'll set in Supabase** (Project → Edge Functions → Secrets):
`STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. These live server-side only.

### Test → Live
- Test with card **4242 4242 4242 4242**, any future expiry, any CVC/ZIP.
- When it works end-to-end, swap test keys for **live** keys and you're accepting real money.

---

## Order of operations to go live
1. You: Stripe account + bank + activate + test keys (Section A).
2. Me: build + deploy the two Edge Functions + wire the redirect (Section B).
3. Both: test a purchase with the 4242 card.
4. You: flip Stripe to **live** keys.
5. Me: take the site out of "demo" labeling → **launch**.
