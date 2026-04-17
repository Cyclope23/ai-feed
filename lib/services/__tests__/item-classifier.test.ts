import { describe, it, expect } from 'vitest';
import { classifyItem } from '../item-classifier';

describe('classifyItem', () => {
  it('classifies GitHub repo with "plugin" topic as PLUGIN', () => {
    expect(classifyItem({
      sourceType: 'GITHUB',
      title: 'awesome-tool',
      description: 'A claude plugin for X',
      topics: ['claude', 'plugin'],
    })).toBe('PLUGIN');
  });

  it('classifies GitHub repo with "framework" keyword as FRAMEWORK', () => {
    expect(classifyItem({
      sourceType: 'GITHUB',
      title: 'claude-sdk',
      description: 'TypeScript SDK for Claude',
      topics: ['claude', 'sdk'],
    })).toBe('FRAMEWORK');
  });

  it('defaults GitHub repo without specific keywords to PLUGIN', () => {
    expect(classifyItem({
      sourceType: 'GITHUB',
      title: 'random-claude-tool',
      description: 'Some tool',
      topics: ['claude'],
    })).toBe('PLUGIN');
  });

  it('classifies RSS item with "skill" in title as SKILL', () => {
    expect(classifyItem({
      sourceType: 'RSS',
      title: 'New Claude skill for X',
      description: '...',
    })).toBe('SKILL');
  });

  it('defaults RSS items to NEWS', () => {
    expect(classifyItem({
      sourceType: 'RSS',
      title: 'Anthropic announces new model',
      description: '...',
    })).toBe('NEWS');
  });
});
