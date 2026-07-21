import { NavLink, Outlet } from 'react-router-dom'
import { SupportNow } from './SupportNow'

const link = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-emerald-100 text-emerald-900' : 'text-stone-600 hover:bg-stone-100'
  }`

export function Layout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
          <span className="mr-4 text-lg font-semibold text-emerald-900">Grace House</span>
          <nav className="flex flex-wrap gap-1" aria-label="Main">
            <NavLink to="/resident" end className={link}>
              My Home
            </NavLink>
            <NavLink to="/resident/passes" className={link}>
              Passes
            </NavLink>
            <NavLink to="/resident/documents" className={link}>
              My Documents
            </NavLink>
            <NavLink to="/resident/grievance" className={link}>
              Raise a Concern
            </NavLink>
            <NavLink to="/staff" className={link}>
              Staff
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 pb-28">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-5xl px-4 pb-24 text-xs text-stone-400">
        No Shame. No Stigma. Just Grace. · Connection Prevents Crisis
      </footer>
      <SupportNow />
    </div>
  )
}
