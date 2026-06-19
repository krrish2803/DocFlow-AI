import { cn } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/utils';

export function Badge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium', STATUS_COLORS[status] || 'bg-neutral-100 text-neutral-600', className)}>
      {status.toLowerCase().replace('_', ' ')}
    </span>
  );
}
