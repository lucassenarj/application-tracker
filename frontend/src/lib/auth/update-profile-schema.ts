import { z } from 'zod'

export const updateProfileSchema = z.object({
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  avatar: z
    .union([z.literal(''), z.string().trim().url('Enter a valid URL')])
    .optional(),
  phone: z.string().trim().optional(),
  bio: z.string().trim().max(500, 'Bio must be at most 500 characters').optional(),
  language: z.string().optional(),
})

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>
