import { describe, it, expect, vi } from 'vitest';

const mockUpsert = vi.fn();
const mockFindUnique = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    pipelineStatus: {
      upsert: (...args: any[]) => mockUpsert(...args),
      findUnique: (...args: any[]) => mockFindUnique(...args),
    },
  },
}));

import { markStepCompleted, isStepCompleted } from '../pipeline-status';

describe('pipeline-status', () => {
  it('markStepCompleted upserts a record', async () => {
    mockUpsert.mockResolvedValue({});
    await markStepCompleted('FETCH', '2026-04-16');
    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { step_date: { step: 'FETCH', date: '2026-04-16' } },
    }));
  });

  it('isStepCompleted returns true if record exists', async () => {
    mockFindUnique.mockResolvedValue({ id: 'x' });
    expect(await isStepCompleted('FETCH', '2026-04-16')).toBe(true);
  });

  it('isStepCompleted returns false if record missing', async () => {
    mockFindUnique.mockResolvedValue(null);
    expect(await isStepCompleted('RANK', '2026-04-16')).toBe(false);
  });
});
