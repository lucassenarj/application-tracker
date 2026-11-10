import { getStoredToken, setStoredToken, clearStoredToken } from './token-storage'

describe('token-storage', () => {
  describe('getStoredToken', () => {
    it('returns undefined when no token has been stored', async () => {
      const token = await getStoredToken()

      expect(token).toBeUndefined()
    })
  })

  describe('setStoredToken', () => {
    it('stores the token so getStoredToken can retrieve it', async () => {
      await setStoredToken('raw-token')

      const token = await getStoredToken()

      expect(token).toBe('raw-token')
    })
  })

  describe('clearStoredToken', () => {
    it('removes a previously stored token', async () => {
      await setStoredToken('raw-token')

      await clearStoredToken()

      const token = await getStoredToken()
      expect(token).toBeUndefined()
    })
  })
})
