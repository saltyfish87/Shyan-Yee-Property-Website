/**
 * Measure what is actually near each project, from OpenStreetMap.
 *
 * The project page used to show four amenity tiles whose numbers were derived from a hash of the
 * address — invented, not measured. The developer's own amenity list covers 57 of the 83 projects
 * and only mentions what the developer chose to mention. This fills the gap for every project that
 * has coordinates: the nearest station, mall, supermarket, school, hospital and park, with the
 * straight-line distance between the two points. Straight line, not driving distance — the page
 * says so, because a walk is always longer.
 *
 * Overpass is queried once per region per category (a handful of bbox queries) rather than once per
 * project, which would be 80 queries and get rate limited. Raw answers are cached under
 * .cache/osm so a re-run costs nothing.
 *
 * Run: npx tsx scripts/gen-nearby-osm.ts
 *   OSM_REFRESH=1  ignores the cache
 */
import fs from 'fs';
import path from 'path';

// The agency never publishes the name KLCC; the stations and the park carry it in OpenStreetMap.
const noKlcc = (s: string) => s.replace(/KLCC/g, 'KL City Centre');

const ROOT = process.cwd();
const PROJECTS = path.join(ROOT, 'src', 'projectsFallback.json');
const OUT = path.join(ROOT, 'src', 'data', 'nearbyOsm.generated.ts');
const CACHE = path.join(ROOT, '.cache', 'osm');
/**
 * Public Overpass instances rate-limit hard and answer at wildly different speeds, and a mirror
 * that carries only a European extract answers 200 with nothing in it. Rotate, and treat an empty
 * answer for a region we know has stations as a failure worth retrying elsewhere.
 */
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
];

/** Categories in the order the page shows them, with the OSM tags that identify each one. */
const CATEGORIES: { key: string; label: string; labelZh: string; filters: string[]; keep: number; maxKm: number }[] = [
  { key: 'rail', label: 'Train stations', labelZh: '轨道交通', keep: 3, maxKm: 4,
    filters: ['["railway"~"^(station|halt)$"]["name"]', '["public_transport"="station"]["name"]'] },
  { key: 'mall', label: 'Shopping malls', labelZh: '商场', keep: 3, maxKm: 8,
    filters: ['["shop"="mall"]["name"]'] },
  { key: 'grocery', label: 'Supermarkets', labelZh: '超市', keep: 2, maxKm: 4,
    filters: ['["shop"~"^(supermarket|department_store)$"]["name"]'] },
  { key: 'school', label: 'Schools and campuses', labelZh: '学校与大学', keep: 3, maxKm: 6,
    filters: ['["amenity"~"^(school|college|university)$"]["name"]'] },
  { key: 'health', label: 'Hospitals and clinics', labelZh: '医院与诊所', keep: 2, maxKm: 8,
    filters: ['["amenity"~"^(hospital|clinic)$"]["name"]'] },
  { key: 'park', label: 'Parks', labelZh: '公园', keep: 2, maxKm: 4,
    filters: ['["leisure"="park"]["name"]'] }
];

/** The projects sit in three clusters; a bbox per cluster keeps each query small enough to answer. */
const REGIONS: { key: string; bbox: [number, number, number, number] }[] = [
  { key: 'klang-valley', bbox: [2.80, 101.30, 3.40, 101.90] },
  { key: 'johor',        bbox: [1.35, 103.45, 1.75, 103.95] },
  { key: 'north',        bbox: [5.15, 100.15, 5.55, 100.60] }
];

interface Poi { name: string; lat: number; lon: number }

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLon = toRad(bLon - aLon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function overpass(query: string, cacheKey: string): Promise<any[]> {
  const file = path.join(CACHE, `${cacheKey}.json`);
  if (!process.env.OSM_REFRESH && fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  for (let round = 0; round < 3; round++) {
    for (const endpoint of ENDPOINTS) {
      try {
        const started = Date.now();
        const res = await fetch(endpoint, {
          method: 'POST',
          body: 'data=' + encodeURIComponent(query),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'shyanyee-property-site/1.0' },
          signal: AbortSignal.timeout(90000)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const elements = (JSON.parse(await res.text()).elements || []) as any[];
        if (!elements.length) throw new Error('empty answer');
        fs.mkdirSync(CACHE, { recursive: true });
        fs.writeFileSync(file, JSON.stringify(elements), 'utf8');
        console.log(`  ${cacheKey}: ${elements.length} from ${new URL(endpoint).host} in ${Math.round((Date.now() - started) / 1000)}s`);
        return elements;
      } catch (e: any) {
        console.warn(`  ${cacheKey}: ${new URL(endpoint).host} -> ${e.message}`);
        await sleep(5000);
      }
    }
    await sleep(20000);
  }
  console.warn(`  ${cacheKey}: giving up, this category will be missing here`);
  return [];
}

async function main() {
  // Distances to stations and malls do not move, and a deploy server hammering a public Overpass
  // mirror on every build would be rude and would fail more often than it succeeded. Once the file
  // is populated it is treated as done; OSM_REFRESH=1 re-measures on the agent's own machine.
  if (!process.env.OSM_REFRESH && fs.existsSync(OUT)) {
    const existing = fs.readFileSync(OUT, 'utf8');
    const populated = /"category"/.test(existing);
    if (populated) {
      console.log('[osm] measurements already committed; run with OSM_REFRESH=1 to redo them.');
      return;
    }
  }

  const projects: any[] = (() => {
    const d = JSON.parse(fs.readFileSync(PROJECTS, 'utf8'));
    return Array.isArray(d) ? d : d.projects || [];
  })();
  const located = projects.filter(p => p.latitude && p.longitude)
    .map(p => ({ id: p.id, lat: Number(p.latitude), lon: Number(p.longitude) }));

  // Which projects sit in which bbox, so an empty region is never queried.
  const inRegion = (r: typeof REGIONS[number], p: { lat: number; lon: number }) =>
    p.lat >= r.bbox[0] && p.lat <= r.bbox[2] && p.lon >= r.bbox[1] && p.lon <= r.bbox[3];

  const pois: Record<string, Poi[]> = {};
  for (const region of REGIONS) {
    if (!located.some(p => inRegion(region, p))) continue;
    const [s, w, n, e] = region.bbox;
    for (const cat of CATEGORIES) {
      const body = cat.filters
        .flatMap(f => [`node${f}(${s},${w},${n},${e});`, `way${f}(${s},${w},${n},${e});`])
        .join('\n  ');
      const query = `[out:json][timeout:180];\n(\n  ${body}\n);\nout center tags;`;
      const elements = await overpass(query, `${region.key}-${cat.key}`);
      const list = (pois[cat.key] ||= []);
      for (const el of elements) {
        const lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon;
        const name = el.tags?.name;
        if (lat && lon && name) list.push({ name: String(name), lat, lon });
      }
      await sleep(6000);
    }
  }

  const out: Record<string, { category: string; categoryZh: string; name: string; km: number }[]> = {};
  for (const p of located) {
    const rows: { category: string; categoryZh: string; name: string; km: number }[] = [];
    for (const cat of CATEGORIES) {
      const near = (pois[cat.key] || [])
        .map(poi => ({ poi, km: haversineKm(p.lat, p.lon, poi.lat, poi.lon) }))
        .filter(x => x.km <= cat.maxKm)
        .sort((a, b) => a.km - b.km);
      const seen = new Set<string>();
      for (const { poi, km } of near) {
        const key = poi.name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({ category: cat.label, categoryZh: cat.labelZh, name: poi.name, km: Math.round(km * 100) / 100 });
        if (seen.size >= cat.keep) break;
      }
    }
    if (rows.length) out[p.id] = rows;
  }

  if (Object.keys(out).length < located.length * 0.5 && fs.existsSync(OUT) && /"category"/.test(fs.readFileSync(OUT, 'utf8'))) {
    console.warn(`[osm] only ${Object.keys(out).length} projects measured; keeping the committed file.`);
    return;
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, noKlcc(`// GENERATED by scripts/gen-nearby-osm.ts from OpenStreetMap — do not edit by hand.
// Straight-line distance in km from the project's coordinates to the nearest named place of each
// kind. A walk or a drive is always longer; the page says so where it prints these.

export interface OsmPlace { category: string; categoryZh: string; name: string; km: number }

export const NEARBY_OSM: Record<string, OsmPlace[]> = ${JSON.stringify(out, null, 1)};
`), 'utf8');
  console.log(`[osm] ${Object.keys(out).length}/${located.length} projects measured -> ${path.relative(ROOT, OUT)}`);
}

main();
