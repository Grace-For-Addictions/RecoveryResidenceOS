import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Null when env vars are absent (e.g. static preview); screens fall back to canonical values. */
export const supabase = url && key ? createClient(url, key) : null

/** Residence-schema client: gfa_residence is exposed through PostgREST. */
export const residenceDb = supabase ? supabase.schema('gfa_residence') : null

/** The signed-in user's participant identity (gfa_ui.participant_profiles.id). */
export async function myParticipantId(): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase.schema('gfa_ui').rpc('my_participant_id')
  if (error) return null
  return (data as string | null) ?? null
}
