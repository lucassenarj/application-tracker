const STORAGE_KEY = 'personalAccessToken'

export async function getStoredToken(): Promise<string | undefined> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  return result[STORAGE_KEY] as string | undefined
}

export async function setStoredToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: token })
}

export async function clearStoredToken(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY)
}
