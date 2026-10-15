import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên danh mục').max(100, 'Tên danh mục tối đa 100 ký tự'),
  description: z.string().max(255, 'Mô tả tối đa 255 ký tự'),
  displayOrder: z.number({ error: 'Vui lòng nhập thứ tự hiển thị là số nguyên' })
    .int('Thứ tự hiển thị phải là số nguyên')
    .min(-2147483648, 'Thứ tự hiển thị nằm ngoài phạm vi cho phép')
    .max(2147483647, 'Thứ tự hiển thị nằm ngoài phạm vi cho phép'),
  isActive: z.boolean(),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
