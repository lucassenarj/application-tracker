import { bucketApplicationsByWeek } from './applications-over-time';
import type { ApplicationsOverTimeBucket } from './applications-over-time';

describe('bucketApplicationsByWeek', () => {
  const now = new Date('2026-10-26T15:00:00.000Z');

  describe('with no dates', () => {
    let buckets: ApplicationsOverTimeBucket[];

    beforeAll(() => {
      buckets = bucketApplicationsByWeek([], 12, now);
    });

    it('returns weekCount buckets', () => {
      expect(buckets).toHaveLength(12);
    });

    it('returns buckets ordered oldest to newest, the last one starting on the Monday of the week containing now', () => {
      expect(buckets[0].weekStart).toBe('2026-08-10');
      expect(buckets[11].weekStart).toBe('2026-10-26');
    });

    it('returns all buckets with a zero count', () => {
      expect(buckets.every((bucket) => bucket.count === 0)).toBe(true);
    });
  });

  it('counts a date into the bucket for the week it falls in', () => {
    const buckets = bucketApplicationsByWeek(
      [new Date('2026-10-20T09:00:00.000Z')],
      12,
      now,
    );
    const bucket = buckets.find((b) => b.weekStart === '2026-10-19');
    expect(bucket?.count).toBe(1);
  });

  it('groups multiple dates in the same week into one bucket', () => {
    const buckets = bucketApplicationsByWeek(
      [
        new Date('2026-10-19T09:00:00.000Z'),
        new Date('2026-10-20T09:00:00.000Z'),
        new Date('2026-10-25T09:00:00.000Z'),
      ],
      12,
      now,
    );
    const bucket = buckets.find((b) => b.weekStart === '2026-10-19');
    expect(bucket?.count).toBe(3);
  });

  it('ignores dates older than the window', () => {
    const buckets = bucketApplicationsByWeek(
      [new Date('2026-01-01T09:00:00.000Z')],
      12,
      now,
    );
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(0);
  });
});
