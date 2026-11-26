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
  areaId: z
    .number({ message: 'Vui lòng chọn khu vực' })
    .min(1, 'Vui lòng chọn khu vực'),
})

export type TableFormValues = z.infer<typeof tableSchema>
