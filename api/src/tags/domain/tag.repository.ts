import { Tag } from './tag';

export interface TagRepository {
  save(tag: Tag): Promise<void>;
  findByNormalizedName(name: string): Promise<Tag | null>;
  findById(id: string): Promise<Tag | null>;
  search(query: string): Promise<Tag[]>;
}
