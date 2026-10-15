import { Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

export function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border shadow-lg rounded-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-status-cancelled/15 text-status-cancelled mx-auto flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-text mb-2">Truy cập bị từ chối</h1>
        <p className="text-sm text-muted mb-6">
          Bạn không có quyền truy cập vào chức năng này với vai trò hiện tại.
        </p>
        <Link to="/login">
          <Button variant="primary" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Về trang Đăng nhập
          </Button>
        </Link>
      </div>
    </div>
  )
}
export default AccessDeniedPage
