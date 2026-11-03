import { useEffect, useRef, useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { getMenuErrorMessage } from '../utils/menu'

export function MenuConfirmationDialog({ title, description, confirmLabel, destructive = false, onConfirm, onClose, getErrorMessage = getMenuErrorMessage }: {
  title: string; description: string; confirmLabel: string; destructive?: boolean
  onConfirm: () => Promise<void>; onClose: () => void
  getErrorMessage?: (error: unknown) => string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const saving = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const dialog = ref.current
    const previousFocus = document.activeElement
    dialog?.showModal()
    return () => {
      dialog?.close()
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [])

  const confirm = async () => {
    if (saving.current) return
    saving.current = true
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (failure) {
      setError(getErrorMessage(failure))
    } finally {
      saving.current = false
      setBusy(false)
    }
  }

  return (
    <dialog ref={ref} aria-labelledby="menu-confirm-title" aria-describedby="menu-confirm-description"
      onCancel={(event) => { event.preventDefault(); event.stopPropagation(); if (!saving.current) onClose() }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] min-w-0 max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-6 text-left whitespace-normal text-text shadow-xl [overflow-wrap:anywhere] backdrop:bg-primary/40">
      <h2 id="menu-confirm-title" className="text-xl font-bold text-primary">{title}</h2>
      <p id="menu-confirm-description" className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
      {error && <p role="alert" className="mt-4 text-sm text-status-cancelled">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button type="button" autoFocus variant="outline" className="h-auto min-h-10 whitespace-normal py-2" disabled={busy} onClick={onClose}>Hủy</Button>
        <Button type="button" variant={destructive ? 'destructive' : 'primary'} className="h-auto min-h-10 max-w-full whitespace-normal py-2" isLoading={busy} onClick={() => void confirm()}>{confirmLabel}</Button>
      </div>
    </dialog>
  )
}
