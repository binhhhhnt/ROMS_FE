export interface RestaurantSettingResponse {
  id: number
  menuPriceIncludesVat: boolean
  menu_price_includes_vat?: boolean
  restaurantName?: string
  restaurant_name?: string
  address?: string
  phone?: string
  receiptFooter?: string
  receipt_footer?: string
  printReadyTicket?: boolean
  print_ready_ticket?: boolean
  billPrinterName?: string | null
  bill_printer_name?: string | null
  billPaperSize?: 'A5' | 'K80' | 'K58'
  bill_paper_size?: 'A5' | 'K80' | 'K58'
  readyTicketPrinterName?: string | null
  ready_ticket_printer_name?: string | null
  readyTicketPaperSize?: 'A5' | 'K80' | 'K58'
  ready_ticket_paper_size?: 'A5' | 'K80' | 'K58'
  createdAt?: string
  updatedAt?: string
  updated_at?: string
}

export interface UpdateSettingRequest {
  menuPriceIncludesVat: boolean
  menu_price_includes_vat?: boolean
  restaurantName?: string
  restaurant_name?: string
  address?: string
  phone?: string
  receiptFooter?: string
  receipt_footer?: string
  printReadyTicket?: boolean
  print_ready_ticket?: boolean
  billPrinterName?: string | null
  bill_printer_name?: string | null
  billPaperSize?: 'A5' | 'K80' | 'K58'
  bill_paper_size?: 'A5' | 'K80' | 'K58'
  readyTicketPrinterName?: string | null
  ready_ticket_printer_name?: string | null
  readyTicketPaperSize?: 'A5' | 'K80' | 'K58'
  ready_ticket_paper_size?: 'A5' | 'K80' | 'K58'
}

export interface TaxCategoryResponse {
  id: number
  rate: number
  createdAt: string
  updatedAt: string
}

export interface TaxCategoryRequest {
  rate: number
}
