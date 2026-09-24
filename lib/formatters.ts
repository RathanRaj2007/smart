/**
 * Utility functions for formatting display values across reports,
 * admin pages, and interview details.
 */

export function formatInterviewerName(user?: {
  username?: string | null
  email?: string | null
  candidate?: { name?: string | null } | null
} | null): string {
  if (!user) return 'System'
  if (user.candidate?.name) return user.candidate.name

  const raw = user.username || user.email || ''
  if (!raw) return 'System'

  if (raw === 'superadmin') return 'Super Admin'
  if (raw === 'admin') return 'Admin'

  if (raw.includes('@')) {
    const handle = raw.split('@')[0]
    // If handle starts with letters followed by digits (e.g., "akhil99878"), extract clean name "Akhil"
    const match = handle.match(/^([a-zA-Z]{2,})\d*$/)
    if (match && match[1]) {
      const clean = match[1]
      return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase()
    }
    return handle.charAt(0).toUpperCase() + handle.slice(1)
  }

  // Capitalize regular username
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined || typeof score !== 'number' || !isFinite(score)) {
    return 'N/A'
  }
  return `${(Math.round(score * 10) / 10).toFixed(1)}%`
}
