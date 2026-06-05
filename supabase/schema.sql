-- ============================================================
-- AnkaLife — Supabase schema
-- Run this ONCE in: Supabase dashboard → SQL Editor → New query → paste → Run
-- Safe to re-run (uses "if not exists" / "or replace").
-- ============================================================

-- 1) PROFILES — one row per signed-in user (agent or owner) -----------------
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'agent',           -- 'owner' | 'agent'
  name text, agency text, email text,
  npn text, license_state text, line_life boolean default true,
  states text[] default '{}', carriers text[] default '{}',
  status text default 'pending',                -- 'approved' | 'denied' | 'pending'
  deny_reasons text[] default '{}',
  balance integer default 0,
  prefs jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
drop policy if exists "read own profile" on profiles;
create policy "read own profile"   on profiles for select using (auth.uid() = id);
drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles for update using (auth.uid() = id);
drop policy if exists "insert own profile" on profiles;
create policy "insert own profile" on profiles for insert with check (auth.uid() = id);

-- auto-create a profile whenever a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name',''))
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- 2) LEADS — every survey submission ----------------------------------------
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  first text, last text, state text, zip text, phone text, email text,
  answers jsonb, score int, tier text, factors jsonb, recs jsonb,
  category text, type text default 'shared', days_ago int default 0, price int,
  consent jsonb, source text, status text default 'new',
  referred_by uuid, exclusive_sold_to uuid,
  created_at timestamptz default now()
);
alter table leads enable row level security;

-- Anyone (even anonymous visitors) can SUBMIT a lead from the public survey
drop policy if exists "public can submit leads" on leads;
create policy "public can submit leads" on leads for insert with check (true);

-- Owner can read every full lead (Lead Intelligence)
drop policy if exists "owner reads all leads" on leads;
create policy "owner reads all leads" on leads for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
);
-- An agent can read a FULL lead (with phone/email) only after purchasing it
drop policy if exists "buyer reads purchased lead" on leads;
create policy "buyer reads purchased lead" on leads for select using (
  exists (select 1 from purchases pu where pu.lead_id = leads.id and pu.agent_id = auth.uid())
);
-- Owner can update leads (e.g., mark sold)
drop policy if exists "owner updates leads" on leads;
create policy "owner updates leads" on leads for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
);

-- 3) MASKED MARKETPLACE VIEW — what agents browse (NO personal info) ---------
-- (Security-definer view: returns masked rows to any logged-in agent so they
--  can shop, while the real phone/email stay locked until they buy.)
create or replace view leads_market
with (security_invoker = off) as
  select id, left(coalesce(first,''),1) as first_initial,
         left(coalesce(last,''),1)  as last_initial,
         state, answers, score, tier, factors, recs, category, type,
         days_ago, price, consent->>'given' as consent_given,
         status, exclusive_sold_to, created_at
  from leads;
grant select on leads_market to anon, authenticated;

-- 4) PURCHASES — leads an agent owns ----------------------------------------
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references profiles(id) on delete cascade,
  lead_id  uuid references leads(id)    on delete cascade,
  paid int default 0, status text default 'new',
  policy jsonb, source text, bought_at timestamptz default now()
);
alter table purchases enable row level security;
drop policy if exists "agent manages own purchases" on purchases;
create policy "agent manages own purchases" on purchases
  for all using (agent_id = auth.uid()) with check (agent_id = auth.uid());

-- 5) WALLET LEDGER ----------------------------------------------------------
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references profiles(id) on delete cascade,
  type text, amt int, descr text, balance int, at timestamptz default now()
);
alter table transactions enable row level security;
drop policy if exists "agent reads own txns" on transactions;
create policy "agent reads own txns"  on transactions for select using (agent_id = auth.uid());
drop policy if exists "agent writes own txns" on transactions;
create policy "agent writes own txns" on transactions for insert with check (agent_id = auth.uid());

-- 6) PLACEMENTS — live "policy placed" social-proof feed ---------------------
create table if not exists placements (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid, state text, carrier text, category text,
  fresh_tag text, ap int, face text, at timestamptz default now()
);
alter table placements enable row level security;
drop policy if exists "anyone reads placements" on placements;
create policy "anyone reads placements" on placements for select using (true);
drop policy if exists "authed inserts placements" on placements;
create policy "authed inserts placements" on placements for insert with check (auth.role() = 'authenticated');

-- Turn on Realtime so every open browser gets the toast instantly
alter publication supabase_realtime add table placements;

-- ============================================================
-- After running: Authentication → Providers → Email = ON (magic link).
-- Then make yourself the owner once you've signed up (replace the email):
--   update profiles set role='owner', status='approved'
--   where email = 'YOUR_EMAIL_HERE';
-- ============================================================
