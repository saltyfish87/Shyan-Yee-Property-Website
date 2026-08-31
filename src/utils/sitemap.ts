import { Project } from '../types';
import { BLOG_DATA } from '../data';

export interface SitemapProject {
  id: string;
  name?: string;
  area?: string;
  location?: string;
  developer?: string;
  startingPrice?: number;
  syncedAt?: string;
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
  publishDate?: string;
  image?: string;
}

// Full live blog articles to include in sitemap
export const DEFAULT_SITEMAP_BLOGS: SitemapBlog[] = BLOG_DATA.map(b => ({
  slug: b.slug,
  title: b.title,
  summary: b.summary || b.metaDescription,
  publishDate: b.publishDate,
  image: b.image
}));

// Utility to escape XML special characters
function escapeXml(str: string | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate a full compliant XML Sitemap string with image extensions for Google Search Console
 */
export function generateSitemapXml(
  projects: Array<Project | SitemapProject> = [],
  blogs: SitemapBlog[] = DEFAULT_SITEMAP_BLOGS,
  baseUrl: string = 'https://shyanyee.com'
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

  // 1. Static Key Navigation Pages
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

  // 2. Individual Property Detail Pages
  for (const project of projects) {
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

      // Aggregate high-res image assets
      const imageList: string[] = [];
      if (project.images) {
        if (Array.isArray(project.images.overview)) imageList.push(...project.images.overview);
        if (Array.isArray(project.images.gallery)) imageList.push(...project.images.gallery);
        if (Array.isArray(project.images.layout)) imageList.push(...project.images.layout);
      }

      const validImages = Array.from(new Set(imageList))
        .filter((img) => img && typeof img === 'string' && img.startsWith('http'))
        .slice(0, 5);

      for (const imgUrl of validImages) {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${escapeXml(imgUrl)}</image:loc>\n`;
        xml += `      <image:title>${escapeXml(project.name)} ${escapeXml(project.area)} Malaysia Property</image:title>\n`;
        xml += `      <image:caption>${escapeXml(project.name)} luxury residence by ${escapeXml(cleanDev)} in ${escapeXml(project.location || project.area)}. Starting price from ${priceStr}</image:caption>\n`;
        xml += `    </image:image>\n`;
      }

      xml += `  </url>\n`;
    }
  }

  // 3. Blog & Market Insight Articles
  for (const post of blogs) {
    if (post && post.slug) {
      const loc = `${baseUrl}/blog/${post.slug}`;
      const lastmod = post.publishDate || todayStr;

      xml += `  <url>\n`;
      xml += `    <loc>${loc}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.80</priority>\n`;

      if (post.image && post.image.startsWith('http')) {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${escapeXml(post.image)}</image:loc>\n`;
        xml += `      <image:title>${escapeXml(post.title)}</image:title>\n`;
        xml += `      <image:caption>${escapeXml(post.summary || post.title)}</image:caption>\n`;
        xml += `    </image:image>\n`;
      }

      xml += `  </url>\n`;
    }
  }

  xml += `</urlset>\n`;
  return xml;
}

/**
 * Browser helper to trigger instant download of the current sitemap.xml file
 */
export function downloadSitemapFile(
  projects: Array<Project | SitemapProject> = [],
  blogs: SitemapBlog[] = DEFAULT_SITEMAP_BLOGS,
  filename: string = 'sitemap.xml'
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const xmlContent = generateSitemapXml(projects, blogs);
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Node environment helper script to trigger generation and write to filesystem (public/sitemap.xml and dist/sitemap.xml)
 */
export async function generateAndSaveSitemap(): Promise<boolean> {
  try {
    if (typeof process === 'undefined') return false;

    // Dynamically import fs & path to avoid bundling issues in frontend-only environments
    const fs = await import('fs');
    const path = await import('path');

    const cwd = process.cwd();
    const fallbackProjectsPath = path.join(cwd, 'src', 'projectsFallback.json');

    let projects: SitemapProject[] = [];
    if (fs.existsSync(fallbackProjectsPath)) {
      const raw = fs.readFileSync(fallbackProjectsPath, 'utf-8');
      projects = JSON.parse(raw);
    }

    const xmlContent = generateSitemapXml(projects, DEFAULT_SITEMAP_BLOGS);

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

    console.log(`[sitemap] Successfully generated sitemap.xml for ${projects.length} projects and ${DEFAULT_SITEMAP_BLOGS.length} articles.`);
    return true;
  } catch (err) {
    console.error('[sitemap] Failed to generate sitemap:', err);
    return false;
  }
}
