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
import { subscribeToTopic } from '@/shared/lib/stomp'

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
    role: '',
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

  // Lắng nghe sự kiện WebSocket realtime khi trạng thái bàn hoặc phiên phục vụ thay đổi
  useEffect(() => {
    const unsubscribe = subscribeToTopic('/topic/tables', () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] })
    })
    return () => {
      unsubscribe()
    }
  }, [queryClient])

  // Fetch users with TanStack Query kèm cơ chế realtime & backup polling 3s cho tab tablet
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['usersList', activeTab, currentFilters],
    queryFn: () => userApi.getUsers(currentFilters),
    refetchInterval: activeTab === 'tablet' ? 3000 : false,
  })

  // Auto-load user if userId param is present
  useEffect(() => {
    if (userId) {
      const uId = Number(userId)
      if (!isNaN(uId)) {
        userApi
          .getUserById(uId)
          .then((u) => {
            setActiveTab('staff')
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

  const rawUsers = data?.content || []
  const users = rawUsers


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
    setEditingStaffUser(user)
    setIsStaffModalOpen(true)
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
            Quản lý tài khoản nhân viên nhà hàng và tài khoản máy tính bảng tại từng bàn ăn.
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
            {activeTab === 'staff' ? 'Thêm nhân viên' : 'Thêm tài khoản bàn'}
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold transition-colors border-b-2 -mb-px cursor-pointer ${
            activeTab === 'staff'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-text'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Tài khoản nhân viên</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tablet')}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold transition-colors border-b-2 -mb-px cursor-pointer ${
            activeTab === 'tablet'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-text'
          }`}
        >
          <Tablet className="w-4 h-4" />
          <span>Tài khoản bàn (Tablet)</span>
        </button>
      </div>

      {/* Filter Toolbar for STAFF TAB */}
      {activeTab === 'staff' && (
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
      )}

      {/* Filter Toolbar for TABLET TAB */}
      {activeTab === 'tablet' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-card border border-border rounded-lg">
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

          <div>
            <select
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-xs text-text focus:outline-hidden focus:ring-2 focus:ring-accent"
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

      {/* TAB 1: USERS TABLE */}
      {activeTab === 'staff' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
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

      {/* TAB 2: TABLET ACCOUNTS TABLE */}
      {activeTab === 'tablet' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/60 text-muted font-medium">
                  <th className="py-3 px-4 whitespace-nowrap">Tài khoản Tablet</th>
                  <th className="py-3 px-4 whitespace-nowrap">Tên thiết bị</th>
                  <th className="py-3 px-4 whitespace-nowrap">Bàn liên kết</th>
                  <th className="py-3 px-4 whitespace-nowrap">Trạng thái bàn</th>
                  <th className="py-3 px-4 whitespace-nowrap">Trạng thái TK</th>
                  <th className="py-3 px-4 whitespace-nowrap">Ngày tạo</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted">
                      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Đang tải danh sách tài khoản bàn...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-muted">
                      Không tìm thấy tài khoản bàn nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  users.map((item) => (
                    <tr key={item.id} className="hover:bg-muted-bg/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-sm text-text font-mono block">
                          @{item.username}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-text whitespace-nowrap">
                        {item.fullName || item.username}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.tableCode ? (
                          <Badge variant="outline">Bàn {item.tableCode}</Badge>
                        ) : (
                          <span className="text-muted">Chưa gắn bàn</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.hasActiveSession ? (
                          <Badge variant="cooking">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-cooking shrink-0" />
                            Đang có phiên
                          </Badge>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
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
                            onClick={() => handleOpenPasswordReset(item)}
                            className="h-8 px-2"
                            title="Đổi mật khẩu máy tính bảng"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(item)}
                            className="h-8 px-2"
                            title="Chỉnh sửa tài khoản & bàn liên kết"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          {item.isActive ? (
                            item.canDeactivate ? (
                              <Button
                                type="button"
                                variant="destructiveOutline"
                                size="sm"
                                onClick={() => handleToggleStatus(item)}
                                className="h-8 px-2"
                                title="Vô hiệu hóa tài khoản bàn"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </Button>
                            ) : null
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(item)}
                              className="h-8 px-2 text-status-completed"
                              title="Kích hoạt tài khoản bàn"
                            >
                              <Unlock className="w-3.5 h-3.5" />
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
    </div>
  )
}
