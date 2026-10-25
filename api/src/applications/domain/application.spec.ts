import { Application } from './application';
import { StatusChange } from './status-change';

describe('Application', () => {
  describe('create', () => {
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

    it('sets currentStatus to APPLIED automatically on creation', () => {
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

    it('generates id and createdAt on creation', () => {
      const firstApplication = Application.create({
        title: 'Senior Backend Engineer',
        companyId: 'company-1',
        userId: 'user-1',
      });
      const secondApplication = Application.create({
        title: 'Senior Backend Engineer',
        companyId: 'company-1',
        userId: 'user-1',
      });

      expect(firstApplication.id).toEqual(expect.any(String));
      expect(firstApplication.id).not.toBe('');
      expect(firstApplication.createdAt).toBeInstanceOf(Date);
      expect(firstApplication.id).not.toBe(secondApplication.id);
    });

    it('leaves optional fields (description, externalUrl, salary, currency) undefined when omitted', () => {
      const application = Application.create({
        title: 'Senior Backend Engineer',
        companyId: 'company-1',
        userId: 'user-1',
      });

      expect(application.description).toBeUndefined();
      expect(application.externalUrl).toBeUndefined();
      expect(application.salary).toBeUndefined();
      expect(application.currency).toBeUndefined();
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

  describe('changeStatus', () => {
    let application: Application;

    beforeAll(() => {
      application = Application.create({
        title: 'Senior Backend Engineer',
        companyId: 'company-1',
        userId: 'user-1',
      });
    });

    it('changes currentStatus and appends a StatusChange when the transition is valid', () => {
      const updatedApplication = application.changeStatus({
        status: 'INTERVIEW_SCHEDULED',
        eventDate: new Date(),
        interviewCategory: 'NON_TECHNICAL',
      });

      expect(updatedApplication.currentStatus).toBe('INTERVIEW_SCHEDULED');
      expect(updatedApplication.statusHistory).toHaveLength(2);
      expect(updatedApplication.statusHistory[1].status).toBe(
        'INTERVIEW_SCHEDULED',
      );
    });

    it('throws an error when the transition is invalid', () => {
      expect(() =>
        application.changeStatus({
          status: 'OFFER_ACCEPTED',
          eventDate: new Date(),
        }),
      ).toThrow();
    });

    it('throws an error when status is INTERVIEW_SCHEDULED and interviewCategory is missing', () => {
      expect(() =>
        application.changeStatus({
          status: 'INTERVIEW_SCHEDULED',
          eventDate: new Date(),
        }),
      ).toThrow();
    });

    it('does not mutate the original Application when changing status', () => {
      application.changeStatus({
        status: 'WAITING_FEEDBACK',
        eventDate: new Date(),
      });

      expect(application.currentStatus).toBe('APPLIED');
      expect(application.statusHistory).toHaveLength(1);
    });
  });

  describe('reconstitute', () => {
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

  describe('lastStatusChangeAt', () => {
    it('returns the APPLIED eventDate when no status change has been made yet', () => {
      const application = Application.create({
        title: 'Senior Backend Engineer',
        companyId: 'company-1',
        userId: 'user-1',
      });

      expect(application.lastStatusChangeAt).toBe(
        application.statusHistory[0].eventDate,
      );
    });

    it('returns the eventDate of the latest change after changeStatus is called', () => {
      const application = Application.create({
        title: 'Senior Backend Engineer',
        companyId: 'company-1',
        userId: 'user-1',
      });
      const eventDate = new Date('2026-03-15');

      const updatedApplication = application.changeStatus({
        status: 'WAITING_FEEDBACK',
        eventDate,
      });

      expect(updatedApplication.lastStatusChangeAt).toBe(eventDate);
    });
  });
});
