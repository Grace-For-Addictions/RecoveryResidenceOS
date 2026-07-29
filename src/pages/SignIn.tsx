import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Sign-in: password or emailed magic link. Invitation-based onboarding
 * creates the account; this screen never exposes why an email is unknown.
 */
export function SignIn() {
  const { session, signIn, sendMagicLink } = useAuth()
  const location = useLocation()
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/resident'
  if (session) return <Navigate to={from} replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    if (mode === 'password') {
      const err = await signIn(email, password)
      if (err) setMessage('Sign-in did not work. Check your email and password, or use a magic link instead.')
    } else {
      const err = await sendMagicLink(email)
      setMessage(
        err
          ? 'The link could not be sent right now — please try again in a moment.'
          : 'Check your email — if an account exists for that address, a sign-in link is on its way.',
      )
    }
    setBusy(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-pine-deep text-cream">
      <nav className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/" className="flex items-center gap-3 font-serif text-xl font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold text-pine-deep">⌂</span>
          Recovery Residence
        </Link>
      </nav>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-16">
        <h1 className="text-3xl font-semibold">Welcome back.</h1>
        <p className="mt-2 text-sm text-cream/70">
          Sign in to your home, your documents, and your community.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 text-ink shadow-xl">
          <div className="flex gap-1 rounded-xl bg-mist p-1 text-sm font-bold">
            <button
              type="button"
              onClick={() => setMode('password')}
              className={`flex-1 rounded-lg py-1.5 ${mode === 'password' ? 'bg-white text-pine shadow-sm' : 'text-sage'}`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setMode('magic')}
              className={`flex-1 rounded-lg py-1.5 ${mode === 'magic' ? 'bg-white text-pine shadow-sm' : 'text-sage'}`}
            >
              Email me a link
            </button>
          </div>
          <div>
            <label className="field-label" htmlFor="si-email">Email</label>
            <input
              id="si-email"
              className="field-input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {mode === 'password' && (
            <div>
              <label className="field-label" htmlFor="si-password">Password</label>
              <input
                id="si-password"
                className="field-input"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}
          <button type="submit" className="btn-pine w-full justify-center" disabled={busy}>
            {busy ? 'One moment…' : mode === 'password' ? 'Sign in' : 'Send sign-in link'}
          </button>
          {message && (
            <p role="status" className="text-sm text-sage">{message}</p>
          )}
          <p className="text-xs text-sage">
            New here? Accounts are created by invitation during onboarding — ask your House Manager
            or call the GFA office at 515-220-8771.
          </p>
        </form>
      </main>
      <footer className="px-6 pb-6 text-center text-xs text-cream/40">
        No Shame. No Stigma. Just Grace. · Connection Prevents Crisis
      </footer>
    </div>
  )
}
