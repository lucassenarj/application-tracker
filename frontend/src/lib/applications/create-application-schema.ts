import { z } from 'zod'

export const createApplicationSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  description: z.string().trim().optional(),
  externalUrl: z
    .union([z.literal(''), z.string().trim().url('Enter a valid URL')])
    .optional(),
  salary: z
    .string()
    .optional()
    .refine(
      (value) => !value || (!Number.isNaN(Number(value)) && Number(value) > 0),
      { message: 'Salary must be a positive number' },
    ),
  currency: z.string().optional(),
  companyName: z.string().trim().min(1, 'Company is required'),
})

export type CreateApplicationFormValues = z.infer<typeof createApplicationSchema>
