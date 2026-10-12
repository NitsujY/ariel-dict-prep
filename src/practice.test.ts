import { describe, expect, it } from 'vitest'
import { initialProgress, nextProgress, practiceBlanks, resetStreak } from './practice'

describe('initialProgress', () => {
  it('starts at the configured number of leading blanks, clamped to the word', () => {
    expect(initialProgress(5, 1)).toEqual({ level: 1, streak: 0, mastered: false })
    expect(initialProgress(5, 2).level).toBe(2)
    expect(initialProgress(1, 2).level).toBe(1) // 1-letter word starts at full
  })
})

describe('practiceBlanks', () => {
  it('is always the leading positions', () => {
    expect(practiceBlanks(3)).toEqual([0, 1, 2])
    expect(practiceBlanks(1)).toEqual([0])
  })
})

describe('nextProgress', () => {
  it('grows one leading blank per unhinted correct answer', () => {
    let p = initialProgress(5, 1)
    p = nextProgress(p, 5, true, 2)
    expect(p.level).toBe(2)
    p = nextProgress(p, 5, true, 2)
    expect(p.level).toBe(3)
  })

  it('masters only after target consecutive unhinted full-word answers', () => {
    let p = { level: 5, streak: 0, mastered: false }
    p = nextProgress(p, 5, true, 2)
    expect(p).toEqual({ level: 5, streak: 1, mastered: false })
    p = nextProgress(p, 5, true, 2)
    expect(p.mastered).toBe(true)
  })

  it('never grows beyond the word length', () => {
    const p = nextProgress({ level: 5, streak: 0, mastered: false }, 5, true, 3)
    expect(p.level).toBe(5)
  })

  it('hinted correct answers earn no progress', () => {
    const p = { level: 2, streak: 1, mastered: false }
    expect(nextProgress(p, 5, false, 2)).toEqual(p)
  })

  it('mastered words stay mastered', () => {
    const p = { level: 5, streak: 5, mastered: true }
    expect(nextProgress(p, 5, true, 2)).toEqual(p)
  })
})

describe('resetStreak', () => {
  it('keeps the level but clears the streak (gentle: no level loss)', () => {
    expect(resetStreak({ level: 3, streak: 2, mastered: false })).toEqual({
      level: 3,
      streak: 0,
      mastered: false,
    })
  })
})
