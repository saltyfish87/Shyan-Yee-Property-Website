import React, { useState, useMemo, useCallback } from 'react';
import { BlogArticle } from '../types';
import { BLOG_DATA } from '../data';
import { GENERATED_ZH_ARTICLES, GENERATED_ZH_HANT_ARTICLES } from '../data/articles.generated';

/**
 * The Chinese article list = the review articles written in markdown (Simplified, converted to
 * Traditional at build time) + the translated guide set. The list used to be rebuilt from the guide
 * set alone once the language effect ran, which silently dropped the 19 reviews on /zh and /zh-hant.
 */
function withGeneratedArticles(language: string, list: BlogArticle[] | undefined): BlogArticle[] | undefined {
  const generated = language === 'zh-CN' ? GENERATED_ZH_ARTICLES : language === 'zh-TW' ? GENERATED_ZH_HANT_ARTICLES : null;
  if (!generated || !list) return list;
  return [...Object.values(generated), ...list.filter(b => !generated[b.slug])];
}
import projectsFallback from '../projectsFallback.json';
import { renderMarkdown, articleDates, dateLabel, youtubeEmbed, DEFAULT_AUTO_LINKS } from '../lib/markdown';
import { useLanguage } from '../LanguageContext';
import { API_BASE_URL } from '../utils/api';
import { PRE_TRANSLATED_BLOGS, PRE_TRANSLATED_BLOG_DETAILS } from '../translations';
import { Search, Calendar, User, Clock, ArrowLeft, ChevronRight, MessageCircle, Share2, HelpCircle, Youtube, Instagram, Facebook, Building2 } from 'lucide-react';

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
      // The review articles are written in Simplified Chinese and converted to Traditional at build time.
      const staticPreTranslated = withGeneratedArticles(language, PRE_TRANSLATED_BLOGS[language]);
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
    const staticPre = withGeneratedArticles(language, PRE_TRANSLATED_BLOGS[language]);
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
    const staticDetail = PRE_TRANSLATED_BLOG_DETAILS[language]?.[activeBlogSlug] || (language === 'zh-CN' ? GENERATED_ZH_ARTICLES[activeBlogSlug] : language === 'zh-TW' ? GENERATED_ZH_HANT_ARTICLES[activeBlogSlug] : undefined);
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

  // Categories. The tabs used to compare the English tab name with the article's category field,
  // which the translated article sets hold in their own language ("指南", "Investissement"), so in
  // every language but English the tabs matched nothing and only "All" showed articles — and three
  // English categories (Financials as "Ownership", Geography, Visas) had no tab at all. Every label
  // is folded to one English key first, and the tabs come from the articles actually present.
  const CATEGORY_KEY: Record<string, string> = {
    'Reviews': 'Reviews', 'Guides': 'Guides', 'Investment': 'Investment', 'Market Outlook': 'Market Outlook',
    'Financials': 'Financials', 'Financing': 'Financing', 'Ownership': 'Ownership', 'Geography': 'Geography', 'Visas & Entry': 'Visas & Entry',
    '楼盘评测': 'Reviews', '樓盤評測': 'Reviews', '指南': 'Guides', '置业指南智库': 'Guides', '置業指南智庫': 'Guides', '置业指南': 'Guides', '置業指南': 'Guides', '投资': 'Investment', '投資': 'Investment', '市场展望': 'Market Outlook', '市場展望': 'Market Outlook',
    '财务': 'Financials', '財務': 'Financials', '財務資訊': 'Financials', '融资': 'Financing', '融資': 'Financing', '所有权': 'Ownership', '所有權': 'Ownership',
    '地理': 'Geography', '签证和入境': 'Visas & Entry', '簽證和入境': 'Visas & Entry',
    'ガイド': 'Guides', '市場の見通し': 'Market Outlook', '所有': 'Ownership', 'ビザと入国': 'Visas & Entry',
    '가이드': 'Guides', '투자': 'Investment', '시장 전망': 'Market Outlook', '금융': 'Financials', '자금조달': 'Financing', '소유권': 'Ownership', '지리학': 'Geography', '비자 및 입국': 'Visas & Entry',
    'أدلة': 'Guides', 'استثمار': 'Investment', 'توقعات السوق': 'Market Outlook', 'المالية': 'Financials', 'التمويل': 'Financing', 'ملكية': 'Ownership', 'الجغرافيا': 'Geography', 'التأشيرات والدخول': 'Visas & Entry',
    'Investissement': 'Investment', 'Perspectives du marché': 'Market Outlook', 'Données financières': 'Financials', 'Financement': 'Financing', 'Possession': 'Ownership', 'Géographie': 'Geography', 'Visas et entrée': 'Visas & Entry'
  };
  // Lists translated by the old API and cached in the browser carry labels of their own
  // ("置业指南智库"), so anything unknown is folded by its key word before it can become a tab.
  const categoryKey = (c?: string) => {
    const v = (c || '').trim();
    if (CATEGORY_KEY[v]) return CATEGORY_KEY[v];
    if (/评测|評測|review/i.test(v)) return 'Reviews';
    if (/融资|融資|贷款|貸款|financ(ing|ement)|loan/i.test(v)) return 'Financing';
    if (/财务|財務|税|稅|tax|financ/i.test(v)) return 'Financials';
    if (/市场|市場|market|marché/i.test(v)) return 'Market Outlook';
    if (/投资|投資|invest/i.test(v)) return 'Investment';
    if (/产权|產權|owner|possession/i.test(v)) return 'Ownership';
    if (/签证|簽證|visa/i.test(v)) return 'Visas & Entry';
    if (/区域|區域|geograph|地理/i.test(v)) return 'Geography';
    return 'Guides';
  };
  const CATEGORY_LABEL: Record<string, Record<string, string>> = {
    'zh-CN': { 'Reviews': '楼盘评测', 'Guides': '置业指南', 'Investment': '投资前瞻', 'Market Outlook': '市场展望', 'Financials': '税务财务', 'Financing': '贷款融资', 'Ownership': '产权', 'Geography': '区域', 'Visas & Entry': '签证与居留' },
    'zh-TW': { 'Reviews': '樓盤評測', 'Guides': '置業指南', 'Investment': '投資前瞻', 'Market Outlook': '市場展望', 'Financials': '稅務財務', 'Financing': '貸款融資', 'Ownership': '產權', 'Geography': '區域', 'Visas & Entry': '簽證與居留' },
    'ja': { 'Reviews': '物件レビュー', 'Guides': '購入ガイド', 'Investment': '投資アドバイス', 'Market Outlook': 'マーケット洞察', 'Financials': '税務・財務', 'Financing': '融資', 'Ownership': '所有権', 'Geography': 'エリア', 'Visas & Entry': 'ビザと居住' },
    'ko': { 'Reviews': '단지 리뷰', 'Guides': '구매 가이드', 'Investment': '투자', 'Market Outlook': '시장 전망', 'Financials': '세무·재무', 'Financing': '대출', 'Ownership': '소유권', 'Geography': '지역', 'Visas & Entry': '비자와 거주' },
    'ar': { 'Reviews': 'مراجعات المشاريع', 'Guides': 'أدلة الشراء', 'Investment': 'استثمار', 'Market Outlook': 'توقعات السوق', 'Financials': 'الضرائب والمالية', 'Financing': 'التمويل', 'Ownership': 'الملكية', 'Geography': 'المناطق', 'Visas & Entry': 'التأشيرات والإقامة' },
    'fr': { 'Reviews': 'Avis sur les projets', 'Guides': "Guides d'achat", 'Investment': 'Investissement', 'Market Outlook': 'Perspectives du marché', 'Financials': 'Fiscalité et finances', 'Financing': 'Financement', 'Ownership': 'Propriété', 'Geography': 'Zones', 'Visas & Entry': 'Visas et séjour' }
  };
  const categoryLabel = (key: string) => key === 'all' ? (language.startsWith('zh') ? (language === 'zh-TW' ? '全部' : '全部') : language === 'ja' ? 'すべて' : language === 'ko' ? '전체' : language === 'ar' ? 'الكل' : language === 'fr' ? 'Tout' : 'All') : (CATEGORY_LABEL[language]?.[key] || key);
  const CATEGORY_ORDER = ['Reviews', 'Guides', 'Investment', 'Market Outlook', 'Financials', 'Financing', 'Ownership', 'Geography', 'Visas & Entry'];
  const categories = useMemo(() => {
    const present = new Set<string>(articles.map((a: BlogArticle) => categoryKey(a.category)));
    return ['all', ...CATEGORY_ORDER.filter(k => present.has(k)), ...[...present].filter(k => !CATEGORY_ORDER.includes(k))];
  }, [articles]);

  // Filter regular lists
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      // Category matched
      if (selectedCategory !== 'all' && categoryKey(art.category) !== selectedCategory) {
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

  // Hooks must run on every render, so this stays above the early returns below.
  const handleBodyClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const video = target.closest('.md-video') as HTMLElement | null;
    if (video && video.dataset.youtube) {
      e.preventDefault();
      video.innerHTML = `<iframe src="${youtubeEmbed(video.dataset.youtube)}" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
      return;
    }
    const link = target.closest('a') as HTMLAnchorElement | null;
    if (!link) return;
    const href = link.getAttribute('href') || '';
    const path = href.replace(/^https?:\/\/(www\.)?shyanyee\.com/i, '').replace(/^\/zh(?=\/)/, '');
    const blog = path.match(/^\/blog\/([^/?#]+)/);
    const proj = path.match(/^\/projects\/([^/?#]+)/);
    if (blog) { e.preventDefault(); onBlogNavigate(blog[1]); }
    else if (proj) { e.preventDefault(); onProjectNavigate(proj[1]); }
  }, [onBlogNavigate, onProjectNavigate]);

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
            <div className="flex flex-wrap gap-4 items-center mb-6 text-slate-400 text-xs font-bold select-none">
              <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] border border-orange-100/50">
                {activeFullArticle.category}
              </span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{activeFullArticle.publishDate}</span>
              </div>
              {activeFullArticle.updatedOn && articleDates(activeFullArticle).updated !== articleDates(activeFullArticle).published && (
                <div className="flex items-center gap-1" title={articleDates(activeFullArticle).updated}>
                  <Clock className="h-3.5 w-3.5" />
                  <span>{language.startsWith('zh') ? '更新于' : 'Updated'} {dateLabel(articleDates(activeFullArticle).updated, language.startsWith('zh') ? 'zh' : 'en')}</span>
                </div>
              )}
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
            <h1 className="display text-4xl sm:text-5xl text-slate-900 mb-6 text-left">
              {activeFullArticle.title}
            </h1>

            {/* Image Header */}
            <div className="aspect-[21/9] rounded-2xl overflow-hidden mb-8 shadow-xs">
              <img
                src={activeFullArticle.image}
                alt={activeFullArticle.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  const fallback = 'https://lh3.googleusercontent.com/d/12kDlxnts2gQefjQi0FIHierCVz2catK_=w1600';
                  if (target.src !== fallback) {
                    target.src = fallback;
                  }
                }}
              />
            </div>

            {/* Summary Block */}
            <div className="border-l border-orange-300 bg-orange-50/40 rounded-r-lg py-4 px-5 mb-8 text-slate-600 text-[15px] leading-relaxed text-left">
              &ldquo;{activeFullArticle.summary}&rdquo;
            </div>

            {/* Article body: shared markdown renderer (same HTML the prerender ships). Internal links stay in-app. */}
            <div
              className="md-body text-slate-800 text-[16px] sm:text-[17px] leading-relaxed text-left"
              onClick={handleBodyClick}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(activeFullArticle.content || '', { langPrefix: language.startsWith('zh') ? '/zh' : '', playLabel: language.startsWith('zh') ? '播放视频' : 'Play video', autoLinks: Object.fromEntries(Object.entries(DEFAULT_AUTO_LINKS).filter(([, path]) => !path.endsWith(`/${activeFullArticle.slug}`))) }) }}
            />

            {/* SEO Article Accordion FAQ widgets */}
            {activeFullArticle.faqs && activeFullArticle.faqs.length > 0 && (
              <div className="mt-12 pt-8 border-t border-slate-100 text-left select-none">
                <div className="flex items-center gap-2 mb-6">
                  <HelpCircle className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-bold text-slate-900 font-sans">
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

            {/* Author box: who wrote this (licence number, agency, channels) */}
            <section className="border-t border-slate-100 mt-12 pt-8">
              <div className="flex flex-col sm:flex-row gap-5 items-start rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                <img src="https://lh3.googleusercontent.com/d/1jrGU7WOGJOTL_ORhhYMpjZ7IgMoNavKY=w300" alt="Shyan Yee (Yee Woei Shyan), REN 46305" className="h-20 w-20 rounded-full object-cover shrink-0 border-2 border-white shadow" loading="lazy" />
                <div className="text-left">
                  <p className="text-[10px] font-semibold text-orange-500">{language.startsWith('zh') ? '作者' : language === 'ja' ? '執筆者' : 'Written by'}</p>
                  <h4 className="text-base font-black text-slate-950 font-sans mt-0.5">Shyan Yee (Yee Woei Shyan)</h4>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">REN 46305 · IQI Realty Sdn Bhd · Kuala Lumpur</p>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed font-medium">
                    {language.startsWith('zh') ? '持牌房产经纪，专注吉隆坡、雪兰莪与新山的新楼盘。文章内容来自发展商资料与实地看房经验；价格与政策会变动，购买前请以最新资料为准。' : language === 'ja' ? 'クアラルンプール、セランゴール、ジョホールバルの新築物件を専門とする登録不動産エージェント。記事はデベロッパー資料と現地視察に基づきます。' : 'Licensed real estate negotiator focused on new launches in Kuala Lumpur, Selangor and Johor Bahru. Articles draw on developer material and site visits; prices and rules change, so confirm the latest before you buy.'}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-3 text-xs font-bold">
                    <a href="https://wa.me/60108278932" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-700 hover:underline"><MessageCircle className="h-3.5 w-3.5" />WhatsApp +60 10-827 8932</a>
                    <a href="https://www.youtube.com/@shyanyee" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-slate-600 hover:underline"><Youtube className="h-3.5 w-3.5" />YouTube</a>
                    <a href="https://www.instagram.com/shyanyee/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-slate-600 hover:underline"><Instagram className="h-3.5 w-3.5" />Instagram</a>
                    <a href="https://www.facebook.com/shyanyeeconsultant/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-slate-600 hover:underline"><Facebook className="h-3.5 w-3.5" />Facebook</a>
                  </div>
                </div>
              </div>
            </section>

            {/* Projects this article is about */}
            {activeFullArticle.relatedProjectIds && activeFullArticle.relatedProjectIds.length > 0 && (
              <section className="border-t border-slate-100 mt-10 pt-8">
                <h4 className="text-base font-bold text-slate-950 font-sans mb-3">
                  {language.startsWith('zh') ? '文中提到的楼盘' : language === 'ja' ? '記事内の物件' : 'Projects in this article'}
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeFullArticle.relatedProjectIds.map((pid) => {
                    const pr = (projectsFallback as any[]).find((x) => x.id === pid);
                    if (!pr) return null;
                    return (
                      <li key={pid}>
                        <a href={`/projects/${pid}`} onClick={(e) => { e.preventDefault(); onProjectNavigate(pid); }} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 hover:border-orange-200 hover:shadow-sm transition">
                          <Building2 className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                          <span>
                            <span className="block text-sm font-black text-slate-900">{pr.name}</span>
                            <span className="block text-xs text-slate-500 font-semibold">{pr.area || pr.location}{pr.tenure ? ` · ${pr.tenure}` : ''}{pr.startingPrice ? ` · from RM ${Number(pr.startingPrice).toLocaleString()}` : ''}</span>
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Related articles: hand-picked first, then the same category, then the rest */}
            <section className="border-t border-slate-100 mt-10 pt-8">
              <h4 className="text-base font-bold text-slate-950 font-sans mb-3">
                {language.startsWith('zh') ? '相关文章' : language === 'ja' ? '関連記事' : 'Related articles'}
              </h4>
              <ul className="space-y-2 text-sm">
                {(() => {
                  const others = articles.filter((a) => a.slug !== activeFullArticle.slug);
                  const picked = (activeFullArticle.relatedSlugs || []).map((sl) => others.find((a) => a.slug === sl)).filter(Boolean) as BlogArticle[];
                  const sameCat = others.filter((a) => a.category === activeFullArticle.category && !picked.includes(a));
                  const rest = others.filter((a) => !picked.includes(a) && !sameCat.includes(a));
                  return [...picked, ...sameCat, ...rest].slice(0, 6);
                })().map((a) => (
                  <li key={a.slug}>
                    <a
                      href={`/blog/${a.slug}`}
                      onClick={(e) => { e.preventDefault(); onBlogNavigate(a.slug); }}
                      className="text-blue-700 hover:underline font-semibold"
                    >
                      {a.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>

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
                href={`https://wa.me/60108278932?text=${encodeURIComponent(
                  language.startsWith('zh')
                    ? `您好 Shyan Yee，我刚阅读了您的房产研究门户，想针对文章《${activeFullArticle.title}》中提及的项目详情、法律规范和置业优惠进行具体咨询。谢谢！`
                    : language === 'ja'
                    ? `こんにちは Shyan Yee、マレーシア不動産の記事「${activeFullArticle.title}」を読みました。この記事に掲載されている購入規制や価格表について相談したいです。`
                    : `Hi Shyan Yee, I was reading your properties analytical article "${activeFullArticle.title}" and would appreciate discussing standard regulations and floorplan options. Thank you!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 ig-gradient text-white font-extrabold rounded-full shadow-lg shadow-purple-500/10 text-xs flex items-center justify-center gap-1.5 cursor-pointer btn-hover font-sans text-center shrink-0"
              >
                <MessageCircle className="h-4 w-4 fill-white" />
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
          <div className="max-w-2xl mb-12">
            <h2 className="display text-4xl sm:text-5xl text-slate-900 mb-4">
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
        <div className="max-w-2xl mb-12">
          <h2 className="display text-4xl sm:text-5xl text-slate-900 mb-4">
            {t('blogTitle')}
          </h2>
          <p className="text-slate-500 text-base leading-relaxed">
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
                    ? 'ig-gradient text-white shadow-md shadow-purple-500/10'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-100/50'
                }`}
              >{categoryLabel(cat)}</button>
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
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback = 'https://lh3.googleusercontent.com/d/12kDlxnts2gQefjQi0FIHierCVz2catK_=w1000';
                      if (target.src !== fallback) {
                        target.src = fallback;
                      }
                    }}
                  />
                  {/* Category tag */}
                  <span className="absolute top-4 left-4 bg-slate-950/85 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded">
                    {categoryLabel(categoryKey(art.category))}
                  </span>
                </div>

                {/* Text blocks */}
                <div className="p-6 text-left space-y-3">
                  <div className="flex gap-3 items-center text-[10px] font-bold text-slate-400 select-none">
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
              <div className="px-6 pb-6 pt-3 mt-auto border-t border-slate-50 flex items-center justify-between text-[11px] font-semibold text-[#dc2743] leading-none">
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
