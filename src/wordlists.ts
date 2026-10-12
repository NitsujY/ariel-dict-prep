// Word-list loading, parsing, validation, import/export.
import type { WordEntry, WordList, Settings, Attempt } from './types'
import bundled from './data/lists.json'

export function loadBundled(): WordList[] {
  return (bundled.lists as WordList[]).map((l) => ({ ...l, builtin: true }))
}

export function newId(): string {
  return crypto.randomUUID()
}

/** Words to practise this session: the saved subset, or the whole list. */
export function sessionWords(list: WordList, selected: Record<string, string[]>): WordEntry[] {
  const ids = selected[list.id]
  return ids ? list.words.filter((w) => ids.includes(w.id)) : list.words
}

export interface ParseResult {
  words: string[]
  errors: string[]
}

/**
 * Parse pasted words (one per line). Capitalisation is preserved exactly;
 * blanks and duplicates are reported, never silently altered.
 */
export function parsePastedWords(text: string): ParseResult {
  const words: string[] = []
  const errors: string[] = []
  const seen = new Map<string, number>()
  const lines = text.split('\n')
  lines.forEach((line, i) => {
    const w = line.trim()
    if (!w) {
      if (line.length > 0) errors.push(`第 ${i + 1} 行：空白行（已略過）`)
      return
    }
    const key = w.toLowerCase()
    if (seen.has(key)) {
      errors.push(`第 ${i + 1} 行：「${w}」同第 ${seen.get(key)! + 1} 行重複（已略過）`)
      return
    }
    seen.set(key, i)
    words.push(w)
  })
  return { words, errors }
}

/** Validate 0-based letter positions against a word length. Returns an error message or null. */
export function validatePositions(positions: number[], wordLen: number): string | null {
  if (wordLen < 1) return '詞語不能為空'
  if (positions.length === 0) return '請至少揀一個字母位置'
  for (const p of positions) {
    if (!Number.isInteger(p) || p < 0 || p >= wordLen)
      return `位置 ${p} 超出範圍（0–${wordLen - 1}）`
  }
  if (new Set(positions).size !== positions.length) return '位置有重複'
  return null
}

function validWordEntry(w: unknown): w is WordEntry {
  if (!w || typeof w !== 'object') return false
  const e = w as WordEntry
  if (typeof e.id !== 'string' || typeof e.word !== 'string' || e.word.trim() === '') return false
  if (e.blankPresets !== undefined) {
    if (!Array.isArray(e.blankPresets)) return false
    for (const preset of e.blankPresets) {
      if (!Array.isArray(preset)) return false
      const err = validatePositions(preset, e.word.length)
      if (err) return false
    }
  }
  return true
}

export function validWordList(l: unknown): l is WordList {
  if (!l || typeof l !== 'object') return false
  const list = l as WordList
  return (
    typeof list.id === 'string' &&
    typeof list.title === 'string' &&
    typeof list.lang === 'string' &&
    Array.isArray(list.words) &&
    list.words.length > 0 &&
    list.words.every(validWordEntry)
  )
}

export interface ExportData {
  app: 'ariel-word-playground'
  version: 1
  exportedAt: string
  customLists: WordList[]
  settings: Settings
  records: Attempt[]
}

export function exportJSON(data: Omit<ExportData, 'app' | 'version' | 'exportedAt'>): string {
  const payload: ExportData = {
    app: 'ariel-word-playground',
    version: 1,
    exportedAt: new Date().toISOString(),
    ...data,
  }
  return JSON.stringify(payload, null, 2)
}

export type ImportResult =
  | { ok: true; customLists: WordList[]; settings: Settings | null; records: Attempt[] }
  | { ok: false; error: string }

export function importJSON(text: string): ImportResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'JSON 格式錯誤' }
  }
  const d = data as Partial<ExportData>
  if (!d || typeof d !== 'object' || d.app !== 'ariel-word-playground' || d.version !== 1)
    return { ok: false, error: '唔係呢個 App 嘅備份檔' }
  if (!Array.isArray(d.customLists) || !d.customLists.every(validWordList))
    return { ok: false, error: '字表資料格式錯誤' }
  const ids = new Set<string>()
  for (const l of d.customLists) {
    if (ids.has(l.id)) return { ok: false, error: `字表 ID 重複：${l.id}` }
    ids.add(l.id)
  }
  const settings = d.settings && typeof d.settings === 'object' ? (d.settings as Settings) : null
  const records = Array.isArray(d.records) ? (d.records as Attempt[]) : []
  return { ok: true, customLists: d.customLists, settings, records }
}
