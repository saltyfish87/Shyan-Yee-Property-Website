import React, { useState, useMemo } from 'react';
import { Project } from '../types';
import { useCurrency } from '../CurrencyContext';
import { Search, MapPin, Check, Plus, AlertCircle, Layers, ArrowUpDown } from 'lucide-react';
import { translateArea } from '../utils/translator';

interface CompareProjectSelectorProps {
  projects: Project[];
  compareList: Project[];
  onToggleCompare: (project: Project) => void;
  language: string;
  t: (key: string) => string;
}

export const CompareProjectSelector: React.FC<CompareProjectSelectorProps> = ({
  projects,
  compareList,
  onToggleCompare,
  language,
  t,
}) => {
  const { convertPrice } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  // Derive unique areas for filtering
  const areas = useMemo(() => {
    const list = projects.map(p => p.area).filter((v, i, self) => self.indexOf(v) === i);
    return ['all', ...list.sort()];
  }, [projects]);

  // Filter projects by search query and area
  const filteredProjects = useMemo(() => {
    const filtered = projects.filter(p => {
      const matchesArea = selectedArea === 'all' || p.area === selectedArea;
      
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        p.name.toLowerCase().includes(query) ||
        p.developer.toLowerCase().includes(query) ||
        p.area.toLowerCase().includes(query) ||
        p.location.toLowerCase().includes(query);

      return matchesArea && matchesSearch;
    });

    // Apply Sorting
    if (sortBy === 'price-asc') {
      return [...filtered].sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (sortBy === 'price-desc') {
      return [...filtered].sort((a, b) => b.startingPrice - a.startingPrice);
    } else if (sortBy === 'completion-asc') {
      return [...filtered].sort((a, b) => {
        const yearA = parseInt(a.completionYear) || 9999;
        const yearB = parseInt(b.completionYear) || 9999;
        return yearA - yearB;
      });
    } else if (sortBy === 'completion-desc') {
      return [...filtered].sort((a, b) => {
        const yearA = parseInt(a.completionYear) || 0;
        const yearB = parseInt(b.completionYear) || 0;
        return yearB - yearA;
      });
    }

    return filtered;
  }, [projects, searchQuery, selectedArea, sortBy]);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="h-5 w-5 text-orange-500" />
            <span>
              {language.startsWith('zh') ? '快速选择楼盘进行对比' : 'Select Projects to Compare'}
            </span>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {compareList.length} / 3 {language.startsWith('zh') ? '已选择' : 'Selected'}
            </span>
          </h2>
          <p className="text-slate-500 text-xs mt-1 font-medium">
            {language.startsWith('zh') 
              ? '支持按楼盘名称、区域或开发商进行搜索，快速选择 1 至 3 款项目进行同屏对标分析。' 
              : 'Search and select up to 3 luxury residences for comprehensive side-by-side spec comparison.'}
          </p>
        </div>

        {/* Counter Info Banner */}
        {compareList.length === 3 && (
          <div className="bg-orange-50/50 border border-orange-100 px-3.5 py-1.5 rounded-2xl flex items-center gap-2 text-orange-700 text-xs font-semibold animate-fade-in">
            <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
            <span>
              {language.startsWith('zh') ? '已达3款上限，如需添加请先取消已选楼盘' : 'Comparison list full (max 3 properties reach)'}
            </span>
          </div>
        )}
      </div>

      {/* Filters & Search Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        {/* Search Field */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language.startsWith('zh') ? '输入楼盘、区域或开发商搜索...' : 'Search by property name, developer, or location...'}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-900 placeholder-slate-400 text-xs font-medium rounded-full border border-transparent focus:border-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500/10 transition-all"
          />
        </div>

        {/* Area Dropdown */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <MapPin className="h-4 w-4" />
          </span>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-900 text-xs font-semibold rounded-full border border-transparent focus:border-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500/10 cursor-pointer appearance-none transition-all"
          >
            <option value="all">
              {language.startsWith('zh') ? '全马所有区域' : 'All States / Regions'}
            </option>
            {areas.filter(a => a !== 'all').map((area) => (
              <option key={area} value={area}>
                {translateArea(area, language)}
              </option>
            ))}
          </select>
          <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 text-[10px] font-bold">
            ▼
          </span>
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <ArrowUpDown className="h-4 w-4" />
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-900 text-xs font-semibold rounded-full border border-transparent focus:border-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500/10 cursor-pointer appearance-none transition-all"
          >
            <option value="default">
              {language.startsWith('zh') ? '默认排序' : 'Default Sorting'}
            </option>
            <option value="price-asc">
              {language.startsWith('zh') ? '价格: 从低到高' : 'Price: Low to High'}
            </option>
            <option value="price-desc">
              {language.startsWith('zh') ? '价格: 从高到低' : 'Price: High to Low'}
            </option>
            <option value="completion-asc">
              {language.startsWith('zh') ? '完工: 最早完工' : 'Completion: Earliest'}
            </option>
            <option value="completion-desc">
              {language.startsWith('zh') ? '完工: 最新完工' : 'Completion: Newest'}
            </option>
          </select>
          <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 text-[10px] font-bold">
            ▼
          </span>
        </div>
      </div>

      {/* Projects Selection Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[290px] overflow-y-auto pr-1">
          {filteredProjects.map((p) => {
            const isSelected = compareList.some(item => item.id === p.id);
            const { formatted: price } = convertPrice(p.startingPrice);
            return (
              <div 
                key={p.id}
                onClick={() => onToggleCompare(p)}
                className={`group border rounded-2xl p-2.5 cursor-pointer flex flex-col justify-between transition-all duration-200 ${
                  isSelected 
                    ? 'bg-orange-50/15 border-orange-500/40 shadow-xs ring-1 ring-orange-500/15' 
                    : 'bg-[#FAF9F6]/40 hover:bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-50 mb-2 relative">
                    <img 
                      src={p.images?.overview?.[0] || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=300&auto=format&fit=crop"} 
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-orange-500/10 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="p-1 rounded-full bg-orange-500 text-white shadow-md animate-scale-up">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      </div>
                    )}
                  </div>
                  <h4 className="text-[11px] font-black text-slate-900 leading-tight line-clamp-1 group-hover:text-orange-600 transition-colors">
                    {p.name}
                  </h4>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5 flex items-center gap-0.5 truncate">
                    <MapPin className="h-2.5 w-2.5 shrink-0" />
                    <span>{translateArea(p.area, language)}</span>
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100/60 flex items-center justify-between gap-1">
                  <span className="text-[10px] font-black text-slate-800 shrink-0">
                    {price}
                  </span>
                  
                  {isSelected ? (
                    <span className="text-[9px] font-black text-orange-600 leading-none flex items-center gap-0.5 py-1 px-2 rounded-full bg-orange-50 border border-orange-100">
                      <span>{language.startsWith('zh') ? '已选' : 'Selected'}</span>
                    </span>
                  ) : (
                    <span className="text-[9px] font-black text-slate-500 group-hover:text-orange-500 leading-none flex items-center gap-0.5 py-1 px-2 rounded-full bg-slate-100 group-hover:bg-orange-50 border border-transparent group-hover:border-orange-100 transition-all">
                      <Plus className="h-2.5 w-2.5" />
                      <span>{language.startsWith('zh') ? '添加' : 'Add'}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-slate-100 rounded-2xl bg-slate-50/20">
          <span className="text-xs font-semibold text-slate-400">
            {language.startsWith('zh') ? '未找到符合搜索条件的楼盘项目' : 'No properties match your current search criteria.'}
          </span>
        </div>
      )}
    </div>
  );
};
