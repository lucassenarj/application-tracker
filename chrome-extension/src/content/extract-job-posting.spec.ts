import { extractJobPosting } from './extract-job-posting'

const REAL_JOB_POSTING_JSON_LD = {
  '@context': 'http://schema.org',
  '@type': 'JobPosting',
  description:
    '&lt;strong&gt;Job Description&lt;br&gt;&lt;br&gt;&lt;/strong&gt;You\'re ready to grow.',
  hiringOrganization: {
    '@type': 'Organization',
    name: 'JPMorganChase',
  },
  skills: '',
  title: 'Software Engineer II (Java/AWS)',
}

function renderJsonLdScript(payload: object) {
  document.body.innerHTML = `<script type="application/ld+json">${JSON.stringify(payload)}</script>`
}

function renderDomOnlyJobPage() {
  document.title = 'Technical Lead (NodeJS) | act digital EMEA - Alter Solutions | LinkedIn'
  document.body.innerHTML = `
    <h2>About the job</h2>
    <div>
      <span data-testid="expandable-text-box"><p>Real DOM description</p></span>
    </div>
  `
}

describe('extractJobPosting', () => {
  afterEach(() => {
    document.title = ''
  })

  it('uses JSON-LD title, companyName, description, and skills when a JobPosting script is present', () => {
    renderJsonLdScript({ ...REAL_JOB_POSTING_JSON_LD, skills: 'Java, AWS, Spring Boot' })

    const result = extractJobPosting()

    expect(result.title).toBe('Software Engineer II (Java/AWS)')
    expect(result.companyName).toBe('JPMorganChase')
    expect(result.description).toContain('Job Description')
    expect(result.skills).toBe('Java, AWS, Spring Boot')
  })

  it('falls back to parseDocumentTitle for title and companyName when no JSON-LD is present', () => {
    renderDomOnlyJobPage()

    const result = extractJobPosting()

    expect(result.title).toBe('Technical Lead (NodeJS)')
    expect(result.companyName).toBe('act digital EMEA - Alter Solutions')
  })

  it('falls back to extractDescriptionHtml converted via htmlToPlainText when no JSON-LD is present', () => {
    renderDomOnlyJobPage()

    const result = extractJobPosting()

    expect(result.description).toBe('Real DOM description')
  })

  it('returns skills as undefined when there is no JSON-LD at all', () => {
    renderDomOnlyJobPage()

    const result = extractJobPosting()

    expect(result.skills).toBeUndefined()
  })

  it('falls back to dictionary-detected skills from the description when JSON-LD has none', () => {
    document.title = 'Technical Lead (NodeJS) | act digital EMEA - Alter Solutions | LinkedIn'
    document.body.innerHTML = `
      <h2>About the job</h2>
      <div>
        <span data-testid="expandable-text-box"><p>We need React and Java experience.</p></span>
      </div>
    `

    const result = extractJobPosting()

    expect(result.skills).toBe('React, Java')
  })

  it('returns all fields undefined when neither JSON-LD nor any DOM fallback matches anything', () => {
    document.body.innerHTML = ''

    const result = extractJobPosting()

    expect(result.title).toBeUndefined()
    expect(result.companyName).toBeUndefined()
    expect(result.description).toBeUndefined()
    expect(result.skills).toBeUndefined()
  })
})
