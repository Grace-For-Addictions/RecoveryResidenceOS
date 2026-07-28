import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, residenceDb } from '../../lib/supabase'
import { toast } from '../../lib/toast'
import { useResidence } from '../../context/ResidenceContext'
import { Announcements } from './Announcements'

type Alert = {
  sev: 'high' | 'med' | 'low'
  icon: string
  text: string
  sub: string
  checkinId?: string
}

/**
 * Staff dashboard: stats from live data, an attention queue (flagged
 * check-ins, pending passes, open grievances), and the house board.
 * Everything is scoped by RLS to residences the signed-in user operates.
 */
export function Dashboard() {
  const { active } = useResidence()
  const [stats, setStats] = useState({ occupied: 0, total: 0, available: 0, waitlist: 0, week: 0 })
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!residenceDb || !supabase || !active) {
      setLoading(false)
      return
    }
    const rid = active.id
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10)
    const [beds, waitlist, fees, passes, grievances] = await Promise.all([
      residenceDb.from('beds').select('id, status, resident_id').eq('residence_id', rid),
      residenceDb.from('waitlist').select('id').eq('residence_id', rid).eq('status', 'pending'),
      residenceDb
        .from('fee_ledger')
        .select('amount, entry_type, paid_date')
        .eq('residence_id', rid)
        .eq('entry_type', 'payment')
        .gte('paid_date', weekAgo),
      residenceDb
        .from('pass_requests')
        .select('id, request_type, requested_for')
        .eq('residence_id', rid)
        .eq('status', 'pending'),
      residenceDb
        .from('grievances')
        .select('id, category, status, resolution_due')
        .eq('residence_id', rid)
        .neq('status', 'resolved'),
    ])

    const bedRows = beds.data ?? []
    const residentIds = bedRows.map((b) => b.resident_id).filter(Boolean) as string[]

    const next: Alert[] = []
    if (residentIds.length > 0) {
      // flagged check-ins for residents of this house, minus those already followed up
      const [checkins, followups] = await Promise.all([
        supabase
          .schema('gfa_ui')
          .from('check_in_records')
          .select('id, participant_id, date, mood, safety_flag, note')
          .in('participant_id', residentIds)
          .eq('safety_flag', true)
          .order('date', { ascending: false })
          .limit(20),
        residenceDb.from('checkin_followups').select('checkin_id').eq('residence_id', rid),
      ])
      const done = new Set((followups.data ?? []).map((f) => f.checkin_id))
      for (const c of checkins.data ?? []) {
        if (done.has(c.id)) continue
        next.push({
          sev: 'high',
          icon: '🚨',
          text: `A resident flagged a check-in${c.mood ? ` (mood ${c.mood}/5)` : ''} and may want support`,
          sub: c.date ?? '',
          checkinId: c.id,
        })
      }
    }
    for (const p of passes.data ?? []) {
      next.push({
        sev: 'med',
        icon: '🎒',
        text: `${p.request_type === 'overnight_pass' ? 'Overnight pass' : 'Curfew extension'} awaiting review`,
        sub: `for ${p.requested_for}`,
      })
    }
    for (const g of grievances.data ?? []) {
      next.push({
        sev: 'low',
        icon: '🕊',
        text: `Open grievance: ${g.category ?? 'uncategorized'}`,
        sub: `resolution due ${g.resolution_due}`,
      })
    }

    setStats({
      occupied: bedRows.filter((b) => b.status === 'occupied').length,
      total: bedRows.length,
      available: bedRows.filter((b) => b.status === 'available').length,
      waitlist: (waitlist.data ?? []).length,
      week: (fees.data ?? []).reduce((s, f) => s + Number(f.amount), 0),
    })
    setAlerts(next)
    setLoading(false)
  }, [active])

  useEffect(() => {
    void load()
  }, [load])

  async function followUp(checkinId: string) {
    if (!residenceDb || !active) return
    const { error } = await residenceDb
      .from('checkin_followups')
      .insert({ checkin_id: checkinId, residence_id: active.id })
    toast(error ? `Could not log follow-up: ${error.message}` : 'Follow-up logged — thank you for reaching out')
    void load()
  }

  if (!active) return <p className="text-sm text-sage">Loading residence…</p>

  const sevBg = { high: 'bg-bad-soft', med: 'bg-warn-soft', low: 'bg-mist' }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-pine">{active.name}</h1>
        <p className="text-sm text-sage">
          {active.population_served} · {active.narr_level ?? ''} ·{' '}
          {active.narr_cert_status === 'certified'
            ? 'NARR certification on file'
            : 'Preparing for NARR certification'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card border-t-4 border-t-pine">
          <div className="font-serif text-3xl font-bold text-pine">
            {stats.occupied}/{stats.total}
          </div>
          <div className="text-xs font-bold uppercase tracking-wide text-sage">Beds occupied</div>
        </div>
        <div className="card border-t-4 border-t-ok">
          <div className="font-serif text-3xl font-bold text-pine">{stats.available}</div>
          <div className="text-xs font-bold uppercase tracking-wide text-sage">Available now</div>
        </div>
        <div className="card border-t-4 border-t-gold">
          <div className="font-serif text-3xl font-bold text-pine">{stats.waitlist}</div>
          <div className="text-xs font-bold uppercase tracking-wide text-sage">On waitlist</div>
        </div>
        <div className="card border-t-4 border-t-clay">
          <div className="font-serif text-3xl font-bold text-pine">${stats.week.toLocaleString()}</div>
          <div className="text-xs font-bold uppercase tracking-wide text-sage">Fees · last 7 days</div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-pine">Attention needed</h3>
            <span className="text-xs font-bold uppercase text-sage">
              {alerts.length} item{alerts.length !== 1 ? 's' : ''}
            </span>
          </div>
          {loading ? (
            <p className="text-sm text-sage">Loading…</p>
          ) : alerts.length === 0 ? (
            <div className="py-8 text-center text-sage">
              <div className="text-2xl">🌿</div>
              <p className="mt-1 text-sm">All clear. The house is steady today.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-mist bg-[#fafbf8] p-3"
                >
                  <span className={`grid h-8 w-8 flex-none place-items-center rounded-lg ${sevBg[a.sev]}`}>
                    {a.icon}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm">{a.text}</span>
                    <span className="block text-xs text-sage">{a.sub}</span>
                  </span>
                  {a.checkinId && (
                    <button className="btn-line !px-3 !py-1.5 !text-xs" onClick={() => followUp(a.checkinId!)}>
                      Follow up
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/staff/passes" className="btn-line !px-3 !py-1.5 !text-xs">Pass queue</Link>
            <Link to="/staff/grievances" className="btn-line !px-3 !py-1.5 !text-xs">Grievances</Link>
            <Link to="/staff/waitlist" className="btn-line !px-3 !py-1.5 !text-xs">Waitlist</Link>
            <Link to="/staff/payments" className="btn-line !px-3 !py-1.5 !text-xs">Payments</Link>
            <Link to="/staff/beds" className="btn-line !px-3 !py-1.5 !text-xs">Beds</Link>
          </div>
        </div>
        <Announcements />
      </div>
    </div>
  )
}
