// 扑地鼠 Whack-a-mole spelling: moles pop out of a 3×3 field of holes
// carrying letters — whack the one with the next letter, starting from the
// first char. Difficulty ramps: whack a word and the next one asks for one
// more letter, up to the whole word. Moles duck and swap holes on a timer.
import { useEffect, useState } from 'react'
import type { Attempt, Settings, WordEntry, WordList } from '../types'
import { t } from '../i18n'
import { playWord, stopAll } from '../audio'
import { moleChoices, scatterMoles } from '../questions'

interface MoleProps {
  list: WordList
  words: WordEntry[]
  settings: Settings
  onExit: () => void
  onRecord: (a: Attempt) => void
}

export default function Mole({ list, words, settings, onExit, onRecord }: MoleProps) {
  const pick = (except?: string) => {
    const pool = except && words.length > 1 ? words.filter((w) => w.id !== except) : words
    return pool[Math.floor(Math.random() * pool.length)]
  }
  const newField = (w: WordEntry, pos: number) =>
    scatterMoles(moleChoices(w.word, pos, Math.random, settings.practiceChoices), 9)

  const [entry, setEntry] = useState<WordEntry>(() => pick())
  // Session difficulty: letters to whack per word. 0 in settings = whole word (no ramp).
  const [level, setLevel] = useState(() => Math.max(1, settings.moleTarget))
  const target = settings.moleTarget === 0 ? entry.word.length : Math.min(level, entry.word.length)
  const [idx, setIdx] = useState(0)
  const [field, setField] = useState<(string | null)[]>(() => newField(entry, 0))
  const [cycle, setCycle] = useState(0) // bumps to re-run the pop animation
  const [bonked, setBonked] = useState<string | null>(null)
  const [wrong, setWrong] = useState<string | null>(null)
  const [retries, setRetries] = useState(0)
  const [whacked, setWhacked] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [speechWarn, setSpeechWarn] = useState(false)

  const lang = list.lang || 'en-GB'
  const play = () => playWord(entry, settings, lang, () => setSpeechWarn(true))
  useEffect(() => {
    play()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry])
  useEffect(() => () => stopAll(), [])

  // Moles duck and re-pop in different holes until the word is done.
  useEffect(() => {
    if (feedback || bonked) return
    const id = setInterval(() => {
      setField((f) => scatterMoles(f.filter((c): c is string => c !== null), 9))
      setCycle((c) => c + 1)
    }, 1800)
    return () => clearInterval(id)
  }, [feedback, bonked])

  const startWord = (w: WordEntry) => {
    stopAll()
    setEntry(w)
    setIdx(0)
    setField(newField(w, 0))
    setCycle((c) => c + 1)
    setBonked(null)
    setWrong(null)
    setRetries(0)
    setFeedback(null)
  }

  const whack = (c: string) => {
    if (bonked) return
    if (c !== entry.word[idx]) {
      setWrong(c)
      setRetries((r) => r + 1)
      return
    }
    setWrong(null)
    setBonked(c)
    // Let the bonk animation play before the moles move on.
    setTimeout(() => {
      setBonked(null)
      if (idx + 1 < target) {
        setIdx(idx + 1)
        setField(newField(entry, idx + 1))
        setCycle((cy) => cy + 1)
        return
      }
      onRecord({
        ts: Date.now(),
        listId: list.id,
        wordId: entry.id,
        word: entry.word,
        mode: 'mole',
        category: 'unhinted',
        correct: true,
        retries,
        skipped: false,
        usedHint: false,
      })
      setWhacked((n) => n + 1)
      if (settings.moleTarget > 0) setLevel((l) => l + 1)
      setFeedback(t.correctMsgs[Math.floor(Math.random() * t.correctMsgs.length)])
    }, 400)
  }

  const exit = () => {
    stopAll()
    onExit()
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn ghost" onClick={exit}>
          {t.exit}
        </button>
        <span className="mode-tag">
          {t.modeMole}
          {settings.moleTarget > 0 && ` ${t.moleLevelTag(Math.min(level, entry.word.length))}`}
        </span>
        <span className="progress">{t.moleWhacked(whacked)}</span>
      </div>
      {speechWarn && <p className="notice">{t.speechUnavailable}</p>}

      {feedback ? (
        <div className="card center">
          <div className="big-emoji" aria-hidden>
            🔨💥
          </div>
          <p className="feedback">{feedback}</p>
          <div className="word-display">{entry.word}</div>
          <button className="btn primary big" autoFocus onClick={() => startWord(pick(entry.id))}>
            {t.next}
          </button>
        </div>
      ) : (
        <div className="card center">
          <p className="prompt">{t.molePrompt}</p>
          <div className="tiles" role="group" aria-label="word progress">
            {entry.word.split('').map((c, i) =>
              i < target ? (
                <span
                  key={i}
                  className={`tile ${i < idx ? 'given' : 'blank'} ${i === idx ? 'active' : ''}`}
                  aria-label={i < idx ? c : `missing letter ${i + 1}`}
                >
                  {i < idx ? c : i === idx ? '🕳️' : ''}
                </span>
              ) : (
                <span key={i} className="tile given dim">
                  {c}
                </span>
              ),
            )}
          </div>
          <div className="field-ground">
            {field.map((c, i) => (
              <div className="hole" key={`${cycle}-${i}`}>
                {c !== null && (
                  <button
                    className={`mole ${bonked === c ? 'bonked' : ''} ${wrong === c ? 'wrong' : ''}`}
                    onClick={() => whack(c)}
                    aria-label={`mole with letter ${c}`}
                  >
                    {bonked === c ? (
                      <span aria-hidden>💥</span>
                    ) : (
                      <>
                        <span aria-hidden>🐹</span>
                        <span className="mole-letter">{c}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="row wrap controls">
            <button className="btn" onClick={play}>
              {t.listen}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
