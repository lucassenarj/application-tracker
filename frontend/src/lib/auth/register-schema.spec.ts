import { registerSchema } from './register-schema'

describe('registerSchema', () => {
  it('accepts a valid name, email, password, and matching confirm password', () => {
    const result = registerSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'plain-text-password',
      confirmPassword: 'plain-text-password',
    })

    expect(result.success).toBe(true)
  })

  it('rejects an invalid email format', () => {
    const result = registerSchema.safeParse({
      name: 'Jane Doe',
      email: 'not-an-email',
      password: 'plain-text-password',
      confirmPassword: 'plain-text-password',
    })

    expect(result.success).toBe(false)
  })

  it('rejects a password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'short',
      confirmPassword: 'short',
    })

    expect(result.success).toBe(false)
  })

  it('rejects a missing name', () => {
    const result = registerSchema.safeParse({
      name: '',
      email: 'jane@example.com',
      password: 'plain-text-password',
      confirmPassword: 'plain-text-password',
    })

    expect(result.success).toBe(false)
  })

  it('rejects a confirm password that does not match the password', () => {
    const result = registerSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'plain-text-password',
      confirmPassword: 'different-password',
    })

    expect(result.success).toBe(false)
  })
})
