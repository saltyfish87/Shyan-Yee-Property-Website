import React, { useState } from 'react';
import { Play, Youtube, ArrowRight } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { HOME_VIDEOS, youtubeThumb, youtubeEmbedUrl, youtubeWatchUrl } from '../videos';
import { Project } from '../types';

interface VideoGridProps {
  projects?: Project[];
  onProjectClick?: (project: Project) => void;
}

/** Three featured YouTube walkthroughs, shown inside the agent introduction. Thumbnails only until the visitor presses play. */
export const VideoGrid: React.FC<VideoGridProps> = ({ projects = [], onProjectClick }) => {
  const { t, language } = useLanguage();
  const [playing, setPlaying] = useState<string | null>(null);
  const isZh = language.startsWith('zh');

  return (
    <div className="pt-8 mt-8 border-t border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
        <div>
          <span className="block text-xs font-black uppercase tracking-widest ig-text mb-1">{t('videoSub')}</span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{t('videoTitle')}</h3>
          <p className="text-slate-500 text-sm mt-1 font-medium">{t('videoDesc')}</p>
        </div>
        <a
          href="https://www.youtube.com/@shyanyee"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-full transition-colors shrink-0"
        >
          <Youtube className="h-4 w-4" /> {t('videoChannel')}
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {HOME_VIDEOS.map((v) => {
          const title = isZh ? v.titleZh : v.title;
          const project = v.projectId ? projects.find((p) => p.id === v.projectId) : undefined;
          return (
            <article key={v.youtubeId} className="rounded-2xl border border-slate-150 bg-white shadow-sm overflow-hidden flex flex-col">
              <div className="relative aspect-video bg-slate-900">
                {playing === v.youtubeId ? (
                  <iframe
                    src={youtubeEmbedUrl(v.youtubeId)}
                    title={title}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setPlaying(v.youtubeId)}
                    className="group absolute inset-0 h-full w-full cursor-pointer"
                    aria-label={`${t('videoPlay')}: ${title}`}
                  >
                    <img
                      src={youtubeThumb(v.youtubeId)}
                      alt={title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="h-6 w-6 ml-1" fill="currentColor" />
                      </span>
                    </span>
                  </button>
                )}
              </div>
              <div className="p-4 flex flex-col gap-3 flex-1">
                <h4 className="text-sm font-bold text-slate-900 leading-snug">{title}</h4>
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  {project && onProjectClick && (
                    <button
                      type="button"
                      onClick={() => onProjectClick(project)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      {t('videoViewProject')} <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <a
                    href={youtubeWatchUrl(v.youtubeId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Youtube className="h-3.5 w-3.5" /> YouTube
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default VideoGrid;
