import { z } from 'zod'

export const menuItemSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên món').max(255, 'Tên món tối đa 255 ký tự'),
  categoryId: z.number({ error: 'Vui lòng chọn danh mục' }).int().positive('Vui lòng chọn danh mục'),
  description: z.string(),
  price: z.string().trim().regex(/^\d{1,10}(\.\d{1,2})?$/, 'Giá phải không âm, tối đa 10 chữ số nguyên và 2 chữ số thập phân'),
  isFeatured: z.boolean(),
})

export type MenuItemFormValues = z.infer<typeof menuItemSchema>
