import type { Request, Response } from 'express';
import { ExternalController } from './external.controller';
import { ApplicationsService } from '../applications/applications.service';
import { CompaniesService } from '../companies/companies.service';
import { FakeCompanyRepository } from '../companies/test-utils/fakes/company.repository.fake';
import { TagsService } from '../tags/tags.service';
import { FakeTagRepository } from '../tags/test-utils/fakes/tag.repository.fake';
import { FakeApplicationRepository } from '../applications/test-utils/fakes/application.repository.fake';

function buildMockResponse(): Response {
  return { status: jest.fn() } as unknown as Response;
}

describe('ExternalController', () => {
  let externalController: ExternalController;

  beforeEach(() => {
    const companyRepository = new FakeCompanyRepository();
    const companiesService = new CompaniesService(companyRepository);
    const tagRepository = new FakeTagRepository();
    const tagsService = new TagsService(tagRepository);
    const applicationsService = new ApplicationsService(
      new FakeApplicationRepository(companyRepository, tagRepository),
      companiesService,
      tagsService,
    );
    externalController = new ExternalController(applicationsService);
  });

  describe('createApplication', () => {
    it('creates an Application for the authenticated user', async () => {
      const mockRequest = { user: { id: 'user-1' } } as unknown as Request;
      const mockResponse = buildMockResponse();

      const newApplication = await externalController.createApplication(
        {
          title: 'Senior Backend Engineer',
          companyName: 'Acme Corp',
          externalUrl: 'https://www.linkedin.com/jobs/view/123',
        },
        mockRequest,
        mockResponse,
      );

      expect(newApplication.userId).toBe('user-1');
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('returns the existing Application with status 200 instead of creating a duplicate', async () => {
      const mockRequest = { user: { id: 'user-1' } } as unknown as Request;
      const dto = {
        title: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        externalUrl: 'https://www.linkedin.com/jobs/view/123',
      };

      const firstApplication = await externalController.createApplication(
        dto,
        mockRequest,
        buildMockResponse(),
      );
      const mockResponse = buildMockResponse();
      const secondApplication = await externalController.createApplication(
        dto,
        mockRequest,
        mockResponse,
      );

      expect(secondApplication.id).toBe(firstApplication.id);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});
