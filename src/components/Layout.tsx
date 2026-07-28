import { NavLink, Outlet, useLocation, Link } from 'react-router-dom'
import { SupportNow } from './SupportNow'
import { useResidence } from '../context/ResidenceContext'

const link = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold ${
    isActive ? 'bg-mist text-pine' : 'text-sage hover:bg-stone-100'
  }`

export function Layout() {
  const { residences, active, setActiveId } = useResidence()
  const { pathname } = useLocation()
  const inStaff = pathname.startsWith('/staff')

  return (
    <div className="min-h-screen">
      <header className="border-b border-mist bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
          <Link to="/" className="mr-3 flex items-center gap-2 font-serif text-lg font-bold text-pine">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold text-pine-deep">⌂</span>
            {active?.name ?? 'Recovery Residence'}
          </Link>
          <nav className="flex flex-wrap gap-1" aria-label="Main">
            <NavLink to="/resident" end className={link}>My Home</NavLink>
            <NavLink to="/resident/checkin" className={link}>Check-In</NavLink>
            <NavLink to="/resident/passes" className={link}>Passes</NavLink>
            <NavLink to="/resident/documents" className={link}>My Documents</NavLink>
            <NavLink to="/resident/grievance" className={link}>Raise a Concern</NavLink>
            <NavLink to="/staff" className={link}>Staff</NavLink>
          </nav>
          {residences.length > 1 && (
            <select
              aria-label="Switch residence"
              className="ml-auto rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm font-semibold text-pine"
              value={active?.id ?? ''}
              onChange={(e) => setActiveId(e.target.value)}
            >
              {residences.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}
        </div>
        {inStaff && (
          <div className="border-t border-mist bg-[#fafbf8]">
            <nav className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4 py-2" aria-label="Staff">
              <NavLink to="/staff" end className={link}>Dashboard</NavLink>
              <NavLink to="/staff/beds" className={link}>Beds</NavLink>
              <NavLink to="/staff/waitlist" className={link}>Waitlist</NavLink>
              <NavLink to="/staff/passes" className={link}>Passes</NavLink>
              <NavLink to="/staff/payments" className={link}>Payments</NavLink>
              <NavLink to="/staff/grievances" className={link}>Grievances</NavLink>
              <NavLink to="/admin/new-residence" className={link}>＋ New residence</NavLink>
            </nav>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 pb-28">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-24 text-xs text-stone-400">
        No Shame. No Stigma. Just Grace. · Connection Prevents Crisis
      </footer>
      <SupportNow />
    </div>
  )
}
