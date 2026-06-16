/**
 * AnkaLife — Lead Engine backend (Google Apps Script)
 * ===================================================
 * This script turns your Google Sheet into the live backend for ankalifeleads.com:
 *   • stores Leads / Agents / Orders / Bundles / Suppression (the 5 tabs)
 *   • serves available inventory to the website  (doGet ?action=inventory)
 *   • creates real Stripe Checkout sessions       (doPost action=createCheckout)
 *   • fulfills the order when Stripe confirms payment (Stripe webhook -> doPost)
 *
 * IT IS SAFE TO READ THIS EVEN IF YOU'RE NON-TECHNICAL — the setup guide
 * (SETUP.md) tells you exactly which 3 buttons to click. You won't edit code.
 *
 * Pricing is ALWAYS computed/looked-up on the server (this script). The website
 * never tells us the price — that's what stops someone editing the page to pay $1.
 */

/* ============================ CONFIG ============================ *
 * Real secrets (Stripe keys, the cap) live in the hidden "Config" tab,
 * NOT in this code, so you can paste them without touching the script. */
const SHEET = SpreadsheetApp.getActiveSpreadsheet();
const TZ = SHEET.getSpreadsheetTimeZone();

const TABS = {
  leads:       'Leads',
  agents:      'Agents',
  orders:      'Orders',
  bundles:     'Bundles',
  suppression: 'Suppression',
  config:      'Config'
};

const HEADERS = {
  leads:       ['id','created_at','first','last','state','city','phone','email','type','category','score','tier','price','consent_cert','status','sold_to','times_sold','source'],
  agents:      ['id','created_at','name','agency','email','npn','license_state','verify_status','states','balance','total_spent'],
  orders:      ['id','created_at','agent_email','kind','lead_ids','bundle_id','qty','amount','stripe_id','status'],
  bundles:     ['id','name','qty','tier_filter','type_filter','price','price_per_lead','active'],
  suppression: ['phone_or_email','reason','added_at'],
  config:      ['key','value']
};

/* Default per-lead prices by intent tier — mirrors index.html EXCL_PRICE.
 * The server trusts the price stored ON the lead row; these are only used
 * when seeding sample leads and as a fallback. */
const EXCL_PRICE   = { A: 33, B: 25, C: 18, D: 12 };
const SHARED_PRICE = { A: 20, B: 15, C: 11, D: 8 };   // each of up to 3 agents pays this

/* Package catalog — AUTHORITATIVE copy of index.html's PACKAGES + pricing.
 * Prices are recomputed here on every checkout so the browser can't alter them.
 * Keep these formulas identical to the front-end so displayed price == charged price. */
const VOLUME_MIN = 15, AGED_MIN = 25, AGED_PER_LEAD = 2.20;
const PACKS = {
  starter:  { id:'starter',  kind:'volume',   name:'Starter Pack',  mix:{A:0.10,B:0.20,C:0.40,D:0.30} },
  producer: { id:'producer', kind:'volume',   name:'Producer Pack', mix:{A:0.25,B:0.35,C:0.25,D:0.15} },
  elite:    { id:'elite',    kind:'volume',   name:'Elite Pack',    mix:{A:0.60,B:0.30,C:0.10,D:0.00} },
  fe:       { id:'fe',       kind:'category', name:'Final Expense Pack', category:'Final Expense', count:15, price:300 },
  vet:      { id:'vet',      kind:'category', name:'Veteran Pack',       category:'Veteran',       count:15, price:280 },
  mixed:    { id:'mixed',    kind:'mixed',    name:'Mixed Book', mix:[{category:'Final Expense',count:10},{category:'Veteran',count:5},{category:'Term Life',count:5}], price:399 },
  aged:     { id:'aged',     kind:'agedvol',  name:'Aged Leads' }
};
function findPack_(id){ return PACKS[String(id)] || null; }
function blendedPerLead_(mix){ return EXCL_PRICE.A*mix.A + EXCL_PRICE.B*mix.B + EXCL_PRICE.C*mix.C + EXCL_PRICE.D*mix.D; }
function volumeDiscount_(qty){ return qty>=50?0.25 : qty>=30?0.18 : 0.10; }
function agedDiscount_(qty){ return qty>=250?0.45 : qty>=100?0.37 : qty>=50?0.28 : 0.10; }
function packQty_(pack, qty){
  if (pack.kind==='volume')  return Math.max(VOLUME_MIN, Number(qty)||VOLUME_MIN);
  if (pack.kind==='agedvol') return Math.max(AGED_MIN, Number(qty)||AGED_MIN);
  if (pack.kind==='mixed')   return pack.mix.reduce((s,m)=>s+m.count,0);
  return pack.count; // category
}
function packPrice_(pack, qty){
  if (pack.kind==='volume')  return Math.max(1, Math.round(qty * blendedPerLead_(pack.mix) * (1-volumeDiscount_(qty))));
  if (pack.kind==='agedvol') return Math.max(1, Math.round(qty * AGED_PER_LEAD * (1-agedDiscount_(qty))));
  return pack.price; // category, mixed = fixed
}
/* Select leads that satisfy a pack's spec (honoring tier mix / category / aged). */
function packMatches_(pack, qty){
  const all = objects_('leads').filter(l => l.id && isSellable_(l));
  if (pack.kind==='agedvol')  return all.filter(l => l.type==='aged').slice(0, qty);
  if (pack.kind==='category') return all.filter(l => l.type!=='aged' && l.category===pack.category).slice(0, qty);
  if (pack.kind==='mixed') {
    let out = [];
    pack.mix.forEach(m => { out = out.concat(all.filter(l => l.type!=='aged' && l.category===m.category && out.indexOf(l)===-1).slice(0, m.count)); });
    return out;
  }
  // volume: honor tier proportions, then top up from any fresh lead
  const fresh = all.filter(l => l.type!=='aged');
  let out = [];
  ['A','B','C','D'].forEach(t => {
    const want = Math.round(qty * (pack.mix[t]||0));
    out = out.concat(fresh.filter(l => String(l.tier).toUpperCase()===t && out.indexOf(l)===-1).slice(0, want));
  });
  if (out.length < qty) out = out.concat(fresh.filter(l => out.indexOf(l)===-1).slice(0, qty-out.length));
  return out.slice(0, qty);
}

/* ===================== ONE-TIME SETUP ===================== *
 * Run this ONCE from the Apps Script editor (Run ▸ setup).
 * Creates every tab, headers, default Config, sample bundles, and a few
 * sample sellable leads so you can test a real (test-mode) purchase today. */
function setup() {
  Object.keys(TABS).forEach(key => {
    const name = TABS[key];
    let sh = SHEET.getSheetByName(name);
    if (!sh) sh = SHEET.insertSheet(name);
    // (Re)write header row only if empty — never clobbers existing data.
    if (sh.getLastRow() === 0) {
      sh.appendRow(HEADERS[key]);
      sh.getRange(1, 1, 1, HEADERS[key].length).setFontWeight('bold').setBackground('#f0eee9');
      sh.setFrozenRows(1);
    }
  });

  // Hide the Config tab from casual view (it holds your Stripe secret).
  const cfg = SHEET.getSheetByName(TABS.config);
  seedConfig_(cfg);
  cfg.hideSheet();

  seedBundles_();
  seedSampleLeads_();

  SpreadsheetApp.getUi().alert(
    'AnkaLife backend ready ✅\n\n' +
    'Tabs created: Leads, Agents, Orders, Bundles, Suppression (+ hidden Config).\n' +
    'Next: open the Config tab (right-click any tab ▸ Show) and paste your Stripe ' +
    'keys, then Deploy ▸ New deployment ▸ Web app. See SETUP.md.'
  );
}

function seedConfig_(cfg) {
  if (cfg.getLastRow() > 1) return; // already configured — leave it alone
  const defaults = [
    ['STRIPE_SECRET_KEY',     'sk_test_PASTE_YOURS'],
    ['CURRENCY',              'usd'],
    ['SHARED_CAP',            '3'],
    ['SUCCESS_URL',           'https://ankalifeleads.com/?paid=1'],
    ['CANCEL_URL',            'https://ankalifeleads.com/?canceled=1']
  ];
  cfg.getRange(2, 1, defaults.length, 2).setValues(defaults);
}

function seedBundles_() {
  const sh = SHEET.getSheetByName(TABS.bundles);
  if (sh.getLastRow() > 1) return;
  const rows = [
    // id,        name,           qty, tier_filter, type_filter, price, price_per_lead, active
    ['starter10', 'Starter 10',    10, 'A,B',  'shared',    200,  20.0,  true],
    ['pro25',     'Pro 25',        25, 'any',  'shared',    437,  17.5,  true],
    ['excl10',    'Exclusive 10',  10, 'A',    'exclusive', 750,  75.0,  true]
  ];
  sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

/* A handful of ready-to-sell sample leads so you can run a real test purchase
 * end-to-end immediately. Delete these once your funnel produces real leads. */
function seedSampleLeads_() {
  const sh = SHEET.getSheetByName(TABS.leads);
  if (sh.getLastRow() > 1) return;
  const now = new Date();
  const samples = [
    ['Maria','Reyes','TX','Houston','(555) 240-1188','maria.demo@example.com','shared','Final Expense','A'],
    ['Robert','Johnson','FL','Tampa','(555) 511-9043','robert.demo@example.com','exclusive','Term Life','A'],
    ['Latisha','Brooks','GA','Atlanta','(555) 332-7781','latisha.demo@example.com','shared','Mortgage Protection','B'],
    ['David','Nguyen','CA','Fresno','(555) 778-2210','david.demo@example.com','exclusive','IUL / Wealth','B'],
    ['Susan','Walker','NY','Buffalo','(555) 904-5567','susan.demo@example.com','shared','Senior / Medicare','C']
  ];
  const rows = samples.map((s, i) => {
    const tier = s[8];
    const type = s[6];
    const price = (type === 'shared' ? SHARED_PRICE : EXCL_PRICE)[tier];
    return [
      'L' + (1000 + i), now, s[0], s[1], s[2], s[3], s[4], s[5], type, s[7],
      tierScore_(tier), tier, price, 'SAMPLE-no-cert', 'new', '', 0, 'Sample data'
    ];
  });
  sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}
function tierScore_(t){ return ({A:92,B:78,C:62,D:45})[t] || 60; }

/* ===================== WEB APP: READ ===================== *
 * GET /exec?action=inventory  -> available leads (contact info MASKED)
 * GET /exec?action=bundles    -> active bundles
 * GET /exec?action=ping       -> health check
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'ping';
  try {
    if (action === 'inventory') return json_({ ok: true, leads: availableLeads_() });
    if (action === 'bundles')   return json_({ ok: true, bundles: activeBundles_() });
    if (action === 'myleads')   return json_({ ok: true, leads: myLeadsFor_(String((e.parameter.email || '')).toLowerCase()) });
    if (action === 'agent')     return json_({ ok: true, agent: agentStatus_(String((e.parameter.email || '')).toLowerCase()) });
    if (action === 'confirm')   return confirmReturn_(e);   // Stripe sends the buyer here after payment
    return json_({ ok: true, service: 'AnkaLife Lead Engine', ts: String(now_()) });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* PRIMARY fulfillment path: Stripe returns the buyer to this URL with the
 * session id. We ask Stripe (server-side, with the secret key) whether it was
 * actually paid, fulfill if so, then bounce the buyer to the real site. No
 * webhook secret or header-reading needed — the secret-keyed API call IS the proof. */
function confirmReturn_(e) {
  const sid = e.parameter.session_id || '';
  const site = cfg_('SUCCESS_URL') || 'https://ankalifeleads.com/?paid=1';
  let ok = false;
  try {
    const s = stripeRetrieveSession_(sid);
    if (s && s.payment_status === 'paid') {
      fulfillOrder_(s.metadata || {}, s.amount_total || 0, s.id); // idempotent
      ok = true;
    }
  } catch (err) { /* fall through to a friendly page */ }
  const dest = site + (site.indexOf('?') === -1 ? '?' : '&') + (ok ? 'fulfilled=1' : 'pending=1');
  return HtmlService.createHtmlOutput(
    '<!doctype html><meta http-equiv="refresh" content="1;url=' + dest + '">' +
    '<body style="font-family:system-ui;text-align:center;margin-top:18vh;color:#2b2b2b">' +
    '<h2>' + (ok ? 'Payment confirmed ✅' : 'Finishing up…') + '</h2>' +
    '<p>Returning you to AnkaLife… <a href="' + dest + '">click here</a> if it doesn\'t.</p></body>'
  );
}

/* ===================== WEB APP: WRITE ===================== *
 * The website POSTs {action:'createCheckout', ...} and gets back a Stripe URL.
 * Actual fulfillment happens later in confirmReturn_ (doGet), after Stripe
 * confirms the payment — so money is always verified before any lead unlocks.
 */
function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.action === 'createCheckout') return json_(createCheckout_(body));
    if (body.action === 'verifyAgent')    return json_(verifyAgent_(body));
    if (body.action === 'createLead')     return json_(createLead_(body));
    return json_({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* ---- Create a Stripe Checkout Session (price computed here, server-side) ---- */
function createCheckout_(body) {
  const agentEmail = String(body.agentEmail || '').trim().toLowerCase();
  if (!agentEmail) return { ok: false, error: 'Agent email required.' };

  // Gate: only NIPR-verified producers may buy leads.
  const gate = requireVerifiedAgent_(agentEmail);
  if (!gate.ok) return gate;

  let lineName, amountCents, metadata;

  if (body.kind === 'single') {
    const lead = findLead_(body.leadId);
    if (!lead) return { ok: false, error: 'Lead not found.' };
    if (!isSellable_(lead)) return { ok: false, error: 'This lead is no longer available.' };
    lineName = 'AnkaLife lead ' + lead.id + ' (' + lead.tier + '-tier ' + lead.category + ')';
    amountCents = Math.round(Number(lead.price) * 100);
    metadata = { kind: 'single', lead_ids: lead.id, agent_email: agentEmail };

  } else if (body.kind === 'bundle') {
    const b = findBundle_(body.bundleId);
    if (!b) return { ok: false, error: 'Bundle not found.' };
    const matches = matchingLeads_(b);
    if (matches.length < b.qty) {
      return { ok: false, error: 'Only ' + matches.length + ' matching leads in stock (need ' + b.qty + '). Try a smaller bundle.' };
    }
    lineName = 'AnkaLife ' + b.name + ' (' + b.qty + ' ' + b.type_filter + ' leads)';
    amountCents = Math.round(Number(b.price) * 100);
    metadata = { kind: 'bundle', bundle_id: b.id, qty: String(b.qty), agent_email: agentEmail };

  } else if (body.kind === 'pack') {
    const pack = findPack_(body.packId);
    if (!pack) return { ok: false, error: 'Package not found.' };
    const qty = packQty_(pack, body.qty);
    const matches = packMatches_(pack, qty);
    if (matches.length < qty) {
      return { ok: false, error: 'Only ' + matches.length + ' matching leads in stock (need ' + qty + '). Add inventory or choose a smaller quantity.' };
    }
    const price = packPrice_(pack, qty);
    lineName = 'AnkaLife ' + pack.name + ' (' + qty + ' leads)';
    amountCents = Math.round(price * 100);
    metadata = { kind: 'pack', pack_id: pack.id, qty: String(qty), agent_email: agentEmail };

  } else {
    return { ok: false, error: 'kind must be "single", "bundle", or "pack".' };
  }

  const session = stripeCheckout_(lineName, amountCents, agentEmail, metadata);
  if (!session.url) return { ok: false, error: 'Stripe error: ' + (session.error || 'unknown') };
  return { ok: true, url: session.url };
}

/* ---- Funnel intake: a consumer survey submission becomes a sellable lead ---- *
 * Called by the website on survey submit. Price is computed HERE from tier+type
 * (never trusted from the client). Stores the TrustedForm consent certificate —
 * leads without a real cert are flagged PENDING-NO-CERT and must not be sold/called. */
function createLead_(b) {
  const required = ['first', 'last', 'state', 'phone', 'email'];
  for (var i = 0; i < required.length; i++) {
    if (!String(b[required[i]] || '').trim()) return { ok: false, error: 'Missing field: ' + required[i] };
  }
  const tier = String(b.tier || 'C').toUpperCase();
  const type = (String(b.type || 'shared') === 'exclusive') ? 'exclusive' : 'shared';
  const price = (type === 'shared' ? SHARED_PRICE : EXCL_PRICE)[tier] || EXCL_PRICE.C;
  const id = 'L' + Utilities.getUuid().slice(0, 8);
  appendRow_(TABS.leads, {
    id: id, created_at: now_(), first: b.first, last: b.last, state: b.state, city: b.city || '',
    phone: b.phone, email: b.email, type: type, category: b.category || 'Term Life',
    score: Number(b.score) || tierScore_(tier), tier: tier, price: price,
    consent_cert: String(b.consent_cert || '').trim() || 'PENDING-NO-CERT',
    status: 'new', sold_to: '', times_sold: 0, source: b.source || 'Web opt-in survey'
  });
  return { ok: true, id: id, price: price };
}

/* ---- payment confirmed -> assign leads, write the order ---- */
function fulfillOrder_(meta, amountTotal, stripeId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000); // prevents two buyers grabbing the same lead at once
  try {
    if (orderExists_(stripeId)) return; // idempotent — Stripe may retry the webhook
    const agentEmail = meta.agent_email || '';
    let leadIds = [];

    if (meta.kind === 'single') {
      const lead = findLead_(meta.lead_ids);
      if (lead && isSellable_(lead)) { assignLead_(lead, agentEmail); leadIds = [lead.id]; }

    } else if (meta.kind === 'bundle') {
      const b = findBundle_(meta.bundle_id);
      const need = Number(meta.qty || (b && b.qty) || 0);
      const matches = matchingLeads_(b).slice(0, need);
      matches.forEach(l => assignLead_(l, agentEmail));
      leadIds = matches.map(l => l.id);

    } else if (meta.kind === 'pack') {
      const pack = findPack_(meta.pack_id);
      const need = Number(meta.qty || 0);
      const matches = packMatches_(pack, need).slice(0, need);
      matches.forEach(l => assignLead_(l, agentEmail));
      leadIds = matches.map(l => l.id);
    }

    appendRow_(TABS.orders, {
      id: 'O' + Utilities.getUuid().slice(0, 8),
      created_at: now_(),
      agent_email: agentEmail,
      kind: meta.kind,
      lead_ids: leadIds.join(','),
      bundle_id: meta.bundle_id || meta.pack_id || '',
      qty: leadIds.length,
      amount: (amountTotal / 100).toFixed(2),
      stripe_id: stripeId,
      status: 'fulfilled'
    });
    bumpAgentSpend_(agentEmail, amountTotal / 100);
  } finally {
    lock.releaseLock();
  }
}

/* ===================== DATA HELPERS ===================== */
function sheetData_(key) {
  const sh = SHEET.getSheetByName(TABS[key]);
  const values = sh.getDataRange().getValues();
  const head = values.shift() || [];
  return { sh, head, rows: values };
}
function objects_(key) {
  const { head, rows } = sheetData_(key);
  return rows.map((r, i) => {
    const o = { _row: i + 2 };
    head.forEach((h, c) => o[h] = r[c]);
    return o;
  });
}
function suppressionSet_() {
  const set = {};
  objects_('suppression').forEach(o => { if (o.phone_or_email) set[String(o.phone_or_email).toLowerCase()] = true; });
  return set;
}
function isSuppressed_(lead, sup) {
  return sup[String(lead.phone).toLowerCase()] || sup[String(lead.email).toLowerCase()];
}
function isSellable_(lead) {
  const cap = sharedCap_();
  const sup = suppressionSet_();
  if (isSuppressed_(lead, sup)) return false;
  if (!hasConsent_(lead)) return false;          // no consent proof on file → never sellable (TCPA)
  if (lead.type === 'exclusive') return String(lead.status) !== 'sold' && !lead.sold_to;
  // shared: available until it has been sold to `cap` agents
  return Number(lead.times_sold || 0) < cap;
}
/* A lead is consented if it has a certificate value that isn't the PENDING placeholder.
 * Real TrustedForm cert URLs and the seeded SAMPLE marker pass; PENDING-NO-CERT fails. */
function hasConsent_(lead) {
  const c = String(lead.consent_cert || '').trim();
  return c !== '' && c.toUpperCase().indexOf('PENDING') !== 0;
}
function availableLeads_() {
  const sup = suppressionSet_();
  return objects_('leads')
    .filter(l => l.id && !isSuppressed_(l, sup) && isSellable_(l))
    .map(maskLead_);
}
function maskLead_(l) {
  return {
    id: l.id, state: l.state, city: l.city, type: l.type, category: l.category,
    score: l.score, tier: l.tier, price: l.price,
    phone: '(unlocks on purchase)', email: '(unlocks on purchase)'
  };
}
function findLead_(id) { return objects_('leads').find(l => String(l.id) === String(id)); }

/* Leads a given agent has purchased — contact info UNMASKED (they paid for it). */
function myLeadsFor_(email) {
  if (!email) return [];
  const orders = objects_('orders').filter(o =>
    String(o.agent_email || '').toLowerCase() === email && String(o.status) === 'fulfilled');
  const boughtAt = {};
  orders.forEach(o => String(o.lead_ids || '').split(',').filter(String).forEach(id => {
    if (!boughtAt[id]) boughtAt[id] = o.created_at;
  }));
  const ids = Object.keys(boughtAt);
  if (!ids.length) return [];
  return objects_('leads').filter(l => l.id && ids.indexOf(String(l.id)) !== -1).map(l => ({
    id: l.id, first: l.first, last: l.last, state: l.state, city: l.city,
    phone: l.phone, email: l.email, type: l.type, category: l.category,
    score: l.score, tier: l.tier, price: l.price, status: l.status, bought_at: boughtAt[l.id]
  }));
}
function matchingLeads_(b) {
  if (!b) return [];
  const tiers = String(b.tier_filter || 'any').toLowerCase() === 'any'
    ? null : String(b.tier_filter).split(',').map(s => s.trim().toUpperCase());
  return objects_('leads').filter(l => {
    if (!l.id || !isSellable_(l)) return false;
    if (b.type_filter && b.type_filter !== 'any' && l.type !== b.type_filter) return false;
    if (tiers && tiers.indexOf(String(l.tier).toUpperCase()) === -1) return false;
    return true;
  });
}
function assignLead_(lead, agentEmail) {
  const sh = SHEET.getSheetByName(TABS.leads);
  const head = HEADERS.leads;
  const row = lead._row;
  const times = Number(lead.times_sold || 0) + 1;
  setCell_(sh, row, head, 'times_sold', times);
  if (lead.type === 'exclusive' || times >= sharedCap_()) {
    setCell_(sh, row, head, 'status', 'sold');
  }
  // record buyer(s): comma-joined for shared, single for exclusive
  const prior = String(lead.sold_to || '');
  setCell_(sh, row, head, 'sold_to', prior ? prior + ',' + agentEmail : agentEmail);
}
function findBundle_(id) { return objects_('bundles').find(b => String(b.id) === String(id) && b.active !== false); }
function activeBundles_() { return objects_('bundles').filter(b => b.active !== false).map(b => ({
  id: b.id, name: b.name, qty: b.qty, tier_filter: b.tier_filter, type_filter: b.type_filter,
  price: b.price, price_per_lead: b.price_per_lead, in_stock: matchingLeads_(b).length
})); }
function orderExists_(stripeId) { return objects_('orders').some(o => o.stripe_id === stripeId); }
function bumpAgentSpend_(email, amt) {
  const a = getAgent_(email);
  if (!a) {
    appendRow_(TABS.agents, { id: 'A' + Utilities.getUuid().slice(0,8), created_at: now_(),
      email: email, verify_status: 'unverified', balance: 0, total_spent: amt });
    return;
  }
  setCell_(SHEET.getSheetByName(TABS.agents), a._row, HEADERS.agents, 'total_spent', Number(a.total_spent || 0) + amt);
}

/* ---------- Agents & license verification ---------- */
function getAgent_(email) {
  return objects_('agents').find(a => String(a.email || '').toLowerCase() === String(email).toLowerCase());
}
function agentStatus_(email) {
  const a = getAgent_(email);
  if (!a) return null;
  return { email: a.email, name: a.name, agency: a.agency, verify_status: a.verify_status,
           license_state: a.license_state, states: a.states };
}
function requireVerifiedAgent_(email) {
  const a = getAgent_(email);
  if (!a || String(a.verify_status) !== 'approved') {
    return { ok: false, error: 'verify_required',
      message: 'Your producer license must be verified before purchasing leads. Please complete license verification.' };
  }
  return { ok: true };
}
/* Simulated NIPR Producer Database check — mirrors index.html verifyLicense() rules.
 * Replace the rule block with a real NIPR PDB API call per BUILD_NOTES.md §3. */
function verifyAgent_(body) {
  const email = String(body.email || '').trim().toLowerCase();
  if (!email) return { ok: false, error: 'Email required.' };
  const npn = String(body.npn || '').trim();
  const reasons = [];
  if (!/^\d{4,10}$/.test(npn))   reasons.push('National Producer Number (NPN) must be a 4–10 digit number per the NIPR Producer Database.');
  if (!body.license_state)       reasons.push('A resident license state is required to locate the producer record.');
  if (body.line_life === false)  reasons.push('An active Life line of authority is required to buy life leads.');
  const approved = reasons.length === 0;
  upsertAgent_({
    email: email, name: body.name || '', agency: body.agency || '', npn: npn,
    license_state: body.license_state || '',
    states: Array.isArray(body.states) ? body.states.join(',') : (body.states || ''),
    verify_status: approved ? 'approved' : 'denied'
  });
  return { ok: true, approved: approved, reasons: reasons, source: 'NIPR Producer Database (simulated)' };
}
function upsertAgent_(fields) {
  const a = getAgent_(fields.email);
  const sh = SHEET.getSheetByName(TABS.agents);
  if (a) {
    Object.keys(fields).forEach(k => {
      if (HEADERS.agents.indexOf(k) !== -1) setCell_(sh, a._row, HEADERS.agents, k, fields[k]);
    });
    return a;
  }
  appendRow_(TABS.agents, Object.assign(
    { id: 'A' + Utilities.getUuid().slice(0,8), created_at: now_(), balance: 0, total_spent: 0 }, fields));
}

/* ---- low-level sheet writes ---- */
function appendRow_(tabName, obj) {
  const sh = SHEET.getSheetByName(tabName);
  const head = HEADERS[Object.keys(TABS).find(k => TABS[k] === tabName)];
  sh.appendRow(head.map(h => (h in obj ? obj[h] : '')));
}
function setCell_(sh, row, head, col, val) { sh.getRange(row, head.indexOf(col) + 1).setValue(val); }

/* ---- config accessors ---- */
function cfg_(key) {
  const o = objects_('config').find(c => c.key === key);
  return o ? String(o.value) : '';
}
function sharedCap_() { return Number(cfg_('SHARED_CAP') || 3); }
function now_() { return Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm:ss"); }

/* ===================== STRIPE ===================== */
function stripeCheckout_(name, amountCents, email, metadata) {
  const secret = cfg_('STRIPE_SECRET_KEY');
  const currency = cfg_('CURRENCY') || 'usd';
  // Send the buyer back through THIS web app so we can verify payment & fulfill.
  const selfUrl = ScriptApp.getService().getUrl();
  const params = {
    'mode': 'payment',
    'success_url': selfUrl + '?action=confirm&session_id={CHECKOUT_SESSION_ID}',
    'cancel_url': cfg_('CANCEL_URL') || 'https://ankalifeleads.com/?canceled=1',
    'customer_email': email,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': currency,
    'line_items[0][price_data][unit_amount]': String(amountCents),
    'line_items[0][price_data][product_data][name]': name
  };
  Object.keys(metadata).forEach(k => { params['metadata[' + k + ']'] = String(metadata[k]); });

  const res = UrlFetchApp.fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'post',
    headers: { Authorization: 'Bearer ' + secret },
    payload: params,
    muteHttpExceptions: true
  });
  const data = JSON.parse(res.getContentText());
  if (data.error) return { error: data.error.message };
  return { url: data.url, id: data.id };
}

/* Ask Stripe whether a checkout session was actually paid (proof of payment). */
function stripeRetrieveSession_(sessionId) {
  if (!sessionId) return null;
  const secret = cfg_('STRIPE_SECRET_KEY');
  const res = UrlFetchApp.fetch('https://api.stripe.com/v1/checkout/sessions/' + encodeURIComponent(sessionId), {
    method: 'get',
    headers: { Authorization: 'Bearer ' + secret },
    muteHttpExceptions: true
  });
  const data = JSON.parse(res.getContentText());
  return data.error ? null : data;
}

/* ===================== util ===================== */
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
