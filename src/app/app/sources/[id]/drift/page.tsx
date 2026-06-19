'use client';

import { useEffect, useState, use } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/toast';
import * as api from '@/lib/api';
import { motion } from 'framer-motion';
import {
  ArrowLeft, AlertTriangle, CheckCircle2, FileCode,
  GitBranch, Eye, EyeOff,
} from 'lucide-react';
import Link from 'next/link';

export default function DriftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { workspace } = useAuth();
  const { toast } = useToast();
  const [result, setResult] = useState<api.DriftResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUndocumented, setShowUndocumented] = useState(false);

  useEffect(() => {
    api.fetchDriftResult(id)
      .then((r) => { setResult(r); setLoading(false); })
      .catch(() => { toast('Failed to load drift results', { variant: 'error' }); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
        <div className="h-48 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-16">
        <FileCode className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-1">No drift data</h2>
        <p className="text-sm text-neutral-400 mb-4">Run a spec analysis on this source to see drift results.</p>
        <Link href="/app/sources"><Button>Back to sources</Button></Link>
      </div>
    );
  }

  const undocumented = result.endpoints.filter((e) => !e.documented);
  const documented = result.endpoints.filter((e) => e.documented);
  const displayEndpoints = showUndocumented ? undocumented : result.endpoints;
  const coverageColor = result.coveragePercent >= 80 ? 'text-emerald-600 dark:text-emerald-400'
    : result.coveragePercent >= 50 ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/app/sources" className="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />Back to sources
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-semibold">Spec Drift Analysis</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Endpoint detection and documentation coverage.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-semibold tabular-nums">{result.totalEndpoints}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Total endpoints</p>
        </Card>
        <Card className="p-4 text-center">
          <p className={`text-2xl font-semibold tabular-nums ${coverageColor}`}>{result.coveragePercent}%</p>
          <p className="text-xs text-neutral-500 mt-0.5">Coverage</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">{undocumented.length}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Undocumented</p>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Coverage</h3>
        </div>
        <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${result.coveragePercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              result.coveragePercent >= 80 ? 'bg-emerald-500'
                : result.coveragePercent >= 50 ? 'bg-amber-500'
                : 'bg-red-500'
            }`}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-neutral-400">
          <span>{result.documentedCount} documented</span>
          <span>{undocumented.length} undocumented</span>
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Endpoints</h3>
          <Button
            size="sm"
            variant={showUndocumented ? 'secondary' : 'ghost'}
            onClick={() => setShowUndocumented(!showUndocumented)}
          >
            {showUndocumented ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showUndocumented ? 'Show all' : 'Undocumented only'}
          </Button>
        </div>

        {displayEndpoints.length === 0 ? (
          <p className="text-xs text-neutral-400 py-6 text-center">
            {showUndocumented ? 'All endpoints are documented!' : 'No endpoints found.'}
          </p>
        ) : (
          <div className="space-y-1">
            {displayEndpoints.map((ep, i) => (
              <div
                key={`${ep.method}-${ep.path}-${i}`}
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                  ep.documented
                    ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30'
                    : 'bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30'
                }`}
              >
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  ep.method === 'GET' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : ep.method === 'POST' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                    : ep.method === 'PUT' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                    : ep.method === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                }`}>
                  {ep.method}
                </span>
                <span className="text-xs font-mono flex-1 truncate">{ep.path}</span>
                {ep.documented ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                )}
                <span className="text-[10px] text-neutral-400 shrink-0">{ep.source}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
