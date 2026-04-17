import { anthropic, ENRICHMENT_MODEL } from '@/lib/anthropic';

export interface StudyInput {
  title: string;
  url: string;
  type: string;
  description?: string | null;
  content?: string | null;
  enrichmentSummary?: string | null;
  enrichmentPractical?: string | null;
  enrichmentUseCase?: string | null;
}

const SYSTEM_PROMPT = `Sei un esperto tecnico che crea guide di studio per sviluppatori.

Dato un tool/plugin/framework dell'ecosistema Claude/Anthropic AI, genera una guida di studio COMPLETA in markdown italiano che permetta a uno sviluppatore di imparare ad usarlo.

La guida deve includere TUTTE queste sezioni (usa esattamente questi heading markdown):

## Panoramica
Cos'è, a cosa serve, perché è utile. 2-3 paragrafi.

## Requisiti
Prerequisiti tecnici (Node.js, Python, ecc.), dipendenze, account necessari. Lista puntata.

## Installazione
Comandi di installazione passo-passo. Usa code blocks con il linguaggio appropriato.

## Configurazione
File di config, variabili d'ambiente, setup iniziale. Esempi di codice concreti.

## Guida all'uso
Come usarlo nella pratica quotidiana. Includi 2-3 esempi di codice reali e commentati.

## Integrazione nel workflow
Come integrarlo nel processo di sviluppo: IDE, CI/CD, code review, automazione. Scenari concreti.

## Tips & Best Practices
5-7 consigli pratici per usarlo al meglio. Lista puntata con spiegazioni.

## Risorse
Link alla documentazione ufficiale, tutorial, community. Lista puntata.

REGOLE:
- Scrivi SEMPRE in italiano (tranne codice e nomi tecnici)
- Usa code blocks markdown con syntax highlighting (\`\`\`bash, \`\`\`typescript, ecc.)
- Sii specifico e pratico, non generico
- Se non conosci dettagli specifici del tool, basati su pattern comuni per tool simili
- NON usare placeholder generici, scrivi codice che potrebbe funzionare davvero
- La guida deve essere LUNGA e DETTAGLIATA (almeno 800 parole)`;

export async function generateStudyGuide(input: StudyInput): Promise<string> {
  const userText = [
    `Tool: ${input.title}`,
    `URL: ${input.url}`,
    `Tipo: ${input.type}`,
    input.description ? `Descrizione: ${input.description}` : '',
    input.enrichmentSummary ? `Sommario AI: ${input.enrichmentSummary}` : '',
    input.enrichmentPractical ? `Descrizione pratica: ${input.enrichmentPractical}` : '',
    input.enrichmentUseCase ? `Use case: ${input.enrichmentUseCase}` : '',
    input.content ? `README/Contenuto:\n${input.content.slice(0, 8000)}` : '',
  ].filter(Boolean).join('\n\n');

  const response = await anthropic.messages.create({
    model: ENRICHMENT_MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userText }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return textBlock.text;
}
