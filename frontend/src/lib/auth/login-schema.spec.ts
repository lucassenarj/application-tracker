import { loginSchema } from './login-schema'

describe('loginSchema', () => {
  it('accepts a valid email and non-empty password', () => {
    const result = loginSchema.safeParse({
      email: 'jane@example.com',
      password: 'plain-text-password',
    })

    expect(result.success).toBe(true)
  })

  it('rejects an invalid email format', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'plain-text-password',
    })

    expect(result.success).toBe(false)
  })

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({
      email: 'jane@example.com',
      password: '',
    })

    expect(result.success).toBe(false)
  })
})
