import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/anthropic', () => ({
  anthropic: {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify({
            summary: 'A test tool',
            practicalDescription: 'It does X by doing Y',
            useCase: 'Use it when you need Z',
          }),
        }],
      }),
    },
  },
  ENRICHMENT_MODEL: 'claude-sonnet-4-6',
}));

import { enrichItem } from '../ai-enricher';

describe('enrichItem', () => {
  it('returns parsed enrichment from Claude response', async () => {
    const result = await enrichItem({
      title: 'Claude MCP Server',
      description: 'A server',
      content: 'Detailed README',
    });
    expect(result.summary).toBe('A test tool');
    expect(result.practicalDescription).toContain('X');
    expect(result.useCase).toContain('Z');
  });
});
