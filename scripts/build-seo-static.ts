import fs from 'fs';
import path from 'path';
import { BLOG_DATA, FAQ_DATA } from '../src/data';
import { translations, PRE_TRANSLATED_BLOGS, PRE_TRANSLATED_BLOG_DETAILS } from '../src/translations';
import { FAQ_TRANSLATIONS } from '../src/faqTranslations';
import { HOME_VIDEOS } from '../src/videos';
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

// Helper to escape XML
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
    let ogImage = "https://images.unsplash.com/photo-1596422846543-75c6fc18a523?q=80&w=1200&auto=format&fit=crop";

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
          "https://www.youtube.com/@shyanyee",
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

    let preRenderedBody = '';

    if (reqUrl === '/') jsonLdGraph.push(...videoObjects('en'));

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
                  <li><strong>Maintenance Fee:</strong> ${targetProject.maintenanceFee ? 'RM ' + targetProject.maintenanceFee + ' / sqft' : (targetProject.maintenanceFeeStr || 'Standard')}</li>
                  <li><strong>Completion:</strong> ${targetProject.completionStatus || 'Under Construction'} ${targetProject.completionYear ? '(' + targetProject.completionYear + ')' : ''}</li>
                </ul>
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

            ${Array.isArray(targetProject.layouts) && targetProject.layouts.length > 0 ? (() => {
              const rows = targetProject.layouts.map(layout => {
                const typeName = escapeXml(layout.typeName || '-');
                const size = escapeXml(layout.size != null ? `${layout.size}` : '-');
                const beds = escapeXml(layout.beds != null ? `${layout.beds}` : '-');
                const baths = escapeXml(layout.baths != null ? `${layout.baths}` : '-');
                const carParks = escapeXml(layout.carParks != null ? `${layout.carParks}` : '-');
                const priceFormatted = layout.estPrice != null && layout.estPrice !== 0 && (layout.estPrice as any) !== ''
                  ? `RM ${layout.estPrice.toLocaleString()}`
                  : 'Contact agent';
                const estPrice = escapeXml(priceFormatted);

                return `
                <tr>
                  <td style="border: 1px solid #e5e7eb; padding: 8px;">${typeName}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 8px;">${size}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 8px;">${beds}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 8px;">${baths}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 8px;">${carParks}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 8px;">${estPrice}</td>
                </tr>`;
              }).join('');

              const layoutImages = targetProject.layouts
                .filter(l => l.image)
                .map(layout => {
                  const alt = escapeXml(`${targetProject.name} ${layout.typeName || ''} floor plan — ${layout.size || ''} sq ft, ${layout.beds || ''} bedrooms`);
                  return `<img src="${layout.image}" alt="${alt}" loading="lazy" width="800" style="max-width:100%;height:auto;">`;
                }).join('\n              ');

              return `
            <section style="margin-bottom: 40px;">
              <h2>Unit Types and Layouts</h2>
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 16px;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Type</th>
                    <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Size (sq ft)</th>
                    <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Bedrooms</th>
                    <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Bathrooms</th>
                    <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Car Parks</th>
                    <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Indicative Price</th>
                  </tr>
                </thead>
                <tbody>${rows}
                </tbody>
              </table>
              ${layoutImages}
            </section>`;
            })() : ''}

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
        "datePublished": targetBlog.publishDate ? `${targetBlog.publishDate}-01` : "2026-01-01",
        "dateModified": new Date().toISOString().split('T')[0],
        "author": {
          "@type": "Person",
          "name": targetBlog.author || "Shyan Yee (REN 46305)",
          "url": baseUrl
        },
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
            <div style="margin-bottom: 40px; white-space: pre-line;">
              ${targetBlog.content ? targetBlog.content.replace(/#+\s+(.*?)\n/g, '<h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 32px; margin-bottom: 12px;">$1</h2>\n') : desc}
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
const ZH_BLOG_LIST = PRE_TRANSLATED_BLOGS['zh-CN'] || [];
const ZH_BLOG_DETAIL = PRE_TRANSLATED_BLOG_DETAILS['zh-CN'] || {};
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
  return `    <link rel="alternate" hreflang="en" href="${en}" />\n` +
         `    <link rel="alternate" hreflang="zh-CN" href="${zh}" />\n` +
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
    let ogImage = "https://images.unsplash.com/photo-1596422846543-75c6fc18a523?q=80&w=1200&auto=format&fit=crop";
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
        "sameAs": ["https://www.youtube.com/@shyanyee", "https://www.instagram.com/shyanyee/", "https://www.facebook.com/shyanyeeconsultant/", "https://wa.me/60108278932"], "priceRange": "$$$$"
      },
      { "@type": "WebSite", "@id": `${SITE}/#website`, "url": SITE, "name": "Shyan Yee 马来西亚房产平台", "inLanguage": ["en", "zh-CN"], "publisher": { "@id": `${SITE}/#agent` } },
      { "@type": "WebPage", "@id": canonical, "url": canonical, "inLanguage": "zh-CN", "isPartOf": { "@id": `${SITE}/#website` } }
    ];
    const crumbs = (items: [string, string][]) => graph.push({
      "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumb`,
      "itemListElement": items.map(([name, item], i) => ({ "@type": "ListItem", "position": i + 1, "name": name, ...(item ? { item } : {}) }))
    });
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
        ${Array.isArray(p.layouts) && p.layouts.length ? `<section style="margin-bottom: 32px;"><h2>${ZH.floorPlans || '户型图'}</h2><table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;"><thead><tr style="background:#f9fafb;"><th style="border:1px solid #e5e7eb;padding:8px;text-align:left;">户型</th><th style="border:1px solid #e5e7eb;padding:8px;text-align:left;">面积（平方尺）</th><th style="border:1px solid #e5e7eb;padding:8px;text-align:left;">房</th><th style="border:1px solid #e5e7eb;padding:8px;text-align:left;">浴室</th><th style="border:1px solid #e5e7eb;padding:8px;text-align:left;">车位</th><th style="border:1px solid #e5e7eb;padding:8px;text-align:left;">参考价</th></tr></thead><tbody>${p.layouts.map(l => `<tr><td style="border:1px solid #e5e7eb;padding:8px;">${escapeXml(l.typeName || '-')}</td><td style="border:1px solid #e5e7eb;padding:8px;">${l.size ?? '-'}</td><td style="border:1px solid #e5e7eb;padding:8px;">${l.beds ?? '-'}</td><td style="border:1px solid #e5e7eb;padding:8px;">${l.baths ?? '-'}</td><td style="border:1px solid #e5e7eb;padding:8px;">${l.carParks ?? '-'}</td><td style="border:1px solid #e5e7eb;padding:8px;">${l.estPrice ? 'RM ' + Number(l.estPrice).toLocaleString() : '洽询'}</td></tr>`).join('')}</tbody></table>
          ${p.layouts.filter(l => l.image).map(l => `<img src="${l.image}" alt="${escapeXml(`${p.name} ${l.typeName || ''} 户型图`)}" loading="lazy" width="800" style="max-width:100%;height:auto;margin-top:12px;">`).join('')}</section>` : ''}
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
        "datePublished": targetBlog.publishDate ? `${targetBlog.publishDate}-01` : "2026-01-01", "dateModified": new Date().toISOString().split('T')[0],
        "author": { "@type": "Person", "name": "Shyan Yee (REN 46305)", "url": SITE }, "publisher": { "@id": `${SITE}/#agent` },
        "mainEntityOfPage": { "@type": "WebPage", "@id": canonical } });
      if (zb.faqs && zb.faqs.length) graph.push({ "@type": "FAQPage", "@id": `${canonical}#faq`,
        "mainEntity": zb.faqs.map((f: any) => ({ "@type": "Question", "name": f.question, "acceptedAnswer": { "@type": "Answer", "text": f.answer } })) });
      const content = (zb.content || '').replace(/#+\s+(.*?)\n/g, '<h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 32px 0 12px;">$1</h2>\n');
      body = `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 0 auto; padding: 24px; color: #111827; line-height: 1.8;">
        ${zhNav([['首页', home], ['置业指南', `${SITE}/zh/blog`], [zb.title, '']])}
        <header style="margin-bottom: 32px; border-bottom: 1px solid #e5e7eb; padding-bottom: 24px;">
          <p style="font-size: 14px; color: #64748b;">${zb.category || '指南'} &bull; ${zb.publishDate || targetBlog.publishDate || '2026'}</p>
          <h1 style="font-size: 32px; font-weight: 800; line-height: 1.3; margin: 0 0 16px 0;">${zb.title}</h1>
          <p style="font-size: 18px; color: #4b5563; line-height: 1.6; margin: 0;">${desc}</p>
        </header>
        ${ogImage ? `<img src="${ogImage}" alt="${escapeXml(zb.title)}" style="width: 100%; max-height: 440px; object-fit: cover; border-radius: 12px; margin-bottom: 32px;" />` : ''}
        <main style="font-size: 16px; color: #334155;"><div style="white-space: pre-line;">${content}</div>
        ${zb.faqs && zb.faqs.length ? `<section style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-top: 40px;"><h3 style="font-size: 20px; font-weight: 700; margin: 0 0 16px 0;">常见问题</h3>${zb.faqs.map((f: any) => `<h4 style="font-size: 16px; font-weight: 700; margin: 12px 0 4px;">${f.question}</h4><p style="font-size: 15px; color: #475569; margin: 0;">${f.answer}</p>`).join('')}</section>` : ''}
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
console.log(`[SEO Static Build] Chinese (/zh) twins: home, ${staticRoutes.length} static pages, ${zhProjectCount} projects, ${zhBlogCount} articles.`);

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

// Project Pages with images
for (const p of projects) {
  if (p && p.id) {
    xml += `  <url>\n`;
    xml += `    <loc>https://shyanyee.com/projects/${p.id}</loc>\n`;
    xml += `    <lastmod>${p.syncedAt ? p.syncedAt.substring(0, 10) : todayStr}</lastmod>\n`;
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
    xml += `    <lastmod>${todayStr}</lastmod>\n`;
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
// Simplified Chinese pages
xml += `  <url><loc>https://shyanyee.com/zh</loc><lastmod>${todayStr}</lastmod><changefreq>daily</changefreq><priority>0.90</priority></url>\n`;
for (const r of staticRoutes) {
  xml += `  <url><loc>https://shyanyee.com/zh/${r}</loc><lastmod>${todayStr}</lastmod><changefreq>daily</changefreq><priority>0.80</priority></url>\n`;
}
for (const p of projects) {
  if (p && p.id) xml += `  <url><loc>https://shyanyee.com/zh/projects/${p.id}</loc><lastmod>${p.syncedAt ? p.syncedAt.substring(0, 10) : todayStr}</lastmod><changefreq>daily</changefreq><priority>0.80</priority></url>\n`;
}
for (const b of BLOG_DATA) {
  if (b && b.slug) xml += `  <url><loc>https://shyanyee.com/zh/blog/${b.slug}</loc><lastmod>${todayStr}</lastmod><changefreq>weekly</changefreq><priority>0.75</priority></url>\n`;
}
xml += `</urlset>\n`;

fs.writeFileSync(path.join(distPath, 'sitemap.xml'), xml, 'utf-8');
const publicDir = path.join(cwd, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf-8');

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

# Sitemaps
Sitemap: https://shyanyee.com/sitemap.xml
`;

fs.writeFileSync(path.join(distPath, 'robots.txt'), robotsTxt, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf-8');

console.log(`[SEO Static Build] Successfully pre-rendered ${projectCount} project pages, ${blogCount} blog articles, all static routes, robots.txt, and sitemap.xml!`);
