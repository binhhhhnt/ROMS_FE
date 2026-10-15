import { NavLink } from 'react-router-dom'
import { DollarSign, Flame, PieChart, Activity } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface TabItem {
  name: string
  to: string
  icon: React.ComponentType<{ className?: string }>
}

const TABS: TabItem[] = [
  {
    name: 'Báo cáo Doanh thu',
    to: '/owner/reports/revenue',
    icon: DollarSign,
  },
  {
    name: 'Món bán chạy',
    to: '/owner/reports/popular-items',
    icon: Flame,
  },
  {
    name: 'Chi phí & Lợi nhuận',
    to: '/owner/reports/profit',
    icon: PieChart,
  },
  {
    name: 'Hiệu suất Vận hành',
    to: '/owner/reports/operations',
    icon: Activity,
  },
]

export function ReportNavTabs() {
  return (
    <div className="flex items-center gap-1.5 border-b border-border overflow-x-auto pb-px text-xs font-semibold">
      {TABS.map((tab) => {
        const Icon = tab.icon
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all whitespace-nowrap cursor-pointer rounded-t-lg',
                isActive
                  ? 'border-accent text-primary bg-surface/40 font-bold'
                  : 'border-transparent text-muted hover:text-text hover:bg-surface/20'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{tab.name}</span>
          </NavLink>
        )
      })}
    </div>
  )
}
