# AnkaLife — Broker Model + Data Services

*Spec addendum, June 16 2026. Covers the no-inventory broker model (built) and the three
compliant "scrape leads for them" services (provider-pluggable). Pairs with
`LEAD_ENGINE_SPEC.md`.*

---

## 1. The broker model (no inventory, take a %) — BUILT

You don't hold inventory or front your own capital. The agent pays first; we use *their*
payment to buy the lead from a vendor and keep the spread.

```
 Agent clicks "Source a lead — $35"
        │
        ▼
 Stripe charges the agent $35  ──────────────►  money in YOUR account
        │
        ▼  (payment verified)
 Backend calls your VENDOR API  ──►  buys a fresh consented lead (e.g. costs $15)
        │
        ▼
 Lead delivered to the agent's My Leads · Order records amount $35 · cost $15 · margin $20
```

### What's already built
- **"Source a fresh lead" widget** in the live marketplace: agent picks state, vertical, and
  exclusivity → pays via Stripe (`kind:'source'`).
- **Auto-buy on payment:** `vendorBuy_()` posts to your vendor and inserts the returned lead.
- **Margin tracking:** every `Orders` row now records `amount`, `cost`, and **`margin`** (your take).
- **SIMULATE mode:** with `VENDOR_POST_URL = SIMULATE` (the default), it returns a fake
  consented lead so you can test the entire flow **before** you have a vendor.

### Connecting a real vendor (the one part that needs *you*)
"Auto from a vendor API" needs a lead supplier that sells on demand — usually a **ping-post**
vendor or aggregator (e.g. Boberdoo-powered sellers, Phonexa, LeadsHook publishers, or a
direct publisher who exposes a POST endpoint). Once you have one, set these in the `Config` tab:

| Config key | What to put |
|---|---|
| `VENDOR_POST_URL` | the vendor's purchase/post URL (replace `SIMULATE`) |
| `VENDOR_AUTH` | your API key, e.g. `Bearer abc123` (sent as the Authorization header) |
| `VENDOR_FIELD_MAP` | JSON mapping their field names to ours, e.g. `{"phone":"phone_number","consent_cert":"trusted_form_cert_url"}` |
| `SOURCE_PRICE` | what the agent pays per sourced lead |
| `MARGIN_TARGET_PERCENT` | your target markup (for your own pricing math) |

The adapter expects the vendor to return JSON with at least a phone/email and ideally a
**TrustedForm cert**. If the vendor can't be reached, the order is flagged
`needs_fulfillment` (the agent already paid) so you can source it manually and not lose the sale.

### ⚠️ Broker liability — read this
Reselling someone else's leads puts you **in the TCPA chain**. Only broker from vendors who
**pass a real consent certificate** with each lead. A sourced lead that arrives without a cert
is stored as `PENDING-NO-CERT` and is automatically **unsellable/uncallable** until you have
proof. Get a signed agreement from each vendor that (a) their leads are consented and (b) you're
permitted to resell them.

---

## 2. The three "scrape leads for them" services

You chose all three. These are **separate, sellable products** — each is fully legal when
pointed at the right targets. Each needs one **data provider** plugged in (the only blocker),
and each can launch in a **manual** form day one (agent orders + pays → you fulfill → deliver)
before automating. None of them is "scrape consumer call-lists and resell," which stays off the
table for the reasons we've covered.

### 2a. B2B prospecting lists  ✅ lowest risk
- **What:** find business owners, realtors, mortgage brokers, CPAs, etc. for partnerships,
  referrals, and B2B outreach.
- **Provider:** **Apollo** (paid plan unlocks the search API) and/or **Apify** actors on public
  directories. You already have both connectors.
- **Delivery:** agent specifies a target (title + location + industry) → you pull + enrich →
  deliver a CSV to their My Leads / email.
- **Compliance:** standard B2B; follow CAN-SPAM for email. Clean.

### 2b. Enrich / skip-trace the agent's OWN leads  ✅ low risk
- **What:** agent uploads leads they **already own** (with consent) → you append phone, email,
  property/mortgage data, age, etc.
- **Provider:** a skip-trace/enrichment API (e.g. data-append providers; Apify for public-record
  enrichment). The agent owns the compliance basis since they sourced the contacts.
- **Delivery:** CSV upload → enriched CSV back.
- **Compliance:** the agent attests they have consent/relationship; you enrich, you don't originate.

### 2c. Public-records marketing lists  ⚠️ sold with a warning
- **What:** new homeowners, movers, new-business filings, life-event triggers from **public records**.
- **Provider:** public-records data vendors or Apify actors over public sources (county deeds,
  business registrations).
- **Delivery:** filtered list → CSV.
- **Compliance:** legal to **compile**, but **calling/texting still requires DNC scrubbing and TCPA
  care** — these are marketing lists, not consented leads. Every delivery carries a written notice
  that the agent is responsible for DNC + consent before dialing. (This is the higher-risk product;
  price it accordingly and keep the disclaimer.)

### How these get built (the pattern, when you're ready)
All three reuse the broker plumbing: a Stripe `kind:'service'` order → on payment, run the
provider (Apollo/Apify/enrichment) or queue for manual fulfillment → deliver a CSV + record
margin. **Pick a provider per service** and I'll wire them one at a time — B2B (Apollo/Apify) is
the natural first since your connectors are already attached.

---

## 3. Build status

| Piece | Status |
|---|---|
| Broker "Source a lead" UI + Stripe charge | ✅ built |
| Auto-buy vendor adapter + SIMULATE + margin tracking | ✅ built (needs your vendor URL to go live) |
| B2B prospecting service | ⏳ specced — wire Apollo/Apify next |
| Enrichment / skip-trace service | ⏳ specced — needs an enrichment provider |
| Public-records lists service | ⏳ specced — needs a public-records provider + disclaimer |

Next natural step: connect a **real lead vendor** (so Source-a-lead goes live) and build the
**B2B prospecting** service first (your Apollo/Apify connectors are already in place).
