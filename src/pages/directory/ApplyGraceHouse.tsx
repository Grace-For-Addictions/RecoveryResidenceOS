import { useState } from 'react'
import { Link } from 'react-router-dom'
import { residenceDb } from '../../lib/supabase'
import { CANONICAL } from '../../policy/canonical'

const STEPS = ['About You', 'Eligibility', 'Recovery & Support', 'Safety', 'Your Goals', 'Review & Sign']

type Form = {
  full_name: string; preferred_name: string; date_of_birth: string; phone: string; email: string
  living_situation: string; referral_source: string
  pathway: '' | 'recovery' | 'family'; family_relationship: string
  substances: string; last_use: string; in_treatment: string; provider: string
  moud: string; prescriber: string
  medical_needs: string; safety_history: string; accommodations: string
  why_now: string; six_month_goals: string
  signature: string; certified: boolean
}

const EMPTY: Form = {
  full_name: '', preferred_name: '', date_of_birth: '', phone: '', email: '',
  living_situation: '', referral_source: '', pathway: '', family_relationship: '',
  substances: '', last_use: '', in_treatment: '', provider: '', moud: '', prescriber: '',
  medical_needs: '', safety_history: '', accommodations: '', why_now: '', six_month_goals: '',
  signature: '', certified: false,
}

const label = 'mb-1 block text-xs font-bold uppercase tracking-wide text-[#8e4585]'
const input = 'w-full rounded-lg border-[1.5px] border-[#e4dce8] bg-white p-2.5 text-sm focus:border-[#5b2c6f] focus:outline-none focus:ring-2 focus:ring-[#5b2c6f]/15'
const cardCls = 'rounded-2xl border border-[#e4dce8] bg-white p-6 shadow-sm'

/**
 * Grace House online application. Submissions are written directly to
 * gfa_residence.applications (insert-only for the public; readable only by
 * Grace House staff under RLS). Nothing is submitted until Review & Sign.
 */
export function ApplyGraceHouse() {
  const [step, setStep] = useState(0)
  const [f, setF] = useState<Form>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const set = (k: keyof Form, v: string | boolean) => setF((p) => ({ ...p, [k]: v }))

  function validate(s: number): string | null {
    if (s === 0 && (!f.full_name.trim() || !f.date_of_birth || !f.phone.trim() || !f.living_situation))
      return 'Please complete the required fields: name, date of birth, phone, and living situation.'
    if (s === 1 && !f.pathway) return 'Please choose the eligibility pathway that fits your story.'
    if (s === 4 && !f.why_now.trim()) return 'Please share a few words about why Grace House, and why now.'
    if (s === 5) {
      if (!f.certified) return 'Please check the certification box to continue.'
      if (!f.signature.trim()) return 'Please type your full name as your electronic signature.'
    }
    return null
  }

  function next(n: number) {
    if (n > step) {
      const e = validate(step)
      if (e) { setError(e); return }
    }
    setError(null)
    setStep(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit() {
    const e = validate(5)
    if (e) { setError(e); return }
    if (!residenceDb) { setError('Not connected right now — please try again, or call 515-220-8771.'); return }
    setBusy(true)
    const { data: residence } = await residenceDb.from('residences').select('id').eq('name', 'Grace House').single()
    if (!residence) {
      setBusy(false)
      setError('We could not reach the application system — please call 515-220-8771 or email gracehouse@graceforaddictions.org.')
      return
    }
    const { error: err } = await residenceDb.from('applications').insert({
      residence_id: residence.id,
      full_name: f.full_name.trim(),
      preferred_name: f.preferred_name || null,
      date_of_birth: f.date_of_birth || null,
      phone: f.phone.trim(),
      email: f.email || null,
      living_situation: f.living_situation || null,
      referral_source: f.referral_source || null,
      pathway: f.pathway || null,
      family_relationship: f.pathway === 'family' ? f.family_relationship || null : null,
      substances: f.substances || null,
      last_use: f.last_use || null,
      in_treatment: f.in_treatment || null,
      provider: f.provider || null,
      moud_prescribed: f.moud === '' ? null : f.moud === 'Yes',
      prescriber: f.moud === 'Yes' ? f.prescriber || null : null,
      medical_needs: f.medical_needs || null,
      safety_history: f.safety_history || null,
      accommodations: f.accommodations || null,
      why_now: f.why_now.trim(),
      six_month_goals: f.six_month_goals || null,
      signature_name: f.signature.trim(),
      certified: true,
    })
    setBusy(false)
    if (err) setError(`Your application could not be submitted (${err.message}). Please call 515-220-8771 — we will take it by phone.`)
    else { setDone(true); window.scrollTo({ top: 0 }) }
  }

  const review: Array<[string, string]> = [
    ['Full legal name', f.full_name], ['Preferred name', f.preferred_name],
    ['Date of birth', f.date_of_birth], ['Phone', f.phone], ['Email', f.email],
    ['Living situation', f.living_situation], ['Referral source', f.referral_source],
    ['Eligibility pathway', f.pathway === 'family' ? `Family — ${f.family_relationship || 'relationship not specified'}` : f.pathway ? 'Recovery' : ''],
    ['Substances used', f.substances], ['Last use (approx.)', f.last_use],
    ['In treatment/counseling', f.in_treatment], ['Provider', f.provider],
    ['MAT/MOUD prescribed', f.moud], ['Prescriber', f.prescriber],
    ['Immediate medical needs', f.medical_needs], ['Household safety history', f.safety_history],
    ['Accommodations', f.accommodations], ['Why Grace House, why now', f.why_now],
    ['Six-month picture', f.six_month_goals],
  ]

  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#2a2230]">
      <div className="bg-gradient-to-br from-[#3e1d4c] to-[#5b2c6f] py-9 text-white">
        <div className="mx-auto max-w-3xl px-5">
          <Link to="/residences/grace-house" className="text-sm font-bold text-white/70 hover:text-[#d4a017]">
            ← Grace House / Online Application
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-semibold">Grace House Online Application</h1>
          <p className="mt-2 leading-relaxed text-white/85">
            Takes about 10–15 minutes. Your answers are confidential and reviewed only by Grace
            House staff. There are no wrong answers here — honesty helps us welcome you well.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 pb-14">
        {done ? (
          <div className={`${cardCls} mt-8 py-12 text-center`}>
            <div className="text-4xl">🕊️</div>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-[#5b2c6f]">Your application is on its way</h2>
            <p className="mx-auto mt-3 max-w-lg leading-relaxed">
              Thank you for trusting us with your story. A member of the Grace House team will
              contact you within <b>2 business days</b>. If a bed isn't immediately available,
              we'll offer you a place on our waitlist and stay in touch at least every two weeks.
            </p>
            <p className="mt-5 text-sm text-[#7a6e82]">
              Need to reach us sooner? {CANONICAL.contact.officePhone} · {CANONICAL.contact.email}
              <br />
              If you're in crisis right now, call or text 988.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-xl border border-[#e2c9de] bg-[#f3e6f1] p-4 text-sm text-[#3e1d4c]">
              <b className="text-[#8e4585]">You can pause anytime.</b> Nothing is submitted until
              you review and sign at the final step.
            </div>

            <div className="mt-5 flex flex-wrap gap-1.5" aria-label="Application progress">
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={`flex-1 rounded-lg border-[1.5px] px-1 py-2 text-center text-[.68rem] font-bold ${
                    i === step ? 'border-[#5b2c6f] bg-[#5b2c6f] text-white'
                    : i < step ? 'border-[#8e4585] bg-[#f3e6f1] text-[#8e4585]'
                    : 'border-[#e4dce8] bg-white text-[#7a6e82]'
                  }`}
                  style={{ minWidth: 96 }}
                >
                  <span className={`block font-serif text-sm ${i === step ? 'text-[#d4a017]' : 'text-[#8e4585]'}`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {s}
                </div>
              ))}
            </div>

            {error && (
              <div role="alert" className="mt-4 rounded-lg bg-[#f8e2dd] p-3 text-sm font-bold text-[#b3402e]">
                {error}
              </div>
            )}

            <div className={`${cardCls} mt-4`}>
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="font-serif text-xl font-semibold text-[#5b2c6f]">Part A — About You</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label className={label} htmlFor="ap-name">Full legal name *</label><input id="ap-name" className={input} value={f.full_name} onChange={(e) => set('full_name', e.target.value)} /></div>
                    <div><label className={label} htmlFor="ap-pref">Preferred name</label><input id="ap-pref" className={input} value={f.preferred_name} onChange={(e) => set('preferred_name', e.target.value)} placeholder="What should we call you?" /></div>
                    <div><label className={label} htmlFor="ap-dob">Date of birth *</label><input id="ap-dob" type="date" className={input} value={f.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} /></div>
                    <div><label className={label} htmlFor="ap-phone">Phone *</label><input id="ap-phone" type="tel" className={input} value={f.phone} onChange={(e) => set('phone', e.target.value)} /></div>
                  </div>
                  <div><label className={label} htmlFor="ap-email">Email</label><input id="ap-email" type="email" className={input} value={f.email} onChange={(e) => set('email', e.target.value)} /></div>
                  <div>
                    <label className={label} htmlFor="ap-living">Current living situation *</label>
                    <select id="ap-living" className={input} value={f.living_situation} onChange={(e) => set('living_situation', e.target.value)}>
                      <option value="">Select…</option>
                      {['Own / rent', 'Staying with family or friends', 'Shelter', 'Treatment facility', 'Correctional facility', 'Unhoused', 'Other'].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={label} htmlFor="ap-ref">How did you hear about Grace House?</label>
                    <select id="ap-ref" className={input} value={f.referral_source} onChange={(e) => set('referral_source', e.target.value)}>
                      <option value="">Select…</option>
                      {['Treatment provider', 'Friend / person in recovery', 'Court / probation / parole', '211', 'Website / social media', 'Other'].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-3">
                  <h2 className="font-serif text-xl font-semibold text-[#5b2c6f]">Part B — Eligibility Pathway</h2>
                  <p className="text-sm leading-relaxed">Grace House serves adult women through two pathways. Choose the one that fits your story — both carry the same dignity and the same community membership.</p>
                  {([
                    ['recovery', 'Recovery pathway', "I have a personal history of substance use or misuse, and I'm committed to living substance-free while in residence."],
                    ['family', 'Family pathway', "I have a parent, partner, or child with a history of substance use disorder or mental-health-related trauma, and structured recovery-supportive housing supports our family's healing."],
                  ] as const).map(([v, t, d]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => set('pathway', v)}
                      className={`flex w-full items-start gap-3 rounded-xl border-[1.5px] p-4 text-left ${f.pathway === v ? 'border-[#5b2c6f] bg-[#f3e6f1] ring-2 ring-[#5b2c6f]/15' : 'border-[#e4dce8] bg-white hover:border-[#8e4585]'}`}
                      aria-pressed={f.pathway === v}
                    >
                      <span className={`mt-1 h-4 w-4 flex-none rounded-full border-2 ${f.pathway === v ? 'border-[#5b2c6f] bg-[#5b2c6f]' : 'border-[#e4dce8]'}`} />
                      <span><b className="text-[#5b2c6f]">{t}</b><br /><span className="text-sm leading-relaxed">{d}</span></span>
                    </button>
                  ))}
                  {f.pathway === 'family' && (
                    <div>
                      <label className={label} htmlFor="ap-famrel">Your relationship (family pathway)</label>
                      <select id="ap-famrel" className={input} value={f.family_relationship} onChange={(e) => set('family_relationship', e.target.value)}>
                        <option value="">Select…</option>
                        {['Parent with SUD/MH-trauma history', 'Partner with SUD/MH-trauma history', 'Child with SUD/MH-trauma history'].map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="font-serif text-xl font-semibold text-[#5b2c6f]">Part C — Recovery &amp; Support</h2>
                  <p className="text-sm text-[#7a6e82]">If you chose the family pathway, answer what applies and skip the rest.</p>
                  <div><label className={label} htmlFor="ap-subs">Substances used (past or present)</label><input id="ap-subs" className={input} value={f.substances} onChange={(e) => set('substances', e.target.value)} placeholder="You can list generally — e.g., alcohol, opioids" /></div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label className={label} htmlFor="ap-last">Approximate date of last use</label><input id="ap-last" className={input} value={f.last_use} onChange={(e) => set('last_use', e.target.value)} placeholder="e.g., March 2026, or 'over a year'" /></div>
                    <div>
                      <label className={label} htmlFor="ap-tx">Connected to treatment or counseling?</label>
                      <select id="ap-tx" className={input} value={f.in_treatment} onChange={(e) => set('in_treatment', e.target.value)}>
                        <option value="">Select…</option><option>Yes</option><option>No</option><option>Starting soon</option>
                      </select>
                    </div>
                  </div>
                  <div><label className={label} htmlFor="ap-provider">Provider (your choice of provider is always honored)</label><input id="ap-provider" className={input} value={f.provider} onChange={(e) => set('provider', e.target.value)} placeholder="Optional" /></div>
                  <div>
                    <label className={label} htmlFor="ap-moud">Currently prescribed MAT/MOUD (methadone, buprenorphine/Suboxone, naltrexone/Vivitrol, etc.)?</label>
                    <select id="ap-moud" className={input} value={f.moud} onChange={(e) => set('moud', e.target.value)}>
                      <option value="">Select…</option><option>Yes</option><option>No</option>
                    </select>
                  </div>
                  {f.moud === 'Yes' && (
                    <div>
                      <label className={label} htmlFor="ap-prescriber">Prescriber</label>
                      <input id="ap-prescriber" className={input} value={f.prescriber} onChange={(e) => set('prescriber', e.target.value)} placeholder="Clinic or prescriber name" />
                      <p className="mt-2 rounded-r-lg border-l-[3px] border-[#8e4585] bg-[#f3e6f1] p-2.5 text-sm text-[#3e1d4c]">
                        MAT/MOUD is fully supported at Grace House and is never a barrier to admission.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="font-serif text-xl font-semibold text-[#5b2c6f]">Part D — Safety Screening</h2>
                  <p className="text-sm text-[#7a6e82]">These questions protect a shared household. A "yes" does not automatically disqualify you — context matters, and we'll talk it through together.</p>
                  <div><label className={label} htmlFor="ap-med">Any current medical needs requiring immediate attention?</label><textarea id="ap-med" rows={2} className={input} value={f.medical_needs} onChange={(e) => set('medical_needs', e.target.value)} placeholder="Optional — briefly describe, or leave blank for none" /></div>
                  <div><label className={label} htmlFor="ap-safe">Any history that could affect the safety of a shared household (e.g., recent violence)?</label><textarea id="ap-safe" rows={2} className={input} value={f.safety_history} onChange={(e) => set('safety_history', e.target.value)} placeholder="Optional — share what you're comfortable with" /></div>
                  <div><label className={label} htmlFor="ap-accom">Any accommodations that would help you live well here (disability, mobility, dietary, other)?</label><input id="ap-accom" className={input} value={f.accommodations} onChange={(e) => set('accommodations', e.target.value)} placeholder="Optional" /></div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="font-serif text-xl font-semibold text-[#5b2c6f]">Part E — Your Goals</h2>
                  <div><label className={label} htmlFor="ap-why">In your own words — why Grace House, and why now? *</label><textarea id="ap-why" rows={5} className={input} value={f.why_now} onChange={(e) => set('why_now', e.target.value)} placeholder="There's no wrong answer. Tell us your story the way you'd tell a friend." /></div>
                  <div><label className={label} htmlFor="ap-goals">What would the next six months look like if things went well for you?</label><textarea id="ap-goals" rows={3} className={input} value={f.six_month_goals} onChange={(e) => set('six_month_goals', e.target.value)} placeholder="Optional — work, family, health, recovery, anything." /></div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <h2 className="font-serif text-xl font-semibold text-[#5b2c6f]">Part F — Review &amp; Sign</h2>
                  <div className="rounded-xl border border-[#e4dce8] bg-[#faf7f2] p-4">
                    {review.filter(([, v]) => v && v.trim()).map(([k, v]) => (
                      <div key={k} className="flex gap-3 border-b border-dashed border-[#e4dce8] py-1.5 text-sm last:border-0">
                        <span className="w-48 flex-none font-bold text-[#8e4585]">{k}</span>
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>
                  <label className="flex items-start gap-3 rounded-xl border-[1.5px] border-[#e4dce8] bg-white p-4 text-sm leading-relaxed">
                    <input type="checkbox" className="mt-1" checked={f.certified} onChange={(e) => set('certified', e.target.checked)} />
                    <span>I certify the information above is true to the best of my knowledge. I understand Grace House may be able to serve me now, place me on a waitlist, or refer me to a better-fit resource, and that all decisions comply with the Fair Housing Act.</span>
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label className={label} htmlFor="ap-sig">Electronic signature (type your full name) *</label><input id="ap-sig" className={input} value={f.signature} onChange={(e) => set('signature', e.target.value)} placeholder="Your full name" /></div>
                    <div><label className={label}>Date</label><input className={input} value={new Date().toLocaleDateString()} readOnly /></div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-between">
                {step > 0 ? (
                  <button className="rounded-xl border-[1.5px] border-[#5b2c6f] px-5 py-2.5 text-sm font-bold text-[#5b2c6f] hover:bg-[#efe8f3]" onClick={() => next(step - 1)}>
                    ← Back
                  </button>
                ) : <span />}
                {step < 5 ? (
                  <button className="rounded-xl bg-[#5b2c6f] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#3e1d4c]" onClick={() => next(step + 1)}>
                    Continue →
                  </button>
                ) : (
                  <button className="rounded-xl bg-[#d4a017] px-5 py-2.5 text-sm font-bold text-[#3e2a05] hover:bg-[#e3b02e]" onClick={submit} disabled={busy}>
                    {busy ? 'Submitting…' : 'Submit Application ✓'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
