import { AlertTriangle, Warehouse, Utensils, ShieldCheck, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import type { DashboardOverviewResponse } from '@/features/dashboard/types/dashboard.types'

interface OperationsCapacityCardProps {
  overview?: DashboardOverviewResponse
  isLoading?: boolean
}

export function OperationsCapacityCard({ overview, isLoading = false }: OperationsCapacityCardProps) {
  const lowStock = overview?.lowStockIngredientsCount || 0
  const activeSessions = overview?.activeSessionsCount || 0

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* 1. Tình trạng Tồn kho & Cảnh báo nguyên liệu */}
      <Card className="shadow-xs border border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              lowStock > 0 ? 'bg-status-cancelled/15 text-status-cancelled' : 'bg-status-ready/15 text-status-ready'
            }`}>
              <Warehouse className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-text">Sức khỏe Kho & Nguyên liệu</CardTitle>
              <p className="text-[11px] text-muted">Cảnh báo tồn kho dưới ngưỡng an toàn</p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            lowStock > 0 ? 'bg-status-cancelled/20 text-status-cancelled' : 'bg-status-ready/20 text-status-ready'
          }`}>
            {lowStock > 0 ? `${lowStock} mặt hàng cần nhập` : 'An toàn'}
          </span>
        </CardHeader>

        <CardContent className="pt-4">
          {isLoading ? (
            <div className="h-20 animate-pulse bg-muted-bg/40 rounded-lg" />
          ) : lowStock > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-status-cancelled/10 border border-status-cancelled/30">
                <AlertTriangle className="w-5 h-5 text-status-cancelled shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-status-cancelled">
                    Có {lowStock} nguyên liệu sắp hết hoặc chạm định mức tối thiểu!
                  </p>
                  <p className="text-muted mt-0.5 leading-relaxed text-[11px]">
                    Việc thiếu hụt nguyên liệu có thể làm gián đoạn khả năng chế biến món tại bếp và tăng tỷ lệ hủy order của khách hàng.
                  </p>
                </div>
              </div>
              <Link
                to="/inventory/ingredients"
                className="text-xs text-secondary hover:underline font-semibold flex items-center gap-1 self-start"
              >
                Kiểm tra danh sách tồn kho <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-status-ready/10 border border-status-ready/30">
              <ShieldCheck className="w-5 h-5 text-status-ready shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-status-ready">
                  Tồn kho nguyên liệu đang ở mức an toàn
                </p>
                <p className="text-muted mt-0.5 text-[11px]">
                  Không có nguyên liệu nào chạm ngưỡng cảnh báo tối thiểu.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Phiên phục vụ tại chỗ */}
      <Card className="shadow-xs border border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-text">Phiên Phục vụ Trực tiếp</CardTitle>
              <p className="text-[11px] text-muted">Bàn đang có thực khách dùng bữa</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary">
            {activeSessions} bàn hoạt động
          </span>
        </CardHeader>

        <CardContent className="pt-4">
          {isLoading ? (
            <div className="h-20 animate-pulse bg-muted-bg/40 rounded-lg" />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-surface/40 border border-border/70">
                <span className="text-muted">Trạng thái phục vụ bàn hiện tại:</span>
                <span className="font-bold text-text">
                  {activeSessions > 0 ? `${activeSessions} bàn đang mở phiên` : 'Chưa có bàn hoạt động'}
                </span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Giám sát phiên phục vụ thời gian thực giúp tối ưu tốc độ quay vòng bàn và nâng cao trải nghiệm khách hàng tại chỗ.
              </p>
              <Link
                to="/staff/active-tables"
                className="text-xs text-secondary hover:underline font-semibold flex items-center gap-1 self-start"
              >
                Xem sơ đồ & bàn đang phục vụ <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
