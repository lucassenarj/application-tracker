import { extractJobPosting } from './extract-job-posting'
import { EXTRACT_JOB_POSTING, type ExtractJobPostingRequest } from './messages'

chrome.runtime.onMessage.addListener(
  (message: ExtractJobPostingRequest, _sender, sendResponse) => {
    if (message.type === EXTRACT_JOB_POSTING) {
      sendResponse({ ...extractJobPosting(), externalUrl: window.location.href })
    }
  },
)
