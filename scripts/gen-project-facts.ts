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
  'bangsar-hill-park-verdura-tower': 'Bangsar Hill Park (Phase 1 - VERDURA)',
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

function parseKeyFeatures(v: any): string[] {
  return splitList(String(v || '').replace(/\s*;\s*/g, '|'))
    .map(x => x.replace(/\[COMPLIANCE:[\s\S]*$/i, '').replace(/[[\]]/g, '').replace(/\.$/, '').trim())
    .filter(x => x && x.length <= 180 && !INTERNAL_NOTE.test(x))
    .slice(0, 10);
}

/** "Podium: Infinity Pool, Pool Deck | Level 8: Gym" or "Gym | Pool" -> a flat list of facility names. */
function parseFacilities(s: string): string[] {
  const out: string[] = [];
  for (const chunk of splitList(s)) {
    const m = chunk.match(/^([^:]{2,40}):\s*(.+)$/);
    for (const it of (m ? m[2].split(/\s*,\s*/) : [chunk])) {
      const t = it.trim().replace(/\.$/, '').replace(/\s*\(space only\)$/i, '');
      if (t && t.length <= 60 && !INTERNAL_NOTE.test(t) && !out.some(o => o.toLowerCase() === t.toLowerCase())) out.push(t);
    }
  }
  return out.slice(0, 40);
}

/** Two shapes appear: "Category - Name (1.3km)" per pipe, or "category: X, items: ['a','b']". */
function parseNearby(s: string): ProjectFacts['nearby'] {
  const out: ProjectFacts['nearby'] = [];
  const withDistance = (category: string, name: string) => {
    const m = name.match(/^(.*?)\s*\(([^)]*(?:km|m|min|minute|walk)[^)]*)\)\s*$/i);
    return m ? { category, name: m[1].trim(), distance: m[2].trim() } : { category, name };
  };
  for (const chunk of splitList(s)) {
    const listForm = chunk.match(/^category:\s*([^,]+),\s*(?:amenities|items|places|list):\s*\[(.*)\]$/i);
    if (listForm) {
      const cat = listForm[1].trim();
      for (const raw of listForm[2].split(/'\s*,\s*'|"\s*,\s*"|\}\s*,\s*\{/)) {
        const nameMatch = raw.match(/'name'\s*:\s*'([^']+)'/) || raw.match(/"name"\s*:\s*"([^"]+)"/);
        const distMatch = raw.match(/'distance_km'\s*:\s*([\d.]+)/) || raw.match(/"distance_km"\s*:\s*([\d.]+)/);
        const name = nameMatch ? nameMatch[1] : raw.replace(/^[['"{\s]+|[\]'"}\s]+$/g, '');
        if (!name || name.length > 70) continue;
        out.push(distMatch ? { category: cat, name, distance: `${distMatch[1]} km` } : withDistance(cat, name));
      }
      continue;
    }
    const dash = chunk.match(/^([^-]{2,40})\s+-\s+(.+)$/);
    out.push(dash ? withDistance(dash[1].trim(), dash[2].trim()) : withDistance('Nearby', chunk));
  }
  return out.filter(x => x.name && !INTERNAL_NOTE.test(x.name)).slice(0, 30);
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
      keyFeatures: parseKeyFeatures(row.key_features),
      facilities: parseFacilities(row.facilities || ''),
      nearby: parseNearby(row.amenities || '')
    };
    if (!facts.facilities.length) {
      const fallback = [norm(p.name), norm(row.project_name)].map(key => localFac.get(key)).find(Boolean)
        || [...localFac.entries()].find(([key]) => key.length >= 4 && (key.startsWith(norm(p.name)) || norm(p.name).startsWith(key)))?.[1];
      if (fallback) facts.facilities = parseFacilities(fallback);
    }
    if (facts.keyFeatures.length || facts.facilities.length || facts.nearby.length) out[p.id] = facts;
    else missing.push(`${p.name} (row present but empty)`);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, moduleText(out), 'utf8');
  const withFacilities = Object.values(out).filter(x => x.facilities.length).length;
  console.log(`[gen-project-facts] ${Object.keys(out).length}/${projects.length} projects matched (${withFacilities} with a facilities list) -> ${path.relative(ROOT, OUT)}`);
  if (missing.length) console.log(`[gen-project-facts] not in the database: ${missing.join(' | ')}`);
}

main();
