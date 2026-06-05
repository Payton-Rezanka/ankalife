# Connecting AnkaLife to Supabase (the real backend)

This turns the demo into a **real product**: shared data across every device, real logins,
and live cross-user notifications. Follow these steps, then send me two values and I'll wire it up.

## What you do (≈15 minutes, free)

### 1. Create the project
1. Go to **https://supabase.com** → **Start your project** → sign in with GitHub or email.
2. **New project** → name it `ankalife` → set a strong **database password** (save it somewhere) → pick the region closest to you → **Create**. Wait ~2 min for it to spin up.

### 2. Create the tables
1. Left sidebar → **SQL Editor** → **New query**.
2. Open the file **`supabase/schema.sql`** in this repo, copy everything, paste it in, click **Run**. You should see "Success." (This builds all the tables + security rules.)

### 3. Turn on email login
1. Left sidebar → **Authentication** → **Providers** → make sure **Email** is **enabled** (magic links work out of the box).
2. (Optional) **Authentication → URL Configuration** → set **Site URL** to `https://ankalifeleads.com`.

### 4. Grab your two keys
1. Left sidebar → **Project Settings** (gear) → **API**.
2. Copy the **Project URL** (looks like `https://abcd1234.supabase.co`).
3. Copy the **anon / public** key (a long string labeled `anon` `public`).
   - ✅ This key is **safe to put in the website** — it only works through the security rules we set up.
   - ⛔ **NEVER** share or use the **`service_role`** key in the website — that one bypasses security. Keep it secret.

### 5. Send me both values
Paste the **Project URL** and the **anon public key** here in chat. That's all I need to wire it in.

### 6. Make yourself the owner (after you first sign in)
Once the site is connected and you sign up with your email, run this once in **SQL Editor**
(replace with your email) to unlock the Owner Portal:
```sql
update profiles set role='owner', status='approved' where email = 'you@youremail.com';
```

---

## What I do (once you send the keys)
- Add the Supabase client to the site (one script tag + your URL/key).
- Swap the data layer from browser `localStorage` to Supabase:
  - **Auth** → real signup/login + magic links (replaces the demo accounts)
  - **Leads** → the survey writes to the cloud; your shared marketplace + Lead Intelligence read from it
  - **Purchases / wallet** → persistent per agent
  - **Placements** → **Realtime**: a policy placed on any device pops the toast on everyone's screen instantly
- Keep license verification simulated for now (real NIPR + Stripe payments + real SMS/email come in the next phase via Supabase Edge Functions, which need secret keys).
- Test against your live project, then push.

## What stays for "phase 2" (needs secret server keys → Supabase Edge Functions)
- **Stripe** real payments (today the wallet is demo dollars)
- **Real NIPR** license verification (today it's the simulated check)
- **Real SMS/email** sending via Twilio/Resend (today the confirmation is shown, not sent)

These are deliberately separate because they require secret keys that must live on the server,
not in the website. We'll do them after the core backend is live.
