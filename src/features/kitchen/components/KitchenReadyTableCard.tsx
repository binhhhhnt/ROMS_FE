import { Printer } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '@/features/settings/api/settingsApi'
import { printKitchenReadyTicketViaBrowser } from '@/features/kitchen/utils/kitchenTicketPrinter'
import { Button } from '@/shared/components/ui/button'
import type { KitchenOrderResponse } from '@/features/kitchen/types/kitchen.types'
import type { OrderItemResponse } from '@/features/ordering/types/ordering.types'

interface KitchenReadyTableCardProps {
  order: KitchenOrderResponse
  readyItems: OrderItemResponse[]
}

export function KitchenReadyTableCard({
  order,
  readyItems,
}: KitchenReadyTableCardProps) {
  const { data: settings } = useQuery({
    queryKey: ['restaurant-settings'],
    queryFn: () => settingsApi.getSettings(),
  })

  const handlePrintReadyTicket = () => {
    printKitchenReadyTicketViaBrowser({
      tableCode: order.tableCode || `Bàn #${order.tableId}`,
      orderId: order.id,
      orderCreatedAt: order.createdAt,
      items: readyItems.map((i) => ({
        itemName: i.menuItemName,
        quantity: i.quantity,
        note: i.note,
      })),
      paperSize: (settings?.readyTicketPaperSize as 'K80' | 'K58' | 'A5') || 'K80',
    })
  }
  const formatTime = (isoString?: string) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div className="bg-card border border-border border-t-4 border-t-status-ready rounded-lg overflow-hidden flex flex-col">
      {/* Header (Hàng cha: bg-surface/60) */}
      <div className="bg-surface/60 px-4 py-3 border-b border-border flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-base text-text">
              {order.tableCode ? `Bàn ${order.tableCode}` : `Bàn #${order.tableId}`}
            </span>
          </div>
          <div className="text-xs text-muted mt-0.5">
            Ra quầy lúc {formatTime(order.updatedAt || order.createdAt)}
          </div>
        </div>

        {/* Ready Badge */}
        <span className="px-2.5 py-0.5 rounded-md bg-status-ready/10 border border-status-ready/30 text-status-ready text-xs font-medium shrink-0">
          {readyItems.length} món chờ bưng
        </span>
      </div>

      {/* Ready Items List */}
      <div className="divide-y divide-border bg-card flex-1">
        {readyItems.map((item) => (
          <div
            key={item.id}
            className="px-4 py-3 flex items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1 flex items-start gap-3">
              <span className="font-mono font-bold text-base text-text shrink-0 w-9 pt-0.5 tabular-nums">
                {item.quantity}x
              </span>
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-sm text-text block leading-snug">
                  {item.menuItemName}
                </span>
                {item.note && (
                  <p className="text-xs text-text mt-1">
                    <span className="font-semibold">Ghi chú:</span> {item.note}
                  </p>
                )}
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-md bg-status-ready/10 text-status-ready border border-status-ready/30 text-xs font-medium shrink-0">
              Chờ bưng
            </span>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="bg-card px-4 py-3 border-t border-border flex items-center justify-between gap-3 text-xs text-muted mt-auto">
        <span>
          Tổng <strong className="text-text font-mono">{readyItems.reduce((s, i) => s + i.quantity, 0)}</strong> suất tại quầy
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePrintReadyTicket}
          className="h-7 px-2.5 text-xs"
        >
          <Printer className="w-3.5 h-3.5 mr-1" />
          In phiếu
        </Button>
      </div>
    </div>
  )
}
export default KitchenReadyTableCard
