/**
 * One markdown renderer for article bodies, shared by the React article view (BlogView),
 * the build-time prerender (scripts/build-seo-static.ts, English and Chinese) and anything
 * else that shows an article. It outputs plain HTML with the `md-body` class hooks styled
 * in src/index.css, so the crawler-visible HTML and the in-app article look the same.
 *
 * Supported: `#`/`##`/`###` headings (rendered one level down: the page already has an H1),
 * paragraphs, **bold**, *italic*, `code`, [links](url), ![images](url), - / * bullet lists,
 * 1. numbered lists, > quotes, --- rules, GFM tables (| a | b |), and `{{youtube:VIDEO_ID}}`
 * on its own line to embed one of Shyan Yee's YouTube videos (thumbnail + play; the app
 * swaps in the player on click, crawlers get the thumbnail, the link and VideoObject schema).
 */

export interface RenderOptions {
  /** Base URL for site-relative links in prerendered HTML (e.g. https://shyanyee.com). Omit in the app. */
  baseUrl?: string;
  /** Language prefix for internal links, e.g. '/zh'. */
  langPrefix?: string;
  /** Text for the video play button. */
  playLabel?: string;
  /** Keyword → site path. The first whole-word match of each keyword in body text becomes a link (once per article). */
  autoLinks?: Record<string, string>;
}

/** The article cross-links the site has always used for these words (first occurrence per article). */
export const DEFAULT_AUTO_LINKS: Record<string, string> = {
  'singaporeans?': '/blog/singaporean-buying-property-in-malaysia',
  'foreigners?': '/blog/foreigner-buying-property-in-malaysia',
  'rts': '/blog/rts-johor-bahru-guide',
  'johor': '/blog/johor-property-market-outlook',
  'taxes|tax|rpgt': '/blog/malaysia-property-taxes-explained'
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const youtubeThumbUrl = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const youtubeWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const youtubeEmbed = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;

/** Every {{youtube:ID}} token in a markdown body, in order, without duplicates. */
export function extractYoutubeIds(md: string): string[] {
  const ids: string[] = [];
  for (const m of (md || '').matchAll(/\{\{\s*youtube:\s*([A-Za-z0-9_-]{6,})\s*\}\}/g)) {
    if (!ids.includes(m[1])) ids.push(m[1]);
  }
  return ids;
}

function resolveHref(href: string, opts: RenderOptions): string {
  if (/^(https?:|mailto:|tel:|#)/i.test(href)) return href;
  if (href.startsWith('/')) {
    const prefixed = opts.langPrefix && !href.startsWith(opts.langPrefix + '/') ? `${opts.langPrefix}${href}` : href;
    return opts.baseUrl ? `${opts.baseUrl}${prefixed}` : prefixed;
  }
  return href;
}

/** Inline markdown: code, images, links, bold, italic. Text is HTML-escaped. */
export function renderInline(text: string, opts: RenderOptions = {}): string {
  let out = '';
  let rest = text;
  const token = /(`[^`]+`)|(!\[[^\]]*\]\([^)\s]+\))|(\[[^\]]+\]\([^)\s]+\))/;
  while (rest.length) {
    const m = rest.match(token);
    if (!m || m.index === undefined) { out += emphasis(autoLink(esc(rest), opts)); break; }
    out += emphasis(autoLink(esc(rest.slice(0, m.index)), opts));
    const t = m[0];
    if (t.startsWith('`')) {
      out += `<code>${esc(t.slice(1, -1))}</code>`;
    } else if (t.startsWith('![')) {
      const im = t.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/)!;
      out += `<img src="${esc(im[2])}" alt="${esc(im[1])}" loading="lazy" />`;
    } else {
      const lm = t.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)!;
      const href = resolveHref(lm[2], opts);
      const external = /^https?:/i.test(href) && !/shyanyee\.com/i.test(href);
      out += `<a href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${emphasis(esc(lm[1]))}</a>`;
    }
    rest = rest.slice(m.index + t.length);
  }
  return out;
}

// Per-render bookkeeping so each keyword links only once per article.
let usedAutoLinks = new Set<string>();
function autoLink(escaped: string, opts: RenderOptions): string {
  if (!opts.autoLinks) return escaped;
  let out = escaped;
  for (const [pattern, path] of Object.entries(opts.autoLinks)) {
    if (usedAutoLinks.has(path)) continue;
    const re = new RegExp(`\\b(${pattern})\\b`, 'i');
    const m = out.match(re);
    if (!m || m.index === undefined) continue;
    const href = resolveHref(path, opts);
    out = out.slice(0, m.index) + `<a href="${esc(href)}">${m[0]}</a>` + out.slice(m.index + m[0].length);
    usedAutoLinks.add(path);
  }
  return out;
}

function emphasis(escaped: string): string {
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>')
    .replace(/(^|[\s(])_([^_\s][^_]*?)_(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
}

function renderTable(lines: string[], opts: RenderOptions): string {
  const cells = (l: string) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
  const header = cells(lines[0]);
  const aligns = cells(lines[1]).map(c => (c.startsWith(':') && c.endsWith(':')) ? 'center' : c.endsWith(':') ? 'right' : 'left');
  const rows = lines.slice(2).map(cells);
  const th = header.map((h, i) => `<th style="text-align:${aligns[i] || 'left'}">${renderInline(h, opts)}</th>`).join('');
  const body = rows.map(r => `<tr>${r.map((c, i) => `<td style="text-align:${aligns[i] || 'left'}">${renderInline(c, opts)}</td>`).join('')}</tr>`).join('');
  return `<div class="md-table"><table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function isTableStart(lines: string[], i: number): boolean {
  return /^\s*\|.*\|\s*$/.test(lines[i] || '') && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(lines[i + 1] || '');
}

/** Markdown body → HTML string. */
export function renderMarkdown(md: string, opts: RenderOptions = {}): string {
  usedAutoLinks = new Set<string>();
  const lines = (md || '').replace(/\r\n?/g, '\n').split('\n');
  const html: string[] = [];
  let i = 0;
  const play = opts.playLabel || 'Play video';
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (!t) { i++; continue; }

    const yt = t.match(/^\{\{\s*youtube:\s*([A-Za-z0-9_-]{6,})\s*\}\}$/);
    if (yt) {
      const id = yt[1];
      html.push(`<div class="md-video" data-youtube="${esc(id)}"><a href="${youtubeWatch(id)}" target="_blank" rel="noopener noreferrer" class="md-video-link"><img src="${youtubeThumbUrl(id)}" alt="YouTube video" loading="lazy" width="480" height="360" /><span class="md-video-play">▶ ${esc(play)}</span></a></div>`);
      i++; continue;
    }
    const h = t.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = Math.min(h[1].length + 1, 5); // # → h2, ## → h3, ### → h4
      html.push(`<h${level}>${renderInline(h[2].replace(/\*\*/g, ''), { ...opts, autoLinks: undefined })}</h${level}>`);
      i++; continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { html.push('<hr />'); i++; continue; }
    if (isTableStart(lines, i)) {
      const block: string[] = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { block.push(lines[i]); i++; }
      html.push(renderTable(block, opts)); continue;
    }
    if (/^>\s?/.test(t)) {
      const block: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) { block.push(lines[i].trim().replace(/^>\s?/, '')); i++; }
      html.push(`<blockquote><p>${renderInline(block.join(' '), opts)}</p></blockquote>`); continue;
    }
    if (/^[-*+]\s+/.test(t)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) { items.push(lines[i].trim().replace(/^[-*+]\s+/, '')); i++; }
      html.push(`<ul>${items.map(it => `<li>${renderInline(it, opts)}</li>`).join('')}</ul>`); continue;
    }
    if (/^\d+[.)]\s+/.test(t)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { items.push(lines[i].trim().replace(/^\d+[.)]\s+/, '')); i++; }
      html.push(`<ol>${items.map(it => `<li>${renderInline(it, opts)}</li>`).join('')}</ol>`); continue;
    }
    // Paragraph: consecutive non-blank, non-block lines joined with spaces.
    const para: string[] = [];
    while (i < lines.length) {
      const l = lines[i]; const lt = l.trim();
      if (!lt || /^(#{1,4})\s+/.test(lt) || /^[-*+]\s+/.test(lt) || /^\d+[.)]\s+/.test(lt) || /^>\s?/.test(lt) || /^(-{3,}|\*{3,}|_{3,})$/.test(lt) || isTableStart(lines, i) || /^\{\{\s*youtube:/.test(lt)) break;
      para.push(lt); i++;
    }
    html.push(`<p>${renderInline(para.join(' '), opts)}</p>`);
  }
  return html.join('\n');
}

/** Rough reading time from the markdown source (200 words per minute, CJK counted per character). */
export function readingMinutes(md: string): number {
  const text = (md || '').replace(/[#*_>|`-]/g, ' ');
  const cjk = (text.match(/[㐀-鿿]/g) || []).length;
  const words = text.replace(/[㐀-鿿]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round((words + cjk / 2) / 200));
}

/** Published / updated dates for an article as ISO days. Accepts "June 2026" or an ISO string. */
export function articleDates(a: { publishDate?: string; publishedOn?: string; updatedOn?: string }): { published: string; updated: string } {
  const toIso = (v?: string): string => {
    if (!v) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
    const d = new Date(`1 ${v}`); // "June 2026" → 1 June 2026
    return isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  };
  const published = toIso(a.publishedOn) || toIso(a.publishDate) || '2026-01-01';
  const updated = toIso(a.updatedOn) || published;
  return { published, updated: updated < published ? published : updated };
}

/** "June 2026" style label from an ISO day, in English or Chinese. */
export function dateLabel(iso: string, lang: 'en' | 'zh' = 'en'): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  if (lang === 'zh') return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`;
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}
