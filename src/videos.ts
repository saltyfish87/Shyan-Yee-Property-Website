/** Featured YouTube walkthroughs shown on the home page (channel: https://www.youtube.com/@shyanyee). */
export interface FeaturedVideo {
  youtubeId: string;
  title: string;
  titleZh: string;
  projectId?: string;
  uploadDate: string; // ISO 8601
  durationSeconds: number;
}

export const HOME_VIDEOS: FeaturedVideo[] = [
  {
    youtubeId: 'Ip9wDev_pF4',
    title: 'Pavilion Square, Bukit Bintang — Pavilion Group residences with a private link bridge to Pavilion KL',
    titleZh: '【Pavilion Square】柏威年 Pavilion Group｜专属连接桥直通 Pavilion 商场｜武吉免登豪华公寓',
    projectId: 'pavilion-square-residences',
    uploadDate: '2024-12-16T15:30:04-08:00',
    durationSeconds: 415
  },
  {
    youtubeId: 'Xya5mG87R-Q',
    title: 'CloutHaus Residences, KLCC — freehold residences facing the Petronas Twin Towers',
    titleZh: '【CloutHaus 格拉豪斯】吉隆坡双子塔对面｜走路 30 步就到｜永久产权豪华公寓',
    projectId: 'clouthaus',
    uploadDate: '2025-01-12T16:00:18-08:00',
    durationSeconds: 319
  },
  {
    youtubeId: 'US1SR88AwhQ',
    title: 'Orion Residence, Bukit Bintang — freehold luxury residences 350 m from Bukit Bintang',
    titleZh: '【Orion Residence 星悦阁】吉隆坡最奢华的项目｜步行 350 米到武吉免登｜永久产权豪宅',
    projectId: 'orion-residence',
    uploadDate: '2025-03-13T01:11:05-07:00',
    durationSeconds: 459
  }
];

export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const youtubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const youtubeEmbedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
