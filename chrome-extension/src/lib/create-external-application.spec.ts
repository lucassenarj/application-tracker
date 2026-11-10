import { createExternalApplication } from './create-external-application'
import { fetchMock } from '../test-setup'

describe('createExternalApplication', () => {
  it('POSTs to /external/applications with a Bearer token and returns alreadyCaptured: false on 201', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: 'app-1', title: 'Software Engineer' }),
    })

    const result = await createExternalApplication('my-token', {
      title: 'Software Engineer',
      externalUrl: 'https://www.linkedin.com/jobs/view/123',
      companyName: 'Acme',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_URL}/external/applications`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer my-token',
          'Content-Type': 'application/json',
        }),
      }),
    )
    expect(result).toEqual({
      application: { id: 'app-1', title: 'Software Engineer' },
      alreadyCaptured: false,
    })
  })

  it('returns alreadyCaptured: true on a 200 response (duplicate capture)', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 'app-1', title: 'Software Engineer' }),
    })

    const result = await createExternalApplication('my-token', {
      title: 'Software Engineer',
      externalUrl: 'https://www.linkedin.com/jobs/view/123',
      companyName: 'Acme',
    })

    expect(result.alreadyCaptured).toBe(true)
  })

  it('throws with the backend message when the response is not ok', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'companyName should not be empty' }),
    })

    await expect(
      createExternalApplication('my-token', {
        title: 'Software Engineer',
        externalUrl: 'https://www.linkedin.com/jobs/view/123',
        companyName: '',
      }),
    ).rejects.toThrow('companyName should not be empty')
  })
})
