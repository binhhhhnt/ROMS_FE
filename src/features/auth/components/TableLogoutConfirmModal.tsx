import { useEffect, useState, type FormEvent } from 'react'
import { Eye, EyeOff, Lock, X } from 'lucide-react'
import { authApi } from '@/features/auth/api/authApi'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

interface TableLogoutConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmLogout: () => Promise<void> | void
  username: string
  tableLabel?: string
}

export function TableLogoutConfirmModal({
  isOpen,
  onClose,
  onConfirmLogout,
  username,
  tableLabel,
}: TableLogoutConfirmModalProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setPassword('')
      setShowPassword(false)
      setError('')
      setIsSubmitting(false)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!password) {
      setError('Vui lòng nhập mật khẩu của tài khoản bàn.')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      await authApi.login({ username, password })
      await onConfirmLogout()
    } catch (err) {
      const apiMsg = getApiErrorMessage(err)
      setError(
        apiMsg === 'Tên đăng nhập hoặc mật khẩu không chính xác.'
          ? 'Mật khẩu không chính xác.'
          : apiMsg
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="table-logout-title"
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="table-logout-title" className="font-bold text-base text-text leading-6">
                    Xác nhận đăng xuất
                  </h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Nhập mật khẩu của tài khoản{' '}
                    <span className="font-semibold text-text">{username}</span>
                    {tableLabel ? ` (${tableLabel})` : ''} để đăng xuất khỏi thiết bị bàn.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-muted hover:text-text p-1 rounded-lg hover:bg-surface transition-colors shrink-0"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-2">
              <label
                htmlFor="table-logout-password"
                className="block text-xs font-semibold text-text"
              >
                Mật khẩu
              </label>
              <Input
                id="table-logout-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError('')
                }}
                placeholder="Nhập mật khẩu tài khoản..."
                autoFocus
                disabled={isSubmitting}
                error={!!error}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-muted hover:text-text transition-colors"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              {error && <p className="text-xs font-medium text-status-cancelled">{error}</p>}
            </div>
          </div>

          <div className="bg-surface/60 px-6 py-4 flex items-center justify-end gap-2.5 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Xác nhận đăng xuất
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
