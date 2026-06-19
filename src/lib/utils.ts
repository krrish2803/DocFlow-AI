import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes <= 1 ? 'just now' : `${minutes}m ago`;
    }
    return `${hours}h ago`;
  }
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
  IN_REVIEW: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  APPROVED: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  STALE: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  connected: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  disconnected: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
  COMPLETED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  PROCESSING: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  NEEDS_REVIEW: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  QUEUED: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
  FAILED: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
};
