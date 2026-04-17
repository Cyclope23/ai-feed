import { cn } from '@/lib/cn';
import { HTMLAttributes } from 'react';

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('inline-block rounded px-2 py-0.5 text-xs font-medium', className)} {...props} />;
}
