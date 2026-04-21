import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type SupportedLocale = 'en-US' | 'de-DE' | 'zh-TW'

type TranslationValue = string | ((params?: Record<string, string | number>) => string)

type TranslationTree = {
  [key: string]: TranslationTree | TranslationValue
}

function pick(params: Record<string, string | number> | undefined, key: string): string | number {
  return params?.[key] ?? ''
}

const STORAGE_KEY = 'vocabulary-master.locale'

const dictionaries: Record<SupportedLocale, TranslationTree> = {
  'en-US': {
    app: {
      eyebrow: 'Vocabulary Master',
      title: 'German Learning Platform',
      navManager: 'Manager',
      navReview: 'Review Session',
      localeLabel: 'Language',
    },
    common: {
      loading: 'Loading...',
      retry: 'Retry',
      previous: 'Previous',
      next: 'Next',
      none: '-',
      now: 'Now',
      unknown: 'unknown',
      entries: (params) => `${pick(params, 'count')} entries`,
      pageOf: (params) => `Page ${pick(params, 'page')} / ${pick(params, 'total')}`,
      days: (params) => `${pick(params, 'count')} day(s)`,
    },
    manager: {
      eyebrow: 'Vocab Manager',
      title: 'Vocabulary Management & Data Inspection',
      searchPlaceholder: 'Search lemma, meaning, note...',
      allPos: 'All POS',
      noun: 'Noun',
      verb: 'Verb',
      adjective: 'Adjective',
      sortLemma: 'Sort: Lemma',
      sortPos: 'Sort: POS',
      sortCategory: 'Sort: Category',
      sortDueDate: 'Sort: Due Date',
      loadError: 'Failed to load vocabularies. Is the backend running?',
      detailError: 'Failed to load vocabulary detail.',
      noResults: 'No vocabularies matched this filter.',
      loadingRecords: 'Loading records...',
      tableLemma: 'Lemma',
      tablePos: 'POS',
      tableMeanings: 'Meanings',
      tableTags: 'Tags',
      strong: 'Strong',
      detailEmpty: 'Select a vocabulary to inspect its language data and SRS state.',
      detailLoading: 'Loading detail...',
      detailEyebrow: 'Vocabulary Detail',
      meanings: 'Meanings',
      germanDetail: 'German Detail',
      article: 'Article',
      plural: 'Plural',
      praesens: 'Präsens',
      praeteritum: 'Präteritum',
      partizipII: 'Partizip II',
      comparative: 'Comparative',
      superlative: 'Superlative',
      verbPatterns: 'Verb Patterns',
      srsState: 'SRS State',
      ease: 'Ease',
      interval: 'Interval',
      repetitions: 'Repetitions',
      due: 'Due',
      dictionaryLinks: 'Dictionary Links',
      notes: 'Notes',
    },
    review: {
      loadingSession: 'Loading review session...',
      loadError: 'Failed to load review session.',
      saveError: 'Failed to save review result.',
      eyebrow: 'Study Session',
      sessionEyebrow: 'Session',
      title: "Today's Review Rhythm",
      allCaughtUp: 'All caught up',
      allCaughtUpBody: 'No cards are currently due. You can refresh to start a new session later.',
      refresh: 'Refresh session',
      sessionId: (params) => `Session ID: ${pick(params, 'id')}`,
      completed: (params) => `Completed: ${pick(params, 'completed')} / ${pick(params, 'total')}`,
      currentCard: (params) => `Current Card: ${pick(params, 'current')} / ${pick(params, 'total')}`,
      dueCards: (params) => `Due Cards: ${pick(params, 'count')}`,
      reviews30: (params) => `30-day Reviews: ${pick(params, 'count')}`,
      sessions30: (params) => `30-day Sessions: ${pick(params, 'count')}`,
      tapToReveal: 'Tap to reveal',
      unknownPos: 'unknown part of speech',
      patterns: (params) => `Patterns: ${pick(params, 'value')}`,
      flipHint: 'Flip the card to record your review result.',
      gradeAgain: 'Again',
      gradeAgainHint: 'Restart to 1 day',
      gradeHard: 'Hard',
      gradeHardHint: 'Shorten interval',
      gradeGood: 'Good',
      gradeGoodHint: 'Keep schedule',
      gradeEasy: 'Easy',
      gradeEasyHint: 'Extend interval',
    },
  },
  'de-DE': {
    app: {
      eyebrow: 'Vocabulary Master',
      title: 'Deutsch-Lernplattform',
      navManager: 'Verwaltung',
      navReview: 'Lernsitzung',
      localeLabel: 'Sprache',
    },
    common: {
      loading: 'Wird geladen...',
      retry: 'Erneut versuchen',
      previous: 'Zurück',
      next: 'Weiter',
      none: '-',
      now: 'Jetzt',
      unknown: 'unbekannt',
      entries: (params) => `${pick(params, 'count')} Einträge`,
      pageOf: (params) => `Seite ${pick(params, 'page')} / ${pick(params, 'total')}`,
      days: (params) => `${pick(params, 'count')} Tag(e)`,
    },
    manager: {
      eyebrow: 'Vokabelverwaltung',
      title: 'Vokabeln und Sprachdaten prüfen',
      searchPlaceholder: 'Nach Lemma, Bedeutung oder Notiz suchen...',
      allPos: 'Alle Wortarten',
      noun: 'Substantiv',
      verb: 'Verb',
      adjective: 'Adjektiv',
      sortLemma: 'Sortierung: Lemma',
      sortPos: 'Sortierung: Wortart',
      sortCategory: 'Sortierung: Kategorie',
      sortDueDate: 'Sortierung: Fälligkeit',
      loadError: 'Vokabeln konnten nicht geladen werden. Läuft das Backend?',
      detailError: 'Vokabeldetails konnten nicht geladen werden.',
      noResults: 'Keine Vokabeln entsprechen diesem Filter.',
      loadingRecords: 'Einträge werden geladen...',
      tableLemma: 'Lemma',
      tablePos: 'Wortart',
      tableMeanings: 'Bedeutungen',
      tableTags: 'Tags',
      strong: 'Stark',
      detailEmpty: 'Wähle eine Vokabel aus, um Sprachdaten und SRS-Status zu sehen.',
      detailLoading: 'Details werden geladen...',
      detailEyebrow: 'Vokabeldetails',
      meanings: 'Bedeutungen',
      germanDetail: 'Deutsche Details',
      article: 'Artikel',
      plural: 'Plural',
      praesens: 'Präsens',
      praeteritum: 'Präteritum',
      partizipII: 'Partizip II',
      comparative: 'Komparativ',
      superlative: 'Superlativ',
      verbPatterns: 'Verbmuster',
      srsState: 'SRS-Status',
      ease: 'Leichtigkeit',
      interval: 'Intervall',
      repetitions: 'Wiederholungen',
      due: 'Fällig',
      dictionaryLinks: 'Wörterbuch-Links',
      notes: 'Notizen',
    },
    review: {
      loadingSession: 'Lernsitzung wird geladen...',
      loadError: 'Lernsitzung konnte nicht geladen werden.',
      saveError: 'Bewertung konnte nicht gespeichert werden.',
      eyebrow: 'Lernsitzung',
      sessionEyebrow: 'Sitzung',
      title: 'Rhythmus der heutigen Wiederholung',
      allCaughtUp: 'Alles erledigt',
      allCaughtUpBody: 'Derzeit sind keine Karten fällig. Später kannst du die Sitzung neu laden.',
      refresh: 'Sitzung aktualisieren',
      sessionId: (params) => `Sitzungs-ID: ${pick(params, 'id')}`,
      completed: (params) => `Erledigt: ${pick(params, 'completed')} / ${pick(params, 'total')}`,
      currentCard: (params) => `Aktuelle Karte: ${pick(params, 'current')} / ${pick(params, 'total')}`,
      dueCards: (params) => `Fällige Karten: ${pick(params, 'count')}`,
      reviews30: (params) => `Wiederholungen in 30 Tagen: ${pick(params, 'count')}`,
      sessions30: (params) => `Sitzungen in 30 Tagen: ${pick(params, 'count')}`,
      tapToReveal: 'Zum Aufdecken tippen',
      unknownPos: 'unbekannte Wortart',
      patterns: (params) => `Muster: ${pick(params, 'value')}`,
      flipHint: 'Drehe die Karte um, um das Ergebnis zu speichern.',
      gradeAgain: 'Nochmal',
      gradeAgainHint: 'Zurück auf 1 Tag',
      gradeHard: 'Schwer',
      gradeHardHint: 'Intervall verkürzen',
      gradeGood: 'Gut',
      gradeGoodHint: 'Zeitplan halten',
      gradeEasy: 'Leicht',
      gradeEasyHint: 'Intervall verlängern',
    },
  },
  'zh-TW': {
    app: {
      eyebrow: 'Vocabulary Master',
      title: '德文學習平台',
      navManager: '管理後台',
      navReview: '複習模式',
      localeLabel: '語言',
    },
    common: {
      loading: '載入中...',
      retry: '重試',
      previous: '上一頁',
      next: '下一頁',
      none: '-',
      now: '現在',
      unknown: '未知',
      entries: (params) => `共 ${pick(params, 'count')} 筆`,
      pageOf: (params) => `第 ${pick(params, 'page')} / ${pick(params, 'total')} 頁`,
      days: (params) => `${pick(params, 'count')} 天`,
    },
    manager: {
      eyebrow: '詞條管理',
      title: '詞條管理與資料檢視',
      searchPlaceholder: '搜尋 lemma、釋義或筆記...',
      allPos: '全部詞性',
      noun: '名詞',
      verb: '動詞',
      adjective: '形容詞',
      sortLemma: '排序：Lemma',
      sortPos: '排序：詞性',
      sortCategory: '排序：分類',
      sortDueDate: '排序：到期日',
      loadError: '無法載入詞條，請確認後端是否啟動。',
      detailError: '無法載入詞條詳情。',
      noResults: '沒有符合條件的詞條。',
      loadingRecords: '資料載入中...',
      tableLemma: 'Lemma',
      tablePos: '詞性',
      tableMeanings: '釋義',
      tableTags: '標籤',
      strong: '強變化',
      detailEmpty: '請先選取一個詞條，以檢視它的語言資料與 SRS 狀態。',
      detailLoading: '詳情載入中...',
      detailEyebrow: '詞條詳情',
      meanings: '釋義',
      germanDetail: '德文細節',
      article: '冠詞',
      plural: '複數',
      praesens: '現在式',
      praeteritum: '過去式',
      partizipII: '過去分詞',
      comparative: '比較級',
      superlative: '最高級',
      verbPatterns: '動詞搭配',
      srsState: 'SRS 狀態',
      ease: '易度',
      interval: '間隔',
      repetitions: '複習次數',
      due: '到期時間',
      dictionaryLinks: '外部辭典連結',
      notes: '筆記',
    },
    review: {
      loadingSession: '複習 session 載入中...',
      loadError: '無法載入複習 session。',
      saveError: '無法儲存複習結果。',
      eyebrow: '學習 Session',
      sessionEyebrow: 'Session',
      title: '今天的複習節奏',
      allCaughtUp: '目前都複習完了',
      allCaughtUpBody: '目前沒有到期卡片，稍後可以重新整理再開新 session。',
      refresh: '重新整理 session',
      sessionId: (params) => `Session ID：${pick(params, 'id')}`,
      completed: (params) => `已完成：${pick(params, 'completed')} / ${pick(params, 'total')}`,
      currentCard: (params) => `目前卡片：${pick(params, 'current')} / ${pick(params, 'total')}`,
      dueCards: (params) => `到期卡片：${pick(params, 'count')}`,
      reviews30: (params) => `近 30 天複習次數：${pick(params, 'count')}`,
      sessions30: (params) => `近 30 天完成 session：${pick(params, 'count')}`,
      tapToReveal: '點擊翻面',
      unknownPos: '未知詞性',
      patterns: (params) => `搭配：${pick(params, 'value')}`,
      flipHint: '翻卡後再記錄這次複習結果。',
      gradeAgain: '忘記',
      gradeAgainHint: '回到 1 天',
      gradeHard: '困難',
      gradeHardHint: '縮短間隔',
      gradeGood: '普通',
      gradeGoodHint: '維持節奏',
      gradeEasy: '簡單',
      gradeEasyHint: '拉長間隔',
    },
  },
}

type I18nContextValue = {
  locale: SupportedLocale
  setLocale: (locale: SupportedLocale) => void
  t: (key: string, params?: Record<string, string | number>) => string
  formatDateTime: (value: string | number | Date) => string
  formatNumber: (value: number) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function getNavigatorLocale(): SupportedLocale {
  if (typeof navigator === 'undefined') return 'zh-TW'
  const value = navigator.language
  if (value.startsWith('de')) return 'de-DE'
  if (value.startsWith('zh')) return 'zh-TW'
  return 'en-US'
}

function getStoredLocale(): SupportedLocale {
  if (typeof window === 'undefined') return 'zh-TW'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'en-US' || stored === 'de-DE' || stored === 'zh-TW') return stored
  return getNavigatorLocale()
}

function resolveTranslation(locale: SupportedLocale, key: string): TranslationValue {
  const tree = dictionaries[locale]
  const fallback = dictionaries['en-US']
  const parts = key.split('.')

  function readFrom(source: TranslationTree): TranslationValue | TranslationTree | undefined {
    let current: TranslationTree | TranslationValue | undefined = source
    for (const part of parts) {
      if (!current || typeof current === 'string' || typeof current === 'function') {
        return undefined
      }
      current = current[part]
    }
    return current
  }

  const resolved = readFrom(tree) ?? readFrom(fallback)
  if (typeof resolved === 'string' || typeof resolved === 'function') {
    return resolved
  }
  if (import.meta.env.DEV) {
    console.warn(`[i18n] Missing translation key: "${key}" for locale "${locale}"`)
  }
  return key
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(getStoredLocale)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale)
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      setLocale: setLocaleState,
      t: (key, params) => {
        const result = resolveTranslation(locale, key)
        if (typeof result === 'function') {
          return result(params)
        }
        return result
      },
      formatDateTime: (value) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)),
      formatNumber: (value) => new Intl.NumberFormat(locale).format(value),
    }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}
