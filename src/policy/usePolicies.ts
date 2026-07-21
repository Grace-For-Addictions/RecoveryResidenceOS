import { useEffect, useState } from 'react'
import { residenceDb } from '../lib/supabase'
import { CANONICAL } from './canonical'

export type ActivePolicy = {
  code: string
  title: string
  version: string
  values: Record<string, unknown>
  prose: string | null
}

/**
 * Loads ACTIVE policy versions from the policy engine.
 * Falls back to the canonical mirror when offline/unauthenticated, and
 * reports which source is in use so screens can label it honestly.
 */
export function useActivePolicies(): {
  policies: Record<string, ActivePolicy>
  source: 'live' | 'canonical-mirror'
  loading: boolean
} {
  const [policies, setPolicies] = useState<Record<string, ActivePolicy>>({})
  const [source, setSource] = useState<'live' | 'canonical-mirror'>('canonical-mirror')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!residenceDb) {
        setLoading(false)
        return
      }
      const { data, error } = await residenceDb
        .from('policy_versions')
        .select('version, structured_values, prose, policies(code, title)')
        .eq('status', 'active')
      if (cancelled) return
      if (!error && data && data.length > 0) {
        const byCode: Record<string, ActivePolicy> = {}
        for (const row of data as unknown as Array<{
          version: string
          structured_values: Record<string, unknown>
          prose: string | null
          policies: { code: string; title: string }
        }>) {
          byCode[row.policies.code] = {
            code: row.policies.code,
            title: row.policies.title,
            version: row.version,
            values: row.structured_values,
            prose: row.prose,
          }
        }
        setPolicies(byCode)
        setSource('live')
      }
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { policies, source, loading }
}

export { CANONICAL }
