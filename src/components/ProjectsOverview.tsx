import React, { useState, useMemo } from 'react';
import { Project } from '../types';
import { useLanguage } from '../LanguageContext';
import { useCurrency } from '../CurrencyContext';
import { SlidersHorizontal, Eye, Plus, Check, ChevronRight, X, Building, DollarSign, Layout, Layers } from 'lucide-react';
import {
  translateTenure,
  translateCompletionStatus,
  translateProjectType,
  translateArea,
  translateDeveloper,
  translateLocation
} from '../utils/translator';

interface ProjectsOverviewProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  selectedCompareList: Project[];
  setCompareList: React.Dispatch<React.SetStateAction<Project[]>>;
  filterDefaults?: { budget: string; bedrooms: string; location: string; developer: string; projectName?: string } | null;
  clearFilterDefaults?: () => void;
}

export const ProjectsOverview: React.FC<ProjectsOverviewProps> = ({
  projects,
  onProjectClick,
  selectedCompareList,
  setCompareList,
  filterDefaults,
  clearFilterDefaults,
}) => {
  const { t, language } = useLanguage();
  const { convertPrice } = useCurrency();

  // Internal Filter States
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPriceBracket, setSelectedPriceBracket] = useState('all');
  const [selectedTenure, setSelectedTenure] = useState('all');
  const [selectedRooms, setSelectedRooms] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Advanced Filters requested by user
  const [selectedSize, setSelectedSize] = useState('all'); // Size
  const [selectedCarParks, setSelectedCarParks] = useState('all'); // Car Park
  const [selectedMaintenanceFee, setSelectedMaintenanceFee] = useState('all'); // Maintenance Fee
  const [locationKeyword, setLocationKeyword] = useState(''); // Location Substring
  const [selectedDeveloper, setSelectedDeveloper] = useState('all'); // Developer
  const [selectedProjectCategory, setSelectedProjectCategory] = useState('all'); // Project Type
  const [sortBy, setSortBy] = useState('default'); // 'default', 'price-asc', 'price-desc', 'completion-desc'

  // Load Search list parameters if searched from Hero
  React.useEffect(() => {
    if (filterDefaults) {
      if (filterDefaults.location && filterDefaults.location !== 'any') {
        setSelectedArea(filterDefaults.location);
      }
      if (filterDefaults.bedrooms && filterDefaults.bedrooms !== 'any') {
        setSelectedRooms(filterDefaults.bedrooms);
      }
      if (filterDefaults.budget && filterDefaults.budget !== 'any') {
        setSelectedPriceBracket(filterDefaults.budget);
      }
      if (filterDefaults.developer && filterDefaults.developer !== 'any') {
        setSelectedDeveloper(filterDefaults.developer);
      }
    }
  }, [filterDefaults]);

  // Derive unique filter ranges from loaded projects list safely
  const areas = useMemo(() => {
    const list = projects.map((p) => p.area).filter((v, i, self) => self.indexOf(v) === i);
    return list.sort();
  }, [projects]);

  const types = useMemo(() => {
    const list = projects.map((p) => p.projectType).filter((v, i, self) => self.indexOf(v) === i);
    return list.sort();
  }, [projects]);

  const developers = useMemo(() => {
    const list = projects.map((p) => p.developer.replace(/\(.*?\)/g, "").trim()).filter((v, i, self) => self.indexOf(v) === i);
    return list.sort();
  }, [projects]);

  // Filtering & Sorting Mechanism
  const filteredProjects = useMemo(() => {
    const filtered = projects.filter((project) => {
      // Project name text search match (from Hero Search)
      if (filterDefaults?.projectName && filterDefaults.projectName.trim() !== '') {
        const query = filterDefaults.projectName.toLowerCase();
        if (!project.name.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Area match
      if (selectedArea !== 'all' && project.area !== selectedArea && !project.location.includes(selectedArea)) {
        return false;
      }
      // Type match
      if (selectedType !== 'all' && project.projectType !== selectedType) {
        return false;
      }
      // Tenure match
      if (selectedTenure !== 'all' && project.tenure !== selectedTenure) {
        return false;
      }
      // Status match
      if (selectedStatus !== 'all' && project.completionStatus !== selectedStatus) {
        return false;
      }
      // Room match
      if (selectedRooms !== 'all') {
        const minRoomsReq = parseInt(selectedRooms);
        if (project.bedroomsMax < minRoomsReq) return false;
      }

      // Size match (built-up area in sqft)
      if (selectedSize !== 'all') {
        if (selectedSize === 'under800' && project.builtUpMin > 800) return false;
        if (selectedSize === '800to1200' && (project.builtUpMax < 800 || project.builtUpMin > 1200)) return false;
        if (selectedSize === 'above1200' && project.builtUpMax < 1200) return false;
      }

      // Location keyword match (searches both location and project name)
      if (locationKeyword) {
        const keyword = locationKeyword.toLowerCase();
        const matchesLocation = project.location.toLowerCase().includes(keyword);
        const matchesName = project.name.toLowerCase().includes(keyword);
        if (!matchesLocation && !matchesName) {
          return false;
        }
      }

      // Car Park match
      if (selectedCarParks !== 'all') {
        const reqCarParks = parseInt(selectedCarParks);
        const maxParks = project.carParksMax ?? 1;
        if (maxParks < reqCarParks) return false;
      }

      // Maintenance Fee match (max fee per sqft)
      if (selectedMaintenanceFee !== 'all') {
        const maxFeeReq = parseFloat(selectedMaintenanceFee);
        const fee = project.maintenanceFee ?? 0.35;
        if (fee > maxFeeReq) return false;
      }

      // Project Type match
      if (selectedProjectCategory !== 'all' && project.projectType !== selectedProjectCategory) {
        return false;
      }

      // Developer match
      if (selectedDeveloper !== 'all') {
        if (!project.developer.toLowerCase().includes(selectedDeveloper.toLowerCase())) {
          return false;
        }
      }

      // Special Hero developer filter if matching defaults (fallback override)
      if (filterDefaults?.developer && filterDefaults.developer !== 'any' && selectedDeveloper === 'all') {
        if (!project.developer.toLowerCase().includes(filterDefaults.developer.toLowerCase())) {
          return false;
        }
      }

      // Price matching (Converts RM values on the fly to match user currency)
      if (selectedPriceBracket !== 'all') {
        const { value: convertedPrice } = convertPrice(project.startingPrice);
        if (selectedPriceBracket === 'under500' && convertedPrice >= 500000) return false;
        if (selectedPriceBracket === '500to1000' && (convertedPrice < 500000 || convertedPrice > 1000000)) return false;
        if (selectedPriceBracket === '1Mto2M' && (convertedPrice < 1000000 || convertedPrice > 2000000)) return false;
        if (selectedPriceBracket === 'above2M' && convertedPrice <= 2000000) return false;
      }

      return true;
    });

    // Apply Sorting
    if (sortBy === 'price-asc') {
      return [...filtered].sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (sortBy === 'price-desc') {
      return [...filtered].sort((a, b) => b.startingPrice - a.startingPrice);
    } else if (sortBy === 'completion-asc') {
      return [...filtered].sort((a, b) => {
        // N/A or empty means pre-launch or very late, let's treat as late/9999
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
  }, [
    projects,
    selectedArea,
    selectedType,
    selectedTenure,
    selectedStatus,
    selectedRooms,
    selectedPriceBracket,
    selectedSize,
    locationKeyword,
    selectedCarParks,
    selectedMaintenanceFee,
    selectedProjectCategory,
    selectedDeveloper,
    filterDefaults,
    convertPrice,
    sortBy
  ]);

  // Toggle selection for property comparison
  const toggleCompare = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    const exists = selectedCompareList.some((p) => p.id === project.id);
    if (exists) {
      setCompareList((prev) => prev.filter((p) => p.id !== project.id));
    } else {
      if (selectedCompareList.length >= 3) {
        alert(t('comparisonLimit'));
        return;
      }
      setCompareList((prev) => [...prev, project]);
    }
  };

  const handleResetFilters = () => {
    setSelectedArea('all');
    setSelectedType('all');
    setSelectedPriceBracket('all');
    setSelectedTenure('all');
    setSelectedRooms('all');
    setSelectedStatus('all');
    setSelectedSize('all');
    setSelectedCarParks('all');
    setSelectedMaintenanceFee('all');
    setLocationKeyword('');
    setSelectedDeveloper('all');
    setSelectedProjectCategory('all');
    setSortBy('default');
    if (clearFilterDefaults) clearFilterDefaults();
  };

  return (
    <section id="projects-grid" className="py-16 bg-slate-50/30 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading & Reset indicator if filters active */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
          <div>
            <span className="block text-xs font-black uppercase tracking-widest ig-text mb-2 animate-fade-in">
              REAL-TIME INSPIRED
            </span>
            <h2 className="text-3xl lg:text-[40px] font-extrabold text-slate-900 tracking-tight leading-none">
              {t('allProjectsLabel')} <span className="text-slate-400 font-light text-2xl sm:text-3xl ml-2">({filteredProjects.length} Listings)</span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto self-stretch md:self-end justify-between md:justify-end">
            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                {language.startsWith('zh') ? '排序方式' : language === 'ja' ? '並び替え' : 'Sort by'}:
              </span>
              <select
                id="listing-sort-dropdown"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#dc2743]"
              >
                <option value="default">{language.startsWith('zh') ? '默认排序' : language === 'ja' ? '標準' : 'Default'}</option>
                <option value="price-asc">{language.startsWith('zh') ? '价格: 从低到高' : language === 'ja' ? '価格の安い順' : 'Price: Low to High'}</option>
                <option value="price-desc">{language.startsWith('zh') ? '价格: 从高到低' : language === 'ja' ? '価格の高い順' : 'Price: High to Low'}</option>
                <option value="completion-asc">{language.startsWith('zh') ? '完工年份: 最早 (现房优先)' : language === 'ja' ? '竣工年の古い順 (即入居可能優先)' : 'Completion Year: Earliest (Ready first)'}</option>
                <option value="completion-desc">{language.startsWith('zh') ? '完工年份: 最新' : language === 'ja' ? '竣工年の新しい順' : 'Completion Year: Latest (Newest first)'}</option>
              </select>
            </div>

            {(selectedArea !== 'all' || selectedType !== 'all' || selectedPriceBracket !== 'all' || selectedTenure !== 'all' || selectedRooms !== 'all' || selectedStatus !== 'all' || filterDefaults) && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-extrabold text-[#dc2743] bg-rose-50 hover:bg-rose-100/70 border border-rose-100 rounded-lg px-4 py-2 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <X className="h-4 w-4" />
                Reset Active Filters
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar panel */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xl shadow-slate-100/35 mb-10 space-y-4">
          <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-50">
            <SlidersHorizontal className="h-4.5 w-4.5 text-slate-500" />
            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">
              Instant Advanced Filtration
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* 1. Project or Location (Text Search) */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {language.startsWith('zh') ? '搜索项目/地段/地址' : language === 'ja' ? 'プロジェクト名・エリア・住所検索' : 'Search Project or Location'}
              </span>
              <input
                type="text"
                value={locationKeyword}
                onChange={(e) => setLocationKeyword(e.target.value)}
                placeholder={language.startsWith('zh') ? '输入项目、地段、地址...' : language === 'ja' ? 'プロジェクト名、エリア、住所を入力...' : 'Search project, location, address...'}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-400 focus:bg-white"
              />
            </div>

            {/* 2. Area (Region) */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t('area')} ({language.startsWith('zh') ? '区域' : language === 'ja' ? '地区' : 'Region'})
              </span>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-400 cursor-pointer"
              >
                <option value="all">{t('all')}</option>
                {areas.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* 3. Price (Budget limits) */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t('price')} ({language.startsWith('zh') ? '预算预算' : language === 'ja' ? '予算' : 'Budget'})
              </span>
              <select
                value={selectedPriceBracket}
                onChange={(e) => setSelectedPriceBracket(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-400 cursor-pointer"
              >
                <option value="all">{t('all')}</option>
                <option value="under500">{language.startsWith('zh') ? '50万令吉以下' : language === 'ja' ? '50万RM未満' : 'Under 500k'}</option>
                <option value="500to1000">{language.startsWith('zh') ? '50万-100万吉' : language === 'ja' ? '50万-100万RM' : '500k - 1M'}</option>
                <option value="1Mto2M">{language.startsWith('zh') ? '100万-200万吉' : language === 'ja' ? '100万-200万RM' : '1M - 2M'}</option>
                <option value="above2M">{language.startsWith('zh') ? '200万令吉以上' : language === 'ja' ? '200万RM以上' : 'Above 2M'}</option>
              </select>
            </div>

            {/* 4. Room (Bedrooms) */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t('rooms')} ({language.startsWith('zh') ? '卧室卧室' : language === 'ja' ? '寝室' : 'Bedrooms'})
              </span>
              <select
                value={selectedRooms}
                onChange={(e) => setSelectedRooms(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-400 cursor-pointer"
              >
                <option value="all">{t('all')}</option>
                <option value="1">{language.startsWith('zh') ? '1 房以上' : language === 'ja' ? '1寝室以上' : '1+ Bedrooms'}</option>
                <option value="2">{language.startsWith('zh') ? '2 房以上' : language === 'ja' ? '2寝室以上' : '2+ Bedrooms'}</option>
                <option value="3">{language.startsWith('zh') ? '3 房以上' : language === 'ja' ? '3寝室以上' : '3+ Bedrooms'}</option>
                <option value="4">{language.startsWith('zh') ? '4 房以上' : language === 'ja' ? '4寝室以上' : '4+ Bedrooms'}</option>
              </select>
            </div>

            {/* 5. Size (Built up range) */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {language.startsWith('zh') ? '面积大小 (平方尺)' : language === 'ja' ? '専有面積 (sqft)' : 'Size (sqft)'}
              </span>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-400 cursor-pointer"
              >
                <option value="all">{t('all')}</option>
                <option value="under800">{language.startsWith('zh') ? '800 平方尺以下' : language === 'ja' ? '800 sqft 未満' : 'Under 800 sqft'}</option>
                <option value="800to1200">{language.startsWith('zh') ? '800 - 1,200 平方尺' : language === 'ja' ? '800 - 1,200 sqft' : '800 - 1,200 sqft'}</option>
                <option value="above1200">{language.startsWith('zh') ? '1,200 平方尺以上' : language === 'ja' ? '1,200 sqft 以上' : 'Above 1,200 sqft'}</option>
              </select>
            </div>

            {/* 6. Type (Property Type) */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('type')}</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-400 cursor-pointer"
              >
                <option value="all">{t('all')}</option>
                {types.map((ty) => (
                  <option key={ty} value={ty}>{ty}</option>
                ))}
              </select>
            </div>

            {/* 7. Car Park */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {language.startsWith('zh') ? '车位配额' : language === 'ja' ? '駐車場' : 'Car Park'}
              </span>
              <select
                value={selectedCarParks}
                onChange={(e) => setSelectedCarParks(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-400 cursor-pointer"
              >
                <option value="all">{t('all')}</option>
                <option value="1">{language.startsWith('zh') ? '1 个车位以上' : language === 'ja' ? '1台分以上' : '1+ Spaces'}</option>
                <option value="2">{language.startsWith('zh') ? '2 个车位以上' : language === 'ja' ? '2台分以上' : '2+ Spaces'}</option>
                <option value="3">{language.startsWith('zh') ? '3 个车位以上' : language === 'ja' ? '3台分以上' : '3+ Spaces'}</option>
              </select>
            </div>

            {/* 8. Maintenance Fee */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {language.startsWith('zh') ? '物业费 (上限)' : language === 'ja' ? '管理費 (最高)' : 'Maint. Fee (Max)'}
              </span>
              <select
                value={selectedMaintenanceFee}
                onChange={(e) => setSelectedMaintenanceFee(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-400 cursor-pointer"
              >
                <option value="all">{t('all')}</option>
                <option value="0.30">≤ RM 0.30 / sqft</option>
                <option value="0.35">≤ RM 0.35 / sqft</option>
                <option value="0.40">≤ RM 0.40 / sqft</option>
              </select>
            </div>

            {/* 9. Tenure */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('tenure')}</span>
              <select
                value={selectedTenure}
                onChange={(e) => setSelectedTenure(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-400 cursor-pointer"
              >
                <option value="all">{t('all')}</option>
                <option value="Freehold">{language.startsWith('zh') ? '永久产权 (Freehold)' : language === 'ja' ? '所有権 (Freehold)' : 'Freehold'}</option>
                <option value="Leasehold">{language.startsWith('zh') ? '租赁产权 (Leasehold)' : language === 'ja' ? '借地権 (Leasehold)' : 'Leasehold'}</option>
              </select>
            </div>

            {/* 10. Project Type */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {language.startsWith('zh') ? '物业类别' : language === 'ja' ? '物件種別' : 'Project Type'}
              </span>
              <select
                value={selectedProjectCategory}
                onChange={(e) => setSelectedProjectCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-400 cursor-pointer"
              >
                <option value="all">{t('all')}</option>
                {types.map((ty) => (
                  <option key={ty} value={ty}>{ty}</option>
                ))}
              </select>
            </div>

            {/* 11. Developer */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {language.startsWith('zh') ? '品牌开发商' : language === 'ja' ? '開発デベロッパー' : 'Developer'}
              </span>
              <select
                value={selectedDeveloper}
                onChange={(e) => setSelectedDeveloper(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-400 cursor-pointer"
              >
                <option value="all">{t('all')}</option>
                {developers.map((dev) => (
                  <option key={dev} value={dev}>{dev}</option>
                ))}
              </select>
            </div>

            {/* 12. Completion Status */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {language.startsWith('zh') ? '交付状态' : language === 'ja' ? '竣工ステータス' : 'Completion Status'}
              </span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-400 cursor-pointer"
              >
                <option value="all">{t('all')}</option>
                <option value="Under Construction">{language.startsWith('zh') ? '在建中 (Under Construction)' : language === 'ja' ? '建設中 (Under Construction)' : 'Under Construction'}</option>
                <option value="Ready To Move">{language.startsWith('zh') ? '现房交付 (Ready To Move)' : language === 'ja' ? '即入居可能 (Ready To Move)' : 'Ready To Move'}</option>
                <option value="New Launch">{language.startsWith('zh') ? '首发推介 (New Launch)' : language === 'ja' ? '新規立ち上げ (New Launch)' : 'New Launch'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listings Display Grid */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 text-center py-20 px-6 max-w-lg mx-auto shadow-md">
            <Building className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {language.startsWith('zh') ? '无符合条件的房源' : language === 'ja' ? '該当する物件が見つかりません' : 'No Matching Listings'}
            </h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">
              {t('noProjectsFound')}
            </p>
            <button
              onClick={handleResetFilters}
              className="px-6 py-2.5 ig-gradient font-black text-white text-xs rounded-xl hover:opacity-95 shadow-md cursor-pointer select-none"
            >
              {language.startsWith('zh') ? '重置筛选条件' : language === 'ja' ? 'フィルターをクリア' : 'Reset Filters'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => {
              const { formatted: displayPrice } = convertPrice(project.startingPrice);
              const isComparing = selectedCompareList.some((p) => p.id === project.id);

              return (
                <article
                  key={project.id}
                  onClick={() => onProjectClick(project)}
                  className="bg-white rounded-[24px] border border-slate-100 overflow-hidden shadow-xs hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative">
                    {/* Primary Photo */}
                    <div className="aspect-[4/3] bg-slate-50 overflow-hidden relative">
                      {project.images?.overview && project.images.overview.length > 0 && project.images.overview[0] ? (
                        <img
                          src={project.images.overview[0]}
                          alt={project.name}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-6 text-center select-none">
                          <Building className="h-10 w-10 text-slate-300 mb-2" />
                          <p className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                            Media Pending Verification
                          </p>
                          <p className="text-[10px] text-slate-300 italic mt-1 font-medium">
                            Folder pending setup in Google Drive
                          </p>
                        </div>
                      )}
                      {/* Gradient Bottom overlay */}
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/60 to-transparent" />
                    </div>

                    {/* Compare Selection Overlay Top Right */}
                    <button
                      onClick={(e) => toggleCompare(project, e)}
                      title="Compare this project"
                      className={`absolute top-4 right-4 p-2 rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer ${
                        isComparing
                          ? 'ig-gradient text-white scale-110'
                          : 'bg-white/85 text-slate-700 hover:bg-white hover:text-pink-600'
                      }`}
                    >
                      {isComparing ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </button>

                    {/* Status badge bottom left */}
                    <div className="absolute bottom-4 left-4 flex gap-1.5 items-center">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-950/75 backdrop-blur-md text-white border border-white/10">
                        {translateCompletionStatus(project.completionStatus, language)}
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-500/90 text-white">
                        {translateProjectType(project.projectType, language)}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Dev Name */}
                      <span className="block text-[11px] font-bold uppercase tracking-widest text-[#dc2743] mb-1.5 leading-none select-none">
                        {translateDeveloper(project.developer.replace(/\(.*?\)/g, "").trim(), language) /* clean up parentheses name */}
                      </span>
                      {/* Property Name */}
                      <h3 className="text-xl font-[800] text-slate-900 mb-2 truncate group-hover:text-[#dc2743] transition-colors">
                        {project.name}
                      </h3>
                      {/* Location text */}
                      <p className="text-slate-500 text-xs truncate mb-4 select-none font-medium">
                        {translateLocation(project.location, language)}
                      </p>

                      {/* Info matrix */}
                      <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 border-t border-slate-50 pt-4 mb-4 select-none">
                        <div className="flex items-center gap-2">
                          <Layout className="h-4.5 w-4.5 text-slate-400" />
                          <div className="text-left">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase leading-none">{t('size')}</span>
                            <span className="text-xs font-semibold text-slate-700">
                              {project.builtUpMin} - {project.builtUpMax} {language.startsWith('zh') ? '平方尺' : language === 'ja' ? '平方フィート' : 'sqft'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Layers className="h-4.5 w-4.5 text-slate-400" />
                          <div className="text-left">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase leading-none">{t('rooms')}</span>
                            <span className="text-xs font-semibold text-slate-700">
                              {project.bedroomsMin} - {project.bedroomsMax} {language.startsWith('zh') ? '房' : language === 'ja' ? '寝室' : language === 'ko' ? '룸' : language === 'ar' ? 'غرف' : language === 'fr' ? 'Chambres' : 'Beds'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Building className="h-4.5 w-4.5 text-slate-400" />
                          <div className="text-left">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase leading-none">{t('tenure')}</span>
                            <span className="text-xs font-semibold text-slate-700 truncate block max-w-[100px]">
                              {translateTenure(project.tenure, language)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4.5 w-4.5 text-slate-400" />
                          <div className="text-left">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase leading-none">{t('constructionStatus')}</span>
                            <span className="text-xs font-semibold text-slate-700">
                              {project.completionYear !== "N/A" ? project.completionYear : (language.startsWith('zh') ? "全新推介" : language === 'ja' ? "プレローンチ" : "Launching")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom strip Price & Arrow */}
                    <div className="border-t border-slate-50 pt-4 mt-auto flex items-center justify-between">
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase leading-none mb-1 select-none">{t('startingPrice')}</span>
                        <span className="text-lg font-extrabold bg-gradient-to-r from-orange-500 to-pink-600 text-transparent bg-clip-text">
                          {displayPrice}
                        </span>
                      </div>

                      <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-[#dc2743] group-hover:text-white transition-all text-slate-400">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </div>

                  </div>
                </article>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};
