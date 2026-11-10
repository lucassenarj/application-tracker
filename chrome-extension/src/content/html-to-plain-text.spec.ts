import { htmlToPlainText } from './html-to-plain-text'

describe('htmlToPlainText', () => {
  it('decodes entities and converts <br> into line breaks', () => {
    const html =
      '&lt;strong&gt;Job Description&lt;/strong&gt;&lt;br&gt;&lt;br&gt;You\'re ready to grow.'

    const result = htmlToPlainText(html)

    expect(result).toBe('Job Description\n\nYou\'re ready to grow.')
  })

  it('converts <ul><li> list items into bullet-prefixed lines', () => {
    const html = '&lt;ul&gt;&lt;li&gt;First item&lt;/li&gt;&lt;li&gt;Second item&lt;/li&gt;&lt;/ul&gt;'

    const result = htmlToPlainText(html)

    expect(result).toBe('• First item\n• Second item')
  })

  it('collapses three or more consecutive newlines down to two', () => {
    const html = 'A&lt;br&gt;&lt;br&gt;&lt;br&gt;&lt;br&gt;B'

    const result = htmlToPlainText(html)

    expect(result).toBe('A\n\nB')
  })

  it('inserts a line break after each paragraph, including a heading-like paragraph followed by a list', () => {
    const html =
      '&lt;p&gt;Explore and evaluate emerging technologies that can enhance the platform\'s capabilities.&lt;/p&gt;&lt;p&gt;&lt;br /&gt;&lt;/p&gt;&lt;p&gt;Requirements&lt;/p&gt;&lt;ul&gt;&lt;li&gt;University or college degree in Computer Science, Software Engineering, or a related field.&lt;/li&gt;&lt;/ul&gt;'

    const result = htmlToPlainText(html)

    expect(result).toBe(
      "Explore and evaluate emerging technologies that can enhance the platform's capabilities.\n\nRequirements\n• University or college degree in Computer Science, Software Engineering, or a related field.",
    )
  })

  it('handles already-real (non-escaped) HTML from the DOM-fallback path, collapsing incidental source whitespace', () => {
    const html =
      'Are you ready to join our team and\n                make an impact?<br><br><strong class="igtlrz">Responsibilities<br><br></strong>TeamViewer\'s Frontline\n                solution empowers'

    const result = htmlToPlainText(html)

    expect(result).toBe(
      "Are you ready to join our team and make an impact?\n\nResponsibilities\n\nTeamViewer's Frontline solution empowers",
    )
  })

  it('handles real non-escaped <li> items, including a trailing double-<br> inside the last one', () => {
    const html =
      '<li class="igtlrt">Experience with component libraries and modern frontend tooling.</li>\n                    <li class="igtlrt">Familiarity with monitoring and observability tooling (e.g., Prometheus, Grafana,\n                        ELK).<br><br></li>'

    const result = htmlToPlainText(html)

    expect(result).toBe(
      '• Experience with component libraries and modern frontend tooling.\n• Familiarity with monitoring and observability tooling (e.g., Prometheus, Grafana, ELK).',
    )
  })

  it('returns an empty string for empty input', () => {
    const result = htmlToPlainText('')

    expect(result).toBe('')
  })
})
