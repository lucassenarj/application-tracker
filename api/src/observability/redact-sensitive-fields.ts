const SENSITIVE_KEYS = [
  'password',
  'currentpassword',
  'newpassword',
  'token',
  'refreshtoken',
  'tokenhash',
  'csrftoken',
  'accesstoken',
];

export function redactSensitiveFields(
  body: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null | undefined {
  if (!body) {
    return body;
  }

  const redacted: Record<string, unknown> = { ...body };

  for (const key of Object.keys(redacted)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
    }
  }

  return redacted;
}
