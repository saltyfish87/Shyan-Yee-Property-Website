import fs from 'fs';
import path from 'path';

const distPath = path.join(process.cwd(), 'dist');
const projectsFile = path.join(process.cwd(), 'src', 'projectsFallback.json');

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
const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf-8'));

const BLOG_DATA = [
  {
    id: 'b1',
    slug: 'kl-luxury-condos-2026-guide',
    title: 'Kuala Lumpur Luxury Condominium Buyer Guide 2026',
    summary: 'Comprehensive legal, financial and location framework for purchasing ultra-luxury residential towers in KLCC, Mont Kiara and Bukit Bintang.',
    publishDate: '2026-02-01',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 'b2',
    slug: 'foreign-buyer-malaysia-property-laws-2026',
    title: 'Foreigner Property Ownership Rules & Minimum Thresholds in Malaysia',
    summary: 'State-by-state breakdown of minimum price thresholds for foreign buyers in KL, Selangor, Penang & Johor in 2026.',
    publishDate: '2026-01-15',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop'
  }
];

// Helper to escape HTML characters
function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Generate Pre-rendered SEO HTML
function renderSeoHtml(html, reqUrl, targetProject = null) {
  try {
    let title = "Shyan Yee | Malaysia Luxury Properties & Landmark Residences Portal";
    let desc = "Discover 69+ premier Malaysian luxury properties, landmark condominiums, and investment real estate in Kuala Lumpur, Penang & Johor Bahru. Curated by Shyan Yee (REN 46305).";
    let canonical = "https://shyanyee.com";
    let ogImage = "https://images.unsplash.com/photo-1596422846543-75c6fc18a523?q=80&w=1200&auto=format&fit=crop";

    let jsonLdGraph = [
      {
        "@type": "RealEstateAgent",
        "@id": "https://shyanyee.com/#agent",
        "name": "Shyan Yee | Malaysia Luxury Properties & Landmark Residences Portal",
        "url": "https://shyanyee.com",
        "logo": "https://lh3.googleusercontent.com/d/1jrGU7WOGJOTL_ORhhYMpjZ7IgMoNavKY",
        "image": "https://lh3.googleusercontent.com/d/1jrGU7WOGJOTL_ORhhYMpjZ7IgMoNavKY",
        "telephone": "+60195598932",
        "email": "shyanyeews@gmail.com",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Kuala Lumpur",
          "addressRegion": "Wilayah Persekutuan",
          "addressCountry": "MY"
        },
        "priceRange": "$$$$"
      },
      {
        "@type": "WebSite",
        "@id": "https://shyanyee.com/#website",
        "url": "https://shyanyee.com",
        "name": "Shyan Yee Real Estate Portal",
        "description": "Malaysia Luxury Properties & Landmark Residences Catalog",
        "publisher": { "@id": "https://shyanyee.com/#agent" },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://shyanyee.com/projects?search={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    ];

    let preRenderedBody = '';

    if (!targetProject && (reqUrl.includes('/projects') || reqUrl.includes('/project'))) {
      canonical = "https://shyanyee.com/projects";
      title = "Malaysia Landmark Property Projects Catalogue | Floor Plans & Pricing - Shyan Yee";
      desc = "Explore 69+ premier Malaysian property developments including Pavilion Square, Queenswoodz, Amika Residence, Core Residence TRX, Aetas Seputeh & Bangsar Hill Park. View floor plans, developer specs, and pricing.";
    }

    if (targetProject) {
      const cleanDev = (targetProject.developer || '').replace(/\(.*?\)/g, "").trim();
      const priceStr = targetProject.startingPrice ? `RM ${targetProject.startingPrice.toLocaleString()}` : '';
      
      canonical = `https://shyanyee.com/projects/${targetProject.id}`;
      title = `${targetProject.name} ${targetProject.area} | Price, Floor Plan, Review & Sales - Shyan Yee`;
      desc = `${targetProject.name} is a landmark ${targetProject.projectType || 'Serviced Apartment'} residence by ${cleanDev} in ${targetProject.location}. Layouts range from ${targetProject.bedroomsMin}-${targetProject.bedroomsMax} bedrooms (${targetProject.builtUpMin ? targetProject.builtUpMin.toLocaleString() : ''}-${targetProject.builtUpMax ? targetProject.builtUpMax.toLocaleString() : ''} sqft). ${priceStr ? 'Prices start from ' + priceStr + '.' : ''} Explore official floor plans and showroom appointments with Shyan Yee.`;

      if (targetProject.images && targetProject.images.overview && targetProject.images.overview[0]) {
        ogImage = targetProject.images.overview[0];
      }

      jsonLdGraph.push({
        "@type": "RealEstateListing",
        "@id": `${canonical}#listing`,
        "name": `${targetProject.name} Luxury Residences`,
        "description": desc,
        "url": canonical,
        "image": ogImage,
        "offers": {
          "@type": "AggregateOffer",
          "priceCurrency": "MYR",
          "lowPrice": targetProject.startingPrice || 500000,
          "offerCount": targetProject.totalUnits || 100,
          "price": priceStr || "Price upon application"
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

      jsonLdGraph.push({
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://shyanyee.com" },
          { "@type": "ListItem", "position": 2, "name": "Projects", "item": "https://shyanyee.com/projects" },
          { "@type": "ListItem", "position": 3, "name": targetProject.name, "item": canonical }
        ]
      });

      jsonLdGraph.push({
        "@type": "FAQPage",
        "@id": `${canonical}#faq`,
        "mainEntity": [
          {
            "@type": "Question",
            "name": `What is the starting price for ${targetProject.name}?`,
            "acceptedAnswer": { "@type": "Answer", "text": `Starting price for ${targetProject.name} is ${priceStr || 'available upon inquiry'}, located in ${targetProject.area}, ${targetProject.location}.` }
          },
          {
            "@type": "Question",
            "name": `Who is the developer of ${targetProject.name}?`,
            "acceptedAnswer": { "@type": "Answer", "text": `${targetProject.name} is developed by ${cleanDev}.` }
          },
          {
            "@type": "Question",
            "name": `What layouts and sizes are available at ${targetProject.name}?`,
            "acceptedAnswer": { "@type": "Answer", "text": `${targetProject.name} offers unit sizes from ${targetProject.builtUpMin ? targetProject.builtUpMin.toLocaleString() : ''} sqft to ${targetProject.builtUpMax ? targetProject.builtUpMax.toLocaleString() : ''} sqft, with ${targetProject.bedroomsMin} to ${targetProject.bedroomsMax} bedrooms.` }
          },
          {
            "@type": "Question",
            "name": `How can I get floor plans or book a private showroom viewing for ${targetProject.name}?`,
            "acceptedAnswer": { "@type": "Answer", "text": `You can view floor plans and request a private viewing with licensed agent Shyan Yee (REN 46305) via WhatsApp at +60 19-559 8932 or on shyanyee.com.` }
          }
        ]
      });

      preRenderedBody = `
        <div style="font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 24px; color: #111827;">
          <header style="margin-bottom: 32px; border-bottom: 1px solid #e5e7eb; padding-bottom: 24px;">
            <a href="https://shyanyee.com" style="color: #2563eb; text-decoration: none; font-weight: 600;">&larr; Back to Shyan Yee Real Estate Portal</a>
            <h1 style="font-size: 32px; font-weight: 800; margin-top: 16px; margin-bottom: 8px;">${targetProject.name} (${targetProject.area}, ${targetProject.location})</h1>
            <p style="font-size: 18px; color: #4b5563;">${desc}</p>
          </header>

          <main>
            <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 40px;">
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;">
                <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 12px;">Property Key Specs</h2>
                <ul style="list-style: none; padding: 0; line-height: 2;">
                  <li><strong>Developer:</strong> ${cleanDev}</li>
                  <li><strong>Location:</strong> ${targetProject.area}, ${targetProject.location}</li>
                  <li><strong>Tenure:</strong> ${targetProject.tenure || 'Freehold'}</li>
                  <li><strong>Property Type:</strong> ${targetProject.projectType || 'Serviced Residence'}</li>
                  <li><strong>Starting Price:</strong> ${priceStr || 'Contact Agent for Sales Sheet'}</li>
                  <li><strong>Bedrooms:</strong> ${targetProject.bedroomsMin} - ${targetProject.bedroomsMax} Beds</li>
                  <li><strong>Built-up Sizes:</strong> ${targetProject.builtUpMin ? targetProject.builtUpMin.toLocaleString() : ''} - ${targetProject.builtUpMax ? targetProject.builtUpMax.toLocaleString() : ''} sqft</li>
                </ul>
              </div>

              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px;">
                <h2 style="font-size: 20px; font-weight: 700; color: #166534; margin-bottom: 12px;">Agent Private VIP Sales Inquiry</h2>
                <p style="color: #15803d; margin-bottom: 16px;">Contact licensed property agent <strong>Shyan Yee (REN 46305)</strong> for private showroom viewings, direct developer rebates, and official floor plan PDFs.</p>
                <a href="https://wa.me/60195598932?text=Hi%20Shyan%20Yee,%20I%20am%20interested%20in%20${encodeURIComponent(targetProject.name)}" 
                   style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">
                   WhatsApp Agent Shyan Yee (+60 19-559 8932)
                </a>
              </div>
            </section>
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
    seoHtml = seoHtml.replace(/<meta property="og:url" content=".*?" \/>/s, `<meta property="og:url" content="${canonical}" />`);

    if (preRenderedBody) {
      seoHtml = seoHtml.replace('<div id="root"></div>', `<div id="root">${preRenderedBody}</div>`);
    }

    const jsonLdScript = `<script id="seo-json-ld" type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": jsonLdGraph })}</script>`;
    seoHtml = seoHtml.replace(/<script id="seo-json-ld" type="application\/ld\+json">.*?<\/script>/s, jsonLdScript);

    return seoHtml;
  } catch (err) {
    console.error("renderSeoHtml Error:", err);
    return html;
  }
}

// 1. Generate 404.html (Fallback for static SPA hosts)
fs.writeFileSync(path.join(distPath, '404.html'), renderSeoHtml(rawHtml, '/'), 'utf-8');

// 2. Generate _redirects (For Netlify / Cloudflare Pages)
fs.writeFileSync(path.join(distPath, '_redirects'), '/*   /index.html   200\n', 'utf-8');

// 3. Generate vercel.json (For Vercel)
fs.writeFileSync(
  path.join(distPath, 'vercel.json'),
  JSON.stringify({ rewrites: [{ source: "/(.*)", destination: "/index.html" }] }, null, 2),
  'utf-8'
);

// 4. Generate static.json (For Heroku/Dokku/Surge)
fs.writeFileSync(
  path.join(distPath, 'static.json'),
  JSON.stringify({ root: "dist/", clean_urls: false, routes: { "/**": "index.html" } }, null, 2),
  'utf-8'
);

// 5. Pre-render static pages: /projects, /compare, /map, /blog, /calculator, /faq
const staticRoutes = ['projects', 'compare', 'map', 'blog', 'calculator', 'faq'];
for (const r of staticRoutes) {
  const dir = path.join(distPath, r);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), renderSeoHtml(rawHtml, `/${r}`), 'utf-8');
}

// 6. Pre-render all 69 project routes into dist/projects/[id]/index.html
const projectsDir = path.join(distPath, 'projects');
if (!fs.existsSync(projectsDir)) fs.mkdirSync(projectsDir, { recursive: true });

let count = 0;
for (const p of projects) {
  if (p.id) {
    const pDir = path.join(projectsDir, p.id);
    if (!fs.existsSync(pDir)) fs.mkdirSync(pDir, { recursive: true });
    const rendered = renderSeoHtml(rawHtml, `/projects/${p.id}`, p);
    fs.writeFileSync(path.join(pDir, 'index.html'), rendered, 'utf-8');
    count++;
  }
}

console.log(`Successfully pre-rendered SEO static pages for ${count} property projects, 404 fallback & static routes in dist!`);
