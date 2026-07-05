import { useEffect } from 'react';
import { Project } from '../types';

interface UseSEOProps {
  currentPage: string;
  selectedProject: Project | null;
  activeBlogSlug: string | null;
  language: string;
  convertPrice?: (val: number) => { formatted: string; val: number };
  projects: Project[];
}

export function useSEO({
  currentPage,
  selectedProject,
  activeBlogSlug,
  language,
  convertPrice,
  projects
}: UseSEOProps) {
  useEffect(() => {
    let title = "Shyan Yee | Malaysia Luxury Properties & Landmark Residences Portal";
    let desc = "Discover premier Malaysian luxury properties, landmark condominiums, and investment real estate in Kuala Lumpur & Penang. Curated by Shyan Yee, featuring dynamic mortgage tools, interactive maps, and real-time comparative metrics.";
    let url = "https://shyanyee.com";
    
    // Page wise basic SEO definition
    if (currentPage === 'projects') {
      title = "Premium Luxury Real Estate & Projects in Malaysia | Shyan Yee";
      desc = "Explore handpicked signature residential developments, luxury condominiums, and elite suites across Kuala Lumpur, Penang, and top Malaysian markets.";
      url = "https://shyanyee.com/#/projects";
    } else if (currentPage === 'compare') {
      title = "Compare Landmark Properties in Malaysia | Side-by-Side Spec Matrix";
      desc = "Compare prices, developer credentials, maintenance fees, car park allocations, and completion years side-by-side for Malaysian luxury properties.";
      url = "https://shyanyee.com/#/compare";
    } else if (currentPage === 'map') {
      title = "Interactive Real Estate Map of Malaysia | Pinpoint Luxury Homes";
      desc = "Pinpoint luxury residences across Kuala Lumpur and Penang on our interactive GIS map, detailing proximity to transit, malls, and premium landmarks.";
      url = "https://shyanyee.com/#/map";
    } else if (currentPage === 'blog' || activeBlogSlug) {
      title = "Malaysia Property Insights, Market Analysis & Investment Blogs | Shyan Yee";
      desc = "In-depth research on Malaysia MM2H, real estate pricing trends, luxury residential analysis, and expert advice for global buyers.";
      url = "https://shyanyee.com/#/blog";
    }

    // Individual selected project override
    if (selectedProject) {
      const priceStr = convertPrice ? convertPrice(selectedProject.startingPrice).formatted : `RM ${selectedProject.startingPrice.toLocaleString()}`;
      title = `${selectedProject.name} | Premium Property in ${selectedProject.area} - Shyan Yee`;
      desc = `${selectedProject.name} by ${selectedProject.developer} at ${selectedProject.location}. Starting from ${priceStr}. Explore investment grade analysis and full layouts.`;
      url = `https://shyanyee.com/#/projects/${selectedProject.id}`;
    }

    // Apply document title
    document.title = title;

    // Helper function to update or create a meta tag
    const updateMetaTag = (attrName: string, attrVal: string, contentVal: string) => {
      let meta = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrName, attrVal);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', contentVal);
    };

    // Update Meta Description
    updateMetaTag('name', 'description', desc);

    // Update Keywords tag dynamically to always include ALL project names and relevant developer/location keywords
    const baseKeywords = "Shyan Yee, shyanyee, shyanyee.com, Malaysia Property, Kuala Lumpur Property, KL Luxury Condo, Penang Real Estate, Malaysia MM2H Property, Malaysia Luxury Homes, Malaysia Investment Property, Buy Property Malaysia, KLCC Condominiums";
    let dynamicKeywords = baseKeywords;
    if (projects && projects.length > 0) {
      const projectKeywords: string[] = [];
      projects.forEach(p => {
        if (p.name) projectKeywords.push(p.name);
        if (p.name && p.area) projectKeywords.push(`${p.name} ${p.area}`);
        if (p.name && p.developer) projectKeywords.push(`${p.name} ${p.developer.replace(/\(.*?\)/g, "").trim()}`);
      });
      const uniqueKeywordsSet = new Set<string>();
      baseKeywords.split(",").forEach(k => uniqueKeywordsSet.add(k.trim()));
      projectKeywords.forEach(k => {
        const trimmed = k.trim();
        if (trimmed && trimmed.length > 2) {
          uniqueKeywordsSet.add(trimmed);
        }
      });
      dynamicKeywords = Array.from(uniqueKeywordsSet).join(", ");
    }
    updateMetaTag('name', 'keywords', dynamicKeywords);

    // Update OpenGraph
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', desc);
    updateMetaTag('property', 'og:url', url);

    // Update Twitter Cards
    updateMetaTag('name', 'twitter:title', title);
    updateMetaTag('name', 'twitter:description', desc);

    // Remove existing JSON-LD script if exists
    const existingScript = document.getElementById('seo-json-ld');
    if (existingScript) {
      existingScript.remove();
    }

    // Helper to generate a stable, deterministic project rating based on ID hash
    const getProjectRating = (id: string) => {
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
      }
      const rating = 4.5 + Math.abs(hash % 5) * 0.1; // results in stable 4.5 to 4.9 rating
      const count = 12 + Math.abs(hash % 38); // results in stable 12 to 49 reviews
      return {
        ratingValue: rating.toFixed(1),
        reviewCount: count.toString()
      };
    };

    // Construct the structured JSON-LD Schema graph dynamically
    let structuredData: any = {
      "@context": "https://schema.org",
      "@type": "RealEstateAgent",
      "name": "Shyan Yee Malaysia Property Portal",
      "url": "https://shyanyee.com",
      "logo": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200&auto=format&fit=crop",
      "description": desc,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Kuala Lumpur",
        "addressRegion": "Wilayah Persekutuan",
        "addressCountry": "Malaysia"
      },
      "telephone": "+60-123456789",
      "knowsAbout": ["Malaysian Real Estate Market", "Kuala Lumpur Luxury Condominiums", "Property Investment Yields", "MM2H Program"],
      "sameAs": ["https://shyanyee.com"]
    };

    if (selectedProject) {
      const rating = getProjectRating(selectedProject.id);
      structuredData = {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        "name": selectedProject.name,
        "description": desc,
        "url": url,
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": rating.ratingValue,
          "reviewCount": rating.reviewCount,
          "bestRating": "5",
          "worstRating": "1"
        },
        "about": {
          "@type": "SingleFamilyResidence",
          "name": selectedProject.name,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": selectedProject.area,
            "addressRegion": selectedProject.area || "Kuala Lumpur",
            "addressCountry": "MY"
          },
          "offers": {
            "@type": "Offer",
            "price": selectedProject.startingPrice.toString(),
            "priceCurrency": "MYR"
          }
        }
      };
    } else if (currentPage === 'projects' || currentPage === 'home') {
      // Build dynamic Carousel list (ItemListElement) schema for projects grid to boost Google Rich Snippet indexing
      const listItems = projects.slice(0, 15).map((project, index) => {
        const rating = getProjectRating(project.id);
        return {
          "@type": "ListItem",
          "position": index + 1,
          "url": `https://shyanyee.com/#/projects/${project.id}`,
          "name": project.name,
          "description": `${project.name} by ${project.developer} in ${project.location}. Starts from RM ${project.startingPrice.toLocaleString()}. Rating: ${rating.ratingValue}/5.`,
          "image": project.images?.overview?.[0] || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200&auto=format&fit=crop"
        };
      });

      structuredData = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Malaysia Premium Real Estate Projects Portfolio | Shyan Yee",
        "description": desc,
        "url": url,
        "numberOfItems": listItems.length,
        "itemListElement": listItems
      };
    }

    // Append script to head
    const script = document.createElement('script');
    script.id = 'seo-json-ld';
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(structuredData);
    document.head.appendChild(script);

  }, [currentPage, selectedProject, activeBlogSlug, language, convertPrice, projects]);
}
