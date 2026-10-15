import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            'border border-border bg-card text-text shadow-lg rounded-lg p-4 font-sans text-sm',
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
