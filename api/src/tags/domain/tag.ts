import { randomUUID } from 'crypto';

export interface CreateTagProps {
  name: string;
}

export class Tag {
  readonly id: string;
  readonly name: string;

  private constructor(props: { id: string; name: string }) {
    this.id = props.id;
    this.name = props.name;
  }

  static create(input: CreateTagProps): Tag {
    if (!input.name) {
      throw new Error('name is required');
    }

    return new Tag({
      id: randomUUID(),
      name: Tag.normalizeName(input.name),
    });
  }

  static reconstitute(props: { id: string; name: string }): Tag {
    return new Tag(props);
  }

  rename(newName: string): Tag {
    return new Tag({
      id: this.id,
      name: Tag.normalizeName(newName),
    });
  }

  static normalizeName(name: string): string {
    return name.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
