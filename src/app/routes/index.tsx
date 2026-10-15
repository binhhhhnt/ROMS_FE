import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { StaffLayout } from '@/app/layouts/StaffLayout'
import { KitchenLayout } from '@/app/layouts/KitchenLayout'
import { TabletLayout } from '@/app/layouts/TabletLayout'
import { AuthGuard, PublicOnlyGuard, RoleGuard } from '@/app/routes/guards'

import { LoginPage } from '@/features/auth/pages/LoginPage'
import { AccessDeniedPage } from '@/features/auth/pages/AccessDeniedPage'
import { CategoryManagementPage } from '@/features/menu/pages/CategoryManagementPage'
import { MenuItemListPage } from '@/features/menu/pages/MenuItemListPage'
import { MenuItemCreatePage } from '@/features/menu/pages/MenuItemCreatePage'
import { MenuItemDetailPage } from '@/features/menu/pages/MenuItemDetailPage'
import { TabletMenuPage } from '@/features/menu/pages/TabletMenuPage'
import { TabletMenuItemDetailPage } from '@/features/menu/pages/TabletMenuItemDetailPage'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { TabletCartPage } from '@/features/ordering/pages/TabletCartPage'
import { TabletCheckoutPage } from '@/features/ordering/pages/TabletCheckoutPage'
import { TabletOrderSuccessPage } from '@/features/ordering/pages/TabletOrderSuccessPage'
import { TabletOrderTrackingPage } from '@/features/ordering/pages/TabletOrderTrackingPage'
import { StaffOrdersPage } from '@/features/ordering/pages/StaffOrdersPage'
import { StaffOrderDetailPage } from '@/features/ordering/pages/StaffOrderDetailPage'
import { KitchenQueuePage } from '@/features/kitchen/pages/KitchenQueuePage'
import { KitchenOrderDetailPage } from '@/features/kitchen/pages/KitchenOrderDetailPage'
import { KitchenCookingPage } from '@/features/kitchen/pages/KitchenCookingPage'
import { KitchenReadyPage } from '@/features/kitchen/pages/KitchenReadyPage'
import { KitchenMenuAvailabilityPage } from '@/features/kitchen/pages/KitchenMenuAvailabilityPage'

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes with AuthLayout */}
      <Route element={<PublicOnlyGuard />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/forgot-password"
            element={<PlaceholderPage title="Quên mật khẩu" description="Tính năng gửi mã OTP khôi phục mật khẩu qua email." />}
          />
        </Route>
      </Route>

      {/* Access Denied Route */}
      <Route path="/access-denied" element={<AccessDeniedPage />} />

      {/* Protected Routes */}
      <Route element={<AuthGuard />}>
        {/* Staff & Owner Layout */}
        <Route
          element={
            <RoleGuard allowedRoles={['OWNER', 'SERVICE_STAFF', 'INVENTORY_STAFF']} />
          }
        >
          <Route element={<StaffLayout />}>
            <Route element={<RoleGuard allowedRoles={['OWNER']} />}>
              <Route path="/owner/categories" element={<CategoryManagementPage />} />
              <Route path="/owner/menu-items" element={<MenuItemListPage />} />
              <Route path="/owner/menu-items/new" element={<MenuItemCreatePage />} />
              <Route path="/owner/menu-items/:itemId" element={<MenuItemDetailPage />} />
            </Route>
            <Route
              path="/owner/dashboard"
              element={<PlaceholderPage title="Dashboard Tổng quan" description="Báo cáo số liệu và hoạt động nhà hàng." />}
            />
            <Route
              path="/staff/orders"
              element={<StaffOrdersPage />}
            />
            <Route
              path="/staff/orders/:orderId"
              element={<StaffOrderDetailPage />}
            />
          </Route>
        </Route>

        {/* Kitchen Layout (KDS) */}
        <Route
          element={<RoleGuard allowedRoles={['KITCHEN_STAFF', 'OWNER']} />}
        >
          <Route element={<KitchenLayout />}>
            <Route
              path="/kitchen/queue"
              element={<KitchenQueuePage />}
            />
            <Route
              path="/kitchen/orders/:orderId"
              element={<KitchenOrderDetailPage />}
            />
            <Route
              path="/kitchen/cooking"
              element={<KitchenCookingPage />}
            />
            <Route
              path="/kitchen/ready"
              element={<KitchenReadyPage />}
            />
            <Route
              path="/kitchen/menu-availability"
              element={<KitchenMenuAvailabilityPage />}
            />
          </Route>
        </Route>

        {/* Tablet Layout */}
        <Route
          element={<RoleGuard allowedRoles={['TABLE_ACCOUNT', 'OWNER']} />}
        >
          <Route element={<TabletLayout />}>
            <Route
              path="/tablet/cart"
              element={<TabletCartPage />}
            />
            <Route
              path="/tablet/checkout"
              element={<TabletCheckoutPage />}
            />
            <Route
              path="/tablet/order-success"
              element={<TabletOrderSuccessPage />}
            />
            <Route
              path="/tablet/orders"
              element={<TabletOrderTrackingPage />}
            />
            <Route
              path="/tablet/menu"
              element={<TabletMenuPage />}
            />
            <Route path="/tablet/menu/:itemId" element={<TabletMenuItemDetailPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
