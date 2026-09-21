/**
 * Turn the developer sales kits into a module the project page can show instead of invented text.
 *
 * Source:  ~/ctg-agent/data/incoming/<Project>/result.json   (only records marked "extracted")
 * Output:  src/data/projectFacts.generated.ts
 *
 * The project page used to render six generic "key features" and nine hard-coded facilities that were
 * identical on all 74 projects. This file gives it the real key features, facilities and nearby places
 * per project, keyed by the project id used in projectsFallback.json.
 *
 * Run: npx tsx scripts/gen-project-facts.ts     (CTG_DIR overrides the sales-kit folder)
 * The build runs it automatically; projects with no sales kit simply get no entry and the page
 * falls back to what it showed before.
 */
import fs from 'fs';
import path from 'path';
import os from 'os';

const CTG_DIR = process.env.CTG_DIR || path.join(os.homedir(), 'ctg-agent', 'data', 'incoming');
const ROOT = process.cwd();
const OUT = path.join(ROOT, 'src', 'data', 'projectFacts.generated.ts');
const PROJECTS = path.join(ROOT, 'src', 'projectsFallback.json');

export interface ProjectFacts {
  source: string;
  keyFeatures: string[];
  facilities: string[];
  nearby: { category: string; name: string; distance?: string }[];
}

const alnum = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const clean = (s: any) => (typeof s === 'string' ? s : s == null ? '' : String(s)).replace(/\s+/g, ' ').trim();

/** Sales kits separate items with " | " or newlines. */
const splitList = (s: string): string[] => (s || '').split(/\s*\|\s*|\n+/).map(x => x.trim()).filter(Boolean);

/** "Podium: Infinity Pool, Pool Deck | Level 8: Gym" or "Gym | Pool" -> a flat list of facility names. */
function parseFacilities(s: string): string[] {
  const out: string[] = [];
  for (const chunk of splitList(s)) {
    const m = chunk.match(/^([^:]{2,40}):\s*(.+)$/);
    const items = m ? m[2].split(/\s*,\s*/) : [chunk];
    for (const it of items) {
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
  return out.filter(x => x.name).slice(0, 30);
}

/**
 * Key features carry "[COMPLIANCE: ...]" notes written for the agent — advertising rules, penalties,
 * banned words. Those are internal and must never reach a public page, so anything that looks like a
 * rule rather than a feature is dropped outright.
 */
const INTERNAL_NOTE = /(COMPLIANCE|DO NOT|NOT ALLOWED|not allowed|penalt|offence|offense|RM\s?[\d,]+\s*(penalt|fine)|rebate|cashback|nett\s*price|\bGRR\b|zero\s*downpayment|early\s*bird|below\s*market|discount|approval\s*prior|prior\s*approval|commission|marketing\s*material|advertis|social\s*media)/i;
function parseKeyFeatures(v: any): string[] {
  return splitList(String(v || '').replace(/\s*;\s*/g, '|'))
    .map(x => x.replace(/\[COMPLIANCE:[\s\S]*$/i, '').replace(/[\[\]]/g, '').replace(/\.$/, '').trim())
    .filter(x => x && x.length <= 180 && !INTERNAL_NOTE.test(x))
    .slice(0, 10);
}

function main() {
  const projects: any[] = (() => {
    const d = JSON.parse(fs.readFileSync(PROJECTS, 'utf8'));
    return Array.isArray(d) ? d : d.projects || [];
  })();

  const byAlias = new Map<string, ProjectFacts>();
  if (!fs.existsSync(CTG_DIR)) {
    console.warn(`[gen-project-facts] ${CTG_DIR} not found; writing an empty file so the build still works.`);
  } else {
    for (const dir of fs.readdirSync(CTG_DIR)) {
      if (dir.startsWith('.') || /\.bak_/i.test(dir)) continue;
      const f = path.join(CTG_DIR, dir, 'result.json');
      if (!fs.existsSync(f)) continue;
      let r: any;
      try { r = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; }
      if ((r.processing_status || 'extracted') !== 'extracted') continue; // held_for_review = not checked yet
      const facts: ProjectFacts = {
        source: `Developer sales kit${clean(r.processing_date) ? ` (${clean(r.processing_date).slice(0, 10)})` : ''}`,
        keyFeatures: parseKeyFeatures(r.key_features),
        facilities: parseFacilities(String(r.facilities || '')),
        nearby: parseNearby(String(r.amenities || ''))
      };
      if (!facts.keyFeatures.length && !facts.facilities.length && !facts.nearby.length) continue;
      for (const key of [alnum(clean(r.project_name)), alnum(dir)].filter(Boolean)) {
        if (!byAlias.has(key)) byAlias.set(key, facts);
      }
    }
  }

  // Match each site project to a sales kit: exact name first, then a contains match on the longer keys.
  const out: Record<string, ProjectFacts> = {};
  const missing: string[] = [];
  for (const p of projects) {
    const id = p.id;
    const keys = [alnum(p.name), alnum(id)].filter(Boolean);
    let facts = keys.map(k => byAlias.get(k)).find(Boolean);
    if (!facts) {
      const hit = [...byAlias.entries()].find(([k]) =>
        keys.some(key => key.length >= 6 && (k.includes(key) || key.includes(k)) && k.length >= 6));
      facts = hit?.[1];
    }
    if (facts) out[id] = facts; else missing.push(p.name);
  }

  const body = `// GENERATED by scripts/gen-project-facts.ts from the developer sales kits — do not edit by hand.
// Real key features, facilities and nearby places per project, keyed by the id in projectsFallback.json.

export interface ProjectFacts {
  source: string;
  keyFeatures: string[];
  facilities: string[];
  nearby: { category: string; name: string; distance?: string }[];
}

export const PROJECT_FACTS: Record<string, ProjectFacts> = ${JSON.stringify(out, null, 1)};
`;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, body, 'utf8');
  console.log(`[gen-project-facts] ${Object.keys(out).length}/${projects.length} projects have real sales-kit facts -> ${path.relative(ROOT, OUT)}`);
  if (missing.length) console.log(`[gen-project-facts] no sales kit for: ${missing.join(' | ')}`);
}

main();
