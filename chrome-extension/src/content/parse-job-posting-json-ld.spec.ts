import { parseJobPostingJsonLd } from './parse-job-posting-json-ld'

// Real JSON-LD captured earlier this session from an actual LinkedIn posting
// (api/test verification work), trimmed for readability.
const REAL_JOB_POSTING_JSON_LD = {
  '@context': 'http://schema.org',
  '@type': 'JobPosting',
  datePosted: '2026-10-29T09:43:31.000Z',
  description:
    '&lt;strong&gt;Job Description&lt;br&gt;&lt;br&gt;&lt;/strong&gt;You\'re ready to gain the skills and experience needed to grow within your role.',
  employmentType: 'FULL_TIME',
  hiringOrganization: {
    '@type': 'Organization',
    name: 'JPMorganChase',
    sameAs: 'https://www.linkedin.com/company/jpmorganchase',
  },
  skills: '',
  title: 'Software Engineer II (Java/AWS)',
  validThrough: '2026-12-07T03:39:36.000Z',
}

const REAL_BREADCRUMB_JSON_LD = {
  '@context': 'http://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [{ '@type': 'ListItem', position: 1, name: { str: 'Jobs' } }],
}

function renderJsonLdScripts(...payloads: object[]) {
  document.body.innerHTML = payloads
    .map(
      (payload) =>
        `<script type="application/ld+json">${JSON.stringify(payload)}</script>`,
    )
    .join('')
}

describe('parseJobPostingJsonLd', () => {
  it('parses title, companyName, and description from a real JobPosting JSON-LD script', () => {
    renderJsonLdScripts(REAL_BREADCRUMB_JSON_LD, REAL_JOB_POSTING_JSON_LD)

    const result = parseJobPostingJsonLd()

    expect(result?.title).toBe('Software Engineer II (Java/AWS)')
    expect(result?.companyName).toBe('JPMorganChase')
    expect(result?.description).toContain('Job Description')
  })

  it('returns null when no ld+json script is present at all', () => {
    document.body.innerHTML = ''

    const result = parseJobPostingJsonLd()

    expect(result).toBeNull()
  })

  it('returns null when ld+json scripts are present but none are JobPosting', () => {
    renderJsonLdScripts(REAL_BREADCRUMB_JSON_LD)

    const result = parseJobPostingJsonLd()

    expect(result).toBeNull()
  })

  it('returns skills when present in the JSON-LD', () => {
    renderJsonLdScripts({
      ...REAL_JOB_POSTING_JSON_LD,
      skills: 'Java, AWS, Spring Boot',
    })

    const result = parseJobPostingJsonLd()

    expect(result?.skills).toBe('Java, AWS, Spring Boot')
  })
})
