import React, { useState } from 'react';
import { Play, Youtube, ArrowRight } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { HOME_VIDEOS, youtubeThumb, youtubeEmbedUrl, youtubeWatchUrl } from '../videos';
import { Project } from '../types';

interface VideoShowcaseProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

/** Three featured YouTube walkthroughs. Thumbnails only until the visitor presses play, so the home page stays fast. */
export const VideoShowcase: React.FC<VideoShowcaseProps> = ({ projects, onProjectClick }) => {
  const { t, language } = useLanguage();
  const [playing, setPlaying] = useState<string | null>(null);
  const isZh = language.startsWith('zh');

  return (
    <section className="py-20 bg-white border-t border-slate-100" id="videos">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="block text-xs font-black uppercase tracking-widest ig-text mb-2">{t('videoSub')}</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{t('videoTitle')}</h2>
          <p className="text-slate-500 text-sm mt-3 font-semibold">{t('videoDesc')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="h-7 w-7 ml-1" fill="currentColor" />
                        </span>
                      </span>
                    </button>
                  )}
                </div>
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{title}</h3>
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    {project && (
                      <button
                        type="button"
                        onClick={() => onProjectClick(project)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        {t('videoViewProject')} <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <a
                      href={youtubeWatchUrl(v.youtubeId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Youtube className="h-3.5 w-3.5" /> YouTube
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <a
            href="https://www.youtube.com/@shyanyee"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-full transition-colors"
          >
            <Youtube className="h-4 w-4" /> {t('videoChannel')}
          </a>
        </div>
      </div>
    </section>
  );
};

export default VideoShowcase;
