import { randomUUID } from 'crypto';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Application } from '../src/applications/domain/application';
import type { ApplicationStatus } from '../src/applications/domain/application-status';
import type { ApplicationRepository } from '../src/applications/domain/application.repository';
import { Company } from '../src/applications/domain/company';
import type { CompanyRepository } from '../src/applications/domain/company.repository';
import {
  StatusChange,
  type InterviewCategory,
} from '../src/applications/domain/status-change';
import { AuthService } from '../src/identity/auth.service';

const SMOKE_TEST_EMAIL = 'smoke-test@example.com';
const SMOKE_TEST_PASSWORD = 'SmokeTest123!';
const APPLICATION_COUNT = 30;

const COMPANY_NAMES = [
  'Acme Corp',
  'Globex Inc',
  'Initech',
  'Umbrella Corp',
  'Stark Industries',
  'Wayne Enterprises',
  'Hooli',
  'Pied Piper',
  'Massive Dynamic',
  'Soylent Corp',
  'Wonka Industries',
  'Aperture Science',
  'Cyberdyne Systems',
  'Oscorp',
  'Vandelay Industries',
];

const JOB_TITLES = [
  'Senior Backend Engineer',
  'Frontend Developer',
  'Full Stack Engineer',
  'DevOps Engineer',
  'Software Engineer II',
  'Staff Engineer',
  'Engineering Manager',
  'Platform Engineer',
  'Site Reliability Engineer',
  'Mobile Engineer (iOS)',
  'Mobile Engineer (Android)',
  'Data Engineer',
  'Machine Learning Engineer',
  'QA Engineer',
  'Principal Engineer',
  'Tech Lead',
  'Backend Engineer (Node.js)',
  'Cloud Infrastructure Engineer',
  'Security Engineer',
  'Solutions Architect',
];

const INTERVIEW_CATEGORIES: InterviewCategory[] = [
  'TECHNICAL',
  'NON_TECHNICAL',
];

type Outcome =
  | 'applied-only'
  | 'waiting-feedback'
  | 'interview-past'
  | 'interview-upcoming'
  | 'rejected-early'
  | 'rejected-after-interview'
  | 'offer-accepted'
  | 'offer-declined';

const OUTCOME_WEIGHTS: Array<{ outcome: Outcome; weight: number }> = [
  { outcome: 'applied-only', weight: 20 },
  { outcome: 'waiting-feedback', weight: 15 },
  { outcome: 'interview-past', weight: 10 },
  { outcome: 'interview-upcoming', weight: 15 },
  { outcome: 'rejected-early', weight: 15 },
  { outcome: 'rejected-after-interview', weight: 10 },
  { outcome: 'offer-accepted', weight: 8 },
  { outcome: 'offer-declined', weight: 7 },
];

// Each outcome's "applied X days ago" range. Ranges are chosen so that every
// resolved (non-upcoming) step in buildStatusHistory lands safely in the
// past -- the upcoming-interviews query matches ANY StatusChange row with
// status INTERVIEW_SCHEDULED and a future eventDate, regardless of the
// application's current status, so a too-small appliedDaysAgo could leak a
// "resolved" application into the Upcoming Interviews widget.
const APPLIED_DAYS_AGO_RANGE: Record<Outcome, [number, number]> = {
  'applied-only': [0, 10],
  'waiting-feedback': [5, 30],
  'interview-past': [15, 90],
  'interview-upcoming': [5, 40],
  'rejected-early': [7, 90],
  'rejected-after-interview': [15, 100],
  'offer-accepted': [20, 110],
  'offer-declined': [20, 110],
};

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function pickOutcome(): Outcome {
  const total = OUTCOME_WEIGHTS.reduce((sum, o) => sum + o.weight, 0);
  let roll = Math.random() * total;
  for (const { outcome, weight } of OUTCOME_WEIGHTS) {
    if (roll < weight) return outcome;
    roll -= weight;
  }
  return 'applied-only';
}

function buildStatusHistory(
  applicationId: string,
  outcome: Outcome,
): { currentStatus: ApplicationStatus; statusHistory: StatusChange[] } {
  const [min, max] = APPLIED_DAYS_AGO_RANGE[outcome];
  const appliedDaysAgo = randomInt(min, max);
  const appliedEventDate = daysFromNow(-appliedDaysAgo);

  const history: StatusChange[] = [
    StatusChange.reconstitute({
      id: randomUUID(),
      applicationId,
      status: 'APPLIED',
      eventDate: appliedEventDate,
      createdAt: appliedEventDate,
    }),
  ];

  const addStep = (
    status: ApplicationStatus,
    daysAfterApplied: number,
    interviewCategory?: InterviewCategory,
  ) => {
    const eventDate = daysFromNow(-appliedDaysAgo + daysAfterApplied);
    history.push(
      StatusChange.reconstitute({
        id: randomUUID(),
        applicationId,
        status,
        eventDate,
        createdAt: eventDate,
        interviewCategory,
      }),
    );
  };

  switch (outcome) {
    case 'applied-only':
      break;
    case 'waiting-feedback':
      addStep('WAITING_FEEDBACK', 3);
      break;
    case 'interview-past':
      addStep('WAITING_FEEDBACK', 2);
      addStep('INTERVIEW_SCHEDULED', 7, randomItem(INTERVIEW_CATEGORIES));
      break;
    case 'interview-upcoming': {
      addStep('WAITING_FEEDBACK', 2);
      const futureEventDate = daysFromNow(randomInt(1, 20));
      history.push(
        StatusChange.reconstitute({
          id: randomUUID(),
          applicationId,
          status: 'INTERVIEW_SCHEDULED',
          eventDate: futureEventDate,
          createdAt: new Date(),
          interviewCategory: randomItem(INTERVIEW_CATEGORIES),
        }),
      );
      break;
    }
    case 'rejected-early':
      addStep('REJECTED', 5);
      break;
    case 'rejected-after-interview':
      addStep('WAITING_FEEDBACK', 2);
      addStep('INTERVIEW_SCHEDULED', 7, randomItem(INTERVIEW_CATEGORIES));
      addStep('REJECTED', 10);
      break;
    case 'offer-accepted':
      addStep('WAITING_FEEDBACK', 2);
      addStep('INTERVIEW_SCHEDULED', 7, randomItem(INTERVIEW_CATEGORIES));
      addStep('OFFER', 14);
      addStep('OFFER_ACCEPTED', 17);
      break;
    case 'offer-declined':
      addStep('WAITING_FEEDBACK', 2);
      addStep('INTERVIEW_SCHEDULED', 7, randomItem(INTERVIEW_CATEGORIES));
      addStep('OFFER', 14);
      addStep('OFFER_DECLINED', 16);
      break;
  }

  return {
    currentStatus: history[history.length - 1].status,
    statusHistory: history,
  };
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const authService = app.get(AuthService);
    const companyRepository = app.get<CompanyRepository>('CompanyRepository');
    const applicationRepository = app.get<ApplicationRepository>(
      'ApplicationRepository',
    );

    const user = await authService.register({
      email: SMOKE_TEST_EMAIL,
      password: SMOKE_TEST_PASSWORD,
    });

    const companyIds: string[] = [];
    for (const rawName of COMPANY_NAMES) {
      const normalizedName = Company.normalizeName(rawName);
      let company =
        await companyRepository.findByNormalizedName(normalizedName);
      if (!company) {
        company = Company.create({ name: rawName });
        await companyRepository.save(company);
      }
      companyIds.push(company.id);
    }

    for (let i = 0; i < APPLICATION_COUNT; i++) {
      const applicationId = randomUUID();
      const outcome = pickOutcome();
      const { currentStatus, statusHistory } = buildStatusHistory(
        applicationId,
        outcome,
      );
      const hasSalary = Math.random() < 0.7;

      const application = Application.reconstitute({
        id: applicationId,
        title: randomItem(JOB_TITLES),
        salary: hasSalary ? randomInt(60, 180) * 1000 : undefined,
        currency: hasSalary ? 'USD' : undefined,
        companyId: randomItem(companyIds),
        userId: user.id,
        currentStatus,
        statusHistory,
        createdAt: statusHistory[0].eventDate,
      });

      await applicationRepository.save(application);
    }

    console.log(
      `Seeded ${APPLICATION_COUNT} applications across ${companyIds.length} companies.`,
    );
    console.log(`Log in with email: ${SMOKE_TEST_EMAIL}`);
    console.log(`Log in with password: ${SMOKE_TEST_PASSWORD}`);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
