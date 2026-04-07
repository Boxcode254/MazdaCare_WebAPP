import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useRateLimit } from '@/hooks/useRateLimit'
import { supabase } from '@/lib/supabase'
import MazdaLogo from '@/components/ui/MazdaLogo'
import authBg from '@/assets/auth-bg.jpg'

type AuthMode = 'signin' | 'signup' | 'google'

interface AuthFormState {
  email: string
  password: string
}

const initialFormState: AuthFormState = {
  email: '',
  password: '',
}

const inputClass =
  'w-full rounded-lg border border-transparent bg-mz-gray-100 px-3 py-[9px] text-[13px] text-mz-black outline-none transition focus-visible:border-mz-red focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-[rgba(155,27,48,0.1)]'

const labelClass = 'mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-mz-gray-500'

export function Auth() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const authLimit = useRateLimit({ key: 'auth_signin', maxAttempts: 5, windowMs: 300000 })
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')
  const [workingMode, setWorkingMode] = useState<AuthMode | null>(null)
  const [signInForm, setSignInForm] = useState<AuthFormState>(initialFormState)
  const [signUpForm, setSignUpForm] = useState<AuthFormState>(initialFormState)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [navigate, user])

  const isSubmitting = useMemo(() => workingMode !== null, [workingMode])

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError(null)

    const { allowed, remainingMs } = authLimit.check()

    if (!allowed) {
      const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000))
      toast.error(`Too many sign-in attempts. Try again in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.`)
      return
    }

    setWorkingMode('signin')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInForm.email,
        password: signInForm.password,
      })

      if (error) {
        setAuthError(error.message)
        return
      }

      toast.success('Welcome back!')
      navigate('/', { replace: true })
    } catch {
      setAuthError('Sign in failed. Please try again.')
    } finally {
      setWorkingMode(null)
    }
  }

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError(null)
    setWorkingMode('signup')

    try {
      const { error } = await supabase.auth.signUp({
        email: signUpForm.email,
        password: signUpForm.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

      if (error) {
        setAuthError(error.message)
        return
      }

      toast.success('Account created. Check your email to confirm your account.')
      setActiveTab('signin')
    } catch {
      setAuthError('Sign up failed. Please try again.')
    } finally {
      setWorkingMode(null)
    }
  }

  const handleGoogleAuth = async () => {
    setAuthError(null)
    setWorkingMode('google')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      })

      if (error) {
        setAuthError(error.message)
      }
    } catch {
      setAuthError('Google sign in failed. Please try again.')
      setWorkingMode(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mz-black">
        <p className="text-[13px] text-white/40">Loading…</p>
      </div>
    )
  }

  return (
    <div
      className="relative min-h-screen"
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${authBg})` }}
      />
      {/* Dark overlay to reduce clashing */}
      <div className="absolute inset-0 bg-gradient-to-b from-mz-black/80 via-mz-black/85 to-mz-black/95" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-[390px] px-4">

        {/* Brand header */}
        <div
          className="flex flex-col items-center"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 40px) + 40px)' }}
        >
          <MazdaLogo variant="full" theme="dark" size="lg" />
          <p
            className="mt-[6px] text-center uppercase"
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '10px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '3px',
            }}
          >
            Your Mazda. Your history.
          </p>
        </div>

        {/* White form card */}
        <div className="mt-8 rounded-[20px] bg-white p-6">

          {/* Tab switcher */}
          <div className="flex rounded-[10px] p-[3px]" style={{ background: '#F0ECEC' }}>
            {(['signin', 'signup'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); setAuthError(null) }}
                className="flex-1 rounded-[8px] py-[7px] text-[13px] font-semibold transition"
                style={
                  activeTab === tab
                    ? { background: 'white', color: '#111010', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                    : { background: 'transparent', color: '#6B6163' }
                }
              >
                {tab === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          {/* Forms */}
          <div className="mt-4">
            {activeTab === 'signin' ? (
              <form className="space-y-3" onSubmit={handleSignIn}>
                <div>
                  <label htmlFor="signin-email" className={labelClass}>Email</label>
                  <input
                    id="signin-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={inputClass}
                    value={signInForm.email}
                    onChange={(e) => setSignInForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="signin-password" className={labelClass}>Password</label>
                  <input
                    id="signin-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="Your password"
                    className={inputClass}
                    value={signInForm.password}
                    onChange={(e) => setSignInForm((prev) => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 w-full rounded-xl bg-mz-red py-3.5 text-[14px] font-semibold text-white transition hover:bg-mz-red-mid disabled:opacity-60"
                >
                  {workingMode === 'signin' ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
            ) : (
              <form className="space-y-3" onSubmit={handleSignUp}>
                <div>
                  <label htmlFor="signup-email" className={labelClass}>Email</label>
                  <input
                    id="signup-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={inputClass}
                    value={signUpForm.email}
                    onChange={(e) => setSignUpForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="signup-password" className={labelClass}>Password</label>
                  <input
                    id="signup-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={6}
                    placeholder="At least 6 characters"
                    className={inputClass}
                    value={signUpForm.password}
                    onChange={(e) => setSignUpForm((prev) => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 w-full rounded-xl bg-mz-red py-3.5 text-[14px] font-semibold text-white transition hover:bg-mz-red-mid disabled:opacity-60"
                >
                  {workingMode === 'signup' ? 'Creating account…' : 'Create account'}
                </button>
              </form>
            )}
          </div>

          {/* Divider */}
          <div className="my-4 flex items-center gap-3">
            <div className="h-[0.5px] flex-1" style={{ background: '#F0ECEC' }} />
            <span className="text-[12px]" style={{ color: '#C4BABB' }}>or</span>
            <div className="h-[0.5px] flex-1" style={{ background: '#F0ECEC' }} />
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-[10px] rounded-[10px] bg-white px-4 py-3 transition hover:bg-[#FAF9F9] disabled:opacity-60"
            style={{ border: '0.5px solid #C4BABB' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M17.64 9.2045C17.64 8.5663 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.2045Z" fill="#4285F4"/>
              <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.6559 14.4204 4.6718 12.8372 3.9641 10.71H0.9573V13.0418C2.4382 15.9831 5.4818 18 9 18Z" fill="#34A853"/>
              <path d="M3.9641 10.71C3.7841 10.17 3.6818 9.5931 3.6818 9C3.6818 8.4068 3.7841 7.83 3.9641 7.29V4.9581H0.9573C0.3477 6.1731 0 7.5477 0 9C0 10.4522 0.3477 11.8268 0.9573 13.0418L3.9641 10.71Z" fill="#FBBC05"/>
              <path d="M9 3.5795C10.3213 3.5795 11.5077 4.0336 12.4405 4.9254L15.0218 2.344C13.4632 0.8918 11.4259 0 9 0C5.4818 0 2.4382 2.0168 0.9573 4.9581L3.9641 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795Z" fill="#EA4335"/>
            </svg>
            <span className="text-[13px] font-medium" style={{ color: '#3D3536' }}>
              {workingMode === 'google' ? 'Connecting…' : 'Continue with Google'}
            </span>
          </button>

          {/* Inline error */}
          {authError && (
            <div
              className="mt-3 rounded-[6px] text-[12px]"
              style={{
                background: '#F5E8EA',
                borderLeft: '3px solid #9B1B30',
                color: '#9B1B30',
                padding: '10px 12px',
              }}
            >
              {authError}
            </div>
          )}
        </div>

        {/* Terms */}
        <p
          className="mt-6 pb-8 text-center text-[11px]"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          By continuing, you agree to our Terms
        </p>

      </div>
    </div>
  )
}
