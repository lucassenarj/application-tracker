import { Exclude, Expose } from 'class-transformer';
import { User } from '../domain/user';

export class UserResponse {
  @Expose() id: string;
  @Expose() email: string;
  @Expose() name?: string;
  @Expose() avatar?: string;
  @Expose() createdAt: Date;

  @Exclude()
  passwordHash?: string;

  static fromDomain(user: User): UserResponse {
    return Object.assign(new UserResponse(), user);
  }
}
