import { useEffect, useState } from 'react'

import { fetchVocabularyDetail, fetchVocabularies, llmAutofill, llmGenerateExamples, llmValidate, type LLMUsageDTO } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { VocabularyDetailDTO, VocabularyListItemDTO } from '../types/api'

const PAGE_SIZE = 20

function meaningSummary(vocabulary: VocabularyListItemDTO) {
  return vocabulary.meanings
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((item) => `${item.language_code.toUpperCase()}: ${item.text}`)
    .join(' / ')
}

export function ManagerView() {
  const { t, formatDateTime, formatNumber } = useI18n()
  const [items, setItems] = useState<VocabularyListItemDTO[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<VocabularyDetailDTO | null>(null)
  const [search, setSearch] = useState('')
  const [partOfSpeech, setPartOfSpeech] = useState('')
  const [sort, setSort] = useState('lemma')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  type AiActionState = 'idle' | 'loading' | 'done' | 'error'
  const [aiAutofillState, setAiAutofillState] = useState<AiActionState>('idle')
  const [aiExamplesState, setAiExamplesState] = useState<AiActionState>('idle')
  const [aiValidateState, setAiValidateState] = useState<AiActionState>('idle')
  const [aiResult, setAiResult] = useState<{ type: string; content: string; usage: LLMUsageDTO } | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => {
      setLoading(true)
      setError(null)
      fetchVocabularies({
        page,
        page_size: PAGE_SIZE,
        search,
        part_of_speech: partOfSpeech,
        sort,
      })
        .then((response) => {
          setItems(response.data)
          setTotal(response.total)
          if (response.data.length === 0) {
            setSelectedId(null)
            setSelectedDetail(null)
          }
        })
        .catch((err) => {
          console.error(err)
          setError(t('manager.loadError'))
        })
        .finally(() => setLoading(false))
    }, search ? 300 : 0)

    return () => window.clearTimeout(id)
  }, [page, partOfSpeech, search, sort])

  useEffect(() => {
    if (!selectedId) return

    setDetailLoading(true)
    fetchVocabularyDetail(selectedId)
      .then(setSelectedDetail)
      .catch((err) => {
        console.error(err)
        setError(t('manager.detailError'))
      })
      .finally(() => setDetailLoading(false))
  }, [selectedId, t])

  const resetAiState = () => {
    setAiAutofillState('idle')
    setAiExamplesState('idle')
    setAiValidateState('idle')
    setAiResult(null)
  }

  const handleAutofill = async () => {
    if (!selectedId) return
    setAiAutofillState('loading')
    setAiResult(null)
    try {
      const res = await llmAutofill(selectedId)
      setAiResult({ type: 'autofill', content: JSON.stringify(res.updated_fields, null, 2), usage: res.usage })
      setAiAutofillState('done')
      fetchVocabularyDetail(selectedId).then(setSelectedDetail)
    } catch {
      setAiAutofillState('error')
    }
  }

  const handleGenerateExamples = async () => {
    if (!selectedId) return
    setAiExamplesState('loading')
    setAiResult(null)
    try {
      const res = await llmGenerateExamples(selectedId)
      const content = res.examples.map(e => `DE: ${e.de}\nZH: ${e.zh}`).join('\n\n')
      setAiResult({ type: 'examples', content, usage: res.usage })
      setAiExamplesState('done')
      fetchVocabularyDetail(selectedId).then(setSelectedDetail)
    } catch {
      setAiExamplesState('error')
    }
  }

  const handleValidate = async () => {
    if (!selectedId) return
    setAiValidateState('loading')
    setAiResult(null)
    try {
      const res = await llmValidate(selectedId)
      const content = res.issues.length === 0
        ? '✓ No issues found.'
        : res.issues.map(i => `[${i.field}] ${i.message}`).join('\n')
      setAiResult({ type: 'validate', content, usage: res.usage })
      setAiValidateState('done')
    } catch {
      setAiValidateState('error')
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Reset AI state when selected item changes
  useEffect(() => { resetAiState() }, [selectedId])

  return (
    <div className="manager-container">
      <header className="manager-header">
        <div>
          <p className="eyebrow">{t('manager.eyebrow')}</p>
          <h1>{t('manager.title')}</h1>
        </div>
        <div className="header-controls">
          <div className="search-bar">
            <input
              value={search}
              onChange={(event) => {
                setPage(1)
                setSearch(event.target.value)
              }}
              placeholder={t('manager.searchPlaceholder')}
            />
          </div>
          <div className="filters">
            <select
              value={partOfSpeech}
              onChange={(event) => {
                setPage(1)
                setPartOfSpeech(event.target.value)
              }}
            >
              <option value="">{t('manager.allPos')}</option>
              <option value="noun">{t('manager.noun')}</option>
              <option value="verb">{t('manager.verb')}</option>
              <option value="adjective">{t('manager.adjective')}</option>
            </select>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="lemma">{t('manager.sortLemma')}</option>
              <option value="part_of_speech">{t('manager.sortPos')}</option>
              <option value="category">{t('manager.sortCategory')}</option>
              <option value="due_at">{t('manager.sortDueDate')}</option>
            </select>
          </div>
        </div>
      </header>

      {error && <div className="error-state">{error}</div>}

      <div className="manager-main manager-split">
        <section className="manager-section">
          <div className="table-meta">
            <span>{t('common.entries', { count: formatNumber(total) })}</span>
            <span>{t('common.pageOf', { page: formatNumber(page), total: formatNumber(pageCount) })}</span>
          </div>

          {loading ? (
            <div className="empty-state">{t('manager.loadingRecords')}</div>
          ) : items.length === 0 ? (
            <div className="empty-state">{t('manager.noResults')}</div>
          ) : (
            <div className="table-responsive">
              <table className="vocab-table">
                <thead>
                  <tr>
                    <th>{t('manager.tableLemma')}</th>
                    <th>{t('manager.tablePos')}</th>
                    <th>{t('manager.tableMeanings')}</th>
                    <th>{t('manager.tableTags')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className={item.id === selectedId ? 'selected' : ''}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <td>
                        <div className="lemma-cell">
                          <strong>{item.lemma}</strong>
                          {item.german_detail?.article && <span className="cat-badge">{item.german_detail.article}</span>}
                          {item.german_detail?.is_strong_verb && (
                            <span className="badge strong-verb">{t('manager.strong')}</span>
                          )}
                        </div>
                      </td>
                      <td>{item.part_of_speech ?? t('common.none')}</td>
                      <td>{meaningSummary(item) || t('common.none')}</td>
                      <td>
                        <div className="tag-container">
                          {item.tags.map((tag) => (
                            <span key={tag} className="cat-badge context-tag">
                              {tag}
                            </span>
                          ))}
                          {item.tags.length === 0 && t('common.none')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              {t('common.previous')}
            </button>
            <button disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>
              {t('common.next')}
            </button>
          </div>
        </section>

        <aside className="detail-panel">
          {!selectedId ? (
            <div className="empty-state">{t('manager.detailEmpty')}</div>
          ) : detailLoading || !selectedDetail ? (
            <div className="empty-state">{t('manager.detailLoading')}</div>
          ) : (
            <div className="detail-content">
              <div className="detail-header">
                <div>
                  <p className="eyebrow">{t('manager.detailEyebrow')}</p>
                  <h2>{selectedDetail.lemma}</h2>
                </div>
                <span className="cat-badge sub">{selectedDetail.part_of_speech ?? t('common.unknown')}</span>
              </div>

              <div className="detail-block">
                <h3>{t('manager.meanings')}</h3>
                <ul className="plain-list">
                  {selectedDetail.meanings.map((meaning) => (
                    <li key={`${meaning.language_code}-${meaning.position}`}>
                      <strong>{meaning.language_code.toUpperCase()}</strong>: {meaning.text}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="detail-block">
                <h3>{t('manager.germanDetail')}</h3>
                <div className="meta-grid">
                  <span>{t('manager.article')}: {selectedDetail.german_detail?.article ?? t('common.none')}</span>
                  <span>{t('manager.plural')}: {selectedDetail.german_detail?.plural_form ?? t('common.none')}</span>
                  <span>{t('manager.praesens')}: {selectedDetail.german_detail?.present_3sg ?? t('common.none')}</span>
                  <span>{t('manager.praeteritum')}: {selectedDetail.german_detail?.preterite ?? t('common.none')}</span>
                  <span>{t('manager.partizipII')}: {selectedDetail.german_detail?.partizip_ii ?? t('common.none')}</span>
                  <span>{t('manager.comparative')}: {selectedDetail.german_detail?.comparative ?? t('common.none')}</span>
                  <span>{t('manager.superlative')}: {selectedDetail.german_detail?.superlative ?? t('common.none')}</span>
                  <span>{t('manager.verbPatterns')}: {selectedDetail.german_detail?.verb_patterns.join(', ') || t('common.none')}</span>
                </div>
              </div>

              <div className="detail-block">
                <h3>{t('manager.srsState')}</h3>
                <div className="meta-grid">
                  <span>{t('manager.ease')}: {selectedDetail.srs_state?.ease_factor.toFixed(2) ?? t('common.none')}</span>
                  <span>{t('manager.interval')}: {t('common.days', { count: selectedDetail.srs_state?.interval_days ?? 0 })}</span>
                  <span>{t('manager.repetitions')}: {formatNumber(selectedDetail.srs_state?.repetitions ?? 0)}</span>
                  <span>{t('manager.due')}: {selectedDetail.srs_state?.due_at ? formatDateTime(selectedDetail.srs_state.due_at) : t('common.now')}</span>
                </div>
              </div>

              <div className="detail-block">
                <h3>{t('manager.dictionaryLinks')}</h3>
                <div className="external-links">
                  <a href={selectedDetail.dictionaries.dict_cc} target="_blank" rel="noreferrer">dict.cc</a>
                  <a href={selectedDetail.dictionaries.wiktionary} target="_blank" rel="noreferrer">Wiktionary</a>
                  <a href={selectedDetail.dictionaries.langenscheidt} target="_blank" rel="noreferrer">Langenscheidt</a>
                </div>
              </div>

              {selectedDetail.notes && (
                <div className="detail-block">
                  <h3>{t('manager.notes')}</h3>
                  <p>{selectedDetail.notes}</p>
                </div>
              )}

              <div className="detail-block ai-actions-block">
                <h3>AI Actions <span className="ai-badge">⚡</span></h3>
                <div className="ai-buttons">
                  <button
                    className={`btn-ai ${aiAutofillState}`}
                    onClick={handleAutofill}
                    disabled={aiAutofillState === 'loading'}
                  >
                    {aiAutofillState === 'loading' ? '…' : aiAutofillState === 'done' ? '✓' : aiAutofillState === 'error' ? '✗' : ''}
                    {' '}Auto-fill Grammar
                  </button>
                  <button
                    className={`btn-ai ${aiExamplesState}`}
                    onClick={handleGenerateExamples}
                    disabled={aiExamplesState === 'loading'}
                  >
                    {aiExamplesState === 'loading' ? '…' : aiExamplesState === 'done' ? '✓' : aiExamplesState === 'error' ? '✗' : ''}
                    {' '}Generate Examples
                  </button>
                  <button
                    className={`btn-ai ${aiValidateState}`}
                    onClick={handleValidate}
                    disabled={aiValidateState === 'loading'}
                  >
                    {aiValidateState === 'loading' ? '…' : aiValidateState === 'done' ? '✓' : aiValidateState === 'error' ? '✗' : ''}
                    {' '}Validate Entry
                  </button>
                </div>
                {aiResult && (
                  <div className="ai-result">
                    <pre className="ai-result-content">{aiResult.content}</pre>
                    <p className="ai-usage">
                      {aiResult.usage.provider} / {aiResult.usage.model}
                      {' · '}{aiResult.usage.input_tokens}↑ {aiResult.usage.output_tokens}↓
                      {' · '}${aiResult.usage.cost_usd.toFixed(5)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
