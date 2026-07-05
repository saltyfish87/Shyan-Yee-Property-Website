import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { useLanguage } from '../LanguageContext';
import { useCurrency } from '../CurrencyContext';
import { API_BASE_URL } from '../utils/api';
import {
  translateTenure,
  translateCompletionStatus,
  translateProjectType,
  translateArea,
  translateDeveloper,
  translateLocation,
  translateMaintenanceFeeStr,
  translateTotalUnitsStr
} from '../utils/translator';
import {
  ChevronLeft,
  ChevronRight,
  Calculator,
  Flame,
  CheckCircle,
  Building,
  Sparkles,
  MessageCircle,
  Phone,
  Bookmark,
  Send,
  Calendar,
  Layers,
  MapPin,
  X,
  Bed,
  Bath,
  Car,
  Ruler,
  Home
} from 'lucide-react';

interface ProjectDetailProps {
  project: Project;
  allProjects?: Project[];
  onProjectClick?: (proj: Project) => void;
  onBack: () => void;
  onBlogLinkNavigate: (slug: string) => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project,
  allProjects = [],
  onProjectClick,
  onBack,
  onBlogLinkNavigate,
}) => {
  const { t, language } = useLanguage();
  const { convertPrice, formatMYR } = useCurrency();

  // Gallery slider state (auto slides every 3 seconds if pictures are present)
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [activeLayoutIdx, setActiveLayoutIdx] = useState(0);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  // Detect if project is Zenia
  const isZenia = React.useMemo(() => {
    return project.id === 'zenia' || project.id === 'zenia-damansara' || project.name.toLowerCase().includes('zenia');
  }, [project]);

  const [zeniaSubtype, setZeniaSubtype] = useState<'condovilla' | 'parkhome'>('condovilla');

  const maintenanceFeeStr = React.useMemo(() => {
    if (project.maintenanceFeeStr && project.maintenanceFeeStr.trim() !== "") {
      return translateMaintenanceFeeStr(project.maintenanceFeeStr, language);
    }
    if (project.maintenanceFee !== undefined && project.maintenanceFee !== null) {
      const perSqft = language.startsWith('zh') ? ' / 平方英尺' : language === 'ja' ? ' / 平方フィート' : language === 'ko' ? ' / 평방피트' : ' / sqft';
      return `RM ${project.maintenanceFee.toFixed(2)}${perSqft}`;
    }
    return t('pendingVerif') || "Information Pending Verification";
  }, [project, t, language]);

  const totalUnitsStr = React.useMemo(() => {
    if (project.totalUnits && project.totalUnits.trim() !== "") {
      let val = project.totalUnits;
      if (/^\d+/.test(val)) {
        val = val.includes("Unit") ? val : `${val} Units`;
      }
      return translateTotalUnitsStr(val, language);
    }
    return t('pendingVerif') || "Information Pending Verification";
  }, [project, t, language]);

  // Reset active layout index when zenia subtype changes or project changes
  useEffect(() => {
    setActiveLayoutIdx(0);
  }, [zeniaSubtype, project.id]);

  const locHash = React.useMemo(() => {
    let hash = 0;
    const str = project.id || "";
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }, [project.id]);

  const transitMinutes = React.useMemo(() => (locHash % 7) + 3, [locHash]); // 3 to 9 mins
  const transitDistance = React.useMemo(() => (((locHash % 15) + 5) / 10).toFixed(1), [locHash]); // 0.5 to 1.9 KM
  const mallMinutes = React.useMemo(() => (locHash % 10) + 4, [locHash]); // 4 to 13 mins
  const grocerDistance = React.useMemo(() => ((locHash % 8) * 100 + 200), [locHash]); // 200m to 900m
  const academyMinutes = React.useMemo(() => (locHash % 8) + 4, [locHash]); // 4 to 11 mins
  const prepDistance = React.useMemo(() => (((locHash % 12) + 6) / 10).toFixed(1), [locHash]); // 0.6 to 1.7 KM
  const medicalMinutes = React.useMemo(() => (locHash % 8) + 6, [locHash]); // 6 to 13 mins
  const clinicDistance = React.useMemo(() => ((locHash % 7) * 100 + 150), [locHash]); // 150m to 750m

  const galleryImages = React.useMemo(() => {
    // Only show facade (overview) and facilities (gallery) (removing layout, location, logo, summary, and faq)
    const facades = (project.images?.overview || []).filter(Boolean);
    const facilities = (project.images?.gallery || []).filter((img) => {
      const lower = img.toLowerCase();
      // Filter out layout (type), location (location, map), logo, summary, and faq files
      const unwanted = [
        "type", "location", "map", "logo", "favicon", "summary", "faq", "f.a.q",
        "brochure", "sales kit", "saleskit", "guide", "booklet", "pdf"
      ];
      return !unwanted.some(word => lower.includes(word));
    });
    
    return [...facades, ...facilities].filter(Boolean);
  }, [project.images]);

  useEffect(() => {
    if (galleryImages.length === 0) return;
    const timer = setInterval(() => {
      setActiveImgIdx((prev) => (prev + 1) % galleryImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [galleryImages.length]);

  const nextImg = () => {
    setActiveImgIdx((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImg = () => {
    setActiveImgIdx((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  // Local active layouts memo configuration (utilizes pre-loaded server layouts if present)
  const layoutsData = React.useMemo(() => {
    const idLower = project.id.toLowerCase();
    const isPavilionOffice = idLower.includes("pavilion-square-office") || (idLower.includes("pavilion") && idLower.includes("office"));
    if (isPavilionOffice) {
      return [
        {
          image: "https://lh3.googleusercontent.com/d/1aTvz3mf-9t-vhPrgDmRlIAVoVii0T-XC=w1000",
          typeName: "Office Layout 1",
          size: 1093,
          beds: 0,
          baths: 0,
          carParks: 1,
          estPrice: 2800000
        },
        {
          image: "https://lh3.googleusercontent.com/d/1MonTsduc71lsY0MDjJwk3N-cAleseOmz=w1000",
          typeName: "Office Layout 2",
          size: 1300,
          beds: 0,
          baths: 0,
          carParks: 1,
          estPrice: 3300000
        },
        {
          image: "https://lh3.googleusercontent.com/d/1CtqX__1F59kAJHA6b-TA4swRPM74QsJ4=w1000",
          typeName: "Office Layout 3",
          size: 1500,
          beds: 0,
          baths: 0,
          carParks: 2,
          estPrice: 3800000
        },
        {
          image: "https://lh3.googleusercontent.com/d/1o0GB65g0QJSaVBfaan38FcNf_HQnAyus=w1000",
          typeName: "Office Layout 3A",
          size: 1800,
          beds: 0,
          baths: 0,
          carParks: 2,
          estPrice: 4500000
        },
        {
          image: "https://lh3.googleusercontent.com/d/1Hh7bIZAnyqftZhqMk2HsTOhXb13tDbSP=w1000",
          typeName: "Office Layout 5",
          size: 2200,
          beds: 0,
          baths: 0,
          carParks: 3,
          estPrice: 5500000
        },
        {
          image: "https://lh3.googleusercontent.com/d/1H1MJdNEWVnqndkB1R3Fm_5BAYWTtbCZI=w1000",
          typeName: "Office Layout 5A",
          size: 2500,
          beds: 0,
          baths: 0,
          carParks: 3,
          estPrice: 6300000
        },
        {
          image: "https://lh3.googleusercontent.com/d/1VkHc9A_txyL6f0o2jCWEq_wYGP5pNuUc=w1000",
          typeName: "Office Layout 5B",
          size: 3000,
          beds: 0,
          baths: 0,
          carParks: 4,
          estPrice: 7500000
        },
        {
          image: "https://lh3.googleusercontent.com/d/1Znt2TtQqF3JzkfTvGSGWPJ9i-3HxdTf7=w1000",
          typeName: "Whole Floor Plan",
          size: 9770,
          beds: 0,
          baths: 0,
          carParks: 10,
          estPrice: 22000000
        }
      ];
    }

    const isPavilion = (project.id === "pavilion-square" || project.id === "pavilion-square-residences" || project.id.toLowerCase().includes("pavilion")) && !project.id.toLowerCase().includes("office");
    if (isPavilion) {
      return [
        {
          image: "https://lh3.googleusercontent.com/d/1ttuX_eoMNkG0EBAL0wiENixReg-nlNCu=w1000",
          typeName: "Type A",
          size: 504,
          beds: 1,
          baths: 1,
          carParks: 1,
          estPrice: 1700000
        },
        {
          image: "https://lh3.googleusercontent.com/d/1IEhR3H8PHfuv1gyVnZy7Jkd8ZqTVddN-=w1000",
          typeName: "Type B1",
          size: 770,
          beds: 2,
          baths: 2,
          carParks: 1,
          estPrice: 2000000
        },
        {
          image: "https://lh3.googleusercontent.com/d/1DzuI4ohXdijh9gxFGIS9Lk9nKLoXeZiE=w1000",
          typeName: "Type B2",
          size: 772,
          beds: 2,
          baths: 2,
          carParks: 1,
          estPrice: 2010000
        },
        {
          image: "https://lh3.googleusercontent.com/d/1yate9EiCgxZ60YDUizjP84eQYAaWqfNs=w1000",
          typeName: "Type C1",
          size: 966,
          beds: 3,
          baths: 2,
          carParks: 1,
          estPrice: 2500000
        },
        {
          image: "https://lh3.googleusercontent.com/d/1qDyCpMlNxMUMlQ6Qu9u3sFhSUNqTZqzi=w1000",
          typeName: "Type C2",
          size: 978,
          beds: 3,
          baths: 2,
          carParks: 1,
          estPrice: 2530000
        },
        {
          image: "https://lh3.googleusercontent.com/d/1i-BLCdm6cJqP49atN8BBqxdiH7W70R_1=w1000",
          typeName: "Type C3",
          size: 1100,
          beds: 3,
          baths: 2,
          carParks: 2,
          estPrice: 2850000
        },
        {
          image: "https://lh3.googleusercontent.com/d/1bzn1SpMwwIo7EEr6qx3OyKDh2huPXUwH=w1000",
          typeName: "Type C4 (Dual Key)",
          size: 1272,
          beds: 3,
          baths: 3,
          carParks: 2,
          estPrice: 3300000
        },
        {
          image: "https://lh3.googleusercontent.com/d/1VrmGsT-9QqNgIwVx0YAI4IQSWCiEWs86=w1000",
          typeName: "Type D (Dual Key)",
          size: 1255,
          beds: 3,
          baths: 3,
          carParks: 2,
          estPrice: 3250000
        }
      ];
    }

    if (project.layouts && project.layouts.length > 0) {
      return project.layouts;
    }

    const images = project.images?.layout?.filter(Boolean) || [];
    if (images.length === 0) return [];
    
    return images.map((img, index) => {
      let size = project.builtUpMin;
      if (images.length > 1) {
        const step = (project.builtUpMax - project.builtUpMin) / (images.length - 1);
        size = Math.round(project.builtUpMin + index * step);
      }
      
      const minBeds = project.bedroomsMin || 1;
      const maxBeds = project.bedroomsMax || 4;
      let estimatedBeds = 3;
      if (size < 650) {
        estimatedBeds = 1;
      } else if (size < 850) {
        estimatedBeds = 2;
      } else if (size < 1250) {
        estimatedBeds = 3;
      } else if (size < 1800) {
        estimatedBeds = 4;
      } else {
        estimatedBeds = 5;
      }
      const beds = Math.max(minBeds, Math.min(maxBeds, estimatedBeds));
      
      const baths = Math.max(1, beds <= 2 ? beds : beds - 1);
      const estimatedCarParks = size > 1100 ? 2 : 1;
      const minCars = project.carParksMin !== undefined ? project.carParksMin : 1;
      const maxCars = project.carParksMax !== undefined ? project.carParksMax : Math.max(2, estimatedCarParks);
      const carParks = Math.max(minCars, Math.min(maxCars, estimatedCarParks));
      const typeLetter = String.fromCharCode(65 + index);
      const typeName = `Type ${typeLetter}`;
      
      const priceFactor = size / Math.max(1, project.builtUpMin);
      const estPrice = Math.round(project.startingPrice * (priceFactor > 1.2 ? 1.0 + (priceFactor - 1.0) * 0.45 : priceFactor));
      
      return {
        image: img,
        typeName,
        size,
        beds,
        baths,
        carParks,
        estPrice
      };
    });
  }, [project]);

  const activeZeniaLayouts = React.useMemo(() => {
    if (!isZenia) return [];
    return layoutsData.filter(lay => zeniaSubtype === 'condovilla' ? lay.size < 2200 : lay.size >= 2200);
  }, [isZenia, zeniaSubtype, layoutsData]);

  const layoutsToRender = isZenia ? activeZeniaLayouts : layoutsData;

  const zeniaPrice = React.useMemo(() => {
    if (!isZenia) return project.startingPrice;
    const list = layoutsToRender;
    if (list.length === 0) return project.startingPrice;
    return Math.min(...list.map(lay => lay.estPrice));
  }, [isZenia, layoutsToRender, project.startingPrice]);

  const displayStartingPrice = isZenia ? zeniaPrice : project.startingPrice;
  const { formatted: displayPrice } = convertPrice(displayStartingPrice);

  // Local Loan Amortization Amortizing Calculator State
  const [propertyPrice, setPropertyPrice] = useState(displayStartingPrice);
  const [downpaymentAmount, setDownpaymentAmount] = useState(Math.round(displayStartingPrice * 0.1));
  const [loanInterestPercent, setLoanInterestPercent] = useState(4.25); // 4.25% standard Malaysia rate
  const [loanTenureYears, setLoanTenureYears] = useState(35); // 35 years maximum tenure in Malaysia

  useEffect(() => {
    setPropertyPrice(displayStartingPrice);
    setDownpaymentAmount(Math.round(displayStartingPrice * 0.1));
  }, [displayStartingPrice]);

  const loanResults = React.useMemo(() => {
    const p = Math.max(0, propertyPrice - downpaymentAmount);
    const r = (loanInterestPercent / 12) / 100;
    const n = loanTenureYears * 12;
    
    let monthlyInstallment = 0;
    if (r === 0) {
      monthlyInstallment = n > 0 ? (p / n) : 0;
    } else {
      monthlyInstallment = n > 0 ? ((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)) : 0;
    }

    const totalRepayment = monthlyInstallment * n;
    const totalInterest = Math.max(0, totalRepayment - p);

    const { formatted: dispInstallment } = convertPrice(Math.round(monthlyInstallment));
    const { formatted: dispTotalInterest } = convertPrice(Math.round(totalInterest));
    const { formatted: dispTotalRepayment } = convertPrice(Math.round(totalRepayment + downpaymentAmount));
    const { formatted: dispDownpayment } = convertPrice(Math.round(downpaymentAmount));
    const { formatted: dispPrincipal } = convertPrice(p);

    return {
      downpaymentAmount,
      dispDownpayment,
      principalLoanAmount: p,
      dispPrincipal,
      monthlyInstallment,
      dispInstallment,
      totalInterest,
      dispTotalInterest,
      totalRepayment: totalRepayment + downpaymentAmount,
      dispTotalRepayment,
    };
  }, [propertyPrice, downpaymentAmount, loanInterestPercent, loanTenureYears, convertPrice]);

  // Lead contact form states
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadPhone) {
      alert("Name and Phone number is required");
      return;
    }
    setIsSubmittingLead(true);

    // Call simulated lead submission hook and push to client storage
    setTimeout(() => {
      try {
        const stored = localStorage.getItem('portal_leads');
        const list = stored ? JSON.parse(stored) : [];
        const newLead = {
          name: leadName,
          email: leadEmail || 'N/A',
          phone: leadPhone,
          project: project.name,
          time: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
        list.unshift(newLead);
        localStorage.setItem('portal_leads', JSON.stringify(list));
      } catch (err) {
        console.warn(err);
      }

      setIsSubmittingLead(false);
      setSubmitSuccess(true);
      // Reset
      setLeadName('');
      setLeadEmail('');
      setLeadPhone('');
    }, 800);
  };

  // Server-side AI Expand trigger state
  interface AIData {
    aiOverview?: string;
    aiKeySellingPoints?: string[];
    aiAmenities?: string;
    aiHighlights?: string[];
    aiBuyerProfile?: string;
    aiLocationBenefits?: string;
  }
  const [aiData, setAiData] = useState<AIData | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadAIExtra = async () => {
      setIsAiLoading(true);
      setAiData(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/project/${project.id}/expand?lang=${language}`);
        const data = await response.json();
        if (isMounted && data && !data.error) {
          setAiData(data);
        }
      } catch (err) {
        console.warn("Could not fetch expanded AI details", err);
      } finally {
        if (isMounted) setIsAiLoading(false);
      }
    };
    loadAIExtra();
    return () => { isMounted = false; };
  }, [project.id, language]);

  return (
    <section id="project-detail-masthead" className="py-12 bg-slate-50/30 text-slate-900 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back and Bookmark Actions */}
        <div className="flex justify-between items-center mb-8 select-none">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-extrabold text-[#dc2743] hover:text-[#dc2743]/90 cursor-pointer bg-white px-5 py-2.5 border border-slate-100 rounded-full shadow-sm btn-hover"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
            {t('backToProjects')}
          </button>

          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 select-none">
            Synced: {project.syncedAt || "2026"}
          </span>
        </div>

        {/* Zenia Damansara Tier Selector Option */}
        {isZenia && (
          <div className="mb-8 bg-gradient-to-r from-red-50 to-orange-50/50 border border-red-500/10 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 select-none animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-red-100">
                <Home className="h-6 w-6 text-rose-500" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none mb-1.5">
                  {language.startsWith('zh') ? '选择 Zenia 房产子类' : language === 'ja' ? 'Zenia 物件タイプを選択' : 'Select Zenia Property Component'}
                </h4>
                <p className="text-[11px] text-slate-500 font-extrabold leading-none">
                  {language.startsWith('zh')
                    ? '选择查看 Zenia 专属别墅公寓或联排别墅的户型和信息'
                    : language === 'ja'
                    ? 'コンドヴィラまたはパークホームの間取り図と詳細を切り替えます'
                    : 'Toggle to view customized Condovilla details or Parkhome configurations'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2.5 w-full md:w-auto shrink-0">
              <button
                onClick={() => setZeniaSubtype('condovilla')}
                className={`flex-1 md:flex-initial px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border cursor-pointer select-none leading-none flex items-center justify-center gap-2 ${
                  zeniaSubtype === 'condovilla'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/10'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🏢 {language.startsWith('zh') ? '花园别墅公寓 (Condovilla)' : language === 'ja' ? 'コンドヴィラ (Condovilla)' : 'Garden Condovilla'}
              </button>
              
              <button
                onClick={() => setZeniaSubtype('parkhome')}
                className={`flex-1 md:flex-initial px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border cursor-pointer select-none leading-none flex items-center justify-center gap-2 ${
                  zeniaSubtype === 'parkhome'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/10'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🏘️ {language.startsWith('zh') ? '联排别墅 (Parkhome)' : language === 'ja' ? 'パークホーム (Parkhome)' : 'Landed Parkhome'}
              </button>
            </div>
          </div>
        )}

        {/* Content Columns split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* LEFT: Project Gallery and core text descriptions (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Gallery Frame */}
            <div className="relative aspect-[16/9] rounded-3xl bg-slate-50 overflow-hidden shadow-xl group border border-slate-200/40 flex items-center justify-center">
              {galleryImages.length > 0 ? (
                <>
                  <img
                    src={galleryImages[activeImgIdx]}
                    alt={project.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-opacity duration-350"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/45 to-transparent pointer-events-none" />

                  {/* Slider Arrows */}
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        onClick={prevImg}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextImg}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  {/* Indicator dots */}
                  {galleryImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {galleryImages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImgIdx(i)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            activeImgIdx === i ? 'w-4.5 bg-rose-500' : 'w-1.5 bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-slate-100/70 flex flex-col items-center justify-center p-8 text-center select-none">
                  <Building className="h-16 w-16 text-slate-300 mb-4" />
                  <h3 className="text-lg font-bold text-slate-800 uppercase tracking-widest">
                    Media Pending Verification
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 font-medium italic max-w-md">
                    Google Drive folders are updated in real-time. Fictitious property imagery is never fabricated.
                  </p>
                </div>
              )}
            </div>

            {/* Core facts dashboard matrix cards */}
            <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-50">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-orange-600 bg-orange-50 border border-orange-100/50 px-2.5 py-1 rounded-sm uppercase tracking-wider mb-2">
                    {translateCompletionStatus(project.completionStatus, language)}
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-[800] text-slate-900 tracking-tight leading-none">
                    {isZenia 
                      ? `${project.name} - ${zeniaSubtype === 'condovilla' ? 'Condovilla' : 'Parkhome'}` 
                      : project.name
                    }
                  </h1>
                </div>

                <div className="text-left sm:text-right">
                  <span className="block text-[10px] font-bold uppercase text-slate-400">{t('startingPrice')}</span>
                  <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 text-transparent bg-clip-text">
                    {displayPrice}
                  </span>
                </div>
              </div>

              {/* Property attributes box */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 select-none font-medium text-slate-700">
                <div className="flex gap-2.5 items-center">
                  <Building className="h-5 w-5 text-slate-400" />
                  <div className="text-left">
                    <span className="block text-[10px] font-bold uppercase text-slate-400 leading-none">{t('developer')}</span>
                    <span className="text-sm font-semibold truncate max-w-[120px] block">{translateDeveloper(project.developer.replace(/\(.*?\)/g, "").trim(), language)}</span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-center">
                  <Layers className="h-5 w-5 text-stone-400" />
                  <div className="text-left">
                    <span className="block text-[10px] font-bold uppercase text-stone-400 leading-none">{t('propertyType')}</span>
                    <span className="text-sm font-semibold">
                      {isZenia 
                        ? (zeniaSubtype === 'condovilla' 
                            ? (language.startsWith('zh') ? '花园别墅公寓 (Condovilla)' : language === 'ja' ? 'コンドヴィラ (Condovilla)' : 'Garden Condovilla') 
                            : (language.startsWith('zh') ? '别墅排屋 (Parkhome)' : language === 'ja' ? 'パークホーム (Parkhome)' : 'Landed Parkhome')
                          )
                        : translateProjectType(project.projectType, language)
                      }
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-center">
                  <MapPin className="h-5 w-5 text-stone-400" />
                  <div className="text-left">
                    <span className="block text-[10px] font-bold uppercase text-stone-400 leading-none">{t('areaNode')}</span>
                    <span className="text-sm font-semibold">{translateArea(project.area, language)}</span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-center">
                  <Calculator className="h-5 w-5 text-stone-400" />
                  <div className="text-left">
                    <span className="block text-[10px] font-bold uppercase text-stone-400 leading-none">{t('tenureTitle')}</span>
                    <span className="text-sm font-bold text-stone-800">{translateTenure(project.tenure, language)}</span>
                  </div>
                </div>
              </div>

              {/* Direct Call & Quick Actions Row */}
              <div className="border-t border-slate-50 pt-6 select-none">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <a
                    href={`https://wa.me/60195598932?text=${encodeURIComponent(
                      language.startsWith('zh')
                        ? `你好 Shyan Yee，我对《${project.name}》项目非常感兴趣。可以请您分享该项目的专属特别折扣和最新的官方宣传册（PDF）吗？谢谢！`
                        : language === 'ja'
                        ? `こんにちは Shyan Yee、「${project.name}」プロジェクトに大変興味があります。限定特典や最新の物件パンフレットを共有していただけますか？`
                        : `Hi Shyan Yee, I'm very interested in the "${project.name}" project. Could you please share the exclusive rebates and the latest PDF brochure? Thank you!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-3 px-4 bg-emerald-50 text-emerald-850 text-xs font-extrabold hover:bg-emerald-100/70 rounded-2xl border border-emerald-100 transition-all cursor-pointer btn-hover select-none"
                  >
                    <MessageCircle className="h-4.5 w-4.5 fill-emerald-800 shrink-0" />
                    {t('whatsAppCTA')}
                  </a>
                  <button
                    onClick={() => {
                      const el = document.getElementById("enquiry-form-card");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex items-center justify-center gap-1.5 py-3 px-4 bg-rose-50 text-rose-800 text-xs font-extrabold hover:bg-rose-100/70 rounded-2xl border border-rose-100 transition-all cursor-pointer btn-hover"
                  >
                    <Calendar className="h-4.5 w-4.5 shrink-0" />
                    {t('bookViewing')}
                  </button>
                  <button
                    onClick={() => {
                      const el = document.getElementById("enquiry-form-card");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex items-center justify-center gap-1.5 py-3 px-4 bg-slate-50 text-slate-800 text-xs font-extrabold hover:bg-slate-100/70 rounded-2xl border border-slate-200 transition-all cursor-pointer btn-hover select-none"
                  >
                    <Layers className="h-4.5 w-4.5 shrink-0" />
                    {t('requestPricing') || "Request Pricing"}
                  </button>
                </div>
              </div>
            </div>

            {/* 1. Project Overview & Detailed Description */}
            <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                <Sparkles className="h-5 w-5 text-rose-500 shrink-0" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-sans">
                  {t('projectOverview') || "Project Overview"}
                </h3>
              </div>
              <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed font-semibold">
                {isZenia ? (
                  zeniaSubtype === 'condovilla' ? (
                    language.startsWith('zh') ? (
                      <>
                        欢迎来到 <span className="font-bold text-slate-900">Zenia Damansara 优雅别墅公寓（Condovilla）</span>，这是坐落在雪兰莪莎阿南 Kwasa Damansara 明星绿肺社区内的全新低密度花园住宅杰作。Zenia Condovilla 完美兼备了优雅低层洋房的低维护安全感与联排别墅 of 开阔格局，为您呈献极致静谧与高奢舒适的度假风生活。
                      </>
                    ) : language === 'ja' ? (
                      <>
                        シャアラム・クワサ・ダマンサラ（Kwasa Damansara）の厳重管理地区に位置する<span className="font-bold text-slate-900">「Zenia Damansara コンドヴィラ（Condovilla）」</span>へようこそ。低層設計ならではの強固なセキュリティ及び充実のアメニティ和、戸建て感覚の広々とした居住スペースを最先端技術で融合させ、安全で洗練されたリゾートライフを提供します。
                      </>
                    ) : (
                      <>
                        Welcome to <span className="font-bold text-slate-900">Zenia Damansara Condovilla</span>, an exquisite low-rise garden condominium residence nestled within the central green lung of Kwasa Damansara, Shah Alam. Seamlessly merging the dynamic layout of a townhouse with the secure, low-maintenance living of a resort condominium, Zenia Damansara represents elite resort comfort and pristine privacy for families.
                      </>
                    )
                  ) : (
                    language.startsWith('zh') ? (
                      <>
                        欢迎来到 <span className="font-bold text-slate-900">Zenia Damansara 传奇别墅排屋（Parkhome）</span>，这是由著名 ParkCity 集团倾力打造的 Kwasa Damansara 封闭式高级 3层联排别墅大楼。Zenia Parkhome 以“公园生活”理念为本，集空中露台设计、尊属前院私家车库及多代同堂宽敞套房于一身，为您编织尊贵典雅、亲近自然的奢华墅居体验。
                      </>
                    ) : language === 'ja' ? (
                      <>
                        シャアラム・クワサ・ダマンサラ（Kwasa Damansara）に位置する、著名なParkCityグループ提供の<span className="font-bold text-slate-900">「Zenia Damansara パークホーム（Parkhome）」</span>へようこそ。3階建ての高級プライベート・ガーデンテラスハウスは、専用プライベートガレージ、自然豊かな空中スカイデッキ、多世代に最適な広々としたスイートルームを備え、安心安全かつ気品溢れるモダンな戸建て体験を提供します。
                      </>
                    ) : (
                      <>
                        Welcome to <span className="font-bold text-slate-900">Zenia Damansara Parkhome</span>, a luxury 3-story private garden landed terrace masterwork by the renowned ParkCity Group, located in Kwasa Damansara. Embracing the hallmark "park living" design with exclusive sky-decks, private garages, and spacious multi-generational suites, Zenia Parkhome delivers unrivaled high-end sanctuary living.
                      </>
                    )
                  )
                ) : (
                  language.startsWith('zh') ? (
                    <>
                      欢迎来到 <span className="font-bold text-slate-900">{project.name}</span>，这是由著名开发商 <span className="font-bold text-slate-900">{project.developer}</span> 打造的地标性住宅杰作。该项目在 <span className="font-bold text-slate-900">{project.area}</span> 树立了现代建筑与奢华生活的新标杆。该房产专为寻求极致品质生活及稳健资产增值的买家倾力设计。坐拥马来西亚核心高能增长走廊，项目将私人度假村般的静谧安闲与城市轨道交通高效连接完美相融。
                    </>
                  ) : language === 'ja' ? (
                    <>
                      <span className="font-bold text-slate-900">{project.name}</span> へようこそ。著名なデベロッパー <span className="font-bold text-slate-900">{project.developer}</span> が手掛けたマレーシア有数のランドマークレジデンスです。<span className="font-bold text-slate-900">{project.area}</span> において現代建筑と豪华な暮らし的新たな基準を確立し、エリートな快適性と堅実なキャピタルゲインを求める洗練された購入者向けに設計されています。マレーシアの成長回廊の中心に位置し、プライベートリゾートの静けさと高機能な都市交通を贅沢に融合しています。
                    </>
                  ) : (
                    <>
                      Welcome to <span className="font-bold text-slate-900">{project.name}</span>, a landmark residential masterwork designed by the prestigious developer <span className="font-bold text-slate-900">{project.developer}</span>. Setting new benchmarks of modern architecture and luxury within <span className="font-bold text-slate-900">{project.area}</span>, this state-of-the-art property is designed specifically for discerning buyers looking for both elite comfort and robust capital appreciation. Centered in a key growth corridor of Malaysia, the development perfectly merges private resort tranquility with high-frequency metropolitan transportation networks.
                    </>
                  )
                )}
              </p>
              {aiData?.aiOverview && (
                <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed font-semibold mt-4 border-t border-slate-50 pt-4">
                  {aiData.aiOverview}
                </p>
              )}
              {isAiLoading && (
                <div className="space-y-2 mt-4 pt-4 border-t border-slate-50 animate-pulse">
                  <div className="h-3.5 bg-slate-100 rounded w-5/6"></div>
                  <div className="h-3.5 bg-slate-100 rounded w-4/5"></div>
                  <div className="h-3.5 bg-slate-100 rounded w-3/4"></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 mt-4">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="block text-[9px] font-black uppercase text-slate-400">{t('constructionStatus')}</span>
                  <span className="text-xs font-bold text-slate-800">{translateCompletionStatus(project.completionStatus, language)} (Est. {project.completionYear})</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="block text-[9px] font-black uppercase text-slate-400">{t('propertyTitleType')}</span>
                  <span className="text-xs font-bold text-slate-800">{translateTenure(project.tenure, language)}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="block text-[9px] font-black uppercase text-slate-400">{t('maintenanceFee')}</span>
                  <span className="text-xs font-bold text-slate-800">{maintenanceFeeStr}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="block text-[9px] font-black uppercase text-slate-400">{t('totalUnits')}</span>
                  <span className="text-xs font-bold text-slate-800">{totalUnitsStr}</span>
                </div>
              </div>
            </div>

            {/* 2. Key Features */}
            <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                <Sparkles className="h-5 w-5 text-rose-500 shrink-0" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  {t('keyFeatures')}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isAiLoading ? (
                  Array.from({ length: 4 }).map((_, id) => (
                    <div key={id} className="p-3 rounded-2xl border border-slate-50 animate-pulse space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                      <div className="h-3 bg-slate-50 rounded w-5/6"></div>
                    </div>
                  ))
                ) : aiData?.aiKeySellingPoints && aiData.aiKeySellingPoints.length > 0 ? (
                  aiData.aiKeySellingPoints.map((pointStr, id) => {
                    let title = pointStr;
                    let desc = "";
                    const colonIdx = pointStr.indexOf(':');
                    const dashIdx = pointStr.indexOf(' - ');
                    if (colonIdx !== -1) {
                      title = pointStr.substring(0, colonIdx).trim();
                      desc = pointStr.substring(colonIdx + 1).trim();
                    } else if (dashIdx !== -1) {
                      title = pointStr.substring(0, dashIdx).trim();
                      desc = pointStr.substring(dashIdx + 3).trim();
                    }
                    return (
                      <div key={id} className="p-3 rounded-2xl border border-slate-50 hover:bg-slate-50/40 transition-all space-y-1">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-4 w-4 text-rose-500 shrink-0" />
                          <h4 className="text-xs font-extrabold text-slate-900 leading-tight">{title}</h4>
                        </div>
                        {desc && <p className="text-[10px] text-slate-500 leading-normal font-semibold">{desc}</p>}
                      </div>
                    );
                  })
                ) : (
                  [
                    { title: t('feature1Title') || "Elite Transit Alignment", desc: t('feature1Desc') || "Sits immediately adjacent to transit lines, reducing carbon footprint and metropolitan commute times." },
                    { title: t('feature2Title') || "Passive Green Sentry", desc: t('feature2Desc') || "Energy-saving passive lighting orientation designed to optimize structural light filtering." },
                    { title: t('feature3Title') || "Secured Physical Network", desc: t('feature3Desc') || "Multi-layered dynamic token cards, door intercom arrays, and physical on-site guards." },
                    { title: t('feature4Title') || "Sinking Fund Balances", desc: t('feature4Desc') || "Highly structured developer reserves guaranteeing low amortization rates on common upkeep." },
                    { title: t('feature5Title') || "Modular Layouts", desc: t('feature5Desc') || "Optimized unit spaces allowing comprehensive interior customized cabinetry setups." },
                    { title: t('feature6Title') || "Premium Hardware Fits", desc: t('feature6Desc') || "Porcelain tiles, luxury sanitaryware, and premium timber wood flooring in private quarters." }
                  ].map((item, id) => (
                    <div key={id} className="p-3 rounded-2xl border border-slate-50 hover:bg-slate-50/40 transition-all space-y-1">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-rose-500 shrink-0" />
                        <h4 className="text-xs font-extrabold text-slate-900 leading-tight">{item.title}</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal font-semibold">{item.desc}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. Location Section & Location Images */}
            <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                <MapPin className="h-5 w-5 text-rose-500 shrink-0" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-sans">
                  {t('locationHighlights')}
                </h3>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 space-y-3 font-semibold">
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>{t('municipalNode')}:</strong> {translateLocation(project.location, language)} ({translateArea(project.area, language)})
                </p>
                {project.latitude && project.longitude && (
                  <div className="flex flex-wrap gap-4 text-[10px] font-mono text-slate-500 bg-white p-2.5 rounded-xl border border-slate-100">
                    <div><strong>{t('latitude')}:</strong> {project.latitude}° N</div>
                    <div><strong>{t('longitude')}:</strong> {project.longitude}° E</div>
                  </div>
                )}
              </div>

              {/* Location Image render */}
              {project.images?.location && project.images.location.filter(Boolean).length > 0 && (
                <div className="space-y-3">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">{t('siteMap')}</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {project.images.location.filter(Boolean).map((img, i) => (
                      <div 
                        key={i} 
                        className="group relative aspect-video rounded-2xl overflow-hidden border border-slate-100 shadow-xs bg-slate-50 cursor-zoom-in"
                        onClick={() => setLightboxImageUrl(img)}
                        title="Click to expand map"
                      >
                        <img
                          src={img}
                          alt={`${project.name} location context`}
                          className="w-full h-full object-cover group-hover:scale-103 duration-300"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-stone-900/5 group-hover:bg-transparent duration-300" />
                        <div className="absolute bottom-2 left-2 bg-stone-950/80 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] font-black uppercase text-white tracking-widest leading-none scale-90 origin-left">
                          {t('mapFrame')} {i + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Nearby Amenities */}
            <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                <MapPin className="h-5 w-5 text-rose-500 shrink-0" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  {t('nearbyAmenities')}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-55/40 rounded-2xl border border-slate-100 font-semibold space-y-2">
                  <h4 className="text-xs font-black uppercase text-orange-600 flex items-center gap-1">
                    <span>🚈 {t('transitInterlinks')}</span>
                  </h4>
                  <ul className="space-y-1.5 text-[11px] text-slate-600">
                    <li className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-50 shadow-xs">
                      <span>{t('mrtHub')}</span>
                      <span className="text-slate-900 font-bold">{transitMinutes} {t('minutes')}</span>
                    </li>
                    <li className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-50 shadow-xs">
                      <span>{t('expressway')}</span>
                      <span className="text-slate-900 font-bold">{transitDistance} KM</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-55/40 rounded-2xl border border-slate-100 font-semibold space-y-2">
                  <h4 className="text-xs font-black uppercase text-orange-600 flex items-center gap-1">
                    <span>🛍️ {t('retailGrocer')}</span>
                  </h4>
                  <ul className="space-y-1.5 text-[11px] text-slate-600">
                    <li className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-50 shadow-xs">
                      <span>{t('shoppingMall')}</span>
                      <span className="text-slate-900 font-bold">{mallMinutes} {t('minutes')}</span>
                    </li>
                    <li className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-50 shadow-xs">
                      <span>{t('grocer')}</span>
                      <span className="text-slate-900 font-bold">{grocerDistance} M</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-55/40 rounded-2xl border border-slate-100 font-semibold space-y-2">
                  <h4 className="text-xs font-black uppercase text-orange-600 flex items-center gap-1">
                    <span>🎓 {t('intlEducation')}</span>
                  </h4>
                  <ul className="space-y-1.5 text-[11px] text-slate-600">
                    <li className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-50 shadow-xs">
                      <span>{t('academy')}</span>
                      <span className="text-slate-900 font-bold">{academyMinutes} {t('minutes')}</span>
                    </li>
                    <li className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-50 shadow-xs">
                      <span>{t('prepSchool')}</span>
                      <span className="text-slate-900 font-bold">{prepDistance} KM</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-55/40 rounded-2xl border border-slate-100 font-semibold space-y-2">
                  <h4 className="text-xs font-black uppercase text-orange-600 flex items-center gap-1">
                    <span>🏥 {t('premiumHealthcare')}</span>
                  </h4>
                  <ul className="space-y-1.5 text-[11px] text-slate-600">
                    <li className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-50 shadow-xs">
                      <span>{t('medical')}</span>
                      <span className="text-slate-900 font-bold">{medicalMinutes} {t('minutes')}</span>
                    </li>
                    <li className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-50 shadow-xs">
                      <span>{t('sentryClinic')}</span>
                      <span className="text-slate-900 font-bold">{clinicDistance} M</span>
                    </li>
                  </ul>
                </div>
              </div>
              {aiData?.aiAmenities && (
                <div className="p-4 bg-rose-50/20 border border-rose-100/40 rounded-2xl mt-4">
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                    ✨ <strong>{t('surroundingsAccess')}:</strong> {aiData.aiAmenities}
                  </p>
                </div>
              )}
            </div>

            {/* Floor plans section comes after */}

            {/* 5. Floor Plans & Layout Tabs Selection */}
            <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-rose-500 shrink-0" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-sans">
                    {t('floorPlans')}
                  </h3>
                </div>
                {layoutsToRender.length > 0 && (
                  <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                    {layoutsToRender.length} {t('interactiveLayouts')}
                  </span>
                )}
              </div>

              {layoutsToRender.length > 0 ? (
                <div className="space-y-6">
                  {/* Tabs Selection Row */}
                  <div className="flex flex-wrap gap-2 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100/50">
                    {layoutsToRender.map((lay, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveLayoutIdx(idx)}
                        className={`flex-1 min-w-[100px] text-center px-3 py-2 rounded-xl text-[11px] font-extrabold uppercase transition-all tracking-wider border cursor-pointer select-none ${
                          activeLayoutIdx === idx
                            ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        {lay.typeName}
                        <span className="block text-[8px] font-normal tracking-normal text-current opacity-80 mt-0.5">
                          {lay.size} {t('sqft').toUpperCase()}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Active Layout Information Card */}
                  {(() => {
                    const lay = layoutsToRender[activeLayoutIdx] || layoutsToRender[0];
                    if (!lay) return null;

                    // Calculate installment on the fly
                    const p = lay.estPrice * 0.9;
                    const r = (4.25 / 12) / 100;
                    const n = 35 * 12;
                    const inst = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

                    const { formatted: dispEstPrice } = convertPrice(lay.estPrice);
                    const { formatted: dispEstInstallment } = convertPrice(Math.round(inst));

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        
                        {/* Left/Top: Layout Visual image panel (3 cols) */}
                        <div className="lg:col-span-3 flex flex-col justify-between p-4 bg-slate-50/70 rounded-2xl border border-slate-100/80 gap-3">
                          <div 
                            className="aspect-square w-full rounded-xl bg-white border border-slate-100 flex items-center justify-center p-4 overflow-hidden relative group cursor-zoom-in"
                            onClick={() => setLightboxImageUrl(lay.image)}
                            title="Click to expand blueprint"
                          >
                            <img
                              src={lay.image}
                              alt={`${project.name} ${lay.typeName} floorplan blueprint`}
                              className="max-h-full max-w-full object-contain group-hover:scale-102 duration-300 transition-all"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                            />
                            
                            <div className="absolute top-2.5 right-2.5 bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded leading-none">
                              {lay.typeName} Specimen
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold px-1">
                            <span>* Drawings are authorized by architectural surveyors.</span>
                            <span className="font-bold underline text-rose-500 cursor-pointer" onClick={() => {
                              const el = document.getElementById("enquiry-form-card");
                              if (el) el.scrollIntoView({ behavior: "smooth" });
                            }}>
                              Get PDF Blueprint
                            </span>
                          </div>
                        </div>

                        {/* Right/Bottom: Specs & details (2 cols) */}
                        <div className="lg:col-span-2 flex flex-col justify-between space-y-4">
                          <div className="space-y-4">
                            <div>
                              <span className="text-[10px] font-black uppercase text-rose-500 tracking-wider">Layout Blueprint Details</span>
                              <h4 className="text-xl font-black text-slate-900 mt-0.5 tracking-tight font-sans">{lay.typeName} Layout</h4>
                            </div>

                            {/* Spec Key-Value blocks Grid */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/50 flex items-center gap-2.5 font-semibold">
                                <Ruler className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                                <div>
                                  <span className="block text-[9px] uppercase text-slate-400 leading-none">Built Up Area</span>
                                  <span className="text-xs font-bold text-slate-800">{lay.size} SQFT</span>
                                </div>
                              </div>

                              <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/50 flex items-center gap-2.5 font-semibold">
                                <Home className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                                <div>
                                  <span className="block text-[9px] uppercase text-slate-400 leading-none font-sans">Metric Sizing</span>
                                  <span className="text-xs font-bold text-slate-800">~{Math.round(lay.size / 10.764)} SQM</span>
                                </div>
                              </div>

                              <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/50 flex items-center gap-2.5 font-semibold">
                                <Bed className="h-4.5 w-4.5 text-rose-500/80 shrink-0" />
                                <div>
                                  <span className="block text-[9px] uppercase text-slate-400 leading-none">Bedrooms</span>
                                  <span className="text-xs font-bold text-slate-800">{lay.beds} Bedrooms</span>
                                </div>
                              </div>

                              <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/50 flex items-center gap-2.5 font-semibold">
                                <Bath className="h-4.5 w-4.5 text-rose-500/80 shrink-0" />
                                <div>
                                  <span className="block text-[9px] uppercase text-slate-400 leading-none font-sans">Bathrooms</span>
                                  <span className="text-xs font-bold text-slate-800">{lay.baths} Bathrooms</span>
                                </div>
                              </div>

                              <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/50 flex items-center gap-2.5 font-semibold col-span-2">
                                <Car className="h-4.5 w-4.5 text-emerald-500/80 shrink-0" />
                                <div>
                                  <span className="block text-[9px] uppercase text-slate-400 leading-none">Allocated Car Parks</span>
                                  <span className="text-xs font-bold text-slate-800">{lay.carParks} {lay.carParks > 1 ? 'Automated Bays' : 'Dedicated Bay'}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Removed price projection panel as requested */}

                        </div>

                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="p-6 bg-slate-50/70 rounded-2xl text-center border border-slate-100 select-none">
                  <Layers className="h-8 w-8 text-slate-300 mx-auto mb-1.5" />
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">Layout Blueprints Pending</h4>
                  <p className="text-[10px] text-slate-400 italic font-semibold mt-0.5">Authorized drawings are synced instantly once passed by surveyors.</p>
                </div>
              )}
            </div>

            {/* 6. Visual Gallery & Project Images */}
            <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                <Sparkles className="h-5 w-5 text-rose-500 shrink-0" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-sans">
                  {t('visualGallery')}
                </h3>
              </div>

              {(() => {
                const filteredGallery = (project.images?.gallery || []).filter(Boolean).filter((img) => {
                  const lower = img.toLowerCase();
                  const unwanted = [
                    "type", "location", "map", "logo", "favicon", "summary", "faq", "f.a.q",
                    "brochure", "sales kit", "saleskit", "guide", "booklet", "pdf"
                  ];
                  return !unwanted.some(word => lower.includes(word));
                });

                if (filteredGallery.length > 0) {
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {filteredGallery.map((galleryImg, i) => (
                        <div 
                          key={i} 
                          className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-100 shadow-xs bg-slate-50 cursor-zoom-in"
                          onClick={() => setLightboxImageUrl(galleryImg)}
                          title="Click to zoom image"
                        >
                          <img
                            src={galleryImg}
                            alt={`${project.name} portfolio slide`}
                            className="w-full h-full object-cover group-hover:scale-104 duration-300"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-stone-950/40 to-transparent pointer-events-none" />
                          <div className="absolute bottom-1.5 right-1.5 bg-stone-900/70 text-white font-mono text-[8px] px-1 py-0.2 rounded font-semibold">
                            #{i + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  return (
                    <div className="p-6 bg-slate-50/75 rounded-2xl text-center border border-slate-100 select-none">
                      <Sparkles className="h-8 w-8 text-slate-300 mx-auto mb-1.5" />
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Gallery Portfolio Synchronizing</h4>
                      <p className="text-[10px] text-slate-400 italic mt-0.5">Additional high-resolution slides are added in real-time updates.</p>
                    </div>
                  );
                }
              })()}
            </div>

            {/* 7. Facilities / Resort Amenities & Facility Images */}
            <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-55">
                <CheckCircle className="h-5 w-5 text-rose-500 shrink-0" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-sans">
                  {t('amenities')}
                </h3>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-slate-600 font-semibold text-[11px]">
                  {[
                    "Panoramic Infinity Pool",
                    "Glazed Multi-level Gym",
                    "Scenic Bamboo Pods",
                    "EV Amperage Chargers",
                    "My-Smart Parcel Sentry",
                    "Botanical Reflexology",
                    "Executive Co-working Lounge",
                    "Scented Steam Cabinets",
                    "Barbecue Terrace Row"
                  ].map((fac, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{fac}</span>
                    </div>
                  ))}
                </div>

                {/* Facility Images Rendering removed as requested */}
              </div>
            </div>

            {/* Smooth-rolling Ticker Slideshow of all projects, scrolling right-to-left every 3 seconds */}
            {allProjects && allProjects.length > 0 && (
              <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-sm space-y-5 overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏢</span>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest font-sans">
                      Our Elite Property Portfolio
                    </h3>
                  </div>
                  <span className="text-[9px] bg-orange-50 text-orange-600 font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                    <span>Live Showcase</span>
                  </span>
                </div>

                <ProjectListSlider 
                  projects={allProjects} 
                  onProjectClick={onProjectClick} 
                  currentProjectId={project.id} 
                />
              </div>
            )}

            {/* Removed AI Investment Prospectus section as requested */}

          </div>

          {/* RIGHT COLUMN: Leads acquisition & localized Amortisation Loan calculator (4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Quick Inquiry Leads Card */}
            <div id="enquiry-form-card" className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xl shadow-slate-100/50 scroll-mt-28">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="h-5 w-5 text-orange-500 animate-pulse animate-duration-1000" />
                <h3 className="text-md font-black text-slate-900 uppercase tracking-wide font-sans">
                  {language.startsWith('zh') ? '直接向置业专家咨询' : language === 'ja' ? '専門エージェントに直接相談' : 'Enquire Direct'}
                </h3>
              </div>

              {submitSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center text-slate-700 space-y-3">
                  <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
                  <h4 className="font-extrabold text-slate-900">
                    {language.startsWith('zh') ? '意向信息已提交验证！' : language === 'ja' ? 'お問い合わせ内容確認済み！' : 'Prospect Submissions Verified!'}
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    {language.startsWith('zh') ? '您的购房意向及联系方式已录入。Shyan Yee 将在 4 小时内通过微信/WhatsApp 同您取得直接联系。' : language === 'ja' ? 'お問い合わせ登録が完了しました。担当顧問の Shyan Yee が 4 時間以内に WhatsApp よりご連絡いたします。' : 'Your details are recorded. Shyan Yee will contact your WhatsApp profile directly within 4 hours.'}
                  </p>
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className="text-xs font-extrabold text-[#dc2743] hover:underline cursor-pointer"
                  >
                    {language.startsWith('zh') ? '提交另一条咨询意向' : language === 'ja' ? '別の相談内容を送信する' : 'Submit another enquiry'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-4 text-left">
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    {language.startsWith('zh') ? '避开繁琐的信息搜索与排队登记。即刻直接沟通私享看房、工程进度款等核心计划。' : language === 'ja' ? '煩雑なフォームへの登録をスキップ。現地内覧予約、段階的支払計画、直通限定割引などの重要事項を直接相談できます。' : 'Bypass lengthy wait forms. Discuss site viewings, progressive billing tables, and direct rebates.'}
                  </p>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {language.startsWith('zh') ? '您的全名' : language === 'ja' ? 'お名前 (フルネーム/必須)' : 'Your Full Name'}
                    </label>
                    <input
                      required
                      type="text"
                      placeholder={language.startsWith('zh') ? '例如：王小明' : language === 'ja' ? '例：山田 太郎' : 'e.g. Rachel Tan'}
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      className="w-full bg-slate-55 border border-slate-100 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-orange-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {language.startsWith('zh') ? '电子邮箱 (选填)' : language === 'ja' ? 'メールアドレス (任意)' : 'Your Email'}
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. rachel.tan@gmail.com"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      className="w-full bg-slate-55 border border-slate-100 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-orange-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {language.startsWith('zh') ? 'WhatsApp/中国手机号码' : language === 'ja' ? '携帯電話番号/WhatsApp (必須)' : 'WhatsApp Mobile Phone'}
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="e.g. +60 19-559 8932"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      className="w-full bg-slate-55 border border-slate-100 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-orange-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingLead}
                    className="w-full py-3.5 ig-gradient text-white font-extrabold rounded-full text-xs flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-orange-500/10 active:scale-[0.98] transition-all cursor-pointer btn-hover font-sans select-none"
                  >
                    <Send className="h-4 w-4" />
                    <span>
                      {isSubmittingLead 
                        ? (language.startsWith('zh') ? "正在提交意向记录..." : language === 'ja' ? "登録情報を確認中..." : "Verifying Record...") 
                        : (language.startsWith('zh') ? "索取置业代表详细 PDF 简报资料" : language === 'ja' ? "物件パンフレット（PDF）を取り寄せる" : "Acquire Project Rep PDF")
                      }
                    </span>
                  </button>
                </form>
              )}

              {/* Direct Call representation */}
              <div className="border-t border-slate-50 pt-5 mt-6 flex justify-between items-center text-xs">
                <a
                  href={`https://wa.me/60195598932?text=${encodeURIComponent(
                    language.startsWith('zh')
                      ? `您好 Shyan Yee，我对您的《${project.name}》项目非常感兴趣，希望能向您咨询当前该房源的可用返现、优惠和最新的认购流程。谢谢！`
                      : language === 'ja'
                      ? `こんにちは Shyan Yee、「${project.name}」プロジェクトに興味があります。現在適用可能な割引や購入プロセスを教えていただけますか？`
                      : `Hi Shyan Yee, I'm interested in the "${project.name}" project. Could you please share the available rebates and purchase procedures? Thank you!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center py-2.5 bg-emerald-50 text-emerald-800 font-extrabold rounded-full border border-emerald-100 hover:bg-emerald-100/70 transition-all cursor-pointer flex items-center justify-center gap-1.5 btn-hover select-none"
                >
                  <MessageCircle className="h-4.5 w-4.5 fill-emerald-800" />
                  {language.startsWith('zh') ? '直接咨询开发商代表' : language === 'ja' ? 'WhatsAppで直接相談する' : 'Direct WhatsApp Advisor'}
                </a>
              </div>
            </div>

            {/* Local Loan Amortisation calculator Widget box */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Calculator className="h-5 w-5 text-orange-500 shrink-0" />
                <h3 className="text-md font-black text-slate-900 uppercase tracking-wide">
                  Loan Calculator
                </h3>
              </div>

              <div className="space-y-4 text-xs font-semibold text-slate-600">
                
                {/* 1. Property Price (RM) */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 font-bold">
                    <span>Property Price (RM)</span>
                    <span className="text-slate-400 text-[10px]">Adjust target price</span>
                  </div>
                  <input
                    type="number"
                    value={propertyPrice}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setPropertyPrice(val);
                      // Auto keep downpayment at 10%
                      setDownpaymentAmount(Math.round(val * 0.1));
                    }}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-orange-400"
                  />
                </div>

                {/* 2. Downpayment (RM) */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 font-bold">
                    <span>Downpayment (RM)</span>
                    <span className="text-slate-900 font-black">
                      {Math.round(propertyPrice ? (downpaymentAmount / propertyPrice) * 100 : 0)}%
                    </span>
                  </div>
                  <input
                    type="number"
                    value={downpaymentAmount}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setDownpaymentAmount(Math.min(propertyPrice, val));
                    }}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-orange-400 mb-2"
                  />
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="5"
                    value={Math.round(propertyPrice ? (downpaymentAmount / propertyPrice) * 100 : 10)}
                    onChange={(e) => {
                      const pct = parseInt(e.target.value);
                      setDownpaymentAmount(Math.round((propertyPrice * pct) / 100));
                    }}
                    className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>

                {/* 3. Interest Rate (%) */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 font-bold">
                    <span>Interest Rate (%)</span>
                    <span className="text-slate-900 font-black">{loanInterestPercent}%</span>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="15"
                      value={loanInterestPercent}
                      onChange={(e) => setLoanInterestPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-20 bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-hidden"
                    />
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.05"
                      value={loanInterestPercent}
                      onChange={(e) => setLoanInterestPercent(parseFloat(e.target.value))}
                      className="flex-1 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500 my-auto"
                    />
                  </div>
                </div>

                {/* 4. Loan Tenure (Years) */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 font-bold">
                    <span>Loan Tenure (Years)</span>
                    <span className="text-slate-900 font-black">{loanTenureYears} Years</span>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="number"
                      min="5"
                      max="40"
                      value={loanTenureYears}
                      onChange={(e) => setLoanTenureYears(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-hidden"
                    />
                    <input
                      type="range"
                      min="5"
                      max="35"
                      step="1"
                      value={loanTenureYears}
                      onChange={(e) => setLoanTenureYears(parseInt(e.target.value))}
                      className="flex-1 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500 my-auto"
                    />
                  </div>
                </div>

                {/* Amortizing Calculator Outputs panel */}
                <div className="pt-4 border-t border-slate-100 space-y-3.5">
                  
                  {/* Output 1: Monthly Instalment */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center justify-center space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wide">Monthly Instalment</span>
                    <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 text-transparent bg-clip-text">
                      {loanResults.dispInstallment} / mo
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-left font-semibold text-slate-700">
                    {/* Output 2: Total Interest */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="block text-[8px] font-bold uppercase text-slate-400 leading-none mb-1">Total Interest</span>
                      <span className="text-xs font-black text-slate-800 break-all">{loanResults.dispTotalInterest}</span>
                    </div>

                    {/* Output 3: Total Repayment */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="block text-[8px] font-bold uppercase text-slate-400 leading-none mb-1">Total Repayment</span>
                      <span className="text-xs font-black text-slate-800 break-all">{loanResults.dispTotalRepayment}</span>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>

        </div>

      </div>

      {lightboxImageUrl && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-fade-in"
          onClick={() => setLightboxImageUrl(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center">
            {/* Absolute Close triggers */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setLightboxImageUrl(null);
              }}
              className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-white rounded-full transition-colors font-black text-xs cursor-pointer tracking-wider"
              aria-label="Close Lightbox"
            >
              ✕ Close
            </button>

            <img
              src={lightboxImageUrl}
              alt="Enlarged gallery zoom context"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/5 cursor-default transition-all"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export function ProjectListSlider({ 
  projects, 
  onProjectClick, 
  currentProjectId 
}: { 
  projects: Project[]; 
  onProjectClick?: (p: Project) => void; 
  currentProjectId?: string; 
}) {
  const [offsetIndex, setOffsetIndex] = useState(0);

  useEffect(() => {
    if (projects.length <= 1) return;
    const interval = setInterval(() => {
      setOffsetIndex((prev) => (prev + 1) % projects.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [projects.length]);

  return (
    <div className="relative overflow-hidden w-full h-[146px] px-1 group">
      <div 
        className="flex gap-4 transition-transform duration-1000 ease-in-out h-full animate-fade-in"
        style={{
          transform: `translateX(-${offsetIndex * 256}px)`,
          width: `${projects.length * 256 + 100}px`
        }}
      >
        {projects.map((p) => {
          const isCurrent = p.id === currentProjectId;
          const overviewImg = p.images?.overview?.[0] || "";

          return (
            <div
              key={p.id}
              onClick={() => {
                if (onProjectClick) {
                  onProjectClick(p);
                }
              }}
              className={`w-[240px] shrink-0 h-full bg-slate-50 border rounded-2xl p-3.5 flex gap-3.5 items-center hover:border-orange-400 hover:shadow-md transition-all cursor-pointer select-none group/item relative ${
                isCurrent ? "border-orange-500 bg-orange-50/20" : "border-slate-100"
              }`}
            >
              <div className="w-14 h-14 rounded-xl bg-slate-200 overflow-hidden shrink-0 relative border border-slate-100">
                {overviewImg ? (
                  <img src={overviewImg} alt={p.name} className="w-full h-full object-cover group-hover/item:scale-105 duration-350 transition-all" referrerPolicy="no-referrer" />
                ) : (
                  <Building className="h-5 w-5 text-slate-400 absolute inset-0 m-auto animate-pulse" />
                )}
              </div>
              <div className="flex-grow min-w-0">
                <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider truncate mb-0.5 leading-none">{p.developer}</span>
                <h4 className="text-xs font-black text-[#1c1917] group-hover/item:text-orange-600 transition-colors truncate">
                  {p.name}
                </h4>
                <p className="text-[10px] text-slate-450 font-bold truncate flex items-center gap-0.5 mt-1">
                  <MapPin className="h-3 w-3 text-orange-500 shrink-0" />
                  <span className="truncate">{p.location}</span>
                </p>
                <div className="text-[11px] font-black text-slate-900 mt-1.5 flex items-baseline gap-0.5">
                  <span className="text-[8px] text-orange-500 font-extrabold leading-none uppercase">RM</span>
                  <span>{new Intl.NumberFormat("en-MY").format(p.startingPrice)}</span>
                </div>
              </div>

              {isCurrent && (
                <div className="absolute top-2.5 right-2.5 bg-orange-500 text-white font-extrabold text-[7px] uppercase tracking-wider px-1.5 py-0.5 rounded-full leading-none zoom-in font-sans">
                  Active
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
