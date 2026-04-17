import { Card } from './ui/card';

interface Props {
  novelty: number;
  popularity: number;
  relevance: number;
  total: number;
}

export function ScoreBreakdown({ novelty, popularity, relevance, total }: Props) {
  return (
    <Card>
      <div className="text-center mb-2">
        <div className="text-5xl font-extrabold text-purple-500">{total.toFixed(0)}</div>
        <div className="text-xs text-zinc-500">SCORE TOTALE</div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="text-center"><div className="font-semibold">{novelty.toFixed(0)}</div><div className="text-xs text-zinc-500">Novita</div></div>
        <div className="text-center"><div className="font-semibold">{popularity.toFixed(0)}</div><div className="text-xs text-zinc-500">Popolarita</div></div>
        <div className="text-center"><div className="font-semibold">{relevance.toFixed(0)}</div><div className="text-xs text-zinc-500">Rilevanza</div></div>
      </div>
    </Card>
  );
}
