import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/app/store/authStore'
import type { UserRole } from '@/features/auth/types/auth.types'

export function AuthGuard() {
  const { isAuthenticated, isInitializing } = useAuthStore()

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted">Đang xác thực thông tin đăng nhập...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export function RoleGuard({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const { user } = useAuthStore()

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/access-denied" replace />
  }

  return <Outlet />
}

export function PublicOnlyGuard() {
  const { isAuthenticated, isInitializing, user } = useAuthStore()

  if (isInitializing) {
    return null
  }

  if (isAuthenticated && user) {
    if (user.role === 'TABLE_ACCOUNT') {
      return <Navigate to="/tablet/cart" replace />
    }
    if (user.role === 'KITCHEN_STAFF') {
      return <Navigate to="/kitchen/queue" replace />
    }
    return <Navigate to="/staff/orders" replace />
  }

  return <Outlet />
}
