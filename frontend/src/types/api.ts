export interface MeaningDTO {
  language_code: string
  text: string
  position: number
}

export interface ExampleDTO {
  language_code: string
  text: string
  translation: string | null
  source: string
  position: number
}

export interface GermanDetailDTO {
  article: string | null
  plural_form: string | null
  transitivity: string | null
  present_3sg: string | null
  preterite: string | null
  partizip_ii: string | null
  auxiliary: string | null
  is_strong_verb: boolean
  comparative: string | null
  superlative: string | null
  verb_patterns: string[]
}

export interface SRSStateDTO {
  ease_factor: number
  interval_days: number
  repetitions: number
  due_at: string | null
  last_reviewed_at: string | null
}

export interface DictionaryLinksDTO {
  dict_cc: string
  wiktionary: string
  langenscheidt: string
}

export interface VocabularyListItemDTO {
  id: number
  lemma: string
  part_of_speech: string | null
  category: string | null
  sub_category: string | null
  status: string
  tags: string[]
  meanings: MeaningDTO[]
  german_detail: GermanDetailDTO | null
  srs_state: SRSStateDTO | null
}

export interface VocabularyDetailDTO extends VocabularyListItemDTO {
  source: string
  notes: string | null
  examples: ExampleDTO[]
  dictionaries: DictionaryLinksDTO
}

export interface PaginatedVocabularyResponse {
  total: number
  page: number
  page_size: number
  data: VocabularyListItemDTO[]
}

export interface StudySessionDTO {
  id: number
  started_at: string
  completed_at: string | null
  total_cards: number
  completed_cards: number
}

export interface DueReviewResponse {
  session: StudySessionDTO
  cards: { vocabulary: VocabularyDetailDTO }[]
}

export interface ReviewEventResultDTO {
  vocabulary_id: number
  grade: number
  reviewed_at: string
  next_due_at: string
  interval_days: number
  ease_factor: number
  repetitions: number
  session: StudySessionDTO | null
}

export interface StatsOverviewDTO {
  reviewed_last_30_days: number
  completed_sessions_last_30_days: number
  due_cards: number
}
