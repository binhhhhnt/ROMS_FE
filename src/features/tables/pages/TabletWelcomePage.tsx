import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Utensils, Sparkles, ChefHat, ShoppingCart, HelpCircle, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

import { useAuthStore } from '@/app/store/authStore'
import { tableApi } from '@/features/tables/api/tableApi'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'

export function TabletWelcomePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const tableId = user?.tableId

  // Fetch current table status
  const { data: table, isLoading } = useQuery({
    queryKey: ['tabletTableInfo', tableId],
    queryFn: () => tableApi.getTableById(tableId!),
    enabled: !!tableId,
    refetchInterval: 5000,
  })

  // Open session mutation from tablet
  const openSessionMutation = useMutation({
    mutationFn: () => tableApi.openSession(tableId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tabletTableInfo', tableId] })
      toast.success('Bắt đầu phiên phục vụ thành công! Chúc quý khách ngon miệng.')
      navigate('/tablet/menu')
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  const hasActiveSession = !!table?.activeSessionId

  const handleStartOrdering = () => {
    if (hasActiveSession) {
      navigate('/tablet/menu')
    } else if (tableId) {
      openSessionMutation.mutate()
    } else {
      navigate('/tablet/menu')
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto animate-in fade-in-50 duration-300">
      {/* Brand Icon */}
      <div className="w-20 h-20 rounded-3xl bg-primary text-white flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
        <Utensils className="w-10 h-10" />
      </div>

      {/* Table Welcome Banner */}
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface border border-border rounded-full text-xs font-semibold text-primary mb-3">
        <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
        <span>Chào mừng quý khách đến với ROMS</span>
      </div>

      <h1 className="text-3xl font-black text-text tracking-tight uppercase mb-2">
        {user?.tableName || (table ? `Bàn ${table.tableCode}` : 'Bàn của bạn')}
      </h1>

      <p className="text-sm text-muted max-w-md leading-relaxed mb-8">
        Hệ thống gọi món thông minh trực tiếp tại bàn. Quý khách vui lòng chọn món, xem thực đơn và theo dõi tiến độ phục vụ.
      </p>

      {/* Primary Action Button */}
      <div className="w-full flex flex-col gap-3 max-w-sm">
        <Button
          variant="primary"
          size="lg"
          onClick={handleStartOrdering}
          isLoading={openSessionMutation.isPending || isLoading}
          className="w-full h-14 text-sm font-bold uppercase tracking-wider shadow-lg shadow-primary/20"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          {hasActiveSession ? 'Xem thực đơn & Đặt món' : 'Bắt đầu gọi món'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/tablet/orders')}
            className="text-xs"
          >
            <ChefHat className="w-4 h-4 mr-1.5 text-accent" />
            Theo dõi đơn
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => toast.info('Đã gửi thông báo. Nhân viên phục vụ sẽ đến hỗ trợ quý khách ngay!')}
            className="text-xs"
          >
            <HelpCircle className="w-4 h-4 mr-1.5 text-muted" />
            Gọi nhân viên
          </Button>
        </div>
      </div>
    </div>
  )
}
export default TabletWelcomePage
