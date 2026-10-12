// Pure question-generation logic — no React, no DOM, fully testable.

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Unique options for Listen & Find: always includes the target, distractors from the same list. */
export function buildOptions(
  target: string,
  pool: string[],
  count: number,
  rng: () => number = Math.random,
): string[] {
  const others = shuffle(
    pool.filter((w) => w.toLowerCase() !== target.toLowerCase()),
    rng,
  )
  return shuffle([target, ...others.slice(0, Math.max(0, count - 1))], rng)
}

const ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('')

/**
 * Letter buttons for Missing Letters.
 * With choices enabled: the needed letters (with multiplicity, so "happy"
 * blanks [2,3] yield two "p" buttons) plus a few distractors, shuffled.
 * Otherwise: full alphabet, extended with any needed letter outside a–z
 * (e.g. a capitalised first letter).
 */
export function missingChoices(
  word: string,
  blanks: number[],
  choicesEnabled: boolean,
  rng: () => number = Math.random,
  size = 5,
): string[] {
  const needed = blanks.map((p) => word[p])
  if (!choicesEnabled) {
    const alpha = [...ALPHA]
    for (const c of needed) if (!alpha.includes(c)) alpha.push(c)
    return alpha
  }
  const distractors = shuffle(
    ALPHA.filter((c) => !needed.includes(c)),
    rng,
  ).slice(0, Math.max(2, size - needed.length))
  return shuffle([...needed, ...distractors], rng)
}

/**
 * Fix the Word: the displayed string differs from the target at exactly
 * one position, and never spells the target. Capitalisation is preserved.
 */
export function fixQuestion(
  word: string,
  rng: () => number = Math.random,
): { wrongIndex: number; display: string } {
  const i = Math.floor(rng() * word.length)
  const candidates = ALPHA.filter((c) => c !== word[i].toLowerCase())
  const wrong = candidates[Math.floor(rng() * candidates.length)]
  const replaced = word[i] === word[i].toUpperCase() ? wrong.toUpperCase() : wrong
  return { wrongIndex: i, display: word.slice(0, i) + replaced + word.slice(i + 1) }
}
