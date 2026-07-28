import { useCallback, useEffect, useState } from 'react'
import { residenceDb } from '../../lib/supabase'
import { toast } from '../../lib/toast'
import { useResidence } from '../../context/ResidenceContext'

type Bed = {
  id: string
  label: string | null
  room_type: string | null
  status: string
  resident_id: string | null
  occupied_since: string | null
}

const CYCLE: Record<string, string> = { available: 'reserved', reserved: 'cleaning', cleaning: 'offline', offline: 'available' }

/**
 * Beds as data (GH-D003: capacity is what the bed table says, never a prose
 * claim). Occupied beds are managed through admission/discharge, not here.
 */
export function Beds() {
  const { active } = useResidence()
  const [beds, setBeds] = useState<Bed[]>([])

  const load = useCallback(async () => {
    if (!residenceDb || !active) return
    const { data } = await residenceDb
      .from('beds')
      .select('id, label, room_type, status, resident_id, occupied_since')
      .eq('residence_id', active.id)
      .order('label')
    setBeds((data as Bed[] | null) ?? [])
  }, [active])

  useEffect(() => {
    void load()
  }, [load])

  async function cycle(bed: Bed) {
    if (!residenceDb) return
    if (bed.status === 'occupied') {
      toast('Occupied — manage through admission and discharge, not the bed grid')
      return
    }
    const next = CYCLE[bed.status] ?? 'available'
    const { error } = await residenceDb.from('beds').update({ status: next }).eq('id', bed.id)
    toast(error ? `Update failed: ${error.message}` : `${bed.label ?? 'Bed'} → ${next}`)
    void load()
  }

  async function addBed() {
    if (!residenceDb || !active) return
    const { error } = await residenceDb.from('beds').insert({
      residence_id: active.id,
      label: `Bed ${beds.length + 1}`,
      room_type: 'shared',
      status: 'available',
    })
    toast(error ? `Could not add bed: ${error.message}` : 'Bed added')
    void load()
  }

  const border: Record<string, string> = {
    occupied: 'border-pine/40 bg-gradient-to-b from-white to-[#f2f6f1]',
    available: 'border-ok/40 bg-gradient-to-b from-white to-[#eff7f1]',
    reserved: 'border-gold/50',
    cleaning: 'border-sky-300',
    offline: 'border-bad/30 opacity-75',
  }
  const tag: Record<string, string> = {
    occupied: 'tag-pine', available: 'tag-ok', reserved: 'tag-gold', cleaning: 'tag-pine', offline: 'tag-bad',
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-pine">Beds</h1>
          <p className="text-sm text-sage">Tap a bed to change its status (except occupied)</p>
        </div>
        <button className="btn-pine" onClick={addBed}>＋ Add bed</button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {beds.map((b) => (
          <button
            key={b.id}
            onClick={() => cycle(b)}
            className={`rounded-xl border-[1.5px] bg-white p-4 text-left transition-transform hover:-translate-y-0.5 ${border[b.status] ?? 'border-mist'}`}
          >
            <div className="font-serif text-lg font-bold text-pine">{b.label}</div>
            <div className="mt-0.5 min-h-[1.1em] text-xs text-sage">
              {b.resident_id ? `Occupied since ${b.occupied_since ?? ''}` : b.room_type}
            </div>
            <span className={`${tag[b.status] ?? 'tag-pine'} mt-2`}>{b.status}</span>
          </button>
        ))}
      </div>
      {beds.length === 0 && (
        <p className="py-6 text-center text-sm text-sage">
          No bed records visible — bed data requires a signed-in staff role for this residence.
        </p>
      )}
      <p className="text-xs text-sage">
        Statuses cycle: available → reserved → cleaning → offline → available. Bed configuration
        for Grace House is pending verification (decision GH-D003).
      </p>
    </div>
  )
}
