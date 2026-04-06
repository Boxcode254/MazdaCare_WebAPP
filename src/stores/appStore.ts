import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'

interface AppState {
  user: User | null
  session: Session | null
  loading: boolean
  setAuthState: (user: User | null, session: Session | null) => void
  setLoading: (loading: boolean) => void
  clearAuthState: () => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  session: null,
  loading: true,
  setAuthState: (user, session) =>
    set({
      user,
      session,
      loading: false,
    }),
  setLoading: (loading) => set({ loading }),
  clearAuthState: () =>
    set({
      user: null,
      session: null,
      loading: false,
    }),
}))
