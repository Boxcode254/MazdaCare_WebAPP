import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/stores/appStore'

const WARNING_TIMEOUT_MS = 30 * 60 * 1000
const SIGN_OUT_TIMEOUT_MS = 60 * 60 * 1000
const WARNING_TOAST_ID = 'idle-session-warning'

function isStandaloneDisplayMode() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(display-mode: standalone)').matches
}

export function useIdleTimer() {
  const navigate = useNavigate()
  const location = useLocation()
  const clearAll = useAppStore((state) => state.clearAll)
  const user = useAppStore((state) => state.user)

  const warningTimeoutRef = useRef<number | null>(null)
  const signOutTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (!user || typeof window === 'undefined' || typeof document === 'undefined' || !isStandaloneDisplayMode()) {
      return
    }

    const clearTimers = () => {
      if (warningTimeoutRef.current !== null) {
        window.clearTimeout(warningTimeoutRef.current)
        warningTimeoutRef.current = null
      }

      if (signOutTimeoutRef.current !== null) {
        window.clearTimeout(signOutTimeoutRef.current)
        signOutTimeoutRef.current = null
      }
    }

    const scheduleTimers = () => {
      clearTimers()

      if (document.hidden) {
        return
      }

      warningTimeoutRef.current = window.setTimeout(() => {
        toast.warning('Session will expire soon — tap to continue', {
          id: WARNING_TOAST_ID,
          duration: SIGN_OUT_TIMEOUT_MS - WARNING_TIMEOUT_MS,
        })
      }, WARNING_TIMEOUT_MS)

      signOutTimeoutRef.current = window.setTimeout(async () => {
        toast.dismiss(WARNING_TOAST_ID)
        await supabase.auth.signOut()
        clearAll()

        if (location.pathname !== '/auth') {
          navigate('/auth', { replace: true })
        }
      }, SIGN_OUT_TIMEOUT_MS)
    }

    const handleInteraction = () => {
      toast.dismiss(WARNING_TOAST_ID)
      scheduleTimers()
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimers()
        toast.dismiss(WARNING_TOAST_ID)
        return
      }

      scheduleTimers()
    }

    scheduleTimers()

    window.addEventListener('pointerdown', handleInteraction, { passive: true })
    window.addEventListener('touchstart', handleInteraction, { passive: true })
    window.addEventListener('keydown', handleInteraction)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearTimers()
      toast.dismiss(WARNING_TOAST_ID)
      window.removeEventListener('pointerdown', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [clearAll, location.pathname, navigate, user])
}