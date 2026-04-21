import type {
  DueReviewResponse,
  PaginatedVocabularyResponse,
  ReviewEventResultDTO,
  StatsOverviewDTO,
  VocabularyDetailDTO,
} from '../types/api'

const API = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, init)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export function fetchVocabularies(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  })
  return request<PaginatedVocabularyResponse>(`/api/vocabularies?${searchParams.toString()}`)
}

export function fetchVocabularyDetail(id: number) {
  return request<VocabularyDetailDTO>(`/api/vocabularies/${id}`)
}

export function fetchDueSession(limit = 20) {
  return request<DueReviewResponse>(`/api/review/due?limit=${limit}`)
}

export function submitReviewEvent(vocabularyId: number, grade: number, sessionId: number | null) {
  return request<ReviewEventResultDTO>('/api/review/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vocabulary_id: vocabularyId, grade, session_id: sessionId }),
  })
}

export function fetchOverviewStats() {
  return request<StatsOverviewDTO>('/api/stats/overview')
}

// ---------------------------------------------------------------------------
// LLM actions
// ---------------------------------------------------------------------------

export interface LLMUsageDTO {
  provider: string
  model: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
}

export function llmAutofill(vocabularyId: number) {
  return request<{ updated_fields: Record<string, unknown>; usage: LLMUsageDTO }>(
    `/api/llm/vocabularies/${vocabularyId}/autofill`,
    { method: 'POST' },
  )
}

export function llmGenerateExamples(vocabularyId: number) {
  return request<{ examples: { de: string; zh: string }[]; usage: LLMUsageDTO }>(
    `/api/llm/vocabularies/${vocabularyId}/examples`,
    { method: 'POST' },
  )
}

export function llmValidate(vocabularyId: number) {
  return request<{ issues: { field: string; message: string }[]; usage: LLMUsageDTO }>(
    `/api/llm/vocabularies/${vocabularyId}/validate`,
    { method: 'POST' },
  )
}

