import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/stores/appStore'

export function useAuth() {
  const user = useAppStore((state) => state.user)
  const session = useAppStore((state) => state.session)
  const loading = useAppStore((state) => state.loading)
  const setAuthState = useAppStore((state) => state.setAuthState)
  const setLoading = useAppStore((state) => state.setLoading)
  const clearAuthState = useAppStore((state) => state.clearAuthState)

  useEffect(() => {
    let mounted = true

    const initializeSession = async () => {
      setLoading(true)
      const { data, error } = await supabase.auth.getSession()

      if (!mounted) {
        return
      }

      if (error) {
        clearAuthState()
        return
      }

      setAuthState(data.session?.user ?? null, data.session ?? null)
    }

    void initializeSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setAuthState(nextSession?.user ?? null, nextSession ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [clearAuthState, setAuthState, setLoading])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }

    clearAuthState()
  }

  return {
    user,
    session,
    loading,
    signOut,
  }
}
