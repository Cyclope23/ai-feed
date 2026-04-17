import { describe, it, expect } from 'vitest';
import { slugify } from '../slug';

describe('slugify', () => {
  it('converts title to URL-safe slug', () => {
    expect(slugify('Claude MCP Server v2.0')).toBe('claude-mcp-server-v2-0');
  });
  it('handles special characters', () => {
    expect(slugify('Hello, World! & friends')).toBe('hello-world-friends');
  });
  it('truncates at 80 chars', () => {
    const long = 'a'.repeat(100);
    expect(slugify(long).length).toBeLessThanOrEqual(80);
  });
});
