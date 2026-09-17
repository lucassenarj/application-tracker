import type { User } from '../../domain/user';
import type { UserRepository } from '../../domain/user.repository';

export class FakeUserRepository implements UserRepository {
  private readonly usersByEmail = new Map<string, User>();
  private readonly usersById = new Map<string, User>();

  save(user: User): Promise<void> {
    this.usersByEmail.set(user.email, user);
    this.usersById.set(user.id, user);
    return Promise.resolve();
  }

  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(this.usersByEmail.get(email) ?? null);
  }

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.usersById.get(id) ?? null);
  }
}
