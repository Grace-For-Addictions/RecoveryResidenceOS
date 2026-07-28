import { useState, type FormEvent } from 'react'
import { supabase, myParticipantId } from '../lib/supabase'
import { toast } from '../lib/toast'

const MOODS = [
  ['😞', 'struggling'],
  ['😕', 'low'],
  ['😐', 'okay'],
  ['🙂', 'good'],
  ['😄', 'great'],
] as const

/**
 * Resident daily check-in — about 60 seconds, honesty is safe here.
 * Writes to gfa_ui.check_in_records (the existing check-in spine).
 * A hard day or a request to talk sets safety_flag, which routes to staff
 * for supportive follow-up — never for consequences.
 */
export function CheckIn() {
  const [mood, setMood] = useState(3)
  const [cravings, setCravings] = useState('no')
  const [wantsSupport, setWantsSupport] = useState(false)
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) {
      toast('Not connected — please try again when you are signed in.')
      return
    }
    const me = await myParticipantId()
    if (!me) {
      toast('We could not find your participant profile — ask a staff member for help.')
      return
    }
    const flagged = mood === 1 || wantsSupport
    const { error } = await supabase.schema('gfa_ui').from('check_in_records').insert({
      participant_id: me,
      date: new Date().toISOString().slice(0, 10),
      mood,
      mood_score: mood,
      mood_label: MOODS[mood - 1][1],
      note: note || null,
      safety_flag: flagged,
      check_in_method: 'residence_portal',
      form_data: { cravings, wants_support: wantsSupport },
    })
    if (error) toast(`Check-in could not be saved: ${error.message}`)
    else {
      setDone(true)
      toast(
        flagged
          ? 'Saved — someone from the house team will reach out to support you'
          : 'Saved — thanks for showing up today',
      )
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <div className="text-4xl">🌿</div>
        <h1 className="mt-3 text-2xl font-semibold text-pine">Thanks for checking in.</h1>
        <p className="mt-2 text-sm text-sage">
          Showing up for yourself counts, today and every day.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-pine">Daily check-in</h1>
        <p className="text-sm text-sage">Takes about 60 seconds. Honesty is safe here.</p>
      </div>
      <form onSubmit={submit} className="card space-y-5">
        <fieldset>
          <legend className="field-label">How are you today?</legend>
          <div className="flex gap-2">
            {MOODS.map(([emoji, label], i) => (
              <button
                type="button"
                key={label}
                onClick={() => setMood(i + 1)}
                aria-pressed={mood === i + 1}
                className={`flex-1 rounded-xl border-[1.5px] py-2.5 text-center text-xl transition-transform ${
                  mood === i + 1 ? 'scale-105 border-pine bg-mist' : 'border-stone-300 bg-white'
                }`}
              >
                {emoji}
                <span className="block text-[.6rem] font-bold uppercase tracking-wide text-sage">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="ci-cravings">Cravings today?</label>
            <select id="ci-cravings" className="field-input" value={cravings} onChange={(e) => setCravings(e.target.value)}>
              <option value="no">No</option>
              <option value="somewhat">Somewhat</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="ci-support">Want to talk to someone?</label>
            <select
              id="ci-support"
              className="field-input"
              value={wantsSupport ? 'yes' : 'no'}
              onChange={(e) => setWantsSupport(e.target.value === 'yes')}
            >
              <option value="no">Not today</option>
              <option value="yes">Yes, please</option>
            </select>
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="ci-note">Anything to add? (optional)</label>
          <textarea
            id="ci-note"
            className="field-input"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Gratitude, focus, what's on your mind…"
          />
        </div>
        <button type="submit" className="btn-pine">Submit ✓</button>
      </form>
    </div>
  )
}
