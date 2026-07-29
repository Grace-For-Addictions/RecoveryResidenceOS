import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/** Gates app routes behind a Supabase session; RLS remains the real boundary. */
export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream text-sage">
        <p className="text-sm">Loading…</p>
      </div>
    )
  }
  if (!session) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
