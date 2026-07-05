import React, { useState, useEffect, useRef } from "react";
import { Project } from "../types";
import { ArrowRight, ChevronLeft, ChevronRight, Building, MapPin, DollarSign, Calendar, Maximize, BedDouble } from "lucide-react";

interface ProjectSlideshowProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export function ProjectSlideshow({ projects, onProjectClick }: ProjectSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter projects with valid overview images, fallback to showing all
  const slideshowProjects = React.useMemo(() => {
    return projects.filter(p => p.images?.overview && p.images.overview.length > 0);
  }, [projects]);

  useEffect(() => {
    if (slideshowProjects.length <= 1 || isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideshowProjects.length);
    }, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slideshowProjects, isHovered]);

  if (slideshowProjects.length === 0) {
    return null;
  }

  const activeProject = slideshowProjects[currentIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + slideshowProjects.length) % slideshowProjects.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % slideshowProjects.length);
  };

  const formattedPrice = new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(activeProject.startingPrice);

  return (
    <section className="py-20 bg-slate-50 border-t border-b border-rose-100/50 text-slate-900 overflow-hidden relative">
      {/* Decorative ambient subtle glow background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block text-xs font-black uppercase tracking-widest text-orange-600 mb-2 animate-pulse">
            ⚡ Rotating Portfolio Spotlight
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Exclusive Project Showcase
          </h2>
          <p className="text-slate-500 text-sm mt-3 font-semibold">
            Catch virtual floor plans, real architectural facades, and pricing highlights at a glance.
          </p>
        </div>

        {/* Master slideshow wrapper container */}
        <div 
          className="relative bg-white border border-slate-200/80 rounded-[32px] overflow-hidden shadow-xl cursor-pointer group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => onProjectClick(activeProject)}
        >
          {/* Main Slide Inner Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
            {/* Gallery Image block: takes 7 cols on desktop */}
            <div className="lg:col-span-7 relative min-h-[300px] lg:min-h-[480px] overflow-hidden bg-slate-100 group">
              {activeProject.images?.overview && activeProject.images.overview[0] ? (
                <img 
                  src={activeProject.images.overview[0]} 
                  alt={activeProject.name} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-95"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-slate-200">
                  <Building className="h-12 w-12 text-slate-400 mb-3" />
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">Overview Pending Verification</p>
                </div>
              )}

              {/* Badges layered over the image */}
              <div className="absolute top-6 left-6 flex flex-wrap gap-2 pointer-events-none">
                <span className="px-3.5 py-1 bg-stone-900/95 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-full backdrop-blur-md border border-stone-800">
                  {activeProject.tenure}
                </span>
                <span className="px-3.5 py-1 bg-orange-600 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-full shadow-lg">
                  {activeProject.projectType}
                </span>
                {activeProject.isHot && (
                  <span className="px-3.5 py-1 bg-rose-600 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-full animate-bounce">
                    🔥 Highly Rated
                  </span>
                )}
              </div>

              {/* Progress Bar of Auto-interval */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-200/80 pointer-events-none">
                <div 
                  key={currentIndex}
                  className="h-full bg-orange-500 transition-all duration-3000 ease-linear"
                  style={{ 
                    width: isHovered ? "100%" : "0%",
                    animation: isHovered ? "none" : "slideshowProgress 3s linear forwards"
                  }}
                />
              </div>
            </div>

            {/* Core Details Panel: takes 5 cols on desktop */}
            <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between bg-white border-t lg:border-t-0 lg:border-l border-slate-100">
              <div className="space-y-6">
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-orange-600 mb-1.5">
                    {activeProject.developer}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">
                    {activeProject.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs sm:text-sm mt-2.5 font-bold">
                    <MapPin className="h-4 w-4 text-orange-500 shrink-0" />
                    <span>{activeProject.location}, {activeProject.area}</span>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Grid stats parameters */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2.5 bg-slate-50/80 border border-slate-100 p-3 rounded-2xl">
                    <Maximize className="h-4 w-4 text-orange-500 shrink-0" />
                    <div>
                      <span className="block text-[8px] text-slate-450 uppercase font-black tracking-wider leading-none">Built up sizes</span>
                      <span className="text-[11px] sm:text-xs font-black text-slate-800">
                        {activeProject.builtUpMin} - {activeProject.builtUpMax} sqft
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-slate-50/80 border border-slate-100 p-3 rounded-2xl">
                    <BedDouble className="h-4 w-4 text-orange-500 shrink-0" />
                    <div>
                      <span className="block text-[8px] text-slate-450 uppercase font-black tracking-wider leading-none">Bedrooms</span>
                      <span className="text-[11px] sm:text-xs font-black text-slate-800">
                        {activeProject.bedroomsMin} - {activeProject.bedroomsMax} rooms
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-slate-50/80 border border-slate-100 p-3 rounded-2xl col-span-2">
                    <Calendar className="h-4 w-4 text-orange-500 shrink-0" />
                    <div>
                      <span className="block text-[8px] text-slate-450 uppercase font-black tracking-wider leading-none">Completion Status</span>
                      <span className="text-[11px] sm:text-xs font-black text-slate-800">
                        {activeProject.completionStatus} ({activeProject.completionYear})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-2">
                  <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-0.5">Indicative Pricing Starts</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-orange-600">{formattedPrice}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">MYR</span>
                  </div>
                </div>
              </div>

              {/* Action and controls layout footer */}
              <div className="pt-8 mt-8 border-t border-slate-100 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-orange-600 leading-none group-hover:translate-x-1 duration-200 transition-transform select-none">
                  <span>Explore Fully</span>
                  <ArrowRight className="h-4 w-4" />
                </span>

                {/* Navigation Dot Indicators */}
                <div className="flex items-center gap-1">
                  {slideshowProjects.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(dotIdx);
                      }}
                      className={`h-1.5 transition-all duration-300 rounded-full ${
                        dotIdx === currentIndex ? "w-6 bg-orange-500" : "w-1.5 bg-slate-200 hover:bg-slate-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Manual Arrow Steering Control Triggers */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white hover:bg-orange-600 border border-slate-200 hover:border-orange-500 hover:text-white text-slate-600 rounded-full flex items-center justify-center transition-all shadow-lg focus:outline-none z-20 hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Previous Project"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white hover:bg-orange-600 border border-slate-200 hover:border-orange-500 hover:text-white text-slate-600 rounded-full flex items-center justify-center transition-all shadow-lg focus:outline-none z-20 hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Next Project"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Styled animation progress keyframes inside style block */}
      <style>{`
        @keyframes slideshowProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
