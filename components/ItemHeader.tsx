import { Badge } from './ui/badge';

interface Props {
  type: string;
  title: string;
  publishedAt: Date | string;
  rank?: number;
}

export function ItemHeader({ type, title, publishedAt, rank }: Props) {
  const date = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt;
  return (
    <header className="mb-6">
      <div className="flex gap-2 mb-2">
        <Badge className="bg-purple-600 text-white">{type}</Badge>
        {rank && <Badge className="bg-yellow-400 text-black">#{rank} oggi</Badge>}
      </div>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-sm text-zinc-500">Pubblicato {date.toLocaleDateString('it-IT')}</p>
    </header>
  );
}
