import { Application } from './application';

describe('Application', () => {
  it('creates an Application with valid required fields (title, companyId, userId) and exposes those values back', () => {
    const application = Application.create({
      title: 'Senior Backend Engineer',
      companyId: 'company-1',
      userId: 'user-1',
    });

    expect(application.title).toBe('Senior Backend Engineer');
    expect(application.companyId).toBe('company-1');
    expect(application.userId).toBe('user-1');
  });

  it('sets currentStatus to APPLIED automatically on creation, never passed in', () => {
    const application = Application.create({
      title: 'Senior Backend Engineer',
      companyId: 'company-1',
      userId: 'user-1',
    });

    expect(application.currentStatus).toBe('APPLIED');
  });

  it('holds exactly one StatusChange with status APPLIED on creation', () => {
    const application = Application.create({
      title: 'Senior Backend Engineer',
      companyId: 'company-1',
      userId: 'user-1',
    });

    expect(application.statusHistory).toHaveLength(1);
    expect(application.statusHistory[0].status).toBe('APPLIED');
  });

  it('generates id and createdAt on creation, never passed in', () => {
    const first = Application.create({
      title: 'Senior Backend Engineer',
      companyId: 'company-1',
      userId: 'user-1',
    });
    const second = Application.create({
      title: 'Senior Backend Engineer',
      companyId: 'company-1',
      userId: 'user-1',
    });

    expect(first.id).toEqual(expect.any(String));
    expect(first.id).not.toBe('');
    expect(first.createdAt).toBeInstanceOf(Date);
    expect(first.id).not.toBe(second.id);
  });

  it('leaves optional fields (description, externalUrl, salary) undefined when omitted', () => {
    const application = Application.create({
      title: 'Senior Backend Engineer',
      companyId: 'company-1',
      userId: 'user-1',
    });

    expect(application.description).toBeUndefined();
    expect(application.externalUrl).toBeUndefined();
    expect(application.salary).toBeUndefined();
  });

  it('throws an error when title is missing', () => {
    expect(() =>
      Application.create({
        title: '',
        companyId: 'company-1',
        userId: 'user-1',
      }),
    ).toThrow();
  });

  it('throws an error when title is over 255 characters', () => {
    expect(() =>
      Application.create({
        title: 'a'.repeat(256),
        companyId: 'company-1',
        userId: 'user-1',
      }),
    ).toThrow();
  });

  it('throws an error when companyId is missing', () => {
    expect(() =>
      Application.create({
        title: 'Senior Backend Engineer',
        companyId: '',
        userId: 'user-1',
      }),
    ).toThrow();
  });

  it('throws an error when userId is missing', () => {
    expect(() =>
      Application.create({
        title: 'Senior Backend Engineer',
        companyId: 'company-1',
        userId: '',
      }),
    ).toThrow();
  });
});
