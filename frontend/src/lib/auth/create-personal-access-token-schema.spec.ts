import { createPersonalAccessTokenSchema } from './create-personal-access-token-schema'

function buildInput(
  overrides: Partial<{
    label: string
    expirationOption: '1-week' | '1-month' | 'custom' | 'never'
    customExpiresAt: string
  }> = {},
) {
  return {
    label: 'LinkedIn extension',
    expirationOption: 'never' as const,
    ...overrides,
  }
}

describe('createPersonalAccessTokenSchema', () => {
  it('accepts a label with expirationOption "never" and no customExpiresAt', () => {
    const result = createPersonalAccessTokenSchema.safeParse(buildInput())

    expect(result.success).toBe(true)
  })

  it('rejects a missing label', () => {
    const result = createPersonalAccessTokenSchema.safeParse(
      buildInput({ label: '' }),
    )

    expect(result.success).toBe(false)
  })

  it('accepts expirationOption "1-week" without a customExpiresAt', () => {
    const result = createPersonalAccessTokenSchema.safeParse(
      buildInput({ expirationOption: '1-week' }),
    )

    expect(result.success).toBe(true)
  })

  it('accepts expirationOption "1-month" without a customExpiresAt', () => {
    const result = createPersonalAccessTokenSchema.safeParse(
      buildInput({ expirationOption: '1-month' }),
    )

    expect(result.success).toBe(true)
  })

  it('rejects expirationOption "custom" without a customExpiresAt', () => {
    const result = createPersonalAccessTokenSchema.safeParse(
      buildInput({ expirationOption: 'custom' }),
    )

    expect(result.success).toBe(false)
  })

  it('accepts expirationOption "custom" with a customExpiresAt', () => {
    const result = createPersonalAccessTokenSchema.safeParse(
      buildInput({ expirationOption: 'custom', customExpiresAt: '2026-12-01' }),
    )

    expect(result.success).toBe(true)
  })
})
