import { describe, it, expect } from 'vitest';
import { dateUtcString, isToday } from '../date';

describe('dateUtcString', () => {
  it('returns YYYY-MM-DD format in UTC', () => {
    const d = new Date('2026-04-16T15:30:00Z');
    expect(dateUtcString(d)).toBe('2026-04-16');
  });

  it('handles dates near UTC midnight correctly', () => {
    const d = new Date('2026-04-16T23:59:59Z');
    expect(dateUtcString(d)).toBe('2026-04-16');
  });
});

describe('isToday', () => {
  it('returns true if date is today UTC', () => {
    const today = new Date();
    expect(isToday(dateUtcString(today))).toBe(true);
  });

  it('returns false for yesterday', () => {
    expect(isToday('2020-01-01')).toBe(false);
  });
});
