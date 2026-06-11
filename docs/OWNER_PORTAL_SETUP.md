# Set up your Owner Portal — step by step

The Owner Portal is the private side of AnkaLife (only you see it): the **AI Sales Engine**,
**Lead Intelligence** (every survey submission), **Campaigns**, and **Settings**. Agents never
see it — they only get the Buy-Leads side.

"Owner" is simply a regular account whose role is set to `owner` in the database. Here's the
reliable, no-email-needed way to create it.

---

## Step 1 — Create your login (Supabase) — ~2 min
Email links can be flaky until SMTP is finished, so we use a password (always works).

1. Go to **supabase.com** → open your **ankalife** project.
2. Left sidebar → **Authentication** → **Users**.
3. Top-right → **Add user** → **Create new user**.
4. **Email:** `ptrezankaffl@outlook.com`
5. **Password:** choose a strong one and **write it down**.
6. ✅ **Turn ON "Auto Confirm User"** ← important (skips the email step).
7. Click **Create user**. Your email now appears in the Users list.

> Already created a user earlier? Skip to Step 2. If you're not sure it has a password,
> the cleanest reset is: delete that user here, then redo steps 3–7.

## Step 2 — Make that account the Owner — ~1 min
1. Left sidebar → **SQL Editor** → **New query**.
2. Paste and **Run**:
   ```sql
   update profiles set role='owner', status='approved'
   where email='ptrezankaffl@outlook.com';
   ```
3. It should say **Success**.

## Step 3 — Verify it worked
Run this — you should see your email with `role = owner`:
```sql
select email, role, status from profiles where email='ptrezankaffl@outlook.com';
```
- ✅ `role = owner`, `status = approved` → you're set.
- ❌ No row returned → the user wasn't created in Step 1 (redo it), or you used a different email.

## Step 4 — Log in
1. Go to **https://ankalifeleads.com** (on mobile, fully close & reopen the tab to get the latest version).
2. Tap **Log in** → enter your **email + password** → **Log in**.
3. You'll land in the **Owner Portal**.

## Step 5 — Confirm you're in the right place
Your left sidebar should read:
**AI Sales Engine · Lead Intelligence · Campaigns · Lead Marketplace · Settings**
(If you instead see *Dashboard / Buy Leads / Wallet*, that's the agent side — log out and back
in once; the role refreshes on login.)

## Step 6 — Finish your owner profile
- Owner sidebar → **Settings** → enter your **NPN**, tap the **states** you're licensed in
  (teal chips), pick your **carriers**, **Save**. This syncs to the cloud.

---

## Troubleshooting
| Problem | Fix |
|---|---|
| "Invalid login credentials" | Email/password don't match Step 1, or "Auto Confirm User" was off. Re-create the user with Auto Confirm ON. |
| Logged in but on the **agent** side | Step 2 SQL didn't match your exact email. Re-run it, then log out & back in. |
| Want to use the email magic-link instead | That works once your custom SMTP (Brevo/Resend) is active. Until then, use the password login above. |

## Notes
- **Change the password** to something only you know, and keep it private.
- Per-user accounts are real and cloud-backed, so this works on any device.
- When you wire **Stripe** + finish **SMTP**, real payments and real emails turn on — your
  owner setup doesn't change.
