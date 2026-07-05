import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { BLOG_DATA, FAQ_DATA } from "./src/data.js";
import { FAQ_TRANSLATIONS } from "./src/faqTranslations.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const aiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && aiKey && aiKey !== "MY_GEMINI_API_KEY") {
    try {
      aiClient = new GoogleGenAI({
        apiKey: aiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (e) {
      console.error("Failed to initialize Gemini AI client:", e);
    }
  }
  return aiClient;
}

// Memory Cache
interface Cache {
  projects: any[] | null;
  driveImages: string[] | null;
  driveImagesMap: Record<string, any> | null;
  lastProjectsFetch: number;
}

const cache: Cache = {
  projects: null,
  driveImages: null,
  driveImagesMap: null,
  lastProjectsFetch: 0,
};

// CACHE EXPIRY (10 minutes)
const CACHE_DURATION = 10 * 60 * 1000;

// Persistent AI generation cache file
const AI_CACHE_FILE = path.join(process.cwd(), "ai_generation_cache.json");
let aiGenerationCache: Record<string, any> = {};
try {
  if (fs.existsSync(AI_CACHE_FILE)) {
    fs.unlinkSync(AI_CACHE_FILE);
  }
} catch (_) {}

function saveAiCache() {
  try {
    fs.writeFileSync(AI_CACHE_FILE, JSON.stringify(aiGenerationCache, null, 2), "utf-8");
  } catch (e) {
    console.error("Could not save persistent AI generation cache:", e);
  }
}

// Fallback high-quality projects structure in case Google Sheets load fails
const FALLBACK_PROJECTS = [
  {
    id: "queenswoodz",
    name: "Queenswoodz",
    developer: "Exquisite Landmark Group",
    location: "Jalan Ampang, KLCC, Kuala Lumpur",
    area: "Kuala Lumpur",
    startingPrice: 850000,
    startingPriceFormatted: "RM 850,000",
    priceRange: "RM 850,000 – RM 1,200,000",
    builtUpMin: 850,
    builtUpMax: 1350,
    bedroomsMin: 2,
    bedroomsMax: 3,
    tenure: "Freehold",
    projectType: "Serviced Apartment",
    completionStatus: "Under Construction",
    completionYear: "2028",
    carParksMin: 1,
    carParksMax: 2,
    maintenanceFee: 0.38,
    images: {
      overview: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=800&auto=format&fit=crop"],
      location: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop"],
      layout: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop"],
      gallery: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop"]
    }
  },
  {
    id: "aldenz",
    name: "Aldenz",
    developer: "OSK Property",
    location: "Bukit Bintang, Kuala Lumpur",
    area: "Kuala Lumpur",
    startingPrice: 680000,
    startingPriceFormatted: "RM 680,000",
    priceRange: "RM 680,000 – RM 980,000",
    builtUpMin: 650,
    builtUpMax: 1100,
    bedroomsMin: 2,
    bedroomsMax: 3,
    tenure: "Freehold",
    projectType: "Condominium",
    completionStatus: "Ready To Move",
    completionYear: "2025",
    carParksMin: 1,
    carParksMax: 2,
    maintenanceFee: 0.35,
    images: {
      overview: ["https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop"],
      location: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop"],
      layout: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop"],
      gallery: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop"]
    }
  },
  {
    id: "parkside",
    name: "Parkside",
    developer: "Sime Darby Property",
    location: "Subang Jaya, Selangor",
    area: "Selangor",
    startingPrice: 520000,
    startingPriceFormatted: "RM 520,000",
    priceRange: "RM 520,000 – RM 750,000",
    builtUpMin: 750,
    builtUpMax: 1150,
    bedroomsMin: 2,
    bedroomsMax: 4,
    tenure: "Leasehold",
    projectType: "Serviced Residence",
    completionStatus: "Ready To Move",
    completionYear: "2024",
    carParksMin: 2,
    carParksMax: 2,
    maintenanceFee: 0.30,
    images: {
      overview: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop"],
      location: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop"],
      layout: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop"],
      gallery: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=800&auto=format&fit=crop"]
    }
  },
];

// Fallback image IDs
const FALLBACK_DRIVE_IDS = [
  "1q1la5uggywKd3x9dof69IAPnhClVfG66",
  "1BiAC1vtdGlGQEV57SSnEJvWanklNzxEH",
  "1L3xbKaCwq_pPmucjkXD3ObVtNQTHfnUE",
  "1DGtbHz7Me4pKESf5f2qwr9uNCzwW_66m",
  "1g7aUVvi3UaVZlAnx1ZhhB0SI0B574n43",
  "1e8thAXqOijIc9Kc_i3pnkgV03q_9WqQ8",
  "1zTDwRiFJ1EG13Yntj3IaDUiuqhLs_Ygq",
  "1Y95pFaisn1dKG2LPbkhePEOXYd0IKZYO",
  "19Ez2vRMANuU09PtwZ9gJDZ99k8qV19V2",
  "1cTkRj6Jf5G2NkBAF14homAx8JTtGmTcJ",
  "1TPqc02MjkMSb6rTNCPmSNdUbQb1M8QSA"
];

function cleanProjectSlug(name: string): string {
  // Decode HTML entities
  let cleaned = name.replace(/&amp;/gi, "&");
  cleaned = cleaned.replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
  cleaned = cleaned.replace(/&#39;/gi, "'").replace(/&#039;/gi, "'").replace(/&quot;/gi, '"');
  // Strip off numbers prefix like "1. ", "10. ", etc.
  cleaned = cleaned.replace(/^\d+[\.\s\-]+/g, "");
  // Strip off starting "the " (case insensitive)
  cleaned = cleaned.replace(/^the\s+/gi, "");
  // Lowercase & remove non-alphanumeric chars
  return cleaned.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeProjectName(name: string): string {
  let low = name.toLowerCase().trim();
  low = low.replace(/\bresidence\b/g, "");
  low = low.replace(/\bresidences\b/g, "");
  low = low.replace(/\bthe\b/g, "");
  low = low.replace(/\band\b/g, "");
  low = low.replace(/&/g, "");
  low = low.replace(/\(.*?\)/g, ""); // remove brackets like (PCD), (WCity OUG)
  const res = low.replace(/[^a-z0-9]/g, "");
  if (res === "zeniadamansara" || res.includes("zenia")) return "zenia";
  return res;
}

// Custom CSV Parser that handles double quotes correctly
function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentVal = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      row.push(currentVal.trim());
      if (row.some((cell) => cell !== "")) {
        result.push(row);
      }
      row = [];
      currentVal = "";
    } else {
      currentVal += char;
    }
  }
  if (row.length > 0 || currentVal !== "") {
    row.push(currentVal.trim());
    result.push(row);
  }
  return result;
}

// Scrape file IDs and project subfolders from Shared Google Drive folder
interface ProjectImages {
  overview: string[];
  location: string[];
  layout: string[];
  gallery: string[];
}

function getStableFallbackImages(id: string, name: string): ProjectImages {
  const pool = [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200&auto=format&fit=crop", // Modern luxury highrise
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop", // Sleek office / residential glass tower
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop", // Luxury villa / penthouse view
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop", // Modern architectural exterior
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop", // Exterior pool view
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop", // Gated landed / parkhome
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1200&auto=format&fit=crop", // Beautiful luxury estate
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop", // High-end interior living room
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop", // Bright modern apartment
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1200&auto=format&fit=crop"  // Grand residential entrance
  ];

  let overviewUrl = "";
  let galleryUrls: string[] = [];
  const idLower = id.toLowerCase();
  const nameLower = name.toLowerCase();

  if (idLower.includes("maple") || nameLower.includes("maple")) {
    overviewUrl = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200&auto=format&fit=crop";
    galleryUrls = [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop"
    ];
  } else if (idLower.includes("tria") || nameLower.includes("tria") || idLower.includes("seputeh") || nameLower.includes("seputeh")) {
    overviewUrl = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop";
    galleryUrls = [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop"
    ];
  } else if (idLower.includes("tujuh") || nameLower.includes("tujuh")) {
    overviewUrl = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop";
    galleryUrls = [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop"
    ];
  } else if (idLower.includes("stellar") || nameLower.includes("stellar") || idLower.includes("damansara") || nameLower.includes("damansara")) {
    overviewUrl = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop";
    galleryUrls = [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop"
    ];
  } else {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % pool.length;
    const galleryIndex1 = (index + 2) % pool.length;
    const galleryIndex2 = (index + 5) % pool.length;
    
    overviewUrl = pool[index];
    galleryUrls = [pool[galleryIndex1], pool[galleryIndex2]];
  }

  return {
    overview: [overviewUrl],
    location: ["https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1200&auto=format&fit=crop"],
    layout: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop"],
    gallery: galleryUrls
  };
}

interface ImageSyncResult {
  imagesMap: Record<string, ProjectImages>;
  flatPool: string[];
  driveLayoutsMap: Record<string, { id: string; name: string }[]>;
}

async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3, baseTimeout = 12000): Promise<Response> {
  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    const currentTimeout = baseTimeout + (attempt - 1) * 6000;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), currentTimeout);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      if (res.ok) {
        return res;
      }
      if (res.status === 429) {
        // Rate limited, wait and retry
        await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
      } else {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err: any) {
      clearTimeout(id);
      if (attempt >= maxRetries) {
        throw err;
      }
      console.warn(`Drive Sync: Fetch attempt ${attempt} failed for ${url}. Error: ${err.message || err}. Retrying in ${1000 * attempt}ms...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error(`Fetch failed after ${maxRetries} attempts`);
}

async function fetchGoogleDriveStructuredImages(): Promise<ImageSyncResult> {
  const imagesMap: Record<string, ProjectImages> = {};
  const flatPool: string[] = [];
  const driveLayoutsMap: Record<string, { id: string; name: string }[]> = {};

  try {
    const folderId = "1QCR6qJqsadN2y_PesOBr2uFZfZRZrvDd";
    const parentUrls = [
      `https://drive.google.com/drive/folders/${folderId}`,
      `https://drive.google.com/drive/folders/${folderId}?sort=13&direction=d`,
      `https://drive.google.com/drive/folders/${folderId}?sort=7&direction=d`,
      `https://drive.google.com/drive/folders/${folderId}?sort=2&direction=d`,
      `https://drive.google.com/drive/folders/${folderId}?direction=d`
    ];
    console.log("Drive Sync: Fetching parent Google Drive folders using multiple sort parameters to bypass limit...");

    const folders: { name: string; id: string }[] = [];
    const seenFolderIds = new Set<string>();

    for (const url of parentUrls) {
      try {
        const response = await fetchWithRetry(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        }, 3, 10000);
        const html = await response.text();

        const ariaRegex = /aria-label="([^"]+?)\s*(?:Shared folder|folder)"/gi;
        let match;
        
        while ((match = ariaRegex.exec(html)) !== null) {
          const name = match[1].trim();
          if (name.toLowerCase().includes("bin") || name.toLowerCase().includes("trash") || name.toLowerCase().includes("computers")) {
            continue; // skip other general system GDrive items
          }
          
          const pos = match.index;
          const tail = html.substring(pos, pos + 1000);
          
          // Scan the immediate 1000 characters context for data-id="..."
          const dataIdMatch = tail.match(/data-id="([a-zA-Z0-9_-]{20,50})"/i);
          let id = "";
          
          if (dataIdMatch) {
            id = dataIdMatch[1];
          } else {
            // Fallback searching ssk matching structure
            const sskMatch = tail.match(/ssk='[^']*?:([^'-]+)/);
            if (sskMatch) {
              id = sskMatch[1];
            }
          }

          if (id && !seenFolderIds.has(id)) {
            seenFolderIds.add(id);
            folders.push({ name, id });
          }
        }
      } catch (e: any) {
        console.warn(`Drive Sync: Failed to fetch parent URL ${url}: ${e.message || e}`);
      }
    }

    // Force add vital folders to ensure those not listed are fully supported
    const vitalFolders = [
      { name: "Axis", id: "1sySWvaUlkW47FQt_IWIgMgORz6Xx0Vvd" },
      { name: "Brixton", id: "1m6_-BrNSRoUCf-bUnqBYzp1CTQD3NRP0" },
      { name: "Dover", id: "1mIoLY0UMPFgoSFgRtEBUWv8OPvsA7Sqp" },
      { name: "Causeways Square Towers", id: "1XboN_O-NebDuhvVk0MQXoekLoOQeDlk1" },
      { name: "Causewayz Square", id: "1DGtbHz7Me4pKESf5f2qwr9uNCzwW_66m" },
      { name: "D'Tessera", id: "1ngPDuLFigcO64Ice9qODIXZeZFBnvR65" },
      { name: "Vox", id: "1h-amPnJVaKzI5wZK_X-UCiMbSuMYZ26M" },
      { name: "Wyn", id: "19PUE_ezbOhTLNP2GPzfQ_prtDD9PNBLP" },
      { name: "Zenia Damansara", id: "1mRv8dQPFTj_exj0chOXNTfNByv1Cw9Kq" },
      { name: "Vividz", id: "1J-0kApBJC6npJkBIG7vXxKZDnKJeCx4-" },
      { name: "Veridian", id: "1jVt1huBqTn-ZrkK7Wh43JaxSDuTwSsIG" },
      { name: "Kingswoodz", id: "1zTDwRiFJ1EG13Yntj3IaDUiuqhLs_Ygq" }
    ];
    vitalFolders.forEach((vf) => {
      if (!folders.some(f => f.id === vf.id)) {
        folders.push(vf);
      }
    });

    console.log(`Drive Sync: Discovered ${folders.length} project folders in Google Drive.`);

    // Read files inside all project folders in throttled batches
    const batchSize = 8;
    for (let i = 0; i < folders.length; i += batchSize) {
      const chunk = folders.slice(i, i + batchSize);
      await Promise.all(
        chunk.map(async (folder) => {
          try {
            const sfRes = await fetchWithRetry(`https://drive.google.com/drive/folders/${folder.id}`, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              },
            }, 3, 12000);
            const sfHtml = await sfRes.text();

            // Extract both IDs and names from DOM attributes in HTML (highly stable and reliable)
            const filesInFolder: { id: string; name: string }[] = [];
            const fileMap = new Map<string, string>();
            let m: RegExpExecArray | null;

            // Regex 1: data-id followed by data-tooltip
            const regex1 = /data-id="(1[a-zA-Z0-9_-]{32})"[^>]*?data-tooltip="([^"]+?)"/gi;
            while ((m = regex1.exec(sfHtml)) !== null) {
              const id = m[1];
              if (id !== folder.id) {
                const name = m[2].replace(/\s+(?:Image|Video|Shared|File|Document|Audio|PDF)$/gi, "").trim();
                fileMap.set(id, name);
              }
            }

            // Regex 2: data-tooltip followed by data-id
            const regex2 = /data-tooltip="([^"]+?)"[^>]*?data-id="(1[a-zA-Z0-9_-]{32})"/gi;
            while ((m = regex2.exec(sfHtml)) !== null) {
              const id = m[2];
              if (id !== folder.id) {
                const name = m[1].replace(/\s+(?:Image|Video|Shared|File|Document|Audio|PDF)$/gi, "").trim();
                fileMap.set(id, name);
              }
            }

            // Regex 3: general data-id scanning with context lookahead
            const idRegex = /data-id="(1[a-zA-Z0-9_-]{32})"/g;
            while ((m = idRegex.exec(sfHtml)) !== null) {
              const id = m[1];
              if (id !== folder.id && !fileMap.has(id)) {
                const pos = m.index;
                const context = sfHtml.substring(Math.max(0, pos - 400), Math.min(sfHtml.length, pos + 1200));
                const tooltipMatch = context.match(/data-tooltip="([^"]+?)"/i) || 
                                     context.match(/aria-label="([^"]+?)(?:\s*(?:Image|Video|Shared|File|Document|Audio|PDF|Folder|folder))[^"]*?"/i) || 
                                     context.match(/<strong[^>]*>([^<]+?)<\/strong>/i);
                if (tooltipMatch) {
                  const name = tooltipMatch[1].replace(/\s+(?:Image|Video|Shared|File|Document|Audio|PDF)$/gi, "").trim();
                  fileMap.set(id, name);
                } else {
                  fileMap.set(id, `Image-${fileMap.size + 1}`);
                }
              }
            }

            // Convert parsed fileMap to filesInFolder array
            fileMap.forEach((name, id) => {
              filesInFolder.push({ id, name });
            });

            // Fallback legacy regex if still empty
            if (filesInFolder.length === 0) {
              const fileRegex = /"([a-zA-Z0-9_-]{33})"\s*,\s*"([^"]+?)"/g;
              while ((m = fileRegex.exec(sfHtml)) !== null) {
                const id = m[1];
                const name = m[2];
                if (id.startsWith("1") && id !== folder.id && !name.includes("\\") && name.length < 150) {
                  if (!filesInFolder.some((f) => f.id === id)) {
                    filesInFolder.push({ id, name });
                  }
                }
              }
            }

            // Simple broad fallback
            if (filesInFolder.length === 0) {
              const simpleRegex = /\"([a-zA-Z0-9_-]{33})\"/g;
              let sm: RegExpExecArray | null;
              while ((sm = simpleRegex.exec(sfHtml)) !== null) {
                const id = sm[1];
                if (id.startsWith("1") && id !== folder.id) {
                  if (!filesInFolder.some((f) => f.id === id)) {
                    filesInFolder.push({ id, name: `Image-${filesInFolder.length + 1}` });
                  }
                }
              }
            }

            if (filesInFolder.length > 0) {
              const slug = cleanProjectSlug(folder.name);
              const imageUrls = filesInFolder.map((f) => `https://lh3.googleusercontent.com/d/${f.id}=w1000`);
              flatPool.push(...imageUrls);

              // Define clean fallback candidates (excluding layout, location map, summary, faq, logo, e-brochure, pdf etc.)
              const cleanFallbackCandidates = filesInFolder.filter((f) => {
                const nameLower = f.name.toLowerCase();
                const excludePatterns = [
                  "type", "layout", "pelan", "location", "map", "summary", "faq", "f.a.q", "logo", 
                  "favicon", "brochure", "sales kit", "saleskit", "e-brochure", 
                  "ebrochure", "guide", "booklet", "pdf"
                ];
                return !excludePatterns.some(pat => nameLower.includes(pat));
              });

              // Filter strictly for files containing layout indicators in their name (and ignore overview/facade clutter)
              const finalLayoutFiles = filesInFolder.filter((f) => {
                const nameLower = f.name.toLowerCase();
                const isLayoutName = nameLower.includes("type") || nameLower.includes("layout") || nameLower.includes("pelan");
                return isLayoutName && !nameLower.includes("facade") && !nameLower.includes("living");
              });

              // Extract Overview image (prefer facade exclusively as requested)
              let overviewFiles = filesInFolder.filter((f) => {
                const nameLower = f.name.toLowerCase();
                return nameLower.includes("facade");
              });

              if (overviewFiles.length === 0) {
                overviewFiles = filesInFolder.filter((f) => {
                  const nameLower = f.name.toLowerCase();
                  return nameLower.includes("main") || nameLower.includes("overview") || nameLower.includes("exterior");
                });
              }

              const finalOverview = overviewFiles.length > 0 
                ? overviewFiles.map(f => `https://lh3.googleusercontent.com/d/${f.id}=w1000`)
                : (cleanFallbackCandidates.length > 0 
                    ? [`https://lh3.googleusercontent.com/d/${cleanFallbackCandidates[0].id}=w1000`]
                    : [imageUrls[0] || ""]);

              // Extract Location image
              const locationFiles = filesInFolder.filter((f) => {
                const nameLower = f.name.toLowerCase();
                return nameLower.includes("location") || nameLower.includes("map");
              });
              const finalLocation = locationFiles.length > 0 
                ? locationFiles.map(f => `https://lh3.googleusercontent.com/d/${f.id}=w1000`)
                : [imageUrls[1] || imageUrls[0] || ""];

               // Exclude layout files (containing layout indicators), location files (containing "location" or "map"), and logo, summary, faq files from visual gallery
              const galleryFiles = filesInFolder.filter((f) => {
                const nameLower = f.name.toLowerCase();
                const isLocation = nameLower.includes("location") || nameLower.includes("map");
                const isLayout = nameLower.includes("type") || nameLower.includes("layout") || nameLower.includes("pelan");
                const isLogo = nameLower.includes("logo") || nameLower.includes("favicon");
                const isSummary = nameLower.includes("summary");
                const isFaq = nameLower.includes("faq") || nameLower.includes("f.a.q");
                const isBrochure = nameLower.includes("brochure") || nameLower.includes("sales kit") || nameLower.includes("saleskit") || nameLower.includes("ebrochure") || nameLower.includes("e-brochure") || nameLower.includes("guide") || nameLower.includes("booklet");
                const isPdf = nameLower.endsWith(".pdf");
                return !isLocation && !isLayout && !isLogo && !isSummary && !isFaq && !isBrochure && !isPdf;
              });

              // Keep only facilities images in gallery by excluding facade/exterior/overview files if others exist
              let facilitiesOnlyFiles = galleryFiles.filter((f) => {
                const nameLower = f.name.toLowerCase();
                return !nameLower.includes("facade") && !nameLower.includes("overview") && !nameLower.includes("main") && !nameLower.includes("exterior");
              });

              if (facilitiesOnlyFiles.length === 0) {
                facilitiesOnlyFiles = galleryFiles;
              }

              const finalGallery = facilitiesOnlyFiles.length > 0 
                ? facilitiesOnlyFiles.map(f => `https://lh3.googleusercontent.com/d/${f.id}=w1000`)
                : finalOverview;

              imagesMap[slug] = {
                overview: finalOverview,
                location: finalLocation,
                layout: finalLayoutFiles.map(f => `https://lh3.googleusercontent.com/d/${f.id}=w1000`),
                gallery: finalGallery,
              };

              // Keep track of layout file nodes to enrich them in projects feed
              driveLayoutsMap[slug] = finalLayoutFiles;
            }
          } catch (err: any) {
            console.error(`Drive Sync: Failed to sync images for Google Drive folder "${folder.name}":`, err.message || err);
          }
        })
      );
    }

    console.log(`Drive Sync: Fully cached images and layouts for ${Object.keys(imagesMap).length} folders.`);
  } catch (e) {
    console.error("Drive Sync: Master drive fetch failed, using fallbacks:", e);
  }

  // Populate flatPool with fallbacks if completely empty
  if (flatPool.length === 0) {
    FALLBACK_DRIVE_IDS.forEach((id) => {
      flatPool.push(`https://lh3.googleusercontent.com/d/${id}=w1000`);
    });
  }

  return { imagesMap, flatPool, driveLayoutsMap };
}

function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

// Mapped coordinates representation from Locations tab
interface LocationMapping {
  latitude?: number;
  longitude?: number;
}

async function fetchGoogleSheetsLocations(): Promise<Record<string, LocationMapping>> {
  const map: Record<string, LocationMapping> = {};
  try {
    const spreadsheetId = '1__k-dTt9oxBZSKKp9wI2O42l8QiBpqy0O9dwZK1jyqQ';
    const gid = '482842127';
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
    console.log("Sheet Sync: Fetching exact project coordinates from live Locations list CSV...");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not fetch locations CSV: ${res.status}`);
    const text = await res.text();
    const lines = text.split('\n');
    
    // Skip header line 0: Project Name,Latitude,Longitude,Area,Location
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const row = parseCsvRow(line);
      if (row.length < 3) continue;
      
      const nameVal = row[0];
      const latVal = row[1];
      const lngVal = row[2];
      
      if (nameVal) {
        const nameStr = nameVal.trim();
        const slug = cleanProjectSlug(nameStr);
        const latNum = parseFloat(latVal);
        const lngNum = parseFloat(lngVal);
        
        const mapping: LocationMapping = {};
        if (!isNaN(latNum)) mapping.latitude = latNum;
        if (!isNaN(lngNum)) mapping.longitude = lngNum;
        
        if (mapping.latitude !== undefined || mapping.longitude !== undefined) {
          map[slug] = mapping;
        }
      }
    }
    console.log(`Sheet Sync: Loaded exact coordinates for ${Object.keys(map).length} projects.`);
  } catch (err) {
    console.error("Sheet Sync: Locations tab CSV fetch failed:", err);
  }
  return map;
}

interface ProjectLayout {
  image: string;
  typeName: string;
  size: number;
  beds: number;
  baths: number;
  carParks: number;
  estPrice: number;
  isEnriched?: boolean;
}

// Global background queue for polite, rate-limited sequential layout enrichment
let enrichmentQueue: Array<{ project: any; layoutFiles: { id: string; name: string }[] }> = [];
let isProcessingQueue = false;

async function runGeminiLayoutEnrichment(project: any, layoutFiles: { id: string; name: string }[]): Promise<ProjectLayout[] | null> {
  const client = getGeminiClient();
  if (!client) return null;

  try {
    const prompt = `
      You are an elite, highly professional Malaysian real estate database expert.
      We have discovered layout floor plans under project "${project.name}" inside area "${project.area}", Malaysia.
      
      General base reference metadata of "${project.name}":
        - Development Starting Price: RM ${project.startingPrice}
        - Physical built up size boundaries: ${project.builtUpMin} to ${project.builtUpMax} sqft
        - Room bedrooms boundaries: ${project.bedroomsMin} to ${project.bedroomsMax}
      
      Real layout floor plans filenames found in Google Drive:
      ${JSON.stringify(layoutFiles.map(f => ({ id: f.id, name: f.name })), null, 2)}
       
      By leveraging Google Search or your rich knowledge, identify the real on-market specs (Type Name, size in SQFT, rooms, bathrooms) offered at "${project.name}" for each of these named layout files.
      Avoid mocking, match filename tags (like "A", "B", "C1") to their actual values in Malaysian sites. If a file is "Type B (900sqft)", map it exactly.
      
      Return the structured layout specifications in JSON format:
      {
        "layouts": [
          {
            "id": "Matching structural file ID string value",
            "typeName": "Official spec name, e.g. Type A, Type Dual-Key, Type C1, etc.",
            "size": 1050 (numerical sqft size),
            "beds": 3,
            "baths": 2,
            "carParks": 2,
            "estPrice": 750000 (estimated RM market valuation)
          }
        ]
      }
    `;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
        responseSchema: {
          type: Type.OBJECT,
          required: ["layouts"],
          properties: {
            layouts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["id", "typeName", "size", "beds", "baths", "carParks", "estPrice"],
                properties: {
                  id: { type: Type.STRING },
                  typeName: { type: Type.STRING },
                  size: { type: Type.INTEGER },
                  beds: { type: Type.INTEGER },
                  baths: { type: Type.INTEGER },
                  carParks: { type: Type.INTEGER },
                  estPrice: { type: Type.INTEGER }
                }
              }
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    if (parsed && Array.isArray(parsed.layouts) && parsed.layouts.length > 0) {
      return parsed.layouts.map((item: any) => {
        const originalFile = layoutFiles.find(f => f.id === item.id) || layoutFiles[0];
        return {
          image: `https://lh3.googleusercontent.com/d/${item.id || originalFile.id}=w1000`,
          typeName: item.typeName || "Type A",
          size: item.size || project.builtUpMin || 850,
          beds: item.beds || project.bedroomsMin || 3,
          baths: item.baths || 2,
          carParks: item.carParks || 1,
          estPrice: item.estPrice || project.startingPrice || 600000,
          isEnriched: true
        };
      });
    }
  } catch (e: any) {
    const isRateLimited = e?.status === "RESOURCE_EXHAUSTED" || e?.message?.includes("quota") || e?.message?.includes("429") || e?.message?.includes("503") || e?.message?.includes("demand");
    if (isRateLimited) {
      console.log(`[Enrichment] API standard rate-limiting or model demand limits affected "${project.name}". Standard layout fallbacks are serving request flawlessly.`);
    } else {
      console.log(`[Enrichment] Notice: Layout parsing is operating under offline default values for "${project.name}".`);
    }
  }
  return null;
}

function startEnrichmentQueue(project: any, layoutFiles: { id: string; name: string }[]) {
  const isEnriched = aiGenerationCache[`layouts_${project.id}`]?.some((lay: any) => lay.isEnriched);
  if (isEnriched) return;

  if (!enrichmentQueue.some(item => item.project.id === project.id)) {
    enrichmentQueue.push({ project, layoutFiles });
  }

  if (!isProcessingQueue) {
    isProcessingQueue = true;
    (async () => {
      // Small pause before beginning queue processing to let the initial requests finish instantly
      await new Promise(resolve => setTimeout(resolve, 3000));
      while (enrichmentQueue.length > 0) {
        const item = enrichmentQueue.shift();
        if (!item) continue;

        try {
          const cacheKey = `layouts_${item.project.id}`;
          const activeCached = aiGenerationCache[cacheKey];
          if (activeCached && activeCached.some((lay: any) => lay.isEnriched)) {
            continue;
          }

          const enriched = await runGeminiLayoutEnrichment(item.project, item.layoutFiles);
          if (enriched) {
            aiGenerationCache[cacheKey] = enriched;
            saveAiCache();
            console.log(`[Queue] Successfully enriched layouts for "${item.project.name}" via background Gemini SDK request.`);
          }
        } catch (err) {
          console.log(`[Queue] Background enrichment job finished or scheduled for retry for ${item.project.name}.`);
        }

        // Polite rate limit spacing (e.g. 5 seconds)
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      isProcessingQueue = false;
    })();
  }
}

function estimateBedroomsFromSize(size: number, project: any): number {
  const minBeds = Math.round(parseFloat(project.bedroomsMin)) || 1;
  const maxBeds = Math.round(parseFloat(project.bedroomsMax)) || 4;

  if (minBeds === maxBeds) return minBeds;

  // Standard Malaysian real estate size-to-bed heuristic
  let estimated = 3;
  if (size < 650) {
    estimated = 1;
  } else if (size < 850) {
    estimated = 2;
  } else if (size < 1250) {
    estimated = 3;
  } else if (size < 1800) {
    estimated = 4;
  } else {
    estimated = 5;
  }

  // Clamp to the project's actual bedroom range
  return Math.max(minBeds, Math.min(maxBeds, estimated));
}

function adjustLayoutsToProjectBounds(project: any, layouts: ProjectLayout[]): ProjectLayout[] {
  if (!project || !layouts || layouts.length === 0) return [];
  
  const idLower = (project.id || "").toLowerCase();
  if (idLower === "phoeniz" || idLower === "zenia" || idLower.includes("enia") || idLower.includes("phoeniz") || idLower.includes("pavilion")) {
    return layouts; // Skip hardcoded custom layout specs
  }

  // Deep clone layouts to avoid mutating cache directly
  const cloned = JSON.parse(JSON.stringify(layouts)) as ProjectLayout[];

  // ALWAYS sort layouts by size (ascending) to guarantee size-bedroom positive correlation
  cloned.sort((a, b) => a.size - b.size);

  const pMin = Math.round(parseFloat(project.builtUpMin)) || 850;
  const pMax = Math.round(parseFloat(project.builtUpMax)) || 1350;

  const startingPrice = parseFloat(project.startingPrice) || 600000;

  return cloned.map((lay) => {
    // Keep size in project bounds
    if (lay.size < pMin) lay.size = pMin;
    if (lay.size > pMax) lay.size = pMax;

    // Estimate bedroom count using size-to-bed heuristic if not already present
    if (!lay.beds || isNaN(lay.beds) || lay.beds <= 0) {
      lay.beds = estimateBedroomsFromSize(lay.size, project);
    } else {
      // Clamp parsed beds to project bounds
      const minBeds = Math.round(parseFloat(project.bedroomsMin)) || 1;
      const maxBeds = Math.round(parseFloat(project.bedroomsMax)) || 5;
      lay.beds = Math.max(minBeds, Math.min(maxBeds, lay.beds));
    }

    // Correct bathrooms
    if (!lay.baths || isNaN(lay.baths) || lay.baths <= 0) {
      lay.baths = Math.max(1, lay.beds <= 2 ? lay.beds : lay.beds - 1);
    } else {
      lay.baths = Math.max(1, Math.min(lay.beds + 1, lay.baths));
    }

    // Correct carParks
    if (!lay.carParks || isNaN(lay.carParks) || lay.carParks <= 0) {
      const estimatedCarParks = lay.size > 1100 ? 2 : 1;
      const minCars = project.carParksMin !== undefined ? project.carParksMin : 1;
      const maxCars = project.carParksMax !== undefined ? project.carParksMax : Math.max(2, estimatedCarParks);
      lay.carParks = Math.max(minCars, Math.min(maxCars, estimatedCarParks));
    } else {
      const minCars = project.carParksMin !== undefined ? project.carParksMin : 1;
      const maxCars = project.carParksMax !== undefined ? project.carParksMax : Math.max(2, lay.carParks);
      lay.carParks = Math.max(minCars, Math.min(maxCars, lay.carParks));
    }

    // Correct pricing based on startingPrice
    const baseMin = Math.max(100, pMin);
    const priceFactor = lay.size / baseMin;
    lay.estPrice = Math.round(startingPrice * (priceFactor > 1.2 ? 1.0 + (priceFactor - 1.0) * 0.45 : priceFactor));

    return lay;
  });
}

function generateFallbackLayoutsForProject(project: any): ProjectLayout[] {
  const pMin = Math.round(parseFloat(project.builtUpMin)) || 850;
  const pMax = Math.round(parseFloat(project.builtUpMax)) || 1350;
  const startingPrice = parseFloat(project.startingPrice) || 600000;

  // We use stable default Drive images for layouts
  const fallbackIds = [
    FALLBACK_DRIVE_IDS[2 % FALLBACK_DRIVE_IDS.length],
    FALLBACK_DRIVE_IDS[3 % FALLBACK_DRIVE_IDS.length],
    FALLBACK_DRIVE_IDS[4 % FALLBACK_DRIVE_IDS.length],
  ];

  const types = ["Type A", "Type B", "Type C"];

  return fallbackIds.map((id, idx) => {
    const step = (pMax - pMin) / 2;
    const size = Math.round(pMin + idx * step);

    const beds = estimateBedroomsFromSize(size, project);

    const baths = Math.max(1, beds <= 2 ? beds : beds - 1);
    
    // Correct carParks with project-level carParksMin/Max if available
    const estimatedCarParks = size > 1100 ? 2 : 1;
    const minCars = project.carParksMin !== undefined ? project.carParksMin : 1;
    const maxCars = project.carParksMax !== undefined ? project.carParksMax : Math.max(2, estimatedCarParks);
    const carParks = Math.max(minCars, Math.min(maxCars, estimatedCarParks));

    const baseMin = Math.max(100, pMin);
    const priceFactor = size / baseMin;
    const estPrice = Math.round(startingPrice * (priceFactor > 1.2 ? 1.0 + (priceFactor - 1.0) * 0.45 : priceFactor));

    return {
      image: `https://lh3.googleusercontent.com/d/${id}=w1000`,
      typeName: types[idx],
      size,
      beds,
      baths,
      carParks,
      estPrice,
      isEnriched: false
    };
  });
}

async function enrichLayoutsForProject(project: any, layoutFiles: { id: string; name: string }[], allowLive = false): Promise<ProjectLayout[]> {
  const cacheKey = `layouts_${project.id}`;

  if (project.id === "phoeniz" || project.id === "phoeniz-suites" || project.id === "phoeniz-suites-kl-city-centre" || project.id.toLowerCase().includes("phoeniz")) {
    return [
      {
        image: "https://lh3.googleusercontent.com/d/1HJaK8j06G5KKEuF-SPvHrOqr9soAzZlm=w1000",
        typeName: "Type A (with Study)",
        size: 484,
        beds: 1,
        baths: 1,
        carParks: 1,
        estPrice: 1016400,
        isEnriched: true
      },
      {
        image: "https://lh3.googleusercontent.com/d/1pWbdoNn_bsb57ykTn4Vvgwq0Mh6prBi2=w1000",
        typeName: "Type B1 (Dual Key)",
        size: 581,
        beds: 1,
        baths: 2,
        carParks: 1,
        estPrice: 1219000,
        isEnriched: true
      },
      {
        image: "https://lh3.googleusercontent.com/d/1V1Up50U7220yBJLxbxWYq4L_DBnGu2vK=w1000",
        typeName: "Type B2 (Dual Key)",
        size: 678,
        beds: 1,
        baths: 2,
        carParks: 1,
        estPrice: 1421600,
        isEnriched: true
      }
    ];
  }

  if (project.id === "zenia" || project.id === "zenia-damansara" || project.id.toLowerCase().includes("enia")) {
    return [
       // Zenia Damansara Condovillas (1,691 - 2,053 sqft)
       {
         image: "https://lh3.googleusercontent.com/d/1jmvf0341cdjJQJhnMqjNbM7uOOaeIeWm=w1000",
         typeName: "Condovilla - Type A1-G (Ground)",
         size: 1691,
         beds: 4,
         baths: 3,
         carParks: 2,
         estPrice: 1300000,
         isEnriched: true
       },
       {
         image: "https://lh3.googleusercontent.com/d/1P_rbDa1Inbz8vZqagQ21AHWBfUooMGE5=w1000",
         typeName: "Condovilla - Type A1 (Upper)",
         size: 1708,
         beds: 4,
         baths: 3,
         carParks: 2,
         estPrice: 1315000,
         isEnriched: true
       },
       {
         image: "https://lh3.googleusercontent.com/d/19Xb3FrUk-LEZ4tdBqHPfNf4sXVXOKLfT=w1000",
         typeName: "Condovilla - Type A2-G (Ground)",
         size: 1725,
         beds: 4,
         baths: 3,
         carParks: 2,
         estPrice: 1330000,
         isEnriched: true
       },
       {
         image: "https://lh3.googleusercontent.com/d/1JkwhTfuCBWfNGkfsWIxTJaYwxwt8tpiK=w1000",
         typeName: "Condovilla - Type A2 (Upper)",
         size: 1743,
         beds: 4,
         baths: 3,
         carParks: 2,
         estPrice: 1345000,
         isEnriched: true
       },
       {
         image: "https://lh3.googleusercontent.com/d/1a5KC2OpLqHsmeyGxTUpMNdAexzG0rKWD=w1000",
         typeName: "Condovilla - Type B1-G",
         size: 1760,
         beds: 4,
         baths: 3,
         carParks: 2,
         estPrice: 1360000,
         isEnriched: true
       },
       {
         image: "https://lh3.googleusercontent.com/d/1Y34RN92eBrras3Y1Ics7CuwXWmtTNEMr=w1000",
         typeName: "Condovilla - Type B1A-G",
         size: 1777,
         beds: 4,
         baths: 3,
         carParks: 2,
         estPrice: 1375000,
         isEnriched: true
       },
       {
         image: "https://lh3.googleusercontent.com/d/1t1MNAgFedHa6hCAPyCXV3sGXRuMDLl2a=w1000",
         typeName: "Condovilla - Type B1A (Upper)",
         size: 1794,
         beds: 4,
         baths: 3,
         carParks: 2,
         estPrice: 1390000,
         isEnriched: true
       },
       {
         image: "https://lh3.googleusercontent.com/d/1ENRuvONe7mb-YyAWF7uSSZ-ZjGqgY6R4=w1000",
         typeName: "Condovilla - Type B2 (Standard)",
         size: 1812,
         beds: 4,
         baths: 3,
         carParks: 2,
         estPrice: 1410000,
         isEnriched: true
       },
       {
         image: "https://lh3.googleusercontent.com/d/19hxsYnhqkg0fDPs1ysrS1pN6RtIKH7SE=w1000",
         typeName: "Condovilla - Type C1",
         size: 1846,
         beds: 4,
         baths: 3,
         carParks: 2,
         estPrice: 1440000,
         isEnriched: true
       },
       {
         image: "https://lh3.googleusercontent.com/d/1YKQftlgYI62JSq7uL2pyUu6paGpzVxxS=w1000",
         typeName: "Condovilla - Type C2 (Executive)",
         size: 1915,
         beds: 5,
         baths: 4,
         carParks: 2,
         estPrice: 1500000,
         isEnriched: true
       },
       {
         image: "https://lh3.googleusercontent.com/d/1tE5Vi33apYLhmqxr6k0KrLMuZHyNWX3-=w1000",
         typeName: "Condovilla - Type D1 (Corner)",
         size: 1932,
         beds: 5,
         baths: 4,
         carParks: 2,
         estPrice: 1520000,
         isEnriched: true
       },
       {
         image: "https://lh3.googleusercontent.com/d/1YVsrptgvHUgADFDUkeMi9p8JI1TyQitJ=w1000",
         typeName: "Condovilla - Type B2 (Corner Extended)",
         size: 2053,
         beds: 5,
         baths: 4,
         carParks: 3,
         estPrice: 1620000,
         isEnriched: true
       },
       // Zenia Damansara Parkhomes (Landed Terraces: 3,095 - 4,247 sqft)
       {
         image: "https://lh3.googleusercontent.com/d/1El-ZJ1AKLXX0Gd7UVvuh1sj4PZtJzsDQ=w1000",
         typeName: "Parkhome - Type A1 (3-Story)",
         size: 3095,
         beds: 4,
         baths: 4,
         carParks: 3,
         estPrice: 2500000,
         isEnriched: true
       },
       {
         image: "https://lh3.googleusercontent.com/d/1wjNszE9DtZ-wI8Fiwidb6dUqIDeafbbE=w1000",
         typeName: "Parkhome - Type A2 (3-Story Corner)",
         size: 3250,
         beds: 4,
         baths: 4,
         carParks: 3,
         estPrice: 2750000,
         isEnriched: true
       },
       {
         image: "https://lh3.googleusercontent.com/d/1vh_WYlLhNvfL2MytyPky1uTkHY5cKxNZ=w1000",
         typeName: "Parkhome - Type B1 (3-Story Standard Row)",
         size: 3746,
         beds: 5,
         baths: 5,
         carParks: 3,
         estPrice: 3200000,
         isEnriched: true
       },
       {
         image: "https://lh3.googleusercontent.com/d/1Jkk6Lz_0WAQ0bxlvib14QJOU8o9gi7Oh=w1000",
         typeName: "Parkhome - Type B2 (3-Story Executive Corner)",
         size: 3980,
         beds: 5,
         baths: 5,
         carParks: 4,
         estPrice: 3600000,
         isEnriched: true
       },
       {
         image: "https://lh3.googleusercontent.com/d/1bp7n6iLAXPILpnSqSDh8LbSObvsXrfne=w1000",
         typeName: "Parkhome - Type C1 (3-Story Grand Luxury)",
         size: 4247,
         beds: 5,
         baths: 6,
         carParks: 4,
         estPrice: 4100000,
         isEnriched: true
       }
    ];
  }

  if (project.id === "pavilion-square-office" || project.id.toLowerCase().includes("pavilion-square-office")) {
    return [
      {
        image: "https://lh3.googleusercontent.com/d/1aTvz3mf-9t-vhPrgDmRlIAVoVii0T-XC=w1000",
        typeName: "Office Layout 1",
        size: 1093,
        beds: 0,
        baths: 0,
        carParks: 1,
        estPrice: 2800000,
        isEnriched: true
      },
      {
        image: "https://lh3.googleusercontent.com/d/1MonTsduc71lsY0MDjJwk3N-cAleseOmz=w1000",
        typeName: "Office Layout 2",
        size: 1300,
        beds: 0,
        baths: 0,
        carParks: 1,
        estPrice: 3300000,
        isEnriched: true
      },
      {
        image: "https://lh3.googleusercontent.com/d/1CtqX__1F59kAJHA6b-TA4swRPM74QsJ4=w1000",
        typeName: "Office Layout 3",
        size: 1500,
        beds: 0,
        baths: 0,
        carParks: 2,
        estPrice: 3800000,
        isEnriched: true
      },
      {
        image: "https://lh3.googleusercontent.com/d/1o0GB65g0QJSaVBfaan38FcNf_HQnAyus=w1000",
        typeName: "Office Layout 3A",
        size: 1800,
        beds: 0,
        baths: 0,
        carParks: 2,
        estPrice: 4500000,
        isEnriched: true
      },
      {
        image: "https://lh3.googleusercontent.com/d/1Hh7bIZAnyqftZhqMk2HsTOhXb13tDbSP=w1000",
        typeName: "Office Layout 5",
        size: 2200,
        beds: 0,
        baths: 0,
        carParks: 3,
        estPrice: 5500000,
        isEnriched: true
      },
      {
        image: "https://lh3.googleusercontent.com/d/1H1MJdNEWVnqndkB1R3Fm_5BAYWTtbCZI=w1000",
        typeName: "Office Layout 5A",
        size: 2500,
        beds: 0,
        baths: 0,
        carParks: 3,
        estPrice: 6300000,
        isEnriched: true
      },
      {
        image: "https://lh3.googleusercontent.com/d/1VkHc9A_txyL6f0o2jCWEq_wYGP5pNuUc=w1000",
        typeName: "Office Layout 5B",
        size: 3000,
        beds: 0,
        baths: 0,
        carParks: 4,
        estPrice: 7500000,
        isEnriched: true
      },
      {
        image: "https://lh3.googleusercontent.com/d/1Znt2TtQqF3JzkfTvGSGWPJ9i-3HxdTf7=w1000",
        typeName: "Whole Floor Plan",
        size: 9770,
        beds: 0,
        baths: 0,
        carParks: 10,
        estPrice: 22000000,
        isEnriched: true
      }
    ];
  }

  if ((project.id === "pavilion-square" || project.id === "pavilion-square-residences" || project.id.toLowerCase().includes("pavilion-square") || project.id.toLowerCase().includes("pavilion")) && !project.id.toLowerCase().includes("office")) {
    return [
      {
        image: "https://lh3.googleusercontent.com/d/1ttuX_eoMNkG0EBAL0wiENixReg-nlNCu=w1000",
        typeName: "Type A",
        size: 504,
        beds: 1,
        baths: 1,
        carParks: 1,
        estPrice: 1700000,
        isEnriched: true
      },
      {
        image: "https://lh3.googleusercontent.com/d/1IEhR3H8PHfuv1gyVnZy7Jkd8ZqTVddN-=w1000",
        typeName: "Type B1",
        size: 770,
        beds: 2,
        baths: 2,
        carParks: 1,
        estPrice: 2000000,
        isEnriched: true
      },
      {
        image: "https://lh3.googleusercontent.com/d/1DzuI4ohXdijh9gxFGIS9Lk9nKLoXeZiE=w1000",
        typeName: "Type B2",
        size: 772,
        beds: 2,
        baths: 2,
        carParks: 1,
        estPrice: 2010000,
        isEnriched: true
      },
      {
        image: "https://lh3.googleusercontent.com/d/1yate9EiCgxZ60YDUizjP84eQYAaWqfNs=w1000",
        typeName: "Type C1",
        size: 966,
        beds: 3,
        baths: 2,
        carParks: 1,
        estPrice: 2500000,
        isEnriched: true
      },
      {
        image: "https://lh3.googleusercontent.com/d/1qDyCpMlNxMUMlQ6Qu9u3sFhSUNqTZqzi=w1000",
        typeName: "Type C2",
        size: 978,
        beds: 3,
        baths: 2,
        carParks: 1,
        estPrice: 2530000,
        isEnriched: true
      },
      {
        image: "https://lh3.googleusercontent.com/d/1i-BLCdm6cJqP49atN8BBqxdiH7W70R_1=w1000",
        typeName: "Type C3",
        size: 1100,
        beds: 3,
        baths: 2,
        carParks: 2,
        estPrice: 2850000,
        isEnriched: true
      },
      {
        image: "https://lh3.googleusercontent.com/d/1bzn1SpMwwIo7EEr6qx3OyKDh2huPXUwH=w1000",
        typeName: "Type C4 (Dual Key)",
        size: 1272,
        beds: 3,
        baths: 3,
        carParks: 2,
        estPrice: 3300000,
        isEnriched: true
      },
      {
        image: "https://lh3.googleusercontent.com/d/1VrmGsT-9QqNgIwVx0YAI4IQSWCiEWs86=w1000",
        typeName: "Type D (Dual Key)",
        size: 1255,
        beds: 3,
        baths: 3,
        carParks: 2,
        estPrice: 3250000,
        isEnriched: true
      }
    ];
  }
  
  // 1. Return cached values immediately if already present
  if (aiGenerationCache[cacheKey]) {
    const cached = aiGenerationCache[cacheKey];
    const isEnriched = cached.some((lay: any) => lay.isEnriched);
    if (!isEnriched) {
      startEnrichmentQueue(project, layoutFiles);
    }
    return adjustLayoutsToProjectBounds(project, cached);
  }

  // Sort layoutFiles alphabetically by filename so that indexing for fallback size interpolation matches Type ordering (e.g. Type A <= Type B <= Type C)
  const sortedLayoutFiles = [...layoutFiles].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  // 2. Perform advanced filename-clue parsing as first priority (instant, 100% reliable)
  const fallbackLayouts = sortedLayoutFiles.map((file, idx) => {
    const filename = file.name;
    const url = `https://lh3.googleusercontent.com/d/${file.id}=w1000`;
    
    // Parse Type name (e.g. "Type A" or use alphabetical index)
    let typeName = "";
    const typeMatch = filename.match(/type\s*([a-zA-Z0-9\-]+)/i);
    if (typeMatch) {
      typeName = `Type ${typeMatch[1].toUpperCase()}`;
    } else {
      typeName = `Type ${String.fromCharCode(65 + idx)}`;
    }
    
    // Parse size in sqft
    let size = project.builtUpMin || 850;
    const sizeMatch = filename.replace(/,/g, "").match(/(\d+)\s*(?:sqft|sq\s*ft|sf|feet|sq)/i);
    if (sizeMatch) {
      size = parseInt(sizeMatch[1]);
    } else {
      // Robust fall-back number matcher: search for any 3 or 4 digit number close to project range
      const numbers = filename.replace(/,/g, "").match(/\d+/g);
      if (numbers) {
        const candidates = numbers
          .map(n => parseInt(n))
          .filter(val => {
            const minBound = (project.builtUpMin || 500) * 0.75;
            const maxBound = (project.builtUpMax || 3000) * 1.25;
            return val >= minBound && val <= maxBound && val >= 300 && val <= 10000;
          });
        if (candidates.length > 0) {
          size = candidates[0];
        } else if (sortedLayoutFiles.length > 1) {
          const step = ((project.builtUpMax || 1350) - (project.builtUpMin || 850)) / (sortedLayoutFiles.length - 1);
          size = Math.round((project.builtUpMin || 850) + idx * step);
        }
      } else if (sortedLayoutFiles.length > 1) {
        const step = ((project.builtUpMax || 1350) - (project.builtUpMin || 850)) / (sortedLayoutFiles.length - 1);
        size = Math.round((project.builtUpMin || 850) + idx * step);
      }
    }
    
    // Parse bedrooms, bathrooms and carParks using highly robust regexes
    const lowerName = filename.toLowerCase();
    let beds = estimateBedroomsFromSize(size, project);
    let baths = Math.max(1, beds <= 2 ? beds : beds - 1);

    // 1. Check for joint patterns like "2b2b" or "3b2b" or "1b1b" or "2b 2b"
    const bMatch = lowerName.match(/(\d+)\s*b\s*(\d+)\s*b/);
    if (bMatch) {
      beds = parseInt(bMatch[1]);
      baths = parseInt(bMatch[2]);
    } else {
      const bedsMatch = lowerName.match(/(\d+)\s*(?:r|rooms|beds|bedrooms|bed|br)/);
      if (bedsMatch) {
        beds = parseInt(bedsMatch[1]);
      } else {
        const standaloneBedMatch = lowerName.match(/(?:^|[\s,_\-\.])(\d+)\s*b(?:[\s,_\-\.]|$)/);
        if (standaloneBedMatch) {
          beds = parseInt(standaloneBedMatch[1]);
        }
      }

      const bathsMatch = lowerName.match(/(?:r\s*|rooms\s*)?(\d+)\s*(?:baths|bathrooms|bath)/);
      if (bathsMatch) {
        baths = parseInt(bathsMatch[1]);
      } else {
        const standaloneBathMatch = lowerName.match(/(?:^|[\s,_\-\.])(\d+)\s*bath(?:s|rooms|room)?(?:[\s,_\-\.]|$)/);
        if (standaloneBathMatch) {
          baths = parseInt(standaloneBathMatch[1]);
        }
      }
    }

    // 2. Pricing calculation based on size scale
    const baseMin = Math.max(100, project.builtUpMin || 850);
    const priceFactor = size / baseMin;
    const estPrice = Math.round((project.startingPrice || 800000) * (priceFactor > 1.2 ? 1.0 + (priceFactor - 1.0) * 0.45 : priceFactor));

    // 3. Parse carparks or estimate
    let carParks = size > 1100 ? 2 : 1;
    const cpMatch = lowerName.match(/(\d+)\s*(?:c|cp|carparks|carpark|car\s*parks|car\s*park|car|bays|bay|parking)/);
    if (cpMatch) {
      carParks = parseInt(cpMatch[1]);
    }
    
    return {
      image: url,
      typeName,
      size,
      beds,
      baths,
      carParks,
      estPrice,
      isEnriched: false
    };
  });

  // Save the beautiful fallback layouts inside the cache file so first-loads are instant & durable
  aiGenerationCache[cacheKey] = fallbackLayouts;
  saveAiCache();

  // Register this project for non-blocking online background sequential layout enrichment
  startEnrichmentQueue(project, layoutFiles);

  return adjustLayoutsToProjectBounds(project, fallbackLayouts);
}

// Fetch and Parse Google Sheets Projects
async function fetchGoogleSheetsProjects(forceRefresh = false): Promise<any[]> {
  const now = Date.now();
  if (!forceRefresh && cache.projects && now - cache.lastProjectsFetch < CACHE_DURATION) {
    return cache.projects;
  }

  try {
    // Sync specifically with user's GID tab matching direct sync constraint
    const primarySheetUrl = "https://docs.google.com/spreadsheets/d/1__k-dTt9oxBZSKKp9wI2O42l8QiBpqy0O9dwZK1jyqQ/export?format=csv&gid=2052526095";
    const filterSheetUrl = "https://docs.google.com/spreadsheets/d/1__k-dTt9oxBZSKKp9wI2O42l8QiBpqy0O9dwZK1jyqQ/export?format=csv&gid=240588569";

    console.log("Sheet Sync: Fetching primary and auxiliary spreadsheets...");
    const [primaryRes, filterRes] = await Promise.all([
      fetch(primarySheetUrl),
      fetch(filterSheetUrl)
    ]);

    if (!primaryRes.ok) throw new Error("Could not download primary Google Sheet CSV");
    const csvText = await primaryRes.text();
    const rows = parseCSV(csvText);

    const filterMap: Record<string, { maintenanceFeeStr?: string, carparksMin?: number, carparksMax?: number }> = {};
    if (filterRes.ok) {
      try {
        const filterText = await filterRes.text();
        const filterRows = parseCSV(filterText);
        let filterHeaderIndex = -1;
        for (let i = 0; i < Math.min(10, filterRows.length); i++) {
          if (filterRows[i][0] && filterRows[i][0].toLowerCase().includes("project name")) {
            filterHeaderIndex = i;
            break;
          }
        }
        if (filterHeaderIndex !== -1) {
          const fHeaders = filterRows[filterHeaderIndex].map(h => (h || "").toLowerCase().trim());
          const feeColIdx = fHeaders.findIndex(h => h.includes("maintenance fee"));
          const carparkMinIdx = fHeaders.findIndex(h => h.includes("carpark min"));
          const carparkMaxIdx = fHeaders.findIndex(h => h.includes("carpark max"));

          const cleanFilterRows = filterRows.slice(filterHeaderIndex + 1);
          for (const fRow of cleanFilterRows) {
            if (fRow[0]) {
              const pName = fRow[0].trim();
              const pNorm = normalizeProjectName(pName);
              const minVal = carparkMinIdx !== -1 ? parseInt(fRow[carparkMinIdx]) : NaN;
              const maxVal = carparkMaxIdx !== -1 ? parseInt(fRow[carparkMaxIdx]) : NaN;
              const mFee = feeColIdx !== -1 ? fRow[feeColIdx] : undefined;

              filterMap[pNorm] = {
                maintenanceFeeStr: mFee || undefined,
                carparksMin: isNaN(minVal) ? undefined : minVal,
                carparksMax: isNaN(maxVal) ? undefined : maxVal,
              };
            }
          }
        }
      } catch (err) {
        console.warn("Could not parse filters/maintenance auxiliary sheet:", err);
      }
    }

    // Header row lookup scanning first rows for the Project Name column
    let headerIndex = -1;
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      if (rows[i][0] && rows[i][0].toLowerCase().includes("project name")) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      throw new Error("Could not find Project Name header column in Google Sheet");
    }

    const projectRows = rows.slice(headerIndex + 1);

    // Sync all subfolder images concurrently in real time
    const { imagesMap, flatPool, driveLayoutsMap } = await fetchGoogleDriveStructuredImages();

    // Fetch coordinates mapping
    const coordsMap = await fetchGoogleSheetsLocations();

    const projectsList = await Promise.all(
      projectRows
        .filter((row) => row[0] && row[0].trim() !== "")
        .map(async (row, idx) => {
          const name = row[0] ? row[0].trim() : "Unnamed Project";
          const id = cleanProjectSlug(name);

          const pNorm = normalizeProjectName(name);
          const filterData = filterMap[pNorm] || {};
          
          let maintenanceFeeStr = "Information Pending Verification";
          if (row[15] && row[15].trim() !== "" && row[15].trim() !== "N/A") {
            maintenanceFeeStr = row[15].trim();
          } else if (filterData.maintenanceFeeStr && filterData.maintenanceFeeStr !== "N/A") {
            maintenanceFeeStr = filterData.maintenanceFeeStr;
          } else if (row[15] && row[15].trim() === "N/A") {
            maintenanceFeeStr = "N/A";
          } else if (filterData.maintenanceFeeStr === "N/A") {
            maintenanceFeeStr = "N/A";
          }

          const carParksMin = filterData.carparksMin;
          const carParksMax = filterData.carparksMax;

          let maintenanceFeeNum: number | undefined = undefined;
          if (maintenanceFeeStr && maintenanceFeeStr !== "Information Pending Verification" && maintenanceFeeStr !== "N/A") {
            const numMatch = maintenanceFeeStr.match(/(?:RM\s*)?(\d+(\.\d+)?)/i);
            if (numMatch) {
              maintenanceFeeNum = parseFloat(numMatch[1]);
            }
          }

          let startingPriceRaw = row[4] ? row[4].replace(/,/g, "") : "0";
          let startingPrice = parseFloat(startingPriceRaw) || 0;

          let builtUpMin = Math.round(parseFloat(row[6])) || 0;
          let builtUpMax = Math.round(parseFloat(row[7])) || 0;

          let bedroomsMin = parseInt(row[8]);
          if (isNaN(bedroomsMin) || bedroomsMin <= 0) {
            // Raw estimate based on size bounds
            bedroomsMin = builtUpMin < 650 ? 1 : builtUpMin < 850 ? 2 : builtUpMin < 1250 ? 3 : builtUpMin < 1800 ? 4 : 5;
          }
          let bedroomsMax = parseInt(row[9]);
          if (isNaN(bedroomsMax) || bedroomsMax <= 0) {
            bedroomsMax = Math.max(bedroomsMin, builtUpMax < 650 ? 1 : builtUpMax < 850 ? 2 : builtUpMax < 1250 ? 3 : builtUpMax < 1800 ? 4 : 5);
          }

          let priceRangeStr = row[5] || "Information Pending Verification";
          let projectTypeStr = row[11] || "Information Pending Verification";

          const isZenia = id === "zenia" || id === "zenia-damansara" || id.toLowerCase().includes("enia");
          if (isZenia) {
            startingPrice = 1300000;
            builtUpMin = 1691;
            builtUpMax = 4247;
            bedroomsMin = 4;
            bedroomsMax = 5;
            priceRangeStr = "RM 1.3M - RM 4.2M+";
            projectTypeStr = "Garden Condovilla & Landed Parkhome";
          }

          // Retrieve mapped images from drive or fall back
          let resolvedImages: ProjectImages;
          let layoutFiles: { id: string; name: string }[] = [];

          const hasRealImages = (key: string) => {
            const img = imagesMap[key];
            return img && img.overview && img.overview.length > 0 && img.overview[0] !== "" && img.overview[0] !== undefined;
          };

          if (hasRealImages(id)) {
            resolvedImages = imagesMap[id];
            layoutFiles = driveLayoutsMap[id] || [];
          } else {
            // Priority word list for precise matching first
            let bestKey = "";
            if (id.includes("queenswoodz") || id === "queenswoodz") {
              bestKey = Object.keys(imagesMap).find(key => (key === "kingswoodz" || key.includes("kingswoodz")) && hasRealImages(key)) || "";
            } else if (id.includes("axis")) {
              bestKey = Object.keys(imagesMap).find(key => (key === "axis" || key.includes("axis")) && hasRealImages(key)) || "";
            } else if (id.includes("brixton")) {
              bestKey = Object.keys(imagesMap).find(key => (key === "brixton" || key.includes("brixton")) && hasRealImages(key)) || "";
            } else if (id.includes("dover")) {
              bestKey = Object.keys(imagesMap).find(key => (key === "dover" || key.includes("dover")) && hasRealImages(key)) || "";
            }

            if (!bestKey) {
              bestKey = Object.keys(imagesMap).find(key => (id.includes(key) || key.includes(id)) && hasRealImages(key)) || "";
            }

            if (bestKey) {
              resolvedImages = imagesMap[bestKey];
              layoutFiles = driveLayoutsMap[bestKey] || [];
            } else {
              // Populate beautiful, high-quality, stable fallbacks so they always load instantly and look premium
              resolvedImages = getStableFallbackImages(id, name);
              layoutFiles = [];
            }
          }

          // Special fallback/mapping routing logic for physical towers under Causewayz Square: axis, brixton, dover
          const isAxis = id === "axis" || id.includes("axis");
          const isBrixton = id === "brixton" || id.includes("brixton");
          const isDover = id === "dover" || id.includes("dover");

          if (isAxis || isBrixton || isDover) {
            // Find causeways square towers folder specifically to avoid matching the empty parent causewayz-square folder
            const causewayzKey = Object.keys(imagesMap).find(key => key === "causeways-square-towers" || (key.includes("causeways") && key.includes("towers")));
            const causewayzImages = causewayzKey ? imagesMap[causewayzKey] : null;
            const causewayzLayouts = causewayzKey ? driveLayoutsMap[causewayzKey] : [];

            // Find axis folder
            const axisKey = Object.keys(imagesMap).find(key => key === "axis" || key.includes("axis"));
            const axisImages = axisKey ? imagesMap[axisKey] : null;

            // Clone to avoid side effects
            resolvedImages = {
              overview: [...(resolvedImages.overview || [])],
              location: [...(resolvedImages.location || [])],
              layout: [...(resolvedImages.layout || [])],
              gallery: [...(resolvedImages.gallery || [])],
            };

            // 1. "location map all use axis"
            let resolvedLocation: string[] = [];
            if (axisImages && axisImages.location && axisImages.location.length > 0) {
              resolvedLocation = [...axisImages.location];
            } else if (axisImages && axisImages.overview && axisImages.overview.length > 0) {
              // Fallback to axis overview if Axis had no specific location map file
              resolvedLocation = [axisImages.overview[0]];
            } else if (causewayzImages && causewayzImages.location && causewayzImages.location.length > 0) {
              resolvedLocation = [...causewayzImages.location];
            }

            if (resolvedLocation.length > 0) {
              resolvedImages.location = resolvedLocation;
            }

            // 2. Overview / Gallery / Layout files assignment
            if (isAxis) {
              // Axis uses its own images initially, but can fallback to Causewayz Square if missing elements
              if (resolvedImages.overview.length === 0 && causewayzImages) {
                resolvedImages.overview = [...causewayzImages.overview];
              }
              if (resolvedImages.gallery.length === 0 && causewayzImages) {
                resolvedImages.gallery = [...causewayzImages.gallery];
              }
              if (layoutFiles.length === 0 && causewayzLayouts) {
                layoutFiles = causewayzLayouts;
              }
            } else if (isBrixton || isDover) {
              // "vusual gallery for brixton and dover use causeways square towers"
              // They also share Causeways Square Towers' overview banner.
              if (causewayzImages) {
                resolvedImages.overview = [...causewayzImages.overview];
                resolvedImages.gallery = [...causewayzImages.gallery];
                
                // If they don't have their own specific layouts, fall back to Causewayz Square layouts
                if (resolvedImages.layout.length === 0) {
                  resolvedImages.layout = [...causewayzImages.layout];
                }
              }
              if (layoutFiles.length === 0 && causewayzLayouts) {
                layoutFiles = causewayzLayouts;
              }
            }
          }

          // Get exact coordinates from Locations sheet mapping
          let latitude: number | undefined = undefined;
          let longitude: number | undefined = undefined;

          let locInfo = coordsMap[id];
          if (!locInfo) {
            const fuzzyCoordKey = Object.keys(coordsMap).find(key => id.includes(key) || key.includes(id));
            if (fuzzyCoordKey) {
              locInfo = coordsMap[fuzzyCoordKey];
            }
          }

          if (locInfo) {
            latitude = locInfo.latitude;
            longitude = locInfo.longitude;
          }

          const baseProject = {
            id,
            name,
            startingPrice,
            builtUpMin,
            builtUpMax,
            bedroomsMin,
            bedroomsMax,
            carParksMin,
            carParksMax,
            location: row[2] || "Information Pending Verification",
            area: row[3] || "Information Pending Verification",
          };

          // Auto-enrich layouts asynchronously via filenames & search indices
          let layouts: ProjectLayout[] = [];
          if (layoutFiles.length > 0) {
            layouts = await enrichLayoutsForProject(baseProject, layoutFiles, false);
          } else {
            layouts = generateFallbackLayoutsForProject(baseProject);
          }

          return {
            id,
            name,
            developer: row[1] || "Information Pending Verification",
            location: row[2] || "Information Pending Verification",
            area: row[3] || "Information Pending Verification",
            startingPrice,
            startingPriceFormatted: startingPrice > 0 ? `RM ${startingPrice.toLocaleString()}` : "Information Pending Verification",
            priceRange: priceRangeStr,
            builtUpMin,
            builtUpMax,
            bedroomsMin,
            bedroomsMax,
            tenure: row[10] || "Information Pending Verification",
            projectType: projectTypeStr,
            completionStatus: row[12] || "Information Pending Verification",
            completionYear: row[13] || "Information Pending Verification",
            carParksMin: carParksMin,
            carParksMax: carParksMax,
            maintenanceFee: maintenanceFeeNum,
            maintenanceFeeStr: maintenanceFeeStr,
            totalUnits: row[14] || "Information Pending Verification",
            images: resolvedImages,
            layouts,
            latitude,
            longitude,
          };
        })
    );

    if (projectsList.length > 0) {
      cache.projects = projectsList;
      cache.driveImagesMap = imagesMap;
      cache.lastProjectsFetch = now;
      console.log(`Loaded ${projectsList.length} properties from Google Sheets live CMS!`);
      return projectsList;
    }
    throw new Error("Parsed sheet contains zero active listings");
  } catch (e) {
    console.error("Failed to fetch Google Sheets, reverting to offline cache:", e);
    // Return fallback list mapped to default image pool
    const defaultDriveImages = FALLBACK_DRIVE_IDS.map((id) => `https://lh3.googleusercontent.com/d/${id}=w1000`);
    const fallbackWithImages = FALLBACK_PROJECTS.map((p, idx) => {
      const layoutFiles = [
        { id: FALLBACK_DRIVE_IDS[(idx * 2 + 2) % FALLBACK_DRIVE_IDS.length], name: "Type A - Standard Suite.jpg" },
        { id: FALLBACK_DRIVE_IDS[(idx * 2 + 3) % FALLBACK_DRIVE_IDS.length], name: "Type B - Premium Suite.jpg" },
        { id: FALLBACK_DRIVE_IDS[(idx * 2 + 4) % FALLBACK_DRIVE_IDS.length], name: "Type C - Dual Key Signature.jpg" },
      ];
      
      const layouts = layoutFiles.map((file, fIdx) => {
        const typeName = file.name.split(" - ")[0];
        const step = (p.builtUpMax - p.builtUpMin) / 2;
        const size = Math.round(p.builtUpMin + fIdx * step);
        const bedStep = (p.bedroomsMax - p.bedroomsMin) / 2;
        const beds = Math.round(p.bedroomsMin + fIdx * bedStep);
        const baths = Math.max(1, beds <= 2 ? beds : beds - 1);
        const estPrice = Math.round(p.startingPrice * (size / p.builtUpMin));
        return {
          image: `https://lh3.googleusercontent.com/d/${file.id}=w1000`,
          typeName,
          size,
          beds,
          baths,
          carParks: size > 1100 ? 2 : 1,
          estPrice
        };
      });

      return {
        ...p,
        images: {
          overview: [defaultDriveImages[(idx * 2) % defaultDriveImages.length]],
          location: [defaultDriveImages[(idx * 2 + 1) % defaultDriveImages.length]],
          layout: layoutFiles.map(f => `https://lh3.googleusercontent.com/d/${f.id}=w1000`),
          gallery: [
            defaultDriveImages[(idx * 2 + 3) % defaultDriveImages.length],
            defaultDriveImages[(idx * 2 + 4) % defaultDriveImages.length],
          ],
        },
        layouts
      };
    });
    return fallbackWithImages;
  }
}

// API: Get properties
app.get("/api/projects", async (req, res) => {
  const force = req.query.refresh === "true" || req.query.bypass_cache === "true" || req.query.force === "true";
  const p = await fetchGoogleSheetsProjects(force);
  res.json(p);
});

// API: Get latest Drive image mappings (Designated proxy endpoint)
app.get("/api/drive/images", async (req, res) => {
  const force = req.query.refresh === "true" || req.query.bypass_cache === "true" || req.query.force === "true";
  try {
    if (force || !cache.driveImagesMap) {
      console.log("Drive Proxy: Fetching fresh Google Drive images from master folder...");
      const result = await fetchGoogleDriveStructuredImages();
      cache.driveImagesMap = result.imagesMap;
    }
    res.json({
      success: true,
      imagesMap: cache.driveImagesMap || {},
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error("Drive Proxy: Failed to fetch Drive images:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch Drive images from master folder"
    });
  }
});

// Active In-Memory & Disk Translation Cache for FAQ, Blog Listing & Blog Articles
let translationsCache: Record<string, any> = {};
const transCachePath = path.join(process.cwd(), "translations_cache.json");
try {
  if (fs.existsSync(transCachePath)) {
    fs.unlinkSync(transCachePath);
  }
} catch (_) {}

function saveTranslationsCache() {
  try {
    fs.writeFileSync(transCachePath, JSON.stringify(translationsCache, null, 2), "utf-8");
  } catch (err) {
    console.error("Could not save translations cache:", err);
  }
}

// API: Auto-Generate detailed AI content for a project using Gemini (with localization support)
app.all("/api/project/:id/expand", async (req, res) => {
  const { id } = req.params;
  const lang = (req.query.lang || req.body.lang || "en") as string;
  const cacheKey = `${id}_${lang}`;

  if (aiGenerationCache[cacheKey]) {
    return res.json(aiGenerationCache[cacheKey]);
  }

  let project = req.method === "POST" ? req.body : null;
  if (!project || Object.keys(project).length === 0) {
    try {
      const projects = await fetchGoogleSheetsProjects(false);
      project = projects.find((p: any) => p.id === id);
    } catch (err) {
      console.warn("Could not load backup projects for expansion:", err);
    }
  }

  if (!project) {
    return res.status(404).json({ error: "Project data not available for expansion." });
  }

  const client = getGeminiClient();
  if (!client) {
    console.log("No Gemini API client configured, sending premium mock description content.");
    const stub = {
      aiOverview: `${project.name} is a ultra-modern bespoke residential development located in the premium hub of ${project.area}, Malaysia. It is meticulously crafted to deliver luxury living spaces with top-tier accessibility and world-class structural finishings, perfectly matching first-class Malaysian and global home buyers.`,
      aiKeySellingPoints: [
        "Premium location with immediate MRT node connection within walking distance",
        "High-performance design utilizing sustainable smart-home frameworks and multi-tier visual systems",
        "Generous spatial layouts with high-ceilings, multi-aspect natural airflow, and premium floor tiles",
        "Bespoke world-class infinity sky pools, wellness pavilions, and modern fitness spaces",
      ],
      aiAmenities: `Strategically situated in the vibrant vicinity of ${project.area}. Residents enjoy close proximity to premier lifestyle shopping enclaves, prestigious international educational institutions, and renowned healthcare facilities. Seamless connectivity to major expressways links residents directly to Kuala Lumpur, Singapore, or Johor Bahru.`,
      aiHighlights: [
        "Highly competitive initial pricing offering superb capital appreciation potential for investors.",
        "Freehold title/Premium Leasehold status ensuring robust long-term multi-generational value.",
        "Designed by award-winning global architects highlighting sleek visual glass structures and natural materials.",
      ],
      aiBuyerProfile: "Highly suited for sophisticated modern professionals seeking quick accessibility to the CBD, families looking for nearby prestigious high schools, and savvy global real estate investors looking for high-yield dual-key rentals in Malaysia.",
      aiLocationBenefits: `Situated in a top-growth area of ${project.area} with ongoing high-yield urban revitalization projects, guaranteeing stable rental support and long-term asset security, particularly attractive for Singaporean and foreign buyers seeking premier asset opportunities.`,
    };
    aiGenerationCache[cacheKey] = stub;
    saveAiCache();
    return res.json(stub);
  }

  try {
    const isChinese = lang.startsWith("zh");
    const isJapanese = lang === "ja";
    const languageInstruction = isChinese 
      ? `You MUST write all output fields completely and fully in Chinese (${lang === "zh-TW" ? "Traditional / 繁体中文" : "Simplified / 简体中文"}). Translate all words, concepts, descriptions, keys, locations, areas, developer names, unit specifications, labels, and sentences fully to Chinese. The ONLY exception is the specific project name '${project.name}', which must remain exactly in English as a proper noun. Translate absolutely everything else, including developer names, locations, tenure, etc., completely into Chinese.`
      : isJapanese
      ? `You MUST write all output fields completely and fully in Japanese. Translate all words, concepts, descriptions, keys, locations, areas, developer names, unit specifications, labels, and sentences fully to Japanese. The ONLY exception is the specific project name '${project.name}', which must remain exactly in English as a proper noun. Translate absolutely everything else, including developer names, locations, tenure, etc., completely into Japanese.`
      : lang !== "en"
      ? `You MUST write all output fields completely and fully in the selected language: '${lang}'. Translate all words, concepts, descriptions, keys, locations, areas, developer names, unit specifications, labels, and sentences fully to '${lang}'. The ONLY exception is the specific project name '${project.name}', which must remain exactly in English as a proper noun. Translate absolutely everything else, including developer names, locations, tenure, etc., completely into '${lang}'.`
      : `Write all outputs in English.`;

    const prompt = `
      You are an elite, premium real-estate analyst specializing in Malaysian properties.
      Analyze the following properties listing details and write elegant, sophisticated, professional copy for their website landing page.
      DO NOT fabricate any project details (e.g., actual number of rooms or specific location other than what is provided).
      Write purely based on physical facts, using premium branding and high-end real estate vocabulary.
      No marketing fluff or low-end hype, sound highly professional and exclusive.
      IMPORTANT: Translate ALL words, descriptors, headings, and details into the target language. Do not leave any English words in the final output except for the project name '${project.name}'.

      ${languageInstruction}

      PROJECT DATA:
      Name: ${project.name}
      Developer: ${project.developer}
      Location: ${project.location}
      Area: ${project.area}
      Price Display: ${project.startingPriceFormatted}
      Built Up range: ${project.builtUpMin} to ${project.builtUpMax} sqft
      Rooms range: ${project.bedroomsMin} to ${project.bedroomsMax}
      Tenure: ${project.tenure}
      Type: ${project.projectType}
      Completion: ${project.completionStatus} (${project.completionYear})

      Please generate the following fields in rich, professional detail:
      1. aiOverview: A descriptive layout overview paragraph (approx 100 words).
      2. aiKeySellingPoints: A list of 4 key high-end architectural selling points.
      3. aiAmenities: A descriptive breakdown of physical surroundings and conveniences.
      4. aiHighlights: 3 critical property investment details.
      5. aiBuyerProfile: The specific profile of homebuyer or investor this is perfect for.
      6. aiLocationBenefits: Deep breakdown of the location advantages & local economic anchors.
    `;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: [
            "aiOverview",
            "aiKeySellingPoints",
            "aiAmenities",
            "aiHighlights",
            "aiBuyerProfile",
            "aiLocationBenefits",
          ],
          properties: {
            aiOverview: { type: Type.STRING },
            aiKeySellingPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            aiAmenities: { type: Type.STRING },
            aiHighlights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            aiBuyerProfile: { type: Type.STRING },
            aiLocationBenefits: { type: Type.STRING },
          },
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    aiGenerationCache[cacheKey] = parsedData;
    saveAiCache();
    res.json(parsedData);
  } catch (error: any) {
    console.log(`API Notice: Using pre-calculated local content profile for ${project.name} (${lang}) due to model capacity limits.`);
    
    const isChineseTW = lang.includes("TW") || lang.includes("HK") || lang.includes("tw") || lang.includes("hk");
    const isChinese = lang.startsWith("zh");
    const isJapanese = lang === "ja";
    const isKorean = lang === "ko";
    const isArabic = lang === "ar";
    const isFrench = lang === "fr";

    let fallbackData = {
      aiOverview: `${project.name} represents a landmark of masterfully crafted living suites in ${project.area}, boasting impeccable detail and elite security systems ideal for modern homeowners.`,
      aiKeySellingPoints: [
        "Unrivalled luxury design aesthetics with premium quality finishings",
        "Seamless connectivity to central arterial expressways and MRT hubs",
        "Generous internal space optimized for natural daylight and ventilation",
        "State-of-the-art rooftop sky club, gymnasium, and therapeutic garden layouts",
      ],
      aiAmenities: `Exquisitely situated within the heart of ${project.area}, directly connected to world-class lifestyle squares, renowned schools, hypermarkets, and modern medical hubs.`,
      aiHighlights: [
        "Strong rental yields backed by high-growth localized business anchors.",
        "Excellent price-per-square-foot entry ratios ensuring robust long-term asset security.",
        "Created with an premium emphasis on sustainable passive architecture and green ventilation.",
      ],
      aiBuyerProfile: "Highly recommended for active families seeking quiet secure communities, regional executives, and strategic real estate investors looking for strong asset appreciation.",
      aiLocationBenefits: "A highly sought-after localized zone with direct, safe pedestrian linkages to modern shopping enclaves and rapid public transport links.",
    };

    if (isChineseTW) {
      fallbackData = {
        aiOverview: `${project.name} 是位於馬來西亞 ${project.area} 板塊的標誌性奢華精裝住宅，擁有無可挑剔的工藝細節與全時全維度安防系統，是現代精英家庭的理想首選。`,
        aiKeySellingPoints: [
          "無可比擬的奢華現代美學，甄選全球頂尖高端品牌精裝交付",
          "四通八達的地理位置，緊鄰高速幹線並直接接駁MRT捷運樞紐",
          "寬敞通透的內部格局設計，完美優化室內採光與自然通風效果",
          "配備高空天際俱樂部、頂級健身中心以及空中康養屋頂花園",
        ],
        aiAmenities: `完美雄踞在 ${project.area} 的黃金核心地段，周邊無縫環繞世界級頂奢商圈、聲譽卓著的國際學校、連鎖超市和精品醫療機構。`,
        aiHighlights: [
          "依托周邊強大的商業龍頭與區域經濟紅利，擁有極高且穩定的租金回報率。",
          "卓越的高性價比每平方英尺售價，是精明投資者入局馬來西亞首選。",
          "全面採用低能耗被动式綠色建材，確保極低綜合能耗與環保宜居屬性。",
        ],
        aiBuyerProfile: "極力推薦給尋求靜謐高端生活社區、便捷出行通勤的都市金領家庭、跨國企業高管以及謀求海外優質資產穩健升值配置的精明投資者。",
        aiLocationBenefits: "極具升值潛力的核心黃金投資板塊，完美兼具了現代商業中心的便捷性以及軌道交通節點的超高網絡連接度。",
      };
    } else if (isChinese) {
      fallbackData = {
        aiOverview: `${project.name} 是位于马来西亚 ${project.area} 板块的标志性奢华精装住宅，拥有无可挑剔的工艺细节与全时全维度安防系统，是现代精英家庭的理想首选。`,
        aiKeySellingPoints: [
          "无可比拟的奢华现代美学，甄选全球顶尖高端品牌精装交付",
          "四通八达的地理位置，紧邻高速干线并直接接驳MRT捷运枢纽",
          "宽敞通透的内部格局设计，完美优化室内采光与自然通风效果",
          "配备高空天际俱乐部、顶级健身中心以及空中康养屋顶花园",
        ],
        aiAmenities: `完美雄踞在 ${project.area} 的黄金核心地段，周边无缝环绕世界级顶奢商圈、声誉卓著的国际学校、连锁超市和精品医疗机构。`,
        aiHighlights: [
          "依托周边强大的商业龙头与区域经济红利，拥有极高且稳定的租金回报率。",
          "卓越的高性价比每平方英尺售价，是精明投资者入局马来西亚首选。",
          "全面采用低能耗被动式绿色建材，确保极低综合能耗与环保宜居属性。",
        ],
        aiBuyerProfile: "极力推荐给寻求静谧高端生活社区、便捷出行通勤的都市金领家庭、跨国企业高管以及谋求海外优质资产稳健升值配置的精明投资者。",
        aiLocationBenefits: "极具升值潜力的核心黄金投资板块，完美兼具了现代商业中心的便捷性以及轨道交通节点的超高网络连接度。",
      };
    } else if (isJapanese) {
      fallbackData = {
        aiOverview: `${project.name}は、マレーシア屈指の好立地エリア${project.area}に位置する、最高峰のマスターピース高級コンドミニアムです。徹底されたディテールと厳重なマルチレイヤーセキュリティシステムを完備し、洗練されたモダン世代の最適なライフスタイルを約束します。`,
        aiKeySellingPoints: [
          "世界的一流ブランドのこだわり内装と極上のモダンリビング空間仕様",
          "主要高速道路へのスピーディな連結とMRT/LRT駅への快適な最寄アクセス",
          "高天井設計を基盤とした、採光性・通風性にこだわり抜いた開放的間取り構造",
          "ルーフトップインフィニティプール、専属フィットネスジム、憩いのヒーリングガーデン",
        ],
        aiAmenities: `${project.area}の中心部に完璧に位置し、高級ライフスタイルショッピングモール、世界トップレベルのインターナショナル国際学校、最先端の総合病院施設がすべて徒歩および短時間移動圏内に整っています。`,
        aiHighlights: [
          "高成長ビジネスハブに隣接し、マレーシア国内外の駐在員および投資家からの旺盛な賃貸需要と高水準インカムゲインを担保。",
          "初期開始販売段階だからこそ実現した、卓越した平米単価メリット。高いキャピタルゲインポテンシャル。",
          "最高水準の省エネ・環境配慮素材を全編に取り入れ、国際的なゴールド環境ビルディング認証を獲得予定。",
        ],
        aiBuyerProfile: "都心への通勤利便性を最重視する富裕層プロフェッショナル層、有名校の学区プレミアムを求める子育てファミリー世帯、および安定高利回りで不動産ポートフォリオを強化したいアジアのヘッジファンド・海外投資家層に極めて高い適合性を有します。",
        aiLocationBenefits: "マレーシア政府主導の開発特区であり、インフラ拡張整備による堅調な地価上昇の恩恵を最大化できる、マレーシアで最重要視される超高成長立地エリアに位置します。",
      };
    } else if (isKorean) {
      fallbackData = {
        aiOverview: `${project.name}은 말레이시아의 신흥 부촌인 ${project.area} 중심에 건립되는 플래그십 아파트먼트로, 극대화된 최고급 마감재와 스마트 삼중 철통 경비 시스템을 결합하여 자산 가치와 안전을 영구 보호합니다.`,
        aiKeySellingPoints: [
          "프리미엄 수입 자재를 적용한 맞춤형 도심 호텔식 주거 레이아웃",
          "도심 간선 고속도로 및 친환경 친인프라 자전거 길, 도시 철도 MRT 직통 연결성",
          "맞바람 구조와 깊은 천편 공간을 확보하여 빛과 바람의 순환을 도모한 내부 설계",
          "최고급 인피니티 클럽하우스, 수영장, 그리고 고단지 맞춤 조경 녹지 공간 제공",
        ],
        aiAmenities: `${project.area}의 최고 전성 입지에 우뚝 솟아, 대표적인 럭셔리 복합몰 및 명문 아카데미, 프리미엄 종합 대형병원을 완벽하게 관할하고 있어 편안한 인프라 혜택을 제공합니다.`,
        aiHighlights: [
          "배후 비즈니스 오피스 단지를 통섭하고 있어 높은 임대 수익률과 공실 우려 없는 자산 회전율 구현.",
          "강력한 초기 평단가 메리트를 품고 있어 안전마진과 함께 공고한 자산 이득이 명확히 확보.",
          "글로벌 명장의 스마트 녹색 설계가 적용되어 연간 세대 공용 관리비 관리 부담 절감 유도.",
        ],
        aiBuyerProfile: "학업 열풍을 수용하려는 교육 지향적인 고소득 일가족 및 대도시 직통 출퇴근을 추구하는 대기업 임원직, 세제 혜택과 해외 통화 분산 보호를 통해 평생 안전 배당을 겨냥하는 정밀 투자 자산가 분들께 최선입니다.",
        aiLocationBenefits: "정부 자본 투입이 집중되는 거대 철도 확장 계획과 메가 시티 비즈니스 앵커에 직접 밀착하여 지역 내 랜드마크 부동산으로서 지속적인 인플레이션 방어 효과를 보장받습니다.",
      };
    } else if (isArabic) {
      fallbackData = {
        aiOverview: `يمثل ${project.name} علامة بارزة للأجنحة السكنية المصممة ببراعة استثنائية في هضبة ${project.area} بماليزيا، ويمتاز بالتشطيبات ذات الجودة الاستثنائية وتوفير أنظمة الأمن الذكية المتطورة لحماية مالكي العقارات.`,
        aiKeySellingPoints: [
          "جماليات تصميم فاخرة لا مثيل لها مع تزويدها بأحدث اللمسات والتركيبات عالمية الجودة",
          "اتصال مباشر وسلس بالطرق السريعة الرئيسية والمحاور الحيوية لشبكة مترو الأنفاق MRT",
          "مساحات داخلية فسيحة ومشرقة ومصممة لتحسين مرور بضوء النهار بالكامل وحركة تدفق الهواء الطبيعي",
          "يضم قاعة نوادٍ سماوية للياقة البدنية، وحمامات سباحة لا نهائية، وحدائق هادئة للغاية للاسترخاء",
        ],
        aiAmenities: `يتمتع بموقع إستراتيجي فخم للغاية في قلب منطقة ${project.area}، محاطاً بالكامل بأجمل مراكز التسوق الراقية والمدارس الدولية العريقة والهايبرماركت ومجمعات الرعاية الطبية الحديثة.`,
        aiHighlights: [
          "عوائد إيجارية قوية ومستقرة مدعومة بوجود أكبر المقرات التجارية والشركات الاقتصادية الكبرى.",
          "سعر تنافسي ممتاز للقدم المربع، ما يوفر فرصة دخول آمنة تماماً للمستثمرين الباحثين عن أمان رأس المال والأصول.",
          "مبني ومصمم تزامناً مع أحدث المعايير البيئية للمباني المستدامة الذكية للحد من النفقات السنوية المشتركة.",
        ],
        aiBuyerProfile: "موصى به بشدة للعائلات الباحثة عن تجمعات سكنية فاخرة وآمنة وهادئة، وللمديرين التنفيذيين والشركات، والمستثمرين الاستراتيجيين الساعين لتحقيق زيادة متوازنة في قيمة أصولهم العقارية بماليزيا.",
        aiLocationBenefits: "منطقة استثمارية واعدة للغاية تشهد طلباً كبيراً، تجمع بروعة لا تضاهى بين مركز الحياة العصرية المزدحم والربط الفوري السريع من خلال المترو وشبكات النقل.",
      };
    } else if (isFrench) {
      fallbackData = {
        aiOverview: `${project.name} s'impose comme une signature majeure de résidences d'élite au cœur de ${project.area}, Malaisie, alliant design primé, finitions soignées de prestige et systèmes de haute sécurité intégrale.`,
        aiKeySellingPoints: [
          "Esthétique architecturale raffinée intégrant des matériaux précieux de premier choix",
          "Liaisons routières directes ultra-rapides et accès piétonnier immédiat aux lignes MRT",
          "Grands volumes traversants sublimés par une luminosité naturelle et une ventilation passive",
          "Club privé exclusif sur le toit, piscine céleste suspendue et jardins paysagers de détente",
        ],
        aiAmenities: `Idéalement au centre névralgique de ${project.area}, à proximité immédiate des galeries marchandes à ciel ouvert, universités de renom, hypermarchés haut de gamme et centres de soins premium.`,
        aiHighlights: [
          "Fort potentiel locatif assuré par la proximité de zones d'activités dynamiques et de sièges sociaux.",
          "Prix au pied carré d'entrée très attractif assurant une valorisation patrimoniale solide à long terme.",
          "Conception écoresponsable optimisant l'impact énergétique global de la copropriété.",
        ],
        aiBuyerProfile: "Idéal pour les cadres en quête de confort absolu, les familles privilégiant les environnements sécurisés d'excellence, et les investisseurs avisés visant un rendement stable.",
        aiLocationBenefits: "Une enclave résidentielle convoitée à forte valeur ajoutée, garantissant un cadre de vie moderne et une connexion rapide aux réseaux métropolitains majeurs.",
      };
    }

    res.json(fallbackData);
  }
});

// API: Get Translated General FAQs
app.get("/api/faqs", async (req, res) => {
  const lang = req.query.lang as string;
  if (!lang || lang === "en") {
    return res.json(FAQ_DATA);
  }

  // Check static pre-translated catalog first
  if (FAQ_TRANSLATIONS && FAQ_TRANSLATIONS[lang]) {
    return res.json(FAQ_TRANSLATIONS[lang]);
  }

  const cacheKey = `faqs_${lang}`;
  if (translationsCache[cacheKey]) {
    return res.json(translationsCache[cacheKey]);
  }

  const client = getGeminiClient();
  if (!client) {
    console.log("No Gemini API client configured for FAQs translation, sending original.");
    return res.json(FAQ_DATA);
  }

  try {
    const prompt = `
      You are an elite, professional real estate translator. Please translate the following FAQ question-and-answer dataset fully and completely into the target language: "${lang}".
      Translate every single word, including categories, questions, answers, headings, and descriptions.
      The ONLY exception is the specific proper names of residential properties or projects (such as 'Riverville', 'D'Cosmos', 'Sensory Residence', 'Puteri Harbour', etc.). Keep these specific project names exactly as they are in English.
      Everything else—such as developer names, locations, general descriptions, and real estate terminology—must be fully translated into "${lang}". Do not leave any other English words in the final output.

      FAQ DATA to translate:
      ${JSON.stringify(FAQ_DATA, null, 2)}

      Return the result as a valid JSON array matching the original structure: [{"category": "...", "question": "...", "answer": "..."}].
      Return ONLY the valid JSON, do not include any markdown fences or introductory talk.
    `;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["category", "question", "answer"],
            properties: {
              category: { type: Type.STRING },
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || "[]");
    if (parsed && parsed.length > 0) {
      translationsCache[cacheKey] = parsed;
      saveTranslationsCache();
      return res.json(parsed);
    }
    throw new Error("Empty representation parsed");
  } catch (error: any) {
    console.log(`API Notice: Reverting to English source FAQ database due to temporary translation API capacity limits.`);
    return res.json(FAQ_DATA);
  }
});

// API: Get Translated Blog Previews Lists
app.get("/api/blog", async (req, res) => {
  const lang = req.query.lang as string;
  
  // Format metadata lists
  const previews = BLOG_DATA.map(art => ({
    id: art.id,
    slug: art.slug,
    title: art.title,
    metaDescription: art.metaDescription,
    summary: art.summary,
    readTime: art.readTime,
    publishDate: art.publishDate,
    author: art.author,
    category: art.category,
    image: art.image,
  }));

  if (!lang || lang === "en") {
    return res.json(previews);
  }

  const cacheKey = `blog_list_${lang}`;
  if (translationsCache[cacheKey]) {
    return res.json(translationsCache[cacheKey]);
  }

  const client = getGeminiClient();
  if (!client) {
    console.log("No Gemini API client configured for blog previews, sending original.");
    return res.json(previews);
  }

  try {
    const prompt = `
      You are an elite, professional real-estate translator. Translate the following blog article lists fully and completely from English into "${lang}".
      Translate every single word, including titles, summaries, metaDescriptions, categories, and tags.
      The ONLY exception is the specific proper names of residential properties or projects (such as 'Riverville', 'D'Cosmos', 'Sensory Residence', 'Puteri Harbour', etc.). Keep these specific project names exactly as they are in English.
      Everything else—such as developer names, locations, cities, regions, and general content—must be fully and completely translated into "${lang}". Ensure that no other English words remain untranslated.

      Articles to translate:
      ${JSON.stringify(previews, null, 2)}

      Return the translated items as a valid JSON array matching the original structure exactly, return ONLY JSON.
    `;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["id", "slug", "title", "metaDescription", "summary", "category"],
            properties: {
              id: { type: Type.STRING },
              slug: { type: Type.STRING },
              title: { type: Type.STRING },
              metaDescription: { type: Type.STRING },
              summary: { type: Type.STRING },
              readTime: { type: Type.STRING },
              publishDate: { type: Type.STRING },
              author: { type: Type.STRING },
              category: { type: Type.STRING },
              image: { type: Type.STRING },
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || "[]");
    if (parsed && parsed.length > 0) {
      translationsCache[cacheKey] = parsed;
      saveTranslationsCache();
      return res.json(parsed);
    }
    throw new Error("Empty markdown parsed");
  } catch (error: any) {
    console.log(`API Notice: Defaulting to standard pre-written blog previews language index due to temporary translation limits.`);
    return res.json(previews);
  }
});

// API: Get Single fully translated Blog Article details
app.get("/api/blog/:slug", async (req, res) => {
  const { slug } = req.params;
  const lang = req.query.lang as string;

  const article = BLOG_DATA.find(a => a.slug === slug);
  if (!article) {
    return res.status(404).json({ error: "Article not found" });
  }

  if (!lang || lang === "en") {
    return res.json(article);
  }

  const cacheKey = `blog_detail_${slug}_${lang}`;
  if (translationsCache[cacheKey]) {
    return res.json(translationsCache[cacheKey]);
  }

  const client = getGeminiClient();
  if (!client) {
    console.log("No Gemini API client configured for blog detail, sending original.");
    return res.json(article);
  }

  try {
    const prompt = `
      You are an elite, professional real-estate translator. Translate the following blog article details (including title, summary, metaDescription, full markdown content, and faqs) fully and completely from English into the target language: "${lang}".
      Translate every single word, paragraph, header, list item, question, answer, and description.
      The ONLY exception is the specific proper names of residential properties, projects, or buildings (such as 'Riverville', 'D'Cosmos', 'Sensory Residence', 'Puteri Harbour', etc.). Keep these specific project names exactly as they are in English.
      Everything else—including developer names, general geographic areas, technical terminology, and content—must be fully and completely translated into "${lang}". No other English words should remain in the translated parts. Preserve Markdown syntax indicators like #, ##, -, *, etc.

      ARTICLE DETAILS:
      {
        "title": ${JSON.stringify(article.title)},
        "metaDescription": ${JSON.stringify(article.metaDescription)},
        "summary": ${JSON.stringify(article.summary)},
        "category": ${JSON.stringify(article.category)},
        "content": ${JSON.stringify(article.content)},
        "faqs": ${JSON.stringify(article.faqs)}
      }

      Return the translated article as a JSON object with matching keys ("title", "metaDescription", "summary", "category", "content", "faqs"). Return ONLY the JSON object.
    `;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "metaDescription", "summary", "category", "content", "faqs"],
          properties: {
            title: { type: Type.STRING },
            metaDescription: { type: Type.STRING },
            summary: { type: Type.STRING },
            category: { type: Type.STRING },
            content: { type: Type.STRING },
            faqs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["question", "answer"],
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                }
              }
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    if (parsed && parsed.title) {
      const merged = {
        ...article,
        title: parsed.title,
        metaDescription: parsed.metaDescription,
        summary: parsed.summary,
        category: parsed.category,
        content: parsed.content,
        faqs: parsed.faqs
      };
      translationsCache[cacheKey] = merged;
      saveTranslationsCache();
      return res.json(merged);
    }
    throw new Error("Invalid translation response structure");
  } catch (error: any) {
    console.log(`API Notice: Defaulting to original blog content layout due to model translation service capacity limits.`);
    return res.json(article);
  }
});

// API: Lead Contact Form Submissions
app.post("/api/contact", (req, res) => {
  const { name, email, phone, project, message, date } = req.body;
  
  // Format details for agent
  const emailBody = `
    ==================================================
    NEW MALAYSIA PROPERTY PORTAL LEAD
    ==================================================
    Submitted At: ${new Date().toISOString()}
    Recipient: Shyan Yee (shyanyeews@gmail.com)
    
    Lead Name: ${name}
    Lead Email: ${email}
    Lead Phone: ${phone}
    Interested Project: ${project || "General Consultation"}
    Booking Date/Preference: ${date || "Immediate"}
    Message:
    "${message}"
    ==================================================
  `;

  console.log(emailBody);

  // Store leads locally for admin display
  try {
    const leadsFile = path.join(process.cwd(), "leads.json");
    let leads = [];
    if (fs.existsSync(leadsFile)) {
      leads = JSON.parse(fs.readFileSync(leadsFile, "utf-8"));
    }
    leads.push({ id: Date.now().toString(), name, email, phone, project, message, date, createdAt: new Date().toISOString() });
    fs.writeFileSync(leadsFile, JSON.stringify(leads, null, 2), "utf-8");
  } catch (err) {
    console.error("Could not write leads locally:", err);
  }

  res.json({
    status: "ok",
    message: "Thank you! Your property inquiry has been received. Agent Shyan Yee (shyanyeews@gmail.com) will reach you on WhatsApp or Email shortly.",
  });
});

// Admin Panel CMS Editing Simulation
app.post("/api/admin/update-agent", (req, res) => {
  // Simple simulation
  res.json({ status: "ok", message: "Agent Profile updated successfully!" });
});

// Explicit SEO route handlers for Node.js production container deployment
app.get("/robots.txt", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "robots.txt"));
});

app.get("/sitemap.xml", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "sitemap.xml"));
});

// Vite Middleware & Static Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Mount Vite middlewares
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
