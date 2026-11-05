import { resetPasswordSchema } from './reset-password-schema'

describe('resetPasswordSchema', () => {
  it('accepts a new password of at least 8 characters with a matching confirm password', () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: 'new-plain-text-password',
      confirmPassword: 'new-plain-text-password',
    })

    expect(result.success).toBe(true)
  })

  it('rejects a new password shorter than 8 characters', () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: 'short',
      confirmPassword: 'short',
    })

    expect(result.success).toBe(false)
  })

  it('rejects a confirm password that does not match the new password', () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: 'new-plain-text-password',
      confirmPassword: 'different-password',
    })

    expect(result.success).toBe(false)
  })
})
