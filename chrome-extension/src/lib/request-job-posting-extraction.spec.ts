import { requestJobPostingExtraction } from './request-job-posting-extraction'
import { EXTRACT_JOB_POSTING } from '../content/messages'
import { chromeTabsQueryMock, chromeTabsSendMessageMock } from '../test-setup'

describe('requestJobPostingExtraction', () => {
  it('sends an EXTRACT_JOB_POSTING message to the active tab and returns its response', async () => {
    chromeTabsQueryMock.mockResolvedValue([{ id: 42 } as chrome.tabs.Tab])
    chromeTabsSendMessageMock.mockResolvedValue({
      title: 'Software Engineer',
      externalUrl: 'https://www.linkedin.com/jobs/view/123',
    })

    const result = await requestJobPostingExtraction()

    expect(chromeTabsSendMessageMock).toHaveBeenCalledWith(42, { type: EXTRACT_JOB_POSTING })
    expect(result).toEqual({
      title: 'Software Engineer',
      externalUrl: 'https://www.linkedin.com/jobs/view/123',
    })
  })

  it('returns undefined when there is no active tab', async () => {
    chromeTabsQueryMock.mockResolvedValue([])

    const result = await requestJobPostingExtraction()

    expect(result).toBeUndefined()
  })

  it('returns undefined when sendMessage rejects (no content script on this tab)', async () => {
    chromeTabsQueryMock.mockResolvedValue([{ id: 42 } as chrome.tabs.Tab])
    chromeTabsSendMessageMock.mockRejectedValue(new Error('Could not establish connection'))

    const result = await requestJobPostingExtraction()

    expect(result).toBeUndefined()
  })
})
