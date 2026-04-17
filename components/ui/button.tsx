import { cn } from '@/lib/cn';
import { ButtonHTMLAttributes, forwardRef } from 'react';

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button ref={ref} className={cn('rounded-md bg-purple-600 hover:bg-purple-700 px-4 py-2 text-sm font-medium text-white', className)} {...props} />
  )
);
Button.displayName = 'Button';
