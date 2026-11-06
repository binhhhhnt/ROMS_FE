import { z } from 'zod'

export const promotionFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Tên chương trình không được để trống')
      .max(255, 'Tên chương trình không được vượt quá 255 ký tự'),
    code: z
      .string()
      .trim()
      .min(1, 'Mã khuyến mãi không được để trống')
      .max(50, 'Mã khuyến mãi không được vượt quá 50 ký tự')
      .regex(/^[A-Za-z0-9_-]+$/, 'Mã chỉ chứa chữ cái, số, gạch nối (-) hoặc gạch dưới (_)'),
    discountType: z.enum(['PERCENT', 'FIXED_AMOUNT']),
    discountValue: z
      .number()
      .positive('Giá trị giảm phải lớn hơn 0'),
    maxUses: z
      .number()
      .int('Số lượt dùng phải là số nguyên')
      .positive('Số lượt dùng phải lớn hơn 0')
      .nullable()
      .optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    isActive: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === 'PERCENT' && data.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountValue'],
        message: 'Phần trăm giảm giá không được vượt quá 100%',
      })
    }
    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'Ngày kết thúc không được trước ngày bắt đầu',
      })
    }
  })

export type PromotionFormValues = z.infer<typeof promotionFormSchema>
