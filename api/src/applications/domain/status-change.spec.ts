import type { ApplicationStatus } from './application-status';
import { StatusChange } from './status-change';

describe('StatusChange', () => {
  it('requires interviewCategory when status is INTERVIEW_SCHEDULED', () => {
    expect(() =>
      StatusChange.create({
        applicationId: 'application-1',
        status: 'INTERVIEW_SCHEDULED',
        eventDate: new Date(),
      }),
    ).toThrow();
  });

  it('does not require interviewCategory when status is not INTERVIEW_SCHEDULED', () => {
    expect(() =>
      StatusChange.create({
        applicationId: 'application-1',
        status: 'WAITING_FEEDBACK',
        eventDate: new Date(),
      }),
    ).not.toThrow();
  });

  it('throws an error when applicationId is missing', () => {
    expect(() =>
      StatusChange.create({
        applicationId: '',
        status: 'WAITING_FEEDBACK',
        eventDate: new Date(),
      }),
    ).toThrow();
  });

  it('throws an error when status is missing', () => {
    expect(() =>
      StatusChange.create({
        applicationId: 'application-1',
        status: undefined as unknown as ApplicationStatus,
        eventDate: new Date(),
      }),
    ).toThrow();
  });

  it('throws an error when eventDate is missing', () => {
    expect(() =>
      StatusChange.create({
        applicationId: 'application-1',
        status: 'WAITING_FEEDBACK',
        eventDate: undefined as unknown as Date,
      }),
    ).toThrow();
  });

  it('generates id and createdAt on creation, never passed in', () => {
    const first = StatusChange.create({
      applicationId: 'application-1',
      status: 'WAITING_FEEDBACK',
      eventDate: new Date(),
    });
    const second = StatusChange.create({
      applicationId: 'application-1',
      status: 'WAITING_FEEDBACK',
      eventDate: new Date(),
    });

    expect(first.id).toEqual(expect.any(String));
    expect(first.id).not.toBe('');
    expect(first.createdAt).toBeInstanceOf(Date);
    expect(first.id).not.toBe(second.id);
  });

  it('leaves optional fields (notes, contact) undefined when omitted', () => {
    const statusChange = StatusChange.create({
      applicationId: 'application-1',
      status: 'WAITING_FEEDBACK',
      eventDate: new Date(),
    });

    expect(statusChange.notes).toBeUndefined();
    expect(statusChange.contact).toBeUndefined();
  });
});
