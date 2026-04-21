import { useState, useEffect } from 'react'
import './App.css'

interface Vocabulary {
  id: number
  word: string
  chinese: string | null
  english: string | null
  category: string | null
  sub_category: string | null
  context_tag: string | null
  is_strong_verb: boolean
}

function App() {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVocabularies()
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchVocabularies(search)
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [search])

  const fetchVocabularies = async (searchQuery = '') => {
    setLoading(true)
    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/vocabularies?search=${searchQuery}&limit=100`)
      const data = await resp.json()
      setVocabularies(data.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="manager-container">
      <header className="manager-header">
        <h1>🇩🇪 Vocab Master Manager</h1>
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search word, meaning or tag..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>
      
      <main className="manager-main">
        {loading ? (
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vocabularies.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span className="word-text">{v.word}</span>
                      {v.is_strong_verb && <span className="badge strong-verb">Strong Verb</span>}
                    </td>
                    <td>
                      <div className="tag-container">
                        {v.category && <span className="cat-badge">{v.category}</span>}
                        {v.sub_category && <span className="cat-badge sub">{v.sub_category}</span>}
                        {v.context_tag?.split(',').map(tag => (
                            <span key={tag} className="cat-badge context-tag">{tag.trim()}</span>
                        ))}
                      </div>
                    </td>
                    <td>{v.chinese || '-'}</td>
                    <td>{v.english || '-'}</td>
                    <td>
                      <button className="btn-edit">Edit</button>
                    </td>
                  </tr>
                ))}
                {vocabularies.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-state">No vocabularies found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
