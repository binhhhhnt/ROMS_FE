import { z } from 'zod'

export const userRoleEnum = z.enum([
  'OWNER',
  'SERVICE_STAFF',
  'KITCHEN_STAFF',
  'INVENTORY_STAFF',
  'TABLE_ACCOUNT',
])

export const staffRoleEnum = z.enum([
  'OWNER',
  'SERVICE_STAFF',
  'KITCHEN_STAFF',
  'INVENTORY_STAFF',
])

// Schema dành cho tài khoản người dùng (Nhân viên / Quản lý) - Không có liên kết bàn
export const staffUserModalSchema = z.object({
  username: z.string().max(50, 'Tên đăng nhập tối đa 50 ký tự').optional(),
  password: z.string().max(100, 'Mật khẩu tối đa 100 ký tự').optional(),
  fullName: z
    .string()
    .min(1, 'Họ và tên không được để trống')
    .max(255, 'Họ và tên tối đa 255 ký tự'),
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Địa chỉ email không đúng định dạng')
    .max(255, 'Email tối đa 255 ký tự'),
  role: staffRoleEnum,
})

export type StaffUserFormValues = z.infer<typeof staffUserModalSchema>

// Schema dành cho tài khoản máy tính bảng đặt tại bàn (TABLE_ACCOUNT) - Không có email
export const tableAccountModalSchema = z.object({
  username: z.string().max(50, 'Tên đăng nhập tối đa 50 ký tự').optional(),
  password: z.string().max(100, 'Mật khẩu tối đa 100 ký tự').optional(),
  fullName: z
    .string()
    .min(1, 'Tên định danh không được để trống')
    .max(255, 'Tên tối đa 255 ký tự'),
  tableId: z
    .number({ message: 'Vui lòng chọn một bàn ăn' })
    .min(1, 'Vui lòng chọn một bàn ăn'),
})

export type TableAccountFormValues = z.infer<typeof tableAccountModalSchema>

// Schema đổi mật khẩu nhanh cho tài khoản bàn
export const changeTablePasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
      .max(100, 'Mật khẩu tối đa 100 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

export type ChangeTablePasswordFormValues = z.infer<typeof changeTablePasswordSchema>

// Schema tổng hợp cũ để tương thích ngược
export const userModalSchema = z.object({
  username: z.string().max(50, 'Tên đăng nhập tối đa 50 ký tự').optional(),
  password: z.string().max(100, 'Mật khẩu tối đa 100 ký tự').optional(),
  fullName: z
    .string()
    .min(1, 'Họ và tên không được để trống')
    .max(255, 'Họ và tên tối đa 255 ký tự'),
  email: z
    .string()
    .email('Email không đúng định dạng')
    .max(255, 'Email tối đa 255 ký tự')
    .optional()
    .or(z.literal('')),
  role: userRoleEnum,
  tableId: z.number().nullable().optional(),
})

export type UserModalFormValues = z.infer<typeof userModalSchema>
