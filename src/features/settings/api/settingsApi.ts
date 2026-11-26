import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse } from '@/shared/types/api.types'
import type {
  RestaurantSettingResponse,
  UpdateSettingRequest,
  TaxCategoryResponse,
  TaxCategoryRequest,
} from '@/features/settings/types/settings.types'

type RawSettingsResponse = Partial<RestaurantSettingResponse> & {
  menu_price_includes_vat?: boolean
  restaurant_name?: string
  receipt_footer?: string
  print_ready_ticket?: boolean
  print_kitchen_order_ticket?: boolean
  bill_printer_name?: string | null
  bill_paper_size?: 'K80' | 'K58'
  ready_ticket_printer_name?: string | null
  ready_ticket_paper_size?: 'K80' | 'K58'
  qr_ordering_enabled?: boolean
  created_at?: string
  updated_at?: string
}

export const settingsApi = {
  async getSettings(): Promise<RestaurantSettingResponse> {
    const res = await apiClient.get<ApiResponse<RawSettingsResponse>>('/api/settings')
    const raw = res.data.data
    const val = raw?.menuPriceIncludesVat ?? raw?.menu_price_includes_vat ?? true
    return {
      id: raw?.id ?? 1,
      menuPriceIncludesVat: Boolean(val),
      menu_price_includes_vat: Boolean(val),
      restaurantName: raw?.restaurantName ?? raw?.restaurant_name ?? 'Nhà hàng ROMS',
      address: raw?.address ?? '123 Đường Ẩm Thực, TP. Hồ Chí Minh',
      phone: raw?.phone ?? '0901 234 567',
      receiptFooter: raw?.receiptFooter ?? raw?.receipt_footer ?? 'Cảm ơn quý khách và hẹn gặp lại! Wifi: ROMS_VIP / Pass: 88888888',
      printReadyTicket: raw?.printReadyTicket ?? raw?.print_ready_ticket ?? true,
      printKitchenOrderTicket: Boolean(
        raw?.printKitchenOrderTicket ?? raw?.print_kitchen_order_ticket ?? false
      ),
      billPrinterName: raw?.billPrinterName ?? raw?.bill_printer_name ?? null,
      billPaperSize: raw?.billPaperSize ?? raw?.bill_paper_size ?? 'K80',
      readyTicketPrinterName: raw?.readyTicketPrinterName ?? raw?.ready_ticket_printer_name ?? null,
      readyTicketPaperSize: raw?.readyTicketPaperSize ?? raw?.ready_ticket_paper_size ?? 'K80',
      qrOrderingEnabled: raw?.qrOrderingEnabled ?? raw?.qr_ordering_enabled ?? true,
      qr_ordering_enabled: raw?.qrOrderingEnabled ?? raw?.qr_ordering_enabled ?? true,
      createdAt: raw?.createdAt ?? raw?.created_at ?? '',
      updatedAt: raw?.updatedAt ?? raw?.updated_at ?? '',
    }
  },

  async updateSettings(data: UpdateSettingRequest): Promise<RestaurantSettingResponse> {
    const val = Boolean(data.menuPriceIncludesVat ?? data.menu_price_includes_vat)
    const payload = {
      menu_price_includes_vat: val,
      menuPriceIncludesVat: val,
      restaurant_name: data.restaurantName ?? data.restaurant_name,
      address: data.address,
      phone: data.phone,
      receipt_footer: data.receiptFooter ?? data.receipt_footer,
      print_ready_ticket: data.printReadyTicket ?? data.print_ready_ticket,
      print_kitchen_order_ticket:
        data.printKitchenOrderTicket ?? data.print_kitchen_order_ticket,
      printKitchenOrderTicket:
        data.printKitchenOrderTicket ?? data.print_kitchen_order_ticket,
      bill_printer_name: data.billPrinterName ?? data.bill_printer_name,
      bill_paper_size: data.billPaperSize ?? data.bill_paper_size,
      ready_ticket_printer_name: data.readyTicketPrinterName ?? data.ready_ticket_printer_name,
      ready_ticket_paper_size: data.readyTicketPaperSize ?? data.ready_ticket_paper_size,
      qr_ordering_enabled: data.qrOrderingEnabled ?? data.qr_ordering_enabled,
      qrOrderingEnabled: data.qrOrderingEnabled ?? data.qr_ordering_enabled,
    }
    const res = await apiClient.put<ApiResponse<RawSettingsResponse>>('/api/settings', payload)
    const raw = res.data.data
    const resVal = raw?.menuPriceIncludesVat ?? raw?.menu_price_includes_vat ?? val
    return {
      id: raw?.id ?? 1,
      menuPriceIncludesVat: Boolean(resVal),
      menu_price_includes_vat: Boolean(resVal),
      restaurantName: raw?.restaurantName ?? raw?.restaurant_name ?? payload.restaurant_name,
      address: raw?.address ?? payload.address,
      phone: raw?.phone ?? payload.phone,
      receiptFooter: raw?.receiptFooter ?? raw?.receipt_footer ?? payload.receipt_footer,
      printReadyTicket: raw?.printReadyTicket ?? raw?.print_ready_ticket ?? payload.print_ready_ticket,
      printKitchenOrderTicket: Boolean(
        raw?.printKitchenOrderTicket ??
          raw?.print_kitchen_order_ticket ??
          payload.print_kitchen_order_ticket ??
          false
      ),
      billPrinterName: raw?.billPrinterName ?? raw?.bill_printer_name ?? payload.bill_printer_name,
      billPaperSize: raw?.billPaperSize ?? raw?.bill_paper_size ?? payload.bill_paper_size,
      readyTicketPrinterName: raw?.readyTicketPrinterName ?? raw?.ready_ticket_printer_name ?? payload.ready_ticket_printer_name,
      readyTicketPaperSize: raw?.readyTicketPaperSize ?? raw?.ready_ticket_paper_size ?? payload.ready_ticket_paper_size,
      qrOrderingEnabled: raw?.qrOrderingEnabled ?? raw?.qr_ordering_enabled ?? payload.qr_ordering_enabled ?? true,
      qr_ordering_enabled: raw?.qrOrderingEnabled ?? raw?.qr_ordering_enabled ?? payload.qr_ordering_enabled ?? true,
      createdAt: raw?.createdAt ?? raw?.created_at ?? '',
      updatedAt: raw?.updatedAt ?? raw?.updated_at ?? '',
    }
  },

  async getAvailablePrinters(): Promise<string[]> {
    const res = await apiClient.get<ApiResponse<string[]>>('/api/settings/printers')
    return res.data.data ?? []
  },

  async getTaxCategories(): Promise<TaxCategoryResponse[]> {
    const res = await apiClient.get<ApiResponse<TaxCategoryResponse[]>>('/api/tax-categories')
    return res.data.data
  },

  async getTaxCategoryById(id: number): Promise<TaxCategoryResponse> {
    const res = await apiClient.get<ApiResponse<TaxCategoryResponse>>(`/api/tax-categories/${id}`)
    return res.data.data
  },

  async createTaxCategory(data: TaxCategoryRequest): Promise<TaxCategoryResponse> {
    const res = await apiClient.post<ApiResponse<TaxCategoryResponse>>('/api/tax-categories', data)
    return res.data.data
  },
}
