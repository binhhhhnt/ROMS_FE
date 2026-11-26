import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UserPlus,
  Search,
  Filter,
  Edit2,
  Lock,
  Unlock,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuthStore } from '@/app/store/authStore'
import { userApi } from '@/features/users/api/userApi'
import type { UserItem, UserFilterParams } from '@/features/users/types/user.types'
import type { UserRole } from '@/features/auth/types/auth.types'
import { StaffUserModal } from '@/features/users/components/StaffUserModal'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { getApiErrorMessage } from '@/shared/lib/axios'

export function UserManagementPage() {
  const { userId } = useParams<{ userId?: string }>()
  const currentUser = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()

  // Filters for Staff (Hiển thị toàn bộ, không phân trang)
  const [staffFilters, setStaffFilters] = useState<UserFilterParams>({
    page: 0,
    size: 200,
    search: '',
    role: '',
    isActive: '',
  })

  // Modals state
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [editingStaffUser, setEditingStaffUser] = useState<UserItem | null>(null)

  // Status toggle & delete confirmation modal state
  const [statusConfirmUser, setStatusConfirmUser] = useState<UserItem | null>(null)
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserItem | null>(null)

  // Fetch users with TanStack Query
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['usersList', staffFilters],
    queryFn: () => userApi.getUsers(staffFilters),
  })

  // Auto-load user if userId param is present
  useEffect(() => {
    if (userId) {
      const uId = Number(userId)
      if (!isNaN(uId)) {
        userApi
          .getUserById(uId)
          .then((u) => {
            setEditingStaffUser(u)
            setIsStaffModalOpen(true)
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
      const typeLabel = `Tài khoản nhân viên "${updatedUser.fullName || updatedUser.username}"`
      toast.success(
        `${typeLabel} đã ${updatedUser.isActive ? 'được kích hoạt' : 'bị khóa / vô hiệu hóa'
        } thành công!`
      )
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => userApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] })
      toast.success('Đã xóa tài khoản nhân viên thành công!')
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err))
    },
  })

  const rawUsers = data?.content || []
  const users = rawUsers


  const handleOpenCreate = () => {
    setEditingStaffUser(null)
    setIsStaffModalOpen(true)
  }

  const handleOpenEdit = (user: UserItem) => {
    setEditingStaffUser(user)
    setIsStaffModalOpen(true)
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

  const handleConfirmDeleteUser = () => {
    if (!deleteConfirmUser) return
    deleteUserMutation.mutate(deleteConfirmUser.id, {
      onSettled: () => setDeleteConfirmUser(null),
    })
  }

  const roleBadgeVariant = (
    role: UserRole
  ): 'default' | 'ready' | 'cooking' | 'secondary' | 'completed' | 'outline' => {
    switch (role) {
      case 'OWNER':
        return 'default'
      case 'SERVICE_STAFF':
      case 'CASHIER_STAFF':
        return 'ready'
      case 'KITCHEN_STAFF':
        return 'cooking'
      case 'INVENTORY_STAFF':
        return 'secondary'
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
      case 'CASHIER_STAFF':
        return 'Nhân viên thu ngân'
      case 'KITCHEN_STAFF':
        return 'Nhân viên bếp'
      case 'INVENTORY_STAFF':
        return 'Nhân viên kho'
      default:
        return role
    }
  }

  return (
    <div className="space-y-5">
      {/* Tầng 1: Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-border">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-text">
            Quản lý tài khoản &amp; Phân quyền
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Quản lý tài khoản nhân viên và phân quyền trong nhà hàng.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 px-3 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            className="h-9 px-3.5 text-xs font-semibold"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Thêm nhân viên
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-card border border-border rounded-lg">
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

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted shrink-0" />
            <select
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-xs text-text focus:outline-hidden focus:ring-2 focus:ring-accent"
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
              <option value="CASHIER_STAFF">Nhân viên thu ngân (CASHIER_STAFF)</option>
              <option value="KITCHEN_STAFF">Nhân viên bếp (KITCHEN_STAFF)</option>
              <option value="INVENTORY_STAFF">Nhân viên kho (INVENTORY_STAFF)</option>
            </select>
          </div>

          <div>
            <select
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-xs text-text focus:outline-hidden focus:ring-2 focus:ring-accent"
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

      {/* USERS TABLE */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/60 text-muted font-medium">
                  <th className="py-3 px-4 whitespace-nowrap">Tài khoản &amp; Họ tên</th>
                  <th className="py-3 px-4 whitespace-nowrap">Email</th>
                  <th className="py-3 px-4 whitespace-nowrap">Vai trò</th>
                  <th className="py-3 px-4 whitespace-nowrap">Trạng thái</th>
                  <th className="py-3 px-4 whitespace-nowrap">Ngày tạo</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Thao tác</th>
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
                    <tr key={item.id} className="hover:bg-muted-bg/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-sm text-text block">
                          {item.fullName || item.username}
                        </span>
                        <span className="text-xs text-muted font-mono">
                          @{item.username}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-text font-medium whitespace-nowrap">
                        {item.email || <span className="text-muted">Chưa có email</span>}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant={roleBadgeVariant(item.role)}>
                          {roleLabel(item.role)}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.isActive ? (
                          <Badge variant="completed">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-completed shrink-0" />
                            Hoạt động
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted">
                            Đã khóa
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4 text-muted tabular-nums whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(item)}
                            className="h-8 px-2"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant={item.isActive ? 'destructiveOutline' : 'outline'}
                            size="sm"
                            onClick={() => handleToggleStatus(item)}
                            className="h-8 px-2"
                            title={item.isActive ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}
                          >
                            {item.isActive ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                          </Button>
                          {currentUser?.id !== item.id && (
                            <Button
                              type="button"
                              variant="destructiveOutline"
                              size="sm"
                              onClick={() => setDeleteConfirmUser(item)}
                              className="h-8 px-2"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Summary Footer */}
      <div className="flex items-center justify-between px-2 pt-2 text-xs text-muted">
        <div>
          Tổng số:{' '}
          <span className="font-semibold text-text">
            {users.length} nhân viên
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

      {/* Modern Center Modal Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!statusConfirmUser}
        onClose={() => setStatusConfirmUser(null)}
        onConfirm={handleConfirmToggleStatus}
        isLoading={toggleStatusMutation.isPending}
        title={
          statusConfirmUser?.isActive
            ? 'Xác nhận khóa tài khoản nhân viên'
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
                  {`nhân viên "${statusConfirmUser.fullName || statusConfirmUser.username}" (@${statusConfirmUser.username})`}
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

      <ConfirmDialog
        isOpen={!!deleteConfirmUser}
        onClose={() => setDeleteConfirmUser(null)}
        onConfirm={handleConfirmDeleteUser}
        isLoading={deleteUserMutation.isPending}
        title="Xác nhận xóa tài khoản nhân viên"
        description={
          deleteConfirmUser ? (
            <div className="space-y-1.5">
              <p>
                Bạn có chắc chắn muốn xóa tài khoản{' '}
                <span className="font-semibold text-text">
                  {`"${deleteConfirmUser.fullName || deleteConfirmUser.username}" (@${deleteConfirmUser.username})`}
                </span>
                ?
              </p>
              <p className="text-[11px] text-muted bg-surface/80 p-2 rounded-lg border border-border">
                Tài khoản sẽ bị ẩn khỏi danh sách và không thể đăng nhập lại; dữ liệu hóa đơn/đơn hàng cũ vẫn được giữ nguyên.
              </p>
            </div>
          ) : null
        }
        confirmText="Xóa tài khoản"
        cancelText="Hủy bỏ"
        variant="danger"
      />
    </div>
  )
}
