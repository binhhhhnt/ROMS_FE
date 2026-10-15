export interface DailyRevenueItem {
  date: string
  revenue: number
  expenses: number
  purchases: number
  netProfit: number
  percentageOfTotal?: number
  growthRate?: number | null // percentage growth vs previous day
}

export interface RevenueSummary {
  totalRevenue: number
  averageDailyRevenue: number
  highestRevenueDate: string | null
  highestRevenueAmount: number
  lowestRevenueDate: string | null
  lowestRevenueAmount: number
  totalDays: number
  completedOrdersCount: number
}

export interface ReportFilterParams {
  startDate?: string
  endDate?: string
}
