import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'
import type { GenerateTableQrResponse } from '../types/qr.types'

export function buildTableQrUrl(qrToken: string): string {
  return `${window.location.origin}/qr/${qrToken}/menu`
}

async function renderQrCardCanvas(
  restaurantName: string,
  address: string,
  tableCode: string,
  qrUrl: string
): Promise<string> {
  const width = 560
  const height = 700
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // Card background & border
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 4
  ctx.strokeRect(8, 8, width - 16, height - 16)

  // Header band
  ctx.fillStyle = '#0f2942'
  ctx.fillRect(8, 8, width - 16, 130)

  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.font = 'bold 28px system-ui, -apple-system, Segoe UI, sans-serif'
  ctx.fillText(restaurantName || 'Nhà hàng ROMS', width / 2, 62, width - 60)

  ctx.fillStyle = '#e2e8f0'
  ctx.font = '18px system-ui, -apple-system, Segoe UI, sans-serif'
  ctx.fillText(address || '', width / 2, 102, width - 60)

  // Table name
  ctx.fillStyle = '#0f2942'
  ctx.font = 'bold 36px system-ui, -apple-system, Segoe UI, sans-serif'
  ctx.fillText(`BÀN ${tableCode}`, width / 2, 198, width - 60)

  // QR Canvas
  const qrCanvas = document.createElement('canvas')
  await QRCode.toCanvas(qrCanvas, qrUrl, {
    width: 360,
    margin: 2,
    color: { dark: '#0f2942', light: '#ffffff' },
  })
  ctx.drawImage(qrCanvas, (width - 360) / 2, 230, 360, 360)

  // Footer instruction
  ctx.fillStyle = '#475569'
  ctx.font = '20px system-ui, -apple-system, Segoe UI, sans-serif'
  ctx.fillText('Quét mã QR để xem thực đơn & gọi món', width / 2, 645, width - 60)

  return canvas.toDataURL('image/png')
}

export async function exportTableQrsToPdf(data: GenerateTableQrResponse): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = 210
  const pageHeight = 297
  const cardW = 140
  const cardH = 175
  const x = (pageWidth - cardW) / 2
  const y = (pageHeight - cardH) / 2

  for (let idx = 0; idx < data.tables.length; idx++) {
    const table = data.tables[idx]

    if (idx > 0) {
      doc.addPage()
    }

    const imgData = await renderQrCardCanvas(
      data.restaurantName,
      data.address || '',
      table.tableCode,
      buildTableQrUrl(table.qrToken)
    )
    doc.addImage(imgData, 'PNG', x, y, cardW, cardH)
  }

  doc.save(`QR-Ban-${new Date().toISOString().slice(0, 10)}.pdf`)
}
