export interface DashboardOverviewResponse {
  totalRevenue: number
  totalExpenses: number
  totalPurchases: number
  netProfit: number
  completedOrdersCount: number
  cancelledOrdersCount: number
  activeSessionsCount: number
  lowStockIngredientsCount: number
  startDate: string
  endDate: string
}

export interface BestSellingDishResponse {
  menuItemId: number
  menuItemName: string
  quantitySold: number
  totalRevenue: number
}

export interface DailyRevenueExpenseResponse {
  date: string
  revenue: number
  expenses: number
  purchases: number
  netProfit: number
}

export interface DashboardFilterParams {
  startDate?: string
  endDate?: string
  limit?: number
}
