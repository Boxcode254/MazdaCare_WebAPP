import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const { user, loading } = useAuth()

  if (loading) {
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
