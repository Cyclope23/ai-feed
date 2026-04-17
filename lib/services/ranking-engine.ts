// Linear decay: 100 at age=0, 0 at age=720h (30d)
const NOVELTY_MAX_AGE_HOURS = 720;
const POP_CEILING = 200000;
const KEYWORDS = [
  'claude', 'anthropic', 'mcp', 'claude code',
  'plugin', 'skill', 'tool use', 'agent', 'sdk',
];

export function noveltyScore(publishedAt: Date): number {
  const ageHours = (Date.now() - publishedAt.getTime()) / 36e5;
  if (ageHours >= NOVELTY_MAX_AGE_HOURS) return 0;
  if (ageHours <= 0) return 100;
  const score = 100 * (1 - ageHours / NOVELTY_MAX_AGE_HOURS);
  return Math.max(0, Math.min(100, score));
}

interface PopularityInput {
  stars?: number | null;
  forks?: number | null;
  mentions?: number | null;
}

export function popularityScore(input: PopularityInput): number {
  const s = input.stars ?? 0;
  const f = input.forks ?? 0;
  const m = input.mentions ?? 0;
  const raw = s * 1.5 + f * 3 + m * 5;
  if (raw <= 0) return 0;
  const score = (Math.sqrt(raw) / Math.sqrt(POP_CEILING)) * 100;
  return Math.min(100, score);
}

export function relevanceScore(input: { title: string; content?: string | null }): number {
  const title = input.title.toLowerCase();
  const content = (input.content ?? '').toLowerCase();
  let score = 0;
  for (const kw of KEYWORDS) {
    if (title.includes(kw)) score += 20;
    else if (content.includes(kw)) score += 10;
  }
  return Math.min(100, score);
}

export function totalScore(s: { novelty: number; popularity: number; relevance: number }): number {
  return s.novelty * 0.3 + s.popularity * 0.4 + s.relevance * 0.3;
}
