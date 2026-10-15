import { useEffect, useState, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from '@/shared/components/ui/sonner'
import { useAuthStore } from '@/app/store/authStore'
import { authApi } from '@/features/auth/api/authApi'
import { queryClient } from '@/shared/lib/queryClient'

function AuthRehydration({ children }: { children: ReactNode }) {
  const { setAuth, clearAuth, setInitializing } = useAuthStore()
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function rehydrate() {
      try {
        // Attempt single refresh rotation with HttpOnly cookie
        const tokenData = await authApi.refresh()
        if (!isMounted) return

        useAuthStore.getState().setAccessToken(tokenData.accessToken)
        const userProfile = await authApi.getMe()
        if (!isMounted) return

        setAuth(tokenData.accessToken, userProfile)
      } catch {
        if (!isMounted) return
        clearAuth()
      } finally {
        if (isMounted) {
          setInitializing(false)
          setIsDone(true)
        }
      }
    }

    rehydrate()

    return () => {
      isMounted = false
    }
  }, [setAuth, clearAuth, setInitializing])

  if (!isDone) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted">Đang tải ứng dụng ROMS...</p>
      </div>
    )
  }

  return <>{children}</>
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthRehydration>
          {children}
          <Toaster />
        </AuthRehydration>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
