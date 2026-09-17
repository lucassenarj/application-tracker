import type { PasswordHasher } from '../../domain/password-hasher';

export class FakePasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return Promise.resolve(`hashed:${password}`);
  }

  verify(password: string, hash: string): Promise<boolean> {
    return Promise.resolve(hash === `hashed:${password}`);
  }
}
