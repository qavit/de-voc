import { useEffect, useState } from 'react'

import { fetchDueSession, fetchOverviewStats, submitReviewEvent } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { localizeTag } from '../lib/tagTranslations'
import type { DueReviewResponse, StatsOverviewDTO, VocabularyDetailDTO } from '../types/api'

export function ReviewView() {
  const { locale, t, formatNumber } = useI18n()
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
      setError(t('review.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSession()
  }, [t])

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
      setError(t('review.saveError'))
    } finally {
      setSubmitting(false)
    }
  }

  const gradeLabels = [
    { grade: 0, label: t('review.gradeAgain'), hint: t('review.gradeAgainHint'), className: 'again' },
    { grade: 1, label: t('review.gradeHard'), hint: t('review.gradeHardHint'), className: 'hard' },
    { grade: 2, label: t('review.gradeGood'), hint: t('review.gradeGoodHint'), className: 'good' },
    { grade: 3, label: t('review.gradeEasy'), hint: t('review.gradeEasyHint'), className: 'easy' },
  ] as const

  if (loading) {
    return <div className="loading">{t('review.loadingSession')}</div>
  }

  if (error) {
    return (
      <div className="review-done">
        <p className="error-state">{error}</p>
        <button className="btn-primary" onClick={() => void loadSession()}>{t('common.retry')}</button>
      </div>
    )
  }

  if (!session || cards.length === 0 || currentIndex >= cards.length) {
    return (
      <div className="review-done">
        <p className="eyebrow">{t('review.eyebrow')}</p>
        <h2>{t('review.allCaughtUp')}</h2>
        <p>{t('review.allCaughtUpBody')}</p>
        <button className="btn-primary" onClick={() => void loadSession()}>{t('review.refresh')}</button>
      </div>
    )
  }

  return (
    <div className="review-container">
      <div className="review-header">
        <div>
          <p className="eyebrow">{t('review.sessionEyebrow')}</p>
          <h2>{t('review.title')}</h2>
        </div>
        <span className="progress-badge">{t('review.dueCards', { count: formatNumber(cards.length - currentIndex) })}</span>
      </div>

      <div className="review-stats">
        <span>{t('review.sessionId', { id: formatNumber(session.id) })}</span>
        <span>{t('review.completed', { completed: formatNumber(session.completed_cards), total: formatNumber(session.total_cards) })}</span>
        <span>{t('review.currentCard', { current: formatNumber(currentIndex + 1), total: formatNumber(cards.length) })}</span>
        <span>{t('review.reviews30', { count: formatNumber(stats?.reviewed_last_30_days ?? 0) })}</span>
        <span>{t('review.sessions30', { count: formatNumber(stats?.completed_sessions_last_30_days ?? 0) })}</span>
      </div>

      <section className="review-main">
        <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => !flipped && setFlipped(true)}>
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <p className="eyebrow">{t('review.tapToReveal')}</p>
              <h1 className="flashcard-word">{activeCard.lemma}</h1>
              <p>{activeCard.part_of_speech ?? t('review.unknownPos')}</p>
            </div>

            <div className="flashcard-back">
              <h1 className="flashcard-word">{activeCard.lemma}</h1>
              <div className="plain-list">
                {activeCard.meanings.map((meaning) => (
                  <p key={`${meaning.language_code}-${meaning.position}`} className="flashcard-meaning">
                    <strong>{meaning.language_code.toUpperCase()}</strong>: {meaning.text}
                  </p>
                ))}
              </div>
              {activeCard.german_detail?.verb_patterns.length ? (
                <p className="flashcard-eng">{t('review.patterns', { value: activeCard.german_detail.verb_patterns.join(', ') })}</p>
              ) : null}
              {!!activeCard.tags.length && (
                <div className="tag-container justify-center mt-4">
                  {activeCard.tags.map((tag) => (
                    <span key={tag} className="cat-badge context-tag">
                      {localizeTag(tag, locale)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {flipped ? (
          <div className="action-buttons animate-fade-in">
            {gradeLabels.map((entry) => (
              <button
                key={entry.grade}
                className={`btn-rate ${entry.className}`}
                onClick={() => void submit(entry.grade)}
                disabled={submitting}
              >
                <span className="rate-text">{entry.label}</span>
                <span className="rate-sub">{entry.hint}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="review-hint">{t('review.flipHint')}</p>
        )}
      </section>
    </div>
  )
}
