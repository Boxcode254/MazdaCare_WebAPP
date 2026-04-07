import { type ReactNode, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/stores/appStore'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const clearAll = useAppStore((state) => state.clearAll)
  const { user, loading } = useAuth()
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    let active = true

    const validateSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()

        if (!active) {
          return
        }

        if (!data.session && user) {
          clearAll()
        }
      } catch (error) {
        if (active) {
          console.error('Protected route session check failed:', error)
        }
      } finally {
        if (active) {
          setCheckingSession(false)
        }
      }
    }

    void validateSession()

    return () => {
      active = false
    }
  }, [clearAll, user])

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
