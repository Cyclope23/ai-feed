'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: Array<{ date: string; totalScore: number }>;
}

export function ScoreHistoryChart({ data }: Props) {
  if (data.length === 0) return <p className="text-zinc-500">Nessuno storico disponibile</p>;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Line type="monotone" dataKey="totalScore" stroke="#7c6bf5" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
