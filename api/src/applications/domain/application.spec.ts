import { Application } from './application';
import { StatusChange } from './status-change';

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

  it('changes currentStatus and appends a StatusChange when the transition is valid', () => {
    const application = Application.create({
      title: 'Senior Backend Engineer',
      companyId: 'company-1',
      userId: 'user-1',
    });

    const updated = application.changeStatus({
      status: 'INTERVIEW_SCHEDULED',
      eventDate: new Date(),
      interviewCategory: 'NON_TECHNICAL',
    });

    expect(updated.currentStatus).toBe('INTERVIEW_SCHEDULED');
    expect(updated.statusHistory).toHaveLength(2);
    expect(updated.statusHistory[1].status).toBe('INTERVIEW_SCHEDULED');
  });

  it('throws an error when the transition is invalid', () => {
    const application = Application.create({
      title: 'Senior Backend Engineer',
      companyId: 'company-1',
      userId: 'user-1',
    });

    expect(() =>
      application.changeStatus({
        status: 'OFFER_ACCEPTED',
        eventDate: new Date(),
      }),
    ).toThrow();
  });

  it('throws an error when status is INTERVIEW_SCHEDULED and interviewCategory is missing', () => {
    const application = Application.create({
      title: 'Senior Backend Engineer',
      companyId: 'company-1',
      userId: 'user-1',
    });

    expect(() =>
      application.changeStatus({
        status: 'INTERVIEW_SCHEDULED',
        eventDate: new Date(),
      }),
    ).toThrow();
  });

  it('does not mutate the original Application when changing status', () => {
    const application = Application.create({
      title: 'Senior Backend Engineer',
      companyId: 'company-1',
      userId: 'user-1',
    });

    application.changeStatus({
      status: 'WAITING_FEEDBACK',
      eventDate: new Date(),
    });

    expect(application.currentStatus).toBe('APPLIED');
    expect(application.statusHistory).toHaveLength(1);
  });

  it('reconstitutes an Application from persisted values without regenerating id or defaulting currentStatus/statusHistory', () => {
    const createdAt = new Date('2026-01-01');
    const statusChange = StatusChange.create({
      applicationId: 'existing-id',
      status: 'APPLIED',
      eventDate: createdAt,
    });

    const application = Application.reconstitute({
      id: 'existing-id',
      title: 'Senior Backend Engineer',
      companyId: 'company-1',
      userId: 'user-1',
      currentStatus: 'WAITING_FEEDBACK',
      statusHistory: [statusChange],
      createdAt,
    });

    expect(application.id).toBe('existing-id');
    expect(application.currentStatus).toBe('WAITING_FEEDBACK');
    expect(application.statusHistory).toEqual([statusChange]);
    expect(application.createdAt).toBe(createdAt);
  });
});
