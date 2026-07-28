import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { residenceDb } from '../../lib/supabase'
import { toast } from '../../lib/toast'
import { useResidence } from '../../context/ResidenceContext'

type Ann = {
  id: string
  author_role: string
  urgent: boolean
  body: string
  created_at: string
}

const ROLE_LABEL: Record<string, string> = {
  house_lead: 'House Lead',
  executive_director: 'Executive Director',
  staff: 'Staff',
}

/** House board: announcements visible to all residents of the house. */
export function Announcements() {
  const { active } = useResidence()
  const [items, setItems] = useState<Ann[]>([])
  const [composing, setComposing] = useState(false)
  const [body, setBody] = useState('')
  const [role, setRole] = useState('house_lead')
  const [urgent, setUrgent] = useState(false)

  const load = useCallback(async () => {
    if (!residenceDb || !active) return
    const { data } = await residenceDb
      .from('announcements')
      .select('id, author_role, urgent, body, created_at')
      .eq('residence_id', active.id)
      .order('created_at', { ascending: false })
      .limit(6)
    setItems((data as Ann[] | null) ?? [])
  }, [active])

  useEffect(() => {
    void load()
  }, [load])

  async function post(e: FormEvent) {
    e.preventDefault()
    if (!residenceDb || !active || !body.trim()) return
    const { error } = await residenceDb
      .from('announcements')
      .insert({ residence_id: active.id, author_role: role, urgent, body: body.trim() })
    if (error) toast(`Could not post: ${error.message}`)
    else {
      toast('Announcement posted')
      setBody('')
      setComposing(false)
      void load()
    }
  }

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-pine">House board</h3>
        <button className="btn-line !px-3 !py-1.5 !text-xs" onClick={() => setComposing((v) => !v)}>
          {composing ? 'Close' : '＋ Post'}
        </button>
      </div>
      {composing && (
        <form onSubmit={post} className="mb-4 space-y-2 rounded-xl border border-mist p-3">
          <div className="flex gap-2">
            <select className="field-input" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Post as">
              <option value="house_lead">House Lead</option>
              <option value="executive_director">Executive Director</option>
              <option value="staff">Staff</option>
            </select>
            <label className="flex items-center gap-1.5 whitespace-nowrap text-sm">
              <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
              Urgent
            </label>
          </div>
          <textarea
            className="field-input"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="House meeting Thursday 7 PM…"
            aria-label="Announcement message"
          />
          <button type="submit" className="btn-pine !px-3 !py-1.5 !text-xs">Post ✓</button>
        </form>
      )}
      {items.length === 0 ? (
        <p className="py-5 text-center text-sm text-sage">Nothing posted yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((a) => (
            <li
              key={a.id}
              className={`rounded-r-xl border-l-[3px] p-3 ${
                a.urgent ? 'border-clay bg-[#fcf3ef]' : 'border-gold bg-[#fdfbf5]'
              }`}
            >
              <div className="text-xs font-semibold text-sage">
                {ROLE_LABEL[a.author_role] ?? a.author_role} ·{' '}
                {new Date(a.created_at).toLocaleDateString()}
                {a.urgent ? ' · URGENT' : ''}
              </div>
              <div className="mt-0.5 text-sm">{a.body}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
