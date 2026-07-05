import { SupportedLanguage } from '../types';

const TENURE_MAP: Record<string, Record<SupportedLanguage, string>> = {
  "Freehold": {
    en: "Freehold",
    "zh-CN": "永久产权",
    "zh-TW": "永久產權",
    ja: "永久所有権",
    ko: "영구 소유권",
    ar: "ملكية مطلقة",
    fr: "Pleine propriété"
  },
  "Leasehold": {
    en: "Leasehold",
    "zh-CN": "租赁产权",
    "zh-TW": "租賃產權",
    ja: "借地権",
    ko: "임차권",
    ar: "ملكية منفعة",
    fr: "Bail emphytéotique"
  }
};

const STATUS_MAP: Record<string, Record<SupportedLanguage, string>> = {
  "Under Construction": {
    en: "Under Construction",
    "zh-CN": "在建中",
    "zh-TW": "在建中",
    ja: "建設中",
    ko: "건설 중",
    ar: "قيد الإنشاء",
    fr: "En construction"
  },
  "Ready To Move": {
    en: "Ready To Move",
    "zh-CN": "现房/即刻入住",
    "zh-TW": "現房/即刻入住",
    ja: "即入居可",
    ko: "즉시 입주",
    ar: "جاهز للسكن",
    fr: "Prêt à emménager"
  },
  "New Launch": {
    en: "New Launch",
    "zh-CN": "全新推介",
    "zh-TW": "全新推介",
    ja: "新規発売",
    ko: "신규 분양",
    ar: "إطلاق جديد",
    fr: "Nouveau lancement"
  }
};

const TYPE_MAP: Record<string, Record<SupportedLanguage, string>> = {
  "Serviced Apartment": {
    en: "Serviced Apartment",
    "zh-CN": "服务式公寓",
    "zh-TW": "服務式公寓",
    ja: "サービスアパート",
    ko: "서비스 아파트",
    ar: "شقة مخدمة",
    fr: "Appartement de services"
  },
  "Mixed Development": {
    en: "Mixed Development",
    "zh-CN": "综合发展项目",
    "zh-TW": "綜合發展項目",
    ja: "複合開発",
    ko: "복합 개발",
    ar: "مشروع مختلط",
    fr: "Développement mixte"
  },
  "Condominium": {
    en: "Condominium",
    "zh-CN": "高级公寓",
    "zh-TW": "高級公寓",
    ja: "コンドミニアム",
    ko: "콘도미니엄",
    ar: "شقة سكنية مشتركة",
    fr: "Copropriété"
  },
  "Garden Condovilla & Landed Parkhome": {
    en: "Garden Condovilla & Landed Parkhome",
    "zh-CN": "花园洋房与联排别墅",
    "zh-TW": "花園洋房與聯排別墅",
    ja: "ガーデンコンドヴィラ＆パークホーム",
    ko: "가든 콘도빌라 & 타운홈",
    ar: "فيلا بحديقة ومنزل ريفي",
    fr: "Villa de jardin & maison de parc"
  },
  "Township": {
    en: "Township",
    "zh-CN": "独立城镇项目",
    "zh-TW": "獨立城鎮項目",
    ja: "タウンシップ",
    ko: "타운십 단지",
    ar: "بلدة متكاملة",
    fr: "Lotissement d'envergure"
  },
  "Information Pending Verification": {
    en: "Information Pending Verification",
    "zh-CN": "待核实信息",
    "zh-TW": "待核實信息",
    ja: "確認中情報",
    ko: "확인 대기 중",
    ar: "معلومات قيد التحقق",
    fr: "Informations en attente"
  }
};

const AREA_MAP: Record<string, Record<SupportedLanguage, string>> = {
  "USJ / Subang Jaya": {
    en: "USJ / Subang Jaya",
    "zh-CN": "USJ / 首邦市",
    "zh-TW": "USJ / 首邦市",
    ja: "USJ / スバン・ジャヤ",
    ko: "USJ / 수방 자야",
    ar: "USJ / سوبانغ جايا",
    fr: "USJ / Subang Jaya"
  },
  "Puchong": {
    en: "Puchong",
    "zh-CN": "蒲种",
    "zh-TW": "蒲種",
    ja: "プチョン",
    ko: "푸총",
    ar: "بوتشونغ",
    fr: "Puchong"
  },
  "Sungai Besi / Chan Sow Lin": {
    en: "Sungai Besi / Chan Sow Lin",
    "zh-CN": "新街场 / 陈秀连",
    "zh-TW": "新街場 / 陳秀連",
    ja: "スンガイベシ / チャンソウリン",
    ko: "숭아이 브시 / 찬 소우 린",
    ar: "سونغاي بيسي / تشان سو لين",
    fr: "Sungai Besi / Chan Sow Lin"
  },
  "Sri Petaling": {
    en: "Sri Petaling",
    "zh-CN": "大城堡",
    "zh-TW": "大城堡",
    ja: "スリ・ペタリン",
    ko: "스리 페탈링",
    ar: "سري بيتالينغ",
    fr: "Sri Petaling"
  },
  "Petaling Jaya": {
    en: "Petaling Jaya",
    "zh-CN": "八打灵再也",
    "zh-TW": "八打靈再也",
    ja: "ペタリン・ジャヤ",
    ko: "페탈링 자야",
    ar: "بيتالينغ جايا",
    fr: "Petaling Jaya"
  },
  "Bukit Jalil": {
    en: "Bukit Jalil",
    "zh-CN": "武吉加里尔",
    "zh-TW": "武吉加里爾",
    ja: "ブキット・ジャリル",
    ko: "부킷 자릴",
    ar: "بوكيت جليل",
    fr: "Bukit Jalil"
  },
  "Bangsar": {
    en: "Bangsar",
    "zh-CN": "孟沙",
    "zh-TW": "孟沙",
    ja: "バンサー",
    ko: "방사르",
    ar: "بانغسار",
    fr: "Bangsar"
  },
  "KLCC": {
    en: "KLCC",
    "zh-CN": "吉隆坡城中城 (KLCC)",
    "zh-TW": "吉隆坡城中城 (KLCC)",
    ja: "KLCC (クアラルンプール)",
    ko: "KLCC (쿠알라룸푸르)",
    ar: "وسط كوالالمبور (KLCC)",
    fr: "Centre-ville (KLCC)"
  },
  "TRX / Bukit Bintang": {
    en: "TRX / Bukit Bintang",
    "zh-CN": "TRX 敦拉萨 / 武吉免登",
    "zh-TW": "TRX 敦拉薩 / 武吉免登",
    ja: "TRX / ブキット・ビンタン",
    ko: "TRX / 부킷 빈탕",
    ar: "تي آر إكس / بوكيت بينتانغ",
    fr: "TRX / Bukit Bintang"
  },
  "Old Klang Road": {
    en: "Old Klang Road",
    "zh-CN": "旧巴生路",
    "zh-TW": "舊巴生路",
    ja: "オールド・クラン・ロード",
    ko: "올드 클랑 로드",
    ar: "طريق كلانغ القديم",
    fr: "Old Klang Road"
  },
  "Federal Avenue, Subang Jaya": {
    en: "Federal Avenue, Subang Jaya",
    "zh-CN": "联邦大道, 首邦市",
    "zh-TW": "聯邦大道, 首邦市",
    ja: "フェデラルアベニュー、スバンジャヤ",
    ko: "페더럴 애비뉴, 수방 자야",
    ar: "شارع فيدرال، سوبانغ جايا",
    fr: "Federal Avenue, Subang Jaya"
  },
  "Taman Desa / Old Klang Road": {
    en: "Taman Desa / Old Klang Road",
    "zh-CN": "郊外岭 / 旧巴生路",
    "zh-TW": "郊外嶺 / 舊巴生路",
    ja: "タマンデサ / オールドクランロード",
    ko: "타만 데사 / 올드 클랑 로드",
    ar: "تامن ديسا / طريق كلانغ القديم",
    fr: "Taman Desa / Old Klang Road"
  },
  "OUG / Kuchai Lama": {
    en: "OUG / Kuchai Lama",
    "zh-CN": "华联花园 / 古仔路",
    "zh-TW": "華聯花園 / 古仔路",
    ja: "OUG / クチャイ・ラマ",
    ko: "OUG / 쿠차이 라마",
    ar: "OUG / كوتشاي لاما",
    fr: "OUG / Kuchai Lama"
  },
  "Seputeh / Old Klang Road": {
    en: "Seputeh / Old Klang Road",
    "zh-CN": "士布爹 / 旧巴生路",
    "zh-TW": "士布爹 / 舊巴生路",
    ja: "スプテ / オールドクランロード",
    ko: "스푸테 / 올드 클랑 로드",
    ar: "سيبوتيه / طريق كلانغ القديم",
    fr: "Seputeh / Old Klang Road"
  },
  "Bukit Bintang / KLCC": {
    en: "Bukit Bintang / KLCC",
    "zh-CN": "武吉免登 / 吉隆坡城中城",
    "zh-TW": "武吉免登 / 吉隆坡城中城",
    ja: "ブキット・ビンタン / KLCC",
    ko: "부킷 빈탕 / KLCC",
    ar: "بوكيت بينتانغ / KLCC",
    fr: "Bukit Bintang / KLCC"
  },
  "Kuchai Lama": {
    en: "Kuchai Lama",
    "zh-CN": "古仔路",
    "zh-TW": "古仔路",
    ja: "クチャイ・ラマ",
    ko: "쿠차이 라마",
    ar: "كوتشاي لاما",
    fr: "Kuchai Lama"
  },
  "Kwasa Damansara, Shah Alam": {
    en: "Kwasa Damansara, Shah Alam",
    "zh-CN": "桂莎白沙罗, 莎阿南",
    "zh-TW": "桂莎白沙羅, 莎阿南",
    ja: "クワサ・ダマンサラ、シャアラム",
    ko: "콰사 다만사라, 샤알람",
    ar: "كواسا دامانسارا، شاه علم",
    fr: "Kwasa Damansara, Shah Alam"
  },
  "Sentul": {
    en: "Sentul",
    "zh-CN": "冼都",
    "zh-TW": "冼都",
    ja: "セントゥール",
    ko: "센툴",
    ar: "سينتول",
    fr: "Sentul"
  },
  "KLCC / Bukit Bintang": {
    en: "KLCC / Bukit Bintang",
    "zh-CN": "吉隆坡城中城 / 武吉免登",
    "zh-TW": "吉隆坡城中城 / 武吉免登",
    ja: "KLCC / ブキット・ビンタン",
    ko: "KLCC / 부킷 빈탕",
    ar: "KLCC / بوكيت بينتانغ",
    fr: "KLCC / Bukit Bintang"
  },
  "Penang": {
    en: "Penang",
    "zh-CN": "槟城",
    "zh-TW": "檳城",
    ja: "ペナン",
    ko: "페낭",
    ar: "بينانغ",
    fr: "Penang"
  },
  "Kuala Lumpur": {
    en: "Kuala Lumpur",
    "zh-CN": "吉隆坡",
    "zh-TW": "吉隆坡",
    ja: "クアラルンプール",
    ko: "쿠알라룸푸르",
    ar: "كوالالمبور",
    fr: "Kuala Lumpur"
  },
  "Johor Bahru": {
    en: "Johor Bahru",
    "zh-CN": "新山",
    "zh-TW": "新山",
    ja: "ジョホールバル",
    ko: "조호르바루",
    ar: "جوهور باهرو",
    fr: "Johor Bahru"
  }
};

const TERM_REPLACEMENTS: Record<SupportedLanguage, Record<string, string>> = {
  en: {},
  "zh-CN": {
    "Selangor": "雪兰莪",
    "Kuala Lumpur": "吉隆坡",
    "Jalan": "路",
    "Lorong": "巷",
    "Taman": "花园",
    "Off": "旁",
    "Opposite": "对面",
    "Next to": "紧邻",
    "Link to": "直通",
    "Bukit": "武吉",
    "Bandar": "镇",
    "Township": "城镇项目",
    "Sdn Bhd": "私人有限公司",
    "Bhd": "公司",
    "Sdn. Bhd.": "私人有限公司",
    "Sdn.Bhd.": "私人有限公司",
    "Property": "地产",
    "Development": "发展",
    "Resources": "资源",
    "Tower": "塔楼",
    "Puchong": "蒲种",
    "Subang Jaya": "首邦市",
    "Petaling Jaya": "八打灵再也",
    "Shah Alam": "莎阿南",
    "Kwasa Damansara": "桂莎白沙罗",
    "Ara Damansara": "阿拉白沙罗",
    "Damansara": "白沙罗",
    "Cheras": "蕉赖",
    "Sentul": "冼都",
    "Taipan": "泰攀",
    "Jalil Perkasa": "加里尔柏卡沙",
    "Sri Permaisuri": "皇后的皇后",
    "Klang Lama": "旧巴生",
    "Old Klang Road": "旧巴生路",
    "Information Pending Verification": "信息待核实",
    "Pending Verification": "信息待核实",
  },
  "zh-TW": {
    "Selangor": "雪蘭莪",
    "Kuala Lumpur": "吉隆坡",
    "Jalan": "路",
    "Lorong": "巷",
    "Taman": "花園",
    "Off": "旁",
    "Opposite": "對面",
    "Next to": "緊鄰",
    "Link to": "直通",
    "Bukit": "武吉",
    "Bandar": "鎮",
    "Township": "城鎮項目",
    "Sdn Bhd": "私人有限公司",
    "Bhd": "公司",
    "Sdn. Bhd.": "私人有限公司",
    "Sdn.Bhd.": "私人有限公司",
    "Property": "地產",
    "Development": "發展",
    "Resources": "資源",
    "Tower": "塔樓",
    "Puchong": "蒲種",
    "Subang Jaya": "首邦市",
    "Petaling Jaya": "八打靈再也",
    "Shah Alam": "莎阿南",
    "Kwasa Damansara": "桂莎白沙羅",
    "Ara Damansara": "阿拉白沙羅",
    "Damansara": "白沙羅",
    "Cheras": "蕉賴",
    "Sentul": "冼都",
    "Taipan": "泰攀",
    "Jalil Perkasa": "加里爾柏卡沙",
    "Sri Permaisuri": "皇后的皇后",
    "Klang Lama": "舊巴生",
    "Old Klang Road": "舊巴生路",
    "Information Pending Verification": "信息待核實",
    "Pending Verification": "信息待核實",
  },
  ja: {
    "Selangor": "セランゴール州",
    "Kuala Lumpur": "クアラルンプール",
    "Jalan": "通り",
    "Lorong": "路地",
    "Taman": "園/タマン",
    "Off": "近く",
    "Opposite": "向かい",
    "Next to": "隣",
    "Link to": "直結",
    "Bukit": "ブキット",
    "Bandar": "タウン",
    "Township": "タウンシップ",
    "Sdn Bhd": "Sdn Bhd",
    "Bhd": "Bhd",
    "Sdn. Bhd.": "Sdn Bhd",
    "Property": "プロパティ",
    "Development": "デベロップメント",
    "Puchong": "プチョン",
    "Subang Jaya": "スバン・ジャヤ",
    "Petaling Jaya": "ペタリン・ジャヤ",
    "Shah Alam": "シャアラム",
    "Kwasa Damansara": "クワサ・ダマンサラ",
    "Damansara": "ダマンサラ",
    "Old Klang Road": "オールド・クラン・ロード",
    "Information Pending Verification": "情報確認中",
    "Pending Verification": "情報確認中",
  },
  ko: {
    "Selangor": "셀랑고르",
    "Kuala Lumpur": "쿠알라룸푸르",
    "Jalan": "대로",
    "Lorong": "골목",
    "Taman": "타운",
    "Off": "부근",
    "Opposite": "맞은편",
    "Next to": "옆",
    "Link to": "연결",
    "Bukit": "부킷",
    "Bandar": "타운십",
    "Township": "타운십",
    "Sdn Bhd": "Sdn Bhd",
    "Bhd": "Bhd",
    "Property": "프로퍼티",
    "Development": "디벨롭먼트",
    "Puchong": "푸총",
    "Subang Jaya": "수방 자야",
    "Petaling Jaya": "페탈링 자야",
    "Shah Alam": "샤알람",
    "Kwasa Damansara": "콰사 다만사라",
    "Damansara": "다만사라",
    "Old Klang Road": "올드 클랑 로드",
    "Information Pending Verification": "확인 대기 중",
    "Pending Verification": "확인 대기 중",
  },
  ar: {
    "Selangor": "سيلانجور",
    "Kuala Lumpur": "كوالالمبور",
    "Jalan": "شارع",
    "Lorong": "ممر",
    "Taman": "حديقة",
    "Off": "بجوار",
    "Opposite": "مقابل",
    "Next to": "بجوار",
    "Link to": "متصل بـ",
    "Bukit": "بوكيت",
    "Bandar": "بلدة",
    "Township": "بلدة سكنية",
    "Sdn Bhd": "ذات مسؤولية محدودة",
    "Bhd": "العامة",
    "Property": "العقارية",
    "Development": "للتطوير",
    "Puchong": "بوتشونغ",
    "Subang Jaya": "سوبانغ جايا",
    "Petaling Jaya": "بيتالينغ جايا",
    "Shah Alam": "شاه علم",
    "Kwasa Damansara": "كواسا دامانسارا",
    "Damansara": "دامانسارا",
    "Old Klang Road": "طريق كلانغ القديم",
    "Information Pending Verification": "المعلومات قيد التحقق",
  },
  fr: {
    "Selangor": "Selangor",
    "Kuala Lumpur": "Kuala Lumpur",
    "Jalan": "Rue",
    "Lorong": "Allée",
    "Taman": "Jardin",
    "Off": "Près de",
    "Opposite": "En face de",
    "Next to": "À côté de",
    "Link to": "Relié à",
    "Bukit": "Bukit",
    "Bandar": "Ville",
    "Township": "Lotissement",
    "Sdn Bhd": "Sdn Bhd",
    "Bhd": "Bhd",
    "Property": "Immobilier",
    "Development": "Développement",
    "Puchong": "Puchong",
    "Subang Jaya": "Subang Jaya",
    "Petaling Jaya": "Petaling Jaya",
    "Shah Alam": "Shah Alam",
    "Kwasa Damansara": "Kwasa Damansara",
    "Damansara": "Damansara",
    "Old Klang Road": "Old Klang Road",
    "Information Pending Verification": "Informations en attente",
  }
};

export function translateTenure(tenure: string, lang: SupportedLanguage): string {
  if (lang === 'en') return tenure;
  const key = tenure ? tenure.trim() : '';
  const item = TENURE_MAP[key];
  if (item && item[lang]) return item[lang];
  return tenure;
}

export function translateCompletionStatus(status: string, lang: SupportedLanguage): string {
  if (lang === 'en') return status;
  const key = status ? status.trim() : '';
  const item = STATUS_MAP[key];
  if (item && item[lang]) return item[lang];
  return status;
}

export function translateProjectType(type: string, lang: SupportedLanguage): string {
  if (lang === 'en') return type;
  const key = type ? type.trim() : '';
  const item = TYPE_MAP[key];
  if (item && item[lang]) return item[lang];
  return type;
}

export function translateArea(area: string, lang: SupportedLanguage): string {
  if (lang === 'en') return area;
  const key = area ? area.trim() : '';
  const item = AREA_MAP[key];
  if (item && item[lang]) return item[lang];
  return area;
}

export function translateDeveloper(developer: string, lang: SupportedLanguage): string {
  if (lang === 'en') return developer;
  let text = developer || '';
  const replacements = TERM_REPLACEMENTS[lang];
  if (!replacements) return text;

  // Sorted by length descending to match longer strings first
  const keys = Object.keys(replacements).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    const r = new RegExp(`\\b${escapeRegExp(k)}\\b`, 'g');
    text = text.replace(r, replacements[k]);
    // Also try without word boundaries for custom cases like Sdn Bhd in brand names
    if (k.toLowerCase().includes('sdn') || k.toLowerCase().includes('bhd')) {
      text = text.split(k).join(replacements[k]);
    }
  }
  return text;
}

export function translateLocation(location: string, lang: SupportedLanguage): string {
  if (lang === 'en') return location;
  let text = location || '';
  const replacements = TERM_REPLACEMENTS[lang];
  if (!replacements) return text;

  const keys = Object.keys(replacements).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    text = text.split(k).join(replacements[k]);
  }
  return text;
}

export function translateMaintenanceFeeStr(feeStr: string, lang: SupportedLanguage): string {
  if (lang === 'en') return feeStr;
  if (!feeStr) return '';
  if (feeStr === "Information Pending Verification") {
    return TYPE_MAP["Information Pending Verification"][lang] || feeStr;
  }
  let text = feeStr;
  if (lang.startsWith('zh')) {
    text = text.replace("sqft", "平方英尺");
  } else if (lang === 'ja') {
    text = text.replace("sqft", "平方フィート");
  } else if (lang === 'ko') {
    text = text.replace("sqft", "평방피트");
  }
  return text;
}

export function translateTotalUnitsStr(unitsStr: string, lang: SupportedLanguage): string {
  if (lang === 'en') return unitsStr;
  if (!unitsStr) return '';
  if (unitsStr === "Information Pending Verification") {
    return TYPE_MAP["Information Pending Verification"][lang] || unitsStr;
  }
  let text = unitsStr;
  if (lang.startsWith('zh')) {
    text = text.replace("Units", "户").replace("Unit", "户");
  } else if (lang === 'ja') {
    text = text.replace("Units", "戸").replace("Unit", "戸");
  } else if (lang === 'ko') {
    text = text.replace("Units", "세대").replace("Unit", "세대");
  }
  return text;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
