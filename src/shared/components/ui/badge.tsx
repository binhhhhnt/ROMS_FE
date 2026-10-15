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
    default: 'bg-primary text-white',
    secondary: 'bg-surface text-text',
    outline: 'border border-border text-text',
    pending: 'bg-status-pending/15 text-status-pending border border-status-pending/30',
    cooking: 'bg-status-cooking/15 text-status-cooking border border-status-cooking/30',
    ready: 'bg-status-ready/15 text-status-ready border border-status-ready/30',
    completed: 'bg-status-completed/15 text-status-completed border border-status-completed/30',
    cancelled: 'bg-status-cancelled/15 text-status-cancelled border border-status-cancelled/30',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
