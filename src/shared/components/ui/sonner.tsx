import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'border border-border bg-card text-text shadow-lg rounded-lg p-3.5 font-sans text-sm flex items-center gap-3',
          closeButton:
            '!static !transform-none !order-first !self-stretch !w-9 !h-auto !min-h-8 !rounded-md !border !border-border/70 !bg-muted-bg/60 hover:!bg-muted-bg !text-muted hover:!text-text !shrink-0 [&>svg]:!w-4 [&>svg]:!h-4',
          description: 'text-muted text-xs',
          actionButton: 'bg-primary text-white font-medium text-xs px-3 py-1.5 rounded',
          cancelButton: 'bg-muted-bg text-text text-xs px-3 py-1.5 rounded',
          success: 'border-status-completed/30 text-status-completed',
          error: 'border-status-cancelled/30 text-status-cancelled',
          warning: 'border-status-pending/30 text-status-pending',
          info: 'border-accent/30 text-accent',
        },
      }}
    />
  )
}
