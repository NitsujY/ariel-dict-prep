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
  onAddList: () => void
}

export default function Home({ lists, store, listId, setListId, onStart, onParent, onAddList }: HomeProps) {
  const list = lists.find((l) => l.id === listId) ?? lists[0]
  const count = list ? sessionWords(list, store.selectedWords).length : 0

  const modes: { mode: GameMode; emoji: string; name: string; desc: string }[] = [
    { mode: 'listen', emoji: '🔊', name: t.modeListen, desc: t.modeListenDesc },
    { mode: 'fix', emoji: '🔍', name: t.modeFix, desc: t.modeFixDesc },
    { mode: 'practice', emoji: '🌱', name: t.modePractice, desc: t.modePracticeDesc },
    { mode: 'mole', emoji: '🔨', name: t.modeMole, desc: t.modeMoleDesc },
  ]

  return (
    <div className="screen home">
      <div className="topbar">
        <button className="btn ghost" onClick={onParent}>
          ⚙️ {t.parentMode}
        </button>
        <span className="list-picker">
          <select
            className="select compact"
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
          <button className="btn ghost" onClick={onAddList} aria-label={t.homeAddList}>
            ➕
          </button>
        </span>
      </div>

      <header className="hero">
        <h1>{t.appName}</h1>
        <p className="soft">{t.tagline}</p>
      </header>

      <section>
        <h2>{t.chooseGame}</h2>
        {list && <p className="soft">{t.wordsInRound(count)}</p>}
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
    </div>
  )
}
