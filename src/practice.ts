// Pure practice-mode progression: blanks grow from the start of the word,
// mastery = consecutive unhinted full-word correct answers. Fully testable.
import type { PracticeProgress } from './types'

export function initialProgress(wordLen: number, startBlanks: number): PracticeProgress {
  return { level: Math.min(Math.max(1, startBlanks), Math.max(1, wordLen)), streak: 0, mastered: false }
}

/**
 * After a correct answer. Unhinted: grow the leading-blank level by one
 * (up to the full word); at full word, build the mastery streak.
 * Hinted: counts as done for the moment but earns no progress.
 */
export function nextProgress(
  p: PracticeProgress,
  wordLen: number,
  unhinted: boolean,
  masteryTarget: number,
): PracticeProgress {
  if (p.mastered || !unhinted) return p
  if (p.level < wordLen) return { level: p.level + 1, streak: p.streak + 1, mastered: false }
  const streak = p.streak + 1
  return { level: p.level, streak, mastered: streak >= masteryTarget }
}

/** After a wrong answer: no level loss, only the streak resets. Gentle by design. */
export function resetStreak(p: PracticeProgress): PracticeProgress {
  return { ...p, streak: 0 }
}

/** Leading-blank positions for a level: always [0..level-1]. */
export function practiceBlanks(level: number): number[] {
  return Array.from({ length: level }, (_, i) => i)
}
