import fs from 'fs';
import path from 'path';
// @ts-ignore — no types shipped
import * as OpenCC from 'opencc-js';
import { BLOG_DATA, FAQ_DATA } from '../src/data';
import { NEARBY_OSM } from '../src/data/nearbyOsm.generated';
import { PROJECT_FACTS } from '../src/data/projectFacts.generated';
import { GENERATED_ZH_ARTICLES } from '../src/data/articles.generated';
import { translations, PRE_TRANSLATED_BLOGS, PRE_TRANSLATED_BLOG_DETAILS } from '../src/translations';
import { FAQ_TRANSLATIONS } from '../src/faqTranslations';
import { HOME_VIDEOS } from '../src/videos';
import { renderMarkdown, extractYoutubeIds, articleDates, dateLabel, DEFAULT_AUTO_LINKS } from '../src/lib/markdown';
import { Project } from '../src/types';

const cwd = process.cwd();
const distPath = path.join(cwd, 'dist');
const projectsFile = path.join(cwd, 'src', 'projectsFallback.json');

if (!fs.existsSync(distPath)) {
  console.error("dist folder does not exist. Run vite build first.");
  process.exit(1);
}

const indexPath = path.join(distPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error("dist/index.html does not exist.");
  process.exit(1);
}

const rawHtml = fs.readFileSync(indexPath, 'utf-8');
const projects: Project[] = JSON.parse(fs.readFileSync(projectsFile, 'utf-8'));


const PERSON_ID = 'https://shyanyee.com/#person';
const AGENT_PHOTO = 'https://lh3.googleusercontent.com/d/1jrGU7WOGJOTL_ORhhYMpjZ7IgMoNavKY=w300';
const SOCIAL = ['https://www.youtube.com/@shyanyee', 'https://www.instagram.com/shyanyee/', 'https://www.facebook.com/shyanyeeconsultant/'];
// The person behind the articles (E-E-A-T): referenced as author from every BlogPosting.
function personNode() {
  return {
    "@type": "Person", "@id": PERSON_ID, "name": "Yee Woei Shyan", "alternateName": "Shyan Yee",
    "jobTitle": "Real Estate Negotiator (REN 46305)", "image": AGENT_PHOTO, "url": "https://shyanyee.com",
    "worksFor": { "@type": "Organization", "name": "IQI Realty Sdn Bhd" }, "telephone": "+60108278932",
    "knowsAbout": ["Malaysia new launch property", "Kuala Lumpur condominiums", "Johor Bahru property", "MM2H property purchase"],
    "sameAs": ["https://maps.google.com/?cid=3195643739952877602", "https://shyanyee.com", "https://wa.me/60108278932", ...SOCIAL]
  };
}
function authorBoxHtml(lang: 'en' | 'zh'): string {
  const blurb = lang === 'zh'
    ? '持牌房产经纪，专注吉隆坡、雪兰莪与新山的新楼盘。文章内容来自发展商资料与实地看房经验；价格与政策会变动，购买前请以最新资料为准。'
    : 'Licensed real estate negotiator focused on new launches in Kuala Lumpur, Selangor and Johor Bahru. Articles draw on developer material and site visits; prices and rules change, so confirm the latest before you buy.';
  return `<section style="margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
    <div style="display: flex; gap: 20px; align-items: flex-start; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
      <img src="${AGENT_PHOTO}" alt="Shyan Yee (Yee Woei Shyan), REN 46305" width="80" height="80" loading="lazy" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; flex-shrink: 0;" />
      <div>
        <p style="margin: 0; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: #f97316; font-weight: 800;">${lang === 'zh' ? '作者' : 'Written by'}</p>
        <p style="margin: 2px 0 0; font-size: 16px; font-weight: 800; color: #0f172a;">Shyan Yee (Yee Woei Shyan)</p>
        <p style="margin: 2px 0 0; font-size: 13px; color: #64748b; font-weight: 700;">REN 46305 · IQI Realty Sdn Bhd · Kuala Lumpur</p>
        <p style="margin: 10px 0 0; font-size: 14px; color: #475569; line-height: 1.6;">${blurb}</p>
        <p style="margin: 10px 0 0; font-size: 13px; font-weight: 700;"><a href="https://wa.me/60108278932" style="color: #15803d;">WhatsApp +60 10-827 8932</a> &middot; <a href="${SOCIAL[0]}" style="color: #475569;">YouTube</a> &middot; <a href="${SOCIAL[1]}" style="color: #475569;">Instagram</a> &middot; <a href="${SOCIAL[2]}" style="color: #475569;">Facebook</a></p>
      </div>
    </div>
  </section>`;
}
function relatedProjectsHtml(article: any, projects: Project[], lang: 'en' | 'zh'): string {
  const ids: string[] = article.relatedProjectIds || [];
  const rows = ids.map(id => projects.find(p => p.id === id)).filter(Boolean) as Project[];
  if (!rows.length) return '';
  const base = lang === 'zh' ? 'https://shyanyee.com/zh/projects/' : 'https://shyanyee.com/projects/';
  return `<section style="margin-top: 32px;"><h3 style="font-size: 20px; font-weight: 700; margin: 0 0 12px 0;">${lang === 'zh' ? '文中提到的楼盘' : 'Projects in this article'}</h3>
    <ul style="line-height: 1.9; font-size: 15px; padding-left: 20px;">${rows.map(p => `<li><a href="${base}${p.id}" style="color: #2563eb; text-decoration: none; font-weight: 700;">${p.name}</a> — ${p.area || p.location}${p.tenure ? `, ${p.tenure}` : ''}${p.startingPrice ? `, ${lang === 'zh' ? '起价' : 'from'} RM ${p.startingPrice.toLocaleString()}` : ''}</li>`).join('')}</ul></section>`;
}
function relatedArticles(article: any, pool: any[]): any[] {
  const others = pool.filter(b => b.slug !== article.slug);
  const picked = (article.relatedSlugs || []).map((sl: string) => others.find(b => b.slug === sl)).filter(Boolean);
  const sameCat = others.filter(b => b.category === article.category && !picked.includes(b));
  const rest = others.filter(b => !picked.includes(b) && !sameCat.includes(b));
  return [...picked, ...sameCat, ...rest].slice(0, 6);
}
function projectGuidesHtml(projectId: string, lang: 'en' | 'zh'): string {
  const arts = BLOG_DATA.filter(b => (b.relatedProjectIds || []).includes(projectId));
  if (!arts.length) return '';
  const base = lang === 'zh' ? 'https://shyanyee.com/zh/blog/' : 'https://shyanyee.com/blog/';
  return `<section style="margin-bottom: 40px;"><h2>${lang === 'zh' ? '这个楼盘的评测与指南' : 'Reviews and guides about this project'}</h2><ul>${arts.map(b => { const z = lang === 'zh' ? (GENERATED_ZH_ARTICLES[b.slug] || b) : b; return `<li><a href="${base}${b.slug}" style="color: #2563eb; font-weight: 700;">${escapeXml(z.title)}</a> — ${escapeXml(z.summary || '')}</li>`; }).join('')}</ul></section>`;
}

// Featured YouTube walkthroughs on the home page → VideoObject cards for Google
function videoObjects(lang: 'en' | 'zh'): any[] {
  return HOME_VIDEOS.map(v => ({
    "@type": "VideoObject",
    "@id": `https://www.youtube.com/watch?v=${v.youtubeId}`,
    "name": lang === 'zh' ? v.titleZh : v.title,
    "description": lang === 'zh' ? `${v.titleZh}（Shyan Yee 实地看房视频）` : `${v.title} — site walkthrough by Shyan Yee (REN 46305).`,
    "thumbnailUrl": [`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`],
    "uploadDate": v.uploadDate,
    "duration": `PT${Math.floor(v.durationSeconds / 60)}M${v.durationSeconds % 60}S`,
    "embedUrl": `https://www.youtube-nocookie.com/embed/${v.youtubeId}`,
    "contentUrl": `https://www.youtube.com/watch?v=${v.youtubeId}`,
    "inLanguage": "zh",
    "publisher": { "@id": "https://shyanyee.com/#agent" }
  }));
}

/**
 * Buyer shortlists: /best/<slug>.
 *
 * Buyers search by what they can spend and why they are buying. propertyportal.my answers those
 * searches with a plain data table; the angle here is deliberately different — these lists lead with
 * the projects Shyan Yee has actually walked through, so the two sites do not compete with the same
 * page. Each list filters the live sheet, so it re-sorts itself as prices change.
 */
interface BuyerShortlist {
  slug: string; h1: string; title: string; desc: string; blurb: string;
  pick: (p: any) => boolean;
  /** Most lists read best cheapest-first; the holding-cost list needs its own order. */
  sort?: (a: any, b: any) => number;
  /** An extra column, where the list exists because of a figure the table does not already show. */
  column?: { head: string; headZh: string; cell: (p: any) => string };
}

/**
 * What the maintenance fee actually costs, in ringgit a month.
 *
 * Every site quotes it per square foot, which is not a number anyone can feel. On a 1,000 sq ft
 * unit the spread across these projects runs from about RM 270 a month to RM 1,320 — the same
 * again as a small car loan, every month, for as long as you own it. No competitor computes it,
 * and it is the second-largest recurring cost after the mortgage.
 */
/**
 * When this project's figures were last checked against the developer's own document.
 *
 * Every page used to claim today's date in the sitemap, on every build, which is a signal Google
 * learns to ignore. This is the real date from the project database, and the page says it out loud:
 * a price list from three weeks ago is worth more to a buyer than one with no date at all.
 */
function checkedOn(p: any): string | null {
  return PROJECT_FACTS[p.id]?.checked || null;
}
const prettyDate = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function feePsf(p: any): number | null {
  // The sales kit wins over the website sheet: the sheet had Orion's 1.32 psf on Maple Residences,
  // whose own kit says 0.39, and five other rows disagreed the same way.
  const fromKit = PROJECT_FACTS[p.id]?.maintenanceFeePsf;
  if (typeof fromKit === 'number') return fromKit;
  const v = Number(String(p.maintenanceFee ?? '').replace(/[^0-9.]/g, ''));
  // The sheet column holds a psf rate; a few rows hold a monthly ringgit figure instead, which is
  // not comparable and is left out rather than silently divided.
  return isFinite(v) && v >= 0.1 && v <= 3 ? v : null;
}

/** The fee as a reader should see it: the kit's own wording where we have it. */
function feeLabel(p: any): string {
  const kit = PROJECT_FACTS[p.id]?.maintenanceFee;
  if (kit) return kit;
  return p.maintenanceFee ? `RM ${p.maintenanceFee} / sqft` : (p.maintenanceFeeStr || 'Standard');
}
function monthlyOn1000(p: any): number | null {
  const f = feePsf(p);
  return f === null ? null : Math.round(f * 1000);
}

/**
 * Areas come from the projects, not a hand-kept list, so a new project in a new area gets its own
 * page on the next build. An area with a single project still gets one: it is the page a search for
 * "new launch in <that area>" lands on, and it links the project into the rest of the site.
 */
const areaSlug = (name: string) => name.toLowerCase()
  .replace(/&/g, ' and ').replace(/[\/]/g, ' ')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

interface AreaGroup { slug: string; name: string; items: Project[] }
const AREAS: AreaGroup[] = (() => {
  const byName = new Map<string, Project[]>();
  for (const p of projects) {
    const a = String((p as any).area || '').trim();
    if (!a) continue;
    (byName.get(a) || byName.set(a, []).get(a)!).push(p);
  }
  return [...byName.entries()]
    .map(([name, items]) => ({ slug: areaSlug(name), name, items }))
    .filter(a => a.slug)
    .sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name));
})();
const areaOfProject = (p: Project) => AREAS.find(a => a.items.some(x => x.id === p.id));

/**
 * Station pages, built from the measured distances.
 *
 * "condo near <station>" is what a buyer without a car actually types, and not one of the sites
 * competing for these searches can answer it: none of them measures anything. The station list and
 * every distance on these pages come from the same OpenStreetMap measurement the project pages use.
 *
 * OSM labels a station with its line code ("MR6 Bukit Bintang", "KG18A Bukit Bintang"). Those are
 * two platforms of one interchange as far as a buyer is concerned, so they are grouped by the name
 * and the codes are listed. Bus terminals tagged as stations are dropped.
 */
interface StationGroup { slug: string; name: string; codes: string[]; items: { p: Project; km: number }[] }
const STATIONS: StationGroup[] = (() => {
  const strip = (n: string) => n.replace(/^[A-Z]{2}\d+[A-Z]?\s+/, '').replace(/\s+(LRT|MRT|Monorail|KTM)\s+Station$/i, '').trim();
  const byId = new Map(projects.map(p => [p.id, p]));
  const groups = new Map<string, StationGroup>();
  for (const [id, rows] of Object.entries(NEARBY_OSM)) {
    const p = byId.get(id);
    if (!p) continue;
    for (const r of rows) {
      if (r.category !== 'Train stations') continue;
      if (/bus\s*terminal|bus\s*station|bus\s*hub/i.test(r.name)) continue;
      const name = strip(r.name);
      if (!name) continue;
      const slug = areaSlug(name);
      const g = groups.get(slug) || { slug, name, codes: [], items: [] };
      const code = (r.name.match(/^([A-Z]{2}\d+[A-Z]?)/) || [])[1];
      if (code && !g.codes.includes(code)) g.codes.push(code);
      const seen = g.items.find(x => x.p.id === id);
      if (seen) seen.km = Math.min(seen.km, r.km); else g.items.push({ p, km: r.km });
      groups.set(slug, g);
    }
  }
  return [...groups.values()]
    // One project is not a list; those projects are already reachable from their area page.
    .filter(g => g.items.length >= 2)
    .map(g => ({ ...g, items: g.items.sort((a, b) => a.km - b.km) }))
    .sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name));
})();

/**
 * Developer and completion-year pages.
 *
 * Only developers with more than one project get a page: a single-project developer is already
 * served by that project's own page, and 52 one-row pages is exactly the thin-index padding the
 * competitors use. Same rule for years.
 */
/**
 * Sales kits name the project's own company, not the group behind it: "EXSIM Jalil Link Sdn Bhd",
 * "Major Land Development Sdn Bhd (a wholly-owned subsidiary of Mah Sing Group Berhad)". A buyer
 * is choosing a group, not an SPV, so everything is folded up to the parent brand. A bracket that
 * names the parent wins over the company in front of it; otherwise the brand is matched by name.
 */
/**
 * [what to look for, what to call it]. The database usually names the group and the project company
 * together, so a match anywhere in the string is enough. Order matters: longer names first.
 */
const DEV_BRANDS: [string, string][] = [
  ['Eastern & Oriental', 'Eastern & Oriental'], ['Chin Hin', 'Chin Hin Group'],
  ['Mah Sing', 'Mah Sing Group'], ['Paramount Property', 'Paramount Property'],
  ['Pavilion Group', 'Pavilion Group'], ['Kerjaya', 'Kerjaya Prospek'],
  ['Crest Builder', 'Crest Builder'], ['Welton', 'Welton Group'],
  ['OSK Property', 'OSK Property'], ['Berjaya', 'Berjaya'], ['Ayala Land', 'Ayala Land'],
  ['Land and General', 'Land and General'], ['Sun Suria', 'Sun Suria'], ['SP Setia', 'SP Setia'],
  ['Radium', 'Radium'], ['Glomac', 'Glomac'], ['Avaland', 'Avaland'], ['Exsim', 'Exsim'],
  ['Malton', 'Malton'], ['MRCB', 'MRCB'], ['BRDB', 'BRDB'], ['WCT', 'WCT'], ['UOA', 'UOA'],
  ['IJM', 'IJM'], ['TA Global', 'TA Global'], ['GSH', 'GSH'], ['Park City', 'Park City'],
  ['Masteron', 'Masteron'], ['Asiapac', 'Asiapac'], ['Puncak Dana', 'Puncak Dana'],
  ['Majestic Gen', 'Majestic Gen'], ['R&F Development', 'R&F Development'],
  ['Golden Eagle', 'Golden Eagle'], ['Ehsan Bina', 'Ehsan Bina'], ['EH Developer', 'EH Developer'],
  ['OCR', 'OCR'], ['SCP', 'SCP'], ['TSR', 'TSR']
];

/**
 * Sales kits name the project's own company, not the group behind it. A buyer is choosing a group,
 * so everything folds up to the parent brand. The project database names both ("Chin Hin Group
 * Property (Quaver Sdn Bhd)") and is preferred over the website sheet, which names only the SPV
 * ("Quaver Sdn Bhd") — that is why Quaver and Ayanna sit under Chin Hin without a hand-written rule.
 */
function devName(project: Project): string {
  // Neither source is reliably the better one: the database gives the group for Quaver and only the
  // project company for Pavilion Square, and the website sheet is the other way round. Look in both
  // and take whichever names a group; fall back to the sheet's own wording.
  const fromDb = String(PROJECT_FACTS[project.id]?.developer || '').trim();
  const fromSheet = String((project as any).developer || '').trim();
  const full = fromSheet || fromDb;
  if (!full && !fromDb) return '';
  for (const [needle, brand] of DEV_BRANDS) {
    const re = new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(fromDb) || re.test(fromSheet)) return brand;
  }
  // No group recognised: a one-off project company. Drop the legal suffix and leave it.
  return full.replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/\s+Sdn\.?\s*Bhd\.?$/i, '')
    .replace(/\s+Berhad$/i, '')
    .replace(/\s+Bhd\.?$/i, '')
    .trim();
}

interface DeveloperGroup { slug: string; name: string; items: Project[] }
const DEVELOPERS: DeveloperGroup[] = (() => {
  const by = new Map<string, Project[]>();
  for (const p of projects) {
    const n = devName(p);
    if (!n) continue;
    (by.get(n) || by.set(n, []).get(n)!).push(p);
  }
  return [...by.entries()]
    .filter(([, items]) => items.length >= 2)
    .map(([name, items]) => ({ slug: areaSlug(name), name, items }))
    .filter(d => d.slug)
    .sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name));
})();

interface YearGroup { year: string; items: Project[] }
const COMPLETION_YEARS: YearGroup[] = (() => {
  const by = new Map<string, Project[]>();
  for (const p of projects) {
    const y = String((p as any).completionYear || '').trim();
    if (!/^20\d{2}$/.test(y)) continue;
    (by.get(y) || by.set(y, []).get(y)!).push(p);
  }
  return [...by.entries()]
    .filter(([, items]) => items.length >= 3)
    .map(([year, items]) => ({ year, items }))
    .sort((a, b) => a.year.localeCompare(b.year));
})();

/**
 * Head-to-head pages.
 *
 * A buyer at the end of their search is choosing between two named projects, and that is what they
 * type. propertyportal.my already carries the spec comparison; this one must not repeat it, or the
 * two domains compete with each other. So this page leads with what I have actually seen of each —
 * the review, the walkthrough video — then the measured walk to a station, and sends the reader to
 * the portal for the full spec sheet.
 */
interface ComparePair { slug: string; a: Project; b: Project; area: string }
const COMPARE_PAIRS: ComparePair[] = (() => {
  const tokens = (a: any) => String(a || '').split('/').map((t: string) => t.trim()).filter(Boolean);
  const byArea = new Map<string, Project[]>();
  for (const p of projects) {
    if (!Number((p as any).startingPrice) || !(p as any).area) continue;
    for (const t of tokens((p as any).area)) (byArea.get(t) || byArea.set(t, []).get(t)!).push(p);
  }
  const out: ComparePair[] = [];
  const seen = new Set<string>();
  for (const [area, list] of byArea) {
    const sorted = [...list].sort((x: any, y: any) => Number(x.startingPrice) - Number(y.startingPrice));
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a: any = sorted[i], b: any = sorted[j];
        // Past 1.6x apart the buyer is not really choosing between them.
        if (Number(b.startingPrice) > Number(a.startingPrice) * 1.6) break;
        const key = [a.id, b.id].sort().join('|');
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ slug: `${a.id}-vs-${b.id}`, a, b, area });
      }
    }
  }
  return out;
})();

/** What I have on a project, which is the whole point of this page existing here. */
function coverageOf(p: Project) {
  const review = reviewOf(p.id);
  const video = HOME_VIDEOS.find(v => v.projectId === p.id);
  const station = (NEARBY_OSM[p.id] || []).find(n => n.category === 'Train stations');
  return { review, video, station };
}

/**
 * Area shortlists: "freehold in Bukit Jalil", "3-bedroom in Petaling Jaya", "under RM 500,000 in
 * Old Klang Road". These are the phrases a buyer types once they have settled on a neighbourhood,
 * and no competitor page answers them. Built from the projects, and only where at least three
 * qualify — two rows is not a list, it is padding.
 */
interface AreaSlice { slug: string; label: string; labelZh: string; pick: (p: any) => boolean }
const AREA_SLICES: AreaSlice[] = [
  { slug: 'under-500k', label: 'Under RM 500,000', labelZh: '50 万以下', pick: p => Number(p.startingPrice) > 0 && Number(p.startingPrice) < 500000 },
  { slug: '500k-to-700k', label: 'RM 500,000 to RM 700,000', labelZh: '50 万至 70 万', pick: p => Number(p.startingPrice) >= 500000 && Number(p.startingPrice) < 700000 },
  { slug: '700k-to-1-million', label: 'RM 700,000 to RM 1 Million', labelZh: '70 万至 100 万', pick: p => Number(p.startingPrice) >= 700000 && Number(p.startingPrice) < 1000000 },
  { slug: 'above-1-million', label: 'Above RM 1 Million', labelZh: '100 万以上', pick: p => Number(p.startingPrice) >= 1000000 },
  { slug: 'freehold', label: 'Freehold', labelZh: '永久地契', pick: p => /freehold/i.test(String(p.tenure || '')) },
  { slug: '3-bedroom', label: 'Three Bedrooms and Larger', labelZh: '三房或以上', pick: p => Number(p.bedroomsMin) >= 3 },
  { slug: 'ready-to-move-in', label: 'Ready to Move In', labelZh: '现楼', pick: p => /ready|completed/i.test(String(p.completionStatus || '')) }
];

interface AreaShortlist { slug: string; area: string; slice: AreaSlice; items: Project[] }
const AREA_SHORTLISTS: AreaShortlist[] = (() => {
  const tokens = (a: any) => String(a || '').split('/').map((t: string) => t.trim()).filter(Boolean);
  const out: AreaShortlist[] = [];
  const byArea = new Map<string, Project[]>();
  for (const p of projects) for (const t of tokens((p as any).area)) (byArea.get(t) || byArea.set(t, []).get(t)!).push(p);
  for (const [area, list] of byArea) {
    for (const slice of AREA_SLICES) {
      const items = list.filter(slice.pick);
      if (items.length < 3) continue;
      out.push({ slug: `${slice.slug}-in-${areaSlug(area)}`, area, slice, items });
    }
  }
  return out.sort((a, b) => b.items.length - a.items.length || a.slug.localeCompare(b.slug));
})();

const BUYER_SHORTLISTS: BuyerShortlist[] = [
  { slug: 'condo-under-500k', h1: 'Condominiums Under RM 500,000 — and Which Ones I Have Walked Through',
    title: 'Condo Under RM 500,000 in KL & Selangor | Shyan Yee',
    desc: 'Every project on shyanyee.com starting under RM 500,000, with a link to my review or walkthrough video where I have one.',
    blurb: 'Projects with a developer list price starting under RM 500,000. Where I have filmed or reviewed one, the link is in the last column.',
    pick: p => Number(p.startingPrice) > 0 && Number(p.startingPrice) < 500000 },
  { slug: 'condo-under-700k', h1: 'Condominiums Under RM 700,000 — and Which Ones I Have Walked Through',
    title: 'Condo Under RM 700,000 in KL & Selangor | Shyan Yee',
    desc: 'Projects starting under RM 700,000, with my review or walkthrough video where I have one.',
    blurb: 'The band most upgraders shop in. Where I have filmed or reviewed one, the link is in the last column.',
    pick: p => Number(p.startingPrice) > 0 && Number(p.startingPrice) < 700000 },
  { slug: 'condo-under-1-million', h1: 'Condominiums Under RM 1 Million — and Which Ones I Have Walked Through',
    title: 'Condo Under RM 1 Million in KL & Selangor | Shyan Yee',
    desc: 'Projects starting under RM 1,000,000, with my review or walkthrough video where I have one.',
    blurb: 'Foreign buyers should note the state minimum purchase price is RM 1,000,000 in Kuala Lumpur and most of Selangor.',
    pick: p => Number(p.startingPrice) > 0 && Number(p.startingPrice) < 1000000 },
  { slug: 'freehold-projects', h1: 'Freehold Projects — and Which Ones I Have Walked Through',
    title: 'Freehold New Launch Projects in Malaysia | Shyan Yee',
    desc: 'Freehold-title projects on shyanyee.com, with my review or walkthrough video where I have one.',
    blurb: 'Freehold title only: the land is held without an expiry date, so there is no lease to renew and no state consent needed on a later sale.',
    pick: p => /freehold/i.test(String(p.tenure || '')) },
  { slug: 'family-3-bedroom', h1: 'Three-Bedroom and Larger Projects — and Which Ones I Have Walked Through',
    title: '3-Bedroom Projects for Families in KL & Selangor | Shyan Yee',
    desc: 'Projects whose layouts start at three bedrooms, with my review or walkthrough video where I have one.',
    blurb: 'For households that need the rooms rather than the address.',
    pick: p => Number(p.bedroomsMin) >= 3 },
  { slug: 'near-mrt-lrt', h1: 'Projects Within One Kilometre of a Train Station',
    title: 'New Launches Near MRT & LRT Stations in Malaysia | Shyan Yee',
    desc: 'Projects whose coordinates sit within 1 km of a named rail station, measured on OpenStreetMap.',
    blurb: 'Measured, not claimed: the straight-line distance from each project\'s own coordinates to the nearest named station on OpenStreetMap. The walk is always longer than the straight line, so treat 1 km as the outer edge of walkable.',
    pick: p => (NEARBY_OSM[p.id] || []).some(n => n.category === 'Train stations' && n.km <= 1) },
  { slug: 'projects-i-have-reviewed', h1: 'Every Project I Have Reviewed or Filmed',
    title: 'Projects Reviewed by Shyan Yee (REN 46305) | Reviews & Walkthroughs',
    desc: 'The projects I have been through myself, with the written review, the walkthrough video, or both.',
    blurb: 'These are the ones I have walked, filmed or written up. Everything else on the site is developer data only.',
    pick: p => !!reviewOf(p.id) || HOME_VIDEOS.some(v => v.projectId === p.id) },
  { slug: 'lowest-monthly-maintenance', h1: 'What the Maintenance Fee Actually Costs, Cheapest First',
    title: 'Lowest Maintenance Fee Condos in KL & Selangor | Monthly Cost Compared',
    desc: 'Every project ranked by what the maintenance fee costs in ringgit a month on a 1,000 sq ft unit, not by the per-square-foot rate.',
    blurb: 'Everyone quotes maintenance per square foot, which tells you nothing you can feel. This is the same fee in ringgit a month on a 1,000 sq ft unit. The spread here is roughly five to one, and you pay it every month for as long as you own the place. Projects whose sheet gives a monthly range instead of a psf rate are left out rather than guessed at.',
    pick: p => monthlyOn1000(p) !== null,
    sort: (a: any, b: any) => (monthlyOn1000(a) ?? Infinity) - (monthlyOn1000(b) ?? Infinity),
    column: { head: 'Per month, 1,000 sq ft', headZh: '1,000 尺月付',
      cell: p => { const m = monthlyOn1000(p); return m === null ? '' : `RM ${m.toLocaleString()}`; } } },
  // The area shortlists join the same family, so the route, the renderer, the sitemap and the
  // browse block all pick them up without a second code path.
  ...AREA_SHORTLISTS.map(a => ({
    slug: a.slug,
    h1: `${a.slice.label} Projects in ${a.area}`,
    title: `${a.slice.label} in ${a.area} | New Launch Shortlist | Shyan Yee`,
    desc: `Every project on shyanyee.com in ${a.area} that is ${a.slice.label.toLowerCase()}, with price, built-up, completion and the ones I have reviewed or filmed.`,
    blurb: `${a.items.length} projects in ${a.area}. The list is generated from the project data, so a price change or a new launch shows up here on the next build.`,
    pick: (p: any) => String(p.area || '').split('/').map((t: string) => t.trim()).includes(a.area) && a.slice.pick(p)
  }))
];

/**
 * The walkthrough filmed for one project, as a VideoObject for that project's page.
 * A video is the one thing on a project page a competitor cannot copy from the brochure, so where
 * HOME_VIDEOS names a projectId the page carries it.
 */
function projectVideoObject(projectId: string, lang: 'en' | 'zh'): any | null {
  const v = HOME_VIDEOS.find(x => x.projectId === projectId);
  if (!v) return null;
  return videoObjects(lang).find(o => o['@id'].endsWith(v.youtubeId)) || null;
}

// VideoObject entries for {{youtube:ID}} embeds inside an article (known home videos keep their real title/date)
function embeddedVideoObjects(md: string, articleTitle: string, publishedIso: string, lang: 'en' | 'zh'): any[] {
  return extractYoutubeIds(md).map(id => {
    const known = HOME_VIDEOS.find(v => v.youtubeId === id);
    if (known) return videoObjects(lang).find(v => v['@id'].endsWith(id));
    return {
      "@type": "VideoObject",
      "@id": `https://www.youtube.com/watch?v=${id}`,
      "name": lang === 'zh' ? `${articleTitle}（视频）` : `${articleTitle} (video)`,
      "description": lang === 'zh' ? `${articleTitle} — Shyan Yee（REN 46305）实地看房视频。` : `${articleTitle} — walkthrough video by Shyan Yee (REN 46305).`,
      "thumbnailUrl": [`https://i.ytimg.com/vi/${id}/hqdefault.jpg`],
      "uploadDate": publishedIso,
      "embedUrl": `https://www.youtube-nocookie.com/embed/${id}`,
      "contentUrl": `https://www.youtube.com/watch?v=${id}`,
      "publisher": { "@id": "https://shyanyee.com/#agent" }
    };
  }).filter(Boolean);
}

// Helper to escape XML
/**
 * What a crawler saw on a project page was the spec box, the gallery and the FAQ — 365 words and
 * three links on a project with no layout table. Everything else the page knows (the developer's
 * write-up, its selling points, its facilities, the measured distances) lived only in the React
 * app, and no page pointed at any other page. These three blocks put that into the served HTML.
 */
/** The nav a crawler can actually follow, on every pre-rendered page. */
function siteLinksHtml(lang: 'en' | 'zh'): string {
  const zh = lang === 'zh';
  const b = zh ? `${SITE}/zh` : SITE;
  return `<section style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #475569;">
              <h2 style="font-size:18px;">${zh ? '按地区找楼盘' : 'Browse by area'}</h2>
              <ul style="line-height:1.9;columns:3;">${AREAS.map(a => `<li><a href="${b}/area/${a.slug}">${escapeXml(a.name)} (${a.items.length})</a></li>`).join('')}</ul>
              <h2 style="font-size:18px;">${zh ? '按车站找楼盘' : 'Browse by train station'}</h2>
              <ul style="line-height:1.9;columns:3;">${STATIONS.slice(0, 30).map(st => `<li><a href="${b}/near/${st.slug}">${escapeXml(st.name)} (${st.items.length})</a></li>`).join('')}</ul>
              <h2 style="font-size:18px;">${zh ? '按发展商' : 'Browse by developer'}</h2>
              <ul style="line-height:1.9;columns:3;">${DEVELOPERS.map(d => `<li><a href="${b}/developer/${d.slug}">${escapeXml(d.name)} (${d.items.length})</a></li>`).join('')}</ul>
              <h2 style="font-size:18px;">${zh ? '按完工年份' : 'Browse by completion year'}</h2>
              <ul style="line-height:1.9;columns:4;">${COMPLETION_YEARS.map(y => `<li><a href="${b}/completion/${y.year}">${y.year} (${y.items.length})</a></li>`).join('')}</ul>
              <h2 style="font-size:18px;">${zh ? '买家清单' : 'Buyer shortlists'}</h2>
              <ul style="line-height:1.9;columns:2;">${BUYER_SHORTLISTS.map(l => `<li><a href="${SITE}/best/${l.slug}">${escapeXml(l.h1)}</a></li>`).join('')}</ul>
              <p><a href="${b}">${zh ? '首页' : 'Home'}</a> &middot; <a href="${SITE}/projects">${zh ? '全部楼盘' : 'All projects'}</a> &middot; <a href="${SITE}/blog">${zh ? '评测与指南' : 'Reviews and guides'}</a> &middot; <a href="${SITE}/map">${zh ? '地图' : 'Map'}</a> &middot; <a href="${SITE}/calculator">${zh ? '贷款计算' : 'Calculators'}</a> &middot; <a href="${SITE}/faq">${zh ? '常见问题' : 'FAQ'}</a></p>
            </section>`;
}

/**
 * An article's relatedProjectIds starts with the project it is actually about; the rest are the
 * cross-links to its neighbours. Matching on `includes` therefore attached the Branniganz review to
 * CloutHaus, because Branniganz links to it. Only the first id counts as "I wrote this one up".
 */
function reviewOf(projectId: string, pool: any[] = BLOG_DATA): any | undefined {
  return pool.find((b: any) => (b.relatedProjectIds || [])[0] === projectId);
}

/** One project row, used by the developer and completion-year tables. */
function projectRowHtml(p: any, baseUrl: string): string {
  const td = 'style="padding:8px 10px;border-bottom:1px solid #f1f5f9;"';
  const rev = reviewOf(p.id);
  const vid = HOME_VIDEOS.find(v => v.projectId === p.id);
  const station = (NEARBY_OSM[p.id] || []).find(n => n.category === 'Train stations');
  const mine = [
    rev ? `<a href="${baseUrl}/blog/${rev.slug}">Review</a>` : '',
    vid ? `<a href="https://www.youtube.com/watch?v=${vid.youtubeId}">Video</a>` : ''
  ].filter(Boolean).join(' &middot; ') || '<span style="color:#94a3b8;">Developer data only</span>';
  return `<tr><td ${td}><a href="${baseUrl}/projects/${p.id}" style="color:#0f172a;font-weight:700;text-decoration:none;">${escapeXml(p.name)}</a></td>`
    + `<td ${td}>${escapeXml(p.area || '')}</td>`
    + `<td ${td}>${escapeXml(p.tenure || '')}</td>`
    + `<td ${td}>${escapeXml(p.startingPriceFormatted || p.priceRange || '')}</td>`
    + `<td ${td}>${p.builtUpMin ? `${p.builtUpMin}-${p.builtUpMax} sq ft` : ''}</td>`
    + `<td ${td}>${escapeXml(String(p.completionYear || ''))}</td>`
    + `<td ${td}>${station ? `${escapeXml(station.name)} ${station.km < 1 ? `${Math.round(station.km * 1000)} m` : `${station.km.toFixed(1)} km`}` : ''}</td>`
    + `<td ${td}>${mine}</td></tr>`;
}

/**
 * The unit-type table, from the sales kit as published in the project database.
 *
 * The table used to come from `project.layouts`, which server.ts fills in with a "beautiful
 * fallback" when nothing better is available: it spreads sizes and prices evenly from the smallest
 * unit to the largest and prints them as fact. On CloutHaus that put Type B at 616 sq ft and
 * RM 1,737,816 when the kit says nothing of the sort, and on Ayanna it priced a 1,526 sq ft unit
 * below a 1,340 sq ft one. Nothing invented is printed now: no kit, no table. Prices are left out
 * entirely, because the kit prices by stack and floor, not by type.
 */
function projectLayoutsHtml(projectId: string, lang: 'en' | 'zh'): string {
  const layouts = PROJECT_FACTS[projectId]?.layouts;
  if (!layouts?.length) return '';
  const zh = lang === 'zh';
  const withNote = layouts.some(l => l.note);
  const th = (t: string) => `<th style="border:1px solid #e5e7eb;padding:8px;text-align:left;">${t}</th>`;
  const td = (t: string) => `<td style="border:1px solid #e5e7eb;padding:8px;">${escapeXml(t)}</td>`;
  const head = (zh ? ['户型', '建筑面积（平方尺）', '房', '浴室'] : ['Type', 'Built-up (sq ft)', 'Bedrooms', 'Bathrooms'])
    .concat(withNote ? [zh ? '备注' : 'Notes'] : []).map(th).join('');
  const body = layouts.map(l => td(l.type) + td(l.size || '–') + td(l.beds || '–') + td(l.baths || '–')
    + (withNote ? td(l.note || '–') : '')).map(r => `<tr>${r}</tr>`).join('');
  return `
            <section style="margin-bottom: 40px;">
              <h2>${zh ? '户型与面积' : 'Unit types and sizes'}</h2>
              <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;margin-bottom:12px;">
                <thead><tr style="background-color:#f9fafb;">${head}</tr></thead>
                <tbody>${body}</tbody>
              </table>
              <p style="color:#57534e;font-size:14px;">${zh
                ? '户型与面积取自发展商销售资料。价钱按座向和楼层不同，请索取最新价单。'
                : 'Types and sizes are from the developer sales kit. Price varies by stack and floor — ask for the current price list.'}</p>
            </section>`;
}

function projectFactsHtml(projectId: string, lang: 'en' | 'zh'): string {
  const f = PROJECT_FACTS[projectId];
  if (!f) return '';
  const zh = lang === 'zh';
  const out: string[] = [];
  const write = zh ? (f.description?.zh || f.description?.en) : (f.description?.en || f.description?.zh);
  if (write) {
    out.push(`<section style="margin-bottom: 40px;">
              <h2>${zh ? '项目介绍' : 'About this project'}</h2>
              <p style="line-height:1.8;">${escapeXml(write)}</p>
              ${f.source ? `<p style="font-size:13px;color:#64748b;">${escapeXml(f.source)}</p>` : ''}
            </section>`);
  }
  if (f.keyFeatures?.length) {
    out.push(`<section style="margin-bottom: 40px;">
              <h2>${zh ? '核心卖点' : 'Key selling points'}</h2>
              <ul style="line-height:1.9;">${f.keyFeatures.map(k => `<li>${escapeXml(k)}</li>`).join('')}</ul>
            </section>`);
  }
  if (f.facilities?.length) {
    out.push(`<section style="margin-bottom: 40px;">
              <h2>${zh ? '项目设施' : 'Facilities'}</h2>
              <ul style="line-height:1.9;columns:2;">${f.facilities.map(k => `<li>${escapeXml(k)}</li>`).join('')}</ul>
            </section>`);
  }
  return out.join('\n            ');
}

/** Measured distances, grouped, with the straight-line caveat the page owes the reader. */
function projectNearbyHtml(projectId: string, lang: 'en' | 'zh'): string {
  const rows = NEARBY_OSM[projectId] || [];
  const facts = PROJECT_FACTS[projectId];
  const zh = lang === 'zh';
  if (!rows.length && !facts?.nearby?.length) return '';
  const groups: Record<string, typeof rows> = {};
  for (const r of rows) (groups[zh ? r.categoryZh : r.category] ||= []).push(r);
  const measured = Object.entries(groups).map(([cat, items]) => `
                <h3>${escapeXml(cat)}</h3>
                <ul style="line-height:1.9;">${items.map(i => `<li>${escapeXml(i.name)} — ${i.km < 1 ? `${Math.round(i.km * 1000)} m` : `${i.km.toFixed(1)} km`}</li>`).join('')}</ul>`).join('');
  const declared = facts?.nearby?.length
    ? `<h3>${zh ? '发展商列出的周边' : 'Listed by the developer'}</h3>
                <ul style="line-height:1.9;columns:2;">${facts.nearby.map(n => `<li>${escapeXml(n.name)}${n.distance ? ` — ${escapeXml(n.distance)}` : ''}</li>`).join('')}</ul>`
    : '';
  return `<section style="margin-bottom: 40px;">
              <h2>${zh ? '交通与周边' : 'Access and nearby amenities'}</h2>
              ${measured}
              ${measured ? `<p style="font-size:13px;color:#64748b;">${zh ? '以上为 OpenStreetMap 直线距离，实际步行或车程会更远。' : 'Straight-line distance on OpenStreetMap. Walking or driving is always further.'}</p>` : ''}
              ${declared}
            </section>`;
}

/**
 * Every project page now points at the rest of the site: its neighbours, the shortlists it belongs
 * to, the reviews that mention it, and its page on the portal. A page with three links is an island.
 */
function projectLinksHtml(project: Project, all: Project[], lang: 'en' | 'zh'): string {
  const zh = lang === 'zh';
  const base = zh ? `${baseUrlFor('zh')}` : SITE;
  const areaOf = (p: any) => String(p.area || '').trim();
  const neighbours = all.filter(p => p.id !== project.id && areaOf(p) && areaOf(p) === areaOf(project)).slice(0, 12);
  const lists = BUYER_SHORTLISTS.filter(sl => { try { return sl.pick(project as any); } catch { return false; } });
  const reviews = BLOG_DATA.filter((b: any) => (b.relatedProjectIds || []).includes(project.id));
  const parts: string[] = [];
  if (neighbours.length) {
    parts.push(`<h3>${zh ? `${escapeXml(areaOf(project))} 的其他楼盘` : `Other projects in ${escapeXml(areaOf(project))}`}</h3>
                <ul style="line-height:1.9;columns:2;">${neighbours.map(n => `<li><a href="${base}/projects/${n.id}">${escapeXml(n.name)}</a></li>`).join('')}</ul>`);
  }
  if (lists.length) {
    parts.push(`<h3>${zh ? '这个楼盘出现在这些清单' : 'Shortlists this project appears on'}</h3>
                <ul style="line-height:1.9;">${lists.map(l => `<li><a href="${SITE}/best/${l.slug}">${escapeXml(l.title)}</a></li>`).join('')}</ul>`);
  }
  if (reviews.length) {
    parts.push(`<h3>${zh ? '我写过的评测' : 'What I have written about it'}</h3>
                <ul style="line-height:1.9;">${reviews.map((b: any) => `<li><a href="${base}/blog/${b.slug}">${escapeXml(b.title)}</a></li>`).join('')}</ul>`);
  }
  parts.push(`<p><a href="${SITE}/projects">${zh ? '全部楼盘' : 'All projects'}</a> &middot; <a href="${SITE}/map">${zh ? '地图' : 'Map'}</a> &middot; <a href="${SITE}/blog">${zh ? '评测与指南' : 'Reviews and guides'}</a> &middot; <a href="https://www.propertyportal.my/project/${project.id}">${zh ? '在 PropertyPortal 查看完整户型和价格' : 'Full layouts and pricing on PropertyPortal'}</a></p>`);
  return `<section style="margin-bottom: 40px;">
              <h2>${zh ? '相关页面' : 'Explore from here'}</h2>
              ${parts.join('\n                ')}
            </section>`;
}

const baseUrlFor = (lang: 'en' | 'zh') => (lang === 'zh' ? `${SITE}/zh` : SITE);

function escapeXml(str?: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Generate Pre-rendered SEO HTML
function renderSeoHtml(
  html: string,
  reqUrl: string,
  targetProject: Project | null = null,
  targetBlog: any = null
): string {
  try {
    const baseUrl = "https://shyanyee.com";
    let title = "Shyan Yee | Malaysia Luxury Properties & Landmark Residences Portal";
    let desc = "Discover 69+ premier Malaysian luxury properties, landmark condominiums, and investment real estate in Kuala Lumpur, Penang & Johor Bahru. Curated by Shyan Yee (REN 46305).";
    let canonical = baseUrl;
    let ogImage = "https://lh3.googleusercontent.com/d/1fAVXiXAlqMY-nv0w5wHt-oBtWl1Td5oS=w1600";

    const jsonLdGraph: any[] = [
      {
        "@type": "RealEstateAgent",
        "@id": `${baseUrl}/#agent`,
        "name": "Shyan Yee | Malaysia Luxury Properties & Landmark Residences Portal",
        "url": baseUrl,
        "logo": "https://lh3.googleusercontent.com/d/1jrGU7WOGJOTL_ORhhYMpjZ7IgMoNavKY",
        "image": "https://lh3.googleusercontent.com/d/1jrGU7WOGJOTL_ORhhYMpjZ7IgMoNavKY",
        "telephone": "+60108278932",
        "email": "shyanyeews@gmail.com",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Kuala Lumpur",
          "addressRegion": "Wilayah Persekutuan",
          "addressCountry": "MY"
        },
        "sameAs": [
          "https://maps.google.com/?cid=3195643739952877602", "https://www.youtube.com/@shyanyee",
          "https://www.instagram.com/shyanyee/",
          "https://www.facebook.com/shyanyeeconsultant/",
          "https://wa.me/60108278932"
        ],
        "priceRange": "$$$$"
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        "url": baseUrl,
        "name": "Shyan Yee Real Estate Portal",
        "description": "Malaysia Luxury Properties & Landmark Residences Catalog and Investment Analysis",
        "publisher": { "@id": `${baseUrl}/#agent` },
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${baseUrl}/projects?search={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      }
    ];
    jsonLdGraph.push(personNode());

    let preRenderedBody = '';

    if (reqUrl === '/') {
      jsonLdGraph.push(...videoObjects('en'));
      const EN = translations['en'] || {};
      const featured = projects.slice(0, 12);
      const guides = BLOG_DATA.slice(0, 8);
      // Crawlable home page: heading, intro and real links (React replaces this on mount).
      preRenderedBody = `<div style="max-width: 1200px; margin: 0 auto; padding: 32px 20px; font-family: system-ui, -apple-system, sans-serif; color: #0f172a;">
        <nav style="margin-bottom: 20px; font-size: 14px;"><a href="${baseUrl}/projects" style="color:#2563eb;text-decoration:none;">Projects</a> &middot; <a href="${baseUrl}/blog" style="color:#2563eb;text-decoration:none;">Guides</a> &middot; <a href="${baseUrl}/faq" style="color:#2563eb;text-decoration:none;">FAQ</a> &middot; <a href="${baseUrl}/calculator" style="color:#2563eb;text-decoration:none;">Loan calculator</a> &middot; <a href="${baseUrl}/compare" style="color:#2563eb;text-decoration:none;">Compare</a> &middot; <a href="${baseUrl}/zh" style="color:#2563eb;text-decoration:none;">中文</a></nav>
        <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 12px;">${EN.title || 'Find Your Perfect Property in Malaysia'}</h1>
        <p style="font-size: 16px; color: #475569; margin-bottom: 24px; line-height: 1.6;">${EN.subtitle || ''}</p>
        <p style="font-size: 15px; color: #334155; margin-bottom: 32px;">${EN.agentIntro || ''} Licensed real estate negotiator Shyan Yee (Yee Woei Shyan, REN 46305), IQI Realty Sdn Bhd.</p>
        <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">${EN.featuredProjects || 'Featured Projects'}</h2>
        <ul style="line-height: 2; font-size: 15px;">${featured.map(p => `<li><a href="${baseUrl}/projects/${p.id}" style="color: #2563eb; text-decoration: none;">${p.name}</a> — ${p.area || p.location}, ${p.tenure || 'Freehold'}, from RM ${fmt(p.startingPrice) || 'contact for price'}</li>`).join('')}</ul>
        <p><a href="${baseUrl}/projects" style="color: #2563eb;">View all ${projects.length} projects &rarr;</a></p>
        <h2 style="font-size: 24px; font-weight: 700; margin: 32px 0 16px;">${EN.blogTitle || 'Malaysia Property Guides'}</h2>
        <ul style="line-height: 2; font-size: 15px;">${guides.map(b => `<li><a href="${baseUrl}/blog/${b.slug}" style="color: #2563eb; text-decoration: none;">${b.title}</a></li>`).join('')}</ul>
        <p><a href="${baseUrl}/blog" style="color: #2563eb;">All guides &rarr;</a> &middot; <a href="${baseUrl}/faq" style="color: #2563eb;">Buyer FAQ &rarr;</a></p>
        <p style="margin-top: 32px;"><a href="https://wa.me/60108278932?text=${encodeURIComponent('Hi Shyan Yee, I would like to enquire about properties in Malaysia.')}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;font-weight:700;text-decoration:none;">WhatsApp Shyan Yee (+60 10-827 8932)</a></p>
      </div>`;
    }

    // Page-specific configurations
    if (reqUrl === '/projects') {
      canonical = `${baseUrl}/projects`;
      title = "Malaysia Landmark Property Projects Catalogue | Floor Plans & Pricing - Shyan Yee";
      desc = "Explore 69+ premier Malaysian property developments including Pavilion Square, Queenswoodz, Amika Residence, Core Residence TRX, Aetas Seputeh & Bangsar Hill Park. View floor plans, developer specs, and pricing.";
      
      jsonLdGraph.push({
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
          { "@type": "ListItem", "position": 2, "name": "Projects", "item": canonical }
        ]
      });

      const listItems = projects.map((p, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "url": `${baseUrl}/projects/${p.id}`,
        "name": p.name,
        "description": `${p.name} by ${(p.developer || '').replace(/\(.*?\)/g, "").trim()} in ${p.area || p.location}. Starts from RM ${p.startingPrice ? p.startingPrice.toLocaleString() : '0'}.`
      }));

      jsonLdGraph.push({
        "@type": "ItemList",
        "@id": `${canonical}#list`,
        "name": "Malaysia Landmark Property Projects Catalogue",
        "numberOfItems": projects.length,
        "itemListElement": listItems
      });

      preRenderedBody = `
        <div style="max-width: 1200px; margin: 0 auto; padding: 32px 20px; font-family: system-ui, -apple-system, sans-serif; color: #0f172a;">
          <nav style="margin-bottom: 24px; font-size: 14px; color: #64748b;">
            <a href="${baseUrl}" style="color: #2563eb; text-decoration: none;">Home</a> &gt; <span>Projects</span>
          </nav>
          <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 12px;">Malaysia Luxury Properties & Landmark Residences Catalogue</h1>
          <p style="font-size: 16px; color: #475569; margin-bottom: 32px; line-height: 1.6;">${desc}</p>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">
            ${projects.map(p => `
              <article style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">
                  <a href="${baseUrl}/projects/${p.id}" style="color: #0f172a; text-decoration: none;">${p.name}</a>
                </h2>
                <p style="font-size: 14px; color: #64748b; margin: 0 0 8px 0;">${p.area}, ${p.location} &bull; ${p.tenure || 'Freehold'}</p>
                <p style="font-size: 16px; font-weight: 700; color: #16a34a; margin: 0 0 12px 0;">
                  From RM ${p.startingPrice ? p.startingPrice.toLocaleString() : 'Contact for Price'}
                </p>
                <p style="font-size: 14px; color: #334155; margin: 0 0 16px 0; line-height: 1.5;">
                  ${p.bedroomsMin}-${p.bedroomsMax} Beds &bull; ${p.builtUpMin ? p.builtUpMin.toLocaleString() : ''}-${p.builtUpMax ? p.builtUpMax.toLocaleString() : ''} sqft &bull; Developer: ${(p.developer || '').replace(/\(.*?\)/g, "").trim()}
                </p>
                <a href="${baseUrl}/projects/${p.id}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none;">
                  View Floor Plans & Pricing &rarr;
                </a>
              </article>
            `).join('')}
          </div>
        </div>
      `;
    } else if (reqUrl === '/blog') {
      canonical = `${baseUrl}/blog`;
      title = "Malaysia Property Insights, Market Analysis & Investment Blogs | Shyan Yee";
      desc = "In-depth research on Malaysia MM2H, real estate pricing trends, luxury residential analysis, foreign buyer guidelines, and expert advice by Shyan Yee (REN 46305).";
      
      jsonLdGraph.push({
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
          { "@type": "ListItem", "position": 2, "name": "Blog", "item": canonical }
        ]
      });

      preRenderedBody = `
        <div style="max-width: 1200px; margin: 0 auto; padding: 32px 20px; font-family: system-ui, -apple-system, sans-serif; color: #0f172a;">
          <nav style="margin-bottom: 24px; font-size: 14px; color: #64748b;">
            <a href="${baseUrl}" style="color: #2563eb; text-decoration: none;">Home</a> &gt; <span>Blog & Insights</span>
          </nav>
          <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 12px;">Malaysia Property Insights & Investment Articles</h1>
          <p style="font-size: 16px; color: #475569; margin-bottom: 32px; line-height: 1.6;">${desc}</p>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px;">
            ${BLOG_DATA.map(b => `
              <article style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                ${b.image ? `<img src="${b.image}" alt="${b.title}" style="width: 100%; height: 180px; object-fit: cover;" />` : ''}
                <div style="padding: 20px;">
                  <span style="display: inline-block; font-size: 12px; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 4px 8px; border-radius: 4px; margin-bottom: 8px;">
                    ${b.category || 'Guide'} &bull; ${b.readTime || '5 min read'}
                  </span>
                  <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 8px 0; line-height: 1.4;">
                    <a href="${baseUrl}/blog/${b.slug}" style="color: #0f172a; text-decoration: none;">${b.title}</a>
                  </h2>
                  <p style="font-size: 14px; color: #475569; margin: 0 0 16px 0; line-height: 1.6;">${b.summary || b.metaDescription}</p>
                  <a href="${baseUrl}/blog/${b.slug}" style="color: #2563eb; font-weight: 600; font-size: 14px; text-decoration: none;">Read Complete Guide &rarr;</a>
                </div>
              </article>
            `).join('')}
          </div>
        </div>
      `;
    } else if (reqUrl === '/faq') {
      canonical = `${baseUrl}/faq`;
      title = "Malaysia Real Estate Buyer FAQ & Foreign Ownership Guidelines | Shyan Yee";
      desc = "Frequently asked questions for buying property in Malaysia as a local, Singaporean, or foreign investor. MM2H requirements, State Consent rules, taxes, and bank loans.";
      
      jsonLdGraph.push({
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
          { "@type": "ListItem", "position": 2, "name": "FAQ", "item": canonical }
        ]
      });

      jsonLdGraph.push({
        "@type": "FAQPage",
        "@id": `${canonical}#faq`,
        "mainEntity": FAQ_DATA.map(f => ({
          "@type": "Question",
          "name": f.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.answer
          }
        }))
      });

      preRenderedBody = `
        <div style="max-width: 1000px; margin: 0 auto; padding: 32px 20px; font-family: system-ui, -apple-system, sans-serif; color: #0f172a;">
          <nav style="margin-bottom: 24px; font-size: 14px; color: #64748b;">
            <a href="${baseUrl}" style="color: #2563eb; text-decoration: none;">Home</a> &gt; <span>Buyer FAQ</span>
          </nav>
          <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 12px;">Malaysia Property Buyer Frequently Asked Questions</h1>
          <p style="font-size: 16px; color: #475569; margin-bottom: 32px; line-height: 1.6;">${desc}</p>
          <div style="display: flex; flex-direction: column; gap: 16px;">
            ${FAQ_DATA.map(f => `
              <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background: #ffffff;">
                <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">${f.question}</h2>
                <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0;">${f.answer}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (reqUrl.startsWith('/best/')) {
      const sl = BUYER_SHORTLISTS.find(x => `/best/${x.slug}` === reqUrl);
      if (sl) {
        const picks = projects.filter(sl.pick).sort(sl.sort || ((a: any, b: any) => (Number(a.startingPrice) || Infinity) - (Number(b.startingPrice) || Infinity)));
        canonical = `${baseUrl}/best/${sl.slug}`;
        title = sl.title;
        desc = sl.desc;
        const reviewFor = (p: any) => reviewOf(p.id);
        const videoFor = (p: any) => HOME_VIDEOS.find(v => v.projectId === p.id);
        jsonLdGraph.push({
          "@type": "CollectionPage", "@id": `${canonical}#page`, "url": canonical, "name": title, "description": desc,
          "isPartOf": { "@id": `${baseUrl}/#website` },
          "mainEntity": { "@type": "ItemList", "numberOfItems": picks.length,
            "itemListElement": picks.map((p: any, i: number) => ({ "@type": "ListItem", "position": i + 1, "name": p.name, "url": `${baseUrl}/projects/${p.id}` })) }
        });
        const rows = picks.map((p: any) => {
          const r = reviewFor(p); const v = videoFor(p);
          const extras = [
            r ? `<a href="${baseUrl}/blog/${r.slug}" style="color:#2563eb;text-decoration:none;">Read my review</a>` : '',
            v ? `<a href="https://www.youtube.com/watch?v=${v.youtubeId}" style="color:#2563eb;text-decoration:none;">Walkthrough video</a>` : ''
          ].filter(Boolean).join(' &middot; ') || '<span style="color:#94a3b8;">Developer data only</span>';
          const cell = 'style="padding:8px 10px;border-bottom:1px solid #f1f5f9;"';
          return `<tr><td ${cell}><a href="${baseUrl}/projects/${p.id}" style="color:#0f172a;font-weight:700;text-decoration:none;">${escapeXml(p.name)}</a></td>`
            + (sl.column ? `<td ${cell}><strong>${escapeXml(sl.column.cell(p))}</strong></td>` : '')
            + `<td ${cell}>${escapeXml(p.area || '')}</td><td ${cell}>${escapeXml(p.tenure || '')}</td><td ${cell}>${escapeXml(p.startingPriceFormatted || p.priceRange || '')}</td><td ${cell}>${escapeXml(p.builtUpMin ? `${p.builtUpMin}-${p.builtUpMax} sq ft` : '')}</td><td ${cell}>${extras}</td></tr>`;
        }).join('');
        preRenderedBody = `
          <div style="max-width: 1100px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, sans-serif;">
            <nav style="margin-bottom: 24px; font-size: 14px; color: #64748b;"><a href="${baseUrl}" style="color:#2563eb;text-decoration:none;">Home</a> &gt; <a href="${baseUrl}/projects" style="color:#2563eb;text-decoration:none;">Projects</a> &gt; <span>${escapeXml(sl.title)}</span></nav>
            <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 12px;">${escapeXml(sl.h1)}</h1>
            <p style="font-size: 16px; color: #475569; margin-bottom: 24px; line-height: 1.6;">${escapeXml(sl.blurb)}</p>
            <h2 style="font-size: 20px; font-weight: 700; margin: 24px 0 12px;">${picks.length} project${picks.length === 1 ? '' : 's'}, cheapest first</h2>
            <table style="border-collapse:collapse;width:100%;font-size:14px;"><thead><tr>${['Project', ...(sl.column ? [sl.column.head] : []), 'Area', 'Tenure', 'From', 'Built-up', 'My coverage'].map(h => `<th style="text-align:left;padding:8px 10px;border-bottom:2px solid #e2e8f0;color:#0f172a;">${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
            <p style="font-size:13px;color:#64748b;margin-top:16px;">Prices are developer list prices and change with each release. Confirm the current price list before deciding.</p>
            <h2 style="font-size: 20px; font-weight: 700; margin: 28px 0 10px;">Other shortlists</h2>
            <ul style="line-height:1.9;">${BUYER_SHORTLISTS.filter(o => o.slug !== sl.slug).map(o => `<li><a href="${baseUrl}/best/${o.slug}" style="color:#2563eb;text-decoration:none;">${escapeXml(o.title)}</a></li>`).join('')}</ul>
            <p style="margin-top:24px;font-size:15px;color:#334155;">Viewings and the current price list: Yee Woei Shyan (REN 46305), IQI Realty Sdn Bhd &mdash; WhatsApp <a href="https://wa.me/60108278932" style="color:#2563eb;text-decoration:none;">+60 10-827 8932</a>.</p>
          </div>
        `;
      }
    } else if (reqUrl.startsWith('/developer/') || reqUrl.startsWith('/completion/')) {
      const dev = DEVELOPERS.find(d => `/developer/${d.slug}` === reqUrl);
      const yr = COMPLETION_YEARS.find(y => `/completion/${y.year}` === reqUrl);
      const items = dev ? dev.items : yr ? yr.items : [];
      if (items.length) {
        const label = dev ? dev.name : `${yr!.year}`;
        canonical = `${baseUrl}${reqUrl}`;
        const prices = items.map((p: any) => Number(p.startingPrice) || 0).filter(n => n > 0);
        const lo = prices.length ? Math.min(...prices) : 0;
        const hi = prices.length ? Math.max(...prices) : 0;
        const freehold = items.filter((p: any) => /freehold/i.test(String(p.tenure || ''))).length;
        const areasHere = [...new Set(items.map((p: any) => String(p.area || '').trim()).filter(Boolean))];
        title = dev
          ? `${label} Projects in Malaysia | Every Launch, Price and Completion Year`
          : `New Launch Projects Completing in ${label} | Prices, Areas and Layouts`;
        desc = dev
          ? `All ${items.length} ${label} projects on shyanyee.com${lo ? `, from RM ${lo.toLocaleString()}` : ''}. Tenure, built-up, completion year, nearest station, and the ones I have reviewed or filmed.`
          : `${items.length} projects scheduled for completion in ${label}${lo ? `, from RM ${lo.toLocaleString()}` : ''}. Areas, tenure, sizes and nearest station, measured.`;
        jsonLdGraph.push({
          "@type": "CollectionPage", "@id": `${canonical}#page`, "url": canonical, "name": title, "description": desc,
          "isPartOf": { "@id": `${baseUrl}/#website` },
          ...(dev ? { "about": { "@type": "Organization", "name": label } } : {}),
          "mainEntity": { "@type": "ItemList", "numberOfItems": items.length,
            "itemListElement": items.map((p: any, i: number) => ({ "@type": "ListItem", "position": i + 1, "name": p.name, "url": `${baseUrl}/projects/${p.id}` })) }
        });
        jsonLdGraph.push({
          "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumb`,
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Projects", "item": `${baseUrl}/projects` },
            { "@type": "ListItem", "position": 3, "name": dev ? label : `Completing ${label}`, "item": canonical }
          ]
        });
        const rows = items.slice().sort((a: any, b: any) => (Number(a.startingPrice) || Infinity) - (Number(b.startingPrice) || Infinity))
          .map((p: any) => projectRowHtml(p, baseUrl)).join('');
        preRenderedBody = `
          <div style="max-width: 1200px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, sans-serif; color:#0f172a;">
            <nav style="margin-bottom: 24px; font-size: 14px; color: #64748b;"><a href="${baseUrl}" style="color:#2563eb;text-decoration:none;">Home</a> &gt; <a href="${baseUrl}/projects" style="color:#2563eb;text-decoration:none;">Projects</a> &gt; <span>${escapeXml(dev ? label : `Completing ${label}`)}</span></nav>
            <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 12px;">${dev ? `${escapeXml(label)} Projects` : `Projects Completing in ${escapeXml(label)}`}</h1>
            <p style="font-size: 16px; color: #475569; line-height: 1.7;">${escapeXml(desc)}</p>
            <p style="font-size: 15px; color: #475569; line-height: 1.7;">
              ${items.length} project${items.length === 1 ? '' : 's'} on this page.
              ${lo && hi ? `Developer list prices run from RM ${lo.toLocaleString()} to RM ${hi.toLocaleString()}.` : ''}
              ${freehold ? `${freehold} ${freehold === 1 ? 'is' : 'are'} freehold.` : ''}
              ${areasHere.length ? `Areas covered: ${escapeXml(areasHere.join(', '))}.` : ''}
            </p>
            <table style="border-collapse:collapse;width:100%;font-size:14px;margin-top:24px;"><thead><tr>${['Project', 'Area', 'Tenure', 'From', 'Built-up', 'Completion', 'Nearest station', 'My coverage'].map(h => `<th style="text-align:left;padding:8px 10px;border-bottom:2px solid #e2e8f0;">${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
            <p style="font-size:13px;color:#64748b;margin-top:16px;">Station distances are straight-line measurements on OpenStreetMap. Prices are developer list prices and change with each release.</p>
            ${areasHere.length ? `<h2 style="font-size:20px;margin-top:32px;">Areas</h2><ul style="line-height:1.9;columns:2;">${areasHere.map(a => `<li><a href="${baseUrl}/area/${areaSlug(a)}">${escapeXml(a)}</a></li>`).join('')}</ul>` : ''}
            <p style="margin-top:24px;font-size:15px;color:#334155;">Viewings and the current price list: Yee Woei Shyan (REN 46305), IQI Realty Sdn Bhd &mdash; WhatsApp <a href="https://wa.me/60108278932" style="color:#2563eb;text-decoration:none;">+60 10-827 8932</a>.</p>
            ${siteLinksHtml('en')}
          </div>
        `;
      }
    } else if (reqUrl.startsWith('/compare/')) {
      const pair = COMPARE_PAIRS.find(x => `/compare/${x.slug}` === reqUrl);
      if (pair) {
        const { a, b } = pair as any;
        canonical = `${baseUrl}/compare/${pair.slug}`;
        const ca = coverageOf(a), cb = coverageOf(b);
        const covered = [ca, cb].filter(c => c.review || c.video).length;
        title = `${a.name} or ${b.name}? What I Have Seen of Each | ${pair.area}`;
        desc = `${a.name} and ${b.name} are both in ${pair.area} and close in price, so buyers ask me to choose. Which one I have walked or filmed, the measured walk to a station, and where they differ.`;
        jsonLdGraph.push({
          "@type": "WebPage", "@id": `${canonical}#page`, "url": canonical, "name": title, "description": desc,
          "isPartOf": { "@id": `${baseUrl}/#website` },
          "about": [{ "@type": "ApartmentComplex", "name": a.name }, { "@type": "ApartmentComplex", "name": b.name }]
        });
        jsonLdGraph.push({
          "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumb`,
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Projects", "item": `${baseUrl}/projects` },
            { "@type": "ListItem", "position": 3, "name": `${a.name} vs ${b.name}`, "item": canonical }
          ]
        });
        const coverageLine = (p: any, c: ReturnType<typeof coverageOf>) => {
          const bits: string[] = [];
          if (c.review) bits.push(`I wrote it up: <a href="${baseUrl}/blog/${c.review.slug}">${escapeXml(c.review.title)}</a>`);
          if (c.video) bits.push(`I filmed it: <a href="https://www.youtube.com/watch?v=${c.video.youtubeId}">walkthrough video</a>`);
          if (!bits.length) bits.push('I have not walked this one yet — the page carries the developer data only.');
          return `<li><a href="${baseUrl}/projects/${p.id}"><strong>${escapeXml(p.name)}</strong></a> — ${bits.join('; ')}</li>`;
        };
        const row = (label: string, av: string, bv: string) =>
          `<tr><th style="text-align:left;padding:8px 10px;border-bottom:1px solid #f1f5f9;width:26%;font-weight:600;color:#475569;">${label}</th>`
          + `<td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;">${escapeXml(av || '—')}</td>`
          + `<td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;">${escapeXml(bv || '—')}</td></tr>`;
        const stationCell = (c: ReturnType<typeof coverageOf>) =>
          c.station ? `${c.station.name} ${c.station.km < 1 ? `${Math.round(c.station.km * 1000)} m` : `${c.station.km.toFixed(1)} km`}` : '';
        const size = (p: any) => p.builtUpMin ? `${p.builtUpMin}-${p.builtUpMax} sq ft` : '';
        preRenderedBody = `
          <div style="max-width: 1000px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, sans-serif; color:#0f172a;">
            <nav style="margin-bottom: 24px; font-size: 14px; color: #64748b;"><a href="${baseUrl}" style="color:#2563eb;text-decoration:none;">Home</a> &gt; <a href="${baseUrl}/projects" style="color:#2563eb;text-decoration:none;">Projects</a> &gt; <span>${escapeXml(a.name)} vs ${escapeXml(b.name)}</span></nav>
            <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 12px;">${escapeXml(a.name)} or ${escapeXml(b.name)}?</h1>
            <p style="font-size: 16px; color: #475569; line-height: 1.7;">Both are in ${escapeXml(pair.area)} and within reach of the same budget, which is why this pair comes up. ${covered ? `I have been through ${covered === 2 ? 'both' : 'one'} of them.` : 'I have not walked either of these yet.'}</p>
            <h2 style="font-size:20px;margin-top:28px;">What I have seen of each</h2>
            <ul style="line-height:1.9;">${coverageLine(a, ca)}${coverageLine(b, cb)}</ul>
            <h2 style="font-size:20px;margin-top:28px;">Where they differ</h2>
            <table style="border-collapse:collapse;width:100%;font-size:14px;margin-top:12px;">
              <thead><tr><th style="text-align:left;padding:8px 10px;border-bottom:2px solid #e2e8f0;"></th><th style="text-align:left;padding:8px 10px;border-bottom:2px solid #e2e8f0;">${escapeXml(a.name)}</th><th style="text-align:left;padding:8px 10px;border-bottom:2px solid #e2e8f0;">${escapeXml(b.name)}</th></tr></thead>
              <tbody>
                ${row('Starting price', a.startingPriceFormatted || a.priceRange || '', b.startingPriceFormatted || b.priceRange || '')}
                ${row('Built-up', size(a), size(b))}
                ${row('Tenure', a.tenure || '', b.tenure || '')}
                ${row('Developer', a.developer || '', b.developer || '')}
                ${row('Completion', String(a.completionYear || ''), String(b.completionYear || ''))}
                ${row('Maintenance, 1,000 sq ft', (() => { const m = monthlyOn1000(a); return m === null ? '' : `RM ${m.toLocaleString()} a month`; })(), (() => { const m = monthlyOn1000(b); return m === null ? '' : `RM ${m.toLocaleString()} a month`; })())}
                ${row('Nearest station, measured', stationCell(ca), stationCell(cb))}
              </tbody>
            </table>
            <p style="font-size:13px;color:#64748b;margin-top:12px;">Station distances are straight-line measurements on OpenStreetMap; the walk is longer. Prices are developer list prices and change with each release.</p>
            <h2 style="font-size:20px;margin-top:28px;">The full spec sheets</h2>
            <p style="font-size:15px;line-height:1.8;">Layout tables, facilities and floor plans for both sit on the portal: <a href="https://www.propertyportal.my/project/${a.id}">${escapeXml(a.name)}</a> and <a href="https://www.propertyportal.my/project/${b.id}">${escapeXml(b.name)}</a>.</p>
            <p style="margin-top:20px;font-size:15px;color:#334155;">Want to walk both on the same day? They are in the same area, so that is usually possible. WhatsApp Yee Woei Shyan (REN 46305), IQI Realty Sdn Bhd &mdash; <a href="https://wa.me/60108278932" style="color:#2563eb;text-decoration:none;">+60 10-827 8932</a>.</p>
            ${siteLinksHtml('en')}
          </div>
        `;
      }
    } else if (reqUrl.startsWith('/near/')) {
      const st = STATIONS.find(x => `/near/${x.slug}` === reqUrl);
      if (st) {
        canonical = `${baseUrl}/near/${st.slug}`;
        const nearest = st.items[0];
        const walkable = st.items.filter(x => x.km <= 1).length;
        title = `New Launch Projects Near ${st.name} Station | Measured Walking Distance`;
        desc = `${st.items.length} new launch projects near ${st.name} station${st.codes.length ? ` (${st.codes.join(', ')})` : ''}. Nearest is ${nearest.p.name} at ${nearest.km < 1 ? `${Math.round(nearest.km * 1000)} m` : `${nearest.km.toFixed(1)} km`}. Distances measured on OpenStreetMap, not claimed by the developer.`;
        jsonLdGraph.push({
          "@type": "CollectionPage", "@id": `${canonical}#page`, "url": canonical, "name": title, "description": desc,
          "isPartOf": { "@id": `${baseUrl}/#website` },
          "about": { "@type": "TrainStation", "name": `${st.name} station`, ...(st.codes.length ? { "alternateName": st.codes } : {}) },
          "mainEntity": { "@type": "ItemList", "numberOfItems": st.items.length,
            "itemListElement": st.items.map((x, i) => ({ "@type": "ListItem", "position": i + 1, "name": x.p.name, "url": `${baseUrl}/projects/${x.p.id}` })) }
        });
        jsonLdGraph.push({
          "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumb`,
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Projects", "item": `${baseUrl}/projects` },
            { "@type": "ListItem", "position": 3, "name": `Near ${st.name} station`, "item": canonical }
          ]
        });
        const td = 'style="padding:8px 10px;border-bottom:1px solid #f1f5f9;"';
        const rows = st.items.map(({ p, km }: any) => {
          const rev = reviewOf(p.id);
          const vid = HOME_VIDEOS.find(v => v.projectId === p.id);
          const mine = [
            rev ? `<a href="${baseUrl}/blog/${rev.slug}">Review</a>` : '',
            vid ? `<a href="https://www.youtube.com/watch?v=${vid.youtubeId}">Video</a>` : ''
          ].filter(Boolean).join(' &middot; ') || '<span style="color:#94a3b8;">Developer data only</span>';
          return `<tr><td ${td}><strong>${km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`}</strong></td>`
            + `<td ${td}><a href="${baseUrl}/projects/${p.id}" style="color:#0f172a;font-weight:700;text-decoration:none;">${escapeXml(p.name)}</a></td>`
            + `<td ${td}>${escapeXml(p.area || '')}</td>`
            + `<td ${td}>${escapeXml(p.tenure || '')}</td>`
            + `<td ${td}>${escapeXml(p.startingPriceFormatted || p.priceRange || '')}</td>`
            + `<td ${td}>${p.builtUpMin ? `${p.builtUpMin}-${p.builtUpMax} sq ft` : ''}</td>`
            + `<td ${td}>${escapeXml(String(p.completionYear || ''))}</td>`
            + `<td ${td}>${mine}</td></tr>`;
        }).join('');
        const areasHere = [...new Set(st.items.map(x => String((x.p as any).area || '').trim()).filter(Boolean))];
        const otherStations = STATIONS.filter(x => x.slug !== st.slug).slice(0, 12);
        preRenderedBody = `
          <div style="max-width: 1200px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, sans-serif; color:#0f172a;">
            <nav style="margin-bottom: 24px; font-size: 14px; color: #64748b;"><a href="${baseUrl}" style="color:#2563eb;text-decoration:none;">Home</a> &gt; <a href="${baseUrl}/projects" style="color:#2563eb;text-decoration:none;">Projects</a> &gt; <span>Near ${escapeXml(st.name)} station</span></nav>
            <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 12px;">New Launch Projects Near ${escapeXml(st.name)} Station</h1>
            <p style="font-size: 16px; color: #475569; line-height: 1.7;">
              ${st.items.length} projects sit within measuring distance of ${escapeXml(st.name)} station${st.codes.length ? ` (${escapeXml(st.codes.join(', '))})` : ''}.
              The closest is <strong>${escapeXml(nearest.p.name)}</strong> at ${nearest.km < 1 ? `${Math.round(nearest.km * 1000)} m` : `${nearest.km.toFixed(1)} km`}.
              ${walkable ? `${walkable} of them ${walkable === 1 ? 'is' : 'are'} within a kilometre.` : ''}
            </p>
            <p style="font-size: 15px; color: #475569; line-height: 1.7;">
              Every distance here is measured from the project's own coordinates to the station on OpenStreetMap, in a straight line.
              It is not a figure taken from a brochure, and the walk is always longer than the straight line.
            </p>
            <table style="border-collapse:collapse;width:100%;font-size:14px;margin-top:24px;"><thead><tr>${['Distance', 'Project', 'Area', 'Tenure', 'From', 'Built-up', 'Completion', 'My coverage'].map(h => `<th style="text-align:left;padding:8px 10px;border-bottom:2px solid #e2e8f0;">${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
            <p style="font-size:13px;color:#64748b;margin-top:16px;">Prices are developer list prices and change with each release. Ask me for the current price list.</p>
            ${areasHere.length ? `<h2 style="font-size:20px;margin-top:32px;">Areas around this station</h2><ul style="line-height:1.9;">${areasHere.map(a => `<li><a href="${baseUrl}/area/${areaSlug(a)}">${escapeXml(a)}</a></li>`).join('')}</ul>` : ''}
            <h2 style="font-size:20px;margin-top:32px;">Other stations</h2>
            <ul style="line-height:1.9;columns:2;">${otherStations.map(x => `<li><a href="${baseUrl}/near/${x.slug}">${escapeXml(x.name)} (${x.items.length})</a></li>`).join('')}</ul>
            <p style="margin-top:24px;font-size:15px;color:#334155;">Viewings and the current price list: Yee Woei Shyan (REN 46305), IQI Realty Sdn Bhd &mdash; WhatsApp <a href="https://wa.me/60108278932" style="color:#2563eb;text-decoration:none;">+60 10-827 8932</a>.</p>
            ${siteLinksHtml('en')}
          </div>
        `;
      }
    } else if (reqUrl.startsWith('/area/')) {
      const ar = AREAS.find(a => `/area/${a.slug}` === reqUrl);
      if (ar) {
        canonical = `${baseUrl}/area/${ar.slug}`;
        title = `New Launch Projects in ${ar.name}, Malaysia | Prices, Layouts & My Reviews`;
        const prices = ar.items.map(p => Number((p as any).startingPrice) || 0).filter(n => n > 0);
        const lo = prices.length ? Math.min(...prices) : 0;
        const hi = prices.length ? Math.max(...prices) : 0;
        const freehold = ar.items.filter(p => /freehold/i.test(String((p as any).tenure || ''))).length;
        desc = `${ar.items.length} new launch and recent project${ar.items.length === 1 ? '' : 's'} in ${ar.name}${lo ? `, from RM ${lo.toLocaleString()}` : ''}. Tenure, built-up sizes, completion year and the ones I have reviewed or filmed.`;
        jsonLdGraph.push({
          "@type": "CollectionPage", "@id": `${canonical}#page`, "url": canonical, "name": title, "description": desc,
          "isPartOf": { "@id": `${baseUrl}/#website` },
          "mainEntity": { "@type": "ItemList", "numberOfItems": ar.items.length,
            "itemListElement": ar.items.map((p, i) => ({ "@type": "ListItem", "position": i + 1, "name": p.name, "url": `${baseUrl}/projects/${p.id}` })) }
        });
        jsonLdGraph.push({
          "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumb`,
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Projects", "item": `${baseUrl}/projects` },
            { "@type": "ListItem", "position": 3, "name": ar.name, "item": canonical }
          ]
        });
        const rows = ar.items
          .slice()
          .sort((a: any, b: any) => (Number(a.startingPrice) || Infinity) - (Number(b.startingPrice) || Infinity))
          .map((p: any) => {
            const rev = reviewOf(p.id);
            const vid = HOME_VIDEOS.find(v => v.projectId === p.id);
            const station = (NEARBY_OSM[p.id] || []).find(n => n.category === 'Train stations');
            const mine = [
              rev ? `<a href="${baseUrl}/blog/${rev.slug}">Review</a>` : '',
              vid ? `<a href="https://www.youtube.com/watch?v=${vid.youtubeId}">Video</a>` : ''
            ].filter(Boolean).join(' &middot; ') || '<span style="color:#94a3b8;">Developer data only</span>';
            const td = 'style="padding:8px 10px;border-bottom:1px solid #f1f5f9;"';
            return `<tr><td ${td}><a href="${baseUrl}/projects/${p.id}" style="color:#0f172a;font-weight:700;text-decoration:none;">${escapeXml(p.name)}</a></td>`
              + `<td ${td}>${escapeXml(p.developer || '')}</td>`
              + `<td ${td}>${escapeXml(p.tenure || '')}</td>`
              + `<td ${td}>${escapeXml(p.startingPriceFormatted || p.priceRange || '')}</td>`
              + `<td ${td}>${p.builtUpMin ? `${p.builtUpMin}-${p.builtUpMax} sq ft` : ''}</td>`
              + `<td ${td}>${escapeXml(String(p.completionYear || ''))}</td>`
              + `<td ${td}>${station ? `${escapeXml(station.name)} ${station.km < 1 ? `${Math.round(station.km * 1000)} m` : `${station.km.toFixed(1)} km`}` : ''}</td>`
              + `<td ${td}>${mine}</td></tr>`;
          }).join('');
        const nearbyAreas = AREAS.filter(a => a.slug !== ar.slug).slice(0, 8);
        preRenderedBody = `
          <div style="max-width: 1200px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, sans-serif; color:#0f172a;">
            <nav style="margin-bottom: 24px; font-size: 14px; color: #64748b;"><a href="${baseUrl}" style="color:#2563eb;text-decoration:none;">Home</a> &gt; <a href="${baseUrl}/projects" style="color:#2563eb;text-decoration:none;">Projects</a> &gt; <span>${escapeXml(ar.name)}</span></nav>
            <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 12px;">New Launch Projects in ${escapeXml(ar.name)}</h1>
            <p style="font-size: 16px; color: #475569; line-height: 1.7; margin-bottom: 8px;">${escapeXml(desc)}</p>
            <p style="font-size: 15px; color: #475569; line-height: 1.7;">
              ${ar.items.length} project${ar.items.length === 1 ? '' : 's'} on this page.
              ${lo && hi ? `Developer list prices run from RM ${lo.toLocaleString()} to RM ${hi.toLocaleString()}.` : ''}
              ${freehold ? `${freehold} of them ${freehold === 1 ? 'is' : 'are'} freehold.` : ''}
              Distances to the nearest train station are measured on OpenStreetMap in a straight line, so the walk is longer.
            </p>
            <table style="border-collapse:collapse;width:100%;font-size:14px;margin-top:24px;"><thead><tr>${['Project', 'Developer', 'Tenure', 'From', 'Built-up', 'Completion', 'Nearest station', 'My coverage'].map(h => `<th style="text-align:left;padding:8px 10px;border-bottom:2px solid #e2e8f0;">${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
            <p style="font-size:13px;color:#64748b;margin-top:16px;">Prices are developer list prices and change with each release. Ask me for the current price list before deciding.</p>
            <h2 style="font-size:20px;margin-top:32px;">Nearby areas</h2>
            <ul style="line-height:1.9;columns:2;">${nearbyAreas.map(a => `<li><a href="${baseUrl}/area/${a.slug}">${escapeXml(a.name)} (${a.items.length})</a></li>`).join('')}</ul>
            <p style="margin-top:24px;font-size:15px;color:#334155;">Viewings and the current price list: Yee Woei Shyan (REN 46305), IQI Realty Sdn Bhd &mdash; WhatsApp <a href="https://wa.me/60108278932" style="color:#2563eb;text-decoration:none;">+60 10-827 8932</a>.</p>
            ${siteLinksHtml('en')}
          </div>
        `;
      }
    } else if (reqUrl === '/calculator') {
      canonical = `${baseUrl}/calculator`;
      title = "Malaysia Property Loan & Stamp Duty Calculator | Shyan Yee";
      desc = "Calculate monthly home loan repayments, progressive interest, legal fees and stamp duty (MOT) for properties in Malaysia.";
    } else if (reqUrl === '/compare') {
      canonical = `${baseUrl}/compare`;
      title = "Compare Landmark Properties in Malaysia | Side-by-Side Spec Matrix";
      desc = "Compare prices, developer credentials, maintenance fees, car park allocations, and completion years side-by-side for Malaysian luxury properties.";
    } else if (reqUrl === '/map') {
      canonical = `${baseUrl}/map`;
      title = "Interactive Real Estate Map of Malaysia | Pinpoint Luxury Homes";
      desc = "Pinpoint luxury residences across Kuala Lumpur, Johor Bahru and Penang on our interactive GIS map, detailing proximity to transit, malls, and premium landmarks.";
    }

    // Individual Project Page Override
    if (targetProject) {
      const cleanDev = (targetProject.developer || '').replace(/\(.*?\)/g, "").trim();
      const priceStr = targetProject.startingPrice ? `RM ${targetProject.startingPrice.toLocaleString()}` : '';
      
      canonical = `${baseUrl}/projects/${targetProject.id}`;
      title = `${targetProject.name} ${targetProject.area} | Price, Floor Plan, Review & Sales - Shyan Yee`;
      desc = `${targetProject.name} is a landmark ${targetProject.projectType || 'Serviced Residence'} residence by ${cleanDev} in ${targetProject.location}, ${targetProject.area}. Layouts range from ${targetProject.bedroomsMin}-${targetProject.bedroomsMax} bedrooms (${targetProject.builtUpMin ? targetProject.builtUpMin.toLocaleString() : ''}-${targetProject.builtUpMax ? targetProject.builtUpMax.toLocaleString() : ''} sqft). ${priceStr ? 'Prices start from ' + priceStr + '.' : ''} Official floor plans, layout specs, and VIP showroom appointments with licensed agent Shyan Yee (REN 46305).`;

      if (targetProject.images && targetProject.images.overview && targetProject.images.overview[0]) {
        ogImage = targetProject.images.overview[0];
      }

      // Add Product Schema
      jsonLdGraph.push({
        "@type": "Product",
        "@id": `${canonical}#product`,
        "name": `${targetProject.name} (${targetProject.area}, ${targetProject.location})`,
        "description": desc,
        "image": [ogImage],
        "category": "Real Estate > Residential Property",
        "brand": {
          "@type": "Brand",
          "name": cleanDev || "Malaysia Premier Developers"
        },
        "offers": {
          "@type": "Offer",
          "price": (targetProject.startingPrice || 500000).toString(),
          "priceCurrency": "MYR",
          "priceValidUntil": "2027-12-31",
          "itemCondition": "https://schema.org/NewCondition",
          "availability": "https://schema.org/InStock",
          "url": canonical
        }
      });

      // Add Accommodation Schema
      jsonLdGraph.push({
        "@type": ["Accommodation", "ApartmentComplex"],
        "@id": `${canonical}#accommodation`,
        "name": targetProject.name,
        "description": desc,
        "url": canonical,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": targetProject.area,
          "addressRegion": targetProject.location,
          "addressCountry": "MY"
        },
        "numberOfRooms": `${targetProject.bedroomsMin} to ${targetProject.bedroomsMax} bedrooms`
      });

      const checked = checkedOn(targetProject);
      if (checked) jsonLdGraph.push({ "@type": "WebPage", "@id": `${canonical}#webpage`, "url": canonical, "dateModified": checked, "isPartOf": { "@id": `${baseUrl}/#website` } });
      const projVideo = projectVideoObject(targetProject.id, 'en');
      if (projVideo) jsonLdGraph.push(projVideo);

      // Add RealEstateListing Schema
      jsonLdGraph.push({
        "@type": "RealEstateListing",
        "@id": `${canonical}#listing`,
        "name": `${targetProject.name} Luxury Residences`,
        "description": desc,
        "url": canonical,
        "image": ogImage,
        "offers": {
          "@type": "Offer",
          "priceCurrency": "MYR",
          "price": targetProject.startingPrice ? targetProject.startingPrice.toString() : "500000",
          "url": canonical
        },
        "itemOffered": {
          "@type": "Residence",
          "name": targetProject.name,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": targetProject.area,
            "addressRegion": targetProject.location,
            "addressCountry": "MY"
          }
        }
      });

      // Add BreadcrumbList Schema
      jsonLdGraph.push({
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
          { "@type": "ListItem", "position": 2, "name": "Projects", "item": `${baseUrl}/projects` },
          { "@type": "ListItem", "position": 3, "name": targetProject.name, "item": canonical }
        ]
      });

      const faqs = [
        {
          q: `What is the starting price for ${targetProject.name}?`,
          a: `Starting price for ${targetProject.name} is ${priceStr || 'available upon inquiry'}, located in ${targetProject.area}, ${targetProject.location}.`
        },
        {
          q: `Who is the developer of ${targetProject.name}?`,
          a: `${targetProject.name} is developed by ${cleanDev}.`
        },
        {
          q: `What layouts and sizes are available at ${targetProject.name}?`,
          a: `${targetProject.name} offers unit sizes from ${targetProject.builtUpMin ? targetProject.builtUpMin.toLocaleString() : ''} sqft to ${targetProject.builtUpMax ? targetProject.builtUpMax.toLocaleString() : ''} sqft, with ${targetProject.bedroomsMin} to ${targetProject.bedroomsMax} bedrooms.`
        },
        {
          q: `How can I get floor plans or book a private showroom viewing for ${targetProject.name}?`,
          a: `You can view floor plans and request a private viewing with licensed agent Shyan Yee (REN 46305) via WhatsApp at +60 10-827 8932 or on shyanyee.com.`
        }
      ];

      // Add FAQPage Schema
      jsonLdGraph.push({
        "@type": "FAQPage",
        "@id": `${canonical}#faq`,
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a
          }
        }))
      });

      preRenderedBody = `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 1200px; margin: 0 auto; padding: 24px; color: #111827;">
          <nav style="margin-bottom: 24px; font-size: 14px; color: #64748b;">
            <a href="${baseUrl}" style="color: #2563eb; text-decoration: none;">Home</a> &gt; 
            <a href="${baseUrl}/projects" style="color: #2563eb; text-decoration: none;">Projects</a> &gt; 
            <span>${targetProject.name}</span>
          </nav>

          <header style="margin-bottom: 32px; border-bottom: 1px solid #e5e7eb; padding-bottom: 24px;">
            <p style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #dc2626; margin: 0 0 8px 0;">
              Licensed Property Specialist: Shyan Yee (REN 46305)
            </p>
            <h1 style="font-size: 32px; font-weight: 800; margin-top: 8px; margin-bottom: 8px;">${targetProject.name} (${targetProject.area}, ${targetProject.location})</h1>
            <p style="font-size: 18px; color: #4b5563; line-height: 1.6;">${desc}</p>
          </header>

          <main>
            <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 40px;">
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
                <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">Property Key Specs</h2>
                <ul style="list-style: none; padding: 0; margin: 0; line-height: 2.2; font-size: 15px;">
                  <li><strong>Developer:</strong> ${cleanDev}</li>
                  <li><strong>Location:</strong> ${targetProject.area}, ${targetProject.location}</li>
                  <li><strong>Tenure:</strong> ${targetProject.tenure || 'Freehold'}</li>
                  <li><strong>Property Type:</strong> ${targetProject.projectType || 'Serviced Residence'}</li>
                  <li><strong>Starting Price:</strong> <span style="color: #16a34a; font-weight: 700;">${priceStr || 'Contact Agent for Sales Sheet'}</span></li>
                  <li><strong>Bedrooms:</strong> ${targetProject.bedroomsMin} - ${targetProject.bedroomsMax} Beds</li>
                  <li><strong>Built-up Sizes:</strong> ${targetProject.builtUpMin ? targetProject.builtUpMin.toLocaleString() : ''} - ${targetProject.builtUpMax ? targetProject.builtUpMax.toLocaleString() : ''} sqft</li>
                  <li><strong>Maintenance Fee:</strong> ${escapeXml(feeLabel(targetProject))}${(() => { const m = monthlyOn1000(targetProject); return m === null ? '' : ` &mdash; about <strong>RM ${m.toLocaleString()} a month</strong> on a 1,000 sq ft unit`; })()}</li>
                  <li><strong>Completion:</strong> ${targetProject.completionStatus || 'Under Construction'} ${targetProject.completionYear ? '(' + targetProject.completionYear + ')' : ''}</li>
                </ul>
                ${(() => { const c = checkedOn(targetProject); return c ? `<p style="font-size:13px;color:#64748b;margin:12px 0 0;">Checked against the developer's own document on ${prettyDate(c)}. Price lists change with each release — ask me for the current one.</p>` : ''; })()}
              </div>

              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <h2 style="font-size: 20px; font-weight: 700; color: #166534; margin-top: 0; margin-bottom: 12px;">Agent Private VIP Sales Inquiry</h2>
                  <p style="color: #15803d; margin-bottom: 20px; line-height: 1.6; font-size: 15px;">
                    Connect directly with licensed real estate negotiator <strong>Shyan Yee (REN 46305)</strong> for official floor plans, unit availability, dynamic loan calculations, and private showroom appointments.
                  </p>
                </div>
                <a href="https://wa.me/60108278932?text=Hi%20Shyan%20Yee,%20I%20am%20interested%20in%20${encodeURIComponent(targetProject.name)}" 
                   style="display: inline-block; background: #16a34a; color: white; padding: 14px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; text-align: center; font-size: 16px;">
                   WhatsApp Agent Shyan Yee (+60 10-827 8932)
                </a>
              </div>
            </section>

            ${targetProject.images ? (() => {
              const galleryUrls = [
                ...(Array.isArray(targetProject.images.overview) ? targetProject.images.overview : []),
                ...(Array.isArray(targetProject.images.gallery) ? targetProject.images.gallery : []),
                ...(Array.isArray(targetProject.images.location) ? targetProject.images.location : [])
              ].filter(Boolean);
              if (galleryUrls.length === 0) return '';
              const alt = escapeXml(`${targetProject.name} — ${targetProject.area}`);
              return `
            <section style="margin-bottom: 40px;">
              <h2>Gallery</h2>
              ${galleryUrls.map(url => `<img src="${url}" alt="${alt}" loading="lazy" width="800" style="max-width:100%;height:auto;border-radius:8px;margin-bottom:12px;">`).join('\n              ')}
            </section>`;
            })() : ''}

            ${projectLayoutsHtml(targetProject.id, 'en')}

            ${(() => {
              const plans = (targetProject.layouts || []).filter(l => l.image);
              if (!plans.length) return '';
              // The floor-plan images are real files from the project's Drive folder; only the
              // sizes and prices that used to sit beside them were invented, so they stay.
              return `
            <section style="margin-bottom: 40px;">
              <h2>Floor plans</h2>
              ${plans.map(l => `<img src="${l.image}" alt="${escapeXml(`${targetProject.name} floor plan`)}" loading="lazy" width="800" style="max-width:100%;height:auto;">`).join('\n              ')}
            </section>`;
            })()}

            ${projectFactsHtml(targetProject.id, 'en')}
            ${projectNearbyHtml(targetProject.id, 'en')}
            ${projectGuidesHtml(targetProject.id, 'en')}
            ${projectLinksHtml(targetProject, projects, 'en')}
            ${siteLinksHtml('en')}
            <section style="margin-bottom: 40px;">
              <h2>Frequently Asked Questions</h2>
              ${faqs.map(faq => `
              <h3>${escapeXml(faq.q)}</h3>
              <p>${escapeXml(faq.a)}</p>`).join('')}
            </section>
          </main>
        </div>
      `;
    }

    // Individual Blog Page Override
    if (targetBlog) {
      canonical = `${baseUrl}/blog/${targetBlog.slug}`;
      title = `${targetBlog.title} | Shyan Yee Property Insights`;
      desc = targetBlog.metaDescription || targetBlog.summary;

      if (targetBlog.image) {
        ogImage = targetBlog.image;
      }

      // Add Article / BlogPosting Schema
      jsonLdGraph.push({
        "@type": "BlogPosting",
        "@id": `${canonical}#article`,
        "headline": targetBlog.title,
        "description": desc,
        "image": [ogImage],
        "datePublished": articleDates(targetBlog).published,
        "dateModified": articleDates(targetBlog).updated,
        "author": { "@id": PERSON_ID },
        "publisher": { "@id": `${baseUrl}/#agent` },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": canonical
        }
      });

      // Add BreadcrumbList Schema
      jsonLdGraph.push({
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
          { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${baseUrl}/blog` },
          { "@type": "ListItem", "position": 3, "name": targetBlog.title, "item": canonical }
        ]
      });

      // Add FAQPage Schema if blog article has faqs
      if (targetBlog.faqs && targetBlog.faqs.length > 0) {
        jsonLdGraph.push({
          "@type": "FAQPage",
          "@id": `${canonical}#faq`,
          "mainEntity": targetBlog.faqs.map((f: any) => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": { "@type": "Answer", "text": f.answer }
          }))
        });
      }

      jsonLdGraph.push(...embeddedVideoObjects(targetBlog.content || '', targetBlog.title, articleDates(targetBlog).published, 'en'));

      preRenderedBody = `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 0 auto; padding: 24px; color: #111827; line-height: 1.8;">
          <nav style="margin-bottom: 24px; font-size: 14px; color: #64748b;">
            <a href="${baseUrl}" style="color: #2563eb; text-decoration: none;">Home</a> &gt; 
            <a href="${baseUrl}/blog" style="color: #2563eb; text-decoration: none;">Blog</a> &gt; 
            <span>${targetBlog.title}</span>
          </nav>

          <header style="margin-bottom: 32px; border-bottom: 1px solid #e5e7eb; padding-bottom: 24px;">
            <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px; font-size: 14px; color: #64748b;">
              <span style="background: #eff6ff; color: #2563eb; padding: 2px 8px; border-radius: 4px; font-weight: 700;">${targetBlog.category || 'Property Guide'}</span>
              <span>Published ${dateLabel(articleDates(targetBlog).published)}</span>${articleDates(targetBlog).updated !== articleDates(targetBlog).published ? `<span>&middot; Updated ${dateLabel(articleDates(targetBlog).updated)}</span>` : ''}
              <span>&bull;</span>
              <span>${targetBlog.publishDate || '2026'}</span>
              <span>&bull;</span>
              <span>${targetBlog.readTime || '5 min read'}</span>
            </div>
            <h1 style="font-size: 32px; font-weight: 800; line-height: 1.3; margin: 0 0 16px 0;">${targetBlog.title}</h1>
            <p style="font-size: 18px; color: #4b5563; line-height: 1.6; margin: 0;">${desc}</p>
          </header>

          ${targetBlog.image ? `<img src="${targetBlog.image}" alt="${targetBlog.title}" style="width: 100%; max-height: 440px; object-fit: cover; border-radius: 12px; margin-bottom: 32px;" />` : ''}

          <main style="font-size: 16px; color: #334155;">
            <div class="md-body" style="margin-bottom: 40px;">
              ${targetBlog.content ? renderMarkdown(targetBlog.content, { baseUrl, autoLinks: Object.fromEntries(Object.entries(DEFAULT_AUTO_LINKS).filter(([, p]) => !p.endsWith(`/${targetBlog.slug}`))) }) : desc}
            </div>

            ${targetBlog.faqs && targetBlog.faqs.length > 0 ? `
              <section style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-top: 40px; margin-bottom: 40px;">
                <h3 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Frequently Asked Questions</h3>
                ${targetBlog.faqs.map((f: any) => `
                  <div style="margin-bottom: 16px;">
                    <h4 style="font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0;">${f.question}</h4>
                    <p style="font-size: 15px; color: #475569; margin: 0;">${f.answer}</p>
                  </div>
                `).join('')}
              </section>
            ` : ''}

            ${authorBoxHtml('en')}
            ${relatedProjectsHtml(targetBlog, projects, 'en')}
            <section style="margin-top: 40px;">
              <h3 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Related articles</h3>
              <ul style="line-height: 1.9; font-size: 15px; padding-left: 20px;">
                ${relatedArticles(targetBlog, BLOG_DATA).map(b => `<li><a href="${baseUrl}/blog/${b.slug}" style="color: #2563eb; text-decoration: none;">${b.title}</a></li>`).join('')}
              </ul>
              <p style="font-size: 15px;"><a href="${baseUrl}/blog" style="color: #2563eb;">All guides</a> &middot; <a href="${baseUrl}/projects" style="color: #2563eb;">Browse ${projects.length} new launch projects</a> &middot; <a href="${baseUrl}/faq" style="color: #2563eb;">Buyer FAQ</a></p>
            </section>

            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; margin-top: 40px; text-align: center;">
              <h3 style="font-size: 20px; font-weight: 700; color: #166534; margin: 0 0 8px 0;">Need Personalized Advice on Malaysian Real Estate?</h3>
              <p style="color: #15803d; margin: 0 0 16px 0; font-size: 15px;">
                Speak with licensed senior agent <strong>Shyan Yee (REN 46305)</strong> for MM2H property consultations, state consent processing, and curated project shortlist.
              </p>
              <a href="https://wa.me/60108278932?text=Hi%20Shyan%20Yee,%20I%20read%20your%20article%20on%20${encodeURIComponent(targetBlog.title)}" 
                 style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">
                 WhatsApp Shyan Yee (+60 10-827 8932)
              </a>
            </div>
          </main>
        </div>
      `;
    }

    let seoHtml = html;
    seoHtml = seoHtml.replace(/<title>.*?<\/title>/s, `<title>${title}</title>`);
    seoHtml = seoHtml.replace(/<meta name="description" content=".*?" \/>/s, `<meta name="description" content="${desc.replace(/"/g, '&quot;')}" />`);
    seoHtml = seoHtml.replace(/<link rel="canonical" href=".*?" \/>/s, `<link rel="canonical" href="${canonical}" />`);
    seoHtml = seoHtml.replace(/<meta property="og:title" content=".*?" \/>/s, `<meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />`);
    seoHtml = seoHtml.replace(/<meta property="og:description" content=".*?" \/>/s, `<meta property="og:description" content="${desc.replace(/"/g, '&quot;')}" />`);
    seoHtml = seoHtml.replace(/<meta property="og:image" content=".*?" \/>/s, `<meta property="og:image" content="${ogImage}" />`);
    // The share image, the thumbnail and the Twitter card should all show this page, not the home hero.
    seoHtml = seoHtml.replace(/<meta name="thumbnail" content=".*?" \/>/s, `<meta name="thumbnail" content="${ogImage}" />`)
      .replace(/<meta property="twitter:image" content=".*?" \/>/s, `<meta property="twitter:image" content="${ogImage}" />`);
    seoHtml = seoHtml.replace(/<meta property="og:url" content=".*?" \/>/s, `<meta property="og:url" content="${canonical}" />`);

    if (preRenderedBody) {
      seoHtml = seoHtml.replace('<div id="root"></div>', `<div id="root">${preRenderedBody}</div>`);
    }

    const jsonLdScript = `<script id="seo-json-ld" type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": jsonLdGraph })}</script>`;
    seoHtml = seoHtml.replace(/<script id="seo-json-ld" type="application\/ld\+json">.*?<\/script>/s, jsonLdScript);

    return withHreflang(seoHtml, reqUrl);
  } catch (err) {
    console.error("renderSeoHtml Error:", err);
    return html;
  }
}


// =====================================================================
// Simplified Chinese version (/zh/...) — added 2026-09-18
// Every English page gets a Chinese twin at /zh + same path, with its own
// title, description, canonical, <html lang="zh-CN"> and a Chinese body.
// Both versions link to each other with hreflang so Google shows the right one.
// =====================================================================
const SITE = "https://shyanyee.com";
const ZH = translations['zh-CN'] || {};
/** Chinese titles for the seven hand-written shortlists; the area ones build their own. */
const ZH_SHORTLIST_TITLES: Record<string, string> = {
  'condo-under-500k': '50 万以下的公寓',
  'condo-under-700k': '70 万以下的公寓',
  'condo-under-1-million': '100 万以下的公寓',
  'freehold-projects': '永久地契楼盘',
  'family-3-bedroom': '三房或以上的楼盘',
  'near-mrt-lrt': '走路一公里内有车站的楼盘',
  'projects-i-have-reviewed': '我走过、拍过或写过的楼盘',
  'lowest-monthly-maintenance': '管理费每月实付多少，由低排起'
};

const ZH_BLOG_LIST: any[] = [...Object.values(GENERATED_ZH_ARTICLES), ...(PRE_TRANSLATED_BLOGS['zh-CN'] || []).filter((b: any) => !GENERATED_ZH_ARTICLES[b.slug])];
const ZH_BLOG_DETAIL: Record<string, any> = { ...(PRE_TRANSLATED_BLOG_DETAILS['zh-CN'] || {}), ...GENERATED_ZH_ARTICLES };
const ZH_FAQS = FAQ_TRANSLATIONS['zh-CN'] || [];

function zhUrlFor(reqUrl: string): string {
  return reqUrl === '/' ? `${SITE}/zh` : `${SITE}/zh${reqUrl}`;
}
function enUrlFor(reqUrl: string): string {
  return reqUrl === '/' ? SITE : `${SITE}${reqUrl}`;
}
function hreflangBlock(reqUrl: string): string {
  const en = enUrlFor(reqUrl);
  const zh = zhUrlFor(reqUrl);
  const hant = zh.replace('https://shyanyee.com/zh', 'https://shyanyee.com/zh-hant');
  return `    <link rel="alternate" hreflang="en" href="${en}" />\n` +
         `    <link rel="alternate" hreflang="zh-CN" href="${zh}" />\n` +
         `    <link rel="alternate" hreflang="zh-Hant" href="${hant}" />\n` +
         `    <link rel="alternate" hreflang="x-default" href="${en}" />\n`;
}
function withHreflang(html: string, reqUrl: string): string {
  if (html.includes('hreflang="zh-CN"')) return html;
  return html.replace('</head>', `${hreflangBlock(reqUrl)}  </head>`);
}

const zhTenure = (t?: string) => t === 'Leasehold' ? '租赁产权' : t === 'Freehold' ? '永久产权' : (t || '永久产权');
const zhType = (t?: string) => {
  const m: Record<string, string> = {
    'Serviced Apartment': '服务式公寓', 'Serviced Residence': '服务式公寓', 'Condominium': '公寓',
    'Mixed Development': '综合发展项目', 'Township': '城镇规划项目', 'Commercial Office': '商业办公',
    'Landed': '有地住宅', 'Terrace': '排屋', 'Bungalow': '独立式洋房', 'Semi-D': '半独立式洋房'
  };
  return (t && m[t]) || t || '服务式公寓';
};
const zhStatus = (st?: string, year?: string | number) => {
  const m: Record<string, string> = { 'Under Construction': '在建中', 'New Launch': '全新推介', 'Ready To Move': '现房', 'Completed': '现房落成' };
  return `${(st && m[st]) || st || '在建中'}${year ? `（${year} 年）` : ''}`;
};
const fmt = (n?: number) => (n ? n.toLocaleString() : '');

function zhNav(items: [string, string][]): string {
  return `<nav style="margin-bottom: 24px; font-size: 14px; color: #64748b;">` +
    items.map(([label, href], i) => (i === items.length - 1 || !href)
      ? `<span>${label}</span>`
      : `<a href="${href}" style="color: #2563eb; text-decoration: none;">${label}</a> &gt; `).join('') +
    `</nav>`;
}

function zhCta(text: string, waText: string): string {
  return `<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; margin-top: 40px; text-align: center;">
      <h3 style="font-size: 20px; font-weight: 700; color: #166534; margin: 0 0 8px 0;">${ZH.contactAgent || '定制置业咨询'}</h3>
      <p style="color: #15803d; margin: 0 0 16px 0; font-size: 15px;">${text}</p>
      <a href="https://wa.me/60108278932?text=${encodeURIComponent(waText)}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">WhatsApp 联系 Shyan Yee（+60 10-827 8932）</a>
    </div>`;
}

function renderZhHtml(html: string, reqUrl: string, targetProject: Project | null = null, targetBlog: any = null): string {
  try {
    const canonical = zhUrlFor(reqUrl);
    let title = 'Shyan Yee | 马来西亚高端房产与地标豪宅平台';
    let desc = `${ZH.title || '寻找您在马来西亚的理想房产'}。${ZH.subtitle || ''} 由持牌房产经纪 Shyan Yee（REN 46305，IQI Realty Sdn Bhd）为您服务，覆盖吉隆坡、雪兰莪、槟城与新山。`;
    let ogImage = "https://lh3.googleusercontent.com/d/1fAVXiXAlqMY-nv0w5wHt-oBtWl1Td5oS=w1600";
    let body = '';
    const graph: any[] = [
      {
        "@type": "RealEstateAgent", "@id": `${SITE}/#agent`,
        "name": "Shyan Yee | 马来西亚高端房产与地标豪宅平台", "alternateName": "Yee Woei Shyan (REN 46305)",
        "url": SITE, "logo": "https://lh3.googleusercontent.com/d/1jrGU7WOGJOTL_ORhhYMpjZ7IgMoNavKY",
        "image": "https://lh3.googleusercontent.com/d/1jrGU7WOGJOTL_ORhhYMpjZ7IgMoNavKY",
        "telephone": "+60108278932", "email": "shyanyeews@gmail.com",
        "parentOrganization": { "@type": "Organization", "name": "IQI Realty Sdn Bhd" },
        "address": { "@type": "PostalAddress", "addressLocality": "Kuala Lumpur", "addressRegion": "Wilayah Persekutuan", "addressCountry": "MY" },
        "sameAs": ["https://maps.google.com/?cid=3195643739952877602", "https://www.youtube.com/@shyanyee", "https://www.instagram.com/shyanyee/", "https://www.facebook.com/shyanyeeconsultant/", "https://wa.me/60108278932"], "priceRange": "$$$$"
      },
      { "@type": "WebSite", "@id": `${SITE}/#website`, "url": SITE, "name": "Shyan Yee 马来西亚房产平台", "inLanguage": ["en", "zh-CN"], "publisher": { "@id": `${SITE}/#agent` } },
      { "@type": "WebPage", "@id": canonical, "url": canonical, "inLanguage": "zh-CN", "isPartOf": { "@id": `${SITE}/#website` } }
    ];
    const crumbs = (items: [string, string][]) => graph.push({
      "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumb`,
      "itemListElement": items.map(([name, item], i) => ({ "@type": "ListItem", "position": i + 1, "name": name, ...(item ? { item } : {}) }))
    });
    graph.push(personNode());
    const home = `${SITE}/zh`;

    if (reqUrl === '/') {
      graph.push(...videoObjects('zh'));
      title = 'Shyan Yee | 马来西亚高端房产与地标豪宅平台（吉隆坡、槟城、新山新楼盘）';
      const featured = projects.slice(0, 12);
      body = `<div style="max-width: 1200px; margin: 0 auto; padding: 32px 20px; font-family: system-ui, -apple-system, sans-serif; color: #0f172a;">
        <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 12px;">${ZH.title || '寻找您在马来西亚的理想房产'}</h1>
        <p style="font-size: 16px; color: #475569; margin-bottom: 24px; line-height: 1.6;">${ZH.subtitle || ''}</p>
        <p style="font-size: 15px; color: #334155; margin-bottom: 32px;">${ZH.agentIntro || ''}</p>
        <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">${ZH.featuredProjects || '首选明星楼盘'}</h2>
        <ul style="line-height: 2; font-size: 15px;">${featured.map(p => `<li><a href="${SITE}/zh/projects/${p.id}" style="color: #2563eb; text-decoration: none;">${p.name}</a> — ${p.area}，${zhTenure(p.tenure)}，${ZH.price || '起价'} RM ${fmt(p.startingPrice) || '洽询'}</li>`).join('')}</ul>
        <p><a href="${SITE}/zh/projects" style="color: #2563eb;">${ZH.viewAllProjects || '查看全部项目'}（${projects.length} 个）&rarr;</a></p>
        <h2 style="font-size: 24px; font-weight: 700; margin: 32px 0 16px;">${ZH.blogTitle || '马来西亚置业指南'}</h2>
        <ul style="line-height: 2; font-size: 15px;">${ZH_BLOG_LIST.slice(0, 8).map(b => `<li><a href="${SITE}/zh/blog/${b.slug}" style="color: #2563eb; text-decoration: none;">${b.title}</a></li>`).join('')}</ul>
        ${zhCta(ZH.ctaSubtitle || '直接联系持牌房产经纪 Shyan Yee，获取最新价格、户型图与看房预约。', '你好 Shyan Yee，我想了解马来西亚的楼盘。')}
      </div>`;
    } else if (reqUrl === '/projects') {
      title = `马来西亚地标楼盘目录（${projects.length} 个新盘）| 户型图与价格 - Shyan Yee`;
      desc = `浏览 ${projects.length} 个马来西亚精选楼盘：吉隆坡、雪兰莪、槟城与新山的公寓、服务式公寓与有地住宅。查看起价、户型面积、产权与完工年份，由持牌经纪 Shyan Yee（REN 46305）提供看房与贷款咨询。`;
      crumbs([['首页', home], ['楼盘目录', canonical]]);
      graph.push({ "@type": "ItemList", "@id": `${canonical}#list`, "name": "马来西亚地标楼盘目录", "numberOfItems": projects.length,
        "itemListElement": projects.map((p, i) => ({ "@type": "ListItem", "position": i + 1, "url": `${SITE}/zh/projects/${p.id}`, "name": p.name })) });
      body = `<div style="max-width: 1200px; margin: 0 auto; padding: 32px 20px; font-family: system-ui, -apple-system, sans-serif; color: #0f172a;">
        ${zhNav([['首页', home], ['楼盘目录', '']])}
        <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 12px;">马来西亚地标楼盘目录</h1>
        <p style="font-size: 16px; color: #475569; margin-bottom: 32px; line-height: 1.6;">${desc}</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">
          ${projects.map(p => `<article style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background: #fff;">
            <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px 0;"><a href="${SITE}/zh/projects/${p.id}" style="color: #0f172a; text-decoration: none;">${p.name}</a></h2>
            <p style="font-size: 14px; color: #64748b; margin: 0 0 8px 0;">${p.area}，${p.location} &bull; ${zhTenure(p.tenure)}</p>
            <p style="font-size: 16px; font-weight: 700; color: #16a34a; margin: 0 0 12px 0;">${ZH.price || '起价'} RM ${fmt(p.startingPrice) || '洽询'}</p>
            <p style="font-size: 14px; color: #334155; margin: 0 0 16px 0;">${p.bedroomsMin}-${p.bedroomsMax} ${ZH.rooms || '房'} &bull; ${fmt(p.builtUpMin)}-${fmt(p.builtUpMax)} ${ZH.sqft || '平方尺'} &bull; ${ZH.developer || '开发商'}：${(p.developer || '').replace(/\(.*?\)/g, '').trim()}</p>
            <a href="${SITE}/zh/projects/${p.id}" style="color: #2563eb; font-weight: 600; font-size: 14px; text-decoration: none;">${ZH.viewDetails || '查看详情'} &rarr;</a>
          </article>`).join('')}
        </div></div>`;
    } else if (reqUrl === '/blog') {
      title = '马来西亚房产资讯与投资指南（中文）| Shyan Yee';
      desc = ZH.blogSubtitle || '马来西亚置业、MM2H、RTS 捷运、税务与贷款的中文深度指南。';
      crumbs([['首页', home], ['置业指南', canonical]]);
      body = `<div style="max-width: 1200px; margin: 0 auto; padding: 32px 20px; font-family: system-ui, -apple-system, sans-serif; color: #0f172a;">
        ${zhNav([['首页', home], ['置业指南', '']])}
        <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 12px;">${ZH.blogTitle || '马来西亚置业指南'}</h1>
        <p style="font-size: 16px; color: #475569; margin-bottom: 32px; line-height: 1.6;">${desc}</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px;">
          ${ZH_BLOG_LIST.map(b => `<article style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff;">
            ${b.image ? `<img src="${b.image}" alt="${escapeXml(b.title)}" loading="lazy" style="width: 100%; height: 180px; object-fit: cover;" />` : ''}
            <div style="padding: 20px;">
              <span style="font-size: 12px; font-weight: 700; color: #2563eb;">${b.category || '指南'}</span>
              <h2 style="font-size: 18px; font-weight: 700; margin: 8px 0; line-height: 1.4;"><a href="${SITE}/zh/blog/${b.slug}" style="color: #0f172a; text-decoration: none;">${b.title}</a></h2>
              <p style="font-size: 14px; color: #475569; margin: 0 0 16px 0; line-height: 1.6;">${b.summary || b.metaDescription}</p>
              <a href="${SITE}/zh/blog/${b.slug}" style="color: #2563eb; font-weight: 600; font-size: 14px; text-decoration: none;">阅读全文 &rarr;</a>
            </div></article>`).join('')}
        </div></div>`;
    } else if (reqUrl === '/faq') {
      title = '马来西亚买房常见问题（中文）| 外国人购房、贷款、税务 - Shyan Yee';
      desc = ZH.faqSubtitle || '关于产权、银行贷款、税务与工程进度付款的常见问题解答。';
      crumbs([['首页', home], ['常见问题', canonical]]);
      if (ZH_FAQS.length) graph.push({ "@type": "FAQPage", "@id": `${canonical}#faq`,
        "mainEntity": ZH_FAQS.map(f => ({ "@type": "Question", "name": f.question, "acceptedAnswer": { "@type": "Answer", "text": f.answer } })) });
      body = `<div style="max-width: 1000px; margin: 0 auto; padding: 32px 20px; font-family: system-ui, -apple-system, sans-serif; color: #0f172a;">
        ${zhNav([['首页', home], ['常见问题', '']])}
        <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 12px;">马来西亚买房常见问题</h1>
        <p style="font-size: 16px; color: #475569; margin-bottom: 32px; line-height: 1.6;">${desc}</p>
        ${ZH_FAQS.map(f => `<div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background: #fff; margin-bottom: 16px;">
          <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">${f.question}</h2>
          <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0;">${f.answer}</p></div>`).join('')}
        </div>`;
    } else if (reqUrl.startsWith('/best/')) {
      const sl = BUYER_SHORTLISTS.find(x => `/best/${x.slug}` === reqUrl);
      const ar = AREA_SHORTLISTS.find(x => `/best/${x.slug}` === reqUrl);
      if (sl) {
        const picks = projects.filter(p => { try { return sl.pick(p as any); } catch { return false; } })
          .sort(sl.sort || ((a: any, b: any) => (Number(a.startingPrice) || Infinity) - (Number(b.startingPrice) || Infinity)));
        const heading = ar ? `${ar.area}${ar.slice.labelZh}的新楼盘` : (ZH_SHORTLIST_TITLES[sl.slug] || sl.h1);
        title = `${heading} | 价格、面积、完工年份 | Shyan Yee`;
        desc = `${heading}：共 ${picks.length} 个楼盘，价格、建筑面积、地契、完工年份与最近车站，以及我写过评测或拍过视频的是哪几个。`;
        crumbs([['首页', home], ['全部楼盘', `${home}/projects`], [heading, '']]);
        graph.push({
          "@type": "CollectionPage", "@id": `${canonical}#page`, "url": canonical, "name": title, "description": desc,
          "inLanguage": "zh-CN", "isPartOf": { "@id": `${SITE}/#website` },
          "mainEntity": { "@type": "ItemList", "numberOfItems": picks.length,
            "itemListElement": picks.map((p, i) => ({ "@type": "ListItem", "position": i + 1, "name": p.name, "url": `${home}/projects/${p.id}` })) }
        });
        const td = 'style="padding:8px 10px;border-bottom:1px solid #f1f5f9;"';
        const rows = picks.map((p: any) => {
          const rev = reviewOf(p.id, ZH_BLOG_LIST);
          const vid = HOME_VIDEOS.find(v => v.projectId === p.id);
          const station = (NEARBY_OSM[p.id] || []).find(n => n.category === 'Train stations');
          const mine = [
            rev ? `<a href="${home}/blog/${rev.slug}">评测</a>` : '',
            vid ? `<a href="https://www.youtube.com/watch?v=${vid.youtubeId}">视频</a>` : ''
          ].filter(Boolean).join(' &middot; ') || '<span style="color:#94a3b8;">仅发展商资料</span>';
          return `<tr><td ${td}><a href="${home}/projects/${p.id}" style="color:#0f172a;font-weight:700;text-decoration:none;">${escapeXml(p.name)}</a></td>`
            + (sl.column ? `<td ${td}><strong>${escapeXml(sl.column.cell(p))}</strong></td>` : '')
            + `<td ${td}>${escapeXml(p.area || '')}</td>`
            + `<td ${td}>${zhTenure(p.tenure)}</td>`
            + `<td ${td}>${escapeXml(p.startingPriceFormatted || p.priceRange || '')}</td>`
            + `<td ${td}>${p.builtUpMin ? `${p.builtUpMin}-${p.builtUpMax} 平方尺` : ''}</td>`
            + `<td ${td}>${escapeXml(String(p.completionYear || ''))}</td>`
            + `<td ${td}>${station ? `${escapeXml(station.name)} ${station.km < 1 ? `${Math.round(station.km * 1000)} 米` : `${station.km.toFixed(1)} 公里`}` : ''}</td>`
            + `<td ${td}>${mine}</td></tr>`;
        }).join('');
        const others = BUYER_SHORTLISTS.filter(o => o.slug !== sl.slug).slice(0, 14);
        body = `
          <div style="max-width:1200px;margin:0 auto;padding:40px 20px;font-family:system-ui,sans-serif;color:#0f172a;">
            <nav style="margin-bottom:24px;font-size:14px;color:#64748b;"><a href="${home}" style="color:#2563eb;text-decoration:none;">首页</a> &gt; <a href="${home}/projects" style="color:#2563eb;text-decoration:none;">全部楼盘</a> &gt; <span>${escapeXml(heading)}</span></nav>
            <h1 style="font-size:32px;font-weight:800;margin-bottom:12px;">${escapeXml(heading)}</h1>
            <p style="font-size:16px;color:#475569;line-height:1.8;">共 ${picks.length} 个楼盘，由低价排起。车站距离取自 OpenStreetMap 的直线距离，实际走路会更远。</p>
            <table style="border-collapse:collapse;width:100%;font-size:14px;margin-top:24px;"><thead><tr>${['楼盘', ...(sl.column ? [sl.column.headZh] : []), '地区', '地契', '起价', '面积', '完工', '最近车站', '我的内容'].map(h => `<th style="text-align:left;padding:8px 10px;border-bottom:2px solid #e2e8f0;">${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
            <p style="font-size:13px;color:#64748b;margin-top:16px;">价格为发展商开价，每一期都会变动。决定前请向我索取最新价目表。</p>
            <h2 style="font-size:20px;margin-top:32px;">其他清单</h2>
            <ul style="line-height:1.9;columns:2;">${others.map(o => `<li><a href="${home}/best/${o.slug}">${escapeXml(ZH_SHORTLIST_TITLES[o.slug] || o.h1)}</a></li>`).join('')}</ul>
            <p style="margin-top:24px;font-size:15px;color:#334155;">看房与最新价目表：Yee Woei Shyan（REN 46305），IQI Realty Sdn Bhd &mdash; WhatsApp <a href="https://wa.me/60108278932" style="color:#2563eb;text-decoration:none;">+60 10-827 8932</a>。</p>
            ${siteLinksHtml('zh')}
          </div>`;
      }
    } else if (reqUrl.startsWith('/near/') || reqUrl.startsWith('/developer/') || reqUrl.startsWith('/completion/')) {
      // The three index types share a shape: a heading, a sentence of real numbers, a table of
      // projects, and links outwards. Only the heading and the first sentence differ.
      const st = STATIONS.find(x => `/near/${x.slug}` === reqUrl);
      const dev = DEVELOPERS.find(d => `/developer/${d.slug}` === reqUrl);
      const yr = COMPLETION_YEARS.find(y => `/completion/${y.year}` === reqUrl);
      const items: Project[] = st ? st.items.map(x => x.p) : dev ? dev.items : yr ? yr.items : [];
      if (items.length) {
        const kmOf = (p: Project) => st ? st.items.find(x => x.p.id === p.id)!.km : undefined;
        const prices = items.map((p: any) => Number(p.startingPrice) || 0).filter(n => n > 0);
        const lo = prices.length ? Math.min(...prices) : 0;
        const hi = prices.length ? Math.max(...prices) : 0;
        const freehold = items.filter((p: any) => /freehold/i.test(String(p.tenure || ''))).length;
        const areasHere = [...new Set(items.map((p: any) => String(p.area || '').trim()).filter(Boolean))];
        const heading = st ? `${st.name}站附近的新楼盘` : dev ? `${dev.name} 的楼盘` : `${yr!.year} 年完工的新楼盘`;
        title = `${heading} | 价格、户型、地契与完工年份 | Shyan Yee`;
        desc = st
          ? `${st.name}站${st.codes.length ? `（${st.codes.join('、')}）` : ''}附近共 ${items.length} 个新楼盘，最近的是${st.items[0].p.name}，直线 ${st.items[0].km < 1 ? `${Math.round(st.items[0].km * 1000)} 米` : `${st.items[0].km.toFixed(1)} 公里`}。距离是量出来的，不是发展商写的。`
          : dev
          ? `${dev.name} 在售的 ${items.length} 个楼盘${lo ? `，起价 RM ${lo.toLocaleString()}` : ''}。地契、面积、完工年份、最近车站，以及我写过评测或拍过视频的是哪几个。`
          : `${items.length} 个预计在 ${yr!.year} 年完工的楼盘${lo ? `，起价 RM ${lo.toLocaleString()}` : ''}。地区、地契、面积与最近车站距离。`;
        crumbs([['首页', home], ['全部楼盘', `${home}/projects`], [heading, '']]);
        graph.push({
          "@type": "CollectionPage", "@id": `${canonical}#page`, "url": canonical, "name": title, "description": desc,
          "inLanguage": "zh-CN", "isPartOf": { "@id": `${SITE}/#website` },
          ...(st ? { "about": { "@type": "TrainStation", "name": `${st.name}站` } } : {}),
          ...(dev ? { "about": { "@type": "Organization", "name": dev.name } } : {}),
          "mainEntity": { "@type": "ItemList", "numberOfItems": items.length,
            "itemListElement": items.map((p, i) => ({ "@type": "ListItem", "position": i + 1, "name": p.name, "url": `${home}/projects/${p.id}` })) }
        });
        const td = 'style="padding:8px 10px;border-bottom:1px solid #f1f5f9;"';
        const rows = items.slice()
          .sort((a: any, b: any) => st ? (kmOf(a)! - kmOf(b)!) : ((Number(a.startingPrice) || Infinity) - (Number(b.startingPrice) || Infinity)))
          .map((p: any) => {
            const rev = reviewOf(p.id, ZH_BLOG_LIST);
            const vid = HOME_VIDEOS.find(v => v.projectId === p.id);
            const station = (NEARBY_OSM[p.id] || []).find(n => n.category === 'Train stations');
            const km = kmOf(p);
            const mine = [
              rev ? `<a href="${home}/blog/${rev.slug}">评测</a>` : '',
              vid ? `<a href="https://www.youtube.com/watch?v=${vid.youtubeId}">视频</a>` : ''
            ].filter(Boolean).join(' &middot; ') || '<span style="color:#94a3b8;">仅发展商资料</span>';
            return `<tr>`
              + (st ? `<td ${td}><strong>${km! < 1 ? `${Math.round(km! * 1000)} 米` : `${km!.toFixed(1)} 公里`}</strong></td>` : '')
              + `<td ${td}><a href="${home}/projects/${p.id}" style="color:#0f172a;font-weight:700;text-decoration:none;">${escapeXml(p.name)}</a></td>`
              + `<td ${td}>${escapeXml(p.area || '')}</td>`
              + `<td ${td}>${zhTenure(p.tenure)}</td>`
              + `<td ${td}>${escapeXml(p.startingPriceFormatted || p.priceRange || '')}</td>`
              + `<td ${td}>${p.builtUpMin ? `${p.builtUpMin}-${p.builtUpMax} 平方尺` : ''}</td>`
              + `<td ${td}>${escapeXml(String(p.completionYear || ''))}</td>`
              + (st ? '' : `<td ${td}>${station ? `${escapeXml(station.name)} ${station.km < 1 ? `${Math.round(station.km * 1000)} 米` : `${station.km.toFixed(1)} 公里`}` : ''}</td>`)
              + `<td ${td}>${mine}</td></tr>`;
          }).join('');
        const heads = st
          ? ['距离', '楼盘', '地区', '地契', '起价', '面积', '完工', '我的内容']
          : ['楼盘', '地区', '地契', '起价', '面积', '完工', '最近车站', '我的内容'];
        body = `
          <div style="max-width:1200px;margin:0 auto;padding:40px 20px;font-family:system-ui,sans-serif;color:#0f172a;">
            <nav style="margin-bottom:24px;font-size:14px;color:#64748b;"><a href="${home}" style="color:#2563eb;text-decoration:none;">首页</a> &gt; <a href="${home}/projects" style="color:#2563eb;text-decoration:none;">全部楼盘</a> &gt; <span>${escapeXml(heading)}</span></nav>
            <h1 style="font-size:32px;font-weight:800;margin-bottom:12px;">${escapeXml(heading)}</h1>
            <p style="font-size:16px;color:#475569;line-height:1.8;">${escapeXml(desc)}</p>
            <p style="font-size:15px;color:#475569;line-height:1.8;">
              这一页收录 ${items.length} 个楼盘。${lo && hi ? `发展商开价由 RM ${lo.toLocaleString()} 到 RM ${hi.toLocaleString()}。` : ''}${freehold ? `其中 ${freehold} 个是永久地契。` : ''}
              车站距离取自 OpenStreetMap 的直线距离，实际走路会更远。
            </p>
            <table style="border-collapse:collapse;width:100%;font-size:14px;margin-top:24px;"><thead><tr>${heads.map(h => `<th style="text-align:left;padding:8px 10px;border-bottom:2px solid #e2e8f0;">${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
            <p style="font-size:13px;color:#64748b;margin-top:16px;">价格为发展商开价，每一期都会变动。决定前请向我索取最新价目表。</p>
            ${areasHere.length ? `<h2 style="font-size:20px;margin-top:32px;">相关地区</h2><ul style="line-height:1.9;columns:2;">${areasHere.map(a => `<li><a href="${home}/area/${areaSlug(a)}">${escapeXml(a)}</a></li>`).join('')}</ul>` : ''}
            <p style="margin-top:24px;font-size:15px;color:#334155;">看房与最新价目表：Yee Woei Shyan（REN 46305），IQI Realty Sdn Bhd &mdash; WhatsApp <a href="https://wa.me/60108278932" style="color:#2563eb;text-decoration:none;">+60 10-827 8932</a>。</p>
            ${siteLinksHtml('zh')}
          </div>`;
      }
    } else if (reqUrl.startsWith('/area/')) {
      const ar = AREAS.find(a => `/area/${a.slug}` === reqUrl);
      if (ar) {
        title = `${ar.name}新楼盘 | 价格、户型、地契与我的评测 | Shyan Yee`;
        const prices = ar.items.map(p => Number((p as any).startingPrice) || 0).filter(n => n > 0);
        const lo = prices.length ? Math.min(...prices) : 0;
        const hi = prices.length ? Math.max(...prices) : 0;
        const freehold = ar.items.filter(p => /freehold/i.test(String((p as any).tenure || ''))).length;
        desc = `${ar.name}共 ${ar.items.length} 个新楼盘${lo ? `，起价 RM ${lo.toLocaleString()}` : ''}。地契、面积、完工年份、最近车站距离，以及我走过或拍过的是哪几个。`;
        crumbs([['首页', home], ['全部楼盘', `${home}/projects`], [ar.name, '']]);
        graph.push({
          "@type": "CollectionPage", "@id": `${canonical}#page`, "url": canonical, "name": title, "description": desc,
          "inLanguage": "zh-CN", "isPartOf": { "@id": `${SITE}/#website` },
          "mainEntity": { "@type": "ItemList", "numberOfItems": ar.items.length,
            "itemListElement": ar.items.map((p, i) => ({ "@type": "ListItem", "position": i + 1, "name": p.name, "url": `${home}/projects/${p.id}` })) }
        });
        const rows = ar.items
          .slice()
          .sort((a: any, b: any) => (Number(a.startingPrice) || Infinity) - (Number(b.startingPrice) || Infinity))
          .map((p: any) => {
            const rev = reviewOf(p.id, ZH_BLOG_LIST);
            const vid = HOME_VIDEOS.find(v => v.projectId === p.id);
            const station = (NEARBY_OSM[p.id] || []).find(n => n.category === 'Train stations');
            const mine = [
              rev ? `<a href="${home}/blog/${rev.slug}">评测</a>` : '',
              vid ? `<a href="https://www.youtube.com/watch?v=${vid.youtubeId}">视频</a>` : ''
            ].filter(Boolean).join(' &middot; ') || '<span style="color:#94a3b8;">仅发展商资料</span>';
            const td = 'style="padding:8px 10px;border-bottom:1px solid #f1f5f9;"';
            return `<tr><td ${td}><a href="${home}/projects/${p.id}" style="color:#0f172a;font-weight:700;text-decoration:none;">${escapeXml(p.name)}</a></td>`
              + `<td ${td}>${escapeXml(p.developer || '')}</td>`
              + `<td ${td}>${zhTenure(p.tenure)}</td>`
              + `<td ${td}>${escapeXml(p.startingPriceFormatted || p.priceRange || '')}</td>`
              + `<td ${td}>${p.builtUpMin ? `${p.builtUpMin}-${p.builtUpMax} 平方尺` : ''}</td>`
              + `<td ${td}>${escapeXml(String(p.completionYear || ''))}</td>`
              + `<td ${td}>${station ? `${escapeXml(station.name)} ${station.km < 1 ? `${Math.round(station.km * 1000)} 米` : `${station.km.toFixed(1)} 公里`}` : ''}</td>`
              + `<td ${td}>${mine}</td></tr>`;
          }).join('');
        const others = AREAS.filter(a => a.slug !== ar.slug).slice(0, 8);
        body = `
          <div style="max-width:1200px;margin:0 auto;padding:40px 20px;font-family:system-ui,sans-serif;color:#0f172a;">
            <nav style="margin-bottom:24px;font-size:14px;color:#64748b;"><a href="${home}" style="color:#2563eb;text-decoration:none;">首页</a> &gt; <a href="${home}/projects" style="color:#2563eb;text-decoration:none;">全部楼盘</a> &gt; <span>${escapeXml(ar.name)}</span></nav>
            <h1 style="font-size:32px;font-weight:800;margin-bottom:12px;">${escapeXml(ar.name)}新楼盘</h1>
            <p style="font-size:16px;color:#475569;line-height:1.8;">${escapeXml(desc)}</p>
            <p style="font-size:15px;color:#475569;line-height:1.8;">
              这一页收录 ${ar.items.length} 个楼盘。${lo && hi ? `发展商开价由 RM ${lo.toLocaleString()} 到 RM ${hi.toLocaleString()}。` : ''}${freehold ? `其中 ${freehold} 个是永久地契。` : ''}
              车站距离取自 OpenStreetMap 的直线距离，实际走路会更远。
            </p>
            <table style="border-collapse:collapse;width:100%;font-size:14px;margin-top:24px;"><thead><tr>${['楼盘', '发展商', '地契', '起价', '面积', '完工', '最近车站', '我的内容'].map(h => `<th style="text-align:left;padding:8px 10px;border-bottom:2px solid #e2e8f0;">${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
            <p style="font-size:13px;color:#64748b;margin-top:16px;">价格为发展商开价，每一期都会变动。决定前请向我索取最新价目表。</p>
            <h2 style="font-size:20px;margin-top:32px;">其他地区</h2>
            <ul style="line-height:1.9;columns:2;">${others.map(a => `<li><a href="${home}/area/${a.slug}">${escapeXml(a.name)}（${a.items.length}）</a></li>`).join('')}</ul>
            <p style="margin-top:24px;font-size:15px;color:#334155;">看房与最新价目表：Yee Woei Shyan（REN 46305），IQI Realty Sdn Bhd &mdash; WhatsApp <a href="https://wa.me/60108278932" style="color:#2563eb;text-decoration:none;">+60 10-827 8932</a>。</p>
            ${siteLinksHtml('zh')}
          </div>`;
      }
    } else if (reqUrl === '/calculator') {
      title = '马来西亚房贷与印花税计算器 | Shyan Yee';
      desc = '计算马来西亚房产的每月供款、利息总额、律师费与产权转让（MOT）印花税。';
      crumbs([['首页', home], ['计算器', canonical]]);
    } else if (reqUrl === '/compare') {
      title = '马来西亚楼盘对比 | 价格、产权、面积并列比较 - Shyan Yee';
      desc = ZH.comparisonToolDesc || '横向对比楼盘的价格、产权、配套与面积。';
      crumbs([['首页', home], ['项目对比', canonical]]);
    } else if (reqUrl === '/map') {
      title = '马来西亚楼盘地图 | 吉隆坡、新山、槟城新盘定位 - Shyan Yee';
      desc = ZH.interactiveMapDesc || '在地图上查看各楼盘的位置与周边交通。';
      crumbs([['首页', home], ['地图', canonical]]);
    }

    if (targetProject) {
      const p = targetProject;
      const dev = (p.developer || '').replace(/\(.*?\)/g, '').trim();
      const price = p.startingPrice ? `RM ${fmt(p.startingPrice)}` : '';
      title = `${p.name} ${p.area} | 价格、户型图、评测与看房预约 - Shyan Yee`;
      desc = `${p.name} 是 ${dev || '发展商'} 在 ${p.location}${p.area ? ` ${p.area}` : ''} 打造的${zhType(p.projectType)}项目，${zhTenure(p.tenure)}，户型 ${fmt(p.builtUpMin)}–${fmt(p.builtUpMax)} 平方尺，${p.bedroomsMin}–${p.bedroomsMax} 房${price ? `，起价 ${price}` : ''}。查看户型图、价格与周边配套，或联系持牌房产经纪 Shyan Yee（REN 46305）预约看房。`;
      if (p.images && p.images.overview && p.images.overview[0]) ogImage = p.images.overview[0];
      crumbs([['首页', home], ['楼盘目录', `${SITE}/zh/projects`], [p.name, canonical]]);
      graph.push({ "@type": "Product", "@id": `${canonical}#product`, "name": `${p.name}（${p.area}，${p.location}）`, "description": desc, "image": [ogImage],
        "brand": { "@type": "Brand", "name": dev || 'Malaysia Premier Developers' },
        "offers": { "@type": "Offer", "price": (p.startingPrice || 500000).toString(), "priceCurrency": "MYR", "priceValidUntil": "2027-12-31", "availability": "https://schema.org/InStock", "url": canonical } });
      const zhProjVideo = projectVideoObject(p.id, 'zh');
      if (zhProjVideo) graph.push(zhProjVideo);
      graph.push({ "@type": ["Accommodation", "ApartmentComplex"], "@id": `${canonical}#accommodation`, "name": p.name, "description": desc, "url": canonical,
        "address": { "@type": "PostalAddress", "addressLocality": p.area, "addressRegion": p.location, "addressCountry": "MY" }, "numberOfRooms": `${p.bedroomsMin} 至 ${p.bedroomsMax} 房` });
      const faqs = [
        { q: `${p.name} 的起价是多少？`, a: `${p.name} 位于 ${p.area}，${p.location}，起价${price ? ` ${price}` : '请洽询'}。价格以发展商最新价单为准。` },
        { q: `${p.name} 的发展商是谁？`, a: `${p.name} 由 ${dev || '发展商'} 开发。` },
        { q: `${p.name} 有哪些户型和面积？`, a: `${p.name} 的单位面积从 ${fmt(p.builtUpMin)} 到 ${fmt(p.builtUpMax)} 平方尺，${p.bedroomsMin} 至 ${p.bedroomsMax} 房。` },
        { q: `如何索取 ${p.name} 的户型图或预约看房？`, a: `可通过 WhatsApp +60 10-827 8932 联系持牌房产经纪 Shyan Yee（REN 46305，IQI Realty Sdn Bhd）索取户型图与价单，并预约私人看房。` }
      ];
      graph.push({ "@type": "FAQPage", "@id": `${canonical}#faq`, "mainEntity": faqs.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })) });
      const gallery = p.images ? [ ...(Array.isArray(p.images.overview) ? p.images.overview : []), ...(Array.isArray(p.images.gallery) ? p.images.gallery : []) ].filter(Boolean) : [];
      body = `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 1200px; margin: 0 auto; padding: 24px; color: #111827;">
        ${zhNav([['首页', home], ['楼盘目录', `${SITE}/zh/projects`], [p.name, '']])}
        <header style="margin-bottom: 32px; border-bottom: 1px solid #e5e7eb; padding-bottom: 24px;">
          <p style="font-size: 13px; font-weight: 800; color: #dc2626; margin: 0 0 8px 0;">持牌房产经纪：Shyan Yee（REN 46305，IQI Realty Sdn Bhd）</p>
          <h1 style="font-size: 32px; font-weight: 800; margin: 8px 0;">${p.name}（${p.area}，${p.location}）</h1>
          <p style="font-size: 18px; color: #4b5563; line-height: 1.6;">${desc}</p>
        </header>
        <section style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
          <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 16px 0;">${ZH.projectDetails || '项目详情'}</h2>
          <ul style="list-style: none; padding: 0; margin: 0; line-height: 2.2; font-size: 15px;">
            <li><strong>${ZH.developer || '开发商'}：</strong>${dev}</li>
            <li><strong>${ZH.location || '地理位置'}：</strong>${p.area}，${p.location}</li>
            <li><strong>${ZH.tenure || '产权'}：</strong>${zhTenure(p.tenure)}</li>
            <li><strong>${ZH.propertyType || '房产类型'}：</strong>${zhType(p.projectType)}</li>
            <li><strong>${ZH.startingPrice || '起始售价'}：</strong><span style="color: #16a34a; font-weight: 700;">${price || '请联系经纪索取价单'}</span></li>
            <li><strong>${ZH.rooms || '房数'}：</strong>${p.bedroomsMin} - ${p.bedroomsMax} 房</li>
            <li><strong>${ZH.size || '面积'}：</strong>${fmt(p.builtUpMin)} - ${fmt(p.builtUpMax)} ${ZH.sqft || '平方尺'}</li>
            <li><strong>${ZH.maintenance || '物业费'}：</strong>${p.maintenanceFee ? 'RM ' + p.maintenanceFee + ' / 平方尺' : (p.maintenanceFeeStr || '以发展商公布为准')}</li>
            <li><strong>${ZH.completion || '交房年份'}：</strong>${zhStatus(p.completionStatus, p.completionYear)}</li>
          </ul>
        </section>
        ${gallery.length ? `<section style="margin-bottom: 32px;"><h2>${ZH.visualGallery || '实景图库'}</h2>${gallery.map(u => `<img src="${u}" alt="${escapeXml(`${p.name} ${p.area}`)}" loading="lazy" width="800" style="max-width:100%;height:auto;border-radius:8px;margin-bottom:12px;">`).join('')}</section>` : ''}
        ${projectLayoutsHtml(p.id, 'zh')}
        ${(() => {
          const plans = (p.layouts || []).filter(l => l.image);
          if (!plans.length) return '';
          return `<section style="margin-bottom: 32px;"><h2>${ZH.floorPlans || '户型图'}</h2>${plans.map(l => `<img src="${l.image}" alt="${escapeXml(`${p.name} 户型图`)}" loading="lazy" width="800" style="max-width:100%;height:auto;margin-top:12px;">`).join('')}</section>`;
        })()}
        ${projectGuidesHtml(p.id, 'zh')}
        <section style="margin-bottom: 32px;"><h2>${ZH.faqSectionTitle || '常见问题'}</h2>${faqs.map(f => `<h3>${escapeXml(f.q)}</h3><p>${escapeXml(f.a)}</p>`).join('')}</section>
        ${zhCta(`联系持牌房产经纪 Shyan Yee（REN 46305）索取 ${p.name} 的官方户型图、价单与贷款方案，并预约私人看房。`, `你好 Shyan Yee，我对 ${p.name} 有兴趣。`)}
      </div>`;
    }

    if (targetBlog) {
      const zb = ZH_BLOG_DETAIL[targetBlog.slug] || ZH_BLOG_LIST.find(b => b.slug === targetBlog.slug) || targetBlog;
      title = `${zb.title} | Shyan Yee 马来西亚房产资讯`;
      desc = zb.metaDescription || zb.summary || targetBlog.metaDescription;
      if (zb.image || targetBlog.image) ogImage = zb.image || targetBlog.image;
      crumbs([['首页', home], ['置业指南', `${SITE}/zh/blog`], [zb.title, canonical]]);
      graph.push({ "@type": "BlogPosting", "@id": `${canonical}#article`, "headline": zb.title, "description": desc, "image": [ogImage], "inLanguage": "zh-CN",
        "datePublished": articleDates(targetBlog).published, "dateModified": articleDates(targetBlog).updated,
        "author": { "@id": PERSON_ID }, "publisher": { "@id": `${SITE}/#agent` },
        "mainEntityOfPage": { "@type": "WebPage", "@id": canonical } });
      if (zb.faqs && zb.faqs.length) graph.push({ "@type": "FAQPage", "@id": `${canonical}#faq`,
        "mainEntity": zb.faqs.map((f: any) => ({ "@type": "Question", "name": f.question, "acceptedAnswer": { "@type": "Answer", "text": f.answer } })) });
      graph.push(...embeddedVideoObjects(zb.content || targetBlog.content || '', zb.title, articleDates(targetBlog).published, 'zh'));
      const content = renderMarkdown(zb.content || '', { baseUrl: SITE, langPrefix: '/zh', playLabel: '播放视频' });
      body = `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 0 auto; padding: 24px; color: #111827; line-height: 1.8;">
        ${zhNav([['首页', home], ['置业指南', `${SITE}/zh/blog`], [zb.title, '']])}
        <header style="margin-bottom: 32px; border-bottom: 1px solid #e5e7eb; padding-bottom: 24px;">
          <p style="font-size: 14px; color: #64748b;">${zb.category || '指南'} &bull; 发布于 ${dateLabel(articleDates(targetBlog).published, 'zh')}${articleDates(targetBlog).updated !== articleDates(targetBlog).published ? ` &bull; 更新于 ${dateLabel(articleDates(targetBlog).updated, 'zh')}` : ''}</p>
          <h1 style="font-size: 32px; font-weight: 800; line-height: 1.3; margin: 0 0 16px 0;">${zb.title}</h1>
          <p style="font-size: 18px; color: #4b5563; line-height: 1.6; margin: 0;">${desc}</p>
        </header>
        ${ogImage ? `<img src="${ogImage}" alt="${escapeXml(zb.title)}" style="width: 100%; max-height: 440px; object-fit: cover; border-radius: 12px; margin-bottom: 32px;" />` : ''}
        <main style="font-size: 16px; color: #334155;"><div class="md-body">${content}</div>
        ${zb.faqs && zb.faqs.length ? `<section style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-top: 40px;"><h3 style="font-size: 20px; font-weight: 700; margin: 0 0 16px 0;">常见问题</h3>${zb.faqs.map((f: any) => `<h4 style="font-size: 16px; font-weight: 700; margin: 12px 0 4px;">${f.question}</h4><p style="font-size: 15px; color: #475569; margin: 0;">${f.answer}</p>`).join('')}</section>` : ''}
        ${authorBoxHtml('zh')}
        ${relatedProjectsHtml(targetBlog, projects, 'zh')}
        <section style="margin-top: 40px;"><h3 style="font-size: 20px; font-weight: 700; margin: 0 0 12px 0;">相关文章</h3>
          <ul style="line-height: 1.9; font-size: 15px; padding-left: 20px;">${relatedArticles(targetBlog, BLOG_DATA).map(b => { const z = ZH_BLOG_LIST.find(x => x.slug === b.slug) || b; return `<li><a href="${SITE}/zh/blog/${b.slug}" style="color: #2563eb; text-decoration: none;">${z.title}</a></li>`; }).join('')}</ul>
          <p style="font-size: 15px;"><a href="${SITE}/zh/blog" style="color: #2563eb;">全部指南</a> &middot; <a href="${SITE}/zh/projects" style="color: #2563eb;">浏览 ${projects.length} 个新楼盘</a> &middot; <a href="${SITE}/zh/faq" style="color: #2563eb;">买家常见问题</a></p>
        </section>
        ${zhCta('想了解 MM2H、州政府批准或适合你的楼盘？直接联系持牌房产经纪 Shyan Yee（REN 46305）。', `你好 Shyan Yee，我读了你的文章《${zb.title}》。`)}
        </main></div>`;
    }

    let out = html;
    out = out.replace(/<html lang="en">/, '<html lang="zh-CN">');
    out = out.replace(/<title>.*?<\/title>/s, `<title>${escapeXml(title)}</title>`);
    out = out.replace(/<meta name="description" content=".*?" \/>/s, `<meta name="description" content="${escapeXml(desc)}" />`);
    out = out.replace(/<link rel="canonical" href=".*?" \/>/s, `<link rel="canonical" href="${canonical}" />`);
    out = out.replace(/<meta property="og:title" content=".*?" \/>/s, `<meta property="og:title" content="${escapeXml(title)}" />`);
    out = out.replace(/<meta property="og:description" content=".*?" \/>/s, `<meta property="og:description" content="${escapeXml(desc)}" />`);
    out = out.replace(/<meta property="og:image" content=".*?" \/>/s, `<meta property="og:image" content="${ogImage}" />`);
    // The share image, the thumbnail and the Twitter card should all show this page, not the home hero.
    out = out.replace(/<meta name="thumbnail" content=".*?" \/>/s, `<meta name="thumbnail" content="${ogImage}" />`)
      .replace(/<meta property="twitter:image" content=".*?" \/>/s, `<meta property="twitter:image" content="${ogImage}" />`);
    out = out.replace(/<meta property="og:url" content=".*?" \/>/s, `<meta property="og:url" content="${canonical}" />\n    <meta property="og:locale" content="zh_CN" />`);
    if (body) out = out.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
    const ld = `<script id="seo-json-ld" type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/<\//g, '<\\/')}</script>`;
    out = out.replace(/<script id="seo-json-ld" type="application\/ld\+json">.*?<\/script>/s, ld);
    return withHreflang(out, reqUrl);
  } catch (err) {
    console.error('renderZhHtml Error:', err);
    return html;
  }
}

// 1. Generate root index.html with crawlable homepage SEO
fs.writeFileSync(path.join(distPath, 'index.html'), renderSeoHtml(rawHtml, '/'), 'utf-8');

// 2. Generate 404.html (Fallback for static SPA hosts)
fs.writeFileSync(path.join(distPath, '404.html'), renderSeoHtml(rawHtml, '/'), 'utf-8');

// 3. Generate _redirects (For Netlify / Cloudflare Pages)
fs.writeFileSync(path.join(distPath, '_redirects'), '/*   /index.html   200\n', 'utf-8');

// 4. Generate vercel.json (For Vercel)
fs.writeFileSync(
  path.join(distPath, 'vercel.json'),
  JSON.stringify({ rewrites: [{ source: "/(.*)", destination: "/index.html" }] }, null, 2),
  'utf-8'
);

// 5. Generate static.json (For Heroku/Dokku/Surge)
fs.writeFileSync(
  path.join(distPath, 'static.json'),
  JSON.stringify({ root: "dist/", clean_urls: false, routes: { "/**": "index.html" } }, null, 2),
  'utf-8'
);

// 6. Pre-render static pages: /projects, /compare, /map, /blog, /calculator, /faq
const staticRoutes = ['projects', 'compare', 'map', 'blog', 'calculator', 'faq'];
for (const r of staticRoutes) {
  const dir = path.join(distPath, r);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), renderSeoHtml(rawHtml, `/${r}`), 'utf-8');
}

// 7. Pre-render all 69 project routes into dist/projects/[id]/index.html
const projectsDir = path.join(distPath, 'projects');
if (!fs.existsSync(projectsDir)) fs.mkdirSync(projectsDir, { recursive: true });

let projectCount = 0;
for (const p of projects) {
  if (p && p.id) {
    const pDir = path.join(projectsDir, p.id);
    if (!fs.existsSync(pDir)) fs.mkdirSync(pDir, { recursive: true });
    const rendered = renderSeoHtml(rawHtml, `/projects/${p.id}`, p, null);
    fs.writeFileSync(path.join(pDir, 'index.html'), rendered, 'utf-8');
    projectCount++;
  }
}

// 8. Pre-render all 15 blog articles into dist/blog/[slug]/index.html
const blogDir = path.join(distPath, 'blog');
if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });

let blogCount = 0;
for (const b of BLOG_DATA) {
  if (b && b.slug) {
    const bDir = path.join(blogDir, b.slug);
    if (!fs.existsSync(bDir)) fs.mkdirSync(bDir, { recursive: true });
    const rendered = renderSeoHtml(rawHtml, `/blog/${b.slug}`, null, b);
    fs.writeFileSync(path.join(bDir, 'index.html'), rendered, 'utf-8');
    blogCount++;
  }
}

// 8a. Area pages — one per area the projects actually sit in.
const areaDir = path.join(distPath, 'area');
if (!fs.existsSync(areaDir)) fs.mkdirSync(areaDir, { recursive: true });
for (const a of AREAS) {
  const dir = path.join(areaDir, a.slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), renderSeoHtml(rawHtml, `/area/${a.slug}`, null, null), 'utf-8');
}
console.log(`[SEO Static Build] ${AREAS.length} area pages under /area/.`);

// 8a2. Station pages — what is actually near each station, measured.
const nearDir = path.join(distPath, 'near');
if (!fs.existsSync(nearDir)) fs.mkdirSync(nearDir, { recursive: true });
for (const st of STATIONS) {
  const dir = path.join(nearDir, st.slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), renderSeoHtml(rawHtml, `/near/${st.slug}`, null, null), 'utf-8');
}
console.log(`[SEO Static Build] ${STATIONS.length} station pages under /near/.`);

// 8a3. Developer and completion-year index pages.
for (const [dir, list] of [['developer', DEVELOPERS.map(d => d.slug)], ['completion', COMPLETION_YEARS.map(y => y.year)]] as [string, string[]][]) {
  const root = path.join(distPath, dir);
  if (!fs.existsSync(root)) fs.mkdirSync(root, { recursive: true });
  for (const key of list) {
    const d = path.join(root, key);
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, 'index.html'), renderSeoHtml(rawHtml, `/${dir}/${key}`, null, null), 'utf-8');
  }
}
console.log(`[SEO Static Build] ${DEVELOPERS.length} developer pages and ${COMPLETION_YEARS.length} completion-year pages.`);

// 8a4. Head-to-head pages.
const cmpDir = path.join(distPath, 'compare');
if (!fs.existsSync(cmpDir)) fs.mkdirSync(cmpDir, { recursive: true });
for (const pr of COMPARE_PAIRS) {
  const d = path.join(cmpDir, pr.slug);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, 'index.html'), renderSeoHtml(rawHtml, `/compare/${pr.slug}`, null, null), 'utf-8');
}
console.log(`[SEO Static Build] ${COMPARE_PAIRS.length} head-to-head pages under /compare/.`);

// 8b. Simplified Chinese twins under dist/zh/...
const zhRoot = path.join(distPath, 'zh');
const writeZh = (relDir: string, reqUrl: string, p: Project | null = null, b: any = null) => {
  const dir = path.join(zhRoot, relDir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), renderZhHtml(rawHtml, reqUrl, p, b), 'utf-8');
};
writeZh('', '/');
for (const r of staticRoutes) writeZh(r, `/${r}`);
let zhProjectCount = 0;
for (const p of projects) if (p && p.id) { writeZh(path.join('projects', p.id), `/projects/${p.id}`, p, null); zhProjectCount++; }
let zhBlogCount = 0;
for (const b of BLOG_DATA) if (b && b.slug) { writeZh(path.join('blog', b.slug), `/blog/${b.slug}`, null, b); zhBlogCount++; }
for (const a of AREAS) writeZh(path.join('area', a.slug), `/area/${a.slug}`);
for (const st of STATIONS) writeZh(path.join('near', st.slug), `/near/${st.slug}`);
for (const d of DEVELOPERS) writeZh(path.join('developer', d.slug), `/developer/${d.slug}`);
for (const y of COMPLETION_YEARS) writeZh(path.join('completion', y.year), `/completion/${y.year}`);
for (const sl of BUYER_SHORTLISTS) writeZh(path.join('best', sl.slug), `/best/${sl.slug}`);
console.log(`[SEO Static Build] Chinese (/zh) twins: home, ${staticRoutes.length} static pages, ${zhProjectCount} projects, ${zhBlogCount} articles.`);

// 8c. Traditional Chinese twins under dist/zh-hant/..., converted from the Simplified pages.
// OpenCC's "twp" profile converts characters and the everyday vocabulary (软件 → 軟體); it leaves
// ASCII — URLs, prices, the JS bundle path — alone. Only the language tag, the canonical, the
// og:url and the internal links change to point at the Traditional copy.
const toHant: (t: string) => string = (OpenCC as any).Converter({ from: 'cn', to: 'twp' });
const hantRoot = path.join(distPath, 'zh-hant');
let hantCount = 0;
const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : (e.name === 'index.html' ? [path.join(dir, e.name)] : []));
for (const file of walk(zhRoot)) {
  const rel = path.relative(zhRoot, file);
  let out = toHant(fs.readFileSync(file, 'utf-8'));
  out = out.replace(/<html lang="zh-CN">/, '<html lang="zh-Hant">')
    .replace(/(<link rel="canonical" href="https:\/\/shyanyee\.com\/)zh(\/|")/, '$1zh-hant$2')
    .replace(/(<meta property="og:url" content="https:\/\/shyanyee\.com\/)zh(\/|")/, '$1zh-hant$2')
    .replace(/(hreflang="zh-Hant" href="https:\/\/shyanyee\.com\/)zh(\/|")/g, '$1zh-hant$2')
    .replace(/href="https:\/\/shyanyee\.com\/zh(\/|")/g, (m, tail) => m.includes('hreflang') ? m : `href="https://shyanyee.com/zh-hant${tail}`)
    .replace(/"url":"https:\/\/shyanyee\.com\/zh(\/|")/g, '"url":"https://shyanyee.com/zh-hant$1')
    .replace(/"url": "https:\/\/shyanyee\.com\/zh(\/|")/g, '"url": "https://shyanyee.com/zh-hant$1');
  // the zh-CN alternate must keep pointing at the Simplified page
  out = out.replace(/(hreflang="zh-CN" href="https:\/\/shyanyee\.com\/)zh-hant(\/|")/g, '$1zh$2');
  const dest = path.join(hantRoot, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out, 'utf-8');
  hantCount++;
}
console.log(`[SEO Static Build] Traditional Chinese (/zh-hant) twins: ${hantCount} pages.`);

// 9. Generate legacy 301/refresh redirect files for outdated slugs
function createRedirectHtml(targetUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <link rel="canonical" href="${targetUrl}">
  <meta http-equiv="refresh" content="0; url=${targetUrl}">
</head>
<body>
  <p>Redirecting to <a href="${targetUrl}">${targetUrl}</a>...</p>
</body>
</html>`;
}

// Legacy Blog Redirects
const legacyBlog1 = path.join(blogDir, 'kl-luxury-condos-2026-guide');
if (!fs.existsSync(legacyBlog1)) fs.mkdirSync(legacyBlog1, { recursive: true });
fs.writeFileSync(path.join(legacyBlog1, 'index.html'), createRedirectHtml('https://shyanyee.com/blog/best-areas-to-buy-property-in-malaysia'), 'utf-8');

const legacyBlog2 = path.join(blogDir, 'foreign-buyer-malaysia-property-laws-2026');
if (!fs.existsSync(legacyBlog2)) fs.mkdirSync(legacyBlog2, { recursive: true });
fs.writeFileSync(path.join(legacyBlog2, 'index.html'), createRedirectHtml('https://shyanyee.com/blog/foreigner-buying-property-in-malaysia'), 'utf-8');

// Legacy YouthCity Redirects
const legacyYouth1 = path.join(distPath, 'youthcity');
if (!fs.existsSync(legacyYouth1)) fs.mkdirSync(legacyYouth1, { recursive: true });
fs.writeFileSync(path.join(legacyYouth1, 'index.html'), createRedirectHtml('https://shyanyee.com/projects'), 'utf-8');

const legacyYouth2 = path.join(projectsDir, 'youthcity');
if (!fs.existsSync(legacyYouth2)) fs.mkdirSync(legacyYouth2, { recursive: true });
fs.writeFileSync(path.join(legacyYouth2, 'index.html'), createRedirectHtml('https://shyanyee.com/projects'), 'utf-8');

// 9b. Buyer shortlist pages: dist/best/<slug>/index.html
const bestDir = path.join(distPath, 'best');
if (!fs.existsSync(bestDir)) fs.mkdirSync(bestDir, { recursive: true });
for (const sl of BUYER_SHORTLISTS) {
  const dir = path.join(bestDir, sl.slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), renderSeoHtml(rawHtml, `/best/${sl.slug}`), 'utf-8');
}
console.log(`[SEO Static Build] ${BUYER_SHORTLISTS.length} buyer shortlist pages under /best/.`);

// 10. Generate full sitemap.xml with images
const todayStr = new Date().toISOString().split('T')[0];
let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

// Root & Static Pages (No trailing slash on root)
xml += `  <url><loc>https://shyanyee.com</loc><lastmod>${todayStr}</lastmod><changefreq>daily</changefreq><priority>1.00</priority></url>\n`;
for (const r of staticRoutes) {
  xml += `  <url><loc>https://shyanyee.com/${r}</loc><lastmod>${todayStr}</lastmod><changefreq>daily</changefreq><priority>0.90</priority></url>\n`;
}

for (const sl of BUYER_SHORTLISTS) {
  xml += `  <url><loc>https://shyanyee.com/best/${sl.slug}</loc><lastmod>${todayStr}</lastmod><changefreq>weekly</changefreq><priority>0.85</priority></url>\n`;
}

// Project Pages with images
for (const p of projects) {
  if (p && p.id) {
    xml += `  <url>\n`;
    xml += `    <loc>https://shyanyee.com/projects/${p.id}</loc>\n`;
    xml += `    <lastmod>${PROJECT_FACTS[p.id]?.checked || p.syncedAt?.substring(0, 10) || todayStr}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.90</priority>\n`;
    
    if (p.images && Array.isArray(p.images.overview) && p.images.overview[0]) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeXml(p.images.overview[0])}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(p.name)} ${escapeXml(p.area)} Malaysia Luxury Property</image:title>\n`;
      xml += `    </image:image>\n`;
    }
    xml += `  </url>\n`;
  }
}

// Blog Pages with images
for (const b of BLOG_DATA) {
  if (b && b.slug) {
    xml += `  <url>\n`;
    xml += `    <loc>https://shyanyee.com/blog/${b.slug}</loc>\n`;
    xml += `    <lastmod>${articleDates(b).updated}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.85</priority>\n`;
    if (b.image) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeXml(b.image)}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(b.title)}</image:title>\n`;
      xml += `    </image:image>\n`;
    }
    xml += `  </url>\n`;
  }
}
for (const pr of COMPARE_PAIRS) {
  xml += `  <url><loc>https://shyanyee.com/compare/${pr.slug}</loc><lastmod>${todayStr}</lastmod><changefreq>weekly</changefreq><priority>0.70</priority></url>\n`;
}
for (const d of DEVELOPERS) {
  xml += `  <url><loc>https://shyanyee.com/developer/${d.slug}</loc><lastmod>${todayStr}</lastmod><changefreq>weekly</changefreq><priority>0.75</priority></url>\n`;
}
for (const y of COMPLETION_YEARS) {
  xml += `  <url><loc>https://shyanyee.com/completion/${y.year}</loc><lastmod>${todayStr}</lastmod><changefreq>weekly</changefreq><priority>0.75</priority></url>\n`;
}
for (const st of STATIONS) {
  xml += `  <url><loc>https://shyanyee.com/near/${st.slug}</loc><lastmod>${todayStr}</lastmod><changefreq>weekly</changefreq><priority>0.80</priority></url>\n`;
}
for (const a of AREAS) {
  xml += `  <url><loc>https://shyanyee.com/area/${a.slug}</loc><lastmod>${todayStr}</lastmod><changefreq>weekly</changefreq><priority>0.80</priority></url>\n`;
}
// Simplified Chinese pages
xml += `  <url><loc>https://shyanyee.com/zh</loc><lastmod>${todayStr}</lastmod><changefreq>daily</changefreq><priority>0.90</priority></url>\n`;
for (const r of staticRoutes) {
  xml += `  <url><loc>https://shyanyee.com/zh/${r}</loc><lastmod>${todayStr}</lastmod><changefreq>daily</changefreq><priority>0.80</priority></url>\n`;
}
for (const p of projects) {
  if (p && p.id) xml += `  <url><loc>https://shyanyee.com/zh/projects/${p.id}</loc><lastmod>${PROJECT_FACTS[p.id]?.checked || p.syncedAt?.substring(0, 10) || todayStr}</lastmod><changefreq>daily</changefreq><priority>0.80</priority></url>\n`;
}
for (const sl of BUYER_SHORTLISTS) {
  xml += `  <url><loc>https://shyanyee.com/zh/best/${sl.slug}</loc><lastmod>${todayStr}</lastmod><changefreq>weekly</changefreq><priority>0.70</priority></url>\n`;
}
for (const st of STATIONS) {
  xml += `  <url><loc>https://shyanyee.com/zh/near/${st.slug}</loc><lastmod>${todayStr}</lastmod><changefreq>weekly</changefreq><priority>0.75</priority></url>\n`;
}
for (const d of DEVELOPERS) {
  xml += `  <url><loc>https://shyanyee.com/zh/developer/${d.slug}</loc><lastmod>${todayStr}</lastmod><changefreq>weekly</changefreq><priority>0.70</priority></url>\n`;
}
for (const y of COMPLETION_YEARS) {
  xml += `  <url><loc>https://shyanyee.com/zh/completion/${y.year}</loc><lastmod>${todayStr}</lastmod><changefreq>weekly</changefreq><priority>0.70</priority></url>\n`;
}
for (const a of AREAS) {
  xml += `  <url><loc>https://shyanyee.com/zh/area/${a.slug}</loc><lastmod>${todayStr}</lastmod><changefreq>weekly</changefreq><priority>0.75</priority></url>\n`;
}
for (const b of BLOG_DATA) {
  if (b && b.slug) xml += `  <url><loc>https://shyanyee.com/zh/blog/${b.slug}</loc><lastmod>${articleDates(b).updated}</lastmod><changefreq>weekly</changefreq><priority>0.75</priority></url>\n`;
}
xml += `</urlset>\n`;

// Traditional Chinese URLs mirror the Simplified ones.

xml = xml.replace(/  <url><loc>https:\/\/shyanyee\.com\/zh(\/[^<]*)?<\/loc>[^\n]*\n/g, m => m + m.replace('https://shyanyee.com/zh', 'https://shyanyee.com/zh-hant').replace(/<priority>0\.(\d)0<\/priority>/, (_: string, d: string) => `<priority>0.${Math.max(1, Number(d) - 1)}0</priority>`));

fs.writeFileSync(path.join(distPath, 'sitemap.xml'), xml, 'utf-8');
const publicDir = path.join(cwd, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf-8');

// 10b. Generate sitemap_index.xml for search engines expecting a sitemap index
const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://shyanyee.com/sitemap.xml</loc>
    <lastmod>${todayStr}</lastmod>
  </sitemap>
</sitemapindex>\n`;

fs.writeFileSync(path.join(distPath, 'sitemap_index.xml'), sitemapIndexXml, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'sitemap_index.xml'), sitemapIndexXml, 'utf-8');

// 11. Generate robots.txt
const robotsTxt = `User-agent: *
Allow: /
Allow: /projects
Allow: /projects/*
Allow: /blog
Allow: /blog/*
Allow: /faq
Allow: /calculator
Allow: /compare
Allow: /map
Allow: /zh
Allow: /zh/*
Allow: /sitemap.xml
Allow: /sitemap_index.xml

# Sitemaps
Sitemap: https://shyanyee.com/sitemap.xml
Sitemap: https://shyanyee.com/sitemap_index.xml
`;

fs.writeFileSync(path.join(distPath, 'robots.txt'), robotsTxt, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf-8');

console.log(`[SEO Static Build] Successfully pre-rendered ${projectCount} project pages, ${blogCount} blog articles, all static routes, robots.txt, and sitemap.xml!`);
