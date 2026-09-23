import { formatStatus, type ApplicationStatus } from './applications-list'

describe('formatStatus', () => {
  it.each<[ApplicationStatus, string]>([
    ['APPLIED', 'Applied'],
    ['WAITING_FEEDBACK', 'Waiting Feedback'],
    ['ASSIGNMENT', 'Assignment'],
    ['INTERVIEW_SCHEDULED', 'Interview Scheduled'],
    ['OFFER', 'Offer'],
    ['OFFER_ACCEPTED', 'Offer Accepted'],
    ['OFFER_DECLINED', 'Offer Declined'],
    ['REJECTED', 'Rejected'],
  ])('formats %s as "%s"', (status, expected) => {
    expect(formatStatus(status)).toBe(expected)
  })
})
