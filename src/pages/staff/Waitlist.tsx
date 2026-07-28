import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { residenceDb } from '../../lib/supabase'
import { toast } from '../../lib/toast'
import { useResidence } from '../../context/ResidenceContext'

type Entry = {
  id: string
  applicant_name: string | null
  preferred_name: string | null
  contact_phone: string | null
  referral_source: string | null
  priority: number | null
  status: string
  resident_id: string | null
  notes: string | null
  created_at: string
}

/** Waitlist queue — transparent order, human decisions, no opaque scoring. */
export function Waitlist() {
  const { active } = useResidence()
  const [rows, setRows] = useState<Entry[]>([])
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [priority, setPriority] = useState(3)
  const [notes, setNotes] = useState('')

  const load = useCallback(async () => {
    if (!residenceDb || !active) return
    const { data } = await residenceDb
      .from('waitlist')
      .select('*')
      .eq('residence_id', active.id)
      .not('status', 'in', '("declined","withdrawn")')
      .order('priority')
      .order('created_at')
    setRows((data as Entry[] | null) ?? [])
  }, [active])

  useEffect(() => {
    void load()
  }, [load])

  async function add(e: FormEvent) {
    e.preventDefault()
    if (!residenceDb || !active || !name.trim()) return
    const { error } = await residenceDb.from('waitlist').insert({
      residence_id: active.id,
      applicant_name: name.trim(),
      contact_phone: phone || null,
      priority,
      notes: notes || null,
    })
    if (error) toast(`Could not add: ${error.message}`)
    else {
      toast(`${name} added to the waitlist`)
      setName(''); setPhone(''); setNotes(''); setAdding(false)
      void load()
    }
  }

  async function setStatus(id: string, status: string, label: string) {
    if (!residenceDb) return
    const { error } = await residenceDb.from('waitlist').update({ status }).eq('id', id)
    toast(error ? `Update failed: ${error.message}` : label)
    void load()
  }

  async function admit(entry: Entry) {
    if (!residenceDb || !active) return
    if (!entry.resident_id) {
      // no linked participant identity yet — record the decision, flag the linkage step
      await setStatus(entry.id, 'admitted', 'Marked admitted — link a participant profile to assign a bed')
      return
    }
    const { data: bed } = await residenceDb
      .from('beds')
      .select('id, label')
      .eq('residence_id', active.id)
      .eq('status', 'available')
      .limit(1)
      .maybeSingle()
    if (!bed) {
      toast('No beds available — free one up first')
      return
    }
    const { error } = await residenceDb
      .from('beds')
      .update({ status: 'occupied', resident_id: entry.resident_id, occupied_since: new Date().toISOString().slice(0, 10) })
      .eq('id', bed.id)
    if (error) {
      toast(`Bed assignment failed: ${error.message}`)
      return
    }
    await setStatus(entry.id, 'admitted', `Admitted to ${bed.label} — welcome home`)
  }

  const prioTag = (p: number | null) =>
    p === 1 ? <span className="tag-bad">urgent</span> : p === 2 ? <span className="tag-clay">high</span> : <span className="tag-pine">standard</span>

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-pine">Waitlist</h1>
          <p className="text-sm text-sage">{rows.length} waiting · transparent queue</p>
        </div>
        <button className="btn-pine" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Close' : '＋ Add to waitlist'}
        </button>
      </div>

      {adding && (
        <form onSubmit={add} className="card grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="wl-name">Name *</label>
            <input id="wl-name" className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="wl-phone">Phone</label>
            <input id="wl-phone" className="field-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="wl-pri">Priority</label>
            <select id="wl-pri" className="field-input" value={priority} onChange={(e) => setPriority(+e.target.value)}>
              <option value={3}>Standard</option>
              <option value={2}>High</option>
              <option value={1}>Urgent</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="wl-notes">Notes</label>
            <input id="wl-notes" className="field-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Referral source, timing, needs…" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-pine">Add ✓</button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <thead>
            <tr className="text-left text-xs font-bold uppercase tracking-wide text-sage">
              <th className="p-2">#</th><th className="p-2">Name</th><th className="p-2">Phone</th>
              <th className="p-2">Added</th><th className="p-2">Priority</th><th className="p-2">Status</th>
              <th className="p-2">Notes</th><th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="p-6 text-center text-sage">Waitlist is empty.</td></tr>
            ) : (
              rows.map((w, i) => (
                <tr key={w.id} className="border-t border-mist">
                  <td className="p-2 font-bold">{i + 1}</td>
                  <td className="p-2 font-semibold">{w.preferred_name ?? w.applicant_name ?? '—'}</td>
                  <td className="p-2">{w.contact_phone ?? '—'}</td>
                  <td className="p-2">{new Date(w.created_at).toLocaleDateString()}</td>
                  <td className="p-2">{prioTag(w.priority)}</td>
                  <td className="p-2"><span className="tag-gold">{w.status}</span></td>
                  <td className="max-w-[16rem] p-2 text-xs text-sage">{w.notes}</td>
                  <td className="whitespace-nowrap p-2">
                    {w.status === 'pending' && (
                      <button className="btn-line !px-2.5 !py-1 !text-xs" onClick={() => setStatus(w.id, 'contacted', 'Marked contacted')}>
                        Contacted
                      </button>
                    )}{' '}
                    <button className="btn-pine !px-2.5 !py-1 !text-xs" onClick={() => admit(w)}>Admit</button>{' '}
                    <button className="btn-line !px-2.5 !py-1 !text-xs" onClick={() => setStatus(w.id, 'withdrawn', 'Removed from waitlist')}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
