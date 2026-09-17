import { generateRefreshToken, hashRefreshToken } from './refresh-token-crypto';

describe('generateRefreshToken', () => {
  it('generates a token as a hex string', () => {
    const token = generateRefreshToken();

    expect(token).toMatch(/^[0-9a-f]+$/);
  });
  it('generates a different token on each call', () => {
    const firstToken = generateRefreshToken();
    const secondToken = generateRefreshToken();

    expect(firstToken).not.toBe(secondToken);
  });
});

describe('hashRefreshToken', () => {
  it('generates the same hash for the same token', () => {
    const token = generateRefreshToken();

    const firstHash = hashRefreshToken(token);
    const secondHash = hashRefreshToken(token);

    expect(firstHash).toBe(secondHash);
  });
  it('generates a different hash for a different token', () => {
    const firstToken = generateRefreshToken();
    const secondToken = generateRefreshToken();

    expect(hashRefreshToken(firstToken)).not.toBe(
      hashRefreshToken(secondToken),
    );
  });
});
