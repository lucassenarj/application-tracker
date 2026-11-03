import { generateToken, hashToken } from './token-crypto';

describe('generateToken', () => {
  it('generates a token as a hex string', () => {
    const token = generateToken();

    expect(token).toMatch(/^[0-9a-f]+$/);
  });
  it('generates a different token on each call', () => {
    const firstToken = generateToken();
    const secondToken = generateToken();

    expect(firstToken).not.toBe(secondToken);
  });
});

describe('hashToken', () => {
  it('generates the same hash for the same token', () => {
    const token = generateToken();

    const firstHash = hashToken(token);
    const secondHash = hashToken(token);

    expect(firstHash).toBe(secondHash);
  });
  it('generates a different hash for a different token', () => {
    const firstToken = generateToken();
    const secondToken = generateToken();

    expect(hashToken(firstToken)).not.toBe(hashToken(secondToken));
  });
});
