import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BellRing,
  ClipboardList,
  ShoppingBag,
  UtensilsCrossed,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { qrApi } from '../api/qrApi'
import { useQrCartStore } from '../store/qrCartStore'
import { subscribeQrTopic } from '../utils/qrStomp'
import type { QrContextResponse, QrOrderRequestResponse } from '../types/qr.types'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/utils/cn'

export function QrLayout() {
  const { qrToken = '' } = useParams<{ qrToken: string }>()
  const queryClient = useQueryClient()
  const syncSession = useQrCartStore((s) => s.syncSession)
  const cartItems = useQrCartStore((s) => s.items)
  const [isCallingStaff, setIsCallingStaff] = useState(false)
  const [isCallStaffModalOpen, setIsCallStaffModalOpen] = useState(false)

  const totalCartQty = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  )

  const {
    data: context,
    isLoading,
    error,
  } = useQuery<QrContextResponse>({
    queryKey: ['qrContext', qrToken],
    queryFn: () => qrApi.resolveContext(qrToken),
    enabled: Boolean(qrToken),
    retry: false,
  })

  useEffect(() => {
    if (context?.sessionId && qrToken) {
      syncSession(qrToken, context.sessionId)
    }
  }, [context?.sessionId, qrToken, syncSession])

  const { data: tracking } = useQuery({
    queryKey: ['qrOrders', qrToken],
    queryFn: () => qrApi.getSessionOrders(qrToken),
    enabled: Boolean(qrToken && context?.sessionId),
    refetchInterval: 15000,
  })

  useEffect(() => {
    if (!qrToken || !context?.sessionId) return

    const unsubSession = subscribeQrTopic<QrOrderRequestResponse | Record<string, unknown>>(
      qrToken,
      `/topic/qr/session/${context.sessionId}`,
      (event) => {
        void queryClient.invalidateQueries({ queryKey: ['qrOrders', qrToken] })
        if (event && 'serviceSessionId' in event) {
          if (event.status === 'CONFIRMED') {
            toast.success('Nhân viên đã xác nhận đơn và gửi xuống bếp!')
          } else if (event.status === 'CANCELLED') {
            toast.warning(
              event.cancellationReason
                ? `Yêu cầu gọi món đã bị hủy: ${event.cancellationReason}`
                : 'Yêu cầu gọi món đã bị hủy bởi nhân viên'
            )
          }
        }
      }
    )

    const unsubMenu = subscribeQrTopic(qrToken, '/topic/menu', () => {
      void queryClient.invalidateQueries({ queryKey: ['qrMenu', qrToken] })
    })

    return () => {
      unsubSession()
      unsubMenu()
    }
  }, [qrToken, context?.sessionId, queryClient])

  const handleConfirmCallStaff = async () => {
    if (!qrToken || isCallingStaff) return
    setIsCallingStaff(true)
    setIsCallStaffModalOpen(false)
    try {
      await qrApi.callStaff(qrToken)
      toast.success('Đã gửi yêu cầu gọi nhân viên phục vụ!')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setTimeout(() => setIsCallingStaff(false), 3000)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-sm text-muted">Đang tải thông tin bàn ăn...</p>
      </div>
    )
  }

  if (error || !context) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-text">Không thể mở thực đơn QR</h1>
        <p className="text-sm text-muted max-w-md">
          {error
            ? getApiErrorMessage(error)
            : 'Mã QR không hợp lệ hoặc chức năng gọi món qua QR đang tạm tắt.'}
        </p>
      </div>
    )
  }

  const activeOrderCount =
    (tracking?.pendingRequests.length || 0) + (tracking?.confirmedOrders.length || 0)

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Responsive Sticky Header */}
      <header className="sticky top-0 z-30 bg-primary text-white shadow-md">
        <div className="w-full max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-accent shrink-0" />
              <span className="font-bold text-sm md:text-base truncate">
                {context.restaurantName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-surface/90">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent/20 text-white font-semibold">
                Bàn {context.tableCode}
              </span>
              {context.area && <span className="truncate">• {context.area}</span>}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCallStaffModalOpen(true)}
            disabled={isCallingStaff}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs md:text-sm font-semibold transition-colors disabled:opacity-60"
          >
            <BellRing className="w-4 h-4 text-yellow-300" />
            <span>{isCallingStaff ? 'Đã gọi' : 'Gọi NV'}</span>
          </button>
        </div>
      </header>

      {/* Responsive Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col">
        <Outlet context={context} />
      </main>

      {/* Bottom Navigation (Responsive across mobile / tablet / desktop) */}
      <nav className="fixed bottom-0 inset-x-0 bg-card border-t border-border h-16 z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="w-full max-w-6xl mx-auto h-full flex items-center justify-around">
          <NavLink
            to={`/qr/${qrToken}/menu`}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full text-xs font-medium transition-colors',
                isActive ? 'text-primary font-semibold' : 'text-muted'
              )
            }
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span>Thực đơn</span>
          </NavLink>

          <NavLink
            to={`/qr/${qrToken}/cart`}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center justify-center gap-1 flex-1 h-full text-xs font-medium transition-colors',
                isActive ? 'text-primary font-semibold' : 'text-muted'
              )
            }
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {totalCartQty > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                  {totalCartQty}
                </span>
              )}
            </div>
            <span>Giỏ hàng</span>
          </NavLink>

          <NavLink
            to={`/qr/${qrToken}/orders`}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center justify-center gap-1 flex-1 h-full text-xs font-medium transition-colors',
                isActive ? 'text-primary font-semibold' : 'text-muted'
              )
            }
          >
            <div className="relative">
              <ClipboardList className="w-5 h-5" />
              {activeOrderCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                  {activeOrderCount}
                </span>
              )}
            </div>
            <span>Đơn bàn</span>
          </NavLink>
        </div>
      </nav>

      {/* Call Staff Confirmation Modal */}
      {isCallStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-sm bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="call-staff-modal-title"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2
                  id="call-staff-modal-title"
                  className="font-bold text-base text-text"
                >
                  Xác nhận gọi nhân viên
                </h2>
                <p className="text-sm text-muted">
                  Bạn muốn gọi nhân viên phục vụ hỗ trợ tại{' '}
                  <span className="font-semibold text-text">Bàn {context.tableCode}</span>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCallStaffModalOpen(false)}
                className="rounded-xl"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleConfirmCallStaff}
                disabled={isCallingStaff}
                className="rounded-xl"
              >
                <BellRing className="w-4 h-4 mr-1.5" />
                Xác nhận gọi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
