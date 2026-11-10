const API_URL = import.meta.env.VITE_API_URL

export interface CreateExternalApplicationInput {
  title: string
  description?: string
  externalUrl: string
  companyName: string
  skills?: string[]
}

export interface CreateExternalApplicationResult {
  application: Record<string, unknown>
  alreadyCaptured: boolean
}

export async function createExternalApplication(
  token: string,
  input: CreateExternalApplicationInput,
): Promise<CreateExternalApplicationResult> {
  const response = await fetch(`${API_URL}/external/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.message ?? 'Failed to create application')
  }

  return { application: data, alreadyCaptured: response.status === 200 }
}
