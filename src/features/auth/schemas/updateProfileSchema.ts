import { z } from 'zod'

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Họ và tên không được để trống')
    .max(255, 'Họ và tên không được vượt quá 255 ký tự'),
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Địa chỉ email không đúng định dạng')
    .max(255, 'Email không được vượt quá 255 ký tự'),
})

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>
