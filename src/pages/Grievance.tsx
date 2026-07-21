import { useState, type FormEvent } from 'react'
import { residenceDb, myParticipantId } from '../lib/supabase'

/**
 * Grievance submission with the anti-retaliation notice front and center.
 * Anonymous submission is supported (resident_id null).
 */
export function Grievance() {
  const [category, setCategory] = useState('house_operations')
  const [description, setDescription] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (!residenceDb) {
      setMessage('Not connected — please try again when you are signed in.')
      return
    }
    const { data: residence } = await residenceDb
      .from('residences')
      .select('id')
      .eq('name', 'Grace House')
      .single()
    if (!residence) {
      setMessage('Could not find the residence record. Please ask a staff member for help.')
      return
    }
    const me = await myParticipantId()
    const { error } = await residenceDb.from('grievances').insert({
      residence_id: residence.id,
      resident_id: anonymous ? null : me,
      submitted_anonymously: anonymous,
      category,
      description,
    })
    setMessage(
      error
        ? `Your concern could not be submitted: ${error.message}`
        : 'Thank you. Your concern was received and will be acknowledged within 2 days and resolved within 14.',
    )
    if (!error) setDescription('')
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-emerald-950">Raise a concern</h1>
        <p className="mt-1 text-sm text-stone-600">
          Your voice matters here. Grievances are acknowledged within 2 days and resolved within 14.
        </p>
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>You will never face retaliation for raising a concern.</strong> Submitting a
          grievance can never affect your housing, phase, privileges, or standing in the community.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">
        <div>
          <label className="block text-sm font-medium" htmlFor="gr-category">
            What is this about?
          </label>
          <select
            id="gr-category"
            className="mt-1 w-full rounded-lg border border-stone-300 p-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="house_operations">House operations</option>
            <option value="staff_conduct">Staff conduct</option>
            <option value="peer_conflict">Peer conflict</option>
            <option value="safety">Safety</option>
            <option value="fees">Fees or payments</option>
            <option value="accommodation">Accommodation request</option>
            <option value="other">Something else</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="gr-description">
            Tell us what happened
          </label>
          <textarea
            id="gr-description"
            required
            rows={5}
            className="mt-1 w-full rounded-lg border border-stone-300 p-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
          Submit anonymously
        </label>
        <button
          type="submit"
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Submit
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
