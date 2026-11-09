import { z } from 'zod'

export const createPersonalAccessTokenSchema = z
  .object({
    label: z.string().min(1, 'Label is required'),
    expirationOption: z.enum(['1-week', '1-month', 'custom', 'never']),
    customExpiresAt: z.string().optional(),
  })
  .refine(
    (data) => data.expirationOption !== 'custom' || !!data.customExpiresAt,
    {
      message: 'Please select a date',
      path: ['customExpiresAt'],
    },
  )

export type CreatePersonalAccessTokenFormValues = z.infer<
  typeof createPersonalAccessTokenSchema
>
