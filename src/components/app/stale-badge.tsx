import { cn } from '@/lib/utils';

export function StaleBadge({ stale, className }: { stale: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium',
        stale
          ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
        className
      )}
    >
      <span className={cn(
        'w-1.5 h-1.5 rounded-full shrink-0',
        stale ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
      )} />
      {stale ? 'Stale' : 'Up to date'}
    </span>
  );
}
