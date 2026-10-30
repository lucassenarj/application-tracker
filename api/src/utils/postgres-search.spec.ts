import { toPrefixTsQuery } from './postgres-search';

describe('toPrefixTsQuery', () => {
  it('appends a prefix wildcard to a single search term', () => {
    expect(toPrefixTsQuery('backend')).toBe('backend:*');
  });
  it('joins multiple terms with & and only appends the prefix wildcard to the last term', () => {
    expect(toPrefixTsQuery('senior backend')).toBe('senior & backend:*');
  });
  it('strips non-alphanumeric characters from each term', () => {
    expect(toPrefixTsQuery('C++')).toBe('C:*');
  });

  it('returns undefined for an empty string', () => {
    expect(toPrefixTsQuery('')).toBeUndefined();
  });

  it('returns undefined for a whitespace-only string', () => {
    expect(toPrefixTsQuery('   ')).toBeUndefined();
  });

  it('returns undefined when every character is stripped as non-alphanumeric', () => {
    expect(toPrefixTsQuery('!!!')).toBeUndefined();
  });
});
