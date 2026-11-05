const SENSITIVE_QUERY_PARAMS = ['token']

export function scrubSensitiveUrlParams(url: string): string {
  let scrubbed = url

  for (const param of SENSITIVE_QUERY_PARAMS) {
    const pattern = new RegExp(`([?&]${param}=)[^&]*`, 'gi')
    scrubbed = scrubbed.replace(pattern, '$1[REDACTED]')
  }

  return scrubbed
}
