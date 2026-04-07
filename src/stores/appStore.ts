import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import type { ServiceAlert, ServiceLog, Vehicle } from '@/types'

const DISPLAY_NAME_KEY_PREFIX = 'mazdacare_display_name:'

function getDisplayNameKey(userId: string) {
  return `${DISPLAY_NAME_KEY_PREFIX}${userId}`
}

function readDisplayNameOverride(userId: string) {
  if (typeof window === 'undefined') {
    return null
  }

  return window.sessionStorage.getItem(getDisplayNameKey(userId))
}

function writeDisplayNameOverride(userId: string, displayName: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(getDisplayNameKey(userId), displayName)
}

function clearDisplayNameOverrides() {
  if (typeof window === 'undefined') {
    return
  }

  for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = window.sessionStorage.key(index)

    if (key?.startsWith(DISPLAY_NAME_KEY_PREFIX)) {
      window.sessionStorage.removeItem(key)
    }
  }
}

function applyDisplayNameOverride(user: User | null) {
  if (!user) {
    return null
  }

  const override = readDisplayNameOverride(user.id)

  if (!override) {
    return user
  }

  return {
    ...user,
    user_metadata: {
      ...user.user_metadata,
      full_name: override,
    },
  }
}

interface AppState {
  user: User | null
  session: Session | null
  loading: boolean
  vehicles: Vehicle[]
  serviceLogs: ServiceLog[]
  alerts: ServiceAlert[]
  activeVehicleId: string | null
  setActiveVehicleId: (vehicleId: string | null) => void
  setAuthState: (user: User | null, session: Session | null) => void
  setLoading: (loading: boolean) => void
  setDisplayName: (displayName: string) => void
  clearAuthState: () => void
  clearAll: () => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  session: null,
  loading: true,
  vehicles: [],
  serviceLogs: [],
  alerts: [],
  activeVehicleId: null,
  setActiveVehicleId: (activeVehicleId) => set({ activeVehicleId }),
  setAuthState: (user, session) =>
    set({
      user: applyDisplayNameOverride(user),
      session,
      loading: false,
    }),
  setLoading: (loading) => set({ loading }),
  setDisplayName: (displayName) =>
    set((state) => {
      if (!state.user) {
        return state
      }

      writeDisplayNameOverride(state.user.id, displayName)

      return {
        user: {
          ...state.user,
          user_metadata: {
            ...state.user.user_metadata,
            full_name: displayName,
          },
        },
      }
    }),
  clearAuthState: () =>
    set({
      user: null,
      session: null,
      loading: false,
    }),
  clearAll: () => {
    // Wipe the entire sessionStorage for this tab — removes display name
    // overrides (PII), rate-limit counters, splash flag, and any future keys.
    // Supabase's own signOut() handles clearing localStorage auth tokens.
    try {
      window.sessionStorage.clear()
    } catch {
      // Private-browsing or storage-disabled — proceed anyway.
      clearDisplayNameOverrides()
    }

    set({
      user: null,
      session: null,
      loading: false,
      vehicles: [],
      serviceLogs: [],
      alerts: [],
      activeVehicleId: null,
    })
  },
}))
