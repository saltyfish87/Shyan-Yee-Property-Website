/**
 * Add the projects that exist in the project database but not on the website.
 *
 * The site's catalogue comes from the website Google Sheet (16 columns, no images — the photos are
 * matched out of one shared Drive parent folder by folder name). The project database is a separate,
 * richer sheet: 98 rows with the developer's own facts, the real unit-type list, coordinates and a
 * Drive folder per image category. 48 of its projects have no row in the website sheet, so they have
 * no page at all.
 *
 * This script only ADDS. Every project already in the catalogue is left exactly as the website sheet
 * and the shared Drive folder produced it — an earlier attempt to re-point existing projects at the
 * database's photo_folder_url cut Core Residence from 27 images to 6, because that folder holds the
 * category sub-folders rather than the photos.
 *
 * The built projects are kept in src/data/dbProjects.generated.json, which is committed, so a build
 * never depends on Drive being reachable. Drive is only read for a project the store does not have
 * yet, or for everything when run with --refresh.
 *
 * Run order matters: after sync-sheet (which rewrites the catalogue) and before gen-project-facts
 * and gen-nearby-osm, so the new projects get their sales-kit facts and measured distances too.
 *
 *   npx tsx scripts/add-db-projects.ts [--refresh] [--only "Royal Lexis"]
 *     FACTS_SHEET_CSV  overrides the database URL
 *     FACTS_CSV_FILE   reads a local CSV instead (offline)
 */
import fs from 'fs';
import path from 'path';

const SHEET_CSV = process.env.FACTS_SHEET_CSV
  || 'https://docs.google.com/spreadsheets/d/1fa-DbbFmkN1QUdVZ6-D4Sd6350pS5irYpPtH5ldgeuM/export?format=csv&gid=0';
const ROOT = process.cwd();
const PROJECTS = path.join(ROOT, 'src', 'projectsFallback.json');
const STORE = path.join(ROOT, 'src', 'data', 'dbProjects.generated.json');
const REFRESH = process.argv.includes('--refresh');
const ONLY = (() => { const i = process.argv.indexOf('--only'); return i > 0 ? process.argv[i + 1] : ''; })();

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;
/**
 * The Drive folder that holds one sub-folder per project, each with Facade / Visual_Gallery /
 * Layout_Type / Floor_Plan / Location_Map / Facilities_Masterplan inside. The database row carries
 * a link per category, but those go stale — Trinity Nordic's were all 404 while its photos sat here
 * under a new id — so this parent is the fallback whenever a row's own links return nothing.
 */
const PHOTO_PARENT = process.env.PHOTO_PARENT || '1F7VXziU9LE8Kvz0FqEoMGI4_SiUU76FE';
const norm = (s: string) => String(s || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
const clean = (s: string) => String(s ?? '').replace(/\s+/g, ' ').trim();

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false; }
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift() || [];
  return rows.filter(r => r.some(x => x.trim())).map(r => Object.fromEntries(head.map((h, i) => [h.trim(), r[i] ?? ''])));
}

/** One Drive folder's files, newest listing first. `embeddedfolderview` needs no API key. */
async function listFolder(folderId: string): Promise<{ id: string; name: string }[]> {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}#list`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const out: { id: string; name: string }[] = [];
  for (const block of html.split('<div class="flip-entry"').slice(1)) {
    const id = /id="entry-([A-Za-z0-9_-]+)"/.exec(block)?.[1];
    const name = /flip-entry-title[^>]*>([^<]+)</.exec(block)?.[1]?.trim();
    if (id && name) out.push({ id, name });
  }
  return out;
}

const folderId = (url: string) => /folders\/([A-Za-z0-9_-]+)/.exec(url || '')?.[1] || '';
const driveUrl = (id: string, w = 1000) => `https://lh3.googleusercontent.com/d/${id}=w${w}`;

let masterCache: { id: string; name: string }[] | null = null;
async function masterFolders() {
  if (masterCache) return masterCache;
  try { masterCache = await listFolder(PHOTO_PARENT); }
  catch (e: any) { console.warn(`  ! photo parent folder: ${e.message}`); masterCache = []; }
  return masterCache;
}
const FILLER_WORDS = new Set(['the', 'residence', 'residences', 'suites', 'suite', 'at', 'by', 'phase',
  'tower', 'towers', 'block', 'and', 'kl', 'city', 'centre', 'center', 'kuala', 'lumpur', 'klcc']);
const nameWords = (n: string) => new Set(String(n || '').replace(/&#39;|&amp;/g, '').toLowerCase()
  .split(/[^a-z0-9]+/).filter(w => w && !FILLER_WORDS.has(w)));
function sameProject(a: string, b: string) {
  const wa = nameWords(a), wb = nameWords(b);
  if (!wa.size || !wb.size) return false;
  const shared = [...wa].filter(x => wb.has(x)).length;
  return shared > 0 && (shared === wa.size || shared === wb.size || shared / Math.max(wa.size, wb.size) >= 0.6);
}

async function imagesFor(row: Record<string, string>) {
  // Category sub-folders in the shared parent, found by the project's name, used when the row's
  // own links are dead.
  const fromMaster = async (): Promise<Record<string, { id: string; name: string }[]>> => {
    const hit = (await masterFolders()).find(f => sameProject(f.name, row.project_name));
    if (!hit) return {};
    let subs: { id: string; name: string }[] = [];
    try { subs = await listFolder(hit.id); } catch { return {}; }
    const out: Record<string, { id: string; name: string }[]> = {};
    for (const sub of subs) {
      const key = sub.name.toLowerCase().replace(/[^a-z]/g, '');
      try { out[key] = (await listFolder(sub.id)).filter(f => IMAGE_EXT.test(f.name)); } catch { out[key] = []; }
    }
    console.log(`  ~ ${row.project_name}: images from the shared photo folder ("${hit.name}")`);
    return out;
  };
  const pick = async (col: string) => {
    const id = folderId(row[col] || '');
    if (!id) return [];
    try { return (await listFolder(id)).filter(f => IMAGE_EXT.test(f.name)); }
    catch (e: any) { console.warn(`  ! ${row.project_name} / ${col}: ${e.message}`); return []; }
  };
  let [gallery, facade, masterplan, locationMap, layoutType, floorPlan] = await Promise.all([
    pick('visual_gallery_folder_url'), pick('facade_folder_url'), pick('facilities_masterplan_folder_url'),
    pick('location_map_folder_url'), pick('layout_type_folder_url'), pick('floor_plan_folder_url')
  ]);
  if (gallery.length + facade.length + layoutType.length === 0) {
    const m = await fromMaster();
    const g = (...keys: string[]) => keys.flatMap(k => m[k] || []);
    gallery = g('visualgallery'); facade = g('facade'); masterplan = g('facilitiesmasterplan');
    locationMap = g('locationmap'); layoutType = g('layouttype', 'unitlayouts'); floorPlan = g('floorplan', 'siteplan');
  }
  const cover = /[?&]id=([A-Za-z0-9_-]+)/.exec(row.cover_image_url || '')?.[1]
    || /\/d\/([A-Za-z0-9_-]+)/.exec(row.cover_image_url || '')?.[1] || '';
  const overview = [...facade, ...masterplan].map(f => driveUrl(f.id));
  if (cover && !overview.length) overview.unshift(driveUrl(cover));
  return {
    images: {
      overview,
      location: locationMap.map(f => driveUrl(f.id)),
      layout: [...layoutType, ...floorPlan].map(f => driveUrl(f.id)),
      gallery: gallery.map(f => driveUrl(f.id))
    },
    layoutFiles: layoutType
  };
}

/** "Type A 573sqft 1R1B | Type B(Dual Key) 802sqft 1R2B" — the same reading as gen-project-facts. */
function parseLayoutList(raw: string) {
  const text = clean(raw);
  if (!text) return [];
  const SIZE = /([\d,]+(?:\s*[-–]\s*[\d,]+)?)\s*sq\s*\.?\s*ft/i;
  const BEDS = /\b(\d+(?:\s*\+\s*\d+)?)\s*R\s*(\d+(?:\s*\+\s*\d+)?)\s*B/i;
  const out: { type: string; size?: number; beds?: string; baths?: string }[] = [];
  for (const part of text.split('|').map(x => x.trim()).filter(Boolean)) {
    const size = SIZE.exec(part), beds = BEDS.exec(part);
    const cut = Math.min(...[size?.index, beds?.index].filter((i): i is number => i != null).concat(part.length));
    const type = part.slice(0, cut).replace(/^type\s+/i, '').trim().replace(/^[,\s]+|[,\s]+$/g, '');
    if (!type) continue;
    const sqft = size ? Number(size[1].split(/[-–]/)[0].replace(/,/g, '')) : NaN;
    out.push({ type, ...(isFinite(sqft) && sqft > 0 ? { size: sqft } : {}),
      ...(beds ? { beds: beds[1].replace(/\s+/g, ''), baths: beds[2].replace(/\s+/g, '') } : {}) });
  }
  return out;
}

const num = (s: string) => { const n = Number(String(s || '').replace(/[^\d.]/g, '')); return isFinite(n) ? n : 0; };
function bedRange(s: string): [number, number] {
  const parts = clean(s).split(/[-–]/).map(p => parseInt(p, 10)).filter(n => isFinite(n));
  return parts.length ? [parts[0], parts[parts.length - 1]] : [1, 1];
}
function slugify(name: string) {
  return clean(name).toLowerCase().replace(/[''`]/g, '').replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

async function buildProject(row: Record<string, string>) {
  const { images, layoutFiles } = await imagesFor(row);
  const [bMin, bMax] = bedRange(row.bedrooms);
  const feeMatch = /([0-9]*\.?[0-9]+)/.exec(clean(row.maintenance_fee));
  const [lat, lng] = clean(row.coordinate).split(',').map(x => Number(x.trim()));
  // layout_types_json carries one clean number per type; the layouts text can hold a range, and
  // taking its first figure put Royal Lexis's Type D at 573 sq ft when its drawing says 1,155.
  const fromJson = (() => {
    try {
      const raw = JSON.parse(row.layout_types_json || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.map((x: any) => ({
        type: String(x.layout_type ?? '').trim(),
        size: Number(x.built_up_sqft) || undefined,
        beds: x.bedrooms != null ? String(x.bedrooms) : undefined,
        baths: x.bathrooms != null ? String(x.bathrooms) : undefined
      })).filter((x: any) => x.type);
    } catch { return []; }
  })();
  const fromText = parseLayoutList(row.layouts);
  const byText = new Map(fromText.map(l => [norm(l.type), l]));
  const list = fromJson.length
    ? fromJson.map((l: any) => ({ ...l, beds: l.beds ?? byText.get(norm(l.type))?.beds, baths: l.baths ?? byText.get(norm(l.type))?.baths }))
    : fromText;

  // Pair each unit type with its own drawing: the files are named Type_C_1085sqft.png.
  const layouts = list.map((l: any) => {
    const key = norm(l.type);
    const file = layoutFiles.find(f => norm(f.name).includes(`type${key}`))
      || layoutFiles.find(f => l.size && norm(f.name).includes(`${l.size}sqft`));
    return { image: file ? driveUrl(file.id) : (images.layout[0] || ''), typeName: `Type ${l.type}`,
      size: l.size, beds: l.beds, baths: l.baths };
  }).filter(l => l.image);
  const price = num(row.price_min);
  return {
    id: slugify(row.project_name),
    name: clean(row.project_name),
    developer: clean(row.developer),
    location: clean(row.address) || `${clean(row.area)}, ${clean(row.state)}`,
    area: clean(row.area),
    startingPrice: price,
    startingPriceFormatted: price ? `RM ${price.toLocaleString('en-US')}` : '',
    priceRange: price && num(row.price_max)
      ? `RM ${price.toLocaleString('en-US')} – RM ${num(row.price_max).toLocaleString('en-US')}` : '',
    builtUpMin: num(row.built_up_min),
    builtUpMax: num(row.built_up_max) || num(row.built_up_min),
    bedroomsMin: bMin,
    bedroomsMax: bMax,
    tenure: clean(row.tenure),
    projectType: clean(row.project_type),
    completionStatus: clean(row.completion_status),
    completionYear: clean(row.completion_year),
    ...(feeMatch ? { maintenanceFee: Number(feeMatch[1]), maintenanceFeeStr: clean(row.maintenance_fee) } : {}),
    totalUnits: clean(row.total_units),
    images,
    ...(layouts.length ? { layouts } : {}),
    ...(isFinite(lat) && isFinite(lng) ? { latitude: lat, longitude: lng } : {}),
    syncedAt: new Date().toISOString().slice(0, 10),
    source: 'project database'
  };
}

async function loadRows(): Promise<Record<string, string>[] | null> {
  if (process.env.FACTS_CSV_FILE) return parseCsv(fs.readFileSync(process.env.FACTS_CSV_FILE, 'utf8'));
  try {
    const res = await fetch(SHEET_CSV, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseCsv(await res.text());
  } catch (e: any) {
    console.warn(`[add-db-projects] database unreachable (${e.message}); using the committed store only.`);
    return null;
  }
}

async function main() {
  // In a build, sync-sheet has just rewritten the catalogue from the website sheet. Run by hand it
  // may still hold what this script added last time, so drop those before working out what is new.
  const catalogue = (JSON.parse(fs.readFileSync(PROJECTS, 'utf8')) as any[])
    .filter(p => p.source !== 'project database');
  const store: any[] = fs.existsSync(STORE) ? JSON.parse(fs.readFileSync(STORE, 'utf8')) : [];
  const rows = await loadRows();

  // The two sheets name the same project differently — "The Queenswoodz" against "Queenswoodz",
  // "Vox Residence @ Sentul" against "Vox", "Zenia @ ParkCity Damansara" against "Zenia Damansara".
  // A prefix test misses all of those and the site ends up with two pages for one building, so the
  // names are compared as sets of meaningful words instead.
  const FILLER = new Set(['the', 'residence', 'residences', 'suites', 'suite', 'at', 'by', 'phase',
    'tower', 'towers', 'block', 'and', 'kl', 'city', 'centre', 'center', 'kuala', 'lumpur']);
  const words = (n: string) => new Set(String(n || '').toLowerCase().split(/[^a-z0-9]+/)
    .filter(w => w && !FILLER.has(w)));
  const known = catalogue.map(p => ({ name: p.name, key: norm(p.name), words: words(p.name) }));
  const inCatalogue = (name: string) => {
    const k = norm(name), w = words(name);
    return known.some(h => {
      if (h.key === k) return true;
      if (h.key.length >= 4 && k.length >= 4 && (h.key.startsWith(k) || k.startsWith(h.key))) return true;
      if (!w.size || !h.words.size) return false;
      const shared = [...w].filter(x => h.words.has(x));
      if (!shared.length) return false;
      return shared.length === w.size || shared.length === h.words.size
        || shared.length / Math.max(w.size, h.words.size) >= 0.6;
    });
  };

  if (rows) {
    const have = new Set(store.map(p => norm(p.name)));
    const wanted = rows.filter(r => clean(r.project_name)
      && clean(r.status).toLowerCase() === 'live'
      && !inCatalogue(r.project_name)
      && (!ONLY || norm(r.project_name).includes(norm(ONLY))));
    const todo = wanted.filter(r => REFRESH || !have.has(norm(r.project_name)));
    if (todo.length) console.log(`[add-db-projects] reading Drive for ${todo.length} project(s)…`);
    for (const row of todo) {
      const built = await buildProject(row);
      const at = store.findIndex(p => norm(p.name) === norm(built.name));
      if (at >= 0) store[at] = built; else store.push(built);
      const n = built.images.gallery.length + built.images.overview.length;
      console.log(`  + ${built.name} — ${n} image(s), ${built.layouts?.length || 0} unit type(s)`);
    }
    fs.writeFileSync(STORE, JSON.stringify(store, null, 1));
  }

  // The database writes some areas as "Kwasa Damansara, Shah Alam" where the website sheet says
  // "Kwasa Damansara". Left alone that splits one area page into two, so fold the longer form into
  // the existing one — but only when the shorter name is already an area the site has.
  const head = (a: string) => norm(String(a || '').split(',')[0]);
  const areas = new Map(catalogue.map(p => [head(p.area), p.area]));
  // Two things the owner decided the database should win on, for projects that ARE in the website
  // sheet already:
  //  1. price — the two sheets disagree on seven buildings (Vox reads RM 680,160 in the database and
  //     RM 523,200 on the website sheet), and the database is the maintained one;
  //  2. photos — ten website-sheet projects have no folder in the site's own Drive parent and were
  //     showing Unsplash stock photos as if they were the building. Their real photos are in the
  //     shared photo folder, found by name.
  const dbByName = store.map(p => ({ p, words: nameWords(p.name) }));
  // Best word overlap wins; on a tie the unit count decides, because "Bangsar Hill Park – Tower B
  // and C" shares as many words with the VERDURA row as with the TALISA row, and only its 802 units
  // say which one it is.
  const digits = (v: any) => (/\d[\d,]*/.exec(String(v ?? ''))?.[0] || '').replace(/,/g, '');
  const findDb = (name: string, units?: string) => {
    const w = nameWords(name);
    let best: any, bestScore = 0, tie = false;
    for (const { p, words } of dbByName) {
      const shared = [...w].filter(x => words.has(x)).length;
      if (!shared || !(shared === w.size || shared === words.size || shared / Math.max(w.size, words.size) >= 0.6)) continue;
      const score = shared + (digits(units) && digits(units) === digits(p.totalUnits) ? 0.5 : 0);
      if (score > bestScore) { best = p; bestScore = score; tie = false; }
      else if (score === bestScore) tie = true;
    }
    return tie ? undefined : best;
  };
  let priced = 0, rephotographed = 0;
  for (const c of catalogue) {
    const db = findDb(c.name, c.totalUnits);
    if (db && db.startingPrice && db.startingPrice !== c.startingPrice) {
      c.startingPrice = db.startingPrice; c.startingPriceFormatted = db.startingPriceFormatted;
      if (db.priceRange) c.priceRange = db.priceRange;
      priced++;
    }
    const stock = (u: string) => /unsplash\.com/i.test(u);
    const all = Object.values(c.images || {}).flat() as string[];
    if (all.length && all.every(stock)) {
      const hit = (await masterFolders()).find(f => sameProject(f.name, c.name));
      if (hit) {
        const real = await imagesFor({ project_name: c.name } as any);
        const n = real.images.gallery.length + real.images.overview.length;
        if (n) {
          c.images = real.images;
          if (!c.layouts?.length && real.layoutFiles.length) c.layouts = real.layoutFiles.map(f => ({ image: driveUrl(f.id), typeName: f.name.replace(/\.[a-z]+$/i, '').replace(/_/g, ' ') }));
          rephotographed++;
          console.log(`  ~ ${c.name}: ${n} real photo(s) replace the stock images`);
        }
      }
    }
  }
  if (priced) console.log(`[add-db-projects] price taken from the database on ${priced} existing project(s).`);
  if (rephotographed) console.log(`[add-db-projects] stock photos replaced on ${rephotographed} project(s).`);

  let added = store.filter(p => !inCatalogue(p.name)).map(p => {
    const known = areas.get(head(p.area));
    return known && known !== p.area ? { ...p, area: known } : p;
  });
  // The database is inconsistent with itself too — "Seputeh" on one row and "Seputeh, Old Klang
  // Road" on another. Where the site has neither, keep the plainer of the two.
  const shortest = new Map<string, string>();
  for (const p of added) {
    if (areas.has(head(p.area))) continue;
    const cur = shortest.get(head(p.area));
    if (!cur || String(p.area).length < cur.length) shortest.set(head(p.area), String(p.area));
  }
  added = added.map(p => {
    const pick = areas.has(head(p.area)) ? undefined : shortest.get(head(p.area));
    return pick && pick !== p.area ? { ...p, area: pick } : p;
  });
  const merged = catalogue.concat(added);
  fs.writeFileSync(PROJECTS, JSON.stringify(merged, null, 2));
  console.log(`[add-db-projects] ${catalogue.length} from the website sheet + ${added.length} from the database = ${merged.length}.`);
  const thin = added.filter(p => (p.images.gallery.length + p.images.overview.length) < 3);
  if (thin.length) console.log(`[add-db-projects] fewer than 3 images: ${thin.map(p => p.name).join(' | ')}`);
  const noLayout = added.filter(p => !p.layouts?.length);
  if (noLayout.length) console.log(`[add-db-projects] no unit types: ${noLayout.map(p => p.name).join(' | ')}`);
}

main().catch(e => { console.error('[add-db-projects]', e); process.exit(0); });
