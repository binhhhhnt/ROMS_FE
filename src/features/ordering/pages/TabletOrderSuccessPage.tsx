import { useLocation, Link, Navigate } from 'react-router-dom'
import { CheckCircle2, Clock, Utensils, Info, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/app/store/authStore'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent } from '@/shared/components/ui/card'

interface SuccessState {
  orderId?: number
  tableCode?: string
  totalAmount?: number
  itemCount?: number
}

export function TabletOrderSuccessPage() {
  const location = useLocation()
  const { user } = useAuthStore()

  const state = location.state as SuccessState | undefined

  const formatPrice = (amount?: number) => {
    if (amount === undefined || amount === null) return '0 đ'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  // If page is accessed directly without state, we can still show a friendly message or redirect
  const orderId = state?.orderId || 1
  const tableCode =
    state?.tableCode || user?.tableName || (user?.tableId ? `Bàn ${user.tableId}` : 'Bàn T01')
  const totalAmount = state?.totalAmount ?? 0
  const itemCount = state?.itemCount ?? 1

  const currentTime = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date())

  // If user directly browses here without any previous action and no user, navigate back
  if (!user && !state) {
    return <Navigate to="/tablet/cart" replace />
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center text-center py-6 sm:py-10 pb-16">
      {/* Success Animated Icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-status-ready/15 flex items-center justify-center text-status-ready shadow-inner">
          <CheckCircle2 className="w-14 h-14 text-status-ready animate-in zoom-in-75 duration-300" />
        </div>
        <div className="absolute -inset-1 rounded-full border-2 border-status-ready/30 animate-pulse pointer-events-none" />
      </div>

      {/* Main Title & Subtitle */}
      <h2 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight mb-2">
        Đã gửi đơn vào bếp thành công!
      </h2>
      <p className="text-sm text-muted max-w-md mb-8 leading-relaxed">
        Nhà bếp đã nhận được danh sách món ăn của quý khách và sẽ tiến hành chuẩn bị theo đúng thứ tự.
      </p>

      {/* Order Info Card */}
      <Card className="w-full text-left shadow-md border-border mb-6 overflow-hidden">
        <div className="bg-surface/40 p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-text">Mã đơn: #{orderId}</span>
          </div>
          <Badge variant="pending" className="px-2.5 py-1">
            Chờ tiếp nhận
          </Badge>
        </div>

        <CardContent className="p-5 sm:p-6 divide-y divide-border/60 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-3 text-sm">
            <span className="text-muted">Vị trí bàn:</span>
            <span className="font-bold text-text bg-surface px-2.5 py-1 rounded">
              {tableCode}
            </span>
          </div>

          <div className="flex items-center justify-between py-3 text-sm">
            <span className="text-muted">Thời gian đặt món:</span>
            <span className="font-medium text-text">{currentTime}</span>
          </div>

          <div className="flex items-center justify-between py-3 text-sm">
            <span className="text-muted">Số lượng món đã gọi:</span>
            <span className="font-medium text-text">{itemCount} phần</span>
          </div>

          <div className="flex items-baseline justify-between pt-3 text-base">
            <span className="font-semibold text-text">Tạm tính:</span>
            <span className="font-black text-xl text-primary">
              {formatPrice(totalAmount)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Out-of-scope Policy Disclaimer */}
      <div className="w-full p-4 bg-surface/50 border border-surface rounded-xl flex items-start gap-3 text-left mb-8 text-xs text-text/80 leading-relaxed">
        <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <p>
          <strong className="text-text font-semibold">Lưu ý:</strong> Đây là thông báo xác nhận đơn đặt món đã gửi vào bếp, <span className="underline">chưa phải hóa đơn thanh toán</span>. Quý khách vui lòng thanh toán tại quầy thu ngân khi dùng xong bữa.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full">
        <Link to="/tablet/orders" className="w-full sm:w-1/2">
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full font-bold shadow-md uppercase tracking-wider text-sm h-12"
          >
            <Clock className="w-4 h-4 mr-2" />
            Theo dõi trạng thái món
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>

        <Link to="/tablet/menu" className="w-full sm:w-1/2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full font-semibold text-sm h-12 hover:bg-surface/50"
          >
            <Utensils className="w-4 h-4 mr-2 text-accent" />
            Tiếp tục xem thực đơn
          </Button>
        </Link>
      </div>
    </div>
  )
}
export default TabletOrderSuccessPage
