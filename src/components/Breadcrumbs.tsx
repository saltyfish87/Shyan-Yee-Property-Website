import React from 'react';
import { ChevronRight, Home, Building, FileText, Map, Columns, HelpCircle, Calculator } from 'lucide-react';
import { Project } from '../types';
import { BLOG_DATA } from '../data';
import { useLanguage } from '../LanguageContext';

interface BreadcrumbsProps {
  currentPage: string;
  selectedProject: Project | null;
  activeBlogSlug: string | null;
  onNavigate: (page: string, project: Project | null, blogSlug: string | null) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  currentPage,
  selectedProject,
  activeBlogSlug,
  onNavigate
}) => {
  const { language } = useLanguage();
  const baseUrl = "https://shyanyee.com";

  // Find active blog article title
  const activeArticle = activeBlogSlug ? BLOG_DATA.find(a => a.slug === activeBlogSlug) : null;

  // Build breadcrumb steps
  interface BreadcrumbStep {
    id: string;
    label: string;
    url: string;
    icon?: React.ReactNode;
    isCurrent?: boolean;
    onClick?: () => void;
  }

  const steps: BreadcrumbStep[] = [];

  // 1. Home is always the root
  steps.push({
    id: 'home',
    label: language.startsWith('zh') ? '主页' : 'Home',
    url: baseUrl,
    icon: <Home className="h-3.5 w-3.5 shrink-0" />,
    onClick: () => onNavigate('home', null, null)
  });

  if (selectedProject) {
    // If viewing a project, include Projects then Project Name
    steps.push({
      id: 'projects',
      label: language.startsWith('zh') ? '楼盘组合' : 'Landmark Projects',
      url: `${baseUrl}/projects`,
      icon: <Building className="h-3.5 w-3.5 shrink-0" />,
      onClick: () => onNavigate('projects', null, null)
    });
    steps.push({
      id: `project-${selectedProject.id}`,
      label: selectedProject.name,
      url: `${baseUrl}/projects/${selectedProject.id}`,
      isCurrent: true
    });
  } else if (activeBlogSlug) {
    // If viewing a blog article, include Blog index then Article Title
    steps.push({
      id: 'blog',
      label: language.startsWith('zh') ? '置业指南与博客' : 'Guides & Blog',
      url: `${baseUrl}/blog`,
      icon: <FileText className="h-3.5 w-3.5 shrink-0" />,
      onClick: () => onNavigate('blog', null, null)
    });
    steps.push({
      id: `blog-${activeBlogSlug}`,
      label: activeArticle ? activeArticle.title : activeBlogSlug,
      url: `${baseUrl}/blog/${activeBlogSlug}`,
      isCurrent: true
    });
  } else {
    // Top-level static page breadcrumbs
    if (currentPage === 'projects') {
      steps.push({
        id: 'projects',
        label: language.startsWith('zh') ? '所有楼盘' : 'Landmark Projects',
        url: `${baseUrl}/projects`,
        icon: <Building className="h-3.5 w-3.5 shrink-0" />,
        isCurrent: true
      });
    } else if (currentPage === 'blog') {
      steps.push({
        id: 'blog',
        label: language.startsWith('zh') ? '置业指南与博客' : 'Guides & Insights',
        url: `${baseUrl}/blog`,
        icon: <FileText className="h-3.5 w-3.5 shrink-0" />,
        isCurrent: true
      });
    } else if (currentPage === 'faq') {
      steps.push({
        id: 'faq',
        label: language.startsWith('zh') ? '买家常见问题与MM2H' : 'Buyer FAQ & Guidelines',
        url: `${baseUrl}/faq`,
        icon: <HelpCircle className="h-3.5 w-3.5 shrink-0" />,
        isCurrent: true
      });
    } else if (currentPage === 'map') {
      steps.push({
        id: 'map',
        label: language.startsWith('zh') ? '交互式地图' : 'Interactive GIS Map',
        url: `${baseUrl}/map`,
        icon: <Map className="h-3.5 w-3.5 shrink-0" />,
        isCurrent: true
      });
    } else if (currentPage === 'compare') {
      steps.push({
        id: 'compare',
        label: language.startsWith('zh') ? '楼盘规格对比' : 'Property Spec Matrix',
        url: `${baseUrl}/compare`,
        icon: <Columns className="h-3.5 w-3.5 shrink-0" />,
        isCurrent: true
      });
    } else if (currentPage === 'calculator') {
      steps.push({
        id: 'calculator',
        label: language.startsWith('zh') ? '房贷与印花税计算器' : 'Loan & Stamp Duty Calculator',
        url: `${baseUrl}/calculator`,
        icon: <Calculator className="h-3.5 w-3.5 shrink-0" />,
        isCurrent: true
      });
    }
  }

  // If on home page with no project/article selected, hide redundant breadcrumb
  if (currentPage === 'home' && !selectedProject && !activeBlogSlug) {
    return null;
  }

  // Construct BreadcrumbList JSON-LD object
  const currentCanonicalUrl = steps.length > 0 ? steps[steps.length - 1].url : baseUrl;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${currentCanonicalUrl}#breadcrumbs`,
    "itemListElement": steps.map((step, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": step.label,
      "item": step.url,
      "@id": `${step.url}#breadcrumb-step-${idx + 1}`
    }))
  };

  return (
    <nav 
      id="seo-breadcrumbs"
      aria-label="Breadcrumb"
      className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2"
    >
      {/* Component-level JSON-LD BreadcrumbList Schema for Google Search Console */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <ol 
        className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-stone-500"
        itemScope 
        itemType="https://schema.org/BreadcrumbList"
      >
        {steps.map((step, idx) => {
          return (
            <li 
              key={step.id} 
              id={`breadcrumb-item-${idx + 1}`}
              className="flex items-center"
              itemProp="itemListElement" 
              itemScope 
              itemType="https://schema.org/ListItem"
            >
              {idx > 0 && (
                <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-stone-300 mx-1.5 sm:mx-2 shrink-0" aria-hidden="true" />
              )}
              
              <meta itemProp="position" content={(idx + 1).toString()} />
              
              {step.isCurrent || !step.onClick ? (
                <a 
                  href={step.url}
                  itemProp="item"
                  id={`breadcrumb-link-${step.id}`}
                  onClick={(e) => e.preventDefault()}
                  className="text-stone-800 font-extrabold truncate max-w-[180px] sm:max-w-xs md:max-w-md lg:max-w-lg cursor-default hover:text-stone-900"
                >
                  <span itemProp="name">{step.label}</span>
                </a>
              ) : (
                <a
                  href={step.url}
                  itemProp="item"
                  id={`breadcrumb-link-${step.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    step.onClick?.();
                  }}
                  className="flex items-center gap-1 text-stone-500 hover:text-orange-500 transition-colors cursor-pointer"
                >
                  {step.icon}
                  <span itemProp="name">{step.label}</span>
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
