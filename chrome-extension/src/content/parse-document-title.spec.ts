import { parseDocumentTitle } from './parse-document-title'

describe('parseDocumentTitle', () => {
  afterEach(() => {
    document.title = ''
  })

  it('parses title and companyName from the "{title} | {company} | LinkedIn" format', () => {
    document.title = 'Technical Lead (NodeJS) | act digital EMEA - Alter Solutions | LinkedIn'

    const result = parseDocumentTitle()

    expect(result.title).toBe('Technical Lead (NodeJS)')
    expect(result.companyName).toBe('act digital EMEA - Alter Solutions')
  })

  it('handles a company name containing an ampersand', () => {
    document.title = 'Backend, Frontend & Fullstack Developers | Hays | LinkedIn'

    const result = parseDocumentTitle()

    expect(result.title).toBe('Backend, Frontend & Fullstack Developers')
    expect(result.companyName).toBe('Hays')
  })

  it('returns undefined fields when the title does not end with "| LinkedIn"', () => {
    document.title = 'Some unrelated page title'

    const result = parseDocumentTitle()

    expect(result.title).toBeUndefined()
    expect(result.companyName).toBeUndefined()
  })

  it('returns undefined fields when there is no pipe separating title and company', () => {
    document.title = 'Just a title | LinkedIn'

    const result = parseDocumentTitle()

    expect(result.title).toBeUndefined()
    expect(result.companyName).toBeUndefined()
  })
})
