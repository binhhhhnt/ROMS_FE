import * as React from 'react'
import { cn } from '@/shared/utils/cn'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'outline'
    | 'pending'
    | 'cooking'
    | 'ready'
    | 'completed'
    | 'cancelled'
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-primary text-white border border-primary',
    secondary: 'bg-surface text-text border border-border',
    outline: 'border border-border text-text bg-card',
    pending:
      'bg-status-pending/10 text-text border border-status-pending/30',
    cooking:
      'bg-status-cooking/10 text-status-cooking border border-status-cooking/30',
    ready:
      'bg-status-ready/10 text-status-ready border border-status-ready/30',
    completed:
      'bg-status-completed/10 text-status-completed border border-status-completed/25',
    cancelled:
      'bg-status-cancelled/10 text-status-cancelled border border-status-cancelled/25',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
