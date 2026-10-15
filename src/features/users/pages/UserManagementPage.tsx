import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Lock,
  Unlock,
  RefreshCw,
  Tablet,
  KeyRound,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

import { userApi } from '@/features/users/api/userApi'
import type { UserItem, UserFilterParams } from '@/features/users/types/user.types'
import type { UserRole } from '@/features/auth/types/auth.types'
import { StaffUserModal } from '@/features/users/components/StaffUserModal'
import { TableAccountModal } from '@/features/users/components/TableAccountModal'
import { ChangeTablePasswordModal } from '@/features/users/components/ChangeTablePasswordModal'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { getApiErrorMessage } from '@/shared/lib/axios'

type ManagementTab = 'staff' | 'tablet'

export function UserManagementPage() {
  const { userId } = useParams<{ userId?: string }>()
  const queryClient = useQueryClient()

  // Active Tab: 'staff' (Nhân viên) or 'tablet' (Tài khoản bàn)
  const [activeTab, setActiveTab] = useState<ManagementTab>('staff')

  // Filters for Staff tab (Hiển thị toàn bộ, không phân trang)
  const [staffFilters, setStaffFilters] = useState<UserFilterParams>({
    page: 0,
    size: 200,
    search: '',
    role: '',
    isActive: '',
  })

  // Filters for Tablet tab (Hiển thị toàn bộ, không phân trang)
  const [tabletFilters, setTabletFilters] = useState<UserFilterParams>({
    page: 0,
    size: 200,
    search: '',
    role: 'TABLE_ACCOUNT',
    isActive: '',
  })

  // Modals state
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [editingStaffUser, setEditingStaffUser] = useState<UserItem | null>(null)

  const [isTableModalOpen, setIsTableModalOpen] = useState(false)
  const [editingTableUser, setEditingTableUser] = useState<UserItem | null>(null)

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [passwordTargetUser, setPasswordTargetUser] = useState<UserItem | null>(null)

  // Status toggle confirmation modal state
  const [statusConfirmUser, setStatusConfirmUser] = useState<UserItem | null>(null)

  // Current active filters based on tab
  const currentFilters = activeTab === 'staff' ? staffFilters : tabletFilters

  // Fetch users with TanStack Query
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['usersList', activeTab, currentFilters],
    queryFn: () => userApi.getUsers(currentFilters),
  })

  // Auto-load user if userId param is present
  useEffect(() => {
    if (userId) {
      const uId = Number(userId)
      if (!isNaN(uId)) {
        userApi
          .getUserById(uId)
          .then((u) => {
            if (u.role === 'TABLE_ACCOUNT') {
              setActiveTab('tablet')
              setEditingTableUser(u)
              setIsTableModalOpen(true)
            } else {
              setActiveTab('staff')
              setEditingStaffUser(u)
              setIsStaffModalOpen(true)
            }
          })
          .catch((err) => {
            toast.error(getApiErrorMessage(err) || 'Không tìm thấy tài khoản người dùng')
          })
      }
    }
  }, [userId])

  // Mutation to toggle status
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: number; newStatus: boolean }) =>
      userApi.updateUserStatus(id, newStatus),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] })
      const typeLabel =
        updatedUser.role === 'TABLE_ACCOUNT'
          ? `Tài khoản máy tính bảng Bàn ${updatedUser.tableCode || updatedUser.username}`
          : `Tài khoản nhân viên "${updatedUser.fullName || updatedUser.username}"`
      toast.success(
        `${typeLabel} đã ${
          updatedUser.isActive ? 'được kích hoạt' : 'bị khóa / vô hiệu hóa'
        } thành công!`
      )
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  // Filter content: if staff tab and no role selected, exclude TABLE_ACCOUNT
  const rawUsers = data?.content || []
  const users =
    activeTab === 'staff'
      ? staffFilters.role
        ? rawUsers
        : rawUsers.filter((u) => u.role !== 'TABLE_ACCOUNT')
      : rawUsers

  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  const handleOpenCreate = () => {
    if (activeTab === 'staff') {
      setEditingStaffUser(null)
      setIsStaffModalOpen(true)
    } else {
      setEditingTableUser(null)
      setIsTableModalOpen(true)
    }
  }

  const handleOpenEdit = (user: UserItem) => {
    if (user.role === 'TABLE_ACCOUNT') {
      setEditingTableUser(user)
      setIsTableModalOpen(true)
    } else {
      setEditingStaffUser(user)
      setIsStaffModalOpen(true)
    }
  }

  const handleOpenPasswordReset = (user: UserItem) => {
    setPasswordTargetUser(user)
    setIsPasswordModalOpen(true)
  }

  const handleToggleStatus = (user: UserItem) => {
    setStatusConfirmUser(user)
  }

  const handleConfirmToggleStatus = () => {
    if (!statusConfirmUser) return
    toggleStatusMutation.mutate(
      { id: statusConfirmUser.id, newStatus: !statusConfirmUser.isActive },
      {
        onSettled: () => setStatusConfirmUser(null),
      }
    )
  }

  const roleBadgeVariant = (
    role: UserRole
  ): 'default' | 'ready' | 'cooking' | 'secondary' | 'completed' | 'outline' => {
    switch (role) {
      case 'OWNER':
        return 'default'
      case 'SERVICE_STAFF':
        return 'ready'
      case 'KITCHEN_STAFF':
        return 'cooking'
      case 'INVENTORY_STAFF':
        return 'secondary'
      case 'TABLE_ACCOUNT':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const roleLabel = (role: UserRole): string => {
    switch (role) {
      case 'OWNER':
        return 'Quản trị viên'
      case 'SERVICE_STAFF':
        return 'Nhân viên phục vụ'
      case 'KITCHEN_STAFF':
        return 'Nhân viên bếp'
      case 'INVENTORY_STAFF':
        return 'Nhân viên kho'
      case 'TABLE_ACCOUNT':
        return 'Máy tính bảng (Bàn)'
      default:
        return role
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Quản lý tài khoản & Phân quyền
          </h1>
          <p className="text-xs text-muted mt-1">
            Quản lý độc lập tài khoản nhân viên nhà hàng và tài khoản máy tính bảng đặt tại từng bàn ăn.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            className="text-xs shadow-md font-semibold"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            {activeTab === 'staff' ? 'Thêm nhân viên' : 'Thêm tài khoản bàn'}
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold transition-all border-b-2 -mb-px rounded-t-lg ${
            activeTab === 'staff'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted hover:text-text hover:bg-surface/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Tài khoản người dùng (Nhân viên)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tablet')}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold transition-all border-b-2 -mb-px rounded-t-lg ${
            activeTab === 'tablet'
              ? 'border-accent text-accent bg-accent/5'
              : 'border-transparent text-muted hover:text-text hover:bg-surface/50'
          }`}
        >
          <Tablet className="w-4 h-4" />
          <span>Tài khoản bàn (Máy tính bảng)</span>
        </button>
      </div>

      {/* Filter Toolbar for STAFF TAB */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-card border border-border rounded-xl shadow-xs">
          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Tìm theo tên hoặc username..."
              leftIcon={<Search className="w-4 h-4 text-muted" />}
              value={staffFilters.search || ''}
              onChange={(e) =>
                setStaffFilters((prev) => ({ ...prev, search: e.target.value, page: 0 }))
              }
            />
          </div>

          {/* Filter Role (Staff only) */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted shrink-0" />
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-text shadow-xs focus:outline-hidden focus:ring-2 focus:ring-accent"
              value={staffFilters.role || ''}
              onChange={(e) =>
                setStaffFilters((prev) => ({
                  ...prev,
                  role: (e.target.value as UserRole) || '',
                  page: 0,
                }))
              }
            >
              <option value="">Tất cả vai trò nhân viên</option>
              <option value="OWNER">Quản trị viên (OWNER)</option>
              <option value="SERVICE_STAFF">Nhân viên phục vụ (SERVICE_STAFF)</option>
              <option value="KITCHEN_STAFF">Nhân viên bếp (KITCHEN_STAFF)</option>
              <option value="INVENTORY_STAFF">Nhân viên kho (INVENTORY_STAFF)</option>
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-text shadow-xs focus:outline-hidden focus:ring-2 focus:ring-accent"
              value={
                typeof staffFilters.isActive === 'boolean'
                  ? staffFilters.isActive
                    ? 'true'
                    : 'false'
                  : ''
              }
              onChange={(e) =>
                setStaffFilters((prev) => ({
                  ...prev,
                  isActive:
                    e.target.value === 'true'
                      ? true
                      : e.target.value === 'false'
                      ? false
                      : '',
                  page: 0,
                }))
              }
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang hoạt động</option>
              <option value="false">Đã bị vô hiệu hóa</option>
            </select>
          </div>
        </div>
      )}

      {/* Filter Toolbar for TABLET TAB */}
      {activeTab === 'tablet' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-card border border-border rounded-xl shadow-xs">
          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Tìm theo tên tablet, username hoặc mã bàn..."
              leftIcon={<Search className="w-4 h-4 text-muted" />}
              value={tabletFilters.search || ''}
              onChange={(e) =>
                setTabletFilters((prev) => ({ ...prev, search: e.target.value, page: 0 }))
              }
            />
          </div>

          {/* Filter Status */}
          <div>
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-text shadow-xs focus:outline-hidden focus:ring-2 focus:ring-accent"
              value={
                typeof tabletFilters.isActive === 'boolean'
                  ? tabletFilters.isActive
                    ? 'true'
                    : 'false'
                  : ''
              }
              onChange={(e) =>
                setTabletFilters((prev) => ({
                  ...prev,
                  isActive:
                    e.target.value === 'true'
                      ? true
                      : e.target.value === 'false'
                      ? false
                      : '',
                  page: 0,
                }))
              }
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang hoạt động</option>
              <option value="false">Đã bị vô hiệu hóa</option>
            </select>
          </div>
        </div>
      )}

      {/* TAB 1: USERS TABLE (NHÂN VIÊN - KHÔNG CÓ LIÊN KẾT BÀN) */}
      {activeTab === 'staff' && (
        <div className="bg-card border border-border shadow-md rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Tài khoản & Họ tên</th>
                  <th className="py-3 px-4">Địa chỉ Email</th>
                  <th className="py-3 px-4">Vai trò hệ thống</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Ngày tạo</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted">
                      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Đang tải danh sách nhân viên...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted">
                      Không tìm thấy tài khoản nhân viên nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  users.map((item) => (
                    <tr key={item.id} className="hover:bg-surface/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-surface text-primary font-bold flex items-center justify-center shrink-0 border border-border">
                            {item.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-text block">
                              {item.fullName || item.username}
                            </span>
                            <span className="text-[11px] text-muted font-mono">
                              @{item.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-text font-medium">
                        {item.email || <span className="text-muted/50 italic">Chưa có email</span>}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant={roleBadgeVariant(item.role)}>
                          {roleLabel(item.role)}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1 text-status-completed font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-completed" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted" />
                            Đã khóa
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-muted">
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-muted hover:text-primary hover:bg-surface rounded-md transition-colors"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            className={`p-1.5 rounded-md transition-colors ${
                              item.isActive
                                ? 'text-muted hover:text-status-cancelled hover:bg-status-cancelled/10'
                                : 'text-status-completed hover:bg-status-completed/10'
                            }`}
                            title={item.isActive ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}
                          >
                            {item.isActive ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TABLET ACCOUNTS TABLE (TÀI KHOẢN BÀN - KHÔNG CÓ CỘT EMAIL, CÓ ĐỔI MK) */}
      {activeTab === 'tablet' && (
        <div className="bg-card border border-border shadow-md rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Tài khoản Tablet</th>
                  <th className="py-3 px-4">Tên định danh thiết bị</th>
                  <th className="py-3 px-4">Bàn ăn liên kết</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Ngày tạo</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted">
                      <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Đang tải danh sách tài khoản bàn...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted">
                      Không tìm thấy tài khoản bàn nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  users.map((item) => (
                    <tr key={item.id} className="hover:bg-surface/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent font-bold flex items-center justify-center shrink-0 border border-accent/20">
                            <Tablet className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-text font-mono block">
                              @{item.username}
                            </span>
                            <span className="text-[11px] text-muted">Mã thiết bị</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-text">
                        {item.fullName || item.username}
                      </td>

                      <td className="py-3.5 px-4">
                        {item.tableCode ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/10 border border-accent/30 text-xs font-semibold text-accent">
                            <Tablet className="w-3.5 h-3.5" />
                            Bàn {item.tableCode}
                          </span>
                        ) : (
                          <span className="text-muted/50 italic">Chưa gắn bàn</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1 text-status-completed font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-completed" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted" />
                            Đã khóa
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-muted">
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Đổi mật khẩu cho Tablet */}
                          <button
                            type="button"
                            onClick={() => handleOpenPasswordReset(item)}
                            className="p-1.5 text-muted hover:text-accent hover:bg-accent/10 rounded-md transition-colors"
                            title="Đổi mật khẩu máy tính bảng"
                          >
                            <KeyRound className="w-4 h-4 text-accent" />
                          </button>

                          {/* Nút Chỉnh sửa thông tin */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-muted hover:text-primary hover:bg-surface rounded-md transition-colors"
                            title="Chỉnh sửa tài khoản & bàn liên kết"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Nút Khóa / Mở khóa */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            className={`p-1.5 rounded-md transition-colors ${
                              item.isActive
                                ? 'text-muted hover:text-status-cancelled hover:bg-status-cancelled/10'
                                : 'text-status-completed hover:bg-status-completed/10'
                            }`}
                            title={item.isActive ? 'Vô hiệu hóa tài khoản bàn' : 'Kích hoạt tài khoản bàn'}
                          >
                            {item.isActive ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className="flex items-center justify-between px-2 pt-2 text-xs text-muted">
        <div>
          Tổng số:{' '}
          <span className="font-semibold text-text">
            {users.length} {activeTab === 'staff' ? 'nhân viên' : 'tài khoản máy tính bảng'}
          </span>
        </div>
      </div>

      {/* Staff Modal */}
      <StaffUserModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onSuccess={() => refetch()}
        userToEdit={editingStaffUser}
      />

      {/* Table Account Modal */}
      <TableAccountModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onSuccess={() => refetch()}
        userToEdit={editingTableUser}
      />

      {/* Change Table Password Quick Modal */}
      <ChangeTablePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => refetch()}
        account={passwordTargetUser}
      />

      {/* Modern Center Modal Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!statusConfirmUser}
        onClose={() => setStatusConfirmUser(null)}
        onConfirm={handleConfirmToggleStatus}
        isLoading={toggleStatusMutation.isPending}
        title={
          statusConfirmUser?.isActive
            ? statusConfirmUser.role === 'TABLE_ACCOUNT'
              ? 'Xác nhận khóa tài khoản máy tính bảng'
              : 'Xác nhận khóa tài khoản nhân viên'
            : statusConfirmUser?.role === 'TABLE_ACCOUNT'
            ? 'Xác nhận mở khóa tài khoản máy tính bảng'
            : 'Xác nhận mở khóa tài khoản nhân viên'
        }
        description={
          statusConfirmUser ? (
            <div className="space-y-1.5">
              <p>
                Bạn có chắc chắn muốn{' '}
                <span className={statusConfirmUser.isActive ? 'font-semibold text-status-cancelled' : 'font-semibold text-status-completed'}>
                  {statusConfirmUser.isActive ? 'khóa / vô hiệu hóa' : 'mở khóa / kích hoạt'}
                </span>{' '}
                tài khoản{' '}
                <span className="font-semibold text-text">
                  {statusConfirmUser.role === 'TABLE_ACCOUNT'
                    ? `máy tính bảng Bàn ${statusConfirmUser.tableCode || statusConfirmUser.username} (@${statusConfirmUser.username})`
                    : `nhân viên "${statusConfirmUser.fullName || statusConfirmUser.username}" (@${statusConfirmUser.username})`}
                </span>
                ?
              </p>
              {statusConfirmUser.isActive && (
                <p className="text-[11px] text-muted bg-surface/80 p-2 rounded-lg border border-border">
                  ⚠️ Lưu ý: Khi bị khóa, tài khoản này sẽ bị thu hồi toàn bộ phiên làm việc và không thể đăng nhập vào hệ thống.
                </p>
              )}
            </div>
          ) : null
        }
        confirmText={statusConfirmUser?.isActive ? 'Khóa tài khoản' : 'Kích hoạt lại'}
        cancelText="Hủy bỏ"
        variant={statusConfirmUser?.isActive ? 'danger' : 'primary'}
      />
    </div>
  )
}
