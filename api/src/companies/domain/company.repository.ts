import { Company } from './company';

export interface CompanyRepository {
  save(company: Company): Promise<void>;
  findByNormalizedName(name: string): Promise<Company | null>;
  findById(id: string): Promise<Company | null>;
  search(query: string): Promise<Company[]>;
}
