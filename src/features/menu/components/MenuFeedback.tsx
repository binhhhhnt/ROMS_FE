import { Button } from '@/shared/components/ui/button'

export function MenuFeedback({ message, retry, loading = false }: {
  message: string
  retry?: () => void
  loading?: boolean
}) {
  return (
    <div role={loading ? 'status' : 'alert'} className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center text-sm">
      <p className={loading ? 'text-muted' : 'text-text'}>{message}</p>
      {retry && <Button variant="outline" onClick={retry}>Thử lại</Button>}
    </div>
  )
}
