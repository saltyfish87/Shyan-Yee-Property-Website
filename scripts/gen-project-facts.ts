/**
 * Turn the project database into the real facts the project page shows.
 *
 * Source:  the project database Google Sheet (95 projects, one row each, with key_features,
 *          amenities, facilities and the developer's own description). It is the published copy of
 *          what ctg-agent extracts from the sales kits, so it works from any machine and stays current.
 * Output:  src/data/projectFacts.generated.ts
 *
 * The project page used to render six generic "key features" and nine hard-coded facilities that were
 * identical on all 74 projects. This file replaces them with what the developer actually published.
 *
 * Run: npx tsx scripts/gen-project-facts.ts
 *   FACTS_SHEET_CSV  overrides the sheet URL
 *   FACTS_CSV_FILE   reads a local CSV instead (offline)
 * If the sheet cannot be reached the committed output is kept, so a deploy never wipes the data.
 */
import fs from 'fs';
import path from 'path';
import os from 'os';

const SHEET_CSV = process.env.FACTS_SHEET_CSV
  || 'https://docs.google.com/spreadsheets/d/1fa-DbbFmkN1QUdVZ6-D4Sd6350pS5irYpPtH5ldgeuM/export?format=csv&gid=0';
const ROOT = process.cwd();
const OUT = path.join(ROOT, 'src', 'data', 'projectFacts.generated.ts');
const PROJECTS = path.join(ROOT, 'src', 'projectsFallback.json');

export interface ProjectFacts {
  source: string;
  /** The developer's own write-up, as published in the database. */
  description?: { en?: string; zh?: string };
  keyFeatures: string[];
  facilities: string[];
  nearby: { category: string; name: string; distance?: string }[];
}

/**
 * Names differ between the website and the database ("Vox" vs "Vox Residence @ Sentul"), so compare a
 * stripped form: no punctuation, no leading "the", and without the filler words that get added or
 * dropped at will ("Residences", "Suites", "Tower").
 */
function norm(s: string): string {
  const t = (s || '').toLowerCase().replace(/[–—]/g, '-').replace(/[’']/g, '')
    .replace(/\b(the|residensi|at|@)\b/g, ' ')
    .replace(/\b(residences?|suites?|apartments?|condominiums?|towers?|phase)\b/g, ' ');
  return t.replace(/[^a-z0-9]/g, '');
}

/** Pairs the stripped-name rule cannot make, checked by hand against the database. */
const MANUAL_ALIASES: Record<string, string> = {
  'bangsar-hill-park-tower-b-and-c': 'Bangsar Hill Park (Phase 2 - TALISA)',
  'bangsar-hill-park-verdura-tower-d-and-e': 'Bangsar Hill Park (Phase 1 - VERDURA)',
  'vox': 'Vox Residence @ Sentul',
  'zenia-damansara': 'Zenia @ ParkCity Damansara',
  'aurum-business': 'Aurum Suites'
};

/**
 * The database sheet fills key_features and amenities for every project but facilities for only about
 * half, so top the facilities up from the sales kits on the agent's Mac when they are there.
 */
const CTG_DIR = process.env.CTG_DIR || path.join(os.homedir(), 'ctg-agent', 'data', 'incoming');
function localFacilities(): Map<string, string> {
  const map = new Map<string, string>();
  if (!fs.existsSync(CTG_DIR)) return map;
  for (const dir of fs.readdirSync(CTG_DIR)) {
    const file = path.join(CTG_DIR, dir, 'result.json');
    if (dir.startsWith('.') || /\.bak_/i.test(dir) || !fs.existsSync(file)) continue;
    let r: any;
    try { r = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { continue; }
    const fac = String(r.facilities || '');
    if (fac.length < 20) continue;
    for (const key of [norm(String(r.project_name || '')), norm(dir)]) if (key && !map.has(key)) map.set(key, fac);
  }
  return map;
}

const clean = (s: any) => (typeof s === 'string' ? s : s == null ? '' : String(s)).replace(/\s+/g, ' ').trim();
const splitList = (s: string): string[] => (s || '').split(/\s*\|\s*|\n+/).map(x => x.trim()).filter(Boolean);

/**
 * Sales kits carry notes written for the agent — advertising rules, penalties, banned words. Those are
 * internal and must never reach a public page, so anything that reads like a rule is dropped.
 */
const INTERNAL_NOTE = /(COMPLIANCE|DO NOT|NOT ALLOWED|not allowed|penalt|offence|offense|rebate|cashback|nett\s*price|\bGRR\b|zero\s*downpayment|early\s*bird|below\s*market|discount|approval\s*prior|prior\s*approval|commission|marketing\s*material|advertis|social\s*media)/i;

/** The write-up as the database holds it, with any agent-only note cut off the end. */
function parseDescription(v: any): string {
  const t = String(v || '')
    .replace(/\[COMPLIANCE:[\s\S]*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t || t.length < 40 || INTERNAL_NOTE.test(t)) return '';
  return t;
}

function parseKeyFeatures(v: any): string[] {
  return splitList(String(v || '').replace(/\s*;\s*/g, '|'))
    .map(x => x.replace(/\[COMPLIANCE:[\s\S]*$/i, '').replace(/[[\]]/g, '').replace(/\.$/, '').trim())
    .filter(x => x && x.length <= 180 && !INTERNAL_NOTE.test(x))
    .slice(0, 10);
}

/** "Podium: Infinity Pool, Pool Deck | Level 8: Gym" or "Gym | Pool" -> a flat list of facility names. */
function parseFacilities(s: string): string[] {
  const out: string[] = [];
  // Some rows carry a Python-style list ("facilities: ['Guard house', 'Bike Lane']"); unwrap it
  // before splitting, or every quote ends up inside a facility name.
  const listy = s.match(/^\s*(?:[a-z_ ]+:\s*)?\[(.+)\]\s*$/is)
    || s.match(/(?:^|\|)\s*[a-z_ ]*facilities\s*:\s*\[(.+?)\]/is);
  const source = listy
    ? listy[1].split(/'\s*,\s*'|"\s*,\s*"/).map(x => x.replace(/^[\s'"]+|[\s'"]+$/g, '')).join(' | ')
    : s;
  for (const chunk of splitList(source)) {
    const m = chunk.match(/^([^:]{2,40}):\s*(.+)$/);
    for (const it of (m ? m[2].split(/\s*,\s*/) : [chunk])) {
      // Rows written as "facilities: ['Guard house', 'Bike Lane']" leave quotes and brackets
      // glued to the first and last item; strip them off every item rather than the whole string.
      const t = it.trim()
        .replace(/^[a-z_ ]*(?:facilities|items|list|amenities)\s*:\s*/i, '')
        .replace(/^[\s'"\[]+|[\s'"\]]+$/g, '')
        .replace(/\.$/, '')
        .replace(/\s*\(space only\)$/i, '');
      if (t && t.length <= 60 && !INTERNAL_NOTE.test(t) && !out.some(o => o.toLowerCase() === t.toLowerCase())) out.push(t);
    }
  }
  return out.slice(0, 40);
}

/**
 * Four shapes appear in the amenities column, so each is read on its own terms:
 *   "Highways: A, B(1.5km) | Education: C(3.9km)"          category followed by a comma list
 *   "category: Malls, places: [{'name': 'A', 'distance_km': 0.05}, ...]"   the pipeline's dict form
 *   "Shopping Mall - Starhill Gallery | Landmark - KL Tower (2.4km)"       one place per pipe
 *   "LRT Awan Besar station (900m walk) | Pavilion Bukit Jalil"            plain names
 * Anything with no category of its own is filed under "Nearby".
 */
function parseNearby(s: string): ProjectFacts['nearby'] {
  const raw = String(s || '').trim();
  if (!raw) return [];
  const out: ProjectFacts['nearby'] = [];
  const push = (category: string, name: string, distance?: string) => {
    const n = name.replace(/^[\s'"\[{]+|[\s'"\]}]+$/g, '').replace(/\.$/, '').trim();
    if (!n || n.length > 70 || INTERNAL_NOTE.test(n)) return;
    if (out.some(o => o.name.toLowerCase() === n.toLowerCase() && o.category === category)) return;
    out.push(distance ? { category, name: n, distance } : { category, name: n });
  };
  /** "Pavilion Bukit Jalil(3.5km)" and "station (900m walk)" both carry the distance in brackets. */
  const split = (category: string, text: string) => {
    for (const part of splitOutsideBrackets(text)) {
      const m = part.match(/^(.*?)\s*\(([^()]*(?:km|m|min|walk)[^()]*)\)\s*$/i);
      if (m) push(category, m[1], m[2].trim()); else push(category, part);
    }
  };

  // The dict form: split on the "category:" keys, then read each {name, distance_km} object.
  if (/places\s*:\s*\[/i.test(raw) || /\bcategory\s*:/i.test(raw)) {
    for (const group of raw.split(/\|(?=\s*category\s*:)/i)) {
      const head = group.match(/category\s*:\s*([^,]+),/i);
      const cat = head ? head[1].trim() : 'Nearby';
      const body = group.slice(group.indexOf('[') + 1);
      const objects = body.match(/\{[^}]*\}/g);
      if (objects) {
        for (const o of objects) {
          const name = (o.match(/['"]name['"]\s*:\s*['"]([^'"]+)['"]/) || [])[1];
          const km = (o.match(/['"]distance_km['"]\s*:\s*([\d.]+)/) || [])[1];
          if (name) push(cat, name, km ? `${km} km` : undefined);
        }
      } else {
        split(cat, body.replace(/\]\s*$/, ''));
      }
    }
    return out.slice(0, 40);
  }

  for (const chunk of splitList(raw)) {
    // "Highways: A, B" — a category with its own comma list.
    const colon = chunk.match(/^([A-Za-z][A-Za-z&/ ]{2,28}):\s*(.+)$/);
    if (colon && /,/.test(colon[2])) { split(colon[1].trim(), colon[2]); continue; }
    // "Shopping Mall - Starhill Gallery" — one place, category in front.
    const dash = chunk.match(/^([A-Za-z][A-Za-z&/ ]{2,28})\s+-\s+(.+)$/);
    if (dash) { split(dash[1].trim(), dash[2]); continue; }
    if (colon) { split(colon[1].trim(), colon[2]); continue; }
    split('Nearby', chunk);
  }
  return out.slice(0, 40);
}

/** Split on commas that are not inside brackets, so "SJK(C) Lai Meng(3.8km)" stays whole. */
function splitOutsideBrackets(text: string): string[] {
  const parts: string[] = [];
  let depth = 0, cur = '';
  for (const ch of text) {
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts.map(x => x.trim()).filter(Boolean);
}

/** Minimal CSV reader: the sheet has quoted fields with commas and newlines inside them. */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift() || [];
  return rows.filter(r => r.some(c => c.trim())).map(r => {
    const o: Record<string, string> = {};
    head.forEach((h, i) => { o[h.trim()] = r[i] ?? ''; });
    return o;
  });
}

const moduleText = (out: Record<string, ProjectFacts>) => `// GENERATED by scripts/gen-project-facts.ts from the project database sheet — do not edit by hand.
// Real key features, facilities and nearby places per project, keyed by the id in projectsFallback.json.

export interface ProjectFacts {
  source: string;
  /** The developer's own write-up, as published in the database. */
  description?: { en?: string; zh?: string };
  keyFeatures: string[];
  facilities: string[];
  nearby: { category: string; name: string; distance?: string }[];
}

export const PROJECT_FACTS: Record<string, ProjectFacts> = ${JSON.stringify(out, null, 1)};
`;

async function loadRows(): Promise<Record<string, string>[] | null> {
  if (process.env.FACTS_CSV_FILE) return parseCsv(fs.readFileSync(process.env.FACTS_CSV_FILE, 'utf8'));
  try {
    const res = await fetch(SHEET_CSV, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseCsv(await res.text());
  } catch (e: any) {
    console.warn(`[gen-project-facts] could not read the database sheet: ${e.message || e}`);
    return null;
  }
}

async function main() {
  const rows = await loadRows();
  if (!rows || !rows.length) {
    // A deploy without network access must not wipe the data the site is serving.
    if (fs.existsSync(OUT)) { console.log('[gen-project-facts] keeping the committed file.'); return; }
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, moduleText({}), 'utf8');
    return;
  }

  const byName = new Map<string, Record<string, string>>();
  for (const r of rows) {
    const k = norm(r.project_name);
    if (k && !byName.has(k)) byName.set(k, r);
  }

  const projects: any[] = (() => {
    const d = JSON.parse(fs.readFileSync(PROJECTS, 'utf8'));
    return Array.isArray(d) ? d : d.projects || [];
  })();

  const localFac = localFacilities();
  // The deploy server has no sales-kit folder, so a plain rebuild there would drop every facilities
  // list that was filled in from the Mac. Start from what is already committed and only ever add.
  const previous: Record<string, ProjectFacts> = (() => {
    try {
      const txt = fs.readFileSync(OUT, 'utf8');
      return JSON.parse(txt.slice(txt.indexOf('= {') + 2).trim().replace(/;\s*$/, ''));
    } catch { return {}; }
  })();
  const out: Record<string, ProjectFacts> = {};
  const missing: string[] = [];
  for (const p of projects) {
    const manual = MANUAL_ALIASES[p.id];
    const k = norm(p.name);
    let row = manual ? rows.find(r => r.project_name === manual) : byName.get(k);
    if (!row && k.length >= 3) {
      // A clean prefix in either direction only; a loose "contains" match wrongly paired One Seputeh
      // with Lunar Seputeh and Dwi Aurora with M Aurora.
      for (const [key, r] of byName) {
        if (key.length >= 3 && (key.startsWith(k) || k.startsWith(key))) { row = r; break; }
      }
    }
    if (!row) { missing.push(p.name); continue; }

    const stamp = clean(row.updated_at || row.processing_date).slice(0, 10);
    const facts: ProjectFacts = {
      source: `Developer sales kit${stamp ? ` (${stamp})` : ''}`,
      description: (() => {
        const en = parseDescription(row.description_en || row.project_description);
        const zh = parseDescription(row.description_zh);
        return en || zh ? { ...(en ? { en } : {}), ...(zh ? { zh } : {}) } : undefined;
      })(),
      keyFeatures: parseKeyFeatures(row.key_features),
      facilities: parseFacilities(row.facilities || ''),
      nearby: parseNearby(row.amenities || '')
    };
    if (!facts.facilities.length) {
      const fallback = [norm(p.name), norm(row.project_name)].map(key => localFac.get(key)).find(Boolean)
        || [...localFac.entries()].find(([key]) => key.length >= 4 && (key.startsWith(norm(p.name)) || norm(p.name).startsWith(key)))?.[1];
      if (fallback) facts.facilities = parseFacilities(fallback);
    }
    const old = previous[p.id];
    if (old) {
      if (!facts.keyFeatures.length) facts.keyFeatures = old.keyFeatures || [];
      if (!facts.facilities.length) facts.facilities = old.facilities || [];
      if (!facts.nearby.length) facts.nearby = old.nearby || [];
      if (!facts.description) facts.description = old.description;
    }
    if (facts.keyFeatures.length || facts.facilities.length || facts.nearby.length || facts.description) out[p.id] = facts;
    else missing.push(`${p.name} (row present but empty)`);
  }

  for (const [id, old] of Object.entries(previous)) if (!out[id]) out[id] = old;

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, moduleText(out), 'utf8');
  const withFacilities = Object.values(out).filter(x => x.facilities.length).length;
  console.log(`[gen-project-facts] ${Object.keys(out).length}/${projects.length} projects matched (${withFacilities} with a facilities list) -> ${path.relative(ROOT, OUT)}`);
  if (missing.length) console.log(`[gen-project-facts] not in the database: ${missing.join(' | ')}`);
}

main();
