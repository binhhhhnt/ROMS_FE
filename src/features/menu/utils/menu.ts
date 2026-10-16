import axios from 'axios'
import { menuStatuses, type MenuItemImage, type MenuStatus } from '../types/menu.types'

export const menuStatusLabels: Record<MenuStatus, string> = {
  AVAILABLE: 'Đang phục vụ',
  TEMPORARILY_UNAVAILABLE: 'Tạm ngưng phục vụ',
  DISCONTINUED: 'Ngừng kinh doanh',
}

export const menuControlClass = 'w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50'

export function formatMenuPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

export function orderedMenuImages(images: MenuItemImage[]) {
  return [...images].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
}

export function isMenuStatus(value: string): value is MenuStatus {
  return menuStatuses.some((status) => status === value)
}

export function positiveMenuId(value: string | null | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export function getMenuErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    switch (error.response?.status) {
      case 400: return 'Thông tin chưa hợp lệ. Vui lòng kiểm tra dữ liệu và thử lại.'
      case 401: return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      case 403: return 'Bạn không có quyền xem hoặc thực hiện thao tác này.'
      case 404: return 'Món ăn hoặc dữ liệu liên quan không còn tồn tại hay không được phép hiển thị.'
      case 409: return 'Trạng thái hoặc dữ liệu đã thay đổi. Vui lòng làm mới và kiểm tra lại.'
      case 413: return 'Tệp ảnh quá lớn. Vui lòng chọn ảnh không quá 5 MB.'
    }
  }
  return 'Không thể xử lý yêu cầu. Vui lòng kiểm tra kết nối và thử lại.'
}

export function menuImageFileError(file: File): string | null {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.'
  if (file.size === 0 || file.size > 5 * 1024 * 1024) return 'Ảnh phải có dung lượng lớn hơn 0 và không quá 5 MB.'
  return null
}
