import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { StaffLayout } from '@/app/layouts/StaffLayout'
import { KitchenLayout } from '@/app/layouts/KitchenLayout'
import { QrLayout } from '@/features/qr/layouts/QrLayout'
import { AuthGuard, PublicOnlyGuard, RoleGuard } from '@/app/routes/guards'

import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { ProfilePage } from '@/features/auth/pages/ProfilePage'
import { AccessDeniedPage } from '@/features/auth/pages/AccessDeniedPage'
import { CategoryManagementPage } from '@/features/menu/pages/CategoryManagementPage'
import { MenuExcelImportPage } from '@/features/menu/pages/MenuExcelImportPage'
import { MenuItemListPage } from '@/features/menu/pages/MenuItemListPage'
import { MenuItemCreatePage } from '@/features/menu/pages/MenuItemCreatePage'
import { MenuItemDetailPage } from '@/features/menu/pages/MenuItemDetailPage'
import { QrMenuPage } from '@/features/qr/pages/QrMenuPage'
import { QrCartPage } from '@/features/qr/pages/QrCartPage'
import { QrOrderTrackingPage } from '@/features/qr/pages/QrOrderTrackingPage'
import { StaffQrOrdersPage } from '@/features/qr/pages/StaffQrOrdersPage'
import { OwnerQrTablesPage } from '@/features/qr/pages/OwnerQrTablesPage'
import { StaffOrdersPage } from '@/features/ordering/pages/StaffOrdersPage'
import { StaffOrderDetailPage } from '@/features/ordering/pages/StaffOrderDetailPage'
import { KitchenCookingPage } from '@/features/kitchen/pages/KitchenCookingPage'
import { KitchenSummaryPage } from '@/features/kitchen/pages/KitchenSummaryPage'
import { KitchenReadyPage } from '@/features/kitchen/pages/KitchenReadyPage'
import { KitchenMenuAvailabilityPage } from '@/features/kitchen/pages/KitchenMenuAvailabilityPage'
import { ExpensesPage } from '@/features/expenses/pages/ExpensesPage'
import { PromotionsPage } from '@/features/promotions/pages/PromotionsPage'
import { BillsPage } from '@/features/billing/pages/BillsPage'
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
import { SessionCheckoutPage } from '@/features/billing/pages/SessionCheckoutPage'
import { RestaurantSettingsPage } from '@/features/settings/pages/RestaurantSettingsPage'

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

      {/* Public QR Ordering Routes (Mobile-First) */}
      <Route path="/qr/:qrToken" element={<QrLayout />}>
        <Route index element={<Navigate to="menu" replace />} />
        <Route path="menu" element={<QrMenuPage />} />
        <Route path="cart" element={<QrCartPage />} />
        <Route path="orders" element={<QrOrderTrackingPage />} />
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
              <Route path="/owner/categories/import" element={<MenuExcelImportPage />} />
              <Route path="/owner/menu-items" element={<MenuItemListPage />} />
              <Route path="/owner/menu-items/new" element={<MenuItemCreatePage />} />
              <Route path="/owner/menu-items/:itemId" element={<MenuItemDetailPage />} />
              <Route path="/owner/expenses" element={<ExpensesPage />} />
              <Route path="/owner/promotions" element={<PromotionsPage />} />
              <Route path="/owner/bills" element={<BillsPage />} />
              <Route path="/owner/reports/revenue" element={<RevenueReportPage />} />
              <Route path="/owner/reports/popular-items" element={<PopularItemsReportPage />} />
              <Route path="/owner/reports/profit" element={<ProfitReportPage />} />
              <Route path="/owner/reports/operations" element={<OperationsReportPage />} />
              <Route path="/owner/settings" element={<RestaurantSettingsPage />} />
              <Route path="/owner/qr-tables" element={<OwnerQrTablesPage />} />
              <Route path="/owner/recipes" element={<RecipesPage />} />
            </Route>

            {/* Inventory Staff & Owner Routes */}
            <Route element={<RoleGuard allowedRoles={['INVENTORY_STAFF', 'OWNER']} />}>
              <Route path="/inventory/ingredients" element={<IngredientsPage />} />
              <Route path="/inventory/movements" element={<StockMovementsPage />} />
              <Route path="/inventory/checks" element={<InventoryChecksPage />} />
              <Route path="/inventory/purchases" element={<PurchasesPage />} />
              <Route path="/inventory/purchases/new" element={<CreatePurchasePage />} />
              <Route path="/inventory/purchases/:purchaseId" element={<PurchaseDetailPage />} />
            </Route>

            {/* Service Staff & Owner Routes */}
            <Route element={<RoleGuard allowedRoles={['SERVICE_STAFF', 'OWNER']} />}>
              <Route path="/tables" element={<TablesOverviewPage />} />
              <Route path="/staff/tables" element={<TablesOverviewPage />} />
              <Route path="/staff/active-tables" element={<TablesOverviewPage initialActiveOnly={true} />} />
              <Route path="/tables/:tableId" element={<TableDetailPage />} />
              <Route path="/staff/tables/:tableId" element={<TableDetailPage />} />
              <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
              <Route path="/staff/sessions/:sessionId" element={<SessionDetailPage />} />
              <Route path="/sessions/:sessionId/checkout" element={<SessionCheckoutPage />} />
              <Route path="/staff/sessions/:sessionId/checkout" element={<SessionCheckoutPage />} />
              <Route path="/sessions/history" element={<SessionHistoryPage />} />
              <Route path="/staff/sessions/history" element={<SessionHistoryPage />} />
              <Route path="/sessions/:sessionId/history" element={<SessionHistoryPage />} />
              <Route path="/staff/orders" element={<StaffOrdersPage />} />
              <Route path="/staff/qr-orders" element={<StaffQrOrdersPage />} />
              <Route path="/staff/orders/:orderId" element={<StaffOrderDetailPage />} />
              <Route path="/orders" element={<StaffOrdersPage />} />
              <Route path="/orders/:orderId" element={<StaffOrderDetailPage />} />
            </Route>

            {/* Common Authenticated Routes */}
            <Route path="/profile" element={<ProfilePage defaultTab="profile" />} />
            <Route path="/profile/change-password" element={<ProfilePage defaultTab="password" />} />
            <Route path="/settings/change-password" element={<ProfilePage defaultTab="password" />} />
          </Route>
        </Route>

        {/* Kitchen Layout (KDS) & Recipes */}
        <Route
          element={<RoleGuard allowedRoles={['KITCHEN_STAFF', 'OWNER']} />}
        >
          <Route element={<KitchenLayout />}>
            <Route path="/kitchen" element={<Navigate to="/kitchen/cooking" replace />} />
            <Route path="/kitchen/queue" element={<Navigate to="/kitchen/cooking" replace />} />
            <Route path="/kitchen/orders/:orderId" element={<Navigate to="/kitchen/cooking" replace />} />
            <Route path="/kitchen/cooking" element={<KitchenCookingPage />} />
            <Route path="/kitchen/summary" element={<KitchenSummaryPage />} />
            <Route path="/kitchen/ready" element={<KitchenReadyPage />} />
            <Route path="/kitchen/menu-availability" element={<KitchenMenuAvailabilityPage />} />
            <Route path="/kitchen/recipes" element={<RecipesPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
