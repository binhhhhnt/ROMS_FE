import { formatPrintDateTime, printHtmlViaIframe } from '@/shared/utils/browserPrinter'

export interface ReceiptItem {
  index: number
  itemName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface ReceiptTaxRow {
  rate: number
  amount: number
}

export interface ReceiptPaymentRow {
  method: string
  amount: number
}

export interface ReceiptPrintData {
  title: 'PHIẾU TẠM TÍNH' | 'HÓA ĐƠN THANH TOÁN'
  restaurantName?: string
  address?: string
  phone?: string
  receiptFooter?: string
  cashierName?: string
  tableCode: string
  openedAt?: string
  closedAt?: string
  billCode?: string
  items: ReceiptItem[]
  amountBeforeDiscount: number
  discountAmount?: number
  promotionCode?: string
  surchargeAmount?: number
  surchargeNote?: string | null
  taxRows?: ReceiptTaxRow[]
  totalAmount: number
  payments?: ReceiptPaymentRow[]
  paperSize?: 'K80' | 'K58' | 'A5'
}

export interface GroupableBillItem {
  itemName: string
  quantity: number
  unitPrice: number
  subtotal?: number
  taxRate?: number
}

export function groupBillingItems<T extends GroupableBillItem>(items: T[]): T[] {
  const map = new Map<string, T>()

  for (const item of items) {
    const key = `${item.itemName}__${item.unitPrice}__${item.taxRate ?? 0}`
    const itemSubtotal = item.subtotal ?? item.unitPrice * item.quantity
    const existing = map.get(key)

    if (existing) {
      const nextQty = existing.quantity + item.quantity
      const existingSubtotal = existing.subtotal ?? existing.unitPrice * existing.quantity
      map.set(key, {
        ...existing,
        quantity: nextQty,
        subtotal: existingSubtotal + itemSubtotal,
      })
    } else {
      map.set(key, {
        ...item,
        subtotal: itemSubtotal,
      })
    }
  }

  return Array.from(map.values())
}

export function buildReceiptHtml(data: ReceiptPrintData): string {
  const groupedItems: ReceiptItem[] = groupBillingItems(data.items).map((item, idx) => ({
    ...item,
    index: idx + 1,
  }))
  const normalizedData: ReceiptPrintData = {
    ...data,
    items: groupedItems,
  }
  const paperSize = data.paperSize || 'K80'
  const isA5 = paperSize === 'A5'
  const isK58 = paperSize === 'K58'

  const bodyWidth = isA5 ? '100%' : isK58 ? '52mm' : '72mm'
  const fontSize = isA5 ? '13px' : isK58 ? '9.5px' : '11px'
  const titleSize = isA5 ? '18px' : isK58 ? '13px' : '15px'
  const totalSize = isA5 ? '16px' : isK58 ? '12px' : '14px'

  const pageSizeCss = isA5
    ? '@page { size: A5 portrait; margin: 10mm; }'
    : isK58
      ? '@page { size: 58mm auto; margin: 2mm; }'
      : '@page { size: 80mm auto; margin: 3mm; }'

  const formatVnd = (num: number) => num.toLocaleString('vi-VN') + ' đ'

  const formattedOpenedAt = formatPrintDateTime(data.openedAt)
  const formattedClosedAt = formatPrintDateTime(data.closedAt)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${data.title} - ${data.tableCode}</title>
  <style>
    ${pageSizeCss}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: ${fontSize};
      line-height: 1.35;
      color: #000;
      background: #fff;
      width: ${bodyWidth};
      margin: 0 auto;
      padding: ${isA5 ? '0' : '4px 2px'};
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: bold; }
    .divider {
      border-bottom: 1px dashed #444;
      margin: 5px 0;
    }
    .divider-double {
      border-bottom: 2px solid #000;
      margin: 6px 0;
    }
    .store-name {
      font-size: ${titleSize};
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .receipt-title {
      font-size: ${titleSize};
      font-weight: 800;
      margin: 6px 0 4px 0;
      letter-spacing: 0.5px;
    }
    .meta-table {
      width: 100%;
      margin: 4px 0;
      font-size: ${fontSize};
    }
    .meta-table td {
      padding: 1px 0;
      vertical-align: top;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0;
      font-size: ${fontSize};
    }
    .items-table th {
      border-bottom: 1px dashed #000;
      padding: 4px 0;
      font-weight: bold;
    }
    .items-table td {
      padding: 3px 0;
      vertical-align: top;
    }
    .summary-table {
      width: 100%;
      margin: 4px 0;
      font-size: ${fontSize};
    }
    .summary-table td {
      padding: 2px 0;
      vertical-align: top;
      word-break: break-word;
    }
    .summary-table td.text-right {
      white-space: nowrap;
      padding-left: 8px;
    }
    .total-row {
      font-size: ${totalSize};
      font-weight: 800;
    }
    .footer-text {
      font-style: italic;
      margin-top: 6px;
      font-size: ${isK58 ? '8.5px' : '9.5px'};
      color: #333;
    }
    @media screen {
      body {
        padding: 20px;
        box-shadow: 0 0 10px rgba(0,0,0,0.15);
        background: #fff;
      }
    }
  </style>
</head>
<body>
  <!-- Header: Store Info -->
  <div class="text-center">
    <div class="store-name">${data.restaurantName || 'Nhà hàng ROMS'}</div>
    ${data.address ? `<div>${data.address}</div>` : ''}
    ${data.phone ? `<div>Hotline: ${data.phone}</div>` : ''}
  </div>

  <div class="divider"></div>

  <!-- Title -->
  <div class="text-center receipt-title">${data.title}</div>

  <!-- Metadata -->
  <table class="meta-table">
    <tr>
      <td class="font-bold">Bàn: ${data.tableCode}</td>
    </tr>
    ${data.billCode
      ? `
    <tr>
      <td>Mã HĐ: ${data.billCode}</td>
    </tr>
    `
      : ''
    }
    <tr>
      <td>Thu ngân: ${data.cashierName || 'Thu ngân'}</td>
    </tr>
    ${formattedOpenedAt
      ? `
    <tr>
      <td>Thời gian vào: ${formattedOpenedAt}</td>
    </tr>
    `
      : ''
    }
    ${formattedClosedAt
      ? `
    <tr>
      <td>Thời gian ra: ${formattedClosedAt}</td>
    </tr>
    `
      : ''
    }
  </table>

  <div class="divider"></div>

  <!-- Items Table -->
  <table class="items-table">
    <thead>
      <tr>
        <th class="text-left" style="width: 8%">#</th>
        <th class="text-left" style="width: 44%">Món</th>
        <th class="text-center" style="width: 12%">SL</th>
        <th class="text-right" style="width: 18%">Đ.Giá</th>
        <th class="text-right" style="width: 18%">T.Tiền</th>
      </tr>
    </thead>
    <tbody>
      ${normalizedData.items
      .map(
        (item) => `
        <tr>
          <td>${item.index}</td>
          <td>${item.itemName}</td>
          <td class="text-center font-bold">${item.quantity}</td>
          <td class="text-right">${item.unitPrice.toLocaleString('vi-VN')}</td>
          <td class="text-right font-bold">${item.subtotal.toLocaleString('vi-VN')}</td>
        </tr>
      `
      )
      .join('')}
    </tbody>
  </table>

  <div class="divider"></div>

  <!-- Summary -->
  <table class="summary-table">
    <tr>
      <td>Tổng tiền món:</td>
      <td class="text-right font-bold">${formatVnd(data.amountBeforeDiscount)}</td>
    </tr>
    ${data.discountAmount && data.discountAmount > 0
      ? `
      <tr>
        <td>Khuyến mãi ${data.promotionCode ? `(${data.promotionCode})` : ''}:</td>
        <td class="text-right font-bold text-red-600">-${formatVnd(data.discountAmount)}</td>
      </tr>
    `
      : ''
    }
    ${data.surchargeAmount && data.surchargeAmount > 0
      ? `
      <tr>
        <td>Phụ phí ${data.surchargeNote ? `(${data.surchargeNote})` : ''}:</td>
        <td class="text-right font-bold">+${formatVnd(data.surchargeAmount)}</td>
      </tr>
    `
      : ''
    }
    ${data.taxRows && data.taxRows.length > 0
      ? data.taxRows
        .map(
          (tax) => `
          <tr>
            <td>Thuế VAT (${tax.rate}%):</td>
            <td class="text-right font-bold">${formatVnd(tax.amount)}</td>
          </tr>
        `
        )
        .join('')
      : ''
    }
  </table>

  <div class="divider-double"></div>

  <!-- Grand Total -->
  <table class="summary-table">
    <tr class="total-row">
      <td>TỔNG THANH TOÁN:</td>
      <td class="text-right">${formatVnd(data.totalAmount)}</td>
    </tr>
    ${data.payments && data.payments.length > 0
      ? data.payments
        .map(
          (p) => `
          <tr style="font-size: ${isK58 ? '8.5px' : '10px'}; font-weight: normal;">
            <td>- ${p.method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}:</td>
            <td class="text-right">${formatVnd(p.amount)}</td>
          </tr>
        `
        )
        .join('')
      : ''
    }
  </table>

  <div class="divider"></div>

  <!-- Footer -->
  <div class="text-center footer-text">
    ${data.title === 'PHIẾU TẠM TÍNH' ? '<div>(Phiếu tạm tính dùng đối soát trước khi thanh toán)</div>' : ''}
    ${data.receiptFooter ? `<div>${data.receiptFooter}</div>` : '<div>Cảm ơn Quý khách và Hẹn gặp lại!</div>'}
  </div>
</body>
</html>
  `

  return html
}

export function printReceiptViaBrowser(data: ReceiptPrintData) {
  printHtmlViaIframe(buildReceiptHtml(data))
}

