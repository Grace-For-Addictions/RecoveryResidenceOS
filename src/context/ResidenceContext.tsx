import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { residenceDb } from '../lib/supabase'

export type Residence = {
  id: string
  name: string
  city: string | null
  population_served: string | null
  narr_level: string | null
  narr_cert_status: string
  shared_room_fee: number | null
  private_room_fee: number | null
  contact_phone: string | null
  warmline: string | null
  contact_email: string | null
}

type Ctx = {
  residences: Residence[]
  active: Residence | null
  setActiveId: (id: string) => void
  reload: () => Promise<void>
}

const ResidenceContext = createContext<Ctx>({
  residences: [],
  active: null,
  setActiveId: () => {},
  reload: async () => {},
})

const STORAGE_KEY = 'rros.activeResidenceId'

export function ResidenceProvider({ children }: { children: ReactNode }) {
  const [residences, setResidences] = useState<Residence[]>([])
  const [activeId, setActiveIdState] = useState<string | null>(
    localStorage.getItem(STORAGE_KEY),
  )

  async function reload() {
    if (!residenceDb) return
    const { data } = await residenceDb
      .from('residences')
      .select(
        'id, name, city, population_served, narr_level, narr_cert_status, shared_room_fee, private_room_fee, contact_phone, warmline, contact_email',
      )
      .eq('active', true)
      .order('name')
    if (data) setResidences(data as Residence[])
  }

  useEffect(() => {
    void reload()
  }, [])

  function setActiveId(id: string) {
    setActiveIdState(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  const active =
    residences.find((r) => r.id === activeId) ??
    residences.find((r) => r.name === 'Grace House') ??
    residences[0] ??
    null

  return (
    <ResidenceContext.Provider value={{ residences, active, setActiveId, reload }}>
      {children}
    </ResidenceContext.Provider>
  )
}

export function useResidence() {
  return useContext(ResidenceContext)
}
