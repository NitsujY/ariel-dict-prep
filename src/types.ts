export type GameMode = 'listen' | 'fix' | 'practice' | 'mole'

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
  /** Show the complete word during preview, before "I'm ready". */
  showWordFirst: boolean
  /** Offer a small set of letter choices instead of the full alphabet. */
  letterChoices: boolean
  /** Practice mode: size of the letter-choice pool. */
  practiceChoices: number
  /** Practice mode: leading blanks when a word is first seen. */
  practiceStartBlanks: number
  /** Practice mode: consecutive unhinted full-word correct answers to master a word. */
  masteryTarget: number
  /** Mole mode: letters to whack per word, starting from the first char; 0 = whole word. */
  moleTarget: number
}

/** Per-word practice progress, persisted locally. */
export interface PracticeProgress {
  /** Number of leading letters the child must currently fill in. */
  level: number
  /** Consecutive unhinted correct answers at full-word level. */
  streak: number
  mastered: boolean
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
  /** Practice progress: listId → wordId → progress. */
  practice: Record<string, Record<string, PracticeProgress>>
}
