import { useCallback, useEffect, useState } from 'react'
import { residenceDb } from '../../lib/supabase'
import { toast } from '../../lib/toast'
import { useResidence } from '../../context/ResidenceContext'

type Grievance = {
  id: string
  submitted_anonymously: boolean
  category: string | null
  description: string
  status: string
  acknowledgment_due: string
  resolution_due: string
  created_at: string
}

/**
 * Grievance tracking with deadlines: acknowledge within 2 days, resolve
 * within 14. Anti-retaliation is structural, not aspirational.
 */
export function GrievanceQueue() {
  const { active } = useResidence()
  const [rows, setRows] = useState<Grievance[]>([])

  const load = useCallback(async () => {
    if (!residenceDb || !active) return
    const { data } = await residenceDb
      .from('grievances')
      .select('id, submitted_anonymously, category, description, status, acknowledgment_due, resolution_due, created_at')
      .eq('residence_id', active.id)
      .order('created_at', { ascending: false })
    setRows((data as Grievance[] | null) ?? [])
  }, [active])

  useEffect(() => {
    void load()
  }, [load])

  async function advance(g: Grievance) {
    if (!residenceDb) return
    const nextStatus =
      g.status === 'submitted' ? 'acknowledged'
      : g.status === 'acknowledged' ? 'in_review'
      : 'resolved'
    const patch: Record<string, unknown> = { status: nextStatus }
    if (nextStatus === 'acknowledged') patch.acknowledged_at = new Date().toISOString()
    if (nextStatus === 'resolved') {
      const summary = window.prompt('Resolution summary (shared with the resident):')
      if (!summary) return
      patch.resolved_at = new Date().toISOString()
      patch.resolution_summary = summary
    }
    const { error } = await residenceDb.from('grievances').update(patch).eq('id', g.id)
    toast(
      error ? `Update failed: ${error.message}`
      : nextStatus === 'acknowledged' ? 'Acknowledged — the resident has been heard'
      : nextStatus === 'in_review' ? 'Review opened — impartial look begins'
      : 'Resolved — written decision recorded',
    )
    void load()
  }

  const overdue = (d: string, status: string) => status !== 'resolved' && new Date(d) < new Date()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-pine">Grievances</h1>
        <p className="text-sm text-sage">
          Right to be heard · anonymous option honored · retaliation is never tolerated
        </p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <thead>
            <tr className="text-left text-xs font-bold uppercase tracking-wide text-sage">
              <th className="p-2">Filed</th><th className="p-2">From</th><th className="p-2">Category</th>
              <th className="p-2">Description</th><th className="p-2">Deadlines</th>
              <th className="p-2">Status</th><th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-sage">No grievances on file.</td></tr>
            ) : (
              rows.map((g) => (
                <tr key={g.id} className="border-t border-mist">
                  <td className="p-2">{new Date(g.created_at).toLocaleDateString()}</td>
                  <td className="p-2">{g.submitted_anonymously ? 'Anonymous' : 'Resident'}</td>
                  <td className="p-2"><span className="tag-pine">{g.category ?? 'other'}</span></td>
                  <td className="max-w-[18rem] p-2 text-xs">{g.description}</td>
                  <td className="p-2 text-xs">
                    <span className={overdue(g.acknowledgment_due, g.status) && g.status === 'submitted' ? 'text-bad font-bold' : ''}>
                      ack {g.acknowledgment_due}
                    </span>
                    <br />
                    <span className={overdue(g.resolution_due, g.status) ? 'text-bad font-bold' : ''}>
                      resolve {g.resolution_due}
                    </span>
                  </td>
                  <td className="p-2">
                    {g.status === 'resolved' ? <span className="tag-ok">resolved</span>
                      : g.status === 'in_review' ? <span className="tag-clay">in review</span>
                      : g.status === 'acknowledged' ? <span className="tag-gold">acknowledged</span>
                      : <span className="tag-warn">submitted</span>}
                  </td>
                  <td className="whitespace-nowrap p-2">
                    {g.status !== 'resolved' && (
                      <button className="btn-line !px-2.5 !py-1 !text-xs" onClick={() => advance(g)}>
                        {g.status === 'submitted' ? 'Acknowledge' : g.status === 'acknowledged' ? 'Begin review' : 'Resolve'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-sage">
        Timeline standard: acknowledge in 2 days · resolve in 14 · anonymous filings are
        investigated with the same care as named ones.
      </p>
    </div>
  )
}
