import { github } from '@/lib/github';

export interface NormalizedGithubRepo {
  title: string;
  url: string;
  description: string | null;
  publishedAt: Date;
  githubStars: number;
  githubForks: number;
  topics: string[];
}

interface ScanOptions {
  sinceDays: number;
  limit: number;
}

export async function searchGithubRepos(
  query: string,
  opts: ScanOptions
): Promise<NormalizedGithubRepo[]> {
  try {
    const sinceDate = new Date(Date.now() - opts.sinceDays * 86400000);
    const since = sinceDate.toISOString().slice(0, 10);
    const fullQuery = `${query} pushed:>=${since}`;

    const res = await github.rest.search.repos({
      q: fullQuery,
      sort: 'stars',
      order: 'desc',
      per_page: Math.min(100, opts.limit),
    });

    return res.data.items.map((r: any) => ({
      title: r.full_name,
      url: r.html_url,
      description: r.description ?? null,
      publishedAt: r.pushed_at ? new Date(r.pushed_at) : new Date(),
      githubStars: r.stargazers_count ?? 0,
      githubForks: r.forks_count ?? 0,
      topics: r.topics ?? [],
    }));
  } catch (err) {
    console.error(`[GithubScanner] Error:`, err);
    return [];
  }
}
