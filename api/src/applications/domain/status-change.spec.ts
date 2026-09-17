import type { ApplicationStatus } from './application-status';
import { StatusChange } from './status-change';

describe('StatusChange', () => {
  describe('create', () => {
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

    it('generates id and createdAt on creation', () => {
      const firstStatusChange = StatusChange.create({
        applicationId: 'application-1',
        status: 'WAITING_FEEDBACK',
        eventDate: new Date(),
      });
      const secondStatusChange = StatusChange.create({
        applicationId: 'application-1',
        status: 'WAITING_FEEDBACK',
        eventDate: new Date(),
      });

      expect(firstStatusChange.id).toEqual(expect.any(String));
      expect(firstStatusChange.id).not.toBe('');
      expect(firstStatusChange.createdAt).toBeInstanceOf(Date);
      expect(firstStatusChange.id).not.toBe(secondStatusChange.id);
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

  describe('reconstitute', () => {
    it('reconstitutes a StatusChange from persisted values without regenerating id or createdAt', () => {
      const eventDate = new Date('2026-01-01');
      const createdAt = new Date('2026-01-02');

      const statusChange = StatusChange.reconstitute({
        id: 'existing-id',
        applicationId: 'application-1',
        status: 'WAITING_FEEDBACK',
        eventDate,
        createdAt,
      });

      expect(statusChange.id).toBe('existing-id');
      expect(statusChange.createdAt).toBe(createdAt);
    });
  });
});
