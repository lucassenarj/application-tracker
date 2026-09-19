const API_URL = import.meta.env.VITE_API_URL
const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])

let cachedCsrfToken: string | undefined

async function getCsrfToken(): Promise<string> {
  const response = await fetch(`${API_URL}/auth/csrf-token`, {
    credentials: 'include',
  })
  const data = await response.json()

  return data.csrfToken
}

interface ApiFetchOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: unknown
  headers?: Record<string, string>
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const headers = { ...options.headers }
  const method = (options.method ?? 'GET').toUpperCase()

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (MUTATING_METHODS.has(method)) {
    cachedCsrfToken ??= await getCsrfToken()
    headers['x-csrf-token'] = cachedCsrfToken
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(response.status, data.message)
  }

  return data as T
}
