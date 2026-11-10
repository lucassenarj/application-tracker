import { EXTRACT_JOB_POSTING, type ExtractJobPostingResponse } from '../content/messages'

export async function requestJobPostingExtraction(): Promise<ExtractJobPostingResponse | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return undefined

  try {
    return await chrome.tabs.sendMessage(tab.id, { type: EXTRACT_JOB_POSTING })
  } catch {
    return undefined
  }
}
