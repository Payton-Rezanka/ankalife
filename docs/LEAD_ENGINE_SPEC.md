# AnkaLife — Lead Engine & Marketplace Spec
### How leads get *in*, and how agents *buy* them on ankalifeleads.com
*Draft spec — June 16, 2026. Pairs with `FOUNDER_PACKET.md` (business) and `BUILD_NOTES.md` (production stack). This document covers the one layer those two don't: sourcing inventory and selling it.*

---

## 0. The decision that defines everything: where leads come from

You said you want to **"scrape insurance leads instead of using a 3rd party."** Here is the honest version, because this single choice is the whole legal and business risk:

| Approach | Legal? | Worth anything? | Verdict |
|---|---|---|---|
| **Scrape consumers** (phone/email lists, "people who might want insurance") and sell them as leads | ❌ No TCPA consent → $500–$1,500 per call your agents make | ❌ Near-zero close rate — the person never asked | **Don't.** It's the thing that gets you and your buyers sued. |
| **Be your own source**: run your own opt-in funnel (ad → landing page → survey → consent) | ✅ TrustedForm consent captured at submit | ✅ Real intent — this is what agents pay $25–90 for | **This is "instead of a 3rd party."** You become the source. |
| **Wholesale top-up**: buy surplus leads from a reputable aggregator while your funnel ramps | ✅ If the vendor passes consent certs | ⚠️ Lower margin, but fills inventory on day one | Bridge only, until your funnel produces. |

**So the spec below treats "the lead engine" as YOUR opt-in funnel** — that is literally how you stop paying a third party: you replace them, you don't scrape around them. The Apify/Apollo connectors you uploaded are still valuable — they get pointed at **the agents who buy leads** (§5), which is fully legitimate B2B prospecting.

> If you take one thing from this doc: **scraping is for finding *buyers* (agents), not for manufacturing *inventory* (consumer leads).**

---

## 1. Architecture (with your choices baked in)

Your answers: sell on **ankalifeleads.com**, store everything in **Google Sheets**, sell **per-lead + in bundles**.

```
   CONSUMER SIDE (makes inventory)              AGENT SIDE (buys inventory)
   ─────────────────────────────               ──────────────────────────
   Facebook/Google ad                          Agent lands on ankalifeleads.com
        │                                            │
        ▼                                            ▼
   Landing page + survey  (on ankalifeleads.com)   Browse leads (tier/state/type/price)
        │  + TrustedForm consent cert                │
        ▼                                            ▼
   Score + tier + carrier match                  Buy 1 lead  OR  buy a bundle (10/25/50)
        │  (existing index.html logic)               │
        ▼                                            ▼
   ┌──────────────────────────────────────────────────────────┐
   │   GOOGLE SHEETS  =  the system of record (your database)  │
   │   Tabs: Leads · Agents · Orders · Bundles · Suppression   │
   └──────────────────────────────────────────────────────────┘
        │                                            │
        ▼                                            ▼
   Apify/Apollo → find AGENTS to recruit        Stripe → take payment, unlock contact info
```

Everything the prototype already computes (score, tier, carrier match, price) stays — Google Sheets just becomes where it's saved instead of `localStorage`.

> **Note on Google Sheets:** it's a great *starting* backend — free, you can see/edit every row yourself, and it connects to the site easily. It will comfortably handle the first few thousand leads and orders. When you outgrow it (concurrent buyers racing for the same lead, thousands of rows), the `BUILD_NOTES.md` Supabase schema is the drop-in upgrade — same columns, real database. We design the Sheets so that migration is a copy-paste later.

---

## 2. The Google Sheets data model

One spreadsheet, five tabs. Columns map 1:1 to the Supabase schema in `BUILD_NOTES.md` so nothing is wasted.

**`Leads` tab** — your inventory
| id | created_at | first | last | state | city | phone | email | type | score | tier | factors | recs | price | consent_cert | status | sold_to | times_sold |
|----|-----------|-------|------|-------|------|-------|-------|------|-------|------|--------|------|-------|--------------|--------|---------|-----------|

- `type` = shared / exclusive / live-transfer / aged
- `status` = new → sold (exclusive) or stays available until `times_sold` hits the cap (shared)
- `consent_cert` = TrustedForm URL — **a row with no cert never gets sold or called**

**`Agents` tab** — your buyers
| id | created_at | name | agency | email | npn | license_state | verify_status | states | balance | total_spent |

**`Orders` tab** — every purchase (per-lead and bundle)
| id | created_at | agent_id | kind | lead_ids | bundle_id | qty | amount | stripe_id | status |

- `kind` = single / bundle

**`Bundles` tab** — your packaged offers
| id | name | qty | tier_filter | type_filter | price | price_per_lead | active |

Example rows: `Starter 10 · A/B tier · shared · $200 ($20/ea)` · `Pro 25 · any · shared · $437 ($17.50/ea)` · `Exclusive 10 · A tier · exclusive · $750 ($75/ea)`.

**`Suppression` tab** — opt-outs / DNC (checked before any contact)
| phone_or_email | reason | added_at |

---

## 3. Selling on ankalifeleads.com (per-lead + bundles)

### 3a. What an agent sees
The marketplace view already exists in `index.html`. We wire its **Buy** buttons to real money:

1. Agent browses available leads (filtered to states they're licensed in).
2. **Buy single:** clicks Buy on one lead → Stripe Checkout for `lead.price` → on success, that lead's phone/email unlock and a row is written to `Orders`.
3. **Buy bundle:** picks a bundle (e.g. *Starter 10*) → Stripe Checkout for the bundle price → on success, the system reserves N matching leads (by `tier_filter`/`type_filter`), assigns them to the agent, writes one `Orders` row with all `lead_ids`.

### 3b. The rules that protect you (server-side, never trust the browser)
- **Price is recomputed server-side** from `priceLead()` — the client can't tweak it.
- **Shared leads** sell to a max of N agents (e.g. 3), then flip to `sold`. **Exclusive** sells once.
- **No double-sell:** a bundle reserves leads atomically before charging, so two agents can't grab the same lead. *(This race is the main reason you'll eventually outgrow Sheets — it's solvable in Sheets with a lock cell, clean in Supabase.)*
- **Verified agents only:** `verify_status = approved` (NIPR) before any purchase unlocks contact info.

### 3c. The plumbing
- A small serverless function (Cloudflare Worker / Vercel function — free tier) sits between the site and Sheets:
  - reads inventory from Sheets via the Google Sheets API,
  - creates Stripe Checkout sessions,
  - listens for Stripe's `checkout.session.completed` webhook, then writes the `Orders` row and unlocks the lead.
- Google Sheets API auth = one service account (a JSON key), shared to the sheet. No per-user Google login needed.

---

## 4. The lead engine (your own opt-in funnel = "instead of a 3rd party")

This is the part that replaces the vendor. Four pieces:

1. **Traffic:** Facebook/Instagram + Google ads → "Free life insurance quote in 60 seconds." Budget-controlled; start at $20–50/day to test.
2. **Landing + survey:** lives on ankalifeleads.com (the survey already exists in `index.html`). Add the **TrustedForm script** so every submit captures a consent certificate — this is the legal heartbeat of the whole business.
3. **Score & store:** existing `scoreLead()`/`recommend()`/`priceLead()` run on submit → write a row to the `Leads` tab with the consent cert.
4. **Sell or work it:** the lead is now inventory (sell to agents, §3) or fuel for the AI engine later (`BUILD_NOTES.md` §4).

**Economics (from your Founder Packet):** self-generated lead costs ~$8–15 in ad spend, sells for $25 (shared ×3 = $75) or ~$90 (exclusive). That spread is the business — and it only exists because *you own the funnel*. A scraped list has no consent, no intent, and negative value (lawsuit risk).

---

## 5. Where Apify + Apollo actually earn their keep: finding agents to sell to

Legitimate, and it's how you get your first 10 paying buyers without waiting on inbound:

- **Apollo** (once on a paid plan — the free plan blocks the search API, we confirmed): pull licensed life-insurance **agents / agency owners** by title + location + company size. Enrich emails. Import to the `Agents` tab as `prospect`.
- **Apify**: scrape **public agent directories** and **state DOI / NIPR license lookups** (public records) for agent contact info — clean source, no Apollo-ToS issue.
- Then a simple outreach sequence ("I've got scored, consented life leads in your state — want 10 free to test?"). Free trial leads are the fastest way to convert agents into buyers.

This is the *only* scraping in the plan, and it's pointed at businesses (agents), not consumers.

---

## 6. Build phases (what we actually do, in order)

| Phase | What ships | You can... | Effort |
|---|---|---|---|
| **0. Wire the sheet** | Create the 5-tab spreadsheet + service account | See your data model live | ~1 hr |
| **1. Sell existing demo leads** | Connect site Buy buttons → Stripe → Orders tab; build bundles | Take a real payment for a lead | ~1–2 days |
| **2. Turn on the funnel** | TrustedForm on the survey; survey submit → Leads tab w/ consent | Generate your own consented inventory | ~1–2 days |
| **3. Recruit agents** | Apollo/Apify pull → Agents tab → outreach | Get your first paying buyers | ongoing |
| **4. Scale / migrate** | Move Sheets → Supabase when volume demands | Handle concurrent buyers safely | later |

The AI calling engine (`BUILD_NOTES.md` §4) bolts on after Phase 2, since it needs consented leads to call.

---

## 7. Costs to run this layer

| Item | Cost |
|---|---|
| Google Sheets + API | $0 |
| Cloudflare Worker / Vercel function | $0 (free tier) |
| Stripe | $0 + 2.9%+30¢ per sale |
| TrustedForm consent certs | ~$0.10–0.30 per cert |
| Apollo (to unlock search API) | ~$49–99/mo when ready |
| Apify | pay-per-run, a few $/1000 records |
| Ad spend (the lead engine) | your call — start $20–50/day |

You can stand up Phases 0–1 for **$0** and test selling before spending a dollar on ads.

---

## 8. Open decisions (need your call before I build Phase 1)

1. **Lead source for launch:** start with *your own funnel only* (compliant, ~2-week ramp), or *also* plug in a wholesale vendor to have inventory on day one?
2. **Bundle pricing:** use my example tiers (Starter 10 / Pro 25 / Exclusive 10) or set your own numbers?
3. **Shared-lead cap:** how many agents can buy the same shared lead — 3 is standard?
4. **Hosting for the payment function:** Cloudflare or Vercel? (Either is free; Cloudflare is simplest if your domain DNS is already there.)
5. **Apollo upgrade:** open to the ~$49–99/mo paid plan so the agent-finding can be automated, or keep it manual/free for now?

---

*Next step after you answer §8: I build Phase 0 (the spreadsheet + schema) and Phase 1 (real checkout), so you can take a live payment for a lead on ankalifeleads.com.*
