import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { StaffLayout } from '@/app/layouts/StaffLayout'
import { KitchenLayout } from '@/app/layouts/KitchenLayout'
import { TabletLayout } from '@/app/layouts/TabletLayout'
import { AuthGuard, PublicOnlyGuard, RoleGuard } from '@/app/routes/guards'

import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { ProfilePage } from '@/features/auth/pages/ProfilePage'
import { AccessDeniedPage } from '@/features/auth/pages/AccessDeniedPage'
import { CategoryManagementPage } from '@/features/menu/pages/CategoryManagementPage'
import { MenuItemListPage } from '@/features/menu/pages/MenuItemListPage'
import { MenuItemCreatePage } from '@/features/menu/pages/MenuItemCreatePage'
import { MenuItemDetailPage } from '@/features/menu/pages/MenuItemDetailPage'
import { TabletMenuPage } from '@/features/menu/pages/TabletMenuPage'
import { TabletMenuItemDetailPage } from '@/features/menu/pages/TabletMenuItemDetailPage'
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
import { ExpensesPage } from '@/features/expenses/pages/ExpensesPage'
import { OwnerDashboardPage } from '@/features/dashboard/pages/OwnerDashboardPage'
import { RevenueReportPage } from '@/features/reports/pages/RevenueReportPage'
import { PopularItemsReportPage } from '@/features/reports/pages/PopularItemsReportPage'
import { ProfitReportPage } from '@/features/reports/pages/ProfitReportPage'
import { OperationsReportPage } from '@/features/reports/pages/OperationsReportPage'
import { IngredientsPage } from '@/features/inventory/pages/IngredientsPage'
import { StockMovementsPage } from '@/features/inventory/pages/StockMovementsPage'
import { InventoryChecksPage } from '@/features/inventory/pages/InventoryChecksPage'
import { RecipesPage } from '@/features/recipes/pages/RecipesPage'
import { PurchasesPage } from '@/features/purchasing/pages/PurchasesPage'
import { CreatePurchasePage } from '@/features/purchasing/pages/CreatePurchasePage'
import { PurchaseDetailPage } from '@/features/purchasing/pages/PurchaseDetailPage'

import { UserManagementPage } from '@/features/users/pages/UserManagementPage'
import { TablesOverviewPage } from '@/features/tables/pages/TablesOverviewPage'
import { TableDetailPage } from '@/features/tables/pages/TableDetailPage'
import { SessionDetailPage } from '@/features/tables/pages/SessionDetailPage'
import { SessionHistoryPage } from '@/features/tables/pages/SessionHistoryPage'
import { TabletWelcomePage } from '@/features/tables/pages/TabletWelcomePage'
import { AiAssistantPage } from '@/features/tables/pages/AiAssistantPage'

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes with AuthLayout */}
      <Route element={<PublicOnlyGuard />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
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
            {/* Owner Only Routes */}
            <Route element={<RoleGuard allowedRoles={['OWNER']} />}>
              <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
              <Route path="/owner/users" element={<UserManagementPage />} />
              <Route path="/owner/users/:userId" element={<UserManagementPage />} />
              <Route path="/owner/categories" element={<CategoryManagementPage />} />
              <Route path="/owner/menu-items" element={<MenuItemListPage />} />
              <Route path="/owner/menu-items/new" element={<MenuItemCreatePage />} />
              <Route path="/owner/menu-items/:itemId" element={<MenuItemDetailPage />} />
              <Route path="/owner/expenses" element={<ExpensesPage />} />
              <Route path="/owner/reports/revenue" element={<RevenueReportPage />} />
              <Route path="/owner/reports/popular-items" element={<PopularItemsReportPage />} />
              <Route path="/owner/reports/profit" element={<ProfitReportPage />} />
              <Route path="/owner/reports/operations" element={<OperationsReportPage />} />
            </Route>

            {/* Service Staff & Owner Routes */}
            <Route element={<RoleGuard allowedRoles={['OWNER', 'SERVICE_STAFF']} />}>
              <Route path="/tables" element={<TablesOverviewPage />} />
              <Route path="/staff/tables" element={<TablesOverviewPage />} />
              <Route path="/staff/active-tables" element={<TablesOverviewPage initialActiveOnly={true} />} />
              <Route path="/tables/:tableId" element={<TableDetailPage />} />
              <Route path="/staff/tables/:tableId" element={<TableDetailPage />} />
              <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
              <Route path="/staff/sessions/:sessionId" element={<SessionDetailPage />} />
              <Route path="/sessions/history" element={<SessionHistoryPage />} />
              <Route path="/staff/sessions/history" element={<SessionHistoryPage />} />
              <Route path="/ai-assistant" element={<AiAssistantPage />} />
              <Route path="/staff/orders" element={<StaffOrdersPage />} />
              <Route path="/staff/orders/:orderId" element={<StaffOrderDetailPage />} />
            </Route>

            {/* Inventory Staff & Owner Routes */}
            <Route element={<RoleGuard allowedRoles={['OWNER', 'INVENTORY_STAFF']} />}>
              <Route path="/inventory/ingredients" element={<IngredientsPage />} />
              <Route path="/inventory/movements" element={<StockMovementsPage />} />
              <Route path="/inventory/checks" element={<InventoryChecksPage />} />
              <Route path="/inventory/recipes" element={<RecipesPage />} />
              <Route path="/inventory/purchases" element={<PurchasesPage />} />
              <Route path="/inventory/purchases/new" element={<CreatePurchasePage />} />
              <Route path="/inventory/purchases/:purchaseId" element={<PurchaseDetailPage />} />
            </Route>

            {/* Shared Profile & Settings (All Staff & Owner) */}
            <Route path="/profile" element={<ProfilePage defaultTab="profile" />} />
            <Route path="/profile/change-password" element={<ProfilePage defaultTab="password" />} />
            <Route path="/settings/change-password" element={<ProfilePage defaultTab="password" />} />
          </Route>
        </Route>

        {/* Kitchen Layout (KDS) */}
        <Route
          element={<RoleGuard allowedRoles={['KITCHEN_STAFF', 'OWNER']} />}
        >
          <Route element={<KitchenLayout />}>
            <Route path="/kitchen/queue" element={<KitchenQueuePage />} />
            <Route path="/kitchen/orders/:orderId" element={<KitchenOrderDetailPage />} />
            <Route path="/kitchen/cooking" element={<KitchenCookingPage />} />
            <Route path="/kitchen/ready" element={<KitchenReadyPage />} />
            <Route path="/kitchen/menu-availability" element={<KitchenMenuAvailabilityPage />} />
          </Route>
        </Route>

        {/* Tablet Layout */}
        <Route
          element={<RoleGuard allowedRoles={['TABLE_ACCOUNT', 'OWNER']} />}
        >
          <Route element={<TabletLayout />}>
            <Route path="/tablet/welcome" element={<TabletWelcomePage />} />
            <Route path="/tablet/cart" element={<TabletCartPage />} />
            <Route path="/tablet/checkout" element={<TabletCheckoutPage />} />
            <Route path="/tablet/order-success" element={<TabletOrderSuccessPage />} />
            <Route path="/tablet/orders" element={<TabletOrderTrackingPage />} />
            <Route path="/tablet/menu" element={<TabletMenuPage />} />
            <Route path="/tablet/menu/:itemId" element={<TabletMenuItemDetailPage />} />
            <Route path="/tablet/ai-assistant" element={<AiAssistantPage />} />
            <Route path="/tablet/assistant" element={<AiAssistantPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
