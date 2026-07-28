import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { residenceDb } from '../../lib/supabase'
import { toast } from '../../lib/toast'
import { useResidence } from '../../context/ResidenceContext'

const COMMITMENTS = [
  'MAT/MOUD-affirming',
  'Trauma-informed',
  'Multiple pathways',
  'NARR-aligned',
  'Faith-welcoming',
  'Pet-friendly',
  'Reentry-supportive',
]

/**
 * Residence-creation wizard (admin/operator). Creates provider + residence +
 * beds-as-data + public profile. Curfew and other binding rules are NOT set
 * here — they are authored in the policy engine so values can never fork.
 */
export function NewResidence() {
  const navigate = useNavigate()
  const { reload, setActiveId } = useResidence()
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)

  const [org, setOrg] = useState('')
  const [orgType, setOrgType] = useState('501(c)(3) Nonprofit')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [pop, setPop] = useState('Women')
  const [beds, setBeds] = useState(8)
  const [sharedFee, setSharedFee] = useState(175)
  const [privateFee, setPrivateFee] = useState(200)
  const [level, setLevel] = useState('Level II — Peer-Supported')
  const [city, setCity] = useState('Des Moines')
  const [picked, setPicked] = useState<string[]>(COMMITMENTS.slice(0, 3))

  function togglePick(c: string) {
    setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))
  }

  async function finish(e: FormEvent) {
    e.preventDefault()
    if (!residenceDb) {
      toast('Not connected — sign in first.')
      return
    }
    setBusy(true)
    try {
      let providerId: string | null = null
      const { data: existing } = await residenceDb
        .from('providers')
        .select('id')
        .eq('name', org)
        .maybeSingle()
      if (existing) providerId = existing.id
      else {
        const { data: created, error } = await residenceDb
          .from('providers')
          .insert({ name: org, entity_type: orgType, contact_phone: phone, contact_email: email })
          .select('id')
          .single()
        if (error) throw error
        providerId = created.id
      }

      const { data: res, error: resErr } = await residenceDb
        .from('residences')
        .insert({
          provider_id: providerId,
          name,
          city,
          state: 'Iowa',
          population_served: pop,
          narr_level: level,
          narr_cert_status: 'pending',
          shared_room_fee: sharedFee,
          private_room_fee: privateFee,
          contact_phone: phone,
          contact_email: email,
          public_listed: true,
          active: true,
        })
        .select('id')
        .single()
      if (resErr) throw resErr

      const bedRows = Array.from({ length: beds }, (_, i) => ({
        residence_id: res.id,
        label: `Bed ${i + 1}`,
        room_type: 'shared',
        status: 'available',
      }))
      const { error: bedErr } = await residenceDb.from('beds').insert(bedRows)
      if (bedErr) throw bedErr

      await residenceDb
        .from('public_profiles')
        .insert({ residence_id: res.id, offerings: picked })

      await reload()
      setActiveId(res.id)
      toast(`${name} created — welcome to the platform`)
      navigate('/staff')
    } catch (err) {
      toast(`Could not create the residence: ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5 py-4">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-gold' : 'bg-mist'}`}
          />
        ))}
      </div>

      {step === 0 && (
        <div className="card space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-pine">Your organization</h1>
            <p className="text-sm text-sage">
              The business or nonprofit operating this residence.
            </p>
          </div>
          <div>
            <label className="field-label" htmlFor="nr-org">Organization name *</label>
            <input id="nr-org" className="field-input" value={org} onChange={(e) => setOrg(e.target.value)} placeholder="e.g., Grace For Addictions" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="nr-orgtype">Org type</label>
              <select id="nr-orgtype" className="field-input" value={orgType} onChange={(e) => setOrgType(e.target.value)}>
                {['501(c)(3) Nonprofit', 'LLC / Private Operator', 'Faith-Based Organization', 'Government / County', 'Other'].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="nr-phone">Contact phone</label>
              <input id="nr-phone" className="field-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="nr-email">Contact email</label>
            <input id="nr-email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <button
              className="btn-pine"
              onClick={() => (org.trim() ? setStep(1) : toast('Organization name is required'))}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-pine">The residence</h1>
            <p className="text-sm text-sage">Each profile manages one house. Add more later.</p>
          </div>
          <div>
            <label className="field-label" htmlFor="nr-name">Residence name *</label>
            <input id="nr-name" className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="nr-pop">Population served</label>
              <select id="nr-pop" className="field-input" value={pop} onChange={(e) => setPop(e.target.value)}>
                {['Women', 'Men', 'All genders', 'Women & children', 'Veterans', 'Young adults (18–25)'].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="nr-beds">Bed count *</label>
              <input id="nr-beds" className="field-input" type="number" min={1} max={60} value={beds} onChange={(e) => setBeds(+e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="nr-sfee">Shared room fee ($/wk)</label>
              <input id="nr-sfee" className="field-input" type="number" min={0} value={sharedFee} onChange={(e) => setSharedFee(+e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="nr-pfee">Private room fee ($/wk)</label>
              <input id="nr-pfee" className="field-input" type="number" min={0} value={privateFee} onChange={(e) => setPrivateFee(+e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="nr-level">Level of support</label>
              <select id="nr-level" className="field-input" value={level} onChange={(e) => setLevel(e.target.value)}>
                {['Level I — Peer-Run', 'Level II — Peer-Supported', 'Level III — Supervised', 'Level IV — Service Provider'].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="nr-city">City</label>
              <input id="nr-city" className="field-input" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-between">
            <button className="btn-line" onClick={() => setStep(0)}>← Back</button>
            <button
              className="btn-pine"
              onClick={() => (name.trim() && beds > 0 ? setStep(2) : toast('Residence name and bed count required'))}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={finish} className="card space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-pine">House commitments</h1>
            <p className="text-sm text-sage">
              These display to residents and referral partners. Binding rules like curfew are
              authored in the policy engine after creation, so values can never drift apart.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {COMMITMENTS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => togglePick(c)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  picked.includes(c)
                    ? 'border-pine bg-pine text-cream'
                    : 'border-stone-300 bg-white text-sage'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <p className="rounded-lg bg-gold-soft p-3 text-xs text-[#8a6a0d]">
            Certification status starts as "pending" and can only ever change by recording an
            external certification decision — never by checking a box.
          </p>
          <div className="flex justify-between">
            <button type="button" className="btn-line" onClick={() => setStep(1)}>← Back</button>
            <button type="submit" className="btn-gold" disabled={busy}>
              {busy ? 'Creating…' : 'Launch residence ✓'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
