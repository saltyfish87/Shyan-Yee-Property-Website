import React, { useState, useMemo } from 'react';
import { BlogArticle } from '../types';
import { BLOG_DATA } from '../data';
import { useLanguage } from '../LanguageContext';
import { API_BASE_URL } from '../utils/api';
import { PRE_TRANSLATED_BLOGS, PRE_TRANSLATED_BLOG_DETAILS } from '../translations';
import { Search, Calendar, User, Clock, ArrowLeft, ChevronRight, MessageCircle, Share2, HelpCircle } from 'lucide-react';

interface BlogViewProps {
  onProjectNavigate: (id: string) => void;
  onBlogNavigate: (slug: string) => void;
  activeBlogSlug?: string | null;
}

const ShimmerCard = () => (
  <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4 animate-pulse text-left">
    <div className="aspect-[16/10] bg-slate-200 rounded-2xl w-full" />
    <div className="h-4 bg-slate-200 rounded w-1/3" />
    <div className="h-6 bg-slate-200 rounded w-5/6" />
    <div className="h-8 bg-slate-200 rounded w-2/3" />
  </div>
);

const ShimmerArticle = () => (
  <section className="py-16 bg-slate-50/30 text-slate-900 border-t border-slate-100">
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="h-10 bg-slate-200 rounded-full w-40 mb-8 animate-pulse" />
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-10 shadow-lg space-y-6 animate-pulse text-left">
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="h-10 bg-slate-200 rounded w-3/4" />
        <div className="aspect-[21/9] bg-slate-200 rounded-2xl w-full" />
        <div className="h-20 bg-slate-100 rounded-xl w-full" />
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-5/6" />
          <div className="h-4 bg-slate-200 rounded w-4/5" />
        </div>
      </div>
    </div>
  </section>
);

const renderTextWithFormatting = (text: string, onBlogNavigate: (slug: string) => void) => {
  const parts = text.split(/\*\*([^\*]+)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 !== 0) {
      return (
        <strong key={index} className="font-extrabold text-slate-900 bg-orange-100/50 px-1 py-0.5 rounded leading-none inline">
          {part}
        </strong>
      );
    }
    return part.split(' ').map((word, wIdx) => {
      const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").toLowerCase();
      if (cleanWord === 'singaporean' || cleanWord === 'singaporeans') {
        return (
          <button
            key={`${index}-${wIdx}`}
            onClick={() => onBlogNavigate('singaporean-buying-property-in-malaysia')}
            className="text-[#dc2743] font-extrabold hover:underline cursor-pointer inline"
          >
            {word}{' '}
          </button>
        );
      }
      if (cleanWord === 'foreigner' || cleanWord === 'foreigners') {
        return (
          <button
            key={`${index}-${wIdx}`}
            onClick={() => onBlogNavigate('foreigner-buying-property-in-malaysia')}
            className="text-[#dc2743] font-extrabold hover:underline cursor-pointer inline"
          >
            {word}{' '}
          </button>
        );
      }
      if (cleanWord === 'rts') {
        return (
          <button
            key={`${index}-${wIdx}`}
            onClick={() => onBlogNavigate('rts-johor-bahru-guide')}
            className="text-[#dc2743] font-extrabold hover:underline cursor-pointer inline"
          >
            {word}{' '}
          </button>
        );
      }
      if (cleanWord === 'johor') {
        return (
          <button
            key={`${index}-${wIdx}`}
            onClick={() => onBlogNavigate('johor-property-market-outlook')}
            className="text-[#dc2743] font-extrabold hover:underline cursor-pointer inline"
          >
            {word}{' '}
          </button>
        );
      }
      if (cleanWord === 'tax' || cleanWord === 'taxes' || cleanWord === 'rpgt') {
        return (
          <button
            key={`${index}-${wIdx}`}
            onClick={() => onBlogNavigate('malaysia-property-taxes-explained')}
            className="text-[#dc2743] font-extrabold hover:underline cursor-pointer inline"
          >
            {word}{' '}
          </button>
        );
      }
      return word + ' ';
    });
  });
};

export const BlogView: React.FC<BlogViewProps> = ({
  onProjectNavigate,
  onBlogNavigate,
  activeBlogSlug,
}) => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [articles, setArticles] = useState<BlogArticle[]>(() => {
    // 1. First preference: pre-translated static compile
    if (language !== "en") {
      const staticPreTranslated = PRE_TRANSLATED_BLOGS[language];
      if (staticPreTranslated && staticPreTranslated.length > 0) {
        return staticPreTranslated;
      }
    }
    // 2. Second preference: localStorage cache
    if (typeof window !== "undefined" && language !== "en") {
      const cached = localStorage.getItem(`blog_list_${language}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }
    return BLOG_DATA;
  });
  const [isLoading, setIsLoading] = useState(false);

  const [activeFullArticle, setActiveFullArticle] = useState<BlogArticle | null>(null);
  const [isLoadingActive, setIsLoadingActive] = useState(false);

  // Synchronize blog previews list on language change
  React.useEffect(() => {
    if (language === 'en') {
      setArticles(BLOG_DATA);
      return;
    }

    // 1. Check static pre-translated compile first
    const staticPre = PRE_TRANSLATED_BLOGS[language];
    if (staticPre && staticPre.length > 0) {
      setArticles(staticPre);
    } else {
      // 2. Read cached list if any
      const cached = localStorage.getItem(`blog_list_${language}`);
      if (cached) {
        try {
          setArticles(JSON.parse(cached));
        } catch (e) {}
      } else {
        // Set isLoading to true ONLY if we have absolutely zero static/cached results
        setIsLoading(true);
      }
    }

    fetch(`${API_BASE_URL}/api/blog?lang=${language}`)
      .then((res) => {
        if (!res.ok) throw new Error("Blog translation failed");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setArticles(data);
          localStorage.setItem(`blog_list_${language}`, JSON.stringify(data));
        }
      })
      .catch((err) => {
        console.warn("Could not retrieve translated blog list, fallback applied:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [language]);

  // Synchronize full article detail on language/active slug change
  React.useEffect(() => {
    if (!activeBlogSlug) {
      setActiveFullArticle(null);
      return;
    }

    const localEnglish = BLOG_DATA.find((art) => art.slug === activeBlogSlug) || null;
    const cacheKey = `blog_detail_${activeBlogSlug}_${language}`;
    let hasLoadedFromCache = false;

    // 1. Check static pre-translated compile details first
    const staticDetail = PRE_TRANSLATED_BLOG_DETAILS[language]?.[activeBlogSlug];
    if (staticDetail) {
      setActiveFullArticle(staticDetail);
      hasLoadedFromCache = true;
    } else {
      // 2. Check localStorage cache second
      const cachedDetail = localStorage.getItem(cacheKey);
      if (cachedDetail) {
        try {
          setActiveFullArticle(JSON.parse(cachedDetail));
          hasLoadedFromCache = true;
        } catch (e) {
          setActiveFullArticle(localEnglish);
        }
      } else {
        setActiveFullArticle(localEnglish);
      }
    }

    if (language === 'en') {
      setIsLoadingActive(false);
      return;
    }

    // Set active loading only if we do not even have static/cached translation
    if (!hasLoadedFromCache) {
      // We still DO NOT show a global block shimmer. We let the user see the English layout immediately!
      setIsLoadingActive(false);
    }

    fetch(`${API_BASE_URL}/api/blog/${activeBlogSlug}?lang=${language}`)
      .then((res) => {
        if (!res.ok) throw new Error("Article translation failed");
        return res.json();
      })
      .then((data) => {
        if (data && data.title) {
          setActiveFullArticle(data);
          localStorage.setItem(cacheKey, JSON.stringify(data));
        }
      })
      .catch((err) => {
        console.warn("Could not retrieve translated article detail, fallback applied:", err);
      })
      .finally(() => {
        setIsLoadingActive(false);
      });
  }, [activeBlogSlug, language]);

  // Categories list
  const categories = ['all', 'Guides', 'Investment', 'Market Outlook', 'Financials'];

  // Filter regular lists
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      // Category matched
      if (selectedCategory !== 'all' && art.category !== selectedCategory) {
        return false;
      }
      // Query matched
      const q = searchQuery.toLowerCase();
      return (
        art.title.toLowerCase().includes(q) ||
        (art.content || '').toLowerCase().includes(q) ||
        art.summary.toLowerCase().includes(q)
      );
    });
  }, [articles, searchQuery, selectedCategory]);

  if (activeBlogSlug) {
    if (isLoadingActive || !activeFullArticle) {
      return <ShimmerArticle />;
    }

    // RENDER SINGLE ARTICLE SCREEN
    return (
      <section id="blog-article-reader" className="py-16 bg-slate-50/30 text-slate-900 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          {/* Back button */}
          <button
            onClick={() => onBlogNavigate('')}
            className="flex items-center gap-1.5 text-xs font-extrabold text-[#dc2743] hover:text-[#dc2743]/90 mb-8 cursor-pointer bg-white px-5 py-2.5 border border-slate-100 rounded-full shadow-sm select-none btn-hover"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            {language.startsWith('zh') ? '返回文章首页' : language === 'ja' ? 'コラム一覧に戻る' : 'Back to Articles Index'}
          </button>

          <article className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-10 shadow-lg relative">
            {/* Meta headers */}
            <div className="flex flex-wrap gap-4 items-center mb-6 text-slate-400 text-xs font-bold uppercase select-none">
              <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] border border-orange-100/50">
                {activeFullArticle.category}
              </span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{activeFullArticle.publishDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{activeFullArticle.readTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                <span>By {activeFullArticle.author}</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-[800] text-slate-900 tracking-tight leading-zero mb-6 text-left">
              {activeFullArticle.title}
            </h1>

            {/* Image Header */}
            <div className="aspect-[21/9] rounded-2xl overflow-hidden mb-8 shadow-xs">
              <img
                src={activeFullArticle.image}
                alt={activeFullArticle.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Summary Block */}
            <div className="bg-slate-50 border-l-4 border-orange-500 rounded-r-xl p-5 mb-8 text-slate-600 italic text-sm leading-relaxed font-semibold text-left">
              &ldquo;{activeFullArticle.summary}&rdquo;
            </div>

            {/* Markdown styled Content Body */}
            <div className="space-y-6 text-slate-800 text-[16px] sm:text-[17px] leading-relaxed text-left">
              {activeFullArticle.content.split('\n\n').map((para, pIdx) => {
                const trimmed = para.trim();
                if (!trimmed) return null;

                // Handle Markdown Headers h1, h2, h3 (Strips any double asterisks for headers)
                if (trimmed.startsWith('# ')) {
                  return (
                    <h2 key={pIdx} className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight pt-5 mt-4 border-b border-slate-100 pb-2">
                      {trimmed.replace('# ', '').replaceAll('**', '')}
                    </h2>
                  );
                }
                if (trimmed.startsWith('## ')) {
                  return (
                    <h3 key={pIdx} className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight pt-4 mt-4">
                      {trimmed.replace('## ', '').replaceAll('**', '')}
                    </h3>
                  );
                }
                if (trimmed.startsWith('### ')) {
                  return (
                    <h4 key={pIdx} className="text-md sm:text-lg font-black text-[#dc2743] tracking-tight mt-3">
                      {trimmed.replace('### ', '').replaceAll('**', '')}
                    </h4>
                  );
                }

                // Handle bullet items
                if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                  const items = trimmed.split('\n');
                  return (
                    <ul key={pIdx} className="list-disc pl-5 space-y-2 text-slate-700 italic">
                      {items.map((it, itIdx) => (
                        <li key={itIdx}>
                          {renderTextWithFormatting(it.replace(/^[\*\-]\s+/, ''), onBlogNavigate)}
                        </li>
                      ))}
                    </ul>
                  );
                }

                // Normal Paragraph with beautiful inline formatting & linked highlights
                return (
                  <p key={pIdx}>
                    {renderTextWithFormatting(trimmed, onBlogNavigate)}
                  </p>
                );
              })}
            </div>

            {/* SEO Article Accordion FAQ widgets */}
            {activeFullArticle.faqs && activeFullArticle.faqs.length > 0 && (
              <div className="mt-12 pt-8 border-t border-slate-100 text-left select-none">
                <div className="flex items-center gap-2 mb-6">
                  <HelpCircle className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide font-sans">
                    {language.startsWith('zh') ? '文章深度问答与要点释疑' : language === 'ja' ? 'コラムFAQ・専門家による疑問解消' : 'Article FAQs Insights & Explanations'}
                  </h3>
                </div>
                <div className="space-y-4">
                  {activeFullArticle.faqs.map((f, fIdx) => (
                    <div key={fIdx} className="bg-slate-50 border border-slate-100/75 rounded-2xl p-5">
                      <h4 className="text-sm font-bold text-slate-900 mb-2">
                        {f.question}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold">
                        {f.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Article Footer CTA consult card */}
            <div className="border-t border-slate-100 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 select-none">
              <div className="text-left">
                <h4 className="text-base font-bold text-slate-950 font-sans">
                  {language.startsWith('zh') ? '对上述政策或购房规定有疑问？' : language === 'ja' ? 'マレーシアの規制方針や物件購入にご不明な点がありますか？' : 'Questions regarding these regulations?'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 font-semibold leading-relaxed">
                  {language.startsWith('zh') ? '立即与置业合规顾问 Shyan Yee 联系，获取专属置业指南、各州审批政策和最新价格折扣。' : language === 'ja' ? '担当顧問 Shyan Yee から直接、法律面のアドバイス、地域ガイドライン、割引等の最新プランをご案内いたします。' : 'Get absolute legal representation, guidelines, and pricing charts from Representative Shyan Yee.'}
                </p>
              </div>
              <a
                href={`https://wa.me/60195598932?text=${encodeURIComponent(
                  language.startsWith('zh')
                    ? `您好 Shyan Yee，我刚阅读了您的房产研究门户，想针对文章《${activeFullArticle.title}》中提及的项目详情、法律规范和置业优惠进行具体咨询。谢谢！`
                    : language === 'ja'
                    ? `こんにちは Shyan Yee、マレーシア不動産の記事「${activeFullArticle.title}」を読みました。この記事に掲載されている購入規制や価格表について相談したいです。`
                    : `Hi Shyan Yee, I was reading your properties analytical article "${activeFullArticle.title}" and would appreciate discussing standard regulations and floorplan options. Thank you!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 ig-gradient text-white font-extrabold rounded-full shadow-lg shadow-orange-500/10 text-xs flex items-center justify-center gap-1.5 cursor-pointer btn-hover font-sans text-center shrink-0"
              >
                <MessageCircle className="h-4 w-4 fill-white animate-bounce" />
                {language.startsWith('zh') ? '与顾问沟通 (WhatsApp)' : language === 'ja' ? 'WhatsAppで相談する' : 'Discuss on WhatsApp'}
              </a>
            </div>

          </article>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section id="blog-archives" className="py-20 bg-slate-50/20 text-slate-900 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="block text-xs font-black uppercase tracking-widest text-[#dc2743] mb-2 font-sans select-none">
              RESEARCH INSIGHTS PORTAL
            </span>
            <h2 className="text-3xl sm:text-4xl font-[800] text-slate-900 tracking-tight leading-none mb-4 animate-pulse">
              {t('blogTitle')}
            </h2>
            <div className="h-4 bg-slate-200 rounded w-5/6 mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </div>
        </div>
      </section>
    );
  }

  // RENDER BLOG ARCHIVE INDEX LIST VIEW
  return (
    <section id="blog-archives" className="py-20 bg-slate-50/20 text-slate-900 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="block text-xs font-black uppercase tracking-widest text-[#dc2743] mb-2 font-sans select-none">
            RESEARCH INSIGHTS PORTAL
          </span>
          <h2 className="text-3xl sm:text-4xl font-[800] text-slate-900 tracking-tight leading-none mb-4">
            {t('blogTitle')}
          </h2>
          <p className="text-slate-500 text-[15px] font-semibold">
            {t('blogSubtitle')}
          </p>
        </div>

        {/* Filter bar search */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 mb-10 flex flex-col md:flex-row gap-5 items-center justify-between select-none shadow-sm">
          {/* Categories Tab */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer btn-hover ${
                  selectedCategory === cat
                    ? 'ig-gradient text-white shadow-md shadow-orange-500/10'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-100/50'
                }`}
              >
                {cat === 'all' ? t('all') : (
                  language.startsWith('zh') ? (cat === 'Guides' ? '置业指南' : cat === 'Investment' ? '投资前瞻' : cat === 'Market Outlook' ? '市场分析' : cat === 'Financials' ? '资金税务' : cat) :
                  language === 'ja' ? (cat === 'Guides' ? '購入ガイド' : cat === 'Investment' ? '投資アドバイス' : cat === 'Market Outlook' ? 'マーケット洞察' : cat === 'Financials' ? '資金・税金' : cat) : cat
                )}
              </button>
            ))}
          </div>

          {/* Local Search input */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder={language.startsWith('zh') ? '搜索深度分析与资讯简报...' : language === 'ja' ? 'コラムや記事を検索...' : 'Search detailed insights...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50/55 border border-slate-100 rounded-full py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-400"
            />
            <Search className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* Articles list grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((art) => (
            <article
              key={art.slug}
              onClick={() => onBlogNavigate(art.slug)}
              className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Image */}
                <div className="aspect-[16/10] bg-slate-50 overflow-hidden relative">
                  <img
                    src={art.image}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Category tag */}
                  <span className="absolute top-4 left-4 bg-slate-950/85 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                    {language.startsWith('zh') ? (art.category === 'Guides' ? '置业指南' : art.category === 'Investment' ? '投资前瞻' : art.category === 'Market Outlook' ? '市场分析' : art.category === 'Financials' ? '资金税务' : art.category) :
                    language === 'ja' ? (art.category === 'Guides' ? '購入ガイド' : art.category === 'Investment' ? '投資アドバイス' : art.category === 'Market Outlook' ? 'マーケット洞察' : art.category === 'Financials' ? '資金・税金' : art.category) : art.category}
                  </span>
                </div>

                {/* Text blocks */}
                <div className="p-6 text-left space-y-3">
                  <div className="flex gap-3 items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
                    <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" /> {art.publishDate}</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {art.readTime}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 truncate leading-snug group-hover:text-[#dc2743] transition-colors">
                    {art.title}
                  </h3>
                  <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed font-semibold font-sans">
                    {art.metaDescription}
                  </p>
                </div>
              </div>

              {/* Card Footer arrow action */}
              <div className="px-6 pb-6 pt-3 mt-auto border-t border-slate-50 flex items-center justify-between text-[11px] font-black text-[#dc2743] uppercase tracking-widest leading-none">
                {language.startsWith('zh') ? '阅读深度长文' : language === 'ja' ? '記事を読む' : 'Read Article'}
                <div className="p-1 rounded-full bg-slate-50 text-slate-400 group-hover:bg-[#dc2743] group-hover:text-white transition-all">
                  <ChevronRight className="h-4.5 w-4.5" />
                </div>
              </div>

            </article>
          ))}
        </div>

      </div>
    </section>
  );
};
