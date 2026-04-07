import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/stores/appStore'

export function useAuth() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAppStore((state) => state.user)
  const session = useAppStore((state) => state.session)
  const loading = useAppStore((state) => state.loading)
  const setAuthState = useAppStore((state) => state.setAuthState)
  const clearAll = useAppStore((state) => state.clearAll)

  useEffect(() => {
    let mounted = true

    const initializeSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (!mounted) {
          return
        }

        if (error) {
          console.error('Session init error:', error)
          clearAll()
          return
        }

        setAuthState(data.session?.user ?? null, data.session ?? null)
      } catch (error) {
        if (mounted) {
          console.error('Session initialization failed:', error)
          clearAll()
        }
      }
    }

    void initializeSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      const authEvent = event as string

      if (authEvent === 'SIGNED_OUT' || authEvent === 'USER_DELETED') {
        useAppStore.getState().clearAll()

        if (location.pathname !== '/auth') {
          navigate('/auth', { replace: true })
        }

        return
      }

      if (event === 'TOKEN_REFRESHED') {
        return
      }

      setAuthState(nextSession?.user ?? null, nextSession ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [clearAll, location.pathname, navigate, setAuthState])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }

    clearAll()
  }

  return {
    user,
    session,
    loading,
    signOut,
  }
}
