import React from 'react';
import { useLanguage } from '../LanguageContext';
import { Columns, Calculator, Map, BookOpen, ArrowRight } from 'lucide-react';

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

  // Widths differ on purpose: the map and the guide are what people actually open,
  // so they get the room. Four identical cards is the shape this page had before.
  const tools = [
    {
      icon: <Map className="h-5 w-5 text-pink-500" />,
      title: t('interactiveMap'),
      desc: t('interactiveMapDesc'),
      action: onMapClick,
      span: 'lg:col-span-7',
    },
    {
      icon: <Columns className="h-5 w-5 text-orange-500" />,
      title: t('comparisonTool'),
      desc: t('comparisonToolDesc'),
      action: onComparisonClick,
      span: 'lg:col-span-5',
    },
    {
      icon: <Calculator className="h-5 w-5 text-rose-500" />,
      title: t('loanCalculator'),
      desc: t('loanCalculatorDesc'),
      action: onCalculatorClick,
      span: 'lg:col-span-5',
    },
    {
      icon: <BookOpen className="h-5 w-5 text-purple-500" />,
      title: t('buyingGuide'),
      desc: t('buyingGuideDesc'),
      action: onGuideClick,
      span: 'lg:col-span-7',
    },
  ];

  return (
    <section id="explore-tools" className="py-24 bg-slate-50/50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <h2 className="display text-4xl sm:text-5xl text-slate-900">
            {t('exploreTools')}
          </h2>
          <p className="mt-5 text-slate-500 text-base leading-relaxed">
            {t('exploreToolsDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {tools.map((tool, i) => (
            <div
              key={i}
              onClick={tool.action}
              className={`${tool.span} bg-white rounded-2xl border border-slate-200/70 p-7 flex flex-col justify-between hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5 transition-all duration-300 cursor-pointer group`}
            >
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  {tool.icon}
                  <h3 className="text-lg font-semibold text-slate-900">
                    {tool.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed max-w-md">
                  {tool.desc}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-sm font-medium text-[#dc2743] mt-8 group-hover:gap-3 transition-all">
                {t('launchTool')}
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
