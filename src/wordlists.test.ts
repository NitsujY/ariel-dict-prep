import { describe, expect, it } from 'vitest'
import { exportJSON, importJSON, parsePastedWords, validatePositions } from './wordlists'
import { defaultSettings } from './storage'
import type { WordList } from './types'

describe('parsePastedWords', () => {
  it('reads one word per line and preserves capitalisation', () => {
    const { words, errors } = parsePastedWords('Happy\nsun\nCAT')
    expect(words).toEqual(['Happy', 'sun', 'CAT'])
    expect(errors).toEqual([])
  })

  it('flags duplicates case-insensitively without altering spelling', () => {
    const { words, errors } = parsePastedWords('happy\nHappy\nhappy')
    expect(words).toEqual(['happy'])
    expect(errors.length).toBe(2)
  })

  it('flags whitespace-only lines and skips them', () => {
    const { words, errors } = parsePastedWords('tall\n   \nsmart')
    expect(words).toEqual(['tall', 'smart'])
    expect(errors.length).toBe(1)
  })
})

describe('validatePositions', () => {
  it('accepts valid positions', () => {
    expect(validatePositions([0, 2], 5)).toBeNull()
  })
  it('rejects empty, out-of-range, non-integer, and duplicate positions', () => {
    expect(validatePositions([], 5)).not.toBeNull()
    expect(validatePositions([5], 5)).not.toBeNull()
    expect(validatePositions([-1], 5)).not.toBeNull()
    expect(validatePositions([1.5], 5)).not.toBeNull()
    expect(validatePositions([1, 1], 5)).not.toBeNull()
  })
})

describe('import/export JSON', () => {
  const list: WordList = {
    id: 'l1',
    title: 'Test',
    lang: 'en-GB',
    words: [
      { id: 'w1', word: 'happy', blankPresets: [[0, 1]] },
      { id: 'w2', word: 'tall' },
    ],
  }

  it('round-trips a valid export', () => {
    const text = exportJSON({ customLists: [list], settings: defaultSettings, records: [] })
    const res = importJSON(text)
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.customLists).toEqual([list])
      expect(res.settings?.rate).toBe(defaultSettings.rate)
    }
  })

  it('rejects malformed JSON', () => {
    expect(importJSON('{not json').ok).toBe(false)
  })

  it('rejects foreign JSON shapes', () => {
    expect(importJSON('{"hello":1}').ok).toBe(false)
  })

  it('rejects lists with empty words', () => {
    const bad = { ...list, words: [{ id: 'w', word: '  ' }] }
    const text = JSON.stringify({
      app: 'ariel-word-playground',
      version: 1,
      customLists: [bad],
    })
    expect(importJSON(text).ok).toBe(false)
  })

  it('rejects invalid blank presets', () => {
    const bad = { ...list, words: [{ id: 'w', word: 'cat', blankPresets: [[9]] }] }
    const text = JSON.stringify({
      app: 'ariel-word-playground',
      version: 1,
      customLists: [bad],
    })
    expect(importJSON(text).ok).toBe(false)
  })
})
