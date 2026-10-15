import { z } from 'zod'

export const purchaseItemSchema = z.object({
  ingredientId: z.number().min(1, 'Vui lòng chọn nguyên liệu'),
  quantity: z.number().min(0.001, 'Số lượng nhập phải lớn hơn 0'),
  unitPrice: z.number().min(0, 'Đơn giá không được âm'),
})

export const createPurchaseSchema = z.object({
  purchaseDate: z.string().min(1, 'Ngày nhập không được để trống'),
  note: z.string().max(255, 'Ghi chú không quá 255 ký tự').optional(),
  items: z.array(purchaseItemSchema).min(1, 'Phiếu nhập phải có ít nhất 1 nguyên liệu'),
})

export type CreatePurchaseFormValues = z.infer<typeof createPurchaseSchema>
