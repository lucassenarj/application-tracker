const API_URL = import.meta.env.VITE_API_URL
const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])
const AUTH_ENDPOINTS_WITHOUT_REFRESH = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
])

let cachedCsrfToken: string | undefined
let inFlightRefresh: Promise<boolean> | undefined

export function invalidateCsrfToken(): void {
  cachedCsrfToken = undefined
}

async function getCsrfToken(): Promise<string> {
  const response = await fetch(`${API_URL}/auth/csrf-token`, {
    credentials: 'include',
  })
  const data = await response.json()

  return data.csrfToken
}

function refreshAccessToken(): Promise<boolean> {
  inFlightRefresh ??= (async () => {
    cachedCsrfToken ??= await getCsrfToken()
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'x-csrf-token': cachedCsrfToken },
    })
    if (response.ok) {
      invalidateCsrfToken()
    }
    return response.ok
  })().finally(() => {
    inFlightRefresh = undefined
  })

  return inFlightRefresh
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

  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })

  let response = await doFetch()

  if (response.status === 401 && !AUTH_ENDPOINTS_WITHOUT_REFRESH.has(path)) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      response = await doFetch()
    }
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    data = undefined
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      (data as { message?: string })?.message ?? 'Unknown error',
    )
  }

  return data as T
}
