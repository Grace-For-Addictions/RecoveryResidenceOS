import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { residenceDb } from '../../lib/supabase'
import { toast } from '../../lib/toast'
import { useResidence } from '../../context/ResidenceContext'

type LedgerRow = {
  id: string
  resident_id: string
  entry_type: string
  amount: number
  description: string | null
  due_date: string | null
  paid_date: string | null
  method: string | null
  receipt_no: string | null
  created_at: string
}

const fmt$ = (n: number) => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 })

/**
 * Fee ledger view over gfa_residence.fee_ledger. Balances are computed
 * (charges − payments − scholarships + adjustments). Hardship provisions
 * apply: payment plans are arranged supportively, never punitively.
 */
export function Payments() {
  const { active } = useResidence()
  const [rows, setRows] = useState<LedgerRow[]>([])
  const [adding, setAdding] = useState(false)
  const [residentId, setResidentId] = useState('')
  const [residents, setResidents] = useState<string[]>([])
  const [amount, setAmount] = useState(0)
  const [entryType, setEntryType] = useState('payment')
  const [method, setMethod] = useState('cash')

  const load = useCallback(async () => {
    if (!residenceDb || !active) return
    const [ledger, beds] = await Promise.all([
      residenceDb.from('fee_ledger').select('*').eq('residence_id', active.id).order('created_at', { ascending: false }),
      residenceDb.from('beds').select('resident_id').eq('residence_id', active.id).not('resident_id', 'is', null),
    ])
    setRows((ledger.data as LedgerRow[] | null) ?? [])
    setResidents([...new Set(((beds.data ?? []) as { resident_id: string }[]).map((b) => b.resident_id))])
    setAmount(Number(active.shared_room_fee ?? 0))
  }, [active])

  useEffect(() => {
    void load()
  }, [load])

  const balances = new Map<string, number>()
  for (const r of rows) {
    const sign = r.entry_type === 'charge' ? 1 : r.entry_type === 'adjustment' ? 1 : -1
    balances.set(r.resident_id, (balances.get(r.resident_id) ?? 0) + sign * Number(r.amount))
  }
  const collected = rows.filter((r) => r.entry_type === 'payment').reduce((s, r) => s + Number(r.amount), 0)
  const outstanding = [...balances.values()].filter((v) => v > 0).reduce((s, v) => s + v, 0)

  async function record(e: FormEvent) {
    e.preventDefault()
    if (!residenceDb || !active || !residentId) return
    const { error } = await residenceDb.from('fee_ledger').insert({
      residence_id: active.id,
      resident_id: residentId,
      entry_type: entryType,
      amount,
      method: entryType === 'payment' ? method : null,
      paid_date: entryType === 'payment' ? new Date().toISOString().slice(0, 10) : null,
      due_date: entryType === 'charge' ? new Date().toISOString().slice(0, 10) : null,
      receipt_no: entryType === 'payment' ? `R-${Date.now().toString(36).toUpperCase()}` : null,
      description: entryType === 'payment' ? 'Program fee payment' : 'Program fee (GH-FEES-001)',
    })
    if (error) toast(`Could not record: ${error.message}`)
    else {
      toast(entryType === 'payment' ? 'Payment recorded — receipt generated' : 'Entry recorded')
      setAdding(false)
      void load()
    }
  }

  const short = (id: string) => id.slice(0, 8)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-pine">Payments</h1>
          <p className="text-sm text-sage">
            Fees per GH-FEES-001 · deposit/refund terms pending decision GH-D004
          </p>
        </div>
        <button className="btn-pine" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Close' : '＋ Record entry'}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card border-t-4 border-t-ok">
          <div className="font-serif text-2xl font-bold text-pine">{fmt$(collected)}</div>
          <div className="text-xs font-bold uppercase text-sage">Collected (all time)</div>
        </div>
        <div className="card border-t-4 border-t-clay">
          <div className="font-serif text-2xl font-bold text-pine">{fmt$(outstanding)}</div>
          <div className="text-xs font-bold uppercase text-sage">Outstanding balances</div>
        </div>
        <div className="card border-t-4 border-t-pine">
          <div className="font-serif text-2xl font-bold text-pine">{rows.length}</div>
          <div className="text-xs font-bold uppercase text-sage">Ledger entries</div>
        </div>
      </div>

      {adding && (
        <form onSubmit={record} className="card grid gap-3 sm:grid-cols-4">
          <div>
            <label className="field-label" htmlFor="pay-res">Resident</label>
            <select id="pay-res" className="field-input" value={residentId} onChange={(e) => setResidentId(e.target.value)}>
              <option value="">Select…</option>
              {residents.map((r) => (
                <option key={r} value={r}>Resident {short(r)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="pay-type">Type</label>
            <select id="pay-type" className="field-input" value={entryType} onChange={(e) => setEntryType(e.target.value)}>
              <option value="payment">Payment</option>
              <option value="charge">Charge</option>
              <option value="scholarship">Scholarship</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="pay-amt">Amount ($)</label>
            <input id="pay-amt" className="field-input" type="number" min={0} value={amount} onChange={(e) => setAmount(+e.target.value)} />
          </div>
          {entryType === 'payment' && (
            <div>
              <label className="field-label" htmlFor="pay-method">Method</label>
              <select id="pay-method" className="field-input" value={method} onChange={(e) => setMethod(e.target.value)}>
                {['cash', 'card', 'ACH', 'money order'].map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          )}
          <div className="sm:col-span-4">
            <button type="submit" className="btn-pine">Record ✓</button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="text-left text-xs font-bold uppercase tracking-wide text-sage">
              <th className="p-2">Date</th><th className="p-2">Resident</th><th className="p-2">Type</th>
              <th className="p-2">Method</th><th className="p-2">Amount</th><th className="p-2">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-sage">No ledger entries yet.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-mist">
                  <td className="p-2">{(r.paid_date ?? r.due_date ?? r.created_at).slice(0, 10)}</td>
                  <td className="p-2 font-semibold">Resident {short(r.resident_id)}</td>
                  <td className="p-2">
                    <span className={r.entry_type === 'payment' ? 'tag-ok' : r.entry_type === 'charge' ? 'tag-warn' : 'tag-pine'}>
                      {r.entry_type}
                    </span>
                  </td>
                  <td className="p-2">{r.method ?? '—'}</td>
                  <td className="p-2 font-semibold">{fmt$(Number(r.amount))}</td>
                  <td className="p-2 text-xs text-sage">{r.receipt_no ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-sage">
        Hardship provisions apply — payment plans are arranged supportively before fees fall
        overdue, never punitively. Names are not shown here; ledger rows reference resident IDs and
        resolve to names only where the viewer's role permits.
      </p>
    </div>
  )
}
