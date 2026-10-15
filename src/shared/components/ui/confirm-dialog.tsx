import React, { useEffect } from 'react'
import { AlertTriangle, AlertCircle, HelpCircle, X } from 'lucide-react'
import { Button } from './button'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoading, onClose])

  if (!isOpen) return null

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <div className="w-10 h-10 rounded-full bg-status-cancelled/15 text-status-cancelled flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        )
      case 'warning':
        return (
          <div className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        )
      case 'primary':
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
        )
    }
  }

  const getConfirmButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-status-cancelled hover:bg-status-cancelled/90 text-white shadow-sm'
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
      case 'primary':
      default:
        return ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              {getIcon()}
              <div>
                <h3 className="font-bold text-base text-text leading-6">{title}</h3>
                <div className="text-xs text-muted mt-1.5 leading-relaxed">{description}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="text-muted hover:text-text p-1 rounded-lg hover:bg-surface transition-colors shrink-0"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="text-xs"
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              variant={variant === 'primary' ? 'primary' : 'outline'}
              size="sm"
              onClick={onConfirm}
              disabled={isLoading}
              className={`text-xs font-semibold px-4 ${getConfirmButtonClass()}`}
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
