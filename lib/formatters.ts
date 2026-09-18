/**
 * Utility functions for score formatting across the application.
 * All scores are on a 0–100 scale.
 */

/**
 * Formats a raw 0–100 score value into a clean percentage string.
 * Examples:
 *   47.7 -> "47.7%"
 *   90   -> "90%"
 *   10   -> "10%"
 *   null / undefined / NaN / Infinity -> "—"
 */
export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined || typeof score !== 'number' || !isFinite(score)) {
    return '—'
  }
  const rounded = Math.round(score * 10) / 10
  return `${rounded}%`
}
