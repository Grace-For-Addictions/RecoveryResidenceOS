#!/usr/bin/env node
/**
 * Grace House release validators (Quality Gates 1, 2, 3, 8).
 *
 * 1. Curfew audit      — every canonical curfew value matches GH-CURFEW-001
 *                        v2.0 and nothing exceeds the midnight hard ceiling.
 * 2. Consistency audit — fees, contacts, and derived values (quiet hours,
 *                        visitor departure) are internally consistent.
 * 3. Certification-language audit — no unverified certification claims.
 * 4. Language audit    — no prohibited, stigmatizing terms in any source,
 *                        document, or migration.
 *
 * Fails the build (exit 1) on any violation.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const errors = []
const root = process.cwd()

// ---------------------------------------------------------------------------
// 1 + 2. Curfew + consistency audit against the locked GH-CURFEW-001 v2.0
// ---------------------------------------------------------------------------
const canonical = JSON.parse(readFileSync(join(root, 'src/policy/canonical.json'), 'utf8'))

const LOCKED_CURFEW = [
  { phase: 1, sunThu: '21:00', friSat: '22:00' },
  { phase: 2, sunThu: '22:00', friSat: '23:00' },
  { phase: 3, sunThu: '23:00', friSat: '00:00' },
]

for (const locked of LOCKED_CURFEW) {
  const actual = canonical.curfew.phases.find((p) => p.phase === locked.phase)
  if (!actual) {
    errors.push(`Curfew: phase ${locked.phase} missing from canonical.json`)
    continue
  }
  for (const key of ['sunThu', 'friSat']) {
    if (actual[key] !== locked[key]) {
      errors.push(
        `Curfew: phase ${locked.phase} ${key} is ${actual[key]}, locked value is ${locked[key]} (GH-CURFEW-001 v2.0)`,
      )
    }
  }
}
for (const p of canonical.curfew.phases) {
  for (const key of ['sunThu', 'friSat']) {
    const t = p[key]
    // midnight ceiling: valid values are 20:00–23:59 or exactly 00:00
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t) || (t !== '00:00' && t < '20:00')) {
      errors.push(`Curfew: phase ${p.phase} ${key}=${t} exceeds the midnight hard ceiling`)
    }
  }
}
if (canonical.curfew.hardCeiling !== '00:00')
  errors.push('Curfew: hardCeiling must be 00:00 (midnight)')
if (canonical.curfew.quietHoursEnd !== '07:00')
  errors.push('Quiet hours must end at 07:00 (GH-CURFEW-001)')

const fees = canonical.fees
if (fees.doubleSharedRoom.weekly !== 175 || fees.doubleSharedRoom.monthlyPrepaidInFull !== 650)
  errors.push('Fees: double/shared room must be $175/week, $650/month prepaid (GH-FEES-001 v1.0)')
if (fees.singlePrivateRoom.weekly !== 200 || fees.singlePrivateRoom.monthlyPrepaidInFull !== 700)
  errors.push('Fees: single/private room must be $200/week, $700/month prepaid (GH-FEES-001 v1.0)')

const contact = canonical.contact
if (contact.officePhone !== '515-220-8771') errors.push('Contact: office phone drifted')
if (contact.email !== 'gracehouse@graceforaddictions.org') errors.push('Contact: email drifted')
if (!contact.residentsWarmline.includes('515-310')) errors.push('Contact: warmline drifted')
if (!contact.address.startsWith('1311 9th Street')) errors.push('Contact: address drifted')

if (canonical.visitor.minutesBeforeCurfew !== 30)
  errors.push('Visitors: departure must be 30 minutes before curfew (GH-VISITOR-001)')

// ---------------------------------------------------------------------------
// 3 + 4. Text audits over source, docs, and migrations
// ---------------------------------------------------------------------------
const SCAN_DIRS = ['src', 'docs', 'supabase']
const SCAN_EXT = new Set(['.ts', '.tsx', '.json', '.md', '.sql', '.html', '.css'])

/** Unverified certification claims — Grace House is PREPARING, never certified. */
const CERT_PATTERNS = [
  /\bis\s+(?:NARR\s+)?(?:Level\s+II\s+)?certified\b/i,
  /\bmaintains\s+NARR\b/i,
  /\bNARR[-\s]certified\b/i,
]

/** Prohibited stigmatizing terms (word-boundary; 'addictions' in the org name never matches). */
const LANGUAGE_PATTERNS = [
  [/\brelapse[sd]?\b/i, 'relapse (use "return to use")'],
  [/\baddicts?\b/i, 'addict (use person-first language)'],
  [/\bclean\s+time\b/i, 'clean time'],
  [/\bdirty\s+(?:test|screen|ua)\b/i, 'dirty test/screen'],
  [/\boffenders?\b/i, 'offender'],
  [/\btenants?\b/i, 'tenant (use participant/resident)'],
]

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) yield* walk(full)
    else if (SCAN_EXT.has(extname(name))) yield full
  }
}

for (const dir of SCAN_DIRS) {
  let entries
  try {
    entries = [...walk(join(root, dir))]
  } catch {
    continue
  }
  for (const file of entries) {
    const text = readFileSync(file, 'utf8')
    const lines = text.split('\n')
    lines.forEach((line, i) => {
      // lines that state the prohibition itself are allowed to name the terms
      if (/prohibited|never\s+["']|stigmatizing|LANGUAGE_PATTERNS|use\s+person-first/i.test(line))
        return
      for (const pattern of CERT_PATTERNS) {
        if (pattern.test(line))
          errors.push(`Certification claim: ${file.replace(root + '/', '')}:${i + 1} — "${line.trim().slice(0, 90)}"`)
      }
      for (const [pattern, label] of LANGUAGE_PATTERNS) {
        if (pattern.test(line))
          errors.push(`Prohibited term (${label}): ${file.replace(root + '/', '')}:${i + 1} — "${line.trim().slice(0, 90)}"`)
      }
    })
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
if (errors.length > 0) {
  console.error(`\n✗ Grace House validation FAILED (${errors.length} issue${errors.length > 1 ? 's' : ''}):\n`)
  for (const e of errors) console.error('  - ' + e)
  console.error('')
  process.exit(1)
}
console.log('✓ Curfew audit passed (GH-CURFEW-001 v2.0, midnight ceiling intact)')
console.log('✓ Consistency audit passed (fees, contacts, derived values)')
console.log('✓ Certification-language audit passed (no unverified claims)')
console.log('✓ Language audit passed (no prohibited terms)')
