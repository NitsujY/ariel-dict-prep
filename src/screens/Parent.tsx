import { useEffect, useRef, useState } from 'react'
import type { Store, WordList } from '../types'
import { t } from '../i18n'
import { loadVoices, speakWord, speechSupported } from '../audio'
import { exportJSON, importJSON, newId, parsePastedWords } from '../wordlists'
import { summarize } from '../records'

interface ParentProps {
  allLists: WordList[]
  store: Store
  persist: (fn: (s: Store) => Store) => void
  onBack: () => void
}

export default function Parent({ allLists, store, persist, onBack }: ParentProps) {
  const [listId, setListId] = useState(allLists[0]?.id ?? '')
  const list = allLists.find((l) => l.id === listId)
  const [draft, setDraft] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [importMsg, setImportMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const s = store.settings

  useEffect(() => {
    loadVoices().then((vs) => setVoices(vs.filter((v) => v.lang.toLowerCase().startsWith('en'))))
  }, [])
  useEffect(() => {
    setDraft(list && !list.builtin ? list.words.map((w) => w.word).join('\n') : '')
    setErrors([])
  }, [listId]) // eslint-disable-line react-hooks/exhaustive-deps

  const setSettings = (patch: Partial<Store['settings']>) =>
    persist((st) => ({ ...st, settings: { ...st.settings, ...patch } }))

  const createList = () => {
    const id = newId()
    persist((st) => ({
      ...st,
      customLists: [
        ...st.customLists,
        { id, title: '新字表', date: new Date().toISOString().slice(0, 10), lang: 'en-GB', words: [] },
      ],
    }))
    setListId(id)
  }

  const saveWords = () => {
    if (!list) return
    const { words, errors } = parsePastedWords(draft)
    setErrors(errors)
    if (words.length === 0) return
    persist((st) => ({
      ...st,
      customLists: st.customLists.map((l) =>
        l.id === list.id ? { ...l, words: words.map((word) => ({ id: newId(), word })) } : l,
      ),
      selectedWords: { ...st.selectedWords, [list.id]: [] },
    }))
  }

  const subset = list ? (store.selectedWords[list.id] ?? list.words.map((w) => w.id)) : []
  const toggleWord = (wid: string) =>
    persist((st) => ({
      ...st,
      selectedWords: {
        ...st.selectedWords,
        [list!.id]: subset.includes(wid) ? subset.filter((x) => x !== wid) : [...subset, wid],
      },
    }))

  const doExport = () => {
    const blob = new Blob([exportJSON(store)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'ariel-word-playground-backup.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const doImport = async (f: File) => {
    const res = importJSON(await f.text())
    if (!res.ok) {
      setImportMsg(`${t.pmImportBad}${res.error}`)
      return
    }
    persist((st) => ({
      ...st,
      customLists: res.customLists,
      settings: res.settings ?? st.settings,
      records: res.records,
    }))
    setImportMsg(t.pmImportOk)
  }

  const summary = summarize(store.records)

  return (
    <div className="screen parent">
      <div className="topbar">
        <button className="btn ghost" onClick={onBack}>
          {t.back}
        </button>
        <h2>{t.parentMode}</h2>
        <span />
      </div>

      <section className="card">
        <h3>{t.pmLists}</h3>
        <div className="row wrap">
          <select className="select" value={listId} onChange={(e) => setListId(e.target.value)}>
            {allLists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title} — {l.builtin ? t.builtin : t.custom}
              </option>
            ))}
          </select>
          <button className="btn" onClick={createList}>
            ➕ {t.pmNewList}
          </button>
          {list && !list.builtin && (
            <button
              className="btn danger"
              onClick={() => {
                if (confirm(t.pmDeleteList + '？'))
                  persist((st) => ({
                    ...st,
                    customLists: st.customLists.filter((l) => l.id !== list.id),
                  }))
              }}
            >
              🗑 {t.pmDeleteList}
            </button>
          )}
        </div>
        {list && !list.builtin && (
          <>
            <label className="field">
              {t.pmListTitle}
              <input
                className="input"
                value={list.title}
                onChange={(e) =>
                  persist((st) => ({
                    ...st,
                    customLists: st.customLists.map((l) =>
                      l.id === list.id ? { ...l, title: e.target.value } : l,
                    ),
                  }))
                }
              />
            </label>
            <label className="field">
              {t.pmListDate}
              <input
                className="input"
                value={list.date ?? ''}
                onChange={(e) =>
                  persist((st) => ({
                    ...st,
                    customLists: st.customLists.map((l) =>
                      l.id === list.id ? { ...l, date: e.target.value } : l,
                    ),
                  }))
                }
              />
            </label>
            <label className="field">
              {t.pmWords}
              <textarea
                className="input textarea"
                rows={6}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </label>
            <button className="btn primary" onClick={saveWords}>
              {t.pmSaveWords}
            </button>
            {errors.map((e, i) => (
              <p key={i} className="notice">
                {e}
              </p>
            ))}
          </>
        )}
        {list?.builtin && <p className="soft">{t.pmBuiltinNote}</p>}

        {list && list.words.length > 0 && (
          <>
            <h4>{t.pmSubset}</h4>
            <div className="row wrap">
              <button
                className="btn ghost"
                onClick={() =>
                  persist((st) => ({
                    ...st,
                    selectedWords: { ...st.selectedWords, [list.id]: list.words.map((w) => w.id) },
                  }))
                }
              >
                {t.pmSelectAll}
              </button>
              <button
                className="btn ghost"
                onClick={() =>
                  persist((st) => ({
                    ...st,
                    selectedWords: { ...st.selectedWords, [list.id]: [] },
                  }))
                }
              >
                {t.pmSelectNone}
              </button>
            </div>
            <div className="word-checks">
              {list.words.map((w) => (
                <label key={w.id} className="word-check">
                  <input
                    type="checkbox"
                    checked={subset.includes(w.id)}
                    onChange={() => toggleWord(w.id)}
                  />
                  <span lang="en">{w.word}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h3>{t.pmSettings}</h3>
        {speechSupported ? (
          <>
            <label className="field">
              {t.pmVoice}
              <select
                className="select"
                value={s.voiceURI ?? ''}
                onChange={(e) => setSettings({ voiceURI: e.target.value || null })}
              >
                <option value="">{t.pmVoiceDefault}</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              {t.pmRate}: {s.rate.toFixed(1)}×
              <input
                type="range"
                min={0.5}
                max={1.2}
                step={0.1}
                value={s.rate}
                onChange={(e) => setSettings({ rate: Number(e.target.value) })}
              />
            </label>
            <button className="btn" onClick={() => speakWord('happy', s)}>
              {t.pmPreviewVoice}
            </button>
          </>
        ) : (
          <p className="notice">{t.speechUnavailable}</p>
        )}
        <label className="field">
          {t.pmOptionCount}
          <select
            className="select"
            value={s.optionCount}
            onChange={(e) => setSettings({ optionCount: Number(e.target.value) })}
          >
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </label>
        <label className="field">
          {t.pmRoundLength}
          <select
            className="select"
            value={s.roundLength}
            onChange={(e) => setSettings({ roundLength: Number(e.target.value) })}
          >
            {[2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          {t.pmMissingMode}
          <select
            className="select"
            value={s.missingMode}
            onChange={(e) =>
              setSettings({ missingMode: e.target.value as Store['settings']['missingMode'] })
            }
          >
            <option value="first1">{t.pmFirst1}</option>
            <option value="first2">{t.pmFirst2}</option>
            <option value="custom">{t.pmCustomPos}</option>
          </select>
        </label>
        {s.missingMode === 'custom' && (
          <label className="field">
            {t.pmCustomPos}
            <input
              className="input"
              defaultValue={s.customPositions.join(',')}
              onBlur={(e) => {
                const pos = e.target.value
                  .split(/[,\s]+/)
                  .map((x) => Number(x))
                  .filter((n) => Number.isInteger(n) && n >= 0)
                if (pos.length > 0) setSettings({ customPositions: [...new Set(pos)] })
              }}
            />
          </label>
        )}
        <label className="word-check">
          <input
            type="checkbox"
            checked={s.showWordFirst}
            onChange={(e) => setSettings({ showWordFirst: e.target.checked })}
          />
          {t.pmShowWordFirst}
        </label>
        <label className="word-check">
          <input
            type="checkbox"
            checked={s.letterChoices}
            onChange={(e) => setSettings({ letterChoices: e.target.checked })}
          />
          {t.pmLetterChoices}
        </label>
      </section>

      <section className="card">
        <h3>{t.pmRecords}</h3>
        {store.records.length === 0 ? (
          <p className="soft">{t.pmNoRecords}</p>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th>{t.pmColTotal}</th>
                  <th>{t.pmColCorrect}</th>
                  <th>{t.pmColSkipped}</th>
                  <th>{t.pmColHints}</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ['listening', t.pmCatListening],
                    ['hinted', t.pmCatHinted],
                    ['unhinted', t.pmCatUnhinted],
                  ] as const
                ).map(([cat, label]) => (
                  <tr key={cat}>
                    <td>{label}</td>
                    <td>{summary[cat].total}</td>
                    <td>{summary[cat].correct}</td>
                    <td>{summary[cat].skipped}</td>
                    <td>{summary[cat].hints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="btn danger"
              onClick={() => {
                if (confirm(t.pmResetConfirm)) persist((st) => ({ ...st, records: [] }))
              }}
            >
              {t.pmResetRecords}
            </button>
          </>
        )}
      </section>

      <section className="card">
        <h3>{t.pmBackup}</h3>
        <div className="row wrap">
          <button className="btn" onClick={doExport}>
            {t.pmExport}
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            {t.pmImport}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) doImport(f)
              e.target.value = ''
            }}
          />
        </div>
        {importMsg && <p className="notice">{importMsg}</p>}
        <p className="soft">{t.pmLocalNote}</p>
      </section>
    </div>
  )
}
