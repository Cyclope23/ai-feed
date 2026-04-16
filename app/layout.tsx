import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Feeds',
  description: 'Le novità dell\'ecosistema Claude classificate ogni giorno',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
