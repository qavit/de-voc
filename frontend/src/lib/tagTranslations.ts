import type { SupportedLocale } from './i18n'

type TagTranslation = {
  'en-US': string
  'zh-TW': string
}

const tagTranslations: Record<string, TagTranslation> = {
  'Adj. Dekl.': { 'en-US': 'Adjective declension', 'zh-TW': '形容詞變化' },
  Adresse: { 'en-US': 'Address', 'zh-TW': '地址' },
  Aktivität: { 'en-US': 'Activities', 'zh-TW': '活動' },
  Alter: { 'en-US': 'Age', 'zh-TW': '年齡' },
  Begriff: { 'en-US': 'Concepts', 'zh-TW': '概念' },
  Behälter: { 'en-US': 'Containers', 'zh-TW': '容器' },
  Bereich: { 'en-US': 'Fields', 'zh-TW': '領域' },
  Berg: { 'en-US': 'Mountain', 'zh-TW': '山岳' },
  Bewegung: { 'en-US': 'Movement', 'zh-TW': '移動' },
  Beziehung: { 'en-US': 'Relationships', 'zh-TW': '關係' },
  Breite: { 'en-US': 'Width', 'zh-TW': '寬度' },
  Brot: { 'en-US': 'Bread', 'zh-TW': '麵包' },
  Büro: { 'en-US': 'Office', 'zh-TW': '辦公室' },
  Dessert: { 'en-US': 'Dessert', 'zh-TW': '甜點' },
  Dicke: { 'en-US': 'Thickness', 'zh-TW': '厚度' },
  Ding: { 'en-US': 'Things', 'zh-TW': '物品' },
  Eigenschaft: { 'en-US': 'Properties', 'zh-TW': '特性' },
  Elektrogeräte: { 'en-US': 'Appliances', 'zh-TW': '家電' },
  Entfernung: { 'en-US': 'Distance', 'zh-TW': '距離' },
  Erde: { 'en-US': 'Soil', 'zh-TW': '土壤' },
  Essen: { 'en-US': 'Food', 'zh-TW': '食物' },
  Fach: { 'en-US': 'Subjects', 'zh-TW': '學科' },
  Familie: { 'en-US': 'Family', 'zh-TW': '家庭' },
  Farbe: { 'en-US': 'Colors', 'zh-TW': '顏色' },
  Feuchtigkeit: { 'en-US': 'Moisture', 'zh-TW': '濕度' },
  Fleisch: { 'en-US': 'Meat', 'zh-TW': '肉類' },
  Fluss: { 'en-US': 'River', 'zh-TW': '河流' },
  Form: { 'en-US': 'Shapes', 'zh-TW': '形狀' },
  Gebiet: { 'en-US': 'Regions', 'zh-TW': '區域' },
  Gefühl: { 'en-US': 'Feelings', 'zh-TW': '感受' },
  Geld: { 'en-US': 'Money', 'zh-TW': '金錢' },
  Gemeinschaft: { 'en-US': 'Communities', 'zh-TW': '社群' },
  Gemüse: { 'en-US': 'Vegetables', 'zh-TW': '蔬菜' },
  Geruch: { 'en-US': 'Smell', 'zh-TW': '氣味' },
  Geschmack: { 'en-US': 'Taste', 'zh-TW': '味道' },
  Geschwindigkeit: { 'en-US': 'Speed', 'zh-TW': '速度' },
  Gesellschaft: { 'en-US': 'Society', 'zh-TW': '社會' },
  Gesundheit: { 'en-US': 'Health', 'zh-TW': '健康' },
  Getränke: { 'en-US': 'Drinks', 'zh-TW': '飲料' },
  Gewicht: { 'en-US': 'Weight', 'zh-TW': '重量' },
  Grammatik: { 'en-US': 'Grammar', 'zh-TW': '文法' },
  Gruppe: { 'en-US': 'Groups', 'zh-TW': '群體' },
  Größe: { 'en-US': 'Size', 'zh-TW': '大小' },
  Haus: { 'en-US': 'Houses', 'zh-TW': '房屋' },
  Helligkeit: { 'en-US': 'Brightness', 'zh-TW': '亮度' },
  Himmel: { 'en-US': 'Sky', 'zh-TW': '天空' },
  Hobby: { 'en-US': 'Hobbies', 'zh-TW': '興趣' },
  Härte: { 'en-US': 'Hardness', 'zh-TW': '硬度' },
  Häufigkeit: { 'en-US': 'Frequency', 'zh-TW': '頻率' },
  Höhe: { 'en-US': 'Height', 'zh-TW': '高度' },
  Identität: { 'en-US': 'Identity', 'zh-TW': '身分' },
  Instrument: { 'en-US': 'Instruments', 'zh-TW': '器具' },
  Jahreszeit: { 'en-US': 'Season', 'zh-TW': '季節' },
  Klasse: { 'en-US': 'Class', 'zh-TW': '類別' },
  Kleidung: { 'en-US': 'Clothing', 'zh-TW': '衣物' },
  Klinik: { 'en-US': 'Clinic', 'zh-TW': '診所' },
  Kontinent: { 'en-US': 'Continent', 'zh-TW': '洲' },
  Kultur: { 'en-US': 'Culture', 'zh-TW': '文化' },
  Körper: { 'en-US': 'Body', 'zh-TW': '身體' },
  Küche: { 'en-US': 'Kitchen', 'zh-TW': '廚房' },
  Land: { 'en-US': 'Country', 'zh-TW': '國家' },
  Lautstärke: { 'en-US': 'Volume', 'zh-TW': '音量' },
  Läden: { 'en-US': 'Shops', 'zh-TW': '商店' },
  Länge: { 'en-US': 'Length', 'zh-TW': '長度' },
  Mahlzeit: { 'en-US': 'Meals', 'zh-TW': '餐點' },
  Mathematik: { 'en-US': 'Mathematics', 'zh-TW': '數學' },
  Medizin: { 'en-US': 'Medicine', 'zh-TW': '醫藥' },
  Menge: { 'en-US': 'Quantity', 'zh-TW': '數量' },
  Mensch: { 'en-US': 'People', 'zh-TW': '人物' },
  Milchprodukte: { 'en-US': 'Dairy products', 'zh-TW': '乳製品' },
  Modelverb: { 'en-US': 'Modal verb', 'zh-TW': '情態動詞' },
  Monat: { 'en-US': 'Month', 'zh-TW': '月份' },
  Möbel: { 'en-US': 'Furniture', 'zh-TW': '家具' },
  Nationalität: { 'en-US': 'Nationality', 'zh-TW': '國籍' },
  Natur: { 'en-US': 'Nature', 'zh-TW': '自然' },
  Oberhaupt: { 'en-US': 'Head of state', 'zh-TW': '國家元首' },
  Obst: { 'en-US': 'Fruit', 'zh-TW': '水果' },
  Ort: { 'en-US': 'Places', 'zh-TW': '地點' },
  Ortsname: { 'en-US': 'Place names', 'zh-TW': '地名' },
  Persönlichkeit: { 'en-US': 'Personality', 'zh-TW': '個性' },
  Pflanze: { 'en-US': 'Plants', 'zh-TW': '植物' },
  Politik: { 'en-US': 'Politics', 'zh-TW': '政治' },
  Preis: { 'en-US': 'Price', 'zh-TW': '價格' },
  Qualität: { 'en-US': 'Quality', 'zh-TW': '品質' },
  Reichtum: { 'en-US': 'Wealth', 'zh-TW': '財富' },
  Richtung: { 'en-US': 'Direction', 'zh-TW': '方向' },
  Sache: { 'en-US': 'Matters', 'zh-TW': '事項' },
  Schule: { 'en-US': 'School', 'zh-TW': '學校' },
  Schönheit: { 'en-US': 'Beauty', 'zh-TW': '美感' },
  Sicherheit: { 'en-US': 'Safety', 'zh-TW': '安全' },
  Sport: { 'en-US': 'Sports', 'zh-TW': '運動' },
  Sprache: { 'en-US': 'Language', 'zh-TW': '語言' },
  Stadt: { 'en-US': 'City', 'zh-TW': '城市' },
  Stoff: { 'en-US': 'Materials', 'zh-TW': '材質' },
  Stoffe: { 'en-US': 'Substances', 'zh-TW': '物質' },
  Stärke: { 'en-US': 'Strength', 'zh-TW': '強度' },
  Tag: { 'en-US': 'Day', 'zh-TW': '日子' },
  Tageszeit: { 'en-US': 'Time of day', 'zh-TW': '一天中的時段' },
  Temperatur: { 'en-US': 'Temperature', 'zh-TW': '溫度' },
  Textur: { 'en-US': 'Texture', 'zh-TW': '質地' },
  Tier: { 'en-US': 'Animals', 'zh-TW': '動物' },
  Umwelt: { 'en-US': 'Environment', 'zh-TW': '環境' },
  Unterkunft: { 'en-US': 'Accommodation', 'zh-TW': '住宿' },
  Vehrhehr: { 'en-US': 'Traffic', 'zh-TW': '交通' },
  Vehrkehr: { 'en-US': 'Traffic', 'zh-TW': '交通' },
  Wasser: { 'en-US': 'Water', 'zh-TW': '水' },
  Wetter: { 'en-US': 'Weather', 'zh-TW': '天氣' },
  Wirtschaft: { 'en-US': 'Economy', 'zh-TW': '經濟' },
  Woche: { 'en-US': 'Week', 'zh-TW': '星期' },
  Zahl: { 'en-US': 'Numbers', 'zh-TW': '數字' },
  Zeit: { 'en-US': 'Time', 'zh-TW': '時間' },
  Zeitraum: { 'en-US': 'Time periods', 'zh-TW': '時期' },
  Zutate: { 'en-US': 'Ingredients', 'zh-TW': '食材' },
  'adj. dekl.': { 'en-US': 'Adjective declension', 'zh-TW': '形容詞變化' },
  tier: { 'en-US': 'Animals', 'zh-TW': '動物' },
  'weak declension': { 'en-US': 'Weak declension', 'zh-TW': '弱變化' },
  'wether 閹羊': { 'en-US': 'Wether', 'zh-TW': '閹羊' },
}

function translateSegment(segment: string, locale: SupportedLocale): string {
  const trimmed = segment.trim()
  if (locale === 'de-DE') return trimmed
  return tagTranslations[trimmed]?.[locale] ?? trimmed
}

export function localizeTag(tag: string, locale: SupportedLocale): string {
  const trimmed = tag.trim()
  if (locale === 'de-DE') return trimmed

  const direct = tagTranslations[trimmed]?.[locale]
  if (direct) return direct

  if (!trimmed.includes('/')) return trimmed

  return trimmed
    .split('/')
    .map((segment) => translateSegment(segment, locale))
    .join(' / ')
}
