import { changePasswordSchema } from './change-password-schema'

describe('changePasswordSchema', () => {
  it('accepts a current password, a new password of at least 8 characters, and a matching confirm password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'current-password',
      newPassword: 'new-plain-text-password',
      confirmPassword: 'new-plain-text-password',
      revokeOtherSessions: false,
    })

    expect(result.success).toBe(true)
  })

  it('rejects a missing current password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: '',
      newPassword: 'new-plain-text-password',
      confirmPassword: 'new-plain-text-password',
      revokeOtherSessions: false,
    })

    expect(result.success).toBe(false)
  })

  it('rejects a new password shorter than 8 characters', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'current-password',
      newPassword: 'short',
      confirmPassword: 'short',
      revokeOtherSessions: false,
    })

    expect(result.success).toBe(false)
  })

  it('rejects a confirm password that does not match the new password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'current-password',
      newPassword: 'new-plain-text-password',
      confirmPassword: 'different-password',
      revokeOtherSessions: false,
    })

    expect(result.success).toBe(false)
  })

  it('rejects a new password that is the same as the current password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'current-password',
      newPassword: 'current-password',
      confirmPassword: 'current-password',
      revokeOtherSessions: false,
    })

    expect(result.success).toBe(false)
  })
})
