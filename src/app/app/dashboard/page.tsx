'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import * as api from '@/lib/api';
import { formatNumber, formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FileText, Activity, AlertTriangle, BookOpen, MessageSquare,
  GitBranch, Clock, ArrowRight, Sparkles, RefreshCw,
  AlertCircle, ChevronRight, GitCommit, ClipboardCheck,   ShieldCheck, Shield, Code,
} from 'lucide-react';
import type { DashboardMetrics as Metrics, ActivityItem } from '@/lib/api';

interface StaleDoc { id: string; title: string; staleSources: { path: string; label: string }[] }

export default function DashboardPage() {
  const { workspace, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [staleDocs, setStaleDocs] = useState<StaleDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!workspace) { setLoading(false); return; }
    Promise.all([
      api.fetchMetrics(workspace.id),
      api.fetchActivity(workspace.id),
    ]).then(([m, a]) => { setMetrics(m); setActivity(a); setLoading(false); }).catch(() => setLoading(false));

    fetch(`/api/documents/stale?workspaceId=${workspace.id}`).then((r) => r.json()).then((d) => setStaleDocs(d.staleDocuments || [])).catch(() => {});
  }, [workspace, authLoading]);

  if (loading || authLoading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}</div>
    </div>
  );
  if (!metrics) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Overview of your documentation workspace.</p>
        </div>
        <Link href="/app/generate"><Button><Sparkles className="w-4 h-4" />Generate docs</Button></Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: FileText, label: 'Total docs', value: formatNumber(metrics.totalDocs) },
          { icon: Activity, label: 'Health score', value: `${metrics.healthScore}%` },
          { icon: AlertTriangle, label: 'Stale pages', value: String(metrics.stalePages) },
          { icon: BookOpen, label: 'Published', value: formatNumber(metrics.publishedPages) },
          { icon: MessageSquare, label: 'Unanswered', value: String(metrics.unansweredQuestions) },
          { icon: ClipboardCheck, label: 'Pending reviews', value: String(metrics.pendingReviews) },
          { icon: GitBranch, label: 'Recent syncs', value: formatNumber(metrics.recentSyncs) },
          { icon: Clock, label: 'Active jobs', value: String(metrics.pendingJobs) },
          { icon: ShieldCheck, label: 'Stale (live)', value: String(staleDocs.length) },
        ].map((m) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 p-4 shadow-sm"
          >
            <m.icon className="w-4 h-4 text-neutral-400 mb-2" />
            <p className="text-xl font-semibold tabular-nums">{m.value}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{m.label}</p>
          </motion.div>
        ))}
      </div>

      {staleDocs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-red-200/60 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/30 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-semibold text-red-700 dark:text-red-300">Stale documents detected</h3>
          </div>
          <div className="space-y-2">
            {staleDocs.slice(0, 5).map((doc) => (
              <Link key={doc.id} href={`/app/documents/${doc.id}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-red-100/50 dark:hover:bg-red-900/20 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-sm text-red-700 dark:text-red-300">{doc.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-red-500">{doc.staleSources.length} changed source{doc.staleSources.length !== 1 ? 's' : ''}</span>
                  <ChevronRight className="w-3 h-3 text-red-400 group-hover:text-red-600" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Recent activity</h2>
          </div>
          <div className="space-y-1">
            {activity.length === 0 ? (
              <p className="text-sm text-neutral-400 py-8 text-center">No activity yet. Connect sources and generate documents to get started.</p>
            ) : (
              <div className="relative pl-5 space-y-0">
                {activity.map((item, i) => {
                  const icons = { document: FileText, sync: GitBranch, generation: Sparkles } as const;
                  const Icon = (icons as Record<string, React.ElementType>)[item.type] || Activity;
                  const isLast = i === activity.length - 1;
                  return (
                    <Link key={item.id} href={item.link} className="group block relative">
                      <div className={`absolute left-0 top-3 w-px ${isLast ? 'hidden' : 'bg-neutral-200 dark:bg-neutral-700'} h-full`} />
                      <div className="flex items-start gap-3 py-2.5">
                        <div className={`w-5 h-5 rounded-full border ${isLast ? 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900' : 'bg-neutral-100 dark:bg-neutral-800 border-transparent'} flex items-center justify-center shrink-0 relative z-10`}>
                          <Icon className={`w-2.5 h-2.5 ${isLast ? 'text-neutral-500' : 'text-neutral-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">{item.label}</p>
                          <p className="text-[10px] text-neutral-400 mt-0.5 capitalize">{item.type} &middot; {formatDate(item.timestamp)}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="text-sm font-semibold mb-3">Quick actions</h2>
            <div className="space-y-1">
              {[
                { href: '/app/sources', label: 'Connect source repositories', icon: AlertCircle },
                { href: '/app/generate', label: 'Generate documentation', icon: Sparkles },
                { href: '/app/reviews', label: 'Review queue', icon: ClipboardCheck },
                { href: '/app/review-agent', label: 'Run code review', icon: Shield },
                { href: '/app/code-assistant', label: 'Code assistant', icon: Code },
                { href: '/app/documents', label: 'View all documents', icon: FileText },
              ].map((a) => (
                <Link key={a.href} href={a.href}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <a.icon className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs text-neutral-600 dark:text-neutral-400">{a.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
