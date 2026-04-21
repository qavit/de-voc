import { useEffect, useState } from 'react'

import { fetchVocabularyDetail, fetchVocabularies } from '../lib/api'
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
          setError('Failed to load vocabularies. Is the backend running?')
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
        setError('Failed to load vocabulary detail.')
      })
      .finally(() => setDetailLoading(false))
  }, [selectedId])

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="manager-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Vocab Manager</p>
          <h1>詞條管理與資料檢視</h1>
        </div>
        <div className="filters">
          <input
            value={search}
            onChange={(event) => {
              setPage(1)
              setSearch(event.target.value)
            }}
            placeholder="Search lemma, meaning, note..."
          />
          <select
            value={partOfSpeech}
            onChange={(event) => {
              setPage(1)
              setPartOfSpeech(event.target.value)
            }}
          >
            <option value="">All POS</option>
            <option value="noun">Noun</option>
            <option value="verb">Verb</option>
            <option value="adjective">Adjective</option>
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="lemma">Sort: Lemma</option>
            <option value="part_of_speech">Sort: POS</option>
            <option value="category">Sort: Category</option>
            <option value="due_at">Sort: Due Date</option>
          </select>
        </div>
      </header>

      {error && <div className="error-state">{error}</div>}

      <div className="manager-grid">
        <section className="card table-card">
          <div className="table-meta">
            <span>{total} entries</span>
            <span>
              Page {page} / {pageCount}
            </span>
          </div>

          {loading ? (
            <div className="empty-state">Loading records...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">No vocabularies matched this filter.</div>
          ) : (
            <div className="table-wrap">
              <table className="vocab-table">
                <thead>
                  <tr>
                    <th>Lemma</th>
                    <th>POS</th>
                    <th>Meanings</th>
                    <th>Tags</th>
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
                          {item.german_detail?.article && (
                            <span className="badge neutral">{item.german_detail.article}</span>
                          )}
                          {item.german_detail?.is_strong_verb && (
                            <span className="badge strong">Strong</span>
                          )}
                        </div>
                      </td>
                      <td>{item.part_of_speech ?? '-'}</td>
                      <td>{meaningSummary(item) || '-'}</td>
                      <td>
                        <div className="tag-list">
                          {item.tags.map((tag) => (
                            <span key={tag} className="badge tag">
                              {tag}
                            </span>
                          ))}
                          {item.tags.length === 0 && '-'}
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
              Previous
            </button>
            <button disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>
              Next
            </button>
          </div>
        </section>

        <aside className="card detail-card">
          {!selectedId ? (
            <div className="empty-state">Select a vocabulary to inspect its language data and SRS state.</div>
          ) : detailLoading || !selectedDetail ? (
            <div className="empty-state">Loading detail...</div>
          ) : (
            <div className="detail-content">
              <div className="detail-header">
                <div>
                  <p className="eyebrow">Vocabulary Detail</p>
                  <h2>{selectedDetail.lemma}</h2>
                </div>
                <span className="badge neutral">{selectedDetail.part_of_speech ?? 'unknown'}</span>
              </div>

              <div className="detail-block">
                <h3>Meanings</h3>
                <ul className="plain-list">
                  {selectedDetail.meanings.map((meaning) => (
                    <li key={`${meaning.language_code}-${meaning.position}`}>
                      <strong>{meaning.language_code.toUpperCase()}</strong>: {meaning.text}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="detail-block">
                <h3>German Detail</h3>
                <div className="meta-grid">
                  <span>Article: {selectedDetail.german_detail?.article ?? '-'}</span>
                  <span>Plural: {selectedDetail.german_detail?.plural_form ?? '-'}</span>
                  <span>Präsens: {selectedDetail.german_detail?.present_3sg ?? '-'}</span>
                  <span>Präteritum: {selectedDetail.german_detail?.preterite ?? '-'}</span>
                  <span>Partizip II: {selectedDetail.german_detail?.partizip_ii ?? '-'}</span>
                  <span>Comparative: {selectedDetail.german_detail?.comparative ?? '-'}</span>
                  <span>Superlative: {selectedDetail.german_detail?.superlative ?? '-'}</span>
                  <span>Verb Patterns: {selectedDetail.german_detail?.verb_patterns.join(', ') || '-'}</span>
                </div>
              </div>

              <div className="detail-block">
                <h3>SRS State</h3>
                <div className="meta-grid">
                  <span>Ease: {selectedDetail.srs_state?.ease_factor.toFixed(2) ?? '-'}</span>
                  <span>Interval: {selectedDetail.srs_state?.interval_days ?? 0} day(s)</span>
                  <span>Repetitions: {selectedDetail.srs_state?.repetitions ?? 0}</span>
                  <span>Due: {selectedDetail.srs_state?.due_at ? new Date(selectedDetail.srs_state.due_at).toLocaleString() : 'Now'}</span>
                </div>
              </div>

              <div className="detail-block">
                <h3>Dictionary Links</h3>
                <div className="external-links">
                  <a href={selectedDetail.dictionaries.dict_cc} target="_blank" rel="noreferrer">dict.cc</a>
                  <a href={selectedDetail.dictionaries.wiktionary} target="_blank" rel="noreferrer">Wiktionary</a>
                  <a href={selectedDetail.dictionaries.langenscheidt} target="_blank" rel="noreferrer">Langenscheidt</a>
                </div>
              </div>

              {selectedDetail.notes && (
                <div className="detail-block">
                  <h3>Notes</h3>
                  <p>{selectedDetail.notes}</p>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
