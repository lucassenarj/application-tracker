export function toPrefixTsQuery(search: string): string | undefined {
  const terms = search
    .split(/\s+/)
    .map((term) => term.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((term) => term.length > 0);

  if (terms.length === 0) {
    return undefined;
  }

  return terms
    .map((term, index) => (index === terms.length - 1 ? `${term}:*` : term))
    .join(' & ');
}
