# Cloning YOUR voice for the AI caller

Goal: every AI call goes out in *your* voice — your tone, pace, and calm. Cloning your
**own** voice is legitimate and supported. Here's the full process.

## The big picture
3 pieces work together on a real call:
1. **Your cloned voice** (ElevenLabs) — how it *sounds* (you).
2. **The brain** (Claude API) — what it *says* (script, objections, booking).
3. **The phone line** (Twilio + Vapi or Retell) — actually dials and connects the call.

You set up #1 now. #2 and #3 are the production "AI caller" build (Edge Functions phase).
In the app, **Owner Portal → AI Sales Engine → Voice Studio** is where your voice + pace
+ calmness settings live.

## Step 1 — Record a clean sample of your voice (~15 min)
Quality of the clone = quality of your sample. Two options:

**Option A (recommended — cleanest): read a script in your natural sales tone.**
- Find a quiet room, use your phone's voice recorder or a headset mic.
- Speak the way you do on a good call — calm, warm, unhurried. Don't "perform."
- Record **2–5 minutes** for an Instant clone, or **20–30+ minutes** for a Professional
  clone (much higher fidelity — worth it).
- Sample script to read (repeat/vary for length): your real opener, a price rebuttal, a
  spouse rebuttal, and an appointment close — i.e., read the lines from your
  **Objection & Rebuttal Playbook** in the app. That trains the clone on the exact phrases
  you'll actually use.

**Option B: use your real call audio.**
- You can record your calls and use *your side* as the sample — **but** recording calls is
  legally restricted: many states require **all-party consent**. If you go this route, get
  consent and only use your own voice track. Option A avoids all of this.

**Tips:** consistent distance from the mic, no background music/TV, no echo, WAV or high-bitrate MP3.

## Step 2 — Clone it in ElevenLabs (~10 min)
1. Go to **elevenlabs.io** → create an account (free tier to test; a paid tier for
   Professional cloning + real usage).
2. Left menu → **Voices** → **Add a new voice**:
   - **Instant Voice Clone** (fast, good) — upload your 2–5 min sample.
   - **Professional Voice Clone** (best, sounds truly like you) — upload 30+ min; takes a
     few hours to train.
3. Name it "My Voice." When it's ready, open it and **copy the Voice ID** (a string like
   `21m00Tcm4TlvDq8ikWAM`).
4. In ElevenLabs' voice settings, tune for calm/steady:
   - **Stability:** higher (≈0.6–0.75) = steadier, calmer (less random emotion).
   - **Similarity:** high (≈0.8) = closer to your real timbre.
   - **Style:** low (≈0.1–0.3) = calmer, less theatrical.
   - **Speed:** slightly slow for a reassuring pace.

## Step 3 — Put it in your platform
1. Owner Portal → **AI Sales Engine → Voice Studio**.
2. Paste your **Voice ID**, set the **Pace** and **Calmness** sliders to match how you
   sound, **Save**. Use **Preview** to sanity-check pace/calm in the browser.
   *(The browser preview approximates pace/tone; your true cloned voice plays on real calls
   once the telephony layer below is wired.)*

## Step 4 — Wire it to real calls (production / Edge-Function phase)
This is the part that actually dials phones. When you're ready:
- **Telephony + orchestration:** Twilio number + **Vapi** or **Retell AI** (they manage the
  call, turn-taking, and interruptions).
- **Voice:** point the agent at your **ElevenLabs Voice ID** (via your ElevenLabs API key,
  stored as a *secret* in a Supabase Edge Function — never in the website).
- **Brain:** the Claude API runs your script + objection playbook.
- Result: outbound calls to **consented** leads, in your voice, that qualify and book
  appointments — with a licensed human closing.

## Compliance (don't skip)
- **Disclose the AI/recorded voice** at the very start of every call (FCC requires it; it
  also builds trust).
- Only call leads with **prior express written consent**; scrub **DNC** before each call;
  honor opt-outs instantly. (See `FOUNDER_PACKET.md`.)
- It's your own voice, so cloning consent is fine — just keep your ElevenLabs account
  secured (the clone is "you").
