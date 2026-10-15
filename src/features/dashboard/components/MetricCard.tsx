import React from 'react'
import { Card } from '@/shared/components/ui/card'
import { cn } from '@/shared/utils/cn'

interface MetricCardProps {
  title: string
  value: string | number
  subtext?: string
  icon: React.ReactNode
  variant?: 'primary' | 'accent' | 'success' | 'danger' | 'warning' | 'neutral'
  badgeText?: string
  badgeVariant?: 'success' | 'danger' | 'warning' | 'neutral'
  className?: string
}

export function MetricCard({
  title,
  value,
  subtext,
  icon,
  variant = 'primary',
  badgeText,
  badgeVariant = 'neutral',
  className,
}: MetricCardProps) {
  const iconVariants = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/15 text-accent',
    success: 'bg-status-ready/15 text-status-ready',
    danger: 'bg-status-cancelled/15 text-status-cancelled',
    warning: 'bg-status-pending/15 text-status-pending',
    neutral: 'bg-surface text-text',
  }

  const badgeVariants = {
    success: 'bg-status-ready/15 text-status-ready border-status-ready/30',
    danger: 'bg-status-cancelled/15 text-status-cancelled border-status-cancelled/30',
    warning: 'bg-status-pending/15 text-status-pending border-status-pending/30',
    neutral: 'bg-muted-bg text-muted border-border',
  }

  return (
    <Card className={cn('p-5 shadow-xs border border-border flex flex-col justify-between hover:shadow-md transition-shadow text-left', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted tracking-wide">{title}</span>
          <div className="text-2xl font-black font-mono tracking-tight text-text mt-0.5">
            {value}
          </div>
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', iconVariants[variant])}>
          {icon}
        </div>
      </div>

      {(subtext || badgeText) && (
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-border/60 text-xs">
          {badgeText && (
            <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-semibold border', badgeVariants[badgeVariant])}>
              {badgeText}
            </span>
          )}
          {subtext && <span className="text-muted text-[11px] truncate">{subtext}</span>}
        </div>
      )}
    </Card>
  )
}
