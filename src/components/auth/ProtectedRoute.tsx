import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/stores/appStore'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const clearAll = useAppStore((state) => state.clearAll)
  const { user, loading } = useAuth()
  const [checkingSession, setCheckingSession] = useState(false)

  useEffect(() => {
    if (loading || !user) {
      setCheckingSession(false)
      return
    }

    let active = true

    const validateSession = async () => {
      setCheckingSession(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!active) {
        return
      }

      if (!session) {
        clearAll()
        navigate('/auth', { replace: true, state: { from: location.pathname } })
        return
      }

      setCheckingSession(false)
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void validateSession()
      }
    }

    void validateSession()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      active = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [clearAll, loading, location.pathname, navigate, user])

  if (loading || checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mz-black p-6 text-[13px] text-white/40" style={{ fontFamily: 'Outfit, sans-serif' }}>
        Checking your session…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
