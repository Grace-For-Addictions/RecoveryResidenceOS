import { createClient } from '@supabase/supabase-js'

// Publishable defaults (safe to ship — these are public client credentials);
// VITE_SUPABASE_* env vars override them when set at build time.
const DEFAULT_URL = 'https://ykykeioydvtxpyreshhs.supabase.co'
const DEFAULT_ANON_KEY = 'sb_publishable_9NOklH5Dvj3PcQs2dCLdpg_zx4txe8a'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || DEFAULT_URL
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || DEFAULT_ANON_KEY

export const supabase = createClient(url, key)

/** Residence-schema client: gfa_residence is exposed through PostgREST. */
export const residenceDb = supabase.schema('gfa_residence')

/** The signed-in user's participant identity (gfa_ui.participant_profiles.id). */
export async function myParticipantId(): Promise<string | null> {
  const { data, error } = await supabase.schema('gfa_ui').rpc('my_participant_id')
  if (error) return null
  return (data as string | null) ?? null
}
