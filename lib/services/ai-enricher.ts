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

const SYSTEM_PROMPT = `Analizzi tool e notizie dell'ecosistema Claude/Anthropic AI.
Dato un item (plugin, skill, framework o articolo), produci un oggetto JSON con:
- summary: riassunto di 1-2 frasi in italiano
- practicalDescription: cosa fa e come funziona in pratica (2-3 frasi in italiano)
- useCase: uno scenario concreto e dettagliato che descriva come uno sviluppatore può integrare questo strumento nel proprio workflow quotidiano. Descrivi il problema che risolve, come si inserisce nel processo di sviluppo software, e quale vantaggio di produttività offre. Sii specifico: menziona linguaggi, IDE, CI/CD, code review o altri contesti reali. (4-5 frasi in italiano)

IMPORTANTE: Rispondi SEMPRE in italiano.
Rispondi SOLO con JSON valido, senza markdown fences.`;

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

  const raw = textBlock.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(raw);
  return {
    summary: parsed.summary ?? '',
    practicalDescription: parsed.practicalDescription ?? '',
    useCase: parsed.useCase ?? '',
  };
}
