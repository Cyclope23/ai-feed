import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/github', () => ({
  github: {
    rest: {
      search: {
        repos: vi.fn().mockResolvedValue({
          data: {
            items: [
              {
                full_name: 'owner/awesome-claude',
                html_url: 'https://github.com/owner/awesome-claude',
                description: 'A great tool',
                stargazers_count: 500,
                forks_count: 50,
                topics: ['claude', 'mcp'],
                pushed_at: '2026-04-15T10:00:00Z',
              },
            ],
          },
        }),
      },
    },
  },
}));

import { searchGithubRepos } from '../github-scanner';

describe('searchGithubRepos', () => {
  it('returns normalized repos', async () => {
    const repos = await searchGithubRepos('topic:claude', { sinceDays: 30, limit: 100 });
    expect(repos).toHaveLength(1);
    expect(repos[0].title).toBe('owner/awesome-claude');
    expect(repos[0].githubStars).toBe(500);
    expect(repos[0].topics).toContain('mcp');
  });
});
