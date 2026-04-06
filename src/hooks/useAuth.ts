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
  const setLoading = useAppStore((state) => state.setLoading)
  const clearAll = useAppStore((state) => state.clearAll)

  useEffect(() => {
    let mounted = true

    const initializeSession = async () => {
      setLoading(true)
      const { data, error } = await supabase.auth.getSession()

      if (!mounted) {
        return
      }

      if (error) {
        clearAll()
        return
      }

      setAuthState(data.session?.user ?? null, data.session ?? null)
    }

    void initializeSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_OUT' || nextSession === null) {
        clearAll()

        if (location.pathname !== '/auth') {
          navigate('/auth', { replace: true })
        }

        return
      }

      setAuthState(nextSession?.user ?? null, nextSession ?? null)

      if (event === 'TOKEN_REFRESHED') {
        return
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [clearAll, location.pathname, navigate, setAuthState, setLoading])

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
