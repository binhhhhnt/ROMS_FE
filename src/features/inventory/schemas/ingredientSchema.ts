import { z } from 'zod'

export const ingredientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên nguyên liệu không được để trống')
    .max(255, 'Tên nguyên liệu không quá 255 ký tự'),
  unit: z
    .string()
    .trim()
    .min(1, 'Đơn vị tính không được để trống')
    .max(20, 'Đơn vị tính không quá 20 ký tự'),
  minimumStock: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Mức tồn tối thiểu phải là số >= 0',
    }),
})

export type IngredientFormValues = z.infer<typeof ingredientSchema>
