import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import { useCurrency } from '../CurrencyContext';
import { SupportedLanguage, SupportedCurrency } from '../types';
import { Building2, Globe, Coins, Menu, X, Landmark, RefreshCw } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  onSmartMatchClick: () => void;
  onRefreshClick?: () => void;
  isSyncing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentPage, 
  setCurrentPage, 
  onSmartMatchClick,
  onRefreshClick,
  isSyncing = false
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDevPreview = typeof window !== 'undefined' && (
    window.location.hostname.includes('localhost') || 
    window.location.hostname.includes('127.0.0.1') ||
    (window.self !== window.top && (
      window.location.hostname.includes('ais-dev-') || 
      window.location.hostname.includes('ais-pre-')
    ))
  );

  const languages: { code: SupportedLanguage; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'zh-CN', label: '简体中文' },
    { code: 'zh-TW', label: '繁體中文' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'ar', label: 'العربية' },
    { code: 'fr', label: 'Français' },
  ];

  const currencies: SupportedCurrency[] = ['MYR', 'SGD', 'USD', 'CNY'];

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'projects', label: 'Projects' },
    { id: 'compare', label: 'Compare' },
    { id: 'map', label: 'Map Explorer' },
    { id: 'blog', label: 'Market Blog' },
    { id: 'calculator', label: 'Calculator' },
  ];

  return (
    <header id="main-header" className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentPage('home')}>
            <div className="w-9 h-9 ig-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight ig-text block leading-none">
                MALAYSIA PROPERTY
              </span>
              <span className="block text-[8.5px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
                Premier Property Portal
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 self-stretch">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`text-[14px] font-bold transition-all duration-200 cursor-pointer h-full relative px-1 flex items-center ${
                  currentPage === item.id 
                    ? 'text-slate-900 border-b-2 border-slate-900 font-extrabold' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {item.id === 'compare'
                  ? t('compareProjects')
                  : item.id === 'calculator'
                  ? (language.startsWith('zh') ? '金融计算器' : language === 'ja' ? '計算ツール' : language === 'ko' ? '금융 계산기' : 'Calculator Hub')
                  : t(item.id === 'home' ? 'home' : item.id === 'projects' ? 'viewProjects' : item.id === 'map' ? 'interactiveMap' : 'blogTitle').replace(/Malaysia|Property|Portal|Analyses|&|SEO|Insights|\/|\-|博客|地产智库|不動産の分析|부동산|지식/g, '').trim() || item.label}
              </button>
            ))}
          </nav>

          {/* Switchers & CTA */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-bold bg-slate-50 hover:bg-slate-100 rounded-full cursor-pointer transition-all border border-transparent hover:border-slate-200">
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                <span>{languages.find(l => l.code === language)?.label}</span>
              </button>
              <div className="absolute right-0 mt-1.5 w-40 bg-white border border-slate-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`block w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors ${
                        language === lang.code ? 'font-bold ig-text bg-orange-50/50' : ''
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Currency Selector */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-bold bg-slate-50 hover:bg-slate-100 rounded-full cursor-pointer transition-all border border-transparent hover:border-slate-200">
                <Coins className="h-3.5 w-3.5 text-slate-400" />
                <span>{currency}</span>
              </button>
              <div className="absolute right-0 mt-1.5 w-32 bg-white border border-slate-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-1">
                  {currencies.map((cur) => (
                    <button
                      key={cur}
                      onClick={() => setCurrency(cur)}
                      className={`block w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors ${
                        currency === cur ? 'font-bold ig-text bg-orange-50/50' : ''
                      }`}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Force Re-sync Google Drive images and Google Sheets database */}
            {isDevPreview && onRefreshClick && (
              <button
                onClick={onRefreshClick}
                disabled={isSyncing}
                title="Refresh and sync live data from Google Sheets & Google Drive"
                className="flex items-center gap-1.5 px-3 py-1.5 text-orange-600 hover:text-white bg-orange-50 hover:bg-orange-600 rounded-full cursor-pointer transition-all border border-orange-200/50 text-xs font-black select-none disabled:opacity-50 disabled:pointer-events-none hover:shadow-xs mr-2"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? (language.startsWith('zh') ? '正在同步...' : 'Syncing...') : (language.startsWith('zh') ? '同步谷歌表格' : 'Sync Sheet')}</span>
              </button>
            )}

            {/* Immersive UI WhatsApp CTA Agent Button */}
            <a
              href={`https://wa.me/60195598932?text=${encodeURIComponent(
                language.startsWith('zh') 
                  ? "您好 Shyan Yee，我正在浏览您的马来西亚房产门户，希望能咨询当前在售的热门楼盘项目与其最新优惠。谢谢！"
                  : language === 'ja'
                  ? "こんにちは Shyan Yee、マレーシア不動産一覧を見ています。いくつかおすすめの優良物件を教えてください。"
                  : "Hi Shyan Yee, I'm exploring your Malaysian Property Portal and would love to consult with you on standard property listings. Thank you!"
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ig-gradient text-white px-5 py-2 rounded-full text-xs font-black shadow-md shadow-orange-500/15 hover:shadow-orange-500/25 btn-hover no-underline inline-block whitespace-nowrap select-none"
            >
              {language.startsWith('zh') ? '咨询顾问 (WhatsApp)' : language === 'ja' ? '相談する' : 'WhatsApp Agent'}
            </a>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-stone-100 px-4 py-4 space-y-3 shadow-lg">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-lg text-base font-semibold ${
                  currentPage === item.id 
                    ? 'bg-rose-50 text-pink-600' 
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                {item.id === 'compare'
                  ? t('compareProjects')
                  : item.id === 'calculator'
                  ? (language.startsWith('zh') ? '金融计算器' : language === 'ja' ? '計算ツール' : language === 'ko' ? '금융 계산기' : 'Calculator Hub')
                  : t(item.id === 'home' ? 'home' : item.id === 'projects' ? 'viewProjects' : item.id === 'map' ? 'interactiveMap' : 'blogTitle').replace(/Malaysia|Property|Portal|Analyses|&|SEO|Insights|\/|\-|博客|地产智库|不動産の分析|부동산|지식/g, '').trim() || item.label}
              </button>
            ))}
          </div>

          <hr className="border-stone-100" />

          {/* Mobile selectors */}
          <div className="flex items-center justify-between gap-4 py-2">
            <div>
              <span className="block text-xs font-bold uppercase text-stone-400 mb-1">Language</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                className="w-full bg-stone-50 border border-stone-100 rounded-md p-1.5 text-sm text-stone-700 font-medium"
              >
                {languages.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-xs font-bold uppercase text-stone-400 mb-1">Currency</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
                className="w-full bg-stone-50 border border-stone-100 rounded-md p-1.5 text-sm text-stone-700 font-medium"
              >
                {currencies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {isDevPreview && onRefreshClick && (
            <div className="pt-1">
              <button
                onClick={() => {
                  onRefreshClick();
                  setMobileMenuOpen(false);
                }}
                disabled={isSyncing}
                className="w-full py-2.5 bg-orange-50 hover:bg-orange-600 border border-orange-200/50 text-orange-600 hover:text-white font-black text-xs rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? (language.startsWith('zh') ? '正在同步数据...' : 'Syncing Sheet Data...') : (language.startsWith('zh') ? '同步谷歌表格数据' : 'Sync Google Sheet Data')}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
