import { extractDescriptionHtml } from './extract-description-html'

function renderJobDetailPage(descriptionHtml: string) {
  document.body.innerHTML = `
    <h2>About the job</h2>
    <div>
      <span data-testid="expandable-text-box">${descriptionHtml}</span>
    </div>
  `
}

describe('extractDescriptionHtml', () => {
  it('returns the innerHTML of the expandable-text-box following the "About the job" heading', () => {
    renderJobDetailPage('<p>We are looking for an <strong>experienced developer</strong>.</p>')

    const result = extractDescriptionHtml()

    expect(result).toBe('<p>We are looking for an <strong>experienced developer</strong>.</p>')
  })

  it('ignores an expandable-text-box that appears before the "About the job" heading', () => {
    document.body.innerHTML = `
      <span data-testid="expandable-text-box">Unrelated earlier section</span>
      <h2>About the job</h2>
      <div>
        <span data-testid="expandable-text-box"><p>The real description</p></span>
      </div>
    `

    const result = extractDescriptionHtml()

    expect(result).toBe('<p>The real description</p>')
  })

  it('returns undefined when there is no "About the job" heading', () => {
    document.body.innerHTML = '<span data-testid="expandable-text-box">Some text</span>'

    const result = extractDescriptionHtml()

    expect(result).toBeUndefined()
  })

  it('returns undefined when the heading is present but no expandable-text-box follows it', () => {
    document.body.innerHTML = '<h2>About the job</h2>'

    const result = extractDescriptionHtml()

    expect(result).toBeUndefined()
  })
})
