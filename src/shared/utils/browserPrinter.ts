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

export function printHtmlViaIframe(html: string) {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) return

  doc.open()
  doc.write(html)
  doc.close()

  setTimeout(() => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 1000)
  }, 300)
}
