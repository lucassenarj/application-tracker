import { parseJobPostingJsonLd } from './parse-job-posting-json-ld'
import { parseDocumentTitle } from './parse-document-title'
import { extractDescriptionHtml } from './extract-description-html'
import { htmlToPlainText } from './html-to-plain-text'
import { detectSkillsInText } from './detect-skills-in-text'

export interface ExtractedJobPosting {
  title?: string
  companyName?: string
  description?: string
  skills?: string
}

export function extractJobPosting(doc: Document = document): ExtractedJobPosting {
  const jsonLd = parseJobPostingJsonLd(doc)
  const fallback = parseDocumentTitle(doc)

  const descriptionHtml = jsonLd?.description ?? extractDescriptionHtml(doc)
  const description = descriptionHtml ? htmlToPlainText(descriptionHtml) : undefined
  const detectedSkills = description ? detectSkillsInText(description) : []

  return {
    title: jsonLd?.title ?? fallback.title,
    companyName: jsonLd?.companyName ?? fallback.companyName,
    description,
    skills: jsonLd?.skills ?? (detectedSkills.length > 0 ? detectedSkills.join(', ') : undefined),
  }
}
