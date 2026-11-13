import { Bell, BellRing, Check, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useStaffCallStore, type StaffCallRequest } from '../store/staffCallStore'
import { staffCallApi } from '../api/staffCallApi'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/utils/cn'

export function StaffCallPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { pendingCalls, addCall, removeCall } = useStaffCallStore()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Thiết lập audio thông báo
  useEffect(() => {
    audioRef.current = new Audio('/sounds/bell.mp3')
    audioRef.current.volume = 0.7
  }, [])

  // Subscribe STOMP: lắng nghe cuộc gọi mới & sự kiện đã xác nhận
  useEffect(() => {
    const unsubCall = subscribeToTopic<StaffCallRequest>(
      '/topic/service/staff-calls',
      (data) => {
        if (!data || !data.requestId) return
        addCall(data)
        setIsOpen(true) // Tự động mở panel để nhân viên dễ thấy
        audioRef.current?.play().catch(() => {
          // Bỏ qua lỗi nếu trình duyệt chặn autoplay trước tương tác
        })
        toast.info(`Bàn ${data.tableCode} đang gọi nhân viên!`)
      }
    )

    const unsubAck = subscribeToTopic<{
      requestId: string
      tableCode: string
      acknowledgedBy: string
    }>('/topic/service/staff-calls-ack', (data) => {
      if (!data || !data.requestId) return
      removeCall(data.requestId)
      toast.success(
        `Bàn ${data.tableCode} đã được tiếp nhận bởi ${data.acknowledgedBy}`
      )
    })

    return () => {
      unsubCall()
      unsubAck()
    }
  }, [addCall, removeCall])

  const handleAcknowledge = async (call: StaffCallRequest) => {
    try {
      await staffCallApi.acknowledgeCall(call.tableId, call.requestId)
    } catch {
      toast.error('Không thể xác nhận yêu cầu. Vui lòng thử lại.')
    }
  }

  const badgeCount = pendingCalls.length

  return (
    <div className="relative">
      {/* Nút chuông thông báo trên Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'relative p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          badgeCount > 0
            ? 'text-yellow-300 hover:bg-primary-hover animate-pulse'
            : 'text-white/80 hover:bg-primary-hover hover:text-white'
        )}
        title="Yêu cầu gọi nhân viên"
        aria-label="Yêu cầu gọi nhân viên"
      >
        {badgeCount > 0 ? (
          <BellRing className="w-5 h-5 text-accent" />
        ) : (
          <Bell className="w-5 h-5" />
        )}

        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-status-cancelled text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel hiển thị danh sách yêu cầu gọi */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in-50 duration-200">
            {/* Header của Panel */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-accent" />
                <span className="font-semibold text-sm text-text">
                  Yêu cầu gọi nhân viên
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted hover:text-text p-1 rounded transition-colors"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Danh sách yêu cầu */}
            <div className="max-h-72 overflow-y-auto divide-y divide-border">
              {pendingCalls.length === 0 ? (
                <div className="p-6 text-center text-muted text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Hiện không có yêu cầu nào
                </div>
              ) : (
                pendingCalls.map((call, idx) => (
                  <div
                    key={call.requestId}
                    className={cn(
                      'flex items-center justify-between p-3.5 transition-colors',
                      idx % 2 === 0 ? 'bg-card hover:bg-surface/60' : 'bg-surface/30 hover:bg-surface/70'
                    )}
                  >
                    <div>
                      <p className="font-bold text-sm text-primary">
                        Bàn {call.tableCode}
                      </p>
                      <p className="text-[11px] text-muted mt-0.5">
                        {new Date(call.requestedAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleAcknowledge(call)}
                      className="text-xs h-8 px-3 gap-1 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Đã biết
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

