import { useState, type FormEvent } from 'react'
import { residenceDb, myParticipantId } from '../lib/supabase'
import { CANONICAL } from '../policy/canonical'
import { useResidence } from '../context/ResidenceContext'

const REASONS = [
  ['work', 'Work'],
  ['medical', 'Medical'],
  ['treatment', 'Treatment'],
  ['court', 'Court'],
  ['recovery_activity', 'Recovery activity'],
  ['family', 'Family'],
  ['transportation', 'Transportation'],
  ['other', 'Other'],
] as const

/**
 * Pass and curfew-extension requests, wired to the policy engine
 * (GH-CURFEW-001: 24h notice for extensions, 48h + location + host for
 * overnight passes, eligibility after 60 days in good standing).
 */
export function Passes() {
  const { active } = useResidence()
  const [type, setType] = useState<'curfew_extension' | 'overnight_pass'>('curfew_extension')
  const [reason, setReason] = useState<string>('work')
  const [details, setDetails] = useState('')
  const [location, setLocation] = useState('')
  const [host, setHost] = useState('')
  const [date, setDate] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (!residenceDb) {
      setMessage('Not connected — please try again when you are signed in.')
      return
    }
    if (!active) {
      setMessage('Could not find the residence record. Please ask a staff member for help.')
      return
    }
    const me = await myParticipantId()
    const { error } = await residenceDb.from('pass_requests').insert({
      residence_id: active.id,
      resident_id: me,
      request_type: type,
      reason_category: reason,
      details,
      location: type === 'overnight_pass' ? location : null,
      host_name: type === 'overnight_pass' ? host : null,
      requested_for: date,
    })
    setMessage(
      error
        ? `The request could not be submitted: ${error.message}`
        : 'Your request was submitted. The House Manager will respond as soon as possible.',
    )
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-emerald-950">Passes &amp; curfew extensions</h1>
        <p className="mt-1 text-sm text-stone-600">
          Curfew extensions ask for {CANONICAL.curfew.extensionNoticeHours} hours notice. Overnight
          passes are available after {CANONICAL.curfew.overnightPass.eligibleAfterDays} days in good
          standing with {CANONICAL.curfew.overnightPass.noticeHours} hours notice, a location, and a
          host. Emergencies and transportation disruptions are never treated as misconduct — if
          something unexpected happens, just call the house.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">
        <div>
          <label className="block text-sm font-medium" htmlFor="pass-type">
            Request type
          </label>
          <select
            id="pass-type"
            className="mt-1 w-full rounded-lg border border-stone-300 p-2"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
          >
            <option value="curfew_extension">Curfew extension</option>
            <option value="overnight_pass">Overnight pass</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="pass-reason">
            Reason
          </label>
          <select
            id="pass-reason"
            className="mt-1 w-full rounded-lg border border-stone-300 p-2"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {REASONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="pass-date">
            Date
          </label>
          <input
            id="pass-date"
            type="date"
            required
            className="mt-1 w-full rounded-lg border border-stone-300 p-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        {type === 'overnight_pass' && (
          <>
            <div>
              <label className="block text-sm font-medium" htmlFor="pass-location">
                Where will you stay?
              </label>
              <input
                id="pass-location"
                required
                className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="pass-host">
                Who is your host?
              </label>
              <input
                id="pass-host"
                required
                className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                value={host}
                onChange={(e) => setHost(e.target.value)}
              />
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-medium" htmlFor="pass-details">
            Anything else we should know?
          </label>
          <textarea
            id="pass-details"
            className="mt-1 w-full rounded-lg border border-stone-300 p-2"
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Submit request
        </button>
        {message && (
          <p role="status" className="text-sm text-stone-700">
            {message}
          </p>
        )}
      </form>
    </div>
  )
}
