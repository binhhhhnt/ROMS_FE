import { z } from 'zod'

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Tên danh mục không được để trống')
    .max(100, 'Tên danh mục không được vượt quá 100 ký tự'),
  description: z
    .string()
    .max(255, 'Mô tả không được vượt quá 255 ký tự'),
  displayOrder: z
    .number()
    .int('Thứ tự hiển thị phải là số nguyên')
    .min(0, 'Thứ tự hiển thị phải lớn hơn hoặc bằng 0'),
  isActive: z.boolean(),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
