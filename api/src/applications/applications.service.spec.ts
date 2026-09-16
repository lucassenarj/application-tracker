import { ApplicationsService } from './applications.service';
import { FakeApplicationRepository } from './test-utils/fakes/application.repository.fake';
import { FakeCompanyRepository } from './test-utils/fakes/company.repository.fake';

describe('ApplicationsService', () => {
  let applicationService: ApplicationsService;
  let applicationRepository: FakeApplicationRepository;
  let companyRepository: FakeCompanyRepository;

  beforeEach(() => {
    applicationRepository = new FakeApplicationRepository();
    companyRepository = new FakeCompanyRepository();
    applicationService = new ApplicationsService(
      applicationRepository,
      companyRepository,
    );
  });

  it('creates a new Company when none exists for the given name, then creates the Application', async () => {
    const newApplication = await applicationService.create({
      title: 'Senior Backend Engineer',
      companyName: 'Acme Corp',
      userId: 'user-1',
    });

    expect(newApplication.title).toBe('Senior Backend Engineer');
    expect(newApplication.companyId).toEqual(expect.any(String));

    const savedCompany =
      await companyRepository.findByNormalizedName('Acme Corp');
    expect(savedCompany?.id).toBe(newApplication.companyId);
  });

  it('reuses an existing Company instead of creating a duplicate, when one already matches the normalized name', async () => {
    const existingCompany =
      await companyRepository.findByNormalizedName('Acme Corp');
    expect(existingCompany).toBeNull();

    const firstApplication = await applicationService.create({
      title: 'Senior Backend Engineer',
      companyName: 'Acme Corp',
      userId: 'user-1',
    });

    const secondApplication = await applicationService.create({
      title: 'Staff Engineer',
      companyName: 'acme corp',
      userId: 'user-1',
    });

    expect(secondApplication.companyId).toBe(firstApplication.companyId);
  });

  it.todo('returns the Application when one exists for the given id');

  it.todo(
    'throws a NotFoundException when no Application matches the given id (findById)',
  );

  it.todo(
    'changes the status of an existing Application and persists the update',
  );

  it.todo(
    'throws a NotFoundException when no Application matches the given id (changeStatus)',
  );
});
