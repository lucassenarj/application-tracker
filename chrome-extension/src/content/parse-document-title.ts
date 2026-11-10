export interface ParsedDocumentTitle {
  title?: string
  companyName?: string
}

export function parseDocumentTitle(doc: Document = document): ParsedDocumentTitle {
  const title = doc.title

  if (!title.endsWith(' | LinkedIn')) return {}

  const withoutSuffix = title.slice(0, -' | LinkedIn'.length)
  const separatorIndex = withoutSuffix.indexOf(' | ')

  if (separatorIndex === -1) return {}

  return {
    title: withoutSuffix.slice(0, separatorIndex),
    companyName: withoutSuffix.slice(separatorIndex + ' | '.length),
  }
}
