/**
 * Canonical Truth Register fallback values.
 *
 * The live source of truth is the policy engine
 * (gfa_residence.policies / policy_versions). This module mirrors the
 * seeded ACTIVE versions so screens render if the network is unavailable,
 * and so `npm run validate` can audit every binding value at build time.
 * Values here must match the ACTIVE policy versions — the validator fails
 * the build if the curfew table drifts or exceeds the midnight ceiling.
 */
import canonical from './canonical.json'

export type CurfewPhase = {
  phase: number
  days: string
  sunThu: string
  friSat: string
}

export const CANONICAL = canonical

/** Quiet hours are derived: they begin at the phase's curfew and end at 07:00. */
export function quietHours(phase: CurfewPhase): { sunThu: string; friSat: string; end: string } {
  return { sunThu: phase.sunThu, friSat: phase.friSat, end: canonical.curfew.quietHoursEnd }
}

/** Visitor departure is derived from curfew, never hand-copied: curfew minus N minutes. */
export function visitorDeparture(curfewTime: string): string {
  const minutes = canonical.visitor.minutesBeforeCurfew
  const [h, m] = curfewTime.split(':').map(Number)
  const total = (h * 60 + m - minutes + 24 * 60) % (24 * 60)
  const hh = String(Math.floor(total / 60)).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

/** Format 24h HH:MM as a friendly time; 00:00 renders as midnight. */
export function formatTime(t: string): string {
  if (t === '00:00') return '12:00 AM (midnight)'
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`
}
