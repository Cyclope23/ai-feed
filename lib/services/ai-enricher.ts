import { anthropic, ENRICHMENT_MODEL } from '@/lib/anthropic';

export interface EnrichmentInput {
  title: string;
  description?: string | null;
  content?: string | null;
}

export interface EnrichmentOutput {
  summary: string;
  practicalDescription: string;
  useCase: string;
}

const SYSTEM_PROMPT = `You analyze tools and news from the Claude/Anthropic AI ecosystem.
Given an item (plugin, skill, framework, or news article), produce a JSON object with:
- summary: 1-2 sentence summary
- practicalDescription: what it does and how it works in practice (2-3 sentences)
- useCase: a concrete example of when and how to use it (2-3 sentences)

Respond ONLY with valid JSON, no markdown fences.`;

export async function enrichItem(input: EnrichmentInput): Promise<EnrichmentOutput> {
  const userText = [
    `Title: ${input.title}`,
    input.description ? `Description: ${input.description}` : '',
    input.content ? `Content/README:\n${input.content.slice(0, 4000)}` : '',
  ].filter(Boolean).join('\n\n');

  const response = await anthropic.messages.create({
    model: ENRICHMENT_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userText }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const parsed = JSON.parse(textBlock.text);
  return {
    summary: parsed.summary ?? '',
    practicalDescription: parsed.practicalDescription ?? '',
    useCase: parsed.useCase ?? '',
  };
}
