import React from 'react';
import { ChevronRight, Home, Building, FileText, Map, Columns } from 'lucide-react';
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
  const { t, language } = useLanguage();

  // Find active blog article title
  const activeArticle = activeBlogSlug ? BLOG_DATA.find(a => a.slug === activeBlogSlug) : null;

  // Build breadcrumb steps
  const steps = [];

  // Home is always the root
  steps.push({
    id: 'home',
    label: language.startsWith('zh') ? '主页' : 'Home',
    icon: <Home className="h-3.5 w-3.5 shrink-0" />,
    onClick: () => onNavigate('home', null, null)
  });

  if (selectedProject) {
    // If viewing a project, we can offer to go to Projects first
    steps.push({
      id: 'projects',
      label: language.startsWith('zh') ? '楼盘组合' : 'Landmark Projects',
      icon: <Building className="h-3.5 w-3.5 shrink-0" />,
      onClick: () => onNavigate('projects', null, null)
    });
    steps.push({
      id: 'project-detail',
      label: selectedProject.name,
      isCurrent: true
    });
  } else if (activeBlogSlug) {
    // If viewing a blog article, we can offer to go to Blog index first
    steps.push({
      id: 'blog',
      label: language.startsWith('zh') ? '市场指南' : 'Guides & Blog',
      icon: <FileText className="h-3.5 w-3.5 shrink-0" />,
      onClick: () => onNavigate('blog', null, null)
    });
    steps.push({
      id: 'blog-detail',
      label: activeArticle ? activeArticle.title : activeBlogSlug,
      isCurrent: true
    });
  } else {
    // Static page breadcrumbs
    if (currentPage === 'projects') {
      steps.push({
        id: 'projects',
        label: language.startsWith('zh') ? '所有楼盘' : 'Landmark Projects',
        icon: <Building className="h-3.5 w-3.5 shrink-0" />,
        isCurrent: true
      });
    } else if (currentPage === 'blog') {
      steps.push({
        id: 'blog',
        label: language.startsWith('zh') ? '置业指南与博客' : 'Guides & Insights',
        icon: <FileText className="h-3.5 w-3.5 shrink-0" />,
        isCurrent: true
      });
    } else if (currentPage === 'map') {
      steps.push({
        id: 'map',
        label: language.startsWith('zh') ? '交互式地图' : 'Interactive GIS Map',
        icon: <Map className="h-3.5 w-3.5 shrink-0" />,
        isCurrent: true
      });
    } else if (currentPage === 'compare') {
      steps.push({
        id: 'compare',
        label: language.startsWith('zh') ? '侧对侧对比' : 'Property Spec Matrix',
        icon: <Columns className="h-3.5 w-3.5 shrink-0" />,
        isCurrent: true
      });
    }
  }

  // If we are on home page, we can hide or show simple root breadcrumb
  if (currentPage === 'home' && !selectedProject && !activeBlogSlug) {
    return null; // Don't clutter the landing page hero section with a lone home link
  }

  return (
    <nav 
      id="seo-breadcrumbs"
      aria-label="Breadcrumb"
      className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2"
    >
      <ol 
        className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-stone-500"
        itemScope 
        itemType="https://schema.org/BreadcrumbList"
      >
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          return (
            <li 
              key={step.id} 
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
                <span 
                  className="text-stone-800 font-extrabold truncate max-w-[180px] sm:max-w-xs md:max-w-md lg:max-w-lg cursor-default"
                  itemProp="name"
                >
                  {step.label}
                </span>
              ) : (
                <button
                  onClick={step.onClick}
                  className="flex items-center gap-1 text-stone-500 hover:text-orange-500 transition-colors cursor-pointer"
                  itemProp="item"
                >
                  {step.icon}
                  <span itemProp="name">{step.label}</span>
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
