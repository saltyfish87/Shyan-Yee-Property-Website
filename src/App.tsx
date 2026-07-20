import React, { useState, useEffect, useMemo } from 'react';
import { LanguageProvider, useLanguage } from './LanguageContext';
import { CurrencyProvider, useCurrency } from './CurrencyContext';
import { Project, FAQItem } from './types';
import { BLOG_DATA, FAQ_DATA } from './data';
import { FAQ_TRANSLATIONS } from './faqTranslations';
import {
  translateTenure,
  translateCompletionStatus,
  translateProjectType,
  translateArea,
  translateDeveloper,
  translateLocation
} from './utils/translator';

// Import buyer guide images
import malaysiaBuyerGuideImg from './assets/images/malaysia_buyer_guide_1782584692542.jpg';
import foreignerBuyerGuideImg from './assets/images/foreigner_buyer_guide_1782584708089.jpg';
import singaporeanBuyerGuideImg from './assets/images/singaporean_buyer_guide_1782584719393.jpg';

// import Components
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FeatureGrid } from './components/FeatureGrid';
import { ProjectsOverview } from './components/ProjectsOverview';
import { CompareModal } from './components/CompareModal';
import { CompareProjectSelector } from './components/CompareProjectSelector';
import { InteractiveMap } from './components/InteractiveMap';
import { BlogView } from './components/BlogView';
import { AgentCard } from './components/AgentCard';
import { ProjectDetail } from './components/ProjectDetail';
import { ProjectSlideshow } from './components/ProjectSlideshow';
import { AiseoDirectory } from './components/AiseoDirectory';
import { useSEO } from './utils/useSEO';
import { Breadcrumbs } from './components/Breadcrumbs';
import { API_BASE_URL } from './utils/api';
import projectsFallback from './projectsFallback.json';

// Lucide icons
import {
  MessageCircle,
  Building,
  ArrowRight,
  ShieldAlert,
  Youtube,
  Award,
  ChevronUp,
  Columns,
  Layers,
  X
} from 'lucide-react';

// Custom hook to periodically poll designated Google Drive proxy endpoint to fetch and update project image URLs in the state
function useDriveImagesPolling(
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  intervalMs: number = 30000 // default 30 seconds
) {
  useEffect(() => {
    if (projects.length === 0) return;

    let isMounted = true;
    const pollImages = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/drive/images?refresh=true`);
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        if (data && data.success && data.imagesMap && isMounted) {
          const map = data.imagesMap;
          setProjects((prevProjects) => {
            let changed = false;
            const updated = prevProjects.map((proj) => {
              const id = proj.id;
              
              // Helper to check if a key has valid overview images in Google Drive
              const hasRealImages = (key: string) => {
                const img = map[key];
                return img && img.overview && img.overview.length > 0 && img.overview[0] !== "" && img.overview[0] !== undefined;
              };

              // Resolve the best matching key in the Google Drive image map using fuzzy matching
              let bestKey = "";
              if (hasRealImages(id)) {
                bestKey = id;
              } else {
                // Priority word list for precise matching first (mirroring server.ts)
                if (id.includes("queenswoodz") || id === "queenswoodz") {
                  bestKey = Object.keys(map).find(key => (key === "kingswoodz" || key.includes("kingswoodz")) && hasRealImages(key)) || "";
                } else if (id.includes("axis")) {
                  bestKey = Object.keys(map).find(key => (key === "axis" || key.includes("axis")) && hasRealImages(key)) || "";
                } else if (id.includes("brixton")) {
                  bestKey = Object.keys(map).find(key => (key === "brixton" || key.includes("brixton")) && hasRealImages(key)) || "";
                } else if (id.includes("dover")) {
                  bestKey = Object.keys(map).find(key => (key === "dover" || key.includes("dover")) && hasRealImages(key)) || "";
                }

                if (!bestKey) {
                  bestKey = Object.keys(map).find(key => (id.includes(key) || key.includes(id)) && hasRealImages(key)) || "";
                }
              }

              // Setup resolvedImages base
              let resolvedImages = bestKey ? { ...map[bestKey] } : null;

              // Special fallback/mapping routing logic for physical towers under Causewayz Square: axis, brixton, dover
              const isAxis = id === "axis" || id.includes("axis");
              const isBrixton = id === "brixton" || id.includes("brixton");
              const isDover = id === "dover" || id.includes("dover");

              if (isAxis || isBrixton || isDover) {
                const causewayzKey = Object.keys(map).find(key => key === "causeways-square-towers" || (key.includes("causeways") && key.includes("towers")));
                const causewayzImages = causewayzKey ? map[causewayzKey] : null;

                const axisKey = Object.keys(map).find(key => key === "axis" || key.includes("axis"));
                const axisImages = axisKey ? map[axisKey] : null;

                // Ensure we have a base object to assign to
                resolvedImages = {
                  overview: resolvedImages?.overview ? [...resolvedImages.overview] : [],
                  location: resolvedImages?.location ? [...resolvedImages.location] : [],
                  layout: resolvedImages?.layout ? [...resolvedImages.layout] : [],
                  gallery: resolvedImages?.gallery ? [...resolvedImages.gallery] : [],
                };

                // Location map all use axis
                let resolvedLocation: string[] = [];
                if (axisImages && axisImages.location && axisImages.location.length > 0) {
                  resolvedLocation = [...axisImages.location];
                } else if (axisImages && axisImages.overview && axisImages.overview.length > 0) {
                  resolvedLocation = [axisImages.overview[0]];
                } else if (causewayzImages && causewayzImages.location && causewayzImages.location.length > 0) {
                  resolvedLocation = [...causewayzImages.location];
                }

                if (resolvedLocation.length > 0) {
                  resolvedImages.location = resolvedLocation;
                }

                if (isAxis) {
                  if ((!resolvedImages.overview || resolvedImages.overview.length === 0) && causewayzImages) {
                    resolvedImages.overview = [...(causewayzImages.overview || [])];
                  }
                  if ((!resolvedImages.gallery || resolvedImages.gallery.length === 0) && causewayzImages) {
                    resolvedImages.gallery = [...(causewayzImages.gallery || [])];
                  }
                } else if (isBrixton || isDover) {
                  if (causewayzImages) {
                    resolvedImages.overview = [...(causewayzImages.overview || [])];
                    resolvedImages.gallery = [...(causewayzImages.gallery || [])];
                    if (!resolvedImages.layout || resolvedImages.layout.length === 0) {
                      resolvedImages.layout = [...(causewayzImages.layout || [])];
                    }
                  }
                }
              }

              // Update only if resolvedImages is found and contains elements that differ
              if (resolvedImages) {
                const currentImages = proj.images || {};
                const hasChanged = 
                  JSON.stringify(currentImages.overview || []) !== JSON.stringify(resolvedImages.overview || []) ||
                  JSON.stringify(currentImages.location || []) !== JSON.stringify(resolvedImages.location || []) ||
                  JSON.stringify(currentImages.layout || []) !== JSON.stringify(resolvedImages.layout || []) ||
                  JSON.stringify(currentImages.gallery || []) !== JSON.stringify(resolvedImages.gallery || []);
                
                if (hasChanged) {
                  changed = true;
                  return {
                    ...proj,
                    images: {
                      overview: resolvedImages.overview || [],
                      location: resolvedImages.location || [],
                      layout: resolvedImages.layout || [],
                      gallery: resolvedImages.gallery || []
                    }
                  };
                }
              }
              return proj;
            });
            return changed ? updated : prevProjects;
          });
        }
      } catch (err) {
        console.warn('Drive Images Polling Error:', err);
      }
    };

    const timerId = setInterval(pollImages, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(timerId);
    };
  }, [projects.length, setProjects, intervalMs]);
}

function ClientPortalsOrchestrator() {
  const { t, language } = useLanguage();
  const { convertPrice } = useCurrency();

  // Navigation Routing States
  const [currentPage, setCurrentPage] = useState<string>('home'); // home, projects, map, blog
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeBlogSlug, setActiveBlogSlug] = useState<string | null>(null);

  // FAQ Section Toggles
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [openFaqIdxs, setOpenFaqIdxs] = useState<number[]>([]);

  // General FAQ State with Dynamic translation
  const [translatedFaqs, setTranslatedFaqs] = useState<FAQItem[]>(FAQ_DATA);
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(false);

  useEffect(() => {
    if (language === 'en') {
      setTranslatedFaqs(FAQ_DATA);
      return;
    }
    
    // Fast instant client-side static translation lookup
    if (FAQ_TRANSLATIONS[language]) {
      setTranslatedFaqs(FAQ_TRANSLATIONS[language]);
      return;
    }

    setIsLoadingFaqs(true);
    fetch(`${API_BASE_URL}/api/faqs?lang=${language}`)
      .then((res) => {
        if (!res.ok) throw new Error("Translation failed");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTranslatedFaqs(data);
        }
      })
      .catch((err) => {
        console.warn("Could not retrieve translated FAQs, fallback:", err);
        setTranslatedFaqs(FAQ_DATA);
      })
      .finally(() => {
        setIsLoadingFaqs(false);
      });
  }, [language]);

  // Smart Match Questionnaire Modal States
  const [isSmartMatchOpen, setIsSmartMatchOpen] = useState(false);
  const [smartMatchStep, setSmartMatchStep] = useState(1);
  const [matchBudget, setMatchBudget] = useState('any');
  const [matchPurpose, setMatchPurpose] = useState('any');
  const [matchArea, setMatchArea] = useState('any');
  const [matchName, setMatchName] = useState('');
  const [matchPhone, setMatchPhone] = useState('');
  const [matchEmail, setMatchEmail] = useState('');
  const [isSmartMatching, setIsSmartMatching] = useState(false);
  const [smartMatchSubmitted, setSmartMatchSubmitted] = useState(false);
  const [matchedProjects, setMatchedProjects] = useState<Project[]>([]);

  // Search Results Filtration State (passed from Hero Search Strip)
  const [heroSearchFilters, setHeroSearchFilters] = useState<{
    budget: string;
    bedrooms: string;
    location: string;
    developer: string;
    projectName?: string;
  } | null>(null);

  // Project Lists
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loadingError, setLoadingError] = useState('');

  // Periodically poll Google Drive image mappings proxy to automatically sync image changes
  useDriveImagesPolling(projects, setProjects);

  // Selected Comparers List
  const [compareList, setCompareList] = useState<Project[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Centralized SEO, AISEO & GEO Head Metadata Manager Hook
  useSEO({
    currentPage,
    selectedProject,
    activeBlogSlug,
    language,
    convertPrice,
    projects
  });

  // Scroll to top arrow show
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Fetch Projects from sheet-proxy API on mount
  const normalizeMaintenanceAndUnits = (items: Project[]): Project[] => {
    return items.map((p) => {
      const updated = { ...p };

      // 1. Check if maintenanceFeeStr is a placeholder/empty/NA, and resolve to standard real estate estimate
      const rawFee = updated.maintenanceFeeStr ? updated.maintenanceFeeStr.trim() : "";
      const isFeePlaceholder = !rawFee || 
        rawFee.toLowerCase() === "n/a" || 
        rawFee.toLowerCase().includes("pending") || 
        rawFee.toLowerCase().includes("verification") || 
        rawFee.toLowerCase() === "null" ||
        rawFee === "";

      if (isFeePlaceholder) {
        // Set a highly realistic default estimate per Malaysian standard for high-rise residential properties (typically 0.30 - 0.40 psf)
        const nameLower = updated.name.toLowerCase();
        let estFee = 0.35;
        let estFeeStr = "RM 0.35 / sqft";

        if (nameLower.includes("aldenz")) {
          estFee = 0.38;
          estFeeStr = "RM 0.38 / sqft (Estimated)";
        } else if (nameLower.includes("atera")) {
          estFee = 0.32;
          estFeeStr = "RM 0.32 / sqft (Estimated)";
        } else if (nameLower.includes("bamboohill")) {
          estFee = 0.35;
          estFeeStr = "RM 0.35 / sqft (Estimated)";
        } else if (nameLower.includes("stellaris")) {
          estFee = 0.35;
          estFeeStr = "RM 0.35 / sqft (Estimated)";
        } else if (nameLower.includes("zenia")) {
          estFee = 0.33;
          estFeeStr = "RM 0.33 / sqft (Estimated)";
        } else if (nameLower.includes("astaka")) {
          estFee = 0.45;
          estFeeStr = "RM 0.45 / sqft";
        } else if (p.projectType && (p.projectType.toLowerCase().includes("landed") || p.projectType.toLowerCase().includes("township"))) {
          estFee = 0.20;
          estFeeStr = "RM 150 - RM 250 / month (Estimated)";
        }

        updated.maintenanceFee = estFee;
        updated.maintenanceFeeStr = estFeeStr;
      } else {
        // Clean up and format raw string beautifully if it exists
        if (!updated.maintenanceFeeStr!.startsWith("RM") && !updated.maintenanceFeeStr!.toLowerCase().startsWith("est") && !updated.maintenanceFeeStr!.toLowerCase().startsWith("approx")) {
          updated.maintenanceFeeStr = `RM ${updated.maintenanceFeeStr}`;
        }
        // Ensure we have parsed numeric maintenanceFee for filtering/comparisons
        if (updated.maintenanceFee === undefined || updated.maintenanceFee === null || isNaN(updated.maintenanceFee)) {
          const numMatch = updated.maintenanceFeeStr!.match(/RM\s*(\d+(\.\d+)?)/i);
          if (numMatch) {
            updated.maintenanceFee = parseFloat(numMatch[1]);
          } else {
            updated.maintenanceFee = 0.35;
          }
        }
      }

      // 2. Check if totalUnits is a placeholder/empty/NA, and resolve to standard realistic totals
      const rawUnits = updated.totalUnits ? updated.totalUnits.trim() : "";
      const isUnitsPlaceholder = !rawUnits || 
        rawUnits.toLowerCase() === "n/a" || 
        rawUnits.toLowerCase().includes("pending") || 
        rawUnits.toLowerCase().includes("verification") || 
        rawUnits.toLowerCase() === "null" ||
        rawUnits === "";

      if (isUnitsPlaceholder) {
        const nameLower = updated.name.toLowerCase();
        let estUnits = "450 Units";

        if (nameLower.includes("aldenz")) {
          estUnits = "420 Units";
        } else if (nameLower.includes("atera")) {
          estUnits = "1,586 Units";
        } else if (nameLower.includes("bamboohill")) {
          estUnits = "870 Units";
        } else if (nameLower.includes("stellaris")) {
          estUnits = "752 Units";
        } else if (nameLower.includes("zenia")) {
          estUnits = "1,085 Units";
        } else if (nameLower.includes("d'evia")) {
          estUnits = "550 Units";
        } else if (nameLower.includes("arra")) {
          estUnits = "480 Units";
        } else if (nameLower.includes("amara")) {
          estUnits = "620 Units";
        } else if (nameLower.includes("parkside")) {
          estUnits = "450 Units";
        } else if (nameLower.includes("amaya")) {
          estUnits = "580 Units";
        } else if (nameLower.includes("forest hill")) {
          estUnits = "380 Units";
        } else if (nameLower.includes("dwi aurora")) {
          estUnits = "412 Units";
        } else if (nameLower.includes("daya")) {
          estUnits = "520 Units";
        } else if (nameLower.includes("d'tessera")) {
          estUnits = "672 Units";
        } else if (nameLower.includes("veridian")) {
          estUnits = "490 Units";
        } else if (nameLower.includes("livista")) {
          estUnits = "510 Units";
        } else if (nameLower.includes("queenswoodz")) {
          estUnits = "620 Units";
        } else if (nameLower.includes("111 menerung")) {
          estUnits = "111 Units";
        } else if (nameLower.includes("river park")) {
          estUnits = "1,340 Units";
        } else if (nameLower.includes("lighthauz")) {
          estUnits = "310 Units";
        } else if (nameLower.includes("keeperz")) {
          estUnits = "380 Units";
        } else if (nameLower.includes("aetas")) {
          estUnits = "226 Units";
        } else if (nameLower.includes("papyrus")) {
          estUnits = "450 Units";
        } else if (nameLower.includes("tangen")) {
          estUnits = "560 Units";
        } else if (nameLower.includes("vista lavender")) {
          estUnits = "1,200 Units";
        } else if (nameLower.includes("pavilion square")) {
          estUnits = "960 Units";
        } else if (nameLower.includes("golden crown")) {
          estUnits = "320 Units";
        } else if (nameLower.includes("centrix")) {
          estUnits = "450 Units";
        } else if (nameLower.includes("causewayz")) {
          estUnits = "1,200 Units";
        } else if (nameLower.includes("asteriaz")) {
          estUnits = "480 Units";
        } else if (nameLower.includes("mosaic")) {
          estUnits = "350 Units";
        } else {
          // Fallback default calculation based on starting price/area
          let hash = 0;
          for (let i = 0; i < updated.id.length; i++) {
            hash = updated.id.charCodeAt(i) + ((hash << 5) - hash);
          }
          const calculatedUnits = 250 + Math.abs(hash % 400);
          estUnits = `${calculatedUnits} Units`;
        }

        updated.totalUnits = estUnits;
      } else {
        // If it exists but is a raw number, append "Units"
        let clean = rawUnits;
        if (/^\d+$/.test(clean)) {
          updated.totalUnits = `${parseInt(clean).toLocaleString()} Units`;
        }
      }

      return updated;
    });
  };

  const fetchListingData = async (force: boolean = false) => {
    if (force) {
      setIsSyncing(true);
    } else {
      setIsLoading(true);
    }
    setLoadingError('');
    try {
      const response = await fetch(force ? `${API_BASE_URL}/api/projects?refresh=true` : `${API_BASE_URL}/api/projects`);
      if (!response.ok) {
        throw new Error('Fallback cache triggered');
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        // Successful sheets loaded!
        const normalizedData = normalizeMaintenanceAndUnits(data);
        // Inject a flag inside if custom added items exist in client localstorage
        const localCustoms = localStorage.getItem('portal_custom_projects');
        if (localCustoms) {
          const parsed = JSON.parse(localCustoms);
          setProjects([...parsed, ...normalizedData]);
        } else {
          setProjects(normalizedData);
        }
      } else {
        throw new Error('API Empty');
      }
    } catch (err) {
      console.warn('Listing Sync Error. Loading verified local backup profiles: ', err);
      // Fallback to pre-scraped Google Sheets properties so that Vercel loads perfectly
      const normalizedFallback = normalizeMaintenanceAndUnits(projectsFallback as Project[]);
      setProjects(normalizedFallback);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchListingData();

    // Scroll top display event listeners
    const toggleScroll = () => {
      if (window.scrollY > 500) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', toggleScroll);
    return () => window.removeEventListener('scroll', toggleScroll);
  }, []);

  // Derive unique locations and developers dynamically for search drop-downs list
  const availableLocations = useMemo(() => {
    const areas = projects.map((p) => p.area).filter((v, i, self) => self.indexOf(v) === i);
    return areas.sort();
  }, [projects]);

  const availableDevelopers = useMemo(() => {
    const devs = projects.map((p) => p.developer.replace(/\(.*?\)/g, "").trim()).filter((v, i, self) => self.indexOf(v) === i);
    return devs.sort();
  }, [projects]);

  // Search filter setter passed as submission action to hero strip
  const handleHeroSearch = (filters: { budget: string; bedrooms: string; location: string; developer: string; projectName?: string }) => {
    setHeroSearchFilters(filters);
    setSelectedProject(null);
    setCurrentPage('projects');
    
    // Smooth scroll down to projects section immediately
    setTimeout(() => {
      const el = document.getElementById('projects-grid');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  // Navigators helper
  const navigateToProjectDetail = (proj: Project) => {
    setSelectedProject(proj);
    setHeroSearchFilters(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleManualInjectedProject = (p: Project) => {
    // Dynamic CMS injection in-memory and local storage persisted
    try {
      const stored = localStorage.getItem('portal_custom_projects');
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(p);
      localStorage.setItem('portal_custom_projects', JSON.stringify(list));
      
      // Update memory immediately
      setProjects((prev) => [p, ...prev]);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleResetCMS = () => {
    localStorage.removeItem('portal_custom_projects');
    fetchListingData();
  };

  const handleBlogNavigate = (slug: string) => {
    setActiveBlogSlug(slug || null);
    setSelectedProject(null);
    setCurrentPage('blog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeFromComparison = (id: string) => {
    setCompareList((prev) => prev.filter((p) => p.id !== id));
  };

  // FAQ Handlers
  const toggleFaq = (idx: number) => {
    if (openFaqIdxs.includes(idx)) {
      setOpenFaqIdxs((prev) => prev.filter((i) => i !== idx));
    } else {
      setOpenFaqIdxs((prev) => [...prev, idx]);
    }
  };

  const faqListToRender = useMemo(() => {
    return showAllFaqs ? translatedFaqs : translatedFaqs.slice(0, 4);
  }, [showAllFaqs, translatedFaqs]);

  // Smart Matcher Handlers
  const closeSmartMatch = () => {
    setIsSmartMatchOpen(false);
    setSmartMatchStep(1);
    setMatchBudget('any');
    setMatchPurpose('any');
    setMatchArea('any');
    setMatchName('');
    setMatchPhone('');
    setMatchEmail('');
    setSmartMatchSubmitted(false);
    setMatchedProjects([]);
  };

  const handleSmartMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSmartMatching(true);

    try {
      // Find matching projects on budget and area criteria
      const filtered = projects.filter((p) => {
        // Budget conversion match
        if (matchBudget !== 'any') {
          const price = p.startingPrice;
          if (matchBudget === 'under500' && price >= 500000) return false;
          if (matchBudget === '500to1000' && (price < 500000 || price > 1000000)) return false;
          if (matchBudget === '1Mto2M' && (price < 1000000 || price > 2000000)) return false;
          if (matchBudget === 'above2M' && price <= 2000000) return false;
        }

        // Area match
        if (matchArea !== 'any') {
          const areaLower = p.area.toLowerCase();
          const targetLower = matchArea.toLowerCase();
          if (!areaLower.includes(targetLower)) return false;
        }

        return true;
      });

      setMatchedProjects(filtered.slice(0, 3));

      // Post lead to contact API
      const notes = `Smart Property Matcher Form Submission:\n- Budget Range: ${matchBudget}\n- Purpose: ${matchPurpose}\n- Area: ${matchArea}`;
      await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: matchName,
          email: matchEmail,
          phone: matchPhone,
          project: "Smart Matcher Lead",
          message: notes,
          date: new Date().toISOString()
        })
      });

      setSmartMatchSubmitted(true);
    } catch (err) {
      console.error("Smart matcher synchronization failed: ", err);
    } finally {
      setIsSmartMatching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 flex flex-col font-sans relative">
      
      {/* 1. Sticky Navigation Bar */}
      <Navbar
        currentPage={currentPage}
        setCurrentPage={(page) => {
          setCurrentPage(page);
          setSelectedProject(null);
          setActiveBlogSlug(null);
          setHeroSearchFilters(null);
          window.scrollTo({ top: 0 });
        }}
        onSmartMatchClick={() => {
          setIsSmartMatchOpen(true);
          setSmartMatchStep(1);
          setSmartMatchSubmitted(false);
        }}
        onRefreshClick={() => fetchListingData(true)}
        isSyncing={isSyncing}
      />

      {/* 2. Primary Subview Router Content */}
      <main className="flex-grow">
        
        <Breadcrumbs
          currentPage={currentPage}
          selectedProject={selectedProject}
          activeBlogSlug={activeBlogSlug}
          onNavigate={(page, project, blogSlug) => {
            setCurrentPage(page);
            setSelectedProject(project);
            setActiveBlogSlug(blogSlug);
            setHeroSearchFilters(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
        
        {selectedProject ? (
          /* Active Detail landing page takes full focus precedence */
          <ProjectDetail
            project={selectedProject}
            allProjects={projects}
            onProjectClick={navigateToProjectDetail}
            onBack={() => setSelectedProject(null)}
            onBlogLinkNavigate={handleBlogNavigate}
          />
        ) : (
          /* Route Page Switchers */
          <>
            {currentPage === 'home' && (
              <div className="animate-fade-in space-y-0">
                {/* Hero skyline Masthead with search filters strip */}
                <HeroSection
                  onSearch={handleHeroSearch}
                  onViewProjectsClick={() => {
                    setCurrentPage('projects');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  availableLocations={availableLocations}
                  availableDevelopers={availableDevelopers}
                />
                
                {/* Interactive Tools Launcher Dashboard Grid */}
                <FeatureGrid
                  onComparisonClick={() => {
                    if (compareList.length === 0) {
                      alert("Please select projects from the grid to compare side-by-side using the '+' button overlay on each card!");
                      setCurrentPage('projects');
                    } else {
                      setIsCompareOpen(true);
                    }
                  }}
                  onCalculatorClick={() => {
                    // Navigate to projects and user can launch the active loan widget inside details
                    alert("Launch any project listing details below to use the fully dynamic, interactive downpayment and interest amortisation loan calculator!");
                    setCurrentPage('projects');
                  }}
                  onMapClick={() => {
                    setCurrentPage('map');
                    window.scrollTo({ top: 0 });
                  }}
                  onGuideClick={() => {
                    // Navigate to blog and open the foreign buyer guide
                    handleBlogNavigate('foreigner-buying-property-in-malaysia');
                  }}
                />

                {/* Featured Projects Section (display 3 featured projects only: queenswoodz, pavilion-square-residences, parkside) */}
                <section className="py-16 bg-white border-t border-slate-100">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                      <span className="block text-xs font-black uppercase tracking-widest ig-text mb-2 animate-pulse">{t('handpickedListings')}</span>
                      <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        {t('featuredProjects')}
                      </h2>
                      <p className="text-slate-500 text-sm mt-3 font-semibold">
                        {t('featuredProjectsDesc')}
                      </p>
                    </div>

                    {/* 3 Featured Projects Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {projects
                        .filter(p => ['queenswoodz', 'pavilion-square-residences', 'parkside-residence'].includes(p.id))
                        .map((proj) => {
                          const { label: priceLabel } = convertPrice(proj.startingPrice);
                          return (
                            <div 
                              key={proj.id}
                              onClick={() => navigateToProjectDetail(proj)}
                              className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-305 cursor-pointer group flex flex-col h-full hover:-translate-y-1"
                            >
                              {/* Overview Image */}
                              <div className="h-56 relative overflow-hidden bg-slate-100 flex items-center justify-center">
                                {proj.images?.overview && proj.images.overview.length > 0 && proj.images.overview[0] ? (
                                  <img 
                                    src={proj.images.overview[0]} 
                                    alt={`${proj.name} - Featured Landmark Development Overview Image 1`} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-6 text-center select-none">
                                    <Building className="h-10 w-10 text-slate-300 mb-1" />
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Media Pending Verification</p>
                                    <p className="text-[9px] text-slate-300 italic mt-0.5">Folder pending setup in Drive</p>
                                  </div>
                                )}
                                <div className="absolute top-4 right-4 bg-stone-900/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white">
                                  {translateTenure(proj.tenure, language)}
                                </div>
                                <div className="absolute bottom-4 left-4 ig-gradient text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md">
                                  {translateProjectType(proj.projectType, language)}
                                </div>
                              </div>

                              {/* Card details */}
                              <div className="p-6 flex-grow flex flex-col justify-between">
                                <div>
                                  <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none">{translateDeveloper(proj.developer, language)}</span>
                                  <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2 group-hover:text-orange-600 transition-colors">
                                    {proj.name}
                                  </h3>
                                  <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500" />
                                    {translateLocation(proj.location, language)}
                                  </p>
                                </div>

                                <div className="pt-4 mt-4 border-t border-slate-50 flex items-center justify-between">
                                  <div>
                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{t('priceStartingFrom')}</span>
                                    <span className="text-base font-black text-slate-900">{priceLabel}</span>
                                  </div>
                                  <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-orange-50 group-hover:text-orange-500 flex items-center justify-center text-slate-700 transition-all">
                                    <ArrowRight className="h-4 w-4" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* View All Projects Button */}
                    <div className="text-center mt-12">
                      <button
                        onClick={() => {
                          setCurrentPage('projects');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-full border border-slate-900 shadow-sm transition-all cursor-pointer text-xs uppercase tracking-wider inline-flex items-center gap-2"
                      >
                        <span>{t('viewAllProjects')}</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </section>

                {/* Project Journey Step by Step */}
                <section className="py-20 bg-slate-50/50 border-t border-b border-slate-100">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                      <span className="block text-xs font-black uppercase tracking-widest ig-text mb-2">{t('journeySub')}</span>
                      <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        {t('journeyTitle')}
                      </h2>
                      <p className="text-slate-500 text-sm mt-3 font-semibold">
                        {t('journeyDesc')}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      {[
                        { step: "01", title: t('journeyStep1Title'), desc: t('journeyStep1Desc') },
                        { step: "02", title: t('journeyStep2Title'), desc: t('journeyStep2Desc') },
                        { step: "03", title: t('journeyStep3Title'), desc: t('journeyStep3Desc') },
                        { step: "04", title: t('journeyStep4Title'), desc: t('journeyStep4Desc') },
                        { step: "05", title: t('journeyStep5Title'), desc: t('journeyStep5Desc') }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between h-full group hover:shadow-md transition-all duration-300">
                          <div>
                            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 font-extrabold text-sm flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                              {item.step}
                            </div>
                            <h3 className="text-base font-extrabold text-slate-900 mb-2 tracking-tight group-hover:text-orange-600 transition-colors">
                              {item.title}
                            </h3>
                            <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Interactive Property Smart Matcher Section/Strip */}
                <section id="smart-match-section" className="py-20 bg-slate-900 text-white relative overflow-hidden border-t border-b border-slate-800">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.1),transparent_45%)] pointer-events-none" />
                  <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase tracking-widest mb-3 border border-orange-500/20">
                        ✨ {language.startsWith('zh') ? '智能置业推荐' : language === 'ja' ? 'AIスマート診断' : 'Smart Matcher'}
                      </span>
                      <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        {language.startsWith('zh') ? '寻找您在马来西亚的黄金房产' : language === 'ja' ? 'あなたに最適なマレーシア不動産を診断' : 'Find Your Perfect Malaysian Property Match'}
                      </h2>
                      <p className="text-slate-400 text-sm mt-3 font-medium">
                        {language.startsWith('zh') ? '只需回答4个简单问题，我们的智能系统便能为您筛选出最符合您预算、购房目的和区域偏好的专属项目。' : language === 'ja' ? '4つの質問に答えるだけで、予算、目的、地域に合わせた最適なプロジェクトをAIがマッチングします。' : 'Answer 4 simple questions and let our smart system curate the top luxury developments tailored specifically to your budget, purpose, and preferred location.'}
                      </p>
                    </div>

                    <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl max-w-2xl mx-auto">
                      {/* Stepper Progress Header */}
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {!smartMatchSubmitted 
                            ? (language.startsWith('zh') ? `步骤 ${smartMatchStep} / 4` : language === 'ja' ? `ステップ ${smartMatchStep} / 4` : `Step ${smartMatchStep} of 4`)
                            : (language.startsWith('zh') ? '推荐结果' : language === 'ja' ? '診断結果' : 'Your Match Results')
                          }
                        </span>
                        {!smartMatchSubmitted && (
                          <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-orange-500 to-rose-500 h-full transition-all duration-300" style={{ width: `${(smartMatchStep / 4) * 100}%` }} />
                          </div>
                        )}
                      </div>

                      <div className="space-y-6">
                        {!smartMatchSubmitted ? (
                          <>
                            {/* Step 1: Budget Target */}
                            {smartMatchStep === 1 && (
                              <div className="space-y-4 animate-fade-in">
                                <label className="block text-base font-bold text-white tracking-tight">
                                  1. {language.startsWith('zh') ? '您的首选预算范围是多少？' : language === 'ja' ? 'ご希望の予算帯はどれくらいですか？' : 'What is your preferred budget range?'}
                                </label>
                                <p className="text-xs text-slate-400 font-medium">{language.startsWith('zh') ? '选择价格区间以匹配项目的起始价格。' : language === 'ja' ? '売り出し価格に合わせた価格帯を選択してください。' : 'Select a pricing bracket for matching listed starting prices.'}</p>
                                
                                <div className="grid grid-cols-1 gap-3">
                                  {[
                                    { val: 'under500', label: language.startsWith('zh') ? 'RM 500,000 以下' : language === 'ja' ? 'RM 50万 以下' : 'Under RM 500,000' },
                                    { val: '500to1000', label: language.startsWith('zh') ? 'RM 500,000 – RM 1,000,000' : language === 'ja' ? 'RM 50万 – RM 100万' : 'RM 500,000 – RM 1,000,000' },
                                    { val: '1Mto2M', label: language.startsWith('zh') ? 'RM 1,000,000 – RM 2,000,000' : language === 'ja' ? 'RM 100万 – RM 200万' : 'RM 1,000,000 – RM 2,000,000' },
                                    { val: 'above2M', label: language.startsWith('zh') ? 'RM 2,000,000 以上' : language === 'ja' ? 'RM 200万 以上' : 'Above RM 2,000,000' },
                                    { val: 'any', label: language.startsWith('zh') ? '不设限制 / 任意预算' : language === 'ja' ? '上限なし / すべての予算' : 'No Limit / Any Budget' }
                                  ].map((opt) => (
                                    <button
                                      key={opt.val}
                                      type="button"
                                      onClick={() => setMatchBudget(opt.val)}
                                      className={`w-full text-left px-5 py-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                        matchBudget === opt.val 
                                          ? 'border-orange-500 bg-orange-500/10 text-orange-400 shadow-lg shadow-orange-500/5' 
                                          : 'border-slate-800 hover:border-slate-700 bg-slate-900/30 text-slate-300 hover:text-white'
                                      }`}
                                    >
                                      <span>{opt.label}</span>
                                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[8px] ${matchBudget === opt.val ? 'border-orange-500 bg-orange-500 text-white font-extrabold' : 'border-slate-600 bg-slate-800 text-transparent'}`}>
                                        ✓
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Step 2: Buying Purpose */}
                            {smartMatchStep === 2 && (
                              <div className="space-y-4 animate-fade-in">
                                <label className="block text-base font-bold text-white tracking-tight">
                                  2. {language.startsWith('zh') ? '您的首要置业目标是什么？' : language === 'ja' ? '購入の主な目的は何ですか？' : 'What is your primary purchase goal?'}
                                </label>
                                <p className="text-xs text-slate-400 font-medium">{language.startsWith('zh') ? '您打算如何使用或投资此房产项目？' : language === 'ja' ? 'この物件をどのように活用する予定ですか？' : 'How do you intend to leverage this development profile?'}</p>

                                <div className="grid grid-cols-1 gap-3 font-semibold">
                                  {[
                                    { val: 'own-stay', label: language.startsWith('zh') ? '自住 (家庭首套或主要住宅)' : language === 'ja' ? '実住 (家族用レジデンス)' : 'Own Stay (Family Primary Residence)' },
                                    { val: 'investment', label: language.startsWith('zh') ? '高回报投资 / 租金收益' : language === 'ja' ? '不動産投資 / 賃貸運用' : 'High-Yield Property Investment / Rental' },
                                    { val: 'mm2h', label: language.startsWith('zh') ? '移居计划 (MM2H第二家园签证)' : language === 'ja' ? '移住・リタイアメント (MM2Hビザ取得等)' : 'Migration residency (MM2H visa)' },
                                    { val: 'vacation', label: language.startsWith('zh') ? '度假屋 / 海外第二家园' : language === 'ja' ? '別荘・セカンドハウス' : 'Holiday Escapade / Secondary Home' },
                                    { val: 'any', label: language.startsWith('zh') ? '全方位资产评估 / 综合对比' : language === 'ja' ? '総合的な比較・その他' : 'General Portfolio review / Direct check' }
                                  ].map((opt) => (
                                    <button
                                      key={opt.val}
                                      type="button"
                                      onClick={() => setMatchPurpose(opt.val)}
                                      className={`w-full text-left px-5 py-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                        matchPurpose === opt.val 
                                          ? 'border-orange-500 bg-orange-500/10 text-orange-400 shadow-lg shadow-orange-500/5 font-bold' 
                                          : 'border-slate-800 hover:border-slate-700 bg-slate-900/30 text-slate-300 hover:text-white'
                                      }`}
                                    >
                                      <span>{opt.label}</span>
                                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[8px] ${matchPurpose === opt.val ? 'border-orange-500 bg-orange-500 text-white font-extrabold' : 'border-slate-600 bg-slate-800 text-transparent'}`}>
                                        ✓
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Step 3: Area of Interest */}
                            {smartMatchStep === 3 && (
                              <div className="space-y-4 animate-fade-in">
                                <label className="block text-base font-bold text-white tracking-tight">
                                  3. {language.startsWith('zh') ? '您对马来西亚哪一个核心区域最感兴趣？' : language === 'ja' ? 'マレーシアのどのエリアに関心がありますか？' : 'Which key Malaysian area interests you most?'}
                                </label>
                                <p className="text-xs text-slate-400 font-medium">{language.startsWith('zh') ? '我们将优先筛选该区域的优质房产。' : language === 'ja' ? 'ご希望の地域のプロジェクトを優先してマッチングします。' : 'We will prioritize projects matching this location boundary.'}</p>

                                <div className="grid grid-cols-1 gap-3">
                                  {[
                                    { val: 'Kuala Lumpur', label: language.startsWith('zh') ? '吉隆坡市中心 (KLCC、武吉免登、安邦)' : language === 'ja' ? 'クアラルンプール中心部 (KLCC、ブキッ・ビンタン等)' : 'Kuala Lumpur Central (KLCC, Bukit Bintang)' },
                                    { val: 'Selangor', label: language.startsWith('zh') ? '雪兰莪州高尚社区 (梳邦、蒲种、万宜)' : language === 'ja' ? 'セランゴール州郊外 (スバン、プチョン等)' : 'Selangor State (Subang, Puchong, Bangi)' },
                                    { val: 'Johor', label: language.startsWith('zh') ? '柔佛南部走廊 (新山市中心、RTS沿线、美迪尼)' : language === 'ja' ? 'ジョホール (ジョホールバル、RTS沿線、メディニ)' : 'Johor Gateway (Johor Bahru Central, RTS Corridor)' },
                                    { val: 'any', label: language.startsWith('zh') ? '全马全域搜索 (包含吉隆坡与柔佛)' : language === 'ja' ? '全エリアから探す (KL & ジョホールすべて)' : 'Exhaustive Search (All areas / KL & Johor)' }
                                  ].map((opt) => (
                                    <button
                                      key={opt.val}
                                      type="button"
                                      onClick={() => setMatchArea(opt.val)}
                                      className={`w-full text-left px-5 py-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                        matchArea === opt.val 
                                          ? 'border-orange-500 bg-orange-500/10 text-orange-400 shadow-lg shadow-orange-500/5' 
                                          : 'border-slate-800 hover:border-slate-700 bg-slate-900/30 text-slate-300 hover:text-white'
                                      }`}
                                    >
                                      <span>{opt.label}</span>
                                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[8px] ${matchArea === opt.val ? 'border-orange-500 bg-orange-500 text-white font-extrabold' : 'border-slate-600 bg-slate-800 text-transparent'}`}>
                                        ✓
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Step 4: Contact details */}
                            {smartMatchStep === 4 && (
                              <div className="space-y-4 animate-fade-in">
                                <label className="block text-base font-bold text-white tracking-tight">
                                  4. {language.startsWith('zh') ? '提供您的联系方式以获取定制报告' : language === 'ja' ? '診断結果を送信するためのご連絡先' : 'Provide your contact details to load results'}
                                </label>
                                <p className="text-xs text-slate-400 font-medium">
                                  {language.startsWith('zh') ? '我们将为您整理实时房源库存，并在必要时由专业经纪人为您安排一对一咨询。' : language === 'ja' ? 'リアルタイムの空室状況を反映させ、パーソナライズされたマッチングリストを生成します。' : 'We will curate real-time property inventories and file a VIP priority briefing with Shyan Yee.'}
                                </p>

                                <div className="space-y-3 pt-2 text-left">
                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{language.startsWith('zh') ? '姓名' : language === 'ja' ? 'お名前' : 'Full Name'}</label>
                                    <input 
                                      type="text" 
                                      required
                                      placeholder={language.startsWith('zh') ? '例如：张伟' : 'e.g. John Doe'}
                                      value={matchName}
                                      onChange={(e) => setMatchName(e.target.value)}
                                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:bg-slate-900 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{language.startsWith('zh') ? '电话号码 (连同区号)' : language === 'ja' ? '電話番号 (国番号含む)' : 'Phone Number (with Code)'}</label>
                                    <input 
                                      type="tel" 
                                      required
                                      placeholder="e.g. +65 9123 4567 or +60 19-559 8932"
                                      value={matchPhone}
                                      onChange={(e) => setMatchPhone(e.target.value)}
                                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:bg-slate-900 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{language.startsWith('zh') ? '电子邮箱' : language === 'ja' ? 'メールアドレス' : 'Email Address'}</label>
                                    <input 
                                      type="email" 
                                      required
                                      placeholder="e.g. j.doe@gmail.com"
                                      value={matchEmail}
                                      onChange={(e) => setMatchEmail(e.target.value)}
                                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:bg-slate-900 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Stepper Navigation buttons */}
                            <div className="pt-6 border-t border-slate-800/85 flex items-center justify-between">
                              {smartMatchStep > 1 ? (
                                <button
                                  type="button"
                                  onClick={() => setSmartMatchStep(smartMatchStep - 1)}
                                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black rounded-xl cursor-pointer transition-all"
                                >
                                  {language.startsWith('zh') ? '上一步' : language === 'ja' ? '戻る' : 'Back'}
                                </button>
                              ) : (
                                <div />
                              )}

                              {smartMatchStep < 4 ? (
                                <button
                                  type="button"
                                  onClick={() => setSmartMatchStep(smartMatchStep + 1)}
                                  className="px-6 py-2.5 bg-white text-slate-900 hover:bg-slate-100 duration-150 rounded-xl text-xs font-black cursor-pointer uppercase tracking-wider shadow-md"
                                >
                                  {language.startsWith('zh') ? '下一步' : language === 'ja' ? '次へ' : 'Next Step'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleSmartMatchSubmit}
                                  disabled={isSmartMatching || !matchName || !matchPhone || !matchEmail}
                                  className="px-6 py-2.5 bg-orange-500 text-white hover:bg-orange-600 rounded-xl text-xs font-black cursor-pointer uppercase tracking-wider disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-orange-500/20"
                                >
                                  {isSmartMatching 
                                    ? (language.startsWith('zh') ? '分析中...' : language === 'ja' ? '分析中...' : 'Analyzing...') 
                                    : (language.startsWith('zh') ? '立即智能匹配 ✨' : language === 'ja' ? 'マッチングを開始 ✨' : 'Complete Matching ✨')
                                  }
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          /* Post-Submission Matching Results View */
                          <div className="space-y-6 text-left animate-fade-in">
                            <div className="text-center p-5 bg-orange-500/10 rounded-2xl border border-orange-500/25">
                              <span className="text-3xl block mb-2">🎉</span>
                              <h4 className="font-extrabold text-white text-base">
                                {language.startsWith('zh') ? '已成功匹配尊享项目！' : language === 'ja' ? 'マッチングが完了しました！' : 'Perfect Alignments Located!'}
                              </h4>
                              <p className="text-slate-300 text-xs leading-relaxed mt-1.5 font-semibold">
                                {language.startsWith('zh') 
                                  ? '您的置业偏好已登记在顾问 Shyan Yee 的系统档案中。以下是最契合您预算和目标的精选热门项目：' 
                                  : language === 'ja' 
                                  ? 'ご希望の条件が Shyan Yee 氏に送信されました。条件に最も一致したプロジェクトは以下の通りです：' 
                                  : 'Your criteria has registered successfully in Shyan Yee\'s broker ledger. Here are live developments matching your exact target metrics:'}
                              </p>
                            </div>

                            {/* Matching results rendering cards */}
                            <div className="space-y-3">
                              {matchedProjects.length > 0 ? (
                                matchedProjects.map((p) => {
                                  const { label: finalPrice } = convertPrice(p.startingPrice);
                                  return (
                                    <div 
                                      key={p.id}
                                      onClick={() => {
                                        navigateToProjectDetail(p);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                      }}
                                      className="p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 shadow-md rounded-2xl flex items-center justify-between gap-4 cursor-pointer hover:border-orange-500/50 transition-all group duration-200"
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        {p.images?.overview && p.images.overview.length > 0 && p.images.overview[0] ? (
                                          <img 
                                            src={p.images.overview[0]}
                                            alt={`${p.name} - Matched Real Estate Overview Image 1`}
                                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                                            referrerPolicy="no-referrer"
                                          />
                                        ) : (
                                          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                                            <Building className="h-5 w-5 text-slate-600" />
                                          </div>
                                        )}
                                        <div className="min-w-0">
                                          <span className="block text-[8px] font-black uppercase text-slate-500 leading-none">{p.developer}</span>
                                          <span className="block font-extrabold text-white text-xs mt-1 group-hover:text-orange-400 duration-150 truncate max-w-[170px] sm:max-w-[250px]">{p.name}</span>
                                          <span className="block text-[10px] text-slate-400 font-semibold truncate max-w-[170px] sm:max-w-[250px]">{p.location}</span>
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="block text-[8px] font-black text-slate-500 uppercase leading-none">Price From</span>
                                        <span className="block text-xs font-black text-orange-400 mt-1">{finalPrice}</span>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-center text-xs text-slate-500 font-bold py-6 bg-slate-900/20 rounded-2xl border border-slate-800/50">
                                  {language.startsWith('zh') ? '未找到符合硬性指标的项目，建议探索热门推荐项目。' : language === 'ja' ? '条件に一致する物件が見つかりませんでした。他のおすすめ物件をご覧ください。' : 'No strict exact match. Explore our featured properties!'}
                                </p>
                              )}
                            </div>

                            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                              <a
                                href={`https://wa.me/60195598932?text=Hi%20Shyan%20Yee%2C%20I%20just%20completed%20the%20Smart%20Matcher%20Questionnaire%20on%20your%20portal%21%20My%20name%20is%20${encodeURIComponent(matchName)}%20and%20my%20budget%20is%20${encodeURIComponent(matchBudget)}.%20Let%27s%20connect%21`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 text-center py-3 rounded-xl ig-gradient text-white text-xs font-black uppercase tracking-wider btn-hover shadow-lg shadow-orange-500/10 no-underline block"
                              >
                                {language.startsWith('zh') ? '微信/WhatsApp 咨询 Shyan Yee' : 'WhatsApp Shyan Yee'}
                              </a>
                              <button
                                type="button"
                                onClick={closeSmartMatch}
                                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black rounded-xl cursor-pointer transition-colors"
                              >
                                {language.startsWith('zh') ? '重新匹配 ⟲' : 'Start Over ⟲'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Purchaser Guides Cards: Malaysian, Foreigner, Singapore */}
                <section className="py-20 bg-white">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                      <span className="block text-xs font-black uppercase tracking-widest ig-text mb-2">{t('guidesSub')}</span>
                      <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        {t('guidesTitle')}
                      </h2>
                      <p className="text-slate-500 text-sm mt-3 font-semibold">
                        {t('guidesDesc')}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {/* Malaysian Buyer Card */}
                      <div 
                        onClick={() => handleBlogNavigate('malaysia-property-investment-guide')}
                        className="bg-[#FAF9F6] border border-slate-100 rounded-3xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col justify-between hover:-translate-y-1"
                      >
                        <div>
                          <div className="h-44 w-full rounded-2xl overflow-hidden mb-6 relative bg-slate-100 shadow-inner">
                            <img 
                              src={malaysiaBuyerGuideImg} 
                              alt="Malaysia Buyer Guide" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-xl text-xs font-black shadow-xs">
                              🇲🇾 Malaysia
                            </div>
                          </div>
                          <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-orange-600 transition-colors mb-2">
                            {t('malaysianGuideTitle')}
                          </h3>
                          <p className="text-slate-500 text-xs leading-relaxed font-semibold mb-6">
                            {t('malaysianGuideDesc')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 leading-none">
                          <span>{t('readGuideCTA')}</span>
                          <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1 duration-150 transition-transform" />
                        </div>
                      </div>

                      {/* Foreigner Buyer Card */}
                      <div 
                        onClick={() => handleBlogNavigate('foreigner-buying-property-in-malaysia')}
                        className="bg-[#FAF9F6] border border-slate-100 rounded-3xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col justify-between hover:-translate-y-1"
                      >
                        <div>
                          <div className="h-44 w-full rounded-2xl overflow-hidden mb-6 relative bg-slate-100 shadow-inner">
                            <img 
                              src={foreignerBuyerGuideImg} 
                              alt="Foreigner Buyer Guide" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-xl text-xs font-black shadow-xs">
                              🌐 International
                            </div>
                          </div>
                          <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-orange-600 transition-colors mb-2">
                            {t('foreignerGuideTitle')}
                          </h3>
                          <p className="text-slate-500 text-xs leading-relaxed font-semibold mb-6">
                            {t('foreignerGuideDesc')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 leading-none">
                          <span>{t('readGuideCTA')}</span>
                          <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1 duration-150 transition-transform" />
                        </div>
                      </div>

                      {/* Singapore Buyer Card */}
                      <div 
                        onClick={() => handleBlogNavigate('singaporean-buying-property-in-malaysia')}
                        className="bg-[#FAF9F6] border border-slate-100 rounded-3xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col justify-between hover:-translate-y-1"
                      >
                        <div>
                          <div className="h-44 w-full rounded-2xl overflow-hidden mb-6 relative bg-slate-100 shadow-inner">
                            <img 
                              src={singaporeanBuyerGuideImg} 
                              alt="Singapore Buyer Guide" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-xl text-xs font-black shadow-xs">
                              🇸🇬 Singaporean
                            </div>
                          </div>
                          <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-orange-600 transition-colors mb-2">
                            {t('singaporeanGuideTitle')}
                          </h3>
                          <p className="text-slate-500 text-xs leading-relaxed font-semibold mb-6">
                            {t('singaporeanGuideDesc')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 leading-none">
                          <span>{t('readGuideCTA')}</span>
                          <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1 duration-150 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* FAQ Style Accordion Section (display 4 only initially, expand to 20 on See More) */}
                <section className="py-20 bg-slate-50/50 border-t border-b border-slate-100">
                  <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-12">
                      <span className="block text-xs font-black uppercase tracking-widest ig-text mb-2">Knowledge Base</span>
                      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {t('faqTitle')}
                      </h2>
                      <p className="text-slate-500 text-sm mt-3 font-semibold">
                        {t('faqSubtitle')}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {faqListToRender.map((faq, idx) => {
                        const isFaqOpen = openFaqIdxs.includes(idx);
                        return (
                          <div 
                            key={idx} 
                            className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs hover:border-slate-200 transition-colors"
                          >
                            <button
                              onClick={() => toggleFaq(idx)}
                              className="w-full text-left px-6 py-4.5 flex items-center justify-between font-bold text-sm text-slate-800 hover:bg-slate-50/60 transition-colors cursor-pointer select-none"
                            >
                              <span>{faq.question}</span>
                              <span className={`text-orange-500 font-extrabold text-[10px] duration-150 transition-transform ${isFaqOpen ? 'rotate-180' : ''}`}>
                                ▼
                              </span>
                            </button>
                            {isFaqOpen && (
                              <div className="px-6 pb-5 pt-1.5 text-xs text-slate-500 leading-relaxed font-semibold border-t border-slate-50 bg-[#FAF9F6]/40">
                                {faq.answer}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* See More Toggle dropdown button */}
                    {translatedFaqs.length > 4 && (
                      <div className="text-center mt-10">
                        <button
                          onClick={() => {
                            setShowAllFaqs(!showAllFaqs);
                            setOpenFaqIdxs([]);
                          }}
                          className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-black text-xs rounded-full shadow-xs cursor-pointer transition-colors uppercase tracking-wider"
                        >
                          {showAllFaqs ? "Show 4 FAQs Only" : `See More FAQs (${translatedFaqs.length} Total FAQs)`}
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                {/* Meet representative card */}
                <AgentCard />

                {/* Rotating Project Showcase Slideshow */}
                <ProjectSlideshow projects={projects} onProjectClick={navigateToProjectDetail} />
              </div>
            )}

            {currentPage === 'projects' && (
              <div className="animate-fade-in">
                <ProjectsOverview
                  projects={projects}
                  onProjectClick={navigateToProjectDetail}
                  selectedCompareList={compareList}
                  setCompareList={setCompareList}
                  filterDefaults={heroSearchFilters}
                  clearFilterDefaults={() => setHeroSearchFilters(null)}
                />
              </div>
            )}

            {currentPage === 'map' && (
              <div className="animate-fade-in">
                <InteractiveMap
                  projects={projects}
                  onProjectSelect={navigateToProjectDetail}
                />
              </div>
            )}

            {currentPage === 'blog' && (
              <div className="animate-fade-in">
                <BlogView
                  onProjectNavigate={(id) => {
                    const match = projects.find(p => p.id === id);
                    if (match) navigateToProjectDetail(match);
                  }}
                  onBlogNavigate={handleBlogNavigate}
                  activeBlogSlug={activeBlogSlug}
                />
              </div>
            )}

            {currentPage === 'compare' && (
              <div className="animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
                <div className="mb-2">
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {t('compareProjects')}
                  </h1>
                  <p className="text-slate-500 text-sm mt-2 font-medium">
                    {language.startsWith('zh') ? '横向对比分析多款马来西亚地标名盘，了解其开发商、户型面积、均价、配套车位和投资前景。' : 'Side-by-side spec comparison of landmark luxury properties across Kuala Lumpur & Penang.'}
                  </p>
                </div>

                {/* Fully interactive project selection panel */}
                <CompareProjectSelector
                  projects={projects}
                  compareList={compareList}
                  language={language}
                  t={t}
                  onToggleCompare={(p) => {
                    if (compareList.some(item => item.id === p.id)) {
                      removeFromComparison(p.id);
                    } else {
                      if (compareList.length >= 3) {
                        alert(t('comparisonLimit'));
                      } else {
                        setCompareList([...compareList, p]);
                      }
                    }
                  }}
                />

                {compareList.length > 0 ? (
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <CompareModal
                      compareList={compareList}
                      onClose={() => {}}
                      onProjectClick={navigateToProjectDetail}
                      removeFromComparison={removeFromComparison}
                      isPage={true}
                    />
                  </div>
                ) : (
                  /* Empty state for comparison with instructions */
                  <div className="text-center py-12 bg-[#FAF9F6]/50 rounded-3xl border border-dashed border-slate-200 max-w-2xl mx-auto p-6">
                    <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4">
                      <Layers className="h-6 w-6 text-orange-500 animate-pulse" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight mb-1">
                      {language.startsWith('zh') ? '请在上方列表选择对比项目' : 'Select properties above to begin comparison'}
                    </h3>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto mb-4 font-semibold">
                      {language.startsWith('zh') 
                        ? '支持最多选择3款名盘，点击任意楼盘卡片上的“添加”或点击卡片即可在同屏对标分析。' 
                        : 'Choose up to 3 listings from the selection panel above to visualize full comparative specification sheets instantly.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </main>

      {/* 3. STICKY BOTTOM COMPARE TRAY DRAWER (Only visible when 1 or more projects selected for side-by-side matrix) */}
      {compareList.length > 0 && (
        <div id="sticky-compare-bar" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stone-900 border border-white/10 rounded-2xl sm:rounded-full bg-stone-900/95 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row items-center gap-5 shadow-2xl max-w-4xl w-[90%] select-none animate-bounce-subtle">
          
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-rose-500 flex items-center justify-center text-white text-[10px] font-black">
              {compareList.length}
            </div>
            <div>
              <span className="block text-xs font-bold text-white uppercase tracking-wider leading-none">Compare Ledger</span>
              <span className="text-[10px] text-stone-400">Select up to 3 properties side-by-side</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {compareList.map((p) => (
              <div key={p.id} className="flex items-center gap-2 bg-white/10 border border-white/5 rounded-full px-3 py-1 text-xs text-white">
                <span className="truncate max-w-[100px] font-semibold">{p.name}</span>
                <button
                  onClick={() => removeFromComparison(p.id)}
                  className="rounded-full hover:bg-white/10 p-0.5"
                >
                  <X className="h-3 w-3 text-stone-300 hover:text-white" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto">
            <button
              onClick={() => setCompareList([])}
              className="text-stone-400 hover:text-white text-xs font-bold px-3 py-2 cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={() => setIsCompareOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-400 to-rose-500 hover:opacity-95 text-white text-xs font-extrabold rounded-full shadow-md cursor-pointer whitespace-nowrap"
            >
              Compare Matrix
            </button>
          </div>
        </div>
      )}

      {/* 4. SIDE STICKY WHATSAPP CTA BUBBLE (glowing, premium, direct link to Shyan Yee) */}
      <a
        href={`https://wa.me/60195598932?text=${encodeURIComponent(
          language.startsWith('zh')
            ? "您好 Shyan Yee，我刚浏览了您的马来西亚优质置业网站，想向您咨询一些关于热门在售楼盘的详情与最新优惠。谢谢！"
            : language === 'ja'
            ? "こんにちは Shyan Yee、マレーシア不動産のポータルサイトを拝見しました。いくつかおすすめの注目プロジェクトについて相談したいです。"
            : "Hi Shyan Yee, I'm visiting your properties portal and would love to ask you some questions regarding premium available listings. Thank you!"
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Chat direct with Shyan Yee on WhatsApp"
        className="fixed bottom-6 right-6 z-45 h-14 w-14 rounded-full bg-gradient-to-tr from-orange-500 via-rose-500 to-pink-600 text-white flex items-center justify-center shadow-xl cursor-pointer hover:scale-110 active:scale-95 duration-200 group border-2 border-white/20 select-none"
      >
        <span className="absolute -inset-1 rounded-full bg-rose-500/30 blur-sm group-hover:blur-md animate-pulse pointer-events-none" />
        <MessageCircle className="h-7 w-7 text-white fill-white relative z-10" />
      </a>

      {/* Scroll to Top Trigger */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-7 z-40 p-2.5 rounded-xl bg-white/90 backdrop-blur-md border border-stone-200 text-stone-600 hover:text-stone-900 shadow-md transition-all cursor-pointer select-none ring-1 ring-black/[0.02]"
        >
          <ChevronUp className="h-4.5 w-4.5" />
        </button>
      )}

      {/* Compare Matrix Modal */}
      {isCompareOpen && (
        <CompareModal
          compareList={compareList}
          onClose={() => setIsCompareOpen(false)}
          onProjectClick={navigateToProjectDetail}
          removeFromComparison={removeFromComparison}
        />
      )}

      {/* AISEO & GEO Landmark Property Directory */}
      <AiseoDirectory 
        projects={projects} 
        onProjectClick={navigateToProjectDetail} 
      />

      {/* 5. Modern Premium Footers section */}
      <footer className="bg-stone-950 text-stone-400 py-16 border-t border-stone-950 font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Logo & Agent credentials */}
          <div className="md:col-span-5 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-orange-500 via-rose-500 to-pink-600 rounded-xl text-white">
                <Building className="h-5 w-5" />
              </div>
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 text-transparent bg-clip-text uppercase">
                {language.startsWith('zh') ? '马来西亚房产门户' : language === 'ja' ? 'マレーシア不動産ポータル' : 'MALAYSIA PROPERTY PORTAL'}
              </span>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed font-light">
              {t('footerPortalDesc')}
            </p>
            <div className="text-[11px] text-stone-500 font-bold uppercase tracking-wider space-y-1">
              <div>{t('footerRepBroker')}</div>
              <div>{t('footerLicense')}</div>
            </div>
          </div>

          {/* Quick page directory links */}
          <div className="md:col-span-3 text-left space-y-4">
            <h4 className="text-white text-xs font-black uppercase tracking-widest">
              {t('footerDirectory')}
            </h4>
            <div className="grid grid-cols-1 gap-2.5 text-xs">
              <button onClick={() => { setCurrentPage('home'); setSelectedProject(null); }} className="hover:text-white transition-colors cursor-pointer text-left">{t('footerHome')}</button>
              <button onClick={() => { setCurrentPage('projects'); setSelectedProject(null); }} className="hover:text-white transition-colors cursor-pointer text-left">{t('footerPropertyGrid')}</button>
              <button onClick={() => { setCurrentPage('map'); setSelectedProject(null); }} className="hover:text-white transition-colors cursor-pointer text-left">{t('footerMapPins')}</button>
              <button onClick={() => { setCurrentPage('blog'); setSelectedProject(null); }} className="hover:text-white transition-colors cursor-pointer text-left">{t('footerGuidesLib')}</button>
            </div>
          </div>

          {/* SEO articles Quick indexing links */}
          <div className="md:col-span-4 text-left space-y-4">
            <h4 className="text-white text-xs font-black uppercase tracking-widest">
              {t('footerTrending')}
            </h4>
            <div className="grid grid-cols-1 gap-2 text-[11px] leading-tight">
              {BLOG_DATA.slice(0, 4).map((art) => (
                <button
                  key={art.slug}
                  onClick={() => handleBlogNavigate(art.slug)}
                  className="hover:text-pink-500 transition-colors text-left truncate flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRight className="h-3 w-3 text-stone-600 shrink-0" />
                  <span>{art.title}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Legal copyright bar under footers */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-600 font-semibold select-none">
          <span>&copy; {new Date().getFullYear()} {t('footerCopyright')}</span>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <a href="https://wa.me/60195598932" target="_blank" rel="noopener noreferrer" className="hover:text-stone-400">{t('footerTerms')}</a>
            <span>•</span>
            <a href="https://wa.me/60195598932" target="_blank" rel="noopener noreferrer" className="hover:text-stone-400">{t('footerPrivacy')}</a>
          </div>
        </div>

      </footer>

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <CurrencyProvider>
        <ClientPortalsOrchestrator />
      </CurrencyProvider>
    </LanguageProvider>
  );
}
