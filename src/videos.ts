/**
 * Every YouTube walkthrough on the channel (https://www.youtube.com/@shyanyee).
 * `projectId` links a video to a project page; videos without one are general guides and appear
 * on the home page only.
 */
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
    title: 'CloutHaus Residences, KL City Centre — freehold residences facing the Petronas Twin Towers',
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
  },
  {
    youtubeId: 'QHD2awCy3a4',
    title: 'Khaya Residences, Bangsar — 61-storey landmark by Melati Ehsan with TNB, five minutes on foot to the LRT',
    titleZh: '【Khaya Residences 孟沙】TNB 与 Melati Ehsan 联手打造的 61 层地标｜完整看房指南',
    projectId: 'khaya-residence',
    uploadDate: '2026-07-30T00:00:00+08:00',
    durationSeconds: 821
  },
  {
    youtubeId: 'fZzT_sV0VKU',
    title: 'Parkside Residences, Bangsar — a five-acre park downstairs, rare in the KL city centre',
    titleZh: '【Parkside Residences 孟沙】KL 市中心少见｜5 英亩公园就在楼下｜全面解析',
    projectId: 'parkside-residence',
    uploadDate: '2026-04-28T00:00:00+08:00',
    durationSeconds: 525
  },
  {
    youtubeId: '_EelMcIcXaI',
    title: 'Park Green, Bukit Jalil by Malton — freehold, link bridge into Pavilion Bukit Jalil',
    titleZh: '【Park Green Bukit Jalil 深度解析】Malton 出品｜永久地契｜连接桥直通 Pavilion 商场',
    projectId: 'park-green-pavilion-bukit-jalil',
    uploadDate: '2025-12-28T00:00:00+08:00',
    durationSeconds: 355
  },
  {
    youtubeId: 'KyYFl2cz4Vw',
    title: 'Centrix The Station — a transit-oriented tower built above Dang Wangi LRT station',
    titleZh: '【Centrix - The Station】TOD 新盘｜底层直连轻快铁｜步行可到单轨',
    projectId: 'centrix',
    uploadDate: '2025-11-09T00:00:00+08:00',
    durationSeconds: 374
  },
  {
    youtubeId: 'C0EZN_aLaKQ',
    title: 'The Conlay Residence by E&O and Mitsui Fudosan — luxury residences in the KL city centre',
    titleZh: '【The Conlay Residence】E&O 与三井不动产联手｜吉隆坡市中心豪华公寓',
    uploadDate: '2024-11-10T00:00:00+08:00',
    durationSeconds: 281
  },
  {
    youtubeId: 'XBp7M_uMoNw',
    title: 'Oxley Towers Jewel — freehold in the KL city centre, a 2026 benchmark for luxury',
    titleZh: '【Oxley Towers - Jewel 开箱】2026 马来西亚豪宅标杆｜吉隆坡核心商圈｜永久产权',
    uploadDate: '2026-05-25T00:00:00+08:00',
    durationSeconds: 723
  },
  {
    youtubeId: 'puFoi9JRDpc',
    title: 'Royal Lexis Kuala Lumpur — freehold residences with private pools in the KL city centre',
    titleZh: '【Royal Lexis 吉隆坡丽昇皇廷】私人泳池豪宅｜永久产权｜高端酒店式',
    uploadDate: '2026-02-10T00:00:00+08:00',
    durationSeconds: 558
  },
  {
    youtubeId: 'D5ApL5yUetg',
    title: 'The Ashwood @ U-Thant — the embassy district, near international schools, freehold and large layouts',
    titleZh: '【The Ashwood @ U-Thant】大使馆区｜靠近国际学校｜永久产权｜大户型豪宅',
    uploadDate: '2025-05-30T00:00:00+08:00',
    durationSeconds: 311
  },
  {
    youtubeId: 'cjG_oCKsSpo',
    title: 'Skyline Embassy — near completion, freehold, facing the Petronas Twin Towers',
    titleZh: '【Skyline Embassy 天景金邸】双峰塔景｜即将完工｜永久产权',
    uploadDate: '2025-04-25T00:00:00+08:00',
    durationSeconds: 442
  },
  {
    youtubeId: 'Z1nGKkEv2vI',
    title: 'Branded residences in Malaysia — what the hotel brand actually buys you',
    titleZh: '【品牌公寓 Branded Residence】为什么选择马来西亚品牌公寓？酒店式豪华住宅深度解析',
    uploadDate: '2025-09-05T00:00:00+08:00',
    durationSeconds: 625
  },
  {
    youtubeId: 'CIQsWvHg1GI',
    title: 'Foreigners buying property in Malaysia, part 2 — the minimum purchase price in KL, Selangor, Johor and Penang',
    titleZh: '第 2 集：外国人去马来西亚买房攻略｜吉隆坡、雪兰莪、新山、槟城预算门槛拆解',
    uploadDate: '2026-06-14T00:00:00+08:00',
    durationSeconds: 362
  },
  {
    youtubeId: 'tIq1sccW9Tk',
    title: 'Foreigners buying property in Malaysia, part 1 — is it a fair deal?',
    titleZh: '第 1 集：外国人在马来西亚买房，到底是不是割韭菜？',
    uploadDate: '2026-06-06T00:00:00+08:00',
    durationSeconds: 340
  }
];

export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const youtubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const youtubeEmbedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
