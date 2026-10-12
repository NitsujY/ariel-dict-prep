// 漸進練習 Progressive practice: leading blanks grow per word until mastered.
// Infinite gentle looping — the child (or parent) decides when to stop.
import { useEffect, useState } from 'react'
import type { Attempt, PracticeProgress, Settings, WordEntry, WordList } from '../types'
import { t } from '../i18n'
import { playWord, stopAll } from '../audio'
import { missingChoices } from '../questions'
import { initialProgress, nextProgress, practiceBlanks, resetStreak } from '../practice'

interface PracticeProps {
  list: WordList
  words: WordEntry[]
  settings: Settings
  progress: Record<string, PracticeProgress>
  onProgress: (wordId: string, p: PracticeProgress) => void
  onResetProgress: () => void
  onExit: () => void
  onRecord: (a: Attempt) => void
}

export default function Practice({
  list,
  words,
  settings,
  progress,
  onProgress,
  onResetProgress,
  onExit,
  onRecord,
}: PracticeProps) {
  const get = (id: string): PracticeProgress =>
    progress[id] ??
    initialProgress(words.find((w) => w.id === id)?.word.length ?? 1, settings.practiceStartBlanks)

  const remaining = words.filter((w) => !get(w.id).mastered)
  const masteredCount = words.length - remaining.length

  const [currentId, setCurrentId] = useState<string | null>(remaining[0]?.id ?? null)
  const [qLevel, setQLevel] = useState(() => (remaining[0] ? get(remaining[0].id).level : 1))
  const [phase, setPhase] = useState<'preview' | 'answer' | 'feedback'>('preview')
  const [filled, setFilled] = useState<Record<number, string>>({})
  const [active, setActive] = useState(0)
  const [wrongPos, setWrongPos] = useState<number[]>([])
  const [retries, setRetries] = useState(0)
  const [usedHint, setUsedHint] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [speechWarn, setSpeechWarn] = useState(false)

  const entry = currentId ? words.find((w) => w.id === currentId) : null
  const lang = list.lang || 'en-GB'
  const blanks = entry ? practiceBlanks(Math.min(qLevel, entry.word.length)) : []
  // Frozen per question — recomputing each render would reshuffle the buttons.
  const [frozenChoices, setFrozenChoices] = useState<string[]>(() => {
    const first = remaining[0]
    if (!first) return []
    const b = practiceBlanks(Math.min(get(first.id).level, first.word.length))
    return missingChoices(first.word, b, true, Math.random, settings.practiceChoices)
  })

  const play = () => entry && playWord(entry, settings, lang, () => setSpeechWarn(true))
  useEffect(() => {
    play()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])
  useEffect(() => () => stopAll(), [])

  const startQuestion = (id: string) => {
    stopAll()
    const w = words.find((x) => x.id === id)!
    const level = get(id).level
    const b = practiceBlanks(Math.min(level, w.word.length))
    setCurrentId(id)
    setQLevel(level)
    setFrozenChoices(missingChoices(w.word, b, true, Math.random, settings.practiceChoices))
    setFilled({})
    setActive(b[0])
    setWrongPos([])
    setRetries(0)
    setUsedHint(false)
    setShowHint(false)
    setFeedback(null)
    setPhase('preview')
  }

  const record = (correct: boolean, skipped: boolean) =>
    entry &&
    onRecord({
      ts: Date.now(),
      listId: list.id,
      wordId: entry.id,
      word: entry.word,
      mode: 'practice',
      category: usedHint ? 'hinted' : 'unhinted',
      correct,
      retries,
      skipped,
      usedHint,
    })

  const pickNext = (): string | null => {
    const open = words.filter((w) => !get(w.id).mastered && w.id !== currentId)
    const pool = open.length > 0 ? open : words.filter((w) => !get(w.id).mastered)
    return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)].id : null
  }

  const check = () => {
    if (!entry) return
    const bad = blanks.filter((p) => filled[p] !== entry.word[p])
    if (bad.length > 0) {
      setWrongPos(bad)
      setRetries((r) => r + 1)
      onProgress(entry.id, resetStreak(get(entry.id)))
      return
    }
    const before = get(entry.id)
    const after = nextProgress(before, entry.word.length, !usedHint, settings.masteryTarget)
    onProgress(entry.id, after)
    record(true, false)
    setFeedback(
      after.mastered && !before.mastered
        ? t.masteredWord(entry.word)
        : t.correctMsgs[Math.floor(Math.random() * t.correctMsgs.length)],
    )
    setPhase('feedback')
  }

  const skip = () => {
    record(false, true)
    setFeedback(t.skippedMsg)
    setPhase('feedback')
  }

  const next = () => {
    const id = pickNext()
    if (id) startQuestion(id)
    else {
      stopAll()
      setCurrentId(null)
    }
  }

  const exit = () => {
    stopAll()
    onExit()
  }

  const restart = () => {
    onResetProgress()
    startQuestion(words[0].id)
  }

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

  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn ghost" onClick={exit}>
          {t.exit}
        </button>
        <span className="mode-tag">{t.modePractice}</span>
        <span className="progress">{t.practiceProgress(masteredCount, words.length)}</span>
      </div>
      {speechWarn && <p className="notice">{t.speechUnavailable}</p>}

      {!entry ? (
        <div className="card center">
          <div className="big-emoji" aria-hidden>
            🌟
          </div>
          <h2>{t.practiceAllMastered}</h2>
          <div className="row wrap">
            <button className="btn primary big" onClick={exit}>
              {t.allDone}
            </button>
            <button className="btn big" onClick={restart}>
              {t.practiceRestart}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="chips" aria-hidden>
            {words.map((w) => (
              <span key={w.id} className={`chip ${get(w.id).mastered ? 'done' : ''}`}>
                {get(w.id).mastered ? '🌟 ' : ''}
                <span lang="en">{w.word}</span>
              </span>
            ))}
          </div>
          {phase === 'preview' ? (
            <div className="card center">
              {settings.showWordFirst && <div className="word-display">{entry.word}</div>}
              <p className="soft">
                {t.takeYourTime} {t.practiceFill(blanks.length)}
              </p>
              <button className="btn primary big" autoFocus onClick={() => setPhase('answer')}>
                {t.imReady}
              </button>
              <div className="row wrap">
                <button className="btn" onClick={play}>
                  {t.listen}
                </button>
                <button className="btn ghost" onClick={skip}>
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
            <div className="card center">
              {showHint && <div className="word-display small">{entry.word}</div>}
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
                {frozenChoices.map((c, i) => (
                  <button key={i} className="btn letter" onClick={() => tapLetter(c)}>
                    {c}
                  </button>
                ))}
              </div>
              <button className="btn primary big" onClick={check} disabled={!allFilled}>
                {t.check}
              </button>
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
                <button className="btn ghost" onClick={skip}>
                  {t.skip}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
