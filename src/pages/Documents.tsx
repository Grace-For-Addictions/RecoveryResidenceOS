import { useEffect, useState } from 'react'
import { residenceDb, myParticipantId } from '../lib/supabase'

type SignatureRow = {
  document_code: string
  title: string
  version: string
  signed: boolean
  signed_at: string | null
}

/**
 * "What I signed": exactly the documents and versions this resident has
 * acknowledged, plus anything awaiting re-acknowledgment after a version
 * change. Content snapshots are immutable — what she signed is what she sees.
 */
export function Documents() {
  const [rows, setRows] = useState<SignatureRow[] | null>(null)

  useEffect(() => {
    async function load() {
      if (!residenceDb) {
        setRows([])
        return
      }
      const me = await myParticipantId()
      if (!me) {
        setRows([])
        return
      }
      const { data } = await residenceDb
        .from('gh_signature_status')
        .select('document_code, title, version, signed, signed_at')
        .eq('resident_id', me)
      setRows((data as SignatureRow[] | null) ?? [])
    }
    void load()
  }, [])

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold text-emerald-950">My documents</h1>
      <p className="text-sm text-stone-600">
        Everything you have signed, at the exact version you signed it. If a document changes, the
        new version appears here for a fresh review and signature — the old one is never edited.
      </p>
      {rows === null ? (
        <p className="text-sm text-stone-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-stone-500">
          No documents yet. Your onboarding packet will appear here once it is assigned.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={`${r.document_code}-${r.version}`}
              className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4"
            >
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-xs text-stone-500">
                  {r.document_code} · v{r.version}
                </p>
              </div>
              {r.signed ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-900">
                  Signed {r.signed_at ? new Date(r.signed_at).toLocaleDateString() : ''}
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
                  Awaiting your signature
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
