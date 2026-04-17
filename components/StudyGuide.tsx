'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';

interface Props {
  slug: string;
  itemTitle: string;
}

export function StudyGuideSection({ slug, itemTitle }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [content, setContent] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  // Check if guide already exists
  useEffect(() => {
    fetch(`/api/item/${slug}/study`)
      .then(r => r.json())
      .then(data => {
        if (data.exists) {
          setContent(data.content);
          setGeneratedAt(data.generatedAt);
          setState('ready');
        }
      })
      .catch(() => {});
  }, [slug]);

  const generate = async () => {
    setState('loading');
    try {
      const res = await fetch(`/api/item/${slug}/study`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setContent(data.content);
      setGeneratedAt(data.generatedAt);
      setState('ready');
    } catch {
      setState('error');
    }
  };

  if (state === 'idle') {
    return (
      <div className="rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="font-semibold text-lg mb-2">Guida allo Studio</h3>
        <p className="text-sm text-zinc-500 mb-4 max-w-md mx-auto">
          Genera una guida completa per imparare ad usare <strong>{itemTitle}</strong>: installazione, configurazione, esempi di codice e integrazione nel workflow.
        </p>
        <Button
          onClick={generate}
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-600/25"
        >
          <svg className="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Genera guida con AI
        </Button>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 p-8 text-center">
        <div className="inline-flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-500">Sto studiando <strong>{itemTitle}</strong> e generando la guida...</span>
        </div>
        <p className="text-xs text-zinc-500 mt-2">Potrebbe richiedere 15-30 secondi</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-red-400 mb-3">Errore nella generazione della guida</p>
        <Button onClick={generate} className="bg-red-600 hover:bg-red-700">Riprova</Button>
      </div>
    );
  }

  // state === 'ready'
  return (
    <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.03] to-fuchsia-500/[0.03]">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-violet-500/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-lg">Guida allo Studio</h2>
            {generatedAt && (
              <p className="text-xs text-zinc-500">
                Generata il {new Date(generatedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>
        <span className="text-xs text-violet-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Generata con AI
        </span>
      </div>

      {/* Content */}
      <div className="p-6">
        <MarkdownRenderer content={content ?? ''} />
      </div>
    </div>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  // Simple markdown to HTML - handles headers, code blocks, lists, bold, links
  const html = content
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) =>
      `<pre class="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-4 overflow-x-auto my-3 text-sm"><code class="language-${lang} text-zinc-300">${escapeHtml(code.trim())}</code></pre>`
    )
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm text-purple-500">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-8 mb-3 text-purple-500 border-b border-zinc-200 dark:border-zinc-800 pb-2">$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-purple-500 hover:underline">$1</a>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-zinc-600 dark:text-zinc-300 mb-1">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-zinc-600 dark:text-zinc-300 mb-1">$1</li>')
    // Paragraphs (double newlines)
    .replace(/\n\n/g, '</p><p class="text-zinc-600 dark:text-zinc-300 leading-relaxed mb-3">')
    // Single newlines in non-code context
    .replace(/\n/g, '<br/>');

  return (
    <div
      className="prose-custom text-zinc-600 dark:text-zinc-300 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: `<p class="text-zinc-600 dark:text-zinc-300 leading-relaxed mb-3">${html}</p>` }}
    />
  );
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
