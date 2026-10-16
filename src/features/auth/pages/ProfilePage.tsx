import { useState } from 'react'
import { UserCog, KeyRound, User, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProfileForm } from '@/features/auth/components/ProfileForm'
import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm'

interface ProfilePageProps {
  defaultTab?: 'profile' | 'password'
}

export function ProfilePage({ defaultTab = 'profile' }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>(defaultTab)

  return (
    <div className="w-full max-w-2xl mx-auto py-4">
      {/* Breadcrumb / Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Quay lại hệ thống
        </Link>
      </div>

      {/* Main Card */}
      <div className="bg-card border border-border shadow-xl rounded-xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-border">
          <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-primary shadow-inner shrink-0">
            <UserCog className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text">Thiết lập tài khoản cá nhân</h1>
            <p className="text-xs text-muted mt-0.5">
              Quản lý thông tin hồ sơ và bảo mật tài khoản người dùng ROMS.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border my-6">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            <User className="w-4 h-4" />
            Hồ sơ cá nhân
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'password'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Đổi mật khẩu
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === 'profile' ? <ProfileForm /> : <ChangePasswordForm />}
        </div>
      </div>
    </div>
  )
}
export default ProfilePage
