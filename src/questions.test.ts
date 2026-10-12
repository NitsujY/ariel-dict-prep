import { describe, expect, it } from 'vitest'
import { buildOptions, fixQuestion, missingChoices, resolveBlanks, shuffle } from './questions'
import type { Settings } from './types'

/** Deterministic rng cycling through the given values. */
const seq = (...nums: number[]) => {
  let i = 0
  return () => nums[i++ % nums.length]
}

const baseSettings: Pick<Settings, 'missingMode' | 'customPositions'> = {
  missingMode: 'first1',
  customPositions: [0],
}

describe('buildOptions', () => {
  const pool = ['tall', 'pretty', 'lovely', 'smart', 'happy', 'helpful']

  it('always includes the target and has unique options', () => {
    for (const target of pool) {
      const opts = buildOptions(target, pool, 3)
      expect(opts).toContain(target)
      expect(new Set(opts).size).toBe(opts.length)
      expect(opts.length).toBe(3)
    }
  })

  it('degrades gracefully when the pool is too small', () => {
    const opts = buildOptions('tall', ['tall', 'happy'], 3)
    expect(opts.sort()).toEqual(['happy', 'tall'])
  })

  it('ignores case differences when excluding the target', () => {
    const opts = buildOptions('Happy', ['Happy', 'happy', 'tall'], 3)
    expect(opts.filter((o) => o.toLowerCase() === 'happy').length).toBe(1)
  })
})

describe('resolveBlanks', () => {
  it('first1 / first2 presets', () => {
    expect(resolveBlanks('happy', { ...baseSettings, missingMode: 'first1' })).toEqual([0])
    expect(resolveBlanks('happy', { ...baseSettings, missingMode: 'first2' })).toEqual([0, 1])
  })

  it('clamps to word length and removes duplicates', () => {
    expect(
      resolveBlanks('hi', { missingMode: 'custom', customPositions: [0, 1, 9, 0, -1] }),
    ).toEqual([0, 1])
  })

  it('falls back to [0] when nothing valid remains', () => {
    expect(resolveBlanks('cat', { missingMode: 'custom', customPositions: [7] })).toEqual([0])
  })

  it('handles repeated-letter words by position, not by letter', () => {
    expect(resolveBlanks('happy', { missingMode: 'custom', customPositions: [2, 3] })).toEqual([
      2, 3,
    ])
  })

  it('uses word-level presets in custom mode when available', () => {
    expect(
      resolveBlanks('happy', { missingMode: 'custom', customPositions: [9] }, [[1, 4]]),
    ).toEqual([1, 4])
  })
})

describe('missingChoices', () => {
  it('keeps multiplicity for repeated letters (happy blanks 2,3 → two p)', () => {
    const choices = missingChoices('happy', [2, 3], true, seq(0.1))
    expect(choices.filter((c) => c === 'p').length).toBe(2)
  })

  it('includes every needed letter plus distractors, all letters valid', () => {
    const choices = missingChoices('tall', [0, 1], true, seq(0.3))
    expect(choices).toContain('t')
    expect(choices).toContain('a')
    expect(choices.length).toBeGreaterThanOrEqual(4)
  })

  it('full alphabet mode contains every needed letter, including capitals', () => {
    const choices = missingChoices('Happy', [0], false)
    expect(choices).toContain('H')
    expect(choices.length).toBe(27)
  })
})

describe('fixQuestion', () => {
  it('display differs from the target at exactly the wrong index', () => {
    const rng = seq(0.4, 0.7)
    const { wrongIndex, display } = fixQuestion('happy', rng)
    expect(display.length).toBe('happy'.length)
    expect(display).not.toBe('happy')
    const diffs = 'happy'.split('').filter((c, idx) => display[idx] !== c)
    expect(diffs.length).toBe(1)
    expect(display[wrongIndex]).not.toBe('happy'[wrongIndex])
  })

  it('preserves capitalisation of the replaced letter', () => {
    const { wrongIndex, display } = fixQuestion('Happy', seq(0, 0.2))
    expect(wrongIndex).toBe(0)
    expect(display[0]).toBe(display[0].toUpperCase())
    expect(display[0]).not.toBe('H')
  })

  it('never picks the original letter, even at rng extremes', () => {
    for (const r of [0, 0.99]) {
      const { wrongIndex, display } = fixQuestion('tall', seq(r, r))
      expect(display[wrongIndex]).not.toBe('tall'[wrongIndex])
    }
  })
})

describe('shuffle', () => {
  it('is a permutation', () => {
    const out = shuffle([1, 2, 3, 4, 5], seq(0.2))
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5])
  })
})
