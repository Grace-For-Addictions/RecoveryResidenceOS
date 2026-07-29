import { Link } from 'react-router-dom'

const FEATURES = [
  ['🛏', 'Real-time bed availability & waitlist queue'],
  ['🌤', 'Resident daily check-ins with staff flagging'],
  ['💳', 'Program fee tracking, receipts & balances'],
  ['🕊', 'Grievance workflow with response deadlines'],
  ['🎒', 'Pass & leave requests with return tracking'],
  ['📣', 'House-wide announcements & expectations'],
  ['🤝', 'Versioned policies, signed documents, honest compliance'],
]

/**
 * Public landing for the universal recovery-housing platform.
 * Every operational value inside the app comes from the policy engine.
 */
export function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-pine-deep text-cream">
      <nav className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-3 font-serif text-xl font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold text-pine-deep">⌂</span>
          Recovery Residence
        </div>
        <Link to="/signin" className="btn border border-cream/30 bg-cream/10 text-cream hover:bg-cream/20">
          Sign in
        </Link>
      </nav>
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-10 sm:px-10 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Every recovery house deserves <em className="italic text-gold">great operations</em>.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-cream/80">
            The universal platform for recovery housing organizations. Bed management, waitlists,
            daily check-ins, payments, grievances, passes, and messaging — built on trauma-informed,
            MAT/MOUD-affirming practice standards, with versioned policies and signed documents
            underneath.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/admin/new-residence" className="btn-gold">
              ＋ Create your residence profile
            </Link>
            <Link to="/staff" className="btn border border-cream/30 bg-cream/10 text-cream hover:bg-cream/20">
              Explore house operations →
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-cream/15 bg-cream/5 p-7">
          <h3 className="font-serif text-lg font-semibold text-gold">
            What every residence profile includes
          </h3>
          <ul className="mt-4 divide-y divide-cream/10">
            {FEATURES.map(([icon, text]) => (
              <li key={text} className="flex items-center gap-3 py-2.5 text-[.95rem] text-cream/85">
                <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-gold/20">
                  {icon}
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </main>
      <footer className="px-6 pb-6 text-center text-xs text-cream/40">
        No Shame. No Stigma. Just Grace. · Connection Prevents Crisis
      </footer>
    </div>
  )
}
