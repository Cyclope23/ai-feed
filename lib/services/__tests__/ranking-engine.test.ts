import { describe, it, expect } from 'vitest';
import { noveltyScore, popularityScore, relevanceScore, totalScore } from '../ranking-engine';

describe('noveltyScore', () => {
  it('returns ~100 for items published now', () => {
    expect(noveltyScore(new Date())).toBeGreaterThan(99);
  });
  it('returns 0 for items older than threshold', () => {
    const old = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30); // 30d ago
    expect(noveltyScore(old)).toBe(0);
  });
  it('decays linearly', () => {
    const halfWay = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7); // 7d
    const score = noveltyScore(halfWay);
    expect(score).toBeGreaterThan(40);
    expect(score).toBeLessThan(80);
  });
});

describe('popularityScore', () => {
  it('returns 0 for no signals', () => {
    expect(popularityScore({ stars: 0, forks: 0, mentions: 0 })).toBe(0);
  });
  it('caps at 100 for very popular items', () => {
    expect(popularityScore({ stars: 100000, forks: 5000, mentions: 50 })).toBe(100);
  });
  it('weights mentions higher than stars per unit', () => {
    const a = popularityScore({ stars: 10, forks: 0, mentions: 0 });
    const b = popularityScore({ stars: 0, forks: 0, mentions: 10 });
    expect(b).toBeGreaterThan(a);
  });
});

describe('relevanceScore', () => {
  it('rewards keyword matches in title 2x vs content', () => {
    const a = relevanceScore({ title: 'Claude MCP', content: 'random text' });
    const b = relevanceScore({ title: 'Random text', content: 'Claude MCP' });
    expect(a).toBeGreaterThan(b);
  });
  it('returns 0 for no matches', () => {
    expect(relevanceScore({ title: 'Random', content: 'Stuff' })).toBe(0);
  });
});

describe('totalScore', () => {
  it('weights 40/30/30', () => {
    expect(totalScore({ novelty: 100, popularity: 0, relevance: 0 })).toBeCloseTo(40);
    expect(totalScore({ novelty: 0, popularity: 100, relevance: 0 })).toBeCloseTo(30);
    expect(totalScore({ novelty: 0, popularity: 0, relevance: 100 })).toBeCloseTo(30);
  });
});
