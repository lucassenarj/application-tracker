import { forgotPasswordSchema } from './forgot-password-schema'

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'jane@example.com',
    })

    expect(result.success).toBe(true)
  })

  it('rejects an invalid email format', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'not-an-email',
    })

    expect(result.success).toBe(false)
  })

  it('rejects a missing email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: '',
    })

    expect(result.success).toBe(false)
  })
})
