import React from 'react';
import { Project } from '../types';
import { useLanguage } from '../LanguageContext';
import { useCurrency } from '../CurrencyContext';
import { X, Check, Landmark, Layers, MapPin, Gauge } from 'lucide-react';
import {
  translateTenure,
  translateCompletionStatus,
  translateProjectType,
  translateArea,
  translateDeveloper,
  translateMaintenanceFeeStr,
  translateTotalUnitsStr
} from '../utils/translator';

interface CompareModalProps {
  compareList: Project[];
  onClose: () => void;
  onProjectClick: (project: Project) => void;
  removeFromComparison: (id: string) => void;
  isPage?: boolean;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  compareList,
  onClose,
  onProjectClick,
  removeFromComparison,
  isPage = false,
}) => {
  const { t, language } = useLanguage();
  const { convertPrice } = useCurrency();
  const [highlightDiffs, setHighlightDiffs] = React.useState(false);

  if (compareList.length === 0) return null;

  // Let's create beautiful derived specifications that align with Malaysian real estate standards
  const getDerivedStats = (project: Project) => {
    let maintenanceFee = t('pendingVerif') || "Information Pending Verification";
    if (project.maintenanceFeeStr && project.maintenanceFeeStr.trim() !== "") {
      maintenanceFee = translateMaintenanceFeeStr(project.maintenanceFeeStr, language);
    } else if (project.maintenanceFee !== undefined && project.maintenanceFee !== null) {
      maintenanceFee = `RM ${project.maintenanceFee.toFixed(2)} / sqft`;
    }
      
    let carParks = t('pendingVerif') || "Information Pending Verification";
    if (project.carParksMin !== undefined && project.carParksMin !== null) {
      if (project.carParksMin === 0 && project.carParksMax === 0) {
        carParks = "No Dedicated Bay";
      } else {
        const range = project.carParksMin === project.carParksMax ? `${project.carParksMin}` : `${project.carParksMin}-${project.carParksMax}`;
        let baysWord = "Bays";
        if (language.startsWith('zh')) baysWord = "个车位";
        else if (language === 'ja') baysWord = "区画";
        else if (language === 'ko') baysWord = "개소";
        else if (language === 'ar') baysWord = "موقف";
        else if (language === 'fr') baysWord = "places";
        carParks = `${range} ${baysWord}`;
      }
    }

    const totalUnits = project.totalUnits && project.totalUnits.trim() !== ""
      ? translateTotalUnitsStr(project.totalUnits, language)
      : t('pendingVerif') || "Information Pending Verification";

    return {
      maintenanceFee,
      carParks,
      totalUnits,
    };
  };

  // Determine difference flags
  const hasPriceDiff = compareList.length > 1 && new Set(compareList.map(p => p.startingPrice)).size > 1;
  const hasDevDiff = compareList.length > 1 && new Set(compareList.map(p => p.developer.replace(/\(.*?\)/g, "").trim().toLowerCase())).size > 1;
  const hasAreaDiff = compareList.length > 1 && new Set(compareList.map(p => p.area.toLowerCase())).size > 1;
  const hasSizeDiff = compareList.length > 1 && new Set(compareList.map(p => `${p.builtUpMin}-${p.builtUpMax}`)).size > 1;
  const hasRoomsDiff = compareList.length > 1 && new Set(compareList.map(p => `${p.bedroomsMin}-${p.bedroomsMax}`)).size > 1;
  const hasTypeDiff = compareList.length > 1 && new Set(compareList.map(p => p.projectType.toLowerCase())).size > 1;
  const hasTenureDiff = compareList.length > 1 && new Set(compareList.map(p => p.tenure.toLowerCase())).size > 1;
  const hasStatusDiff = compareList.length > 1 && new Set(compareList.map(p => p.completionStatus.toLowerCase())).size > 1;
  const hasYearDiff = compareList.length > 1 && new Set(compareList.map(p => p.completionYear)).size > 1;
  const hasMaintDiff = compareList.length > 1 && new Set(compareList.map(p => getDerivedStats(p).maintenanceFee)).size > 1;
  const hasUnitsDiff = compareList.length > 1 && new Set(compareList.map(p => getDerivedStats(p).totalUnits)).size > 1;
  const hasParksDiff = compareList.length > 1 && new Set(compareList.map(p => getDerivedStats(p).carParks)).size > 1;

  const getRowClass = (hasDiff: boolean) => {
    const base = "grid grid-cols-4 gap-4 py-3 text-sm transition-all duration-200";
    if (highlightDiffs && hasDiff) {
      return `${base} bg-rose-50/70 text-slate-900 px-3 -mx-3 border-l-4 border-rose-500 rounded-r-lg font-medium`;
    }
    return base;
  };

  const specDefinitions = [
    {
      label: t('startingPriceTable'),
      hasDiff: hasPriceDiff,
      icon: <span className="text-emerald-500 font-black text-[10px]">RM</span>,
      getValue: (p: Project) => convertPrice(p.startingPrice).formatted,
    },
    {
      label: t('developer'),
      hasDiff: hasDevDiff,
      icon: <Landmark className="h-3.5 w-3.5 text-sky-500" />,
      getValue: (p: Project) => translateDeveloper(p.developer.replace(/\(.*?\)/g, "").trim(), language),
    },
    {
      label: t('areaNode'),
      hasDiff: hasAreaDiff,
      icon: <MapPin className="h-3.5 w-3.5 text-rose-500" />,
      getValue: (p: Project) => translateArea(p.area, language),
    },
    {
      label: language.startsWith('zh') ? '户型建筑面积' : language === 'ja' ? '専有面積' : 'Built-Up Size',
      hasDiff: hasSizeDiff,
      icon: <Gauge className="h-3.5 w-3.5 text-indigo-500" />,
      getValue: (p: Project) => `${p.builtUpMin} - ${p.builtUpMax} sqft`,
    },
    {
      label: language.startsWith('zh') ? '套内房间格局' : language === 'ja' ? '間取り・寝室数' : 'Rooms & Layouts',
      hasDiff: hasRoomsDiff,
      icon: <Check className="h-3.5 w-3.5 text-emerald-500" />,
      getValue: (p: Project) => `${p.bedroomsMin} - ${p.bedroomsMax} ${language.startsWith('zh') ? '房' : 'Beds'}`,
    },
    {
      label: t('propertyType'),
      hasDiff: hasTypeDiff,
      icon: <Layers className="h-3.5 w-3.5 text-orange-500" />,
      getValue: (p: Project) => translateProjectType(p.projectType, language),
    },
    {
      label: t('tenureTitle'),
      hasDiff: hasTenureDiff,
      icon: <Landmark className="h-3.5 w-3.5 text-teal-500" />,
      getValue: (p: Project) => translateTenure(p.tenure, language),
    },
    {
      label: t('constructionStatus'),
      hasDiff: hasStatusDiff,
      icon: <Check className="h-3.5 w-3.5 text-blue-500" />,
      getValue: (p: Project) => translateCompletionStatus(p.completionStatus, language),
    },
    {
      label: t('completion'),
      hasDiff: hasYearDiff,
      icon: <Layers className="h-3.5 w-3.5 text-purple-500" />,
      getValue: (p: Project) => p.completionYear !== "N/A" ? p.completionYear : (language.startsWith('zh') ? "全新推介" : "Pre-Launch"),
    },
    {
      label: t('maintenanceFee'),
      hasDiff: hasMaintDiff,
      icon: <Gauge className="h-3.5 w-3.5 text-amber-500" />,
      getValue: (p: Project) => getDerivedStats(p).maintenanceFee,
    },
    {
      label: t('totalUnits'),
      hasDiff: hasUnitsDiff,
      icon: <Layers className="h-3.5 w-3.5 text-pink-500" />,
      getValue: (p: Project) => getDerivedStats(p).totalUnits,
    },
    {
      label: t('carParkAlloc'),
      hasDiff: hasParksDiff,
      icon: <Gauge className="h-3.5 w-3.5 text-violet-500" />,
      getValue: (p: Project) => getDerivedStats(p).carParks,
    },
  ];

  const desktopContent = (
    <div className={`bg-white rounded-3xl overflow-hidden border border-slate-100 flex flex-col justify-between ${isPage ? 'w-full max-w-5xl' : 'shadow-2xl w-full max-w-5xl max-h-[90vh]'}`}>
      
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/55 select-none gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-bold text-slate-900">
            {t('compareProjects')} ({compareList.length} / 3 {language.startsWith('zh') ? '已选择' : 'Selected'})
          </h3>
        </div>
        <div className="flex items-center gap-4 ml-auto sm:ml-0">
          {/* Highlight Differences Toggle */}
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              id="diff-highlight-toggle"
              type="checkbox"
              checked={highlightDiffs}
              onChange={(e) => setHighlightDiffs(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#dc2743]"></div>
            <span className="text-xs font-bold text-slate-600 peer-checked:text-[#dc2743] transition-colors">
              {language.startsWith('zh') ? '高亮差异' : language === 'ja' ? '差異をハイライト' : 'Highlight Differences'}
            </span>
          </label>

          {!isPage && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-900 rounded-lg bg-white shadow-xs cursor-pointer"
            >
              <X className="h-5.5 w-5.5" />
            </button>
          )}
        </div>
      </div>

      {/* Matrix grid container */}
      <div className="p-6 overflow-x-auto flex-1">
        <div className="min-w-[650px] divide-y divide-slate-100">
          
          {/* Project Headers Block / Images */}
          <div className="grid grid-cols-4 gap-4 pb-6">
            <div className="flex flex-col justify-end">
              <span className="block text-xs font-black uppercase text-slate-400 tracking-widest leading-none mb-1">
                SPEC MATRIX
              </span>
              <p className="text-xs text-slate-500 font-medium">
                {language.startsWith('zh') ? '楼盘指标横向对比' : language === 'ja' ? '並行してスペック比較する' : 'Side-by-side comparatives'}
              </p>
            </div>

            {compareList.map((project) => {
              const { formatted: displayPrice } = convertPrice(project.startingPrice);
              return (
                <div key={project.id} className="relative group text-center flex flex-col justify-between">
                  <button
                    onClick={() => removeFromComparison(project.id)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/80 text-white hover:bg-slate-800 cursor-pointer z-10"
                    title="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  
                  <div className="aspect-[16/9] rounded-xl bg-slate-50 overflow-hidden mb-3">
                    <img
                      src={project.images?.overview?.[0] || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=800&auto=format&fit=crop"}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h4
                      onClick={() => { if (onClose) onClose(); onProjectClick(project); }}
                      className="text-sm font-extrabold text-slate-900 cursor-pointer hover:text-[#dc2743] transition-colors line-clamp-1"
                    >
                      {project.name}
                    </h4>
                    <p className="text-xs font-black text-[#dc2743] mt-1">{displayPrice}</p>
                  </div>
                </div>
              );
            })}

            {/* Pad blank columns if comparing < 3 */}
            {Array.from({ length: 3 - compareList.length }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-slate-400 bg-slate-50/10">
                <span className="text-xs font-semibold leading-none text-center">
                  {language.startsWith('zh') ? '在房源网格中添加其他楼盘' : language === 'ja' ? 'グリッドリストから他のプロジェクトを追加する' : 'Add another project from listing Grid'}
                </span>
              </div>
            ))}
          </div>

          {/* Price detail row */}
          <div className={getRowClass(hasPriceDiff)}>
            <div className={`font-bold pb-1 ${highlightDiffs && hasPriceDiff ? 'text-rose-700 font-extrabold' : 'text-slate-500'}`}>{t('startingPriceTable')}</div>
            {compareList.map((p) => {
              const { formatted } = convertPrice(p.startingPrice);
              return <div key={p.id} className={`font-black ${highlightDiffs && hasPriceDiff ? 'text-rose-900 text-[15px]' : 'text-slate-900'}`}>{formatted}</div>;
            })}
            {Array.from({ length: 3 - compareList.length }).map((_, i) => <div key={i}>—</div>)}
          </div>

          {/* Developer */}
          <div className={getRowClass(hasDevDiff)}>
            <div className={`font-bold ${highlightDiffs && hasDevDiff ? 'text-rose-700 font-extrabold' : 'text-slate-500'}`}>{t('developer')}</div>
            {compareList.map((p) => (
              <div key={p.id} className={`font-medium truncate ${highlightDiffs && hasDevDiff ? 'text-rose-900 font-extrabold' : 'text-slate-700'}`}>{translateDeveloper(p.developer.replace(/\(.*?\)/g, "").trim(), language)}</div>
            ))}
            {Array.from({ length: 3 - compareList.length }).map((_, i) => <div key={i}>—</div>)}
          </div>

          {/* Area */}
          <div className={getRowClass(hasAreaDiff)}>
            <div className={`font-bold ${highlightDiffs && hasAreaDiff ? 'text-rose-700 font-extrabold' : 'text-slate-500'}`}>{t('areaNode')}</div>
            {compareList.map((p) => (
              <div key={p.id} className={`font-semibold ${highlightDiffs && hasAreaDiff ? 'text-rose-900 font-extrabold' : 'text-slate-700'}`}>{translateArea(p.area, language)}</div>
            ))}
            {Array.from({ length: 3 - compareList.length }).map((_, i) => <div key={i}>—</div>)}
          </div>

          {/* Built Up Size */}
          <div className={getRowClass(hasSizeDiff)}>
            <div className={`font-bold ${highlightDiffs && hasSizeDiff ? 'text-rose-700 font-extrabold' : 'text-slate-500'}`}>
              {language.startsWith('zh') ? '户型建筑面积' : language === 'ja' ? '専有面積' : 'Built-Up Size'}
            </div>
            {compareList.map((p) => (
              <div key={p.id} className={`font-semibold ${highlightDiffs && hasSizeDiff ? 'text-rose-900 font-extrabold' : 'text-slate-700'}`}>{p.builtUpMin} - {p.builtUpMax} sqft</div>
            ))}
            {Array.from({ length: 3 - compareList.length }).map((_, i) => <div key={i}>—</div>)}
          </div>

          {/* Rooms range */}
          <div className={getRowClass(hasRoomsDiff)}>
            <div className={`font-bold ${highlightDiffs && hasRoomsDiff ? 'text-rose-700 font-extrabold' : 'text-slate-500'}`}>
              {language.startsWith('zh') ? '套内房间格局' : language === 'ja' ? '間取り・寝室数' : 'Rooms & Layouts'}
            </div>
            {compareList.map((p) => (
              <div key={p.id} className={`font-medium ${highlightDiffs && hasRoomsDiff ? 'text-rose-900 font-extrabold' : 'text-slate-700'}`}>
                {p.bedroomsMin} - {p.bedroomsMax} {language.startsWith('zh') ? '房' : 'Beds'}
              </div>
            ))}
            {Array.from({ length: 3 - compareList.length }).map((_, i) => <div key={i}>—</div>)}
          </div>

          {/* Property Type */}
          <div className={getRowClass(hasTypeDiff)}>
            <div className={`font-bold ${highlightDiffs && hasTypeDiff ? 'text-rose-700 font-extrabold' : 'text-slate-500'}`}>{t('propertyType')}</div>
            {compareList.map((p) => (
              <div key={p.id} className={`font-medium ${highlightDiffs && hasTypeDiff ? 'text-rose-900 font-extrabold' : 'text-slate-600'}`}>{translateProjectType(p.projectType, language)}</div>
            ))}
            {Array.from({ length: 3 - compareList.length }).map((_, i) => <div key={i}>—</div>)}
          </div>

          {/* Tenure */}
          <div className={getRowClass(hasTenureDiff)}>
            <div className={`font-bold ${highlightDiffs && hasTenureDiff ? 'text-rose-700 font-extrabold' : 'text-slate-500'}`}>{t('tenureTitle')}</div>
            {compareList.map((p) => (
              <div key={p.id} className={`font-semibold ${highlightDiffs && hasTenureDiff ? 'text-rose-900 font-extrabold' : 'text-slate-700'}`}>{translateTenure(p.tenure, language)}</div>
            ))}
            {Array.from({ length: 3 - compareList.length }).map((_, i) => <div key={i}>—</div>)}
          </div>

          {/* Progressive status */}
          <div className={getRowClass(hasStatusDiff)}>
            <div className={`font-bold ${highlightDiffs && hasStatusDiff ? 'text-rose-700 font-extrabold' : 'text-slate-500'}`}>{t('constructionStatus')}</div>
            {compareList.map((p) => (
              <div key={p.id} className={`font-medium ${highlightDiffs && hasStatusDiff ? 'text-rose-900 font-extrabold' : 'text-slate-600'}`}>{translateCompletionStatus(p.completionStatus, language)}</div>
            ))}
            {Array.from({ length: 3 - compareList.length }).map((_, i) => <div key={i}>—</div>)}
          </div>

          {/* Completion Year */}
          <div className={getRowClass(hasYearDiff)}>
            <div className={`font-bold ${highlightDiffs && hasYearDiff ? 'text-rose-700 font-extrabold' : 'text-slate-500'}`}>{t('completion')}</div>
            {compareList.map((p) => (
              <div key={p.id} className={`font-semibold ${highlightDiffs && hasYearDiff ? 'text-rose-900 font-extrabold' : 'text-slate-700'}`}>
                {p.completionYear !== "N/A" ? p.completionYear : (language.startsWith('zh') ? "全新推介" : "Pre-Launch")}
              </div>
            ))}
            {Array.from({ length: 3 - compareList.length }).map((_, i) => <div key={i}>—</div>)}
          </div>

          {/* Maintenance */}
          <div className={getRowClass(hasMaintDiff)}>
            <div className={`font-bold ${highlightDiffs && hasMaintDiff ? 'text-rose-700 font-extrabold' : 'text-slate-500'}`}>{t('maintenanceFee')}</div>
            {compareList.map((p) => {
              const specs = getDerivedStats(p);
              return <div key={p.id} className={`font-medium ${highlightDiffs && hasMaintDiff ? 'text-rose-900 font-extrabold' : 'text-slate-600'}`}>{specs.maintenanceFee}</div>;
            })}
            {Array.from({ length: 3 - compareList.length }).map((_, i) => <div key={i}>—</div>)}
          </div>

          {/* Total Units */}
          <div className={getRowClass(hasUnitsDiff)}>
            <div className={`font-bold ${highlightDiffs && hasUnitsDiff ? 'text-rose-700 font-extrabold' : 'text-slate-500'}`}>{t('totalUnits')}</div>
            {compareList.map((p) => {
              const specs = getDerivedStats(p);
              return <div key={p.id} className={`font-semibold ${highlightDiffs && hasUnitsDiff ? 'text-rose-900 font-extrabold' : 'text-slate-700'}`}>{specs.totalUnits}</div>;
            })}
            {Array.from({ length: 3 - compareList.length }).map((_, i) => <div key={i}>—</div>)}
          </div>

          {/* Parking space */}
          <div className={getRowClass(hasParksDiff)}>
            <div className={`font-bold ${highlightDiffs && hasParksDiff ? 'text-rose-700 font-extrabold' : 'text-slate-500'}`}>{t('carParkAlloc')}</div>
            {compareList.map((p) => {
              const specs = getDerivedStats(p);
              return <div key={p.id} className={`font-semibold ${highlightDiffs && hasParksDiff ? 'text-rose-900 font-extrabold' : 'text-slate-600'}`}>{specs.carParks}</div>;
            })}
            {Array.from({ length: 3 - compareList.length }).map((_, i) => <div key={i}>—</div>)}
          </div>

        </div>
      </div>

      {/* Footer actions */}
      {!isPage && (
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3 select-none col-span-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-full text-xs shadow-md transition-all cursor-pointer btn-hover"
          >
            {language.startsWith('zh') ? '关闭对比矩阵' : language === 'ja' ? 'マトリクスを閉じる' : 'Close Matrix'}
          </button>
        </div>
      )}

    </div>
  );

  const mobileContent = (
    <div className={`bg-white rounded-3xl overflow-hidden border border-slate-100 flex flex-col justify-between ${isPage ? 'w-full' : 'shadow-2xl w-full max-h-[90vh]'}`}>
      {/* Header bar */}
      <div className="px-4 py-4 border-b border-slate-50 flex flex-col gap-3 bg-slate-50/55 select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-orange-500" />
            <h3 className="text-sm font-bold text-slate-900">
              {t('compareProjects')} ({compareList.length} / 3)
            </h3>
          </div>
          {!isPage && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-900 rounded-lg bg-white shadow-xs cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {/* Toggle option */}
        <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-slate-100 shadow-xs">
          <span className="text-[11px] font-bold text-slate-600">
            {language.startsWith('zh') ? '高亮项目差异' : language === 'ja' ? '差異をハイライト' : 'Highlight Differences'}
          </span>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              id="diff-highlight-toggle-mobile"
              type="checkbox"
              checked={highlightDiffs}
              onChange={(e) => setHighlightDiffs(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#dc2743]"></div>
          </label>
        </div>
      </div>

      {/* Mobile Project Cards strip */}
      <div className="px-4 py-3 bg-slate-50/25 border-b border-slate-100 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 min-w-max">
          {compareList.map((project) => (
            <div key={project.id} className="bg-white border border-slate-150 p-2 rounded-2xl flex items-center gap-2 shadow-xs max-w-[180px] relative">
              <img
                src={project.images?.overview?.[0] || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=100&auto=format&fit=crop"}
                alt={project.name}
                className="w-10 h-10 object-cover rounded-xl shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="pr-5">
                <h4
                  onClick={() => { if (onClose) onClose(); onProjectClick(project); }}
                  className="text-[11px] font-extrabold text-slate-900 hover:text-[#dc2743] transition-colors line-clamp-1 cursor-pointer"
                >
                  {project.name}
                </h4>
                <p className="text-[9px] font-bold text-[#dc2743] mt-0.5">{convertPrice(project.startingPrice).formatted}</p>
              </div>
              <button
                onClick={() => removeFromComparison(project.id)}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {Array.from({ length: 3 - compareList.length }).map((_, i) => (
            <div key={i} className="border border-dashed border-slate-200 px-3 py-2 rounded-2xl text-slate-400 flex items-center justify-center text-[10px] font-medium min-w-[120px]">
              + {language.startsWith('zh') ? '添加其他楼盘' : 'Add Property'}
            </div>
          ))}
        </div>
      </div>

      {/* Spec list view */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4 max-h-[50vh] sm:max-h-[60vh]">
        {specDefinitions.map((spec, sIdx) => {
          const isHighlit = highlightDiffs && spec.hasDiff;
          return (
            <div key={sIdx} className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 pb-1.5 border-b border-slate-50">
                {spec.icon}
                <span>{spec.label}</span>
                {spec.hasDiff && (
                  <span className="ml-auto text-[9px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-full font-bold">
                    {language.startsWith('zh') ? '有差异' : 'Diff'}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {compareList.map((p) => (
                  <div 
                    key={p.id} 
                    className={`p-2.5 rounded-xl border transition-all text-left ${
                      isHighlit 
                        ? 'bg-rose-50/80 border-rose-100 text-rose-950' 
                        : 'bg-slate-50/50 border-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="text-[9px] font-extrabold text-slate-400 truncate mb-0.5 uppercase">
                      {p.name}
                    </div>
                    <div className="text-[11px] font-bold text-slate-900 leading-normal break-words">
                      {spec.getValue(p)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Footer */}
      {!isPage && (
        <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex justify-end select-none">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-full text-xs shadow-md transition-all cursor-pointer"
          >
            {language.startsWith('zh') ? '关闭对比矩阵' : language === 'ja' ? 'マトリクスを閉じる' : 'Close Matrix'}
          </button>
        </div>
      )}
    </div>
  );

  if (isPage) {
    return (
      <div className="w-full">
        <div className="hidden md:block">
          {desktopContent}
        </div>
        <div className="block md:hidden">
          {mobileContent}
        </div>
      </div>
    );
  }

  return (
    <div id="compare-matrix-backdrop" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="hidden md:block w-full max-w-5xl">
        {desktopContent}
      </div>
      <div className="block md:hidden w-full max-w-md">
        {mobileContent}
      </div>
    </div>
  );
};
