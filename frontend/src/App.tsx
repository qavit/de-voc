import { useState } from 'react'

import './App.css'
import { ManagerView } from './components/ManagerView'
import { ReviewView } from './components/ReviewView'
import { I18nProvider, useI18n, type SupportedLocale } from './lib/i18n'

function AppFrame() {
  const [view, setView] = useState<'manager' | 'review'>('manager')
  const { locale, setLocale, t } = useI18n()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">{t('app.eyebrow')}</p>
          <h1>{t('app.title')}</h1>
        </div>
        <label className="locale-picker">
          <span>{t('app.localeLabel')}</span>
          <select value={locale} onChange={(event) => setLocale(event.target.value as SupportedLocale)}>
            <option value="en-US">English (US)</option>
            <option value="de-DE">Deutsch (DE)</option>
            <option value="zh-TW">繁體中文 (台灣)</option>
          </select>
        </label>
        <nav className="nav-stack">
          <button className={view === 'manager' ? 'active' : ''} onClick={() => setView('manager')}>
            {t('app.navManager')}
          </button>
          <button className={view === 'review' ? 'active' : ''} onClick={() => setView('review')}>
            {t('app.navReview')}
          </button>
        </nav>
      </aside>

      <main className="content-panel">
        {view === 'manager' ? <ManagerView /> : <ReviewView />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AppFrame />
    </I18nProvider>
  )
}
