import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, hover, children, ...props }, ref) => (
  <div ref={ref} className={cn('rounded-xl border border-neutral-200/60 bg-white p-5 dark:border-neutral-800/60 dark:bg-neutral-900 shadow-sm', hover && 'hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-200', className)} {...props}>
    {children}
  </div>
));
Card.displayName = 'Card';
