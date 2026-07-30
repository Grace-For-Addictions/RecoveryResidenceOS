import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { IOWA_DIR, type Listing } from '../../directory/iowa'

/**
 * Public directory home — the site's front door. Free, searchable listing of
 * recovery residences (starting with Iowa). GFA residences link to their full
 * in-app profile + online application; external listings open a details card.
 */
export function DirectoryHome() {
  const [q, setQ] = useState('')
  const [county, setCounty] = useState('')
  const [pop, setPop] = useState('')
  const [detail, setDetail] = useState<Listing | null>(null)

  const counties = useMemo(() => [...new Set(IOWA_DIR.map((r) => r.county))].sort(), [])
  const rows = IOWA_DIR.filter(
    (r) =>
      (!county || r.county === county) &&
      (!pop || r.pop === pop) &&
      (!q || `${r.n} ${r.org} ${r.city} ${r.county}`.toLowerCase().includes(q.toLowerCase())),
  )

  return (
    <div className="min-h-screen bg-[#f6f3ec] text-[#2a2230]">
      <div className="bg-[#0a2536] py-1.5 text-xs text-[#cfe3e9]">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-5">
          <span>A free national directory of recovery residences</span>
          <span>
            In crisis? Call or text <b>988</b> · Iowa: Your Life Iowa 1-855-581-8111
          </span>
        </div>
      </div>
      <header className="sticky top-0 z-50 border-b border-[#e3ded4] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3.5">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[#10384f] to-[#1b7f8e] font-serif text-xl text-white">⌂</span>
            <span className="font-serif text-xl font-bold leading-tight text-[#10384f]">
              RecoveryResidence
              <small className="block font-sans text-[.65rem] font-semibold uppercase tracking-wider text-[#8a8375]">
                National Recovery Housing Directory
              </small>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-sm font-bold">
            <a
              href="mailto:gracehouse@graceforaddictions.org?subject=Residence listing submission"
              className="rounded-lg px-3 py-2 text-[#10384f] hover:bg-[#e2f0f2]"
            >
              List your residence
            </a>
            <Link to="/signin" className="rounded-lg bg-[#10384f] px-3 py-2 text-white hover:bg-[#1b7f8e]">
              Portal sign in
            </Link>
          </nav>
        </div>
      </header>

      <div className="bg-gradient-to-br from-[#0a2536] to-[#10384f] py-14 text-[#eff7f9]">
        <div className="mx-auto max-w-6xl px-5">
          <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Find a recovery residence <em className="italic text-[#e2725b]">near you</em>.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#eff7f9]/85">
            A free, searchable directory of recovery residences across the United States — peer-run
            houses, nonprofit programs, and faith-based communities. Search by county, compare
            populations served, and connect directly. Starting with a complete build-out of Iowa;
            additional states are being added.
          </p>
          <div className="mt-7 grid gap-3 rounded-2xl bg-white p-4 shadow-2xl sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
            <input
              className="rounded-lg border-[1.5px] border-[#e3ded4] p-3 text-sm text-[#10384f] focus:border-[#1b7f8e] focus:outline-none sm:col-span-2 lg:col-span-1"
              placeholder="Search by name, city, or organization…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search residences"
            />
            <select className="rounded-lg border-[1.5px] border-[#e3ded4] p-3 text-sm text-[#10384f]" value="IA" onChange={() => {}} aria-label="State">
              <option value="IA">Iowa</option>
              <option disabled>More states coming soon…</option>
            </select>
            <select className="rounded-lg border-[1.5px] border-[#e3ded4] p-3 text-sm text-[#10384f]" value={county} onChange={(e) => setCounty(e.target.value)} aria-label="County">
              <option value="">All counties</option>
              {counties.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select className="rounded-lg border-[1.5px] border-[#e3ded4] p-3 text-sm text-[#10384f]" value={pop} onChange={(e) => setPop(e.target.value)} aria-label="Population served">
              <option value="">All populations</option>
              {['Men', 'Women', 'Women & children', 'All genders'].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-9">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-2xl font-semibold text-[#10384f]">Iowa Recovery Residences</h2>
          <span className="text-sm font-bold text-[#1b7f8e]">
            {rows.length} residence listing{rows.length !== 1 ? 's' : ''} · Iowa
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <div key={r.n} className="flex flex-col rounded-2xl border border-[#e3ded4] bg-white p-5 transition-transform hover:-translate-y-0.5 hover:shadow-lg">
              <h3 className="font-serif text-lg font-semibold leading-snug text-[#10384f]">{r.n}</h3>
              <div className="mt-0.5 text-xs font-bold text-[#1b7f8e]">{r.org}</div>
              <div className="my-2.5 flex flex-wrap gap-1.5 text-[.72rem] font-bold">
                <span className="rounded-full bg-[#eef1e9] px-2.5 py-1 text-[#5c6b4f]">{r.county} County</span>
                <span className="rounded-full bg-[#e2f0f2] px-2.5 py-1 text-[#1b7f8e]">{r.city}</span>
                <span className="rounded-full bg-[#fbe8e3] px-2.5 py-1 text-[#b0492f]">{r.pop}</span>
                {r.slug && <span className="rounded-full bg-[#f3e6f1] px-2.5 py-1 text-[#8e4585]">Full profile + online application</span>}
              </div>
              <div className="mb-3 text-sm text-[#6e6a5e]">{r.type}</div>
              <div className="mt-auto">
                {r.slug ? (
                  <Link to={`/residences/${r.slug}`} className="inline-block rounded-lg bg-[#10384f] px-4 py-2 text-sm font-bold text-white hover:bg-[#1b7f8e]">
                    View Profile &amp; Apply →
                  </Link>
                ) : (
                  <button onClick={() => setDetail(r)} className="rounded-lg border-[1.5px] border-[#10384f] px-4 py-2 text-sm font-bold text-[#10384f] hover:bg-[#e2f0f2]">
                    Details
                  </button>
                )}
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="col-span-full rounded-2xl border-[1.5px] border-dashed border-[#e3ded4] bg-white p-10 text-center text-[#8a8375]">
              No residences match those filters yet. Try broadening your search.
            </div>
          )}
        </div>
        <div className="mt-7 rounded-r-xl border border-l-4 border-[#e3ded4] border-l-[#1b7f8e] bg-white p-4 text-sm leading-relaxed text-[#4a5560]">
          <b>About this directory:</b> Listings are independent organizations compiled from public
          sources and operator submissions; inclusion is not an endorsement, and details can change
          — always verify current availability, fees, and certification status directly with the
          residence and with the Iowa HHS recovery housing program (recoveryhousing@hhs.iowa.gov).
          Oxford House city entries reflect the number of chartered houses in that community;
          contact Oxford House for current vacancies at oxfordvacancies.com.
        </div>
      </div>

      {detail && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a2536]/60 p-5"
          onClick={() => setDetail(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl font-semibold text-[#10384f]">{detail.n}</h3>
            <div className="mb-3 text-sm font-bold text-[#1b7f8e]">
              {detail.org} · {detail.city}, {detail.county} County, Iowa
            </div>
            <p className="text-sm leading-relaxed">{detail.d}</p>
            <p className="mt-2 text-sm">
              <b className="text-[#10384f]">Serves:</b> {detail.pop} · <b className="text-[#10384f]">Type:</b> {detail.type}
            </p>
            <p className="mt-1 text-sm">
              <b className="text-[#10384f]">Contact:</b> {detail.contact}
            </p>
            <p className="mt-3 text-xs text-[#8a8375]">
              Independent organization — verify current availability, fees, and certification
              directly. This listing is informational, not an endorsement.
            </p>
            <div className="mt-3 text-right">
              <button className="rounded-lg bg-[#10384f] px-4 py-2 text-sm font-bold text-white" onClick={() => setDetail(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-[#0a2536] py-9 text-[#b9cdd6]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:grid-cols-3">
          <div>
            <h5 className="mb-2 font-serif text-[#e2725b]">RecoveryResidence</h5>
            <p className="text-sm leading-relaxed">
              A free directory connecting people to recovery residences. Listings are independent
              organizations; inclusion is not an endorsement. Verify certification with your state
              authority (Iowa: recoveryhousing@hhs.iowa.gov).
            </p>
          </div>
          <div>
            <h5 className="mb-2 font-serif text-[#e2725b]">Crisis Support</h5>
            <ul className="space-y-1 text-sm">
              <li>988 Suicide &amp; Crisis Lifeline — call or text 988</li>
              <li>Your Life Iowa: 1-855-581-8111</li>
              <li>Crisis Text Line: text HOME to 741741</li>
            </ul>
          </div>
          <div>
            <h5 className="mb-2 font-serif text-[#e2725b]">Grace For Addictions</h5>
            <ul className="space-y-1 text-sm">
              <li>Office: 515-220-8771</li>
              <li>gracehouse@graceforaddictions.org</li>
              <li>
                <Link to="/platform" className="underline">About the platform</Link> · <Link to="/signin" className="underline">Portal sign in</Link>
              </li>
            </ul>
          </div>
          <div className="col-span-full border-t border-white/15 pt-4 text-center text-xs text-[#b9cdd6]/70">
            This directory does not provide medical, legal, or clinical advice.
          </div>
        </div>
      </footer>
    </div>
  )
}
