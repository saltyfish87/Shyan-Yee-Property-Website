import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Project } from '../types';
import { useLanguage } from '../LanguageContext';
import { useCurrency } from '../CurrencyContext';
import { MapPin, Search, Navigation, ChevronsUpDown, Info, Building } from 'lucide-react';

interface InteractiveMapProps {
  projects: Project[];
  onProjectSelect: (project: Project) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ projects, onProjectSelect }) => {
  const { t } = useLanguage();
  const { convertPrice } = useCurrency();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const leftListContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null); // Leaflet map instance
  const mapElementRef = useRef<HTMLDivElement>(null); // map div ref
  const markersRef = useRef<Record<string, any>>({}); // project id to leaflet marker map
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({}); // project id to left item div ref

  // Calculate coordinates deterministically based on Area keywords
  const projectsWithCoords = useMemo(() => {
    return projects.map((p) => {
      if (p.latitude && p.longitude) {
        return {
          ...p,
          coords: [p.latitude, p.longitude] as [number, number],
        };
      }

      const id = p.id;
      const charSum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      // Deterministic spread around major anchors
      let baseLat = 3.1390; // KL default
      let baseLng = 101.6869;

      const areaLower = p.area.toLowerCase();
      const locLower = p.location.toLowerCase();

      if (areaLower.includes('johor') || locLower.includes('johor') || areaLower.includes('jb') || locLower.includes('jb') || locLower.includes('rts') || locLower.includes('ciq')) {
        baseLat = 1.4927; // JB Central
        baseLng = 103.7414;
      } else if (areaLower.includes('subang') || areaLower.includes('usj') || locLower.includes('subang') || locLower.includes('usj')) {
        baseLat = 3.0600; // Subang
        baseLng = 101.5850;
      } else if (areaLower.includes('puchong') || locLower.includes('puchong')) {
        baseLat = 3.0236; // Puchong
        baseLng = 101.6181;
      } else if (areaLower.includes('petaling') || locLower.includes('pj') || locLower.includes('petaling')) {
        baseLat = 3.1118; // Petaling Jaya
        baseLng = 101.6292;
      } else if (areaLower.includes('cheras') || locLower.includes('cheras')) {
        baseLat = 3.1028; // Cheras
        baseLng = 101.7348;
      } else if (areaLower.includes('bangsar') || locLower.includes('bangsar')) {
        baseLat = 3.1283; // Bangsar
        baseLng = 101.6669;
      } else if (areaLower.includes('klcc') || locLower.includes('klcc')) {
        baseLat = 3.1579; // KLCC
        baseLng = 101.7123;
      } else if (areaLower.includes('penang') || locLower.includes('penang')) {
        baseLat = 5.4141; // Penang
        baseLng = 100.3288;
      }

      // Add a small deterministic scatter (+-0.015 degrees) so marker pins don't overlap
      const diffLat = ((charSum % 31) - 15) * 0.0018;
      const diffLng = ((charSum % 43) - 21) * 0.0018;

      return {
        ...p,
        coords: [baseLat + diffLat, baseLng + diffLng] as [number, number],
      };
    });
  }, [projects]);

  // Handle Search Filtering
  const filteredProjectsWithCoords = useMemo(() => {
    return projectsWithCoords.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.developer.toLowerCase().includes(q) ||
        p.area.toLowerCase().includes(q)
      );
    });
  }, [projectsWithCoords, searchQuery]);

  // Load Leaflet map inside container once mounted
  useEffect(() => {
    // 1. Inject Leaflet CSS if not loaded
    const linkId = 'leaflet-css';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // 2. Inject Leaflet JS if not loaded
    const scriptId = 'leaflet-js';
    let script: HTMLScriptElement | null = document.getElementById(scriptId) as HTMLScriptElement;
    
    const initLeafletMap = () => {
      const L = (window as any).L;
      if (!L || !mapElementRef.current) return;

      // Avoid double initialization
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // Choose focus coordinates based on initial markers available
      const initialCenter: [number, number] = filteredProjectsWithCoords.length > 0 
        ? filteredProjectsWithCoords[0].coords 
        : [3.1390, 101.6869]; // KL default

      const mapInstance = L.map(mapElementRef.current).setView(initialCenter, 11);
      mapRef.current = mapInstance;

      // Add elegant premium map tile layer (CartoDB Positron / Voyager is beautiful and and clean)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors &copy; <a href=\"https://carto.com/attributions\">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(mapInstance);

      // Clean existing markers
      markersRef.current = {};

      // Draw all interactive project markers
      filteredProjectsWithCoords.forEach((proj) => {
        const { formatted: displayPrice } = convertPrice(proj.startingPrice);

        // Customize marker styling using Leaflet DivIcon
        const customIcon = L.divIcon({
          html: `
            <div class="relative group flex flex-col items-center transition-all duration-300">
              <div class="cursor-pointer pointer-events-auto filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#dc2743" class="w-10 h-12 transition-all duration-300">
                  <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742z" clip-rule="evenodd" />
                  <circle cx="12" cy="10" r="3" fill="#fef08a" />
                </svg>
              </div>
              <div class="absolute bottom-13 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-xl shadow-lg border border-slate-800 pointer-events-none opacity-0 scale-95 translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-200 whitespace-nowrap flex flex-col items-center z-50">
                <span class="font-extrabold text-[#60a5fa] text-[9px] uppercase tracking-wide leading-none mb-0.5">${displayPrice || 'Price Pending'}</span>
                <span class="leading-normal">${proj.name}</span>
              </div>
            </div>
          `,
          className: 'custom-leaflet-marker',
          iconSize: [40, 48],
          iconAnchor: [20, 48],
        });

        const marker = L.marker(proj.coords, { icon: customIcon }).addTo(mapInstance);
        markersRef.current[proj.id] = marker;

        // Custom marker popup
        marker.on('click', () => {
          setActiveProject(proj);
          mapInstance.setView(proj.coords, 14, { animate: true, duration: 1 });

          // Smoothly scroll the matching left list card to center
          const targetCard = itemRefs.current[proj.id];
          if (targetCard) {
            targetCard.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
        });
      });
    };

    if (script) {
      // script exists, wait or trigger directly
      if ((window as any).L) {
        initLeafletMap();
      } else {
        script.addEventListener('load', initLeafletMap);
      }
    } else {
      // create it
      const newScript = document.createElement('script');
      newScript.id = scriptId;
      newScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      document.body.appendChild(newScript);
      newScript.addEventListener('load', initLeafletMap);
    }

    return () => {
      // Cleanup maps if unmounted
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [filteredProjectsWithCoords, convertPrice]);

  // Handle active project marker styling updates dynamically
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    // Loop through all markers and update their icons based on active state
    filteredProjectsWithCoords.forEach((proj) => {
      const marker = markersRef.current[proj.id];
      if (!marker) return;

      const isActive = activeProject?.id === proj.id;
      const { formatted: displayPrice } = convertPrice(proj.startingPrice);

      // Standard visible pin: Crimson Red (#dc2743)
      // Selected visible pin: Vivid Royal Blue (#2563eb)
      const pinColor = isActive ? '#2563eb' : '#dc2743';
      const pinScale = isActive ? 'scale-125 z-[100]' : 'scale-100 z-10';
      const innerDotColor = isActive ? '#ffffff' : '#fef08a';

      const customIcon = L.divIcon({
        html: `
          <div class="relative group flex flex-col items-center transition-all duration-300 ${pinScale}">
            <div class="cursor-pointer pointer-events-auto filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${pinColor}" class="w-10 h-12 transition-colors duration-300">
                <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742z" clip-rule="evenodd" />
                <circle cx="12" cy="10" r="3" fill="${innerDotColor}" />
              </svg>
            </div>
            <!-- Tooltip is fully visible when active, or on hover when inactive -->
            <div class="absolute bottom-13 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-xl shadow-lg border border-slate-800 pointer-events-none transition-all duration-200 whitespace-nowrap flex flex-col items-center ${
              isActive 
                ? 'opacity-100 scale-105 translate-y-0 z-50' 
                : 'opacity-0 scale-95 translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0'
            }">
              <span class="font-extrabold text-[#60a5fa] text-[9px] uppercase tracking-wide leading-none mb-0.5">${displayPrice || 'Price Pending'}</span>
              <span class="leading-normal">${proj.name}</span>
            </div>
          </div>
        `,
        className: `custom-leaflet-marker ${isActive ? 'active-marker' : ''}`,
        iconSize: [40, 48],
        iconAnchor: [20, 48],
      });

      marker.setIcon(customIcon);
      
      // Bring active marker to front
      if (isActive && marker.setZIndexOffset) {
        marker.setZIndexOffset(1000);
      } else if (marker.setZIndexOffset) {
        marker.setZIndexOffset(0);
      }
    });
  }, [activeProject, filteredProjectsWithCoords, convertPrice]);

  // Click handler from Left List
  const handleLeftCardClick = (proj: any) => {
    setActiveProject(proj);
    const L = (window as any).L;

    if (mapRef.current && L) {
      mapRef.current.setView(proj.coords, 14, { animate: true, duration: 1.2 });
    }
  };

  return (
    <div id="interactive-map-page" className="bg-slate-50/20 h-[calc(100vh-80px)] flex flex-col md:flex-row shadow-sm outline-none border-t border-slate-100">
      
      {/* LEFT COLUMN: Project feed & Search Bar */}
      <div className="w-full md:w-[420px] bg-white border-r border-slate-100 shadow-sm flex flex-col justify-between h-[45vh] md:h-full z-10">
        
        {/* Search header banner */}
        <div className="p-5 border-b border-slate-50 bg-slate-50/40">
          <div className="flex items-center gap-2 mb-3">
            <Navigation className="h-5 w-5 text-[#dc2743]" />
            <h2 className="text-xl font-[800] tracking-tight text-slate-900">
              Interactive Explorer
            </h2>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Location, Project, Developer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-full py-3.5 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-400"
            />
            <Search className="absolute left-3.5 top-4 h-4.5 w-4.5 text-slate-400" />
          </div>
        </div>

        {/* Scrollable Project Cards feed */}
        <div
          ref={leftListContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20 select-none scroll-smooth"
        >
          {filteredProjectsWithCoords.length === 0 ? (
            <div className="text-center py-10 text-slate-400 flex flex-col items-center justify-center">
              <Building className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold">No map matches found</p>
            </div>
          ) : (
            filteredProjectsWithCoords.map((p) => {
              const isActive = activeProject?.id === p.id;
              const { formatted: displayPrice } = convertPrice(p.startingPrice);

              return (
                <div
                  key={p.id}
                  ref={(el) => { itemRefs.current[p.id] = el; }}
                  onClick={() => handleLeftCardClick(p)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex gap-4 bg-white hover:shadow-md ${
                    isActive
                      ? 'border-[#dc2743] ring-2 ring-orange-100 shadow-sm'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {/* Photo mini-frame */}
                  <div className="w-20 h-20 rounded-xl bg-stone-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {p.images?.overview && p.images.overview.length > 0 && p.images.overview[0] ? (
                      <img
                        src={p.images.overview[0]}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <Building className="h-6 w-6 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Specifications stack */}
                  <div className="flex-1 min-w-0 text-left flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 truncate leading-tight">
                        {p.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold truncate">
                        {p.developer.replace(/\(.*?\)/g, "").trim()}
                      </p>
                    </div>

                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs font-black text-[#dc2743] bg-orange-50 border border-orange-100/50 px-2 py-0.5 rounded">
                        {displayPrice}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onProjectSelect(p); }}
                        className="text-[10px] font-bold text-[#dc2743] flex items-center gap-0.5 hover:underline whitespace-nowrap cursor-pointer"
                      >
                        Details
                        <Info className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sync Status block footer */}
        <div className="p-3 bg-slate-900 text-slate-400 text-[10px] font-semibold flex items-center justify-between select-none border-t border-slate-800">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            OpenStreetMap Sync Live
          </span>
          <span>{filteredProjectsWithCoords.length} Positions Plot</span>
        </div>

      </div>

      {/* RIGHT COLUMN: Leaflet Container */}
      <div className="flex-1 h-full relative">
        <div ref={mapElementRef} className="w-full h-full z-0" />
      </div>

    </div>
  );
};
