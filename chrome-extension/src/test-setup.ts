import '@testing-library/jest-dom/vitest'

export const fetchMock = vi.fn()

const storageData: Record<string, unknown> = {}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)

  for (const key of Object.keys(storageData)) {
    delete storageData[key]
  }
  vi.stubGlobal('chrome', {
    storage: {
      local: {
        get: vi.fn((keys: string | string[]) => {
          const keyList = Array.isArray(keys) ? keys : [keys]
          const result: Record<string, unknown> = {}
          for (const key of keyList) {
            if (key in storageData) result[key] = storageData[key]
          }
          return Promise.resolve(result)
        }),
        set: vi.fn((items: Record<string, unknown>) => {
          Object.assign(storageData, items)
          return Promise.resolve()
        }),
        remove: vi.fn((keys: string | string[]) => {
          const keyList = Array.isArray(keys) ? keys : [keys]
          for (const key of keyList) delete storageData[key]
          return Promise.resolve()
        }),
      },
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})
