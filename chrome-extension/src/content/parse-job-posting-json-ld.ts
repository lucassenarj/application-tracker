export interface ParsedJobPostingJsonLd {
  title?: string
  companyName?: string
  description?: string
  skills?: string
}

export function parseJobPostingJsonLd(
  doc: Document = document,
): ParsedJobPostingJsonLd | null {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]')

  for (const script of scripts) {
    let data: Record<string, unknown>
    try {
      data = JSON.parse(script.textContent ?? '')
    } catch {
      continue
    }

    if (data['@type'] !== 'JobPosting') continue

    const hiringOrganization = data.hiringOrganization as
      | { name?: string }
      | undefined

    return {
      title: data.title as string | undefined,
      companyName: hiringOrganization?.name,
      description: data.description as string | undefined,
      skills: (data.skills as string | undefined) || undefined,
    }
  }

  return null
}
