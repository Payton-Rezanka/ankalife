<div align="center">

# ◆ AnkaLife

### AI-powered life-insurance lead platform
*A scored lead marketplace + a compliant, autonomous AI sales engine — in one place.*

`insurtech` · `lead marketplace` · `AI voice` · `purchase-intent scoring`

</div>

---

## What this is

AnkaLife is two products in one platform:

1. **Lead Marketplace** — consumers complete a short survey; the platform computes a
   **0–100 purchase-intent score (A–D tier)**, recommends **1–3 best-fit carriers**, prices
   the lead against real-market benchmarks, and sells it to **licensed agents** who are
   **verified automatically** (no manual approval) against the NIPR Producer Database.
2. **AI Sales Engine** (owner account) — an autonomous, **compliant** outbound engine that
   calls *consented* leads with a soothing, human-sounding voice, follows a script, handles
   objections, books appointments, and runs multi-touch SMS/email follow-up. A **licensed
   human binds every policy** — the AI never binds. (See [Compliance](#-compliance).)

The current build is a **single-file, dependency-free prototype** (`index.html`) that runs
in any browser and persists to `localStorage` — so you can demo the entire experience today,
then graduate to the production stack documented in [`docs/BUILD_NOTES.md`](docs/BUILD_NOTES.md).

## Quick start

```bash
# any static server works — for example:
npm run dev          # serves on http://localhost:5173
# or just open index.html directly in your browser
```

**Demo logins**
- **Owner / AI Sales Engine:** `owner@ankalife.ai` · `owner123`
- **Agent:** create one via *Agent Sign-up* (try a bad NPN like `12` to see an automated denial)

## Features

| Area | What it does |
|---|---|
| 🏷️ Lead marketplace | Filter by tier / type / state / price; shared, exclusive, live-transfer, aged |
| 📊 Purchase-intent scoring | Transparent 0–100 score + A–D tier with a per-factor breakdown |
| 🤝 Carrier matching | 1–3 best-fit carriers/products per lead (term · final expense · IUL · GUL) |
| 🛡️ Automated license check | Simulated NIPR verification — auto approve/deny with specific reasons |
| 📞 AI sales engine | Live call console that speaks aloud; objection & rebuttal playbook; call logging |
| ⚡ Campaigns | Multi-touch call/SMS/email sequences with auto opt-out (DNC) handling |
| ✉️ Magic-link onboarding | Passwordless login + a 5-step guided agent onboarding wizard |
| 📘 Founder Hub | In-app launch checklist + the full startup & build packets |

## Tech

- **Prototype:** vanilla HTML/CSS/JS, no build step, `localStorage` persistence.
- **Design:** mirrors Anthropic's `frontend-design` principles — distinctive typography
  (Fraunces + Hanken Grotesk), Phosphor icons, atmospheric gradient-mesh backgrounds,
  staggered motion. No generic AI-template aesthetics.
- **Production target** (see [`docs/BUILD_NOTES.md`](docs/BUILD_NOTES.md)): Next.js + Supabase
  (auth/DB) + Stripe (payments) + NIPR (license API) + Twilio/Vapi/Retell + ElevenLabs +
  the Claude API for the voice agent.

## Project structure

```
ankalife/
├── index.html                      # the entire working prototype
├── README.md
├── LICENSE                         # proprietary — all rights reserved
├── package.json
├── docs/
│   ├── FOUNDER_PACKET.md           # how to start the company (LLC, licensing, domain, $$)
│   └── BUILD_NOTES.md              # prototype → production (schema, AI-caller wiring)
├── AI_Calling_Playbook.docx        # printable call scripts & objection playbook
└── AnkaLife_Startup_Packet.docx    # printable startup packet
```

## Roadmap

- [x] Prototype: marketing site, survey, scoring, carrier match, marketplace, AI console
- [x] Automated (simulated) license verification with denial reasons
- [x] Magic-link onboarding wizard, objection playbook, call logging, CSV export
- [x] Distinctive frontend redesign (frontend-design principles + Phosphor icons)
- [ ] Production rebuild: Supabase auth/DB + Stripe payments
- [ ] Real NIPR PDB verification API
- [ ] Live AI caller (Twilio + Vapi/Retell + ElevenLabs + Claude) with DNC scrub & consent capture

## ⚖️ Compliance

This platform is designed to operate **within the law**, and you must too:

- **TCPA:** AI/recorded-voice calls to cell phones require **prior express written consent**
  ($500–$1,500 per violating call). The engine only calls **consented** leads.
- **DNC:** scrub the National + internal Do-Not-Call lists before every call; honor opt-outs instantly.
- **Licensing:** selling/binding life insurance requires a **licensed human producer**. The AI
  qualifies, educates, and books — it **never binds a policy**.
- Disclose the AI/recorded line; call only 8am–9pm local; retain recordings/consent records.

**This repository is software, not legal advice.** Consult a TCPA/insurance attorney and your
state Department of Insurance before going live. Full detail in
[`docs/FOUNDER_PACKET.md`](docs/FOUNDER_PACKET.md).

---

<div align="center"><sub>© 2026 AnkaLife · All rights reserved · Built as a real product, the right way.</sub></div>
