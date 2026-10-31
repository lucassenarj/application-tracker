import { randomUUID } from 'crypto';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Application } from '../src/applications/domain/application';
import type { ApplicationStatus } from '../src/applications/domain/application-status';
import type { ApplicationRepository } from '../src/applications/domain/application.repository';
import { Company } from '../src/companies/domain/company';
import type { CompanyRepository } from '../src/companies/domain/company.repository';
import { Tag } from '../src/tags/domain/tag';
import type { TagRepository } from '../src/tags/domain/tag.repository';
import {
  StatusChange,
  type InterviewCategory,
} from '../src/applications/domain/status-change';
import { AuthService } from '../src/identity/auth.service';

const SMOKE_TEST_EMAIL = 'smoke-test@example.com';
const SMOKE_TEST_PASSWORD = 'plain-text-password';
const SMOKE_TEST_NAME = 'Smoke Test';
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

const TAG_NAMES_WEIGHTED: Array<{ name: string; weight: number }> = [
  { name: 'Remote', weight: 30 },
  { name: 'Full-time', weight: 20 },
  { name: 'Hybrid', weight: 15 },
  { name: 'Startup', weight: 12 },
  { name: 'Dream Job', weight: 10 },
  { name: 'Senior Level', weight: 10 },
  { name: 'Urgent', weight: 8 },
  { name: 'Contract', weight: 6 },
  { name: 'High Priority', weight: 5 },
  { name: 'Relocation', weight: 3 },
];

function pickWeightedTagNames(count: number): string[] {
  const pool = [...TAG_NAMES_WEIGHTED];
  const picked: string[] = [];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const total = pool.reduce((sum, t) => sum + t.weight, 0);
    let roll = Math.random() * total;
    const index = pool.findIndex(({ weight }) => {
      if (roll < weight) return true;
      roll -= weight;
      return false;
    });
    const [chosen] = pool.splice(index, 1);
    picked.push(chosen.name);
  }

  return picked;
}

const RESPONSIBILITY_PARAGRAPHS = [
  (title: string) =>
    `As a ${title}, you'll be responsible for designing, building, and maintaining core systems that power our product. You'll work closely with cross-functional teams including product, design, and other engineers to ship features that matter to our customers. This role involves a healthy mix of hands-on coding, technical design discussions, and mentoring more junior members of the team.`,
  (title: string) =>
    `We're looking for a ${title} to join our growing engineering team. In this role, you'll own significant pieces of our infrastructure end to end, from initial design through deployment and monitoring. You'll be expected to make sound technical decisions independently while keeping the broader team informed and aligned.`,
  (title: string) =>
    `This ${title} position sits at the intersection of our platform and product teams. You'll spend your days building reliable, well-tested software, participating in code reviews, and helping shape the technical direction of the team. We value clear communication and a pragmatic approach to solving problems.`,
];

const REQUIREMENTS_PARAGRAPHS = [
  "We're looking for someone with a strong foundation in computer science fundamentals and several years of professional software development experience. Familiarity with modern cloud infrastructure, CI/CD pipelines, and distributed systems is a strong plus. We value engineers who can balance pragmatism with a long-term view of code quality and maintainability.",
  'The ideal candidate has hands-on experience building and scaling production systems, a solid understanding of testing practices, and the ability to communicate technical tradeoffs clearly to both technical and non-technical stakeholders. Experience working in an agile, fast-moving environment is important, as priorities can shift quickly based on customer feedback.',
  "Strong problem-solving skills and curiosity are more important to us than any specific technology stack. That said, experience with modern web frameworks, relational databases, and containerized deployments will help you ramp up quickly. We're also looking for someone comfortable giving and receiving constructive feedback in code review.",
];

const BENEFITS_PARAGRAPHS = [
  'We offer competitive compensation, comprehensive health coverage, and a flexible working environment that supports both in-office collaboration and remote work. Our team values work-life balance and believes sustainable pace leads to better long-term outcomes for both our people and our product.',
  "Beyond the role itself, you'll join a team that genuinely enjoys working together, with regular opportunities for learning, mentorship, and career growth. We invest in conferences, training budgets, and internal knowledge-sharing sessions to help every engineer grow their craft.",
  "We're proud of our collaborative, low-ego culture, and we're committed to building a diverse and inclusive team. If this role sounds like a good fit, even if you don't check every single box, we'd still love to hear from you.",
];

function buildDescription(title: string): string {
  const responsibility = randomItem(RESPONSIBILITY_PARAGRAPHS)(title);
  const requirements = randomItem(REQUIREMENTS_PARAGRAPHS);
  const benefits = randomItem(BENEFITS_PARAGRAPHS);

  return `${responsibility}\n\n${requirements}\n\n${benefits}`;
}

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
    const tagRepository = app.get<TagRepository>('TagRepository');
    const applicationRepository = app.get<ApplicationRepository>(
      'ApplicationRepository',
    );

    const user = await authService.register({
      email: SMOKE_TEST_EMAIL,
      password: SMOKE_TEST_PASSWORD,
      name: SMOKE_TEST_NAME,
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

    const tagIdByName = new Map<string, string>();
    for (const { name: rawName } of TAG_NAMES_WEIGHTED) {
      const normalizedName = Tag.normalizeName(rawName);
      let tag = await tagRepository.findByNormalizedName(normalizedName);
      if (!tag) {
        tag = Tag.create({ name: rawName });
        await tagRepository.save(tag);
      }
      tagIdByName.set(rawName, tag.id);
    }

    for (let i = 0; i < APPLICATION_COUNT; i++) {
      const applicationId = randomUUID();
      const outcome = pickOutcome();
      const { currentStatus, statusHistory } = buildStatusHistory(
        applicationId,
        outcome,
      );
      const hasSalary = Math.random() < 0.7;
      const title = randomItem(JOB_TITLES);
      const tagNames = pickWeightedTagNames(randomInt(1, 3));

      const application = Application.reconstitute({
        id: applicationId,
        title,
        description: buildDescription(title),
        salary: hasSalary ? randomInt(60, 180) * 1000 : undefined,
        currency: hasSalary ? 'USD' : undefined,
        companyId: randomItem(companyIds),
        userId: user.id,
        currentStatus,
        statusHistory,
        tagIds: tagNames.map((name) => tagIdByName.get(name)!),
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
