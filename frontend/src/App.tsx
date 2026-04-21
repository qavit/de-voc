import { useState } from 'react'

import './App.css'
import { ManagerView } from './components/ManagerView'
import { ReviewView } from './components/ReviewView'

export default function App() {
  const [view, setView] = useState<'manager' | 'review'>('manager')

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Vocabulary Master</p>
          <h1>德文學習平台</h1>
        </div>
        <nav className="nav-stack">
          <button className={view === 'manager' ? 'active' : ''} onClick={() => setView('manager')}>
            Manager
          </button>
          <button className={view === 'review' ? 'active' : ''} onClick={() => setView('review')}>
            Review Session
          </button>
        </nav>
      </aside>

      <main className="content-panel">
        {view === 'manager' ? <ManagerView /> : <ReviewView />}
      </main>
    </div>
  )
}
