/**
 * Turn markdown article files into a TypeScript module the app and the prerender both import.
 *
 *   content/articles/<slug>.md      English article (required)
 *   content/articles/<slug>.zh.md   Simplified Chinese version (optional; falls back to English on /zh)
 *
 * Each file starts with a front-matter block between `---` lines, e.g.
 *   ---
 *   title: CloutHaus KL City Centre Review: Price PSF, Layouts & Agent's Verdict
 *   metaDescription: One-sentence summary for search results (under 160 characters).
 *   summary: Two or three sentences shown above the article.
 *   category: Reviews
 *   image: https://lh3.googleusercontent.com/d/<drive-id>=w1600
 *   publishedOn: 2026-09-21
 *   updatedOn: 2026-09-21
 *   relatedProjectIds: clouthaus, orion-residence
 *   relatedSlugs: freehold-vs-leasehold, foreigner-buying-property-in-malaysia
 *   tags: klcc, freehold, review
 *   faqs:
 *     - q: Is CloutHaus freehold?
 *       a: Yes, ...
 *   ---
 * followed by the markdown body (tables, lists, {{youtube:ID}} embeds all work).
 *
 * Output: src/data/articles.generated.ts  (run automatically by `npm run build`; also run
 * `npx tsx scripts/build-articles.ts` after editing an article to refresh the app).
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'content', 'articles');
const OUT = path.join(ROOT, 'src', 'data', 'articles.generated.ts');

interface Parsed { meta: Record<string, any>; body: string }

function parseFrontMatter(text: string): Parsed {
  const m = text.replace(/\r\n?/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: text };
  const meta: Record<string, any> = {};
  const lines = m[1].split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const kv = line.match(/^([A-Za-z_][\w]*):\s*(.*)$/);
    if (!kv) { i++; continue; }
    const key = kv[1]; const raw = kv[2].trim();
    if (key === 'faqs' && raw === '') {
      // list of "- q: ..." / "  a: ..." pairs
      const faqs: { question: string; answer: string }[] = [];
      i++;
      while (i < lines.length && /^\s+(-\s*)?[qa]:/.test(lines[i])) {
        const q = lines[i].match(/^\s+-\s*q:\s*(.*)$/);
        if (q) {
          const a = lines[i + 1]?.match(/^\s+a:\s*(.*)$/);
          faqs.push({ question: unquote(q[1]), answer: a ? unquote(a[1]) : '' });
          i += a ? 2 : 1;
        } else i++;
      }
      meta.faqs = faqs;
      continue;
    }
    meta[key] = unquote(raw);
    i++;
  }
  return { meta, body: m[2].trim() };
}
const unquote = (s: string) => s.replace(/^["'](.*)["']$/, '$1');
const list = (v: any): string[] => (typeof v === 'string' && v.trim() ? v.split(/\s*,\s*/).filter(Boolean) : []);
const isoToLabel = (iso: string) => { const d = new Date(iso); return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }); };
const readTime = (md: string) => { const cjk = (md.match(/[\u3400-\u9fff]/g) || []).length; const words = md.replace(/[\u3400-\u9fff]/g, ' ').split(/\s+/).filter(Boolean).length; return `${Math.max(1, Math.round((words + cjk / 2) / 200))} min read`; };

function toArticle(slug: string, p: Parsed, zh = false) {
  const m = p.meta;
  const publishedOn = m.publishedOn || m.date || '';
  return {
    id: m.id || slug,
    slug,
    title: m.title || slug,
    metaDescription: m.metaDescription || m.summary || '',
    summary: m.summary || m.metaDescription || '',
    content: p.body,
    readTime: m.readTime || readTime(p.body),
    publishDate: m.publishDate || (publishedOn ? (zh ? `${new Date(publishedOn).getFullYear()} 年 ${new Date(publishedOn).getMonth() + 1} 月` : isoToLabel(publishedOn)) : ''),
    publishedOn: publishedOn || undefined,
    updatedOn: m.updatedOn || undefined,
    author: m.author || 'Shyan Yee',
    category: m.category || 'Guides',
    image: m.image || '',
    faqs: Array.isArray(m.faqs) && m.faqs.length ? m.faqs : undefined,
    relatedSlugs: list(m.relatedSlugs).length ? list(m.relatedSlugs) : undefined,
    relatedProjectIds: list(m.relatedProjectIds).length ? list(m.relatedProjectIds) : undefined,
    tags: list(m.tags).length ? list(m.tags) : undefined
  };
}

function main() {
  const en: any[] = []; const zh: Record<string, any> = {};
  if (fs.existsSync(SRC_DIR)) {
    // README.md and any file starting with _ are notes, not articles.
    const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.md') && !/^(readme|_)/i.test(f)).sort();
    for (const f of files) {
      if (f.endsWith('.zh.md')) continue;
      const slug = f.replace(/\.md$/, '');
      const parsed = parseFrontMatter(fs.readFileSync(path.join(SRC_DIR, f), 'utf8'));
      const art = toArticle(slug, parsed);
      en.push(art);
      const zhFile = path.join(SRC_DIR, `${slug}.zh.md`);
      if (fs.existsSync(zhFile)) {
        const zp = parseFrontMatter(fs.readFileSync(zhFile, 'utf8'));
        // Chinese file may omit metadata: inherit from the English one.
        zp.meta = { ...parsed.meta, ...zp.meta, faqs: zp.meta.faqs || parsed.meta.faqs };
        zh[slug] = toArticle(slug, zp, true);
      }
    }
  }
  // newest first
  en.sort((a, b) => String(b.publishedOn || '').localeCompare(String(a.publishedOn || '')));
  const out = `// GENERATED by scripts/build-articles.ts from content/articles/*.md — do not edit by hand.
import type { BlogArticle } from '../types';

export const GENERATED_ARTICLES: BlogArticle[] = ${JSON.stringify(en, null, 2)};

export const GENERATED_ZH_ARTICLES: Record<string, BlogArticle> = ${JSON.stringify(zh, null, 2)};
`;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, out, 'utf8');
  console.log(`[build-articles] ${en.length} article(s), ${Object.keys(zh).length} Chinese version(s) → ${path.relative(ROOT, OUT)}`);
}

main();
