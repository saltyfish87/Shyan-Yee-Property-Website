import { Project } from '../types';
import { BLOG_DATA } from '../data';
import projectsFallback from '../projectsFallback.json';

export interface SitemapProject {
  id: string;
  name?: string;
  area?: string;
  location?: string;
  developer?: string;
  startingPrice?: number;
  syncedAt?: string;
  projectType?: string;
  images?: {
    overview?: string[];
    gallery?: string[];
    layout?: string[];
  };
}

export interface SitemapBlog {
  slug: string;
  title: string;
  summary?: string;
  metaDescription?: string;
  publishDate?: string;
  image?: string;
}

export const BASE_URL = 'https://shyanyee.com';

// Utility to escape XML special characters safely
export function escapeXml(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates a Google Search Console compliant XML Sitemap with Google Image extensions
 */
export function generateSitemapXml(
  projects: Array<Project | SitemapProject> = [],
  blogs: SitemapBlog[] = BLOG_DATA,
  baseUrl: string = BASE_URL
): string {
  const todayStr = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n`;
  xml += `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`;
  xml += `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n`;
  xml += `                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd\n`;
  xml += `                            http://www.google.com/schemas/sitemap-image/1.1\n`;
  xml += `                            http://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd">\n\n`;

  // 1. Static Core Navigation Routes
  const staticPages = [
    { path: '', priority: '1.00', changefreq: 'daily' },
    { path: 'projects', priority: '0.95', changefreq: 'daily' },
    { path: 'compare', priority: '0.85', changefreq: 'weekly' },
    { path: 'map', priority: '0.85', changefreq: 'weekly' },
    { path: 'blog', priority: '0.90', changefreq: 'daily' },
    { path: 'calculator', priority: '0.80', changefreq: 'monthly' },
    { path: 'faq', priority: '0.80', changefreq: 'monthly' },
  ];

  for (const page of staticPages) {
    const loc = page.path ? `${baseUrl}/${page.path}` : `${baseUrl}`;
    xml += `  <url>\n`;
    xml += `    <loc>${loc}</loc>\n`;
    xml += `    <lastmod>${todayStr}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  // 2. Dynamic Real Estate Project Details & High-Res Images
  const projectList = projects && projects.length > 0 ? projects : (projectsFallback as Project[]);
  for (const project of projectList) {
    if (project && project.id) {
      const cleanDev = (project.developer || '').replace(/\(.*?\)/g, '').trim();
      const priceStr = project.startingPrice ? `RM ${project.startingPrice.toLocaleString()}` : '';
      const cleanLoc = `${baseUrl}/projects/${project.id}`;
      const lastmod = project.syncedAt ? project.syncedAt.substring(0, 10) : todayStr;

      xml += `  <url>\n`;
      xml += `    <loc>${cleanLoc}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.90</priority>\n`;

      // Aggregate high-res image assets for Google Image Indexing
      const imageList: string[] = [];
      if (project.images) {
        if (Array.isArray(project.images.overview)) imageList.push(...project.images.overview);
        if (Array.isArray(project.images.gallery)) imageList.push(...project.images.gallery);
        if (Array.isArray(project.images.layout)) imageList.push(...project.images.layout);
      }

      const validImages = Array.from(new Set(imageList))
        .filter((img) => img && typeof img === 'string' && img.startsWith('http'))
        .slice(0, 6);

      for (const imgUrl of validImages) {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${escapeXml(imgUrl)}</image:loc>\n`;
        xml += `      <image:title>${escapeXml(project.name)} ${escapeXml(project.area)} Malaysia Luxury Residence</image:title>\n`;
        xml += `      <image:caption>${escapeXml(project.name)} by ${escapeXml(cleanDev)} in ${escapeXml(project.location || project.area)}. ${priceStr ? `Starting from ${priceStr}` : ''}</image:caption>\n`;
        xml += `    </image:image>\n`;
      }

      xml += `  </url>\n`;
    }
  }

  // 3. Dynamic Market Advisory & Editorial Blog Articles
  const blogList = blogs && blogs.length > 0 ? blogs : BLOG_DATA;
  for (const post of blogList) {
    if (post && post.slug) {
      const loc = `${baseUrl}/blog/${post.slug}`;
      const lastmod = post.publishDate || todayStr;

      xml += `  <url>\n`;
      xml += `    <loc>${loc}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.85</priority>\n`;

      if (post.image && post.image.startsWith('http')) {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${escapeXml(post.image)}</image:loc>\n`;
        xml += `      <image:title>${escapeXml(post.title)}</image:title>\n`;
        xml += `      <image:caption>${escapeXml(post.summary || post.metaDescription || post.title)}</image:caption>\n`;
        xml += `    </image:image>\n`;
      }

      xml += `  </url>\n`;
    }
  }

  xml += `</urlset>\n`;
  return xml;
}

/**
 * Fetches current list of projects from API or fallback and returns generated XML
 */
export async function fetchAndGenerateSitemap(baseUrl: string = BASE_URL): Promise<string> {
  try {
    let projects: Project[] = [];
    if (typeof fetch !== 'undefined') {
      const res = await fetch('/api/projects').catch(() => null);
      if (res && res.ok) {
        projects = await res.json();
      }
    }
    if (!projects || projects.length === 0) {
      projects = projectsFallback as Project[];
    }
    return generateSitemapXml(projects, BLOG_DATA, baseUrl);
  } catch (err) {
    console.warn('[generateSitemap] Fallback triggered:', err);
    return generateSitemapXml(projectsFallback as Project[], BLOG_DATA, baseUrl);
  }
}

/**
 * Node filesystem helper to write sitemap.xml to public and dist directories
 */
export async function generateAndSaveSitemap(baseUrl: string = BASE_URL): Promise<boolean> {
  try {
    if (typeof process === 'undefined') return false;

    const fs = await import('fs');
    const path = await import('path');

    const cwd = process.cwd();
    const fallbackProjectsPath = path.join(cwd, 'src', 'projectsFallback.json');

    let projects: Project[] = [];
    if (fs.existsSync(fallbackProjectsPath)) {
      const raw = fs.readFileSync(fallbackProjectsPath, 'utf-8');
      projects = JSON.parse(raw);
    } else {
      projects = projectsFallback as Project[];
    }

    const xmlContent = generateSitemapXml(projects, BLOG_DATA, baseUrl);

    const targetDirs = [
      path.join(cwd, 'public'),
      path.join(cwd, 'dist'),
    ];

    for (const dir of targetDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(path.join(dir, 'sitemap.xml'), xmlContent, 'utf-8');
    }

    console.log(`[generateSitemap] Wrote sitemap.xml with ${projects.length} properties and ${BLOG_DATA.length} articles.`);
    return true;
  } catch (err) {
    console.error('[generateSitemap] Generation error:', err);
    return false;
  }
}
