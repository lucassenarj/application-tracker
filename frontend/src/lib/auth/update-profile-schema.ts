import { z } from 'zod'

export const updateProfileSchema = z.object({
  name: z.string().trim().optional(),
  avatar: z
    .union([z.literal(''), z.string().trim().url('Enter a valid URL')])
    .optional(),
})

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>
