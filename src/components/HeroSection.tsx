import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import { useCurrency } from '../CurrencyContext';
import { Search, MapPin, BedDouble, HelpCircle, DollarSign, Briefcase } from 'lucide-react';

interface HeroSectionProps {
  onSearch: (filters: { budget: string; bedrooms: string; location: string; developer: string; projectName?: string }) => void;
  onViewProjectsClick: () => void;
  availableLocations: string[];
  availableDevelopers: string[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSearch,
  onViewProjectsClick,
  availableLocations,
  availableDevelopers,
}) => {
  const { t, language } = useLanguage();
  const { currency } = useCurrency();

  const [budget, setBudget] = useState('any');
  const [bedrooms, setBedrooms] = useState('any');
  const [location, setLocation] = useState('any');
  const [projectName, setProjectName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ budget, bedrooms, location, developer: 'any', projectName });
  };

  const renderTitle = (rawText: string) => {
    const keywords = ["Malaysia", "马来西亚", "馬來西亞", "マレーシア", "말레이시아", "ماليزيا", "Malaisie"];
    for (const kw of keywords) {
      if (rawText.includes(kw)) {
        // Brand red marks the word; :lang() rules in index.css drop the italic for
        // CJK and Arabic, which have no italic cut.
        const parts = rawText.split(kw);
        return (
          <>
            {parts[0]}
            <em className="italic text-[#dc2743]">{kw}</em>
            {parts.slice(1).join(kw)}
          </>
        );
      }
    }
    return rawText;
  };

  return (
    <section id="hero-masthead" className="relative bg-slate-100/40 overflow-hidden min-h-[85vh] flex items-center md:py-24 py-16">
      {/* Background Skyline Image with overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://lh3.googleusercontent.com/d/1fAVXiXAlqMY-nv0w5wHt-oBtWl1Td5oS=w1600"
          alt="Kuala Lumpur Skyline"
          className="w-full h-full object-cover object-center opacity-100 scale-100"
        />
        <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Headline */}
        <h1 className="display rise text-[2.75rem] sm:text-6xl lg:text-[4.5rem] text-slate-900 max-w-3xl mb-6">
          {renderTitle(t('title'))}
        </h1>

        {/* Subheadline */}
        <p className="rise text-slate-600 text-base sm:text-lg max-w-xl mb-9 leading-relaxed" style={{ animationDelay: '.08s' }}>
          {t('subtitle')}
        </p>

        {/* CTAs */}
        <div className="rise flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-7" style={{ animationDelay: '.16s' }}>
          <button
            onClick={onViewProjectsClick}
            className="w-full sm:w-auto px-8 py-4 ig-gradient text-white font-semibold rounded-full shadow-lg shadow-rose-500/20 btn-hover cursor-pointer text-[15px]"
          >
            {t('viewProjects')}
          </button>
          <a
            href={`https://wa.me/60108278932?text=${encodeURIComponent(
              language.startsWith('zh') 
                ? "你好 Shyan Yee，我浏览了您的马来西亚房产综合信息平台，希望能咨询当前的优质楼盘项目并获取最新详情。谢谢！"
                : language === 'ja'
                ? "こんにちは Shyan Yee、マレーシア不動産ポータルを拝見しました。現在販売中のプロジェクトについて詳しく教えてください。"
                : "Hi Shyan Yee, I visited your Malaysia Property Portal and would like to get more information about the available premium projects. Thank you!"
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 font-semibold rounded-full border border-slate-300 transition-colors text-center cursor-pointer text-[15px]"
          >
            {t('whatsappConsultant')}
          </a>
        </div>

        {/* Who is behind the site. A licence number is the one credential a template never has. */}
        <p className="rise text-[13px] text-slate-500 mb-14 sm:mb-16" style={{ animationDelay: '.24s' }}>
          Yee Woei Shyan · REN 46305 · IQI Realty Sdn Bhd
        </p>

        {/* Budget Search Strip Container */}
        <div className="w-full bg-white rounded-3xl shadow-2xl shadow-slate-900/10 p-5 sm:p-6 border border-slate-100 text-slate-900 relative z-10">
          <p className="text-[13px] font-semibold text-slate-500 mb-4">
            {t('budgetSearch')}
          </p>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end text-left">
            {/* Project Name Filter */}
            <div>
              <label className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 mb-2">
                <Search className="h-3.5 w-3.5 text-orange-500" />
                {t('projectName') || 'Project Name'}
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder={t('projectNamePlaceholder') || 'Search e.g. Riverville...'}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-400 placeholder:text-slate-400/80 transition-all hover:bg-slate-100/70"
              />
            </div>

            {/* Location Filter */}
            <div>
              <label className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 mb-2">
                <MapPin className="h-3.5 w-3.5 text-orange-500" />
                {t('location')}
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-400 capitalize cursor-pointer hover:bg-slate-100/70 transition-colors"
              >
                <option value="any">{t('any')}</option>
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget Filter */}
            <div>
              <label className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 mb-2">
                <DollarSign className="h-3.5 w-3.5 text-orange-500" />
                {t('budget')} ({currency})
              </label>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-400 cursor-pointer hover:bg-slate-100/70 transition-colors"
              >
                <option value="any">{t('any')}</option>
                <option value="under500">Under 500k {currency}</option>
                <option value="500to1000">500k - 1M {currency}</option>
                <option value="1Mto2M">1M - 2M {currency}</option>
                <option value="above2M">Above 2M {currency}</option>
              </select>
            </div>

            {/* Rooms Filter */}
            <div>
              <label className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 mb-2">
                <BedDouble className="h-3.5 w-3.5 text-orange-500" />
                {t('rooms') || 'Rooms'}
              </label>
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-400 cursor-pointer hover:bg-slate-100/70 transition-colors"
              >
                <option value="any">{t('any')}</option>
                <option value="1">1+ Bedrooms</option>
                <option value="2">2+ Bedrooms</option>
                <option value="3">3+ Bedrooms</option>
                <option value="4">4+ Bedrooms</option>
              </select>
            </div>

            {/* Spark Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl ig-gradient text-white font-semibold flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-purple-500/10 active:scale-[0.98] transition-all cursor-pointer text-sm btn-hover"
            >
              <Search className="h-4 w-4" />
              <span>{t('search')}</span>
            </button>
          </form>
        </div>

      </div>
    </section>
  );
};
