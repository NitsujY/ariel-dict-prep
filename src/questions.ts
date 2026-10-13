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
 * Whack-a-mole letter buttons for one position: the needed letter plus
 * distractors drawn first from the word's other letters (challenge), then
 * the alphabet. Always includes word[pos].
 */
export function moleChoices(
  word: string,
  pos: number,
  rng: () => number = Math.random,
  size = 5,
): string[] {
  const needed = word[pos]
  // Word's own letters first (confusing on purpose), then the alphabet.
  const others = shuffle([...new Set(word.split('').filter((c, i) => i !== pos && c !== needed))], rng)
  const alpha = shuffle(ALPHA.filter((c) => c !== needed && !word.includes(c)), rng)
  const distractors = [...others, ...alpha].slice(0, Math.max(2, size - 1))
  return shuffle([needed, ...distractors], rng)
}

/**
 * Scatter letter-carrying moles into a fixed field of holes (3×3 = 9):
 * each letter lands in a distinct random hole, the rest stay empty.
 */
export function scatterMoles(
  letters: string[],
  holes = 9,
  rng: () => number = Math.random,
): (string | null)[] {
  const spots = shuffle(
    Array.from({ length: holes }, (_, i) => i),
    rng,
  ).slice(0, letters.length)
  const out: (string | null)[] = Array(holes).fill(null)
  shuffle(letters, rng).forEach((c, i) => {
    out[spots[i]] = c
  })
  return out
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
