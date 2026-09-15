import { randomUUID } from 'crypto';

export interface CreateCompanyProps {
  name: string;
  website?: string;
}

export class Company {
  readonly id: string;
  readonly name: string;
  readonly website?: string;

  private constructor(props: { id: string; name: string; website?: string }) {
    this.id = props.id;
    this.name = props.name;
    this.website = props.website;
  }

  static create(input: CreateCompanyProps): Company {
    if (!input.name) {
      throw new Error('name is required');
    }

    return new Company({
      id: randomUUID(),
      name: normalizeName(input.name),
      website: input.website,
    });
  }

  static reconstitute(props: {
    id: string;
    name: string;
    website?: string;
  }): Company {
    return new Company(props);
  }
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}
