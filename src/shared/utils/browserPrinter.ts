export function formatPrintDateTime(value?: string): string {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  const hh = pad(parsed.getHours())
  const min = pad(parsed.getMinutes())
  const dd = pad(parsed.getDate())
  const mm = pad(parsed.getMonth() + 1)
  const yyyy = parsed.getFullYear()
  return `${hh}:${min} ${dd}/${mm}/${yyyy}`
}

let printQueue: Promise<void> = Promise.resolve()

function runSingleIframePrint(html: string): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const win = iframe.contentWindow
    const doc = win?.document
    if (!win || !doc) {
      iframe.remove()
      resolve()
      return
    }

    let finished = false
    const cleanup = () => {
      if (finished) return
      finished = true
      setTimeout(() => {
        iframe.remove()
        resolve()
      }, 200)
    }

    doc.open()
    doc.write(html)
    doc.close()

    setTimeout(() => {
      try {
        win.addEventListener('afterprint', cleanup, { once: true })
        win.focus()
        win.print()
      } catch {
        cleanup()
        return
      }
      // Fallback nếu browser/kiosk không bắn sự kiện afterprint
      setTimeout(cleanup, 2500)
    }, 250)
  })
}

export function printHtmlViaIframe(html: string): Promise<void> {
  const next = printQueue.then(() => runSingleIframePrint(html))
  // Đảm bảo một lần in lỗi không làm kẹt các phiếu tiếp theo trong hàng đợi
  printQueue = next.catch(() => {})
  return next
}
