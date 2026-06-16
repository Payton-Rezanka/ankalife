# AnkaLife Lead Engine — Setup (≈30 minutes, no coding)

This connects **ankalifeleads.com** to a **Google Sheet** (your database) and **Stripe**
(real payments). You'll click buttons and paste a few keys — you won't write code.

> ## 🧪 Want to TEST the whole platform first — no setup, no accounts?
> Add **`?sandbox=1`** to your site URL: **`https://ankalifeleads.com/?sandbox=1`**
> Sandbox mode runs a complete **fake backend in your browser** so you can click through
> *everything* — sign up as an agent, verify a license (use NPN `1234567` + any state),
> buy leads, buy bundles/packages, **source a lead** (broker), fill out the survey, and
> (log in as owner `owner@ankalife.ai` / `owner123`) use **Cold Lists** + watch a contact
> convert. No money moves, nothing saves to a real database. Turn it off with `?sandbox=0`.
> **This is how you test today.** Do the real setup below when you're ready to take live payments.

You need three free accounts: **Google**, **Stripe**, and your existing site.

---

## Part 1 — Create the Sheet + backend (10 min)

1. Go to **sheets.google.com** → **Blank spreadsheet**. Name it `AnkaLife – Leads`.
2. Top menu → **Extensions ▸ Apps Script**. A code editor opens in a new tab.
3. Delete the little `function myFunction(){}` that's there.
4. Open **`Code.gs`** from this folder, **copy ALL of it**, and paste it into the editor.
5. Click the **💾 Save** icon.
6. In the toolbar, make sure the function dropdown says **`setup`**, then click **▶ Run**.
   - Google will ask permission ("…wants to access your Google Account"). Click
     **Review permissions ▸ pick your account ▸ Advanced ▸ Go to (project) ▸ Allow.**
     *(This is normal — it's your own script asking to edit your own sheet.)*
7. Go back to the spreadsheet tab. You'll now see tabs: **Leads, Agents, Orders,
   Bundles, Suppression** — pre-filled with 3 sample bundles and 5 sample leads.
   ✅ That's Phase 0 done — your data model is live.

---

## Part 2 — Get your Stripe keys (5 min)

1. Sign up / log in at **dashboard.stripe.com**. Leave it in **Test mode** (toggle, top-right)
   for now — test mode uses fake cards so you can practice safely.
2. Left menu → **Developers ▸ API keys**.
3. Copy the **Secret key** (starts with `sk_test_…`).
4. In your spreadsheet: right-click any tab ▸ **Show ▸ Config** (it's hidden).
   In the `Config` tab, find the `STRIPE_SECRET_KEY` row and **paste your key** over
   `sk_test_PASTE_YOURS`.
5. (Optional) Edit `SUCCESS_URL` / `CANCEL_URL` if your domain differs. Defaults are fine.
6. Re-hide Config: right-click the Config tab ▸ **Hide sheet** (keeps your key out of sight).

---

## Part 3 — Publish the backend as a Web App (5 min)

1. Back in the **Apps Script** editor → top-right **Deploy ▸ New deployment**.
2. Click the **⚙ gear ▸ Web app**.
3. Set:
   - **Description:** `AnkaLife backend`
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**  ← required so the website can reach it
4. Click **Deploy** → authorize if asked → **copy the Web app URL**
   (looks like `https://script.google.com/macros/s/AKfy…/exec`).
   **Save this URL** — you'll paste it into the website in Part 4.

> 🔁 **Whenever you change `Code.gs` later**, you must **Deploy ▸ Manage deployments ▸
> ✏️ Edit ▸ Version: New version ▸ Deploy** for changes to go live. (Editing Config-tab
> values does NOT need a redeploy.)

**Quick test:** paste your Web app URL into a browser and add `?action=inventory` at the
end. You should see your 5 sample leads as text (contact info shown as
"unlocks on purchase"). If you see that, the backend works. 🎉

---

## Part 4 — Connect the website (handled in code)

The website (`index.html`) has a config block near the top:

```js
const ANKA = {
  BACKEND_URL: '',          // ← paste your Web app URL from Part 3 here
  ENABLED: false            // ← set to true to use real Stripe checkout
};
```

Paste your Web app URL into `BACKEND_URL` and set `ENABLED: true`, then save and
re-publish the site. (If you leave `ENABLED: false`, the site stays in safe demo mode.)

*Claude wires this block and the buy buttons for you in the next step — you'll just paste
the one URL.*

---

## Part 5 — Take a test payment 🧪

1. Open ankalifeleads.com, sign in as an agent, go to the marketplace. **First time:** you'll see a **license verification** form — enter any valid-format NPN (4–10 digits, e.g. `1234567`) + a resident state to unlock buying. *(This is the simulated NIPR check; swap in the real NIPR API later per `BUILD_NOTES.md` §3.)* Then click **Buy** on a lead — or open **Packages** to buy a volume/vertical bundle.
2. You'll land on Stripe's real checkout page. Use Stripe's **test card**:
   `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.
3. After paying, Stripe returns you to the site; the lead's phone/email unlock, and a row
   appears in your **Orders** tab. The lead's `times_sold` ticks up (and flips to `sold`
   at the 3rd shared sale or 1st exclusive sale).

That's a full real purchase, in test mode. ✅

---

## Part 6 — Go live (when ready)

1. In Stripe, finish account activation (business details + bank account).
2. Flip Stripe to **Live mode**, copy the **live** secret key (`sk_live_…`), paste it into
   the `Config` tab over the test key.
3. Real cards now charge for real. Keep using test mode until you've practiced.

> ⚠️ **Before selling real consumer leads:** every lead row needs a real `consent_cert`
> (TrustedForm) — see `docs/LEAD_ENGINE_SPEC.md` §4 and the compliance checklist in
> `docs/FOUNDER_PACKET.md`. The sample leads are marked `SAMPLE-no-cert` and are for
> testing the money flow only — don't sell or call them.

---

## Part 7 — Turn on your lead funnel (generate your own inventory)

Your survey is the funnel. In live mode, every survey submission writes a **scored,
consented lead** straight into your `Leads` tab — no vendor, $0 per lead.

1. **TrustedForm (consent proof — required to actually sell).** Sign up at
   **trustedform.com** (ActiveProspect). It gives you a script that records a **consent
   certificate** each time someone submits the survey. The site already loads TrustedForm
   automatically in live mode and captures the certificate URL.
2. **The consent rule (built in):** a lead with a real certificate is sellable; a lead with
   **no** certificate is saved as `PENDING-NO-CERT` and is **automatically hidden from the
   marketplace** — you can't sell or call it. This protects you under TCPA. (To manually
   clear a lead for sale, put a value in its `consent_cert` cell.)
3. **Drive traffic:** point Facebook/Google ads at `ankalifeleads.com/` → *Fill out Survey*.
   Each submission becomes inventory you can sell to your verified agents.

> The seeded sample leads use `SAMPLE-no-cert` so you can test selling immediately. **Delete
> them before you go live** — never sell a lead without a real consent certificate.

---

## Part 8 — Broker mode: sell leads you don't own yet (optional)

This lets agents buy a **"Source a fresh lead"** — they pay first, the system auto-buys it from
your vendor, and you keep the margin. **No inventory, no fronting your own money.**

- It's **on by default in SIMULATE mode** — try it now: in the live marketplace, use the
  *Source a fresh lead* box, pick a state, and check out. A test lead appears in My Leads and a
  row lands in **Orders** with `amount`, `cost`, and **`margin`** columns.
- To go live for real, you need a **lead vendor that sells on demand** (a ping-post supplier).
  Once you have one, open the `Config` tab and set: `VENDOR_POST_URL` (their URL),
  `VENDOR_AUTH` (your API key), `VENDOR_FIELD_MAP` (field-name mapping), and `SOURCE_PRICE`.
  Full detail: `docs/BROKER_AND_SERVICES.md`.
- **Only broker from vendors who pass a consent certificate.** Sourced leads without one are
  stored as `PENDING-NO-CERT` and stay unsellable until proven.

---

## Cheat sheet

| Thing | Where |
|---|---|
| Your database | the Google Sheet (5 tabs) |
| Your secret Stripe key | `Config` tab (hidden) |
| Your backend URL | Apps Script ▸ Deploy ▸ Manage deployments |
| Add/seed bundles | edit the `Bundles` tab |
| Stop selling a lead | set its `status` to `sold`, or add phone/email to `Suppression` |
| See sales | the `Orders` tab |

Stuck on any step? Tell Claude which part number and what you see.
