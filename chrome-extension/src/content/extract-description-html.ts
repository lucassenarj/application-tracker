export function extractDescriptionHtml(doc: Document = document): string | undefined {
  const heading = Array.from(doc.querySelectorAll('h2, h3, p')).find((el) =>
    /about the job/i.test(el.textContent ?? ''),
  )
  if (!heading) return undefined

  for (const candidate of doc.querySelectorAll('[data-testid="expandable-text-box"]')) {
    if (heading.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING) {
      return candidate.innerHTML
    }
  }
  return undefined
}
