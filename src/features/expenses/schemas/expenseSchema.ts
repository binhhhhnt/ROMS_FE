import { z } from 'zod'

export const expenseFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên chi phí không được để trống')
    .max(255, 'Tên chi phí không được vượt quá 255 ký tự'),
  amount: z
    .number()
    .min(0, 'Số tiền chi phí phải lớn hơn hoặc bằng 0')
    .max(999999999999.99, 'Số tiền quá lớn'),
  expenseDate: z
    .string()
    .min(1, 'Ngày phát sinh chi phí là bắt buộc'),
  note: z
    .string()
    .max(255, 'Ghi chú không được vượt quá 255 ký tự'),
})

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>

export const cancelExpenseSchema = z.object({
  cancelReason: z
    .string()
    .min(1, 'Vui lòng cung cấp lý do hủy khoản chi')
    .max(255, 'Lý do hủy không được vượt quá 255 ký tự'),
})

export type CancelExpenseFormValues = z.infer<typeof cancelExpenseSchema>
