import React from 'react';
import { useLanguage } from '../LanguageContext';
import { Columns, Calculator, Map, BookOpen, ChevronRight } from 'lucide-react';

interface FeatureGridProps {
  onComparisonClick: () => void;
  onCalculatorClick: () => void;
  onMapClick: () => void;
  onGuideClick: () => void;
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({
  onComparisonClick,
  onCalculatorClick,
  onMapClick,
  onGuideClick,
}) => {
  const { t } = useLanguage();

  const tools = [
    {
      icon: <Columns className="h-6 w-6 text-orange-500" />,
      title: t('comparisonTool'),
      desc: t('comparisonToolDesc'),
      action: onComparisonClick,
      color: "from-orange-500/10 to-orange-500/5 hover:border-orange-200"
    },
    {
      icon: <Calculator className="h-6 w-6 text-rose-500" />,
      title: t('loanCalculator'),
      desc: t('loanCalculatorDesc'),
      action: onCalculatorClick,
      color: "from-rose-500/10 to-rose-500/5 hover:border-rose-200"
    },
    {
      icon: <Map className="h-6 w-6 text-pink-500" />,
      title: t('interactiveMap'),
      desc: t('interactiveMapDesc'),
      action: onMapClick,
      color: "from-pink-500/10 to-pink-500/5 hover:border-pink-200"
    },
    {
      icon: <BookOpen className="h-6 w-6 text-purple-500" />,
      title: t('buyingGuide'),
      desc: t('buyingGuideDesc'),
      action: onGuideClick,
      color: "from-purple-500/10 to-purple-500/5 hover:border-purple-200"
    }
  ];

  return (
    <section id="explore-tools" className="py-20 bg-slate-50/50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="block text-xs font-black uppercase ig-text tracking-widest mb-3">
            {t('portalIntelligence')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('exploreTools')}
          </h2>
          <p className="mt-4 text-slate-500 text-[16px] sm:text-lg font-medium">
            {t('exploreToolsDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tools.map((tool, i) => (
            <div
              key={i}
              onClick={tool.action}
              className={`bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col justify-between hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1`}
            >
              <div>
                <div className="p-3 bg-slate-50 rounded-xl w-fit mb-5 group-hover:scale-110 transition-transform">
                  {tool.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#dc2743] transition-colors">
                  {tool.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {tool.desc}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-black text-[#dc2743] uppercase tracking-widest mt-6 group-hover:gap-2.5 transition-all">
                {t('launchTool')}
                <ChevronRight className="h-4.5 w-4.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
