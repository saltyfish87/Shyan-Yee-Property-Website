export interface ProjectLayout {
  image: string;
  typeName: string;
  size: number;
  beds: number;
  baths: number;
  carParks: number;
  estPrice: number;
}

export interface Project {
  id: string;
  name: string;
  developer: string;
  location: string;
  area: string;
  startingPrice: number; // numerical starting price in RM
  startingPriceFormatted?: string; // "RM 697,800"
  priceRange?: string;
  builtUpMin: number;
  builtUpMax: number;
  bedroomsMin: number;
  bedroomsMax: number;
  tenure: string;
  projectType: string;
  completionStatus: string;
  completionYear: string;
  carParksMin?: number;
  carParksMax?: number;
  maintenanceFee?: number; // RM per sqft
  maintenanceFeeStr?: string;
  totalUnits?: string;
  images: {
    overview: string[];
    location: string[];
    layout: string[];
    gallery: string[];
  };
  layouts?: ProjectLayout[];
  aiOverview?: string;
  aiKeySellingPoints?: string[];
  aiAmenities?: string;
  aiHighlights?: string[];
  aiBuyerProfile?: string;
  aiLocationBenefits?: string;
  isHot?: boolean;
  syncedAt?: string;
  latitude?: number;
  longitude?: number;
}

export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  metaDescription: string;
  summary: string;
  content?: string; // Markdown supported
  readTime: string;
  publishDate: string;
  author: string;
  category: string;
  image: string;
  faqs?: { question: string; answer: string }[];
}

export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export type SupportedLanguage = 'en' | 'zh-CN' | 'zh-TW' | 'ja' | 'ko' | 'ar' | 'fr';
export type SupportedCurrency = 'MYR' | 'SGD' | 'USD' | 'CNY';
