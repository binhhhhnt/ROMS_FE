import { create } from 'zustand'
import type { UserProfile } from '@/features/auth/types/auth.types'

interface AuthState {
  accessToken: string | null
  user: UserProfile | null
  isAuthenticated: boolean
  isInitializing: boolean
  setAuth: (token: string, user: UserProfile) => void
  setAccessToken: (token: string) => void
  setUser: (user: UserProfile) => void
  clearAuth: () => void
  setInitializing: (val: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  setAuth: (token, user) =>
    set({
      accessToken: token,
      user,
      isAuthenticated: true,
      isInitializing: false,
    }),
  setAccessToken: (token) =>
    set({
      accessToken: token,
      isAuthenticated: true,
    }),
  setUser: (user) =>
    set({
      user,
      isAuthenticated: true,
    }),
  clearAuth: () =>
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isInitializing: false,
    }),
  setInitializing: (val) => set({ isInitializing: val }),
}))

if (import.meta.env.DEV) {
  // @ts-expect-error dev helper
  window.__authStore = useAuthStore
}
