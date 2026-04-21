import { useEffect, useState } from 'react'

import { fetchDueSession, fetchOverviewStats, submitReviewEvent } from '../lib/api'
import type { DueReviewResponse, StatsOverviewDTO, VocabularyDetailDTO } from '../types/api'

const GRADE_LABELS = [
  { grade: 0, label: 'Again', hint: 'Restart to 1 day', className: 'again' },
  { grade: 1, label: 'Hard', hint: 'Shorten interval', className: 'hard' },
  { grade: 2, label: 'Good', hint: 'Keep schedule', className: 'good' },
  { grade: 3, label: 'Easy', hint: 'Extend interval', className: 'easy' },
] as const

export function ReviewView() {
  const [sessionData, setSessionData] = useState<DueReviewResponse | null>(null)
  const [stats, setStats] = useState<StatsOverviewDTO | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSession = async () => {
    setLoading(true)
    setError(null)
    setFlipped(false)
    setCurrentIndex(0)
    try {
      const [session, overview] = await Promise.all([fetchDueSession(20), fetchOverviewStats()])
      setSessionData(session)
      setStats(overview)
    } catch (err) {
      console.error(err)
      setError('Failed to load review session.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSession()
  }, [])

  const session = sessionData?.session ?? null
  const cards = sessionData?.cards ?? []
  const activeCard: VocabularyDetailDTO | null = cards[currentIndex]?.vocabulary ?? null

  const submit = async (grade: number) => {
    if (!activeCard || !session || submitting) return
    setSubmitting(true)
    try {
      const result = await submitReviewEvent(activeCard.id, grade, session.id)
      setSessionData((current) =>
        current
          ? {
              ...current,
              session: result.session ?? current.session,
            }
          : current,
      )
      setFlipped(false)
      setCurrentIndex((index) => index + 1)
      const overview = await fetchOverviewStats()
      setStats(overview)
    } catch (err) {
      console.error(err)
      setError('Failed to save review result.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="card empty-state">Loading review session...</div>
  }

  if (error) {
    return (
      <div className="card review-empty">
        <p className="error-state">{error}</p>
        <button onClick={() => void loadSession()}>Retry</button>
      </div>
    )
  }

  if (!session || cards.length === 0 || currentIndex >= cards.length) {
    return (
      <div className="card review-empty">
        <p className="eyebrow">Study Session</p>
        <h2>All caught up</h2>
        <p>No cards are currently due. You can refresh to start a new session later.</p>
        <button onClick={() => void loadSession()}>Refresh session</button>
      </div>
    )
  }

  return (
    <div className="review-shell">
      <section className="card review-sidebar">
        <p className="eyebrow">Session</p>
        <h2>今天的複習節奏</h2>
        <div className="meta-grid compact">
          <span>Session ID: {session.id}</span>
          <span>Completed: {session.completed_cards} / {session.total_cards}</span>
          <span>Current Card: {currentIndex + 1} / {cards.length}</span>
          <span>Due Cards: {stats?.due_cards ?? cards.length}</span>
          <span>30-day Reviews: {stats?.reviewed_last_30_days ?? '-'}</span>
          <span>30-day Sessions: {stats?.completed_sessions_last_30_days ?? '-'}</span>
        </div>
      </section>

      <section className="review-main">
        <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => !flipped && setFlipped(true)}>
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <p className="eyebrow">Tap to reveal</p>
              <h1>{activeCard.lemma}</h1>
              <p>{activeCard.part_of_speech ?? 'unknown part of speech'}</p>
            </div>

            <div className="flashcard-back">
              <h1>{activeCard.lemma}</h1>
              <div className="plain-list">
                {activeCard.meanings.map((meaning) => (
                  <p key={`${meaning.language_code}-${meaning.position}`}>
                    <strong>{meaning.language_code.toUpperCase()}</strong>: {meaning.text}
                  </p>
                ))}
              </div>
              {activeCard.german_detail?.verb_patterns.length ? (
                <p>Patterns: {activeCard.german_detail.verb_patterns.join(', ')}</p>
              ) : null}
              {!!activeCard.tags.length && (
                <div className="tag-list">
                  {activeCard.tags.map((tag) => (
                    <span key={tag} className="badge tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {flipped ? (
          <div className="actions-grid">
            {GRADE_LABELS.map((entry) => (
              <button
                key={entry.grade}
                className={`rate-button ${entry.className}`}
                onClick={() => void submit(entry.grade)}
                disabled={submitting}
              >
                <span>{entry.label}</span>
                <small>{entry.hint}</small>
              </button>
            ))}
          </div>
        ) : (
          <p className="review-hint">Flip the card to record your review result.</p>
        )}
      </section>
    </div>
  )
}
