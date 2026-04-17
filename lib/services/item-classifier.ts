import type { ItemType, SourceType } from '@prisma/client';

interface ClassifyInput {
  sourceType: SourceType;
  title: string;
  description?: string | null;
  topics?: string[];
}

const FRAMEWORK_KEYWORDS = ['framework', 'sdk', 'library'];
const SKILL_KEYWORDS = ['skill'];
const PLUGIN_KEYWORDS = ['plugin', 'mcp'];

export function classifyItem(input: ClassifyInput): ItemType {
  const haystack = [
    input.title,
    input.description ?? '',
    ...(input.topics ?? []),
  ].join(' ').toLowerCase();

  const has = (kws: string[]) => kws.some(k => haystack.includes(k));

  if (input.sourceType === 'GITHUB') {
    if (has(FRAMEWORK_KEYWORDS)) return 'FRAMEWORK';
    if (has(SKILL_KEYWORDS)) return 'SKILL';
    return 'PLUGIN';
  }

  if (has(FRAMEWORK_KEYWORDS)) return 'FRAMEWORK';
  if (has(SKILL_KEYWORDS)) return 'SKILL';
  if (has(PLUGIN_KEYWORDS)) return 'PLUGIN';
  return 'NEWS';
}
