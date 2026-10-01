import { z } from 'zod'

export const changeStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  eventDate: z.string().min(1, 'Date is required'),
  interviewCategory: z.enum(['TECHNICAL', 'NON_TECHNICAL']).optional(),
  contactName: z.string().trim().optional(),
  contactEmail: z
    .union([z.literal(''), z.string().trim().email('Enter a valid email')])
    .optional(),
  notes: z.string().trim().optional(),
})

export type ChangeStatusFormValues = z.infer<typeof changeStatusSchema>
