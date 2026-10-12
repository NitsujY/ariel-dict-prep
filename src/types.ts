export type GameMode = 'listen' | 'missing' | 'fix'

export interface WordEntry {
  id: string
  word: string
  sentence?: string
  /** Optional path to a pre-recorded audio file, relative to the app base. */
  audio?: string
  /** Optional missing-letter position presets (0-based indices). */
  blankPresets?: number[][]
}

export interface WordList {
  id: string
  title: string
  date?: string
  /** BCP-47 tag for spoken audio, e.g. en-GB. */
  lang: string
  builtin?: boolean
  words: WordEntry[]
}

export interface Settings {
  voiceURI: string | null
  rate: number
  /** Number of options in Listen & Find (2 or 3). */
  optionCount: number
  roundLength: number
  missingMode: 'first1' | 'first2' | 'custom'
  customPositions: number[]
  /** Show the complete word during preview, before "I'm ready". */
  showWordFirst: boolean
  /** Offer a small set of letter choices instead of the full alphabet. */
  letterChoices: boolean
}

export type AttemptCategory = 'listening' | 'hinted' | 'unhinted'

export interface Attempt {
  ts: number
  listId: string
  wordId: string
  /** Kept so records stay readable even if the list is edited later. */
  word: string
  mode: GameMode
  category: AttemptCategory
  correct: boolean
  retries: number
  skipped: boolean
  usedHint: boolean
}

export interface Store {
  version: 1
  customLists: WordList[]
  settings: Settings
  records: Attempt[]
  /** Per-list session word subset; missing entry = all words. */
  selectedWords: Record<string, string[]>
}
