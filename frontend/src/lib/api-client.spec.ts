describe('apiFetch', () => {
  let apiFetch: (typeof import('./api-client'))['apiFetch']
  let ApiError: (typeof import('./api-client'))['ApiError']
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
    ;({ apiFetch, ApiError } = await import('./api-client'))
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

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
  })
})
