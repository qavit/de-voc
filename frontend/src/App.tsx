import { useState, useEffect } from 'react'
import './App.css'

const API = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

interface Vocabulary {
  id: number
  word: string
  chinese: string | null
  english: string | null
  category: string | null
  sub_category: string | null
  context_tag: string | null
  is_strong_verb: boolean
  ease_factor: number
  interval: number
  repetitions: number
  next_review_date: string | null
}

function App() {
  const [view, setView] = useState<'manager' | 'review'>('manager')

  return (
    <div className="app-layout">
      <nav className="side-nav">
        <div className="nav-logo">🇩🇪 Master</div>
        <button
          className={view === 'manager' ? 'active' : ''}
          onClick={() => setView('manager')}
        >
          Manager
        </button>
        <button
          className={view === 'review' ? 'active' : ''}
          onClick={() => setView('review')}
        >
          Study (SRS)
        </button>
      </nav>

      <main className="main-content">
        {/* Manager is always mounted to preserve scroll/search state */}
        <div style={{ display: view === 'manager' ? undefined : 'none' }}>
          <Manager />
        </div>
        {view === 'review' && <ReviewMode />}
      </main>
    </div>
  )
}

function Manager() {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = setTimeout(() => fetchVocabularies(search), search ? 300 : 0)
    return () => clearTimeout(id)
  }, [search])

  const fetchVocabularies = async (searchQuery = '') => {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`${API}/api/vocabularies?search=${searchQuery}&limit=100`)
      if (!resp.ok) throw new Error(`Server error: ${resp.status}`)
      const data = await resp.json()
      setVocabularies(data.data || [])
    } catch (e) {
      setError('Failed to load vocabularies. Is the server running?')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="manager-container">
      <header className="manager-header">
        <h1>Vocabulary Manager</h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search word, meaning or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="manager-main">
        {error ? (
          <div className="error-state">{error}</div>
        ) : loading ? (
          <div className="loading">Loading records...</div>
        ) : (
          <div className="table-responsive">
            <table className="vocab-table">
              <thead>
                <tr>
                  <th>Word</th>
                  <th>Tags / Context</th>
                  <th>Chinese Meaning</th>
                  <th>English Meaning</th>
                </tr>
              </thead>
              <tbody>
                {vocabularies.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span className="word-text">{v.word}</span>
                      {v.is_strong_verb && <span className="badge strong-verb">Strong</span>}
                    </td>
                    <td>
                      <div className="tag-container">
                        {v.category && <span className="cat-badge">{v.category}</span>}
                        {v.sub_category && <span className="cat-badge sub">{v.sub_category}</span>}
                        {v.context_tag?.split(',').map(tag => tag.trim() && (
                          <span key={tag.trim()} className="cat-badge context-tag">{tag.trim()}</span>
                        ))}
                      </div>
                    </td>
                    <td>{v.chinese || '-'}</td>
                    <td>{v.english || '-'}</td>
                  </tr>
                ))}
                {vocabularies.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-state">No vocabularies found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function ReviewMode() {
  const [dueCards, setDueCards] = useState<Vocabulary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    fetchDueCards()
  }, [])

  const fetchDueCards = async () => {
    setLoading(true)
    setError(null)
    setCurrentIndex(0)
    try {
      const resp = await fetch(`${API}/api/vocabularies/due?limit=20`)
      if (!resp.ok) throw new Error(`Server error: ${resp.status}`)
      const data = await resp.json()
      setDueCards(data.data || [])
    } catch (e) {
      setError('Failed to load cards. Is the server running?')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const submitReview = async (grade: number) => {
    const card = dueCards[currentIndex]
    try {
      const resp = await fetch(`${API}/api/vocabularies/${card.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade })
      })
      if (!resp.ok) throw new Error(`Server error: ${resp.status}`)
      setFlipped(false)
      setCurrentIndex(prev => prev + 1)
    } catch (e) {
      setError('Failed to submit review. Please try again.')
      console.error(e)
    }
  }

  if (loading) return <div className="loading">Loading due cards...</div>

  if (error) return (
    <div className="review-done">
      <p className="error-state">{error}</p>
      <button className="btn-primary" onClick={fetchDueCards}>Retry</button>
    </div>
  )

  if (currentIndex >= dueCards.length) {
    return (
      <div className="review-done">
        <h2>🎉 All caught up!</h2>
        <p>No cards due for review. Take a break!</p>
        <button className="btn-primary" onClick={fetchDueCards}>Check Again</button>
      </div>
    )
  }

  const currentCard = dueCards[currentIndex]

  return (
    <div className="review-container">
      <div className="review-header">
        <h2>Study Session</h2>
        <span className="progress-badge">Due: {dueCards.length - currentIndex}</span>
      </div>

      <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => !flipped && setFlipped(true)}>
        <div className="flashcard-inner">
          <div className="flashcard-front">
            <h1 className="flashcard-word">{currentCard.word}</h1>
            <p className="click-hint">Click to flip</p>
          </div>

          <div className="flashcard-back">
            <h1 className="flashcard-word">{currentCard.word}</h1>
            <h2 className="flashcard-meaning">{currentCard.chinese}</h2>
            {currentCard.english && <p className="flashcard-eng">{currentCard.english}</p>}

            <div className="tag-container justify-center mt-4">
              {currentCard.context_tag?.split(',').map(tag => tag.trim() && (
                <span key={tag.trim()} className="cat-badge context-tag">{tag.trim()}</span>
              ))}
            </div>
            {currentCard.is_strong_verb && <span className="mt-2 badge strong-verb">Strong Verb</span>}
          </div>
        </div>
      </div>

      {flipped && (
        <div className="action-buttons animate-fade-in">
          <button className="btn-rate again" onClick={() => submitReview(0)}>
            <span className="rate-text">Again</span>
            <span className="rate-sub">1 min</span>
          </button>
          <button className="btn-rate hard" onClick={() => submitReview(1)}>
            <span className="rate-text">Hard</span>
            <span className="rate-sub">-50%</span>
          </button>
          <button className="btn-rate good" onClick={() => submitReview(2)}>
            <span className="rate-text">Good</span>
            <span className="rate-sub">Norm</span>
          </button>
          <button className="btn-rate easy" onClick={() => submitReview(3)}>
            <span className="rate-text">Easy</span>
            <span className="rate-sub">+30%</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default App
