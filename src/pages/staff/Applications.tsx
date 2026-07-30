import { useCallback, useEffect, useState } from 'react'
import { residenceDb } from '../../lib/supabase'
import { toast } from '../../lib/toast'
import { useResidence } from '../../context/ResidenceContext'

type Application = {
  id: string
  full_name: string
  preferred_name: string | null
  phone: string
  email: string | null
  pathway: string | null
  living_situation: string | null
  referral_source: string | null
  moud_prescribed: boolean | null
  why_now: string | null
  status: string
  created_at: string
}

const NEXT: Record<string, Array<[string, string]>> = {
  submitted: [['contacted', 'Mark contacted'], ['withdrawn', 'Withdrawn']],
  contacted: [['interview', 'Interview scheduled'], ['waitlisted', 'Waitlist'], ['referred', 'Referred elsewhere'], ['withdrawn', 'Withdrawn']],
  interview: [['admitted', 'Admit'], ['waitlisted', 'Waitlist'], ['referred', 'Referred elsewhere'], ['withdrawn', 'Withdrawn']],
  waitlisted: [['interview', 'Interview scheduled'], ['admitted', 'Admit'], ['withdrawn', 'Withdrawn']],
}

const STATUS_TAG: Record<string, string> = {
  submitted: 'tag-warn', contacted: 'tag-gold', interview: 'tag-clay',
  waitlisted: 'tag-pine', admitted: 'tag-ok', referred: 'tag-pine', withdrawn: 'tag-bad',
}

/**
 * Online application queue. The 2-business-day contact commitment made on the
 * public site is tracked here — new submissions surface first.
 */
export function Applications() {
  const { active } = useResidence()
  const [rows, setRows] = useState<Application[]>([])
  const [open, setOpen] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!residenceDb || !active) return
    const { data } = await residenceDb
      .from('applications')
      .select('id, full_name, preferred_name, phone, email, pathway, living_situation, referral_source, moud_prescribed, why_now, status, created_at')
      .eq('residence_id', active.id)
      .order('created_at', { ascending: false })
    setRows((data as Application[] | null) ?? [])
  }, [active])

  useEffect(() => {
    void load()
  }, [load])

  async function setStatus(id: string, status: string) {
    if (!residenceDb) return
    const { error } = await residenceDb.from('applications').update({ status }).eq('id', id)
    toast(error ? `Update failed: ${error.message}` : `Application marked ${status}`)
    void load()
  }

  const fresh = rows.filter((r) => r.status === 'submitted').length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-pine">Applications</h1>
        <p className="text-sm text-sage">
          {fresh > 0
            ? `${fresh} new submission${fresh > 1 ? 's' : ''} awaiting first contact — our public commitment is contact within 2 business days.`
            : 'Online applications land here the moment they are submitted.'}
        </p>
      </div>
      {rows.length === 0 ? (
        <div className="card py-10 text-center text-sage">No applications yet.</div>
      ) : (
        <ul className="space-y-3">
          {rows.map((a) => (
            <li key={a.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold">{a.preferred_name || a.full_name}</span>
                  <span className="ml-2 text-xs text-sage">
                    applied {new Date(a.created_at).toLocaleDateString()} · {a.phone}
                    {a.email ? ` · ${a.email}` : ''}
                  </span>
                </div>
                <span className={STATUS_TAG[a.status] ?? 'tag-pine'}>{a.status}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                {a.pathway && <span className="tag-pine">{a.pathway} pathway</span>}
                {a.living_situation && <span className="tag-gold">{a.living_situation}</span>}
                {a.moud_prescribed && <span className="tag-ok">MAT/MOUD — fully supported</span>}
                {a.referral_source && <span className="tag-pine">{a.referral_source}</span>}
              </div>
              {open === a.id && a.why_now && (
                <p className="mt-3 rounded-lg bg-[#fafbf8] p-3 text-sm leading-relaxed">
                  <b className="text-sage">Why Grace House, why now:</b> {a.why_now}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="btn-line !px-2.5 !py-1 !text-xs" onClick={() => setOpen(open === a.id ? null : a.id)}>
                  {open === a.id ? 'Hide details' : 'Details'}
                </button>
                {(NEXT[a.status] ?? []).map(([status, labelText]) => (
                  <button key={status} className="btn-pine !px-2.5 !py-1 !text-xs" onClick={() => setStatus(a.id, status)}>
                    {labelText}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
