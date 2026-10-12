// Practice-record summaries. Deliberately no "mastery" score and no timing metrics.
import type { Attempt, AttemptCategory } from './types'

export interface CategorySummary {
  total: number
  correct: number
  skipped: number
  hints: number
}

export function summarize(records: Attempt[]): Record<AttemptCategory, CategorySummary> {
  const empty = (): CategorySummary => ({ total: 0, correct: 0, skipped: 0, hints: 0 })
  const out: Record<AttemptCategory, CategorySummary> = {
    listening: empty(),
    hinted: empty(),
    unhinted: empty(),
  }
  for (const r of records) {
    const c = out[r.category] ?? (out[r.category] = empty())
    c.total++
    if (r.correct) c.correct++
    if (r.skipped) c.skipped++
    if (r.usedHint) c.hints++
  }
  return out
}
