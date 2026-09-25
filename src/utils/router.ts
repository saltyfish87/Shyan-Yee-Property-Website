import { Project } from '../types';
import { BLOG_DATA } from '../data';
import projectsFallback from '../projectsFallback.json';

export interface RouteState {
  page: string;
  project: Project | null;
  blogSlug: string | null;
  is404?: boolean;
  isLegacyRedirect?: boolean;
  attemptedPath?: string;
  suggestedDestination?: {
    page: string;
    project: Project | null;
    blogSlug: string | null;
    label: string;
  };
}

/** Chinese pages live under /zh/... (Simplified) and /zh-hant/... (Traditional); English keeps its URLs. */
export const ZH_PREFIX = 'zh';

/** True when the path is the Chinese version of the site (/zh or /zh/...). */
export function isZhPath(pathname: string): boolean {
  return /^\/zh(-hant)?(\/|$)/i.test(pathname || '');
}

/** Removes a leading "zh" segment from an already-trimmed, lower-cased path string. */
export function stripZhPrefix(trimmedPath: string): string {
  return trimmedPath.replace(/^zh(-hant)?(\/|$)/, '');
}

/** Adds or removes the /zh prefix on an app URL such as "/projects/abc". */
export function localizeUrl(url: string, language: string): string {
  const bare = url.replace(/^\/zh(-hant)?(?=\/|$)/i, '') || '/';
  if (language === 'zh-CN') return bare === '/' ? '/zh' : `/zh${bare}`;
  if (language === 'zh-TW') return bare === '/' ? '/zh-hant' : `/zh-hant${bare}`;
  return bare;
}

export const VALID_STATIC_PAGES = ['home', 'projects', 'compare', 'map', 'blog', 'calculator', 'faq'] as const;

export const LEGACY_BLOG_MAPPINGS: Record<string, string> = {
  'foreign-buyer-malaysia-property-laws-2026': 'foreigner-buying-property-in-malaysia',
  'foreign-buyer-malaysia-property-laws': 'foreigner-buying-property-in-malaysia',
  'kl-luxury-condos-2026-guide': 'best-areas-to-buy-property-in-malaysia',
  'kl-luxury-condos-guide': 'best-areas-to-buy-property-in-malaysia',
  'rts-link-properties-2026': 'jb-rts-link-property-investment-guide',
  'rts-link-properties': 'jb-rts-link-property-investment-guide',
  'sg-my-rts-link-condos': 'jb-rts-link-property-investment-guide',
  'mm2h-property-rules-2026': 'malaysia-mm2h-property-purchase-rules',
  'mm2h-property-rules': 'malaysia-mm2h-property-purchase-rules',
  'penang-luxury-condos-guide': 'penang-luxury-seafront-properties',
  'penang-seafront-condos': 'penang-luxury-seafront-properties',
  'malaysia-property-taxes-guide-2026': 'malaysia-property-investment-guide-2026',
  'malaysia-property-taxes-guide': 'malaysia-property-investment-guide-2026',
  'klcc-luxury-condominiums': 'best-areas-to-buy-property-in-malaysia',
};

export const STATIC_ROUTE_ALIASES: Record<string, string> = {
  calculator: 'calculator',
  calc: 'calculator',
  mortgage: 'calculator',
  'loan-calculator': 'calculator',
  'stamp-duty': 'calculator',
  stampduty: 'calculator',
  projects: 'projects',
  listings: 'projects',
  listing: 'projects',
  portfolio: 'projects',
  properties: 'projects',
  property: 'projects',
  map: 'map',
  explorer: 'map',
  'gis-map': 'map',
  'map-search': 'map',
  blog: 'blog',
  insights: 'blog',
  articles: 'blog',
  guides: 'blog',
  news: 'blog',
  posts: 'blog',
  compare: 'compare',
  comparison: 'compare',
  specs: 'compare',
  matrix: 'compare',
  faq: 'faq',
  faqs: 'faq',
  qna: 'faq',
  questions: 'faq',
  guidelines: 'faq',
  'mm2h-faq': 'faq',
  contact: 'home',
  agent: 'home',
  about: 'home',
  advisor: 'home',
  consultation: 'home',
};

/**
 * Synchronously derives route state from URL path or supplied path string
 */
export function getInitialRouteState(customPath?: string): RouteState {
  let pathStr = '';
  let hashStr = '';
  let searchStr = '';

  if (customPath !== undefined) {
    pathStr = stripZhPrefix(customPath.replace(/^\/+|\/+$/g, '').toLowerCase());
  } else if (typeof window !== 'undefined') {
    pathStr = stripZhPrefix(window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase());
    hashStr = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    searchStr = window.location.search;
  }

  const params = new URLSearchParams(searchStr);
  const projParam = params.get('project') || params.get('p') || params.get('id');
  const blogParam = params.get('blog') || params.get('article') || params.get('slug');

  const rawCandidate = blogParam
    ? `blog/${blogParam}`
    : projParam
    ? `projects/${projParam}`
    : hashStr || pathStr;

  // Root Homepage
  if (!rawCandidate || rawCandidate === 'home' || rawCandidate === 'index.html' || rawCandidate === 'index') {
    return { page: 'home', project: null, blogSlug: null };
  }

  // 1. Blog Routes & Legacy Blog Slugs
  if (rawCandidate.startsWith('blog/') || rawCandidate.startsWith('article/') || rawCandidate.startsWith('insights/')) {
    let bSlug = rawCandidate.replace(/^(blog|article|insights)\//, '');
    let isLegacy = false;

    if (LEGACY_BLOG_MAPPINGS[bSlug]) {
      bSlug = LEGACY_BLOG_MAPPINGS[bSlug];
      isLegacy = true;
    }

    const matchedBlog = BLOG_DATA.find((b) => b.slug === bSlug);
    if (matchedBlog) {
      if (isLegacy) {
        return {
          page: 'redirect',
          project: null,
          blogSlug: null,
          is404: false,
          isLegacyRedirect: true,
          attemptedPath: rawCandidate,
          suggestedDestination: {
            page: 'blog',
            project: null,
            blogSlug: matchedBlog.slug,
            label: matchedBlog.title,
          },
        };
      }
      return { page: 'blog', project: null, blogSlug: bSlug };
    }

    if (!bSlug || bSlug === 'index') {
      return { page: 'blog', project: null, blogSlug: null };
    }

    // Unmatched blog slug -> Clean 404 redirect
    return {
      page: 'redirect',
      project: null,
      blogSlug: null,
      is404: true,
      attemptedPath: rawCandidate,
    };
  }

  // 1b. Area and shortlist pages. These are pre-rendered for crawlers; the app shows the project
  // grid for them. Without this they fell through to the 404 handler, which rewrote the URL to /
  // and replaced the served page with the home page.
  if (rawCandidate.startsWith('area/') || rawCandidate.startsWith('best/') || rawCandidate.startsWith('near/') || rawCandidate.startsWith('developer/') || rawCandidate.startsWith('completion/') || /^compare\//.test(rawCandidate)) {
    return { page: 'projects', project: null, blogSlug: null };
  }

  // 2. Static Route Aliases
  if (STATIC_ROUTE_ALIASES[rawCandidate]) {
    const targetPage = STATIC_ROUTE_ALIASES[rawCandidate];
    return { page: targetPage, project: null, blogSlug: null };
  }

  // 3. Project Detail matching
  const candidate = rawCandidate.replace(/^(projects|project|property|listing)\//, '');
  const fallbackList = projectsFallback as Project[];
  const match = fallbackList.find(
    (p) =>
      p.id.toLowerCase() === candidate ||
      p.id.toLowerCase().replace(/[^a-z0-9]/g, '') === candidate.replace(/[^a-z0-9]/g, '') ||
      p.name.toLowerCase().replace(/[^a-z0-9]/g, '') === candidate.replace(/[^a-z0-9]/g, '')
  );

  if (match) {
    return { page: 'projects', project: match, blogSlug: null };
  }

  // Orphaned or non-existent URL
  return {
    page: 'redirect',
    project: null,
    blogSlug: null,
    is404: true,
    attemptedPath: rawCandidate,
  };
}
