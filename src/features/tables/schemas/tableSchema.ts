import { z } from 'zod'

export const tableSchema = z.object({
  tableCode: z
    .string()
    .min(1, 'Mã bàn không được để trống')
    .max(20, 'Mã bàn tối đa 20 ký tự')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Mã bàn chỉ chứa chữ cái, số, dấu gạch ngang hoặc gạch dưới'),
  capacity: z
    .number({ message: 'Vui lòng nhập sức chứa của bàn' })
    .min(1, 'Sức chứa tối thiểu 1 người')
    .max(50, 'Sức chứa tối đa 50 người'),
  area: z
    .string()
    .max(50, 'Tên khu vực tối đa 50 ký tự')
    .optional()
    .or(z.literal('')),
})

export type TableFormValues = z.infer<typeof tableSchema>
