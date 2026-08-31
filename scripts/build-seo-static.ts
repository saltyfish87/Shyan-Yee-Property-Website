import fs from 'fs';
import path from 'path';
import { BLOG_DATA, FAQ_DATA } from '../src/data';
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

      // Add FAQPage Schema
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
            "acceptedAnswer": { "@type": "Answer", "text": `You can view floor plans and request a private viewing with licensed agent Shyan Yee (REN 46305) via WhatsApp at +60 10-827 8932 or on shyanyee.com.` }
          }
        ]
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
                    Connect directly with licensed real estate negotiator <strong>Shyan Yee (REN 46305)</strong> for official floor plans, direct developer rebates, dynamic loan calculations, and private showroom appointments.
                  </p>
                </div>
                <a href="https://wa.me/60108278932?text=Hi%20Shyan%20Yee,%20I%20am%20interested%20in%20${encodeURIComponent(targetProject.name)}" 
                   style="display: inline-block; background: #16a34a; color: white; padding: 14px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; text-align: center; font-size: 16px;">
                   WhatsApp Agent Shyan Yee (+60 10-827 8932)
                </a>
              </div>
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

    return seoHtml;
  } catch (err) {
    console.error("renderSeoHtml Error:", err);
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
Allow: /sitemap.xml

# Sitemaps
Sitemap: https://shyanyee.com/sitemap.xml
`;

fs.writeFileSync(path.join(distPath, 'robots.txt'), robotsTxt, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf-8');

console.log(`[SEO Static Build] Successfully pre-rendered ${projectCount} project pages, ${blogCount} blog articles, all static routes, robots.txt, and sitemap.xml!`);
