import type { GameMode, Store, WordList } from '../types'
import { t } from '../i18n'
import { sessionWords } from '../wordlists'

interface HomeProps {
  lists: WordList[]
  store: Store
  listId: string
  setListId: (id: string) => void
  onStart: (mode: GameMode) => void
  onParent: () => void
}

export default function Home({ lists, store, listId, setListId, onStart, onParent }: HomeProps) {
  const list = lists.find((l) => l.id === listId) ?? lists[0]
  const count = list ? sessionWords(list, store.selectedWords).length : 0

  const modes: { mode: GameMode; emoji: string; name: string; desc: string }[] = [
    { mode: 'listen', emoji: '🔊', name: t.modeListen, desc: t.modeListenDesc },
    { mode: 'missing', emoji: '🧩', name: t.modeMissing, desc: t.modeMissingDesc },
    { mode: 'fix', emoji: '🔍', name: t.modeFix, desc: t.modeFixDesc },
  ]

  return (
    <div className="screen home">
      <header className="hero">
        <h1>{t.appName}</h1>
        <p className="soft">{t.tagline}</p>
      </header>

      <section className="card">
        <h2>{t.chooseList}</h2>
        <select
          className="select"
          value={list?.id ?? ''}
          onChange={(e) => setListId(e.target.value)}
          aria-label={t.chooseList}
        >
          {lists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
              {l.date ? ` (${l.date})` : ''} — {l.builtin ? t.builtin : t.custom}
            </option>
          ))}
        </select>
        {list && <p className="soft">{t.wordsInRound(count)}</p>}
      </section>

      <section>
        <h2>{t.chooseGame}</h2>
        <div className="mode-grid">
          {modes.map((m) => (
            <button
              key={m.mode}
              className="mode-card"
              disabled={!list || count === 0}
              onClick={() => onStart(m.mode)}
            >
              <span className="mode-emoji" aria-hidden>
                {m.emoji}
              </span>
              <span className="mode-name">{m.name}</span>
              <span className="mode-desc">{m.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <footer>
        <button className="btn ghost" onClick={onParent}>
          ⚙️ {t.parentMode}
        </button>
      </footer>
    </div>
  )
}
