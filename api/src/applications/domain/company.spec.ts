import { Company } from './company';

describe('Company', () => {
  describe('create', () => {
    it('creates a Company with a valid name and exposes it back', () => {
      const company = Company.create({ name: 'Acme Corp' });

      expect(company.name).toBe('Acme Corp');
    });

    it('normalizes name on creation (lowercase, then capitalize first letter of each word)', () => {
      const company = Company.create({ name: 'STRIPE INC' });

      expect(company.name).toBe('Stripe Inc');
    });

    it('throws an error when name is missing', () => {
      expect(() => Company.create({ name: '' })).toThrow();
    });

    it('leaves website undefined when omitted', () => {
      const company = Company.create({ name: 'Acme Corp' });

      expect(company.website).toBeUndefined();
    });

    it('generates id on creation, never passed in', () => {
      const first = Company.create({ name: 'Acme Corp' });
      const second = Company.create({ name: 'Acme Corp' });

      expect(first.id).toEqual(expect.any(String));
      expect(first.id).not.toBe('');
      expect(first.id).not.toBe(second.id);
    });
  });

  describe('reconstitute', () => {
    it('reconstitutes a Company from persisted values without regenerating id or re-normalizing name', () => {
      const company = Company.reconstitute({
        id: 'existing-id',
        name: 'Acme Corp',
        website: 'https://acme.example',
      });

      expect(company.id).toBe('existing-id');
      expect(company.name).toBe('Acme Corp');
      expect(company.website).toBe('https://acme.example');
    });
  });

  describe('normalizeName', () => {
    it('exposes normalizeName so callers can normalize a name the same way before searching', () => {
      expect(Company.normalizeName('STRIPE INC')).toBe('Stripe Inc');
    });
  });
});
