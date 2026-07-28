import { useCallback, useEffect, useState } from 'react'
import { residenceDb } from '../../lib/supabase'
import { toast } from '../../lib/toast'
import { useResidence } from '../../context/ResidenceContext'

type Pass = {
  id: string
  request_type: string
  reason_category: string | null
  details: string | null
  location: string | null
  host_name: string | null
  requested_for: string
  expected_return: string | null
  status: string
}

/**
 * Pass & leave approval queue. Values (notice windows, eligibility) come from
 * GH-CURFEW-001. Denials always carry an explanation.
 */
export function PassQueue() {
  const { active } = useResidence()
  const [rows, setRows] = useState<Pass[]>([])

  const load = useCallback(async () => {
    if (!residenceDb || !active) return
    const { data } = await residenceDb
      .from('pass_requests')
      .select('*')
      .eq('residence_id', active.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setRows((data as Pass[] | null) ?? [])
  }, [active])

  useEffect(() => {
    void load()
  }, [load])

  async function decide(id: string, status: 'approved' | 'denied') {
    if (!residenceDb) return
    let note: string | null = null
    if (status === 'denied') {
      note = window.prompt('A denial always includes an explanation for the resident:')
      if (!note) return
    }
    const { error } = await residenceDb
      .from('pass_requests')
      .update({ status, decided_at: new Date().toISOString(), decision_note: note })
      .eq('id', id)
    toast(
      error
        ? `Decision failed: ${error.message}`
        : status === 'approved'
          ? 'Approved — bed held, check-in expectations apply'
          : 'Denied with explanation logged',
    )
    void load()
  }

  const statusTag = (s: string) =>
    s === 'pending' ? <span className="tag-gold">pending</span>
    : s === 'approved' ? <span className="tag-ok">approved</span>
    : s === 'denied' ? <span className="tag-bad">denied</span>
    : <span className="tag-pine">{s}</span>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-pine">Passes &amp; leave</h1>
        <p className="text-sm text-sage">
          Curfew extensions and overnight passes · notice windows per GH-CURFEW-001 · emergencies
          are never treated as misconduct
        </p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[42rem] text-sm">
          <thead>
            <tr className="text-left text-xs font-bold uppercase tracking-wide text-sage">
              <th className="p-2">Type</th><th className="p-2">Reason</th><th className="p-2">Date</th>
              <th className="p-2">Location / host</th><th className="p-2">Detail</th>
              <th className="p-2">Status</th><th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-sage">No requests yet.</td></tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="border-t border-mist">
                  <td className="p-2 font-semibold">
                    {p.request_type === 'overnight_pass' ? 'Overnight pass' : 'Curfew extension'}
                  </td>
                  <td className="p-2">{p.reason_category ?? '—'}</td>
                  <td className="p-2">{p.requested_for}</td>
                  <td className="p-2 text-xs">{p.location ? `${p.location} · ${p.host_name}` : '—'}</td>
                  <td className="max-w-[14rem] p-2 text-xs text-sage">{p.details}</td>
                  <td className="p-2">{statusTag(p.status)}</td>
                  <td className="whitespace-nowrap p-2">
                    {p.status === 'pending' && (
                      <>
                        <button className="btn-pine !px-2.5 !py-1 !text-xs" onClick={() => decide(p.id, 'approved')}>
                          Approve
                        </button>{' '}
                        <button className="btn-line !px-2.5 !py-1 !text-xs" onClick={() => decide(p.id, 'denied')}>
                          Deny
                        </button>
                      </>
                    )}
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
