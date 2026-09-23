import { registerSchema } from './register-schema'

describe('registerSchema', () => {
  it('accepts a valid email and a password of at least 8 characters', () => {
    const result = registerSchema.safeParse({
      email: 'jane@example.com',
      password: 'plain-text-password',
    })

    expect(result.success).toBe(true)
  })

  it('rejects an invalid email format', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'plain-text-password',
    })

    expect(result.success).toBe(false)
  })

  it('rejects a password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      email: 'jane@example.com',
      password: 'short',
    })

    expect(result.success).toBe(false)
  })
})
