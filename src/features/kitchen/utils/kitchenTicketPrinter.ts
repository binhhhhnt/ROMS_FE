import { formatPrintDateTime, printHtmlViaIframe } from '@/shared/utils/browserPrinter'

export interface KitchenTicketItem {
  itemName: string
  quantity: number
  note?: string | null
}

export interface KitchenReadyTicketPrintData {
  tableCode: string
  orderId: number
  orderCreatedAt?: string
  items: KitchenTicketItem[]
  paperSize?: 'K80' | 'K58' | 'A5'
}

export function printKitchenReadyTicketViaBrowser(data: KitchenReadyTicketPrintData) {
  if (!data.items || data.items.length === 0) return

  const paperSize = data.paperSize || 'K80'
  const isA5 = paperSize === 'A5'
  const isK58 = paperSize === 'K58'

  const bodyWidth = isA5 ? '100%' : isK58 ? '52mm' : '72mm'
  const fontSize = isA5 ? '13px' : isK58 ? '10px' : '11.5px'
  const tableTitleSize = isA5 ? '20px' : isK58 ? '15px' : '17px'
  const statusBannerSize = isA5 ? '22px' : isK58 ? '15px' : '18px'

  const pageSizeCss = isA5
    ? '@page { size: A5 portrait; margin: 10mm; }'
    : isK58
      ? '@page { size: 58mm auto; margin: 2mm; }'
      : '@page { size: 80mm auto; margin: 3mm; }'

  const formattedOrderAt = formatPrintDateTime(data.orderCreatedAt)
  const formattedCompletedAt = formatPrintDateTime(new Date().toISOString())

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PHIẾU RA MÓN - ${data.tableCode}</title>
  <style>
    ${pageSizeCss}
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: ${fontSize};
      line-height: 1.4;
      color: #000;
      width: ${bodyWidth};
      margin: 0 auto;
      padding: 4px;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .table-header { font-size: ${tableTitleSize}; font-weight: 800; margin-bottom: 2px; }
    .meta { font-size: ${isK58 ? '9px' : '10.5px'}; margin-bottom: 2px; }
    .banner { font-size: ${statusBannerSize}; font-weight: 800; margin: 6px 0; letter-spacing: 0.5px; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .divider-solid { border-top: 1px solid #000; margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: ${isK58 ? '9.5px' : '11px'}; padding-bottom: 4px; }
    td { padding: 4px 0; vertical-align: top; font-size: ${isK58 ? '11px' : '12.5px'}; font-weight: 700; }
    .note { font-size: ${isK58 ? '9px' : '10.5px'}; font-weight: 400; font-style: italic; margin-top: 2px; }
    .footer { font-size: ${isK58 ? '8.5px' : '10px'}; font-style: italic; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="text-center">
    <div class="table-header">BÀN: ${data.tableCode}</div>
    <div class="meta">Mã order: #${data.orderId}</div>
    ${formattedOrderAt ? `<div class="meta">Đặt lúc: ${formattedOrderAt}</div>` : ''}
    <div class="banner">--- ĐÃ XONG ---</div>
  </div>

  <div class="divider"></div>

  <table>
    <thead>
      <tr>
        <th style="width: 78%">Tên món</th>
        <th class="text-right" style="width: 22%">SL</th>
      </tr>
    </thead>
    <tbody>
      <tr><td colspan="2" style="padding: 0;"><div class="divider-solid"></div></td></tr>
      ${data.items
        .map(
          (item) => `
        <tr>
          <td>
            <div>${item.itemName}</div>
            ${item.note ? `<div class="note">* Ghi chú: ${item.note}</div>` : ''}
          </td>
          <td class="text-right">x${item.quantity}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="divider"></div>
  <div class="text-center footer">Giờ hoàn tất: ${formattedCompletedAt}</div>
</body>
</html>
  `

  printHtmlViaIframe(html)
}
