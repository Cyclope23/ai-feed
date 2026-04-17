export function dateUtcString(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function isToday(dateStr: string): boolean {
  return dateStr === dateUtcString(new Date());
}
