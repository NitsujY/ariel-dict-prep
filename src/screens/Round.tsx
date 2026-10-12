// Shared round runner: preview → I'm ready → answer → gentle feedback → manual next.
import { useEffect, useMemo, useState } from 'react'
import type { Attempt, GameMode, Settings, WordEntry, WordList } from '../types'
import { t } from '../i18n'
import { playWord, stopAll } from '../audio'
import { buildOptions, fixQuestion, missingChoices, resolveBlanks, shuffle } from '../questions'

interface RoundProps {
  list: WordList
  words: WordEntry[]
  mode: GameMode
  settings: Settings
  onExit: () => void
  onRecord: (a: Attempt) => void
}

interface GameProps {
  entry: WordEntry
  words: WordEntry[]
  settings: Settings
  onCorrect: () => void
  onWrong: () => void
}

const modeTitle: Record<GameMode, string> = {
  listen: t.modeListen,
  missing: t.modeMissing,
  fix: t.modeFix,
}

export default function Round({ list, words, mode, settings, onExit, onRecord }: RoundProps) {
  const [round, setRound] = useState(0)
  const roundWords = useMemo(
    () => shuffle(words).slice(0, settings.roundLength),
    [words, settings.roundLength, round],
  )
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<'preview' | 'answer' | 'feedback'>('preview')
  const [usedHint, setUsedHint] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [retries, setRetries] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [speechWarn, setSpeechWarn] = useState(false)
  const [finished, setFinished] = useState(false)

  const entry = roundWords[idx]
  const lang = list.lang || 'en-GB'
  const play = () => playWord(entry, settings, lang, () => setSpeechWarn(true))

  // Auto-play once per question; any earlier taps count as the required user gesture.
  useEffect(() => {
    play()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, round])
  useEffect(() => () => stopAll(), [])

  const record = (correct: boolean, skipped: boolean) =>
    onRecord({
      ts: Date.now(),
      listId: list.id,
      wordId: entry.id,
      word: entry.word,
      mode,
      category: mode === 'listen' ? 'listening' : usedHint ? 'hinted' : 'unhinted',
      correct,
      retries,
      skipped,
      usedHint,
    })

  const onCorrect = () => {
    record(true, false)
    setFeedback(t.correctMsgs[Math.floor(Math.random() * t.correctMsgs.length)])
    setPhase('feedback')
  }
  const onWrong = () => setRetries((r) => r + 1)
  const onSkip = () => {
    record(false, true)
    setFeedback(t.skippedMsg)
    setPhase('feedback')
  }
  const resetQuestion = () => {
    setPhase('preview')
    setUsedHint(false)
    setShowHint(false)
    setRetries(0)
    setFeedback(null)
  }
  const next = () => {
    stopAll()
    if (idx + 1 >= roundWords.length) setFinished(true)
    else {
      setIdx((i) => i + 1)
      resetQuestion()
    }
  }
  const exit = () => {
    stopAll()
    onExit()
  }
  const again = () => {
    stopAll()
    setRound((r) => r + 1)
    setIdx(0)
    setFinished(false)
    resetQuestion()
  }

  const wordVisible = showHint
  const gameProps: GameProps = { entry, words, settings, onCorrect, onWrong }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn ghost" onClick={exit}>
          {t.exit}
        </button>
        <span className="mode-tag">{modeTitle[mode]}</span>
        {!finished && (
          <span className="progress">
            {idx + 1} / {roundWords.length}
          </span>
        )}
      </div>
      {speechWarn && <p className="notice">{t.speechUnavailable}</p>}

      {finished ? (
        <div className="card center">
          <div className="big-emoji" aria-hidden>
            🎉
          </div>
          <h2>{t.roundDone}</h2>
          <div className="row wrap">
            <button className="btn primary big" onClick={exit}>
              {t.allDone}
            </button>
            <button className="btn big" onClick={again}>
              {t.playAgain}
            </button>
          </div>
        </div>
      ) : phase === 'preview' ? (
        <div className="card center">
          {settings.showWordFirst && <div className="word-display">{entry.word}</div>}
          <p className="soft">{t.takeYourTime}</p>
          <button className="btn primary big" autoFocus onClick={() => setPhase('answer')}>
            {t.imReady}
          </button>
          <div className="row wrap">
            <button className="btn" onClick={play}>
              {t.listen}
            </button>
            <button className="btn ghost" onClick={onSkip}>
              {t.skip}
            </button>
          </div>
        </div>
      ) : phase === 'feedback' ? (
        <div className="card center">
          <p className="feedback">{feedback}</p>
          <button className="btn primary big" autoFocus onClick={next}>
            {t.next}
          </button>
        </div>
      ) : (
        <div className="card">
          {wordVisible && <div className="word-display small">{entry.word}</div>}
          {mode === 'listen' && <ListenGame key={`${round}-${idx}`} {...gameProps} />}
          {mode === 'missing' && <MissingGame key={`${round}-${idx}`} {...gameProps} />}
          {mode === 'fix' && <FixGame key={`${round}-${idx}`} {...gameProps} />}
          <div className="row wrap controls">
            <button className="btn" onClick={play}>
              {t.listen}
            </button>
            <button
              className="btn"
              onClick={() => {
                setShowHint((s) => !s)
                setUsedHint(true)
              }}
            >
              {t.showWord}
            </button>
            <button className="btn ghost" onClick={onSkip}>
              {t.skip}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ListenGame({ entry, words, settings, onCorrect, onWrong }: GameProps) {
  const options = useMemo(
    () => buildOptions(entry.word, words.map((w) => w.word), settings.optionCount),
    [entry, words, settings.optionCount],
  )
  const [pickedWrong, setPickedWrong] = useState<string[]>([])
  const [msg, setMsg] = useState('')
  if (options.length < 2) return <p className="notice">{t.notEnoughWords}</p>
  const pick = (w: string) => {
    if (w === entry.word) onCorrect()
    else {
      setPickedWrong((p) => [...p, w])
      setMsg(t.tryAgain)
      onWrong()
    }
  }
  return (
    <div className="center">
      <p className="prompt">{t.pickOne}</p>
      <div className="options">
        {options.map((w) => (
          <button
            key={w}
            className={`btn option ${pickedWrong.includes(w) ? 'wrong' : ''}`}
            onClick={() => pick(w)}
          >
            {w}
          </button>
        ))}
      </div>
      {msg && <p className="gentle">{msg}</p>}
    </div>
  )
}

function MissingGame({ entry, settings, onCorrect, onWrong }: GameProps) {
  const blanks = useMemo(
    () => resolveBlanks(entry.word, settings, entry.blankPresets),
    [entry, settings],
  )
  const choices = useMemo(
    () => missingChoices(entry.word, blanks, settings.letterChoices),
    [entry, blanks, settings.letterChoices],
  )
  const [filled, setFilled] = useState<Record<number, string>>({})
  const [active, setActive] = useState(blanks[0])
  const [wrongPos, setWrongPos] = useState<number[]>([])
  const [msg, setMsg] = useState('')
  const allFilled = blanks.every((p) => filled[p] !== undefined)

  const tapLetter = (c: string) => {
    const next = { ...filled, [active]: c }
    setFilled(next)
    setWrongPos((w) => w.filter((p) => p !== active))
    const upcoming =
      blanks.find((p) => p > active && next[p] === undefined) ??
      blanks.find((p) => next[p] === undefined)
    if (upcoming !== undefined) setActive(upcoming)
  }
  const check = () => {
    const bad = blanks.filter((p) => filled[p] !== entry.word[p])
    if (bad.length === 0) onCorrect()
    else {
      setWrongPos(bad)
      setMsg(t.tryAgain)
      onWrong()
    }
  }

  return (
    <div className="center">
      <p className="prompt">{t.tapBlank}</p>
      <div className="tiles" role="group" aria-label="word">
        {entry.word.split('').map((c, i) =>
          blanks.includes(i) ? (
            <button
              key={i}
              className={`tile blank ${i === active ? 'active' : ''} ${wrongPos.includes(i) ? 'wrong' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`missing letter ${i + 1}`}
              aria-pressed={i === active}
            >
              {filled[i] ?? ''}
            </button>
          ) : (
            <span key={i} className="tile given">
              {c}
            </span>
          ),
        )}
      </div>
      <div className="letters">
        {choices.map((c, i) => (
          <button key={i} className="btn letter" onClick={() => tapLetter(c)}>
            {c}
          </button>
        ))}
      </div>
      <button className="btn primary big" onClick={check} disabled={!allFilled}>
        {t.check}
      </button>
      {msg && <p className="gentle">{msg}</p>}
    </div>
  )
}

function FixGame({ entry, settings, onCorrect, onWrong }: GameProps) {
  const q = useMemo(() => fixQuestion(entry.word), [entry])
  const choices = useMemo(
    () => missingChoices(entry.word, [q.wrongIndex], settings.letterChoices),
    [entry, q, settings.letterChoices],
  )
  const [letters, setLetters] = useState<string[]>(q.display.split(''))
  const [sel, setSel] = useState<number | null>(null)
  const [msg, setMsg] = useState('')

  const tapLetter = (c: string) => {
    if (sel === null) {
      setMsg(t.tapWrongLetter)
      return
    }
    setLetters((ls) => ls.map((l, i) => (i === sel ? c : l)))
  }
  const check = () => {
    if (letters.join('') === entry.word) onCorrect()
    else {
      setMsg(t.tryAgain)
      onWrong()
    }
  }

  return (
    <div className="center">
      <p className="prompt">{sel === null ? t.tapWrongLetter : t.thenPickLetter}</p>
      <div className="tiles" role="group" aria-label="word with one wrong letter">
        {letters.map((c, i) => (
          <button
            key={i}
            className={`tile blank ${i === sel ? 'active' : ''}`}
            onClick={() => setSel(i)}
            aria-pressed={i === sel}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="letters">
        {choices.map((c, i) => (
          <button key={i} className="btn letter" onClick={() => tapLetter(c)}>
            {c}
          </button>
        ))}
      </div>
      <button className="btn primary big" onClick={check}>
        {t.check}
      </button>
      {msg && <p className="gentle">{msg}</p>}
    </div>
  )
}
