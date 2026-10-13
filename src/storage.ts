// Versioned localStorage wrapper with graceful degradation.
import type { Store, Settings } from './types'

const KEY = 'awp:v1'

export const defaultSettings: Settings = {
  voiceURI: null,
  rate: 0.9,
  optionCount: 3,
  roundLength: 3,
  showWordFirst: true,
  letterChoices: true,
  practiceChoices: 3,
  practiceStartBlanks: 1,
  masteryTarget: 2,
  moleTarget: 0,
}

export function defaultStore(): Store {
  return {
    version: 1,
    customLists: [],
    settings: defaultSettings,
    records: [],
    selectedWords: {},
    practice: {},
  }
}

/** degraded=true means storage was missing/corrupt — app still works, nothing persists. */
export function loadStore(): { store: Store; degraded: boolean } {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { store: defaultStore(), degraded: false }
    const d = JSON.parse(raw)
    if (!d || d.version !== 1 || !Array.isArray(d.customLists)) throw new Error('bad shape')
    const store: Store = {
      version: 1,
      customLists: d.customLists,
      settings: { ...defaultSettings, ...(d.settings ?? {}) },
      records: Array.isArray(d.records) ? d.records : [],
      selectedWords: d.selectedWords && typeof d.selectedWords === 'object' ? d.selectedWords : {},
      practice: d.practice && typeof d.practice === 'object' ? d.practice : {},
    }
    return { store, degraded: false }
  } catch {
    return { store: defaultStore(), degraded: true }
  }
}

export function saveStore(store: Store): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
    return true
  } catch {
    return false
  }
}

const MAX_RECORDS = 1000 // ponytail: cap so storage can't grow unbounded

export function addRecord(store: Store, a: Store['records'][number]): Store {
  return { ...store, records: [...store.records, a].slice(-MAX_RECORDS) }
}
