import { Application } from './application';

export interface ApplicationRepository {
  save(application: Application): Promise<void>;
  findById(id: string): Promise<Application | null>;
  findAllByUser(userId: string): Promise<Application[]>;
}
