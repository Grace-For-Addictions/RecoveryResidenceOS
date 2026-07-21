import { useEffect, useState } from 'react'
import { residenceDb } from '../lib/supabase'

type Bed = { id: string; label: string; room_type: string; status: string }
type PassRequest = {
  id: string
  request_type: string
  reason_category: string | null
  requested_for: string
  status: string
}
type GrievanceRow = { id: string; category: string | null; status: string; resolution_due: string }

/**
 * Staff view: beds as data (GH-D003 — no capacity claims in prose),
 * the pass approval queue, and grievance deadlines. Visibility is enforced
 * by RLS — this screen only ever sees what the signed-in role is allowed to.
 */
export function StaffDashboard() {
  const [beds, setBeds] = useState<Bed[] | null>(null)
  const [passes, setPasses] = useState<PassRequest[] | null>(null)
  const [grievances, setGrievances] = useState<GrievanceRow[] | null>(null)

  useEffect(() => {
    async function load() {
      if (!residenceDb) {
        setBeds([])
        setPasses([])
        setGrievances([])
        return
      }
      const [b, p, g] = await Promise.all([
        residenceDb.from('beds').select('id, label, room_type, status').order('label'),
        residenceDb
          .from('pass_requests')
          .select('id, request_type, reason_category, requested_for, status')
          .eq('status', 'pending'),
        residenceDb
          .from('grievances')
          .select('id, category, status, resolution_due')
          .not('status', 'in', '("resolved")'),
      ])
      setBeds((b.data as Bed[] | null) ?? [])
      setPasses((p.data as PassRequest[] | null) ?? [])
      setGrievances((g.data as GrievanceRow[] | null) ?? [])
    }
    void load()
  }, [])

  const statusColor: Record<string, string> = {
    available: 'bg-emerald-100 text-emerald-900',
    occupied: 'bg-stone-200 text-stone-700',
    reserved: 'bg-amber-100 text-amber-900',
    cleaning: 'bg-sky-100 text-sky-900',
    offline: 'bg-stone-100 text-stone-400',
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-emerald-950">House operations</h1>

      <section aria-labelledby="beds-heading">
        <h2 id="beds-heading" className="text-lg font-semibold">
          Beds
        </h2>
        {beds === null ? (
          <p className="text-sm text-stone-500">Loading…</p>
        ) : beds.length === 0 ? (
          <p className="text-sm text-stone-500">
            No bed records visible. Bed data requires a signed-in staff role.
          </p>
        ) : (
          <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {beds.map((bed) => (
              <li key={bed.id} className="rounded-xl border border-stone-200 bg-white p-3">
                <p className="text-sm font-medium">{bed.label}</p>
                <p className="mt-1 flex items-center gap-2 text-xs">
                  <span className="text-stone-500">{bed.room_type}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${statusColor[bed.status] ?? ''}`}
                  >
                    {bed.status}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="passes-heading">
        <h2 id="passes-heading" className="text-lg font-semibold">
          Pending pass requests
        </h2>
        {passes === null ? (
          <p className="text-sm text-stone-500">Loading…</p>
        ) : passes.length === 0 ? (
          <p className="text-sm text-stone-500">Nothing waiting for a decision.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {passes.map((p) => (
              <li key={p.id} className="rounded-xl border border-stone-200 bg-white p-3 text-sm">
                {p.request_type === 'overnight_pass' ? 'Overnight pass' : 'Curfew extension'} ·{' '}
                {p.reason_category ?? 'no reason given'} · for {p.requested_for}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="grievances-heading">
        <h2 id="grievances-heading" className="text-lg font-semibold">
          Open grievances
        </h2>
        {grievances === null ? (
          <p className="text-sm text-stone-500">Loading…</p>
        ) : grievances.length === 0 ? (
          <p className="text-sm text-stone-500">No open grievances.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {grievances.map((g) => (
              <li key={g.id} className="rounded-xl border border-stone-200 bg-white p-3 text-sm">
                {g.category ?? 'uncategorized'} · {g.status} · resolution due {g.resolution_due}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
