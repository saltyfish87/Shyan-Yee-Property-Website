import React, { useEffect, useState } from 'react';
import { Home, Building, FileText, Calculator, ArrowRight, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { Project } from '../types';
import { getInitialRouteState, RouteState } from '../utils/router';

interface RouterRedirectProps {
  attemptedPath: string;
  onNavigate: (page: string, project: Project | null, blogSlug: string | null) => void;
  autoRedirectSeconds?: number;
}

export const RouterRedirect: React.FC<RouterRedirectProps> = ({
  attemptedPath,
  onNavigate,
  autoRedirectSeconds = 4
}) => {
  const { language } = useLanguage();
  const [countdown, setCountdown] = useState(autoRedirectSeconds);
  const isZh = language.startsWith('zh');

  // Resolve whether attempted path is a recognized legacy mapping or non-existent
  const routeResolution: RouteState = getInitialRouteState(attemptedPath);
  const isLegacy = routeResolution.isLegacyRedirect && !!routeResolution.suggestedDestination;
  const suggested = routeResolution.suggestedDestination;

  useEffect(() => {
    // Replace state in browser history to normalize URL without broken back-button loops
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      const canonicalTarget = isLegacy && suggested?.blogSlug 
        ? `/blog/${suggested.blogSlug}` 
        : '/';
      window.history.replaceState({ redirectedFrom: attemptedPath }, '', canonicalTarget);
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (isLegacy && suggested) {
            onNavigate(suggested.page, suggested.project, suggested.blogSlug);
          } else {
            onNavigate('home', null, null);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [attemptedPath, isLegacy, suggested, onNavigate]);

  const handleManualAction = () => {
    if (isLegacy && suggested) {
      onNavigate(suggested.page, suggested.project, suggested.blogSlug);
    } else {
      onNavigate('home', null, null);
    }
  };

  return (
    <div id="router-redirect-404" className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-stone-200 p-8 sm:p-10 text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
          isLegacy ? 'bg-orange-50 text-orange-600' : 'bg-amber-50 text-amber-600'
        }`}>
          {isLegacy ? <Sparkles className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mb-3">
          {isLegacy 
            ? (isZh ? '已自动匹配最新官方指南' : 'Canonical Route Auto-Matched') 
            : (isZh ? '页面已安全重新定向' : 'Page Safely Redirected')}
        </h1>

        <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-6">
          {isLegacy && suggested
            ? (isZh 
                ? `您请求的旧版路径「/${attemptedPath}」已迁移并整合至权威指南「${suggested.label}」。正在为您直接载入最新版本。`
                : `The legacy URL "/${attemptedPath}" has been mapped to the updated canonical guide "${suggested.label}". Forwarding you to the verified content.`)
            : (isZh
                ? `您请求的路径「/${attemptedPath}」不存在或已被下线。为了保障浏览完整性与搜索引擎收录健康，正在为您导航至认证主页。`
                : `The requested path "/${attemptedPath}" was not found or is non-canonical. Redirecting you to the verified portal to ensure index health.`)}
        </p>

        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-8 text-xs sm:text-sm font-semibold text-stone-600 flex items-center justify-center gap-2">
          <span>{isZh ? '自动跳转倒计时：' : 'Auto-redirecting in:'}</span>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-600 text-white font-bold text-xs shadow-xs">
            {countdown}s
          </span>
        </div>

        {isLegacy && suggested && (
          <div className="mb-6 p-4 rounded-xl bg-orange-50/70 border border-orange-200 text-left">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-700 block mb-1">
              {isZh ? '推荐目标页面' : 'Target Destination'}
            </span>
            <div className="text-sm font-bold text-stone-900 truncate">
              {suggested.label}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
          <button
            id="redirect-btn-home"
            onClick={() => onNavigate('home', null, null)}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-stone-200 hover:border-orange-500 hover:bg-orange-50/50 transition-colors text-stone-800 font-bold text-sm cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
              <Home className="w-4 h-4" />
            </div>
            <span>{isZh ? '返回主页' : 'Return to Home'}</span>
          </button>

          <button
            id="redirect-btn-projects"
            onClick={() => onNavigate('projects', null, null)}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-stone-200 hover:border-orange-500 hover:bg-orange-50/50 transition-colors text-stone-800 font-bold text-sm cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Building className="w-4 h-4" />
            </div>
            <span>{isZh ? '楼盘项目组合' : 'Landmark Projects'}</span>
          </button>

          <button
            id="redirect-btn-blog"
            onClick={() => onNavigate('blog', null, null)}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-stone-200 hover:border-orange-500 hover:bg-orange-50/50 transition-colors text-stone-800 font-bold text-sm cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
              <FileText className="w-4 h-4" />
            </div>
            <span>{isZh ? '市场置业指南' : 'Market Guides'}</span>
          </button>

          <button
            id="redirect-btn-calculator"
            onClick={() => onNavigate('calculator', null, null)}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-stone-200 hover:border-orange-500 hover:bg-orange-50/50 transition-colors text-stone-800 font-bold text-sm cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <Calculator className="w-4 h-4" />
            </div>
            <span>{isZh ? '房贷计算器' : 'Loan Calculator'}</span>
          </button>
        </div>

        <button
          id="redirect-btn-proceed"
          onClick={handleManualAction}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-stone-900 to-stone-800 hover:from-orange-600 hover:to-orange-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          <span>{isLegacy ? (isZh ? '立即进入该指南' : 'Go to Guide Immediately') : (isZh ? '立即进入主页' : 'Go to Homepage Now')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
