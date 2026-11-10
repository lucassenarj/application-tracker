import type { ExtractedJobPosting } from './extract-job-posting'

export const EXTRACT_JOB_POSTING = 'EXTRACT_JOB_POSTING' as const

export interface ExtractJobPostingRequest {
  type: typeof EXTRACT_JOB_POSTING
}

export interface ExtractJobPostingResponse extends ExtractedJobPosting {
  externalUrl: string
}
