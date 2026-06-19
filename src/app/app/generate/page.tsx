'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/toast';
import * as api from '@/lib/api';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { ApiJob, JobSource, JobDiff } from '@/lib/api';
import { useHotkey } from '@/lib/use-hotkey';
import {
  Sparkles, BookOpen, Code, GitCommit, MessageSquare,
  Lightbulb, Bug, FileText, Wrench, CheckCircle2, ExternalLink,
  FileCode, ChevronDown, ChevronRight, Plus, Minus,
} from 'lucide-react';

const workflows = [
  { id: 'readme', icon: BookOpen, title: 'Generate README', desc: 'From repository source files' },
  { id: 'api-ref', icon: Code, title: 'Generate API docs', desc: 'From OpenAPI spec' },
  { id: 'changelog', icon: GitCommit, title: 'Generate changelog', desc: 'From commits and PRs' },
  { id: 'feature-doc', icon: Lightbulb, title: 'Generate feature docs', desc: 'From product notes' },
  { id: 'help-center', icon: MessageSquare, title: 'Generate help center article', desc: 'From support conversations' },
  { id: 'troubleshooting', icon: Bug, title: 'Generate troubleshooting guide', desc: 'From common issues' },
  { id: 'setup-guide', icon: Wrench, title: 'Generate setup guide', desc: 'From installation flow' },
  { id: 'internal', icon: FileText, title: 'Generate internal docs', desc: 'From code and PRs' },
];

export default function GeneratePage() {
  const { workspace } = useAuth();
  const { toast } = useToast();
  const [activeJobs, setActiveJobs] = useState<Map<string, ApiJob>>(new Map());
  const intervals = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const [jobSources, setJobSources] = useState<Map<string, JobSource[]>>(new Map());
  const [jobDiffs, setJobDiffs] = useState<Map<string, JobDiff>>(new Map());
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      intervals.current.forEach((i) => clearInterval(i));
    };
  }, []);

  const startPolling = (job: ApiJob) => {
    setActiveJobs((prev) => new Map(prev).set(job.id, job));
    const interval = setInterval(async () => {
      try {
        const updated = await api.fetchJob(job.id);
        setActiveJobs((prev) => new Map(prev).set(job.id, updated));
        if (updated.status === 'COMPLETED' || updated.status === 'FAILED') {
          clearInterval(interval);
          intervals.current.delete(job.id);
          if (updated.status === 'COMPLETED') {
            loadJobDetails(job.id);
          }
        }
      } catch {
        clearInterval(interval);
        intervals.current.delete(job.id);
      }
    }, 1500);
    intervals.current.set(job.id, interval);
  };

  const loadJobDetails = async (jobId: string) => {
    try {
      const [sources, diff] = await Promise.all([
        api.fetchJobSources(jobId).catch(() => []),
        api.fetchJobDiff(jobId).catch(() => ({ added: [], removed: [], hasChanges: false })),
      ]);
      setJobSources((prev) => new Map(prev).set(jobId, sources));
      setJobDiffs((prev) => new Map(prev).set(jobId, diff));
    } catch {}
  };

  const handleGenerate = async (workflowId: string) => {
    if (!workspace) return;
    try {
      const job = await api.createJob({ type: workflowId, workspaceId: workspace.id });
      startPolling(job);
    } catch {
      toast('Failed to start generation', { variant: 'error' });
    }
  };

  useHotkey('r', () => { const first = workflows[0]; if (first) handleGenerate(first.id); }, [handleGenerate]);

  const runningJobs = Array.from(activeJobs.values())
    .filter((j) => j.status === 'PROCESSING' || j.status === 'QUEUED');

  const completedJobs = Array.from(activeJobs.values())
    .filter((j) => j.status === 'COMPLETED');

  const failedJobs = Array.from(activeJobs.values())
    .filter((j) => j.status === 'FAILED');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Generate</h1>
        <p className="text-sm text-neutral-500 mt-0.5">AI-powered documentation generation workflows.</p>
      </div>

      {runningJobs.length > 0 && (
        <div className="space-y-2">
          {runningJobs.map((job) => (
            <div key={job.id} className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Generating {job.type.replace(/-/g, ' ')}...
                  {job.message && <span className="text-xs opacity-75 ml-1">({job.message})</span>}
                </p>
                <div className="w-full h-1.5 bg-blue-200 dark:bg-blue-800 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${job.progress}%` }} />
                </div>
              </div>
              <span className="text-xs text-blue-500 shrink-0">{job.progress}%</span>
            </div>
          ))}
        </div>
      )}

      {completedJobs.length > 0 && (
        <div className="space-y-2">
          {completedJobs.map((job) => {
            const sources = jobSources.get(job.id) || [];
            const diff = jobDiffs.get(job.id);
            const expanded = expandedJob === job.id;
            return (
              <motion.div key={job.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 overflow-hidden">
                  <div className="flex items-center gap-3 p-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 flex-1">
                      {job.type.replace(/-/g, ' ')} generated successfully!
                    </p>
                    {job.resultDocumentId ? (
                      <Link href={`/app/documents/${job.resultDocumentId}`}>
                        <Button size="sm" variant="secondary"><ExternalLink className="w-3.5 h-3.5" />View</Button>
                      </Link>
                    ) : (
                      <Link href="/app/documents"><Button size="sm" variant="secondary"><ExternalLink className="w-3.5 h-3.5" />View docs</Button></Link>
                    )}
                    {(sources.length > 0 || diff?.hasChanges) && (
                      <Button size="sm" variant="ghost" onClick={() => setExpandedJob(expanded ? null : job.id)}>
                        {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        Details
                      </Button>
                    )}
                  </div>

                  {expanded && (
                    <div className="border-t border-emerald-200/60 dark:border-emerald-800/60 p-3 space-y-3 bg-emerald-50/50 dark:bg-emerald-950/50">
                      {sources.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1.5 flex items-center gap-1.5">
                            <FileCode className="w-3 h-3" /> Sources used ({sources.length})
                          </p>
                          <div className="space-y-0.5">
                            {sources.map((s) => (
                              <div key={s.id} className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                                <span className="font-mono truncate">{s.filePath}</span>
                                <span className="text-emerald-400 dark:text-emerald-600">({s.label})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {diff?.hasChanges && (
                        <div>
                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1.5">Changes from previous</p>
                          <div className="rounded-lg bg-white dark:bg-neutral-900 border border-emerald-200/60 dark:border-emerald-800/60 overflow-hidden max-h-48 overflow-y-auto">
                            {diff.added.map((line, i) => (
                              <div key={`a-${i}`} className="px-3 py-0.5 text-xs font-mono bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                                <Plus className="w-3 h-3 shrink-0 mt-0.5 text-emerald-500" />
                                <span className="whitespace-pre-wrap">{line}</span>
                              </div>
                            ))}
                            {diff.removed.map((line, i) => (
                              <div key={`r-${i}`} className="px-3 py-0.5 text-xs font-mono bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 flex items-start gap-2">
                                <Minus className="w-3 h-3 shrink-0 mt-0.5 text-red-500" />
                                <span className="whitespace-pre-wrap">{line}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!diff?.hasChanges && sources.length === 0 && (
                        <p className="text-xs text-emerald-500 dark:text-emerald-400">No additional details available.</p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {failedJobs.length > 0 && (
        <div className="space-y-2">
          {failedJobs.map((job) => (
            <div key={job.id} className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <span className="w-5 h-5 text-red-500 shrink-0 text-center leading-5 text-sm">!</span>
              <p className="text-sm text-red-700 dark:text-red-300 flex-1">
                {job.type.replace(/-/g, ' ')} failed{job.message ? `: ${job.message}` : ''}
              </p>
              <Button size="sm" variant="outline" onClick={() => handleGenerate(job.type)}>Retry</Button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {workflows.map((wf) => {
          const isRunning = runningJobs.some((j) => j.type === wf.id);
          const isDone = completedJobs.some((j) => j.type === wf.id);
          return (
            <motion.div key={wf.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card hover className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                      <wf.icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{wf.title}</h3>
                      <p className="text-xs text-neutral-400">{wf.desc}</p>
                    </div>
                  </div>
                  {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                </div>
                <Button variant={isDone ? 'secondary' : 'primary'} size="sm" className="w-full"
                  loading={isRunning} onClick={() => handleGenerate(wf.id)}
                >
                  {isRunning ? 'Generating...' : isDone ? 'Regenerate' : 'Generate'}
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
