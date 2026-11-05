describe('apiFetch', () => {
  let apiFetch: (typeof import('./api-client'))['apiFetch']
  let ApiError: (typeof import('./api-client'))['ApiError']
  let invalidateCsrfToken: (typeof import('./api-client'))['invalidateCsrfToken']
  const fetchMock = vi.fn()

  beforeEach(async () => {
    vi.resetModules()
    vi.stubEnv('VITE_API_URL', 'https://api.example.com')
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })
    vi.stubGlobal('fetch', fetchMock)
    ;({ apiFetch, ApiError, invalidateCsrfToken } = await import('./api-client'))
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  function mockCsrfTokenAndAlwaysUnauthorized() {
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/auth/csrf-token')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ csrfToken: 'test-csrf-token' }),
        })
      }
      return Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      })
    })
  }

  describe('request construction', () => {
    it('prepends the configured base URL to the given path', async () => {
      await apiFetch('/applications')

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/applications',
        expect.anything(),
      )
    })

    it('sends credentials: include on every request', async () => {
      await apiFetch('/applications')

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ credentials: 'include' }),
      )
    })
    it('sets Content-Type: application/json and serializes the body when one is provided', async () => {
      await apiFetch('/applications', {
        method: 'POST',
        body: { title: 'Senior Backend Engineer' },
      })

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ title: 'Senior Backend Engineer' }),
        }),
      )
    })
  })

  describe('response handling', () => {
    it('returns the parsed JSON response', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: '1', title: 'Senior Backend Engineer' }),
      })

      const result = await apiFetch('/applications/1')

      expect(result).toEqual({ id: '1', title: 'Senior Backend Engineer' })
    })
    it('throws an ApiError with the response status and message when the response is not ok', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Application not found' }),
      })

      await expect(apiFetch('/applications/nonexistent')).rejects.toBeInstanceOf(
        ApiError,
      )
      await expect(apiFetch('/applications/nonexistent')).rejects.toMatchObject({
        status: 404,
        message: 'Application not found',
      })
    })
    it('returns undefined when the response body is empty', async () => {
      fetchMock.mockImplementation((url: string) => {
        if (url.endsWith('/auth/csrf-token')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrfToken: 'test-csrf-token' }),
          })
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.reject(new SyntaxError('Unexpected end of JSON input')),
        })
      })

      const result = await apiFetch('/auth/logout', { method: 'POST' })

      expect(result).toBeUndefined()
    })
  })

  describe('CSRF handling', () => {
    it('fetches and attaches an x-csrf-token header for a mutating request', async () => {
      fetchMock.mockImplementation((url: string) => {
        if (url.endsWith('/auth/csrf-token')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrfToken: 'test-csrf-token' }),
          })
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      })

      await apiFetch('/applications', {
        method: 'POST',
        body: { title: 'Senior Backend Engineer' },
      })

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/auth/csrf-token',
        expect.objectContaining({ credentials: 'include' }),
      )
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/applications',
        expect.objectContaining({
          headers: expect.objectContaining({ 'x-csrf-token': 'test-csrf-token' }),
        }),
      )
    })
    it('does not attempt to fetch a CSRF token for a GET request', async () => {
      await apiFetch('/applications')

      expect(fetchMock).not.toHaveBeenCalledWith(
        expect.stringContaining('/auth/csrf-token'),
        expect.anything(),
      )
    })
    it('reuses an already-cached CSRF token on a second mutating request', async () => {
      fetchMock.mockImplementation((url: string) => {
        if (url.endsWith('/auth/csrf-token')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrfToken: 'test-csrf-token' }),
          })
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      })

      await apiFetch('/applications', { method: 'POST', body: {} })
      await apiFetch('/applications', { method: 'POST', body: {} })

      const csrfTokenCalls = fetchMock.mock.calls.filter(([url]) =>
        (url as string).endsWith('/auth/csrf-token'),
      )
      expect(csrfTokenCalls).toHaveLength(1)
    })

    it('invalidateCsrfToken clears the cached token so the next mutating request fetches a new one', async () => {
      let csrfTokenCallCount = 0
      fetchMock.mockImplementation((url: string) => {
        if (url.endsWith('/auth/csrf-token')) {
          csrfTokenCallCount += 1
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ csrfToken: `csrf-token-${csrfTokenCallCount}` }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      await apiFetch('/applications', { method: 'POST', body: {} })
      invalidateCsrfToken()
      await apiFetch('/applications', { method: 'POST', body: {} })

      expect(csrfTokenCallCount).toBe(2)
    })
  })

  describe('token refresh', () => {
    it('retries the original request after a successful refresh, when the first attempt returns 401', async () => {
      let applicationsCallCount = 0
      fetchMock.mockImplementation((url: string) => {
        if (url.endsWith('/applications/1')) {
          applicationsCallCount += 1
          if (applicationsCallCount === 1) {
            return Promise.resolve({
              ok: false,
              status: 401,
              json: () => Promise.resolve({ message: 'Unauthorized' }),
            })
          }
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ id: '1', title: 'Senior Backend Engineer' }),
          })
        }
        if (url.endsWith('/auth/refresh')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
        }
        if (url.endsWith('/auth/csrf-token')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrfToken: 'test-csrf-token' }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const result = await apiFetch('/applications/1')

      expect(result).toEqual({ id: '1', title: 'Senior Backend Engineer' })
    })

    it.each(['/auth/login', '/auth/register'])(
      'does not attempt a refresh for a 401 from %s',
      async (path) => {
        mockCsrfTokenAndAlwaysUnauthorized()

        await expect(
          apiFetch(path, { method: 'POST', body: {} }),
        ).rejects.toBeInstanceOf(ApiError)

        const refreshCalls = fetchMock.mock.calls.filter(([url]) =>
          (url as string).endsWith('/auth/refresh'),
        )
        expect(refreshCalls).toHaveLength(0)
      },
    )

    it('does not attempt a second refresh when /auth/refresh itself returns 401', async () => {
      mockCsrfTokenAndAlwaysUnauthorized()

      await expect(
        apiFetch('/auth/refresh', { method: 'POST', body: {} }),
      ).rejects.toBeInstanceOf(ApiError)

      const refreshCalls = fetchMock.mock.calls.filter(([url]) =>
        (url as string).endsWith('/auth/refresh'),
      )
      expect(refreshCalls).toHaveLength(1)
    })

    it('shares a single in-flight refresh call across concurrent 401s', async () => {
      let firstCallCount = 0
      let secondCallCount = 0
      fetchMock.mockImplementation((url: string) => {
        if (url.endsWith('/applications/1')) {
          firstCallCount += 1
          if (firstCallCount === 1) {
            return Promise.resolve({
              ok: false,
              status: 401,
              json: () => Promise.resolve({}),
            })
          }
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: '1' }) })
        }
        if (url.endsWith('/applications/2')) {
          secondCallCount += 1
          if (secondCallCount === 1) {
            return Promise.resolve({
              ok: false,
              status: 401,
              json: () => Promise.resolve({}),
            })
          }
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: '2' }) })
        }
        if (url.endsWith('/auth/refresh')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
        }
        if (url.endsWith('/auth/csrf-token')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrfToken: 'test-csrf-token' }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const [first, second] = await Promise.all([
        apiFetch('/applications/1'),
        apiFetch('/applications/2'),
      ])

      expect(first).toEqual({ id: '1' })
      expect(second).toEqual({ id: '2' })

      const refreshCalls = fetchMock.mock.calls.filter(([url]) =>
        (url as string).endsWith('/auth/refresh'),
      )
      expect(refreshCalls).toHaveLength(1)
    })

    it('propagates the original 401 and does not retry when the refresh itself fails', async () => {
      let applicationsCallCount = 0
      fetchMock.mockImplementation((url: string) => {
        if (url.endsWith('/applications/1')) {
          applicationsCallCount += 1
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ message: 'Unauthorized' }),
          })
        }
        if (url.endsWith('/auth/refresh')) {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ message: 'Invalid refresh token' }),
          })
        }
        if (url.endsWith('/auth/csrf-token')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrfToken: 'test-csrf-token' }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      await expect(apiFetch('/applications/1')).rejects.toMatchObject({
        status: 401,
        message: 'Unauthorized',
      })
      expect(applicationsCallCount).toBe(1)
    })

    it('attaches a CSRF token to the refresh call itself', async () => {
      let applicationsCallCount = 0
      fetchMock.mockImplementation((url: string) => {
        if (url.endsWith('/applications/1')) {
          applicationsCallCount += 1
          if (applicationsCallCount === 1) {
            return Promise.resolve({
              ok: false,
              status: 401,
              json: () => Promise.resolve({}),
            })
          }
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: '1' }) })
        }
        if (url.endsWith('/auth/refresh')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
        }
        if (url.endsWith('/auth/csrf-token')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrfToken: 'test-csrf-token' }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      await apiFetch('/applications/1')

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/auth/refresh',
        expect.objectContaining({
          headers: expect.objectContaining({ 'x-csrf-token': 'test-csrf-token' }),
        }),
      )
    })

    it('clears the cached CSRF token after a successful refresh, so a later mutating request fetches a new one', async () => {
      let csrfTokenCallCount = 0
      let applicationsCallCount = 0
      fetchMock.mockImplementation((url: string) => {
        if (url.endsWith('/auth/csrf-token')) {
          csrfTokenCallCount += 1
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrfToken: `csrf-token-${csrfTokenCallCount}` }),
          })
        }
        if (url.endsWith('/auth/refresh')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
        }
        if (url.endsWith('/applications')) {
          applicationsCallCount += 1
          if (applicationsCallCount === 1) {
            return Promise.resolve({
              ok: false,
              status: 401,
              json: () => Promise.resolve({}),
            })
          }
          return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      await apiFetch('/applications', { method: 'POST', body: {} })
      await apiFetch('/applications', { method: 'POST', body: {} })

      expect(csrfTokenCallCount).toBe(2)
    })
  })
})
