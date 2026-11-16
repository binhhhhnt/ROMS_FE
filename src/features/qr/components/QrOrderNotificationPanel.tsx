import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { QrCode, X } from 'lucide-react'
import { toast } from 'sonner'
import { qrApi } from '../api/qrApi'
import type { QrOrderRequestResponse } from '../types/qr.types'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { cn } from '@/shared/utils/cn'

interface QrOrderNotificationPanelProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

export function QrOrderNotificationPanel({
  isOpen,
  onToggle,
  onClose,
}: QrOrderNotificationPanelProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio('/sounds/bell.mp3')
    audioRef.current.volume = 0.7
  }, [])

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['staffPendingQrOrders'],
    queryFn: qrApi.getPendingRequests,
    refetchInterval: 30000,
  })

  useEffect(() => {
    const unsub = subscribeToTopic<QrOrderRequestResponse>(
      '/topic/staff/qr-orders',
      (event) => {
        void queryClient.invalidateQueries({ queryKey: ['staffPendingQrOrders'] })
        if (event?.status === 'PENDING_CONFIRMATION') {
          audioRef.current?.play().catch(() => {
            // Bỏ qua nếu trình duyệt chặn autoplay trước khi có tương tác
          })
          toast.info(`Bàn ${event.tableCode} vừa gửi yêu cầu gọi món QR mới!`)
        }
      }
    )
    return () => unsub()
  }, [queryClient])

  const count = pendingRequests.length

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'relative p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          count > 0
            ? 'text-sky-200 hover:bg-primary-hover'
            : 'text-white/80 hover:bg-primary-hover hover:text-white'
        )}
        title="Yêu cầu gọi món QR"
        aria-label="Yêu cầu gọi món QR"
      >
        <QrCode className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-x-3 top-16 mt-2 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden text-text">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface/40">
              <span className="font-bold text-sm">
                Đơn QR chờ xác nhận ({count})
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-muted hover:text-text rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-border">
              {count === 0 ? (
                <div className="p-4 text-center text-xs text-muted">
                  Không có yêu cầu QR nào đang chờ xác nhận.
                </div>
              ) : (
                pendingRequests.slice(0, 6).map((req) => (
                  <button
                    key={req.id}
                    type="button"
                    onClick={() => {
                      onClose()
                      navigate('/staff/qr-orders')
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-surface/40 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-primary">Bàn {req.tableCode}</span>
                      <span className="text-amber-600">{req.items.length} món</span>
                    </div>
                    <p className="text-xs text-muted truncate mt-0.5">
                      {req.items.map((i) => `${i.quantity}x ${i.menuItemName}`).join(', ')}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
