import { redactSensitiveFields } from './redact-sensitive-fields';

describe('redactSensitiveFields', () => {
  it('replaces the value of a known sensitive key with [REDACTED]', () => {
    const redacted = redactSensitiveFields({
      email: 'jane@example.com',
      password: 'plain-text-password',
    });

    expect(redacted).toEqual({
      email: 'jane@example.com',
      password: '[REDACTED]',
    });
  });

  it('matches sensitive keys case-insensitively', () => {
    const redacted = redactSensitiveFields({
      CurrentPassword: 'old-password',
      NEWPASSWORD: 'new-password',
    });

    expect(redacted).toEqual({
      CurrentPassword: '[REDACTED]',
      NEWPASSWORD: '[REDACTED]',
    });
  });

  it('leaves non-sensitive fields unchanged', () => {
    const redacted = redactSensitiveFields({
      email: 'jane@example.com',
      name: 'Jane Doe',
    });

    expect(redacted).toEqual({
      email: 'jane@example.com',
      name: 'Jane Doe',
    });
  });

  it('does not mutate the original object', () => {
    const body = { password: 'plain-text-password' };

    redactSensitiveFields(body);

    expect(body.password).toBe('plain-text-password');
  });

  it('returns an empty object unchanged', () => {
    expect(redactSensitiveFields({})).toEqual({});
  });

  it('returns null or undefined as-is', () => {
    expect(redactSensitiveFields(null)).toBeNull();
    expect(redactSensitiveFields(undefined)).toBeUndefined();
  });
});
