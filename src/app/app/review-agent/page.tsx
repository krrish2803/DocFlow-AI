'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/toast';
import * as api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2,
  Lock, Lightbulb, FileText, RefreshCw, X,
} from 'lucide-react';

const FILE_PATTERNS = [
  { ext: '.ts', label: 'TypeScript' },
  { ext: '.tsx', label: 'TSX' },
  { ext: '.js', label: 'JavaScript' },
  { ext: '.jsx', label: 'JSX' },
  { ext: '.py', label: 'Python' },
  { ext: '.go', label: 'Go' },
  { ext: '.rs', label: 'Rust' },
  { ext: '.java', label: 'Java' },
  { ext: '.rb', label: 'Ruby' },
  { ext: '.yaml', label: 'YAML' },
  { ext: '.json', label: 'JSON' },
  { ext: '.md', label: 'Markdown' },
];

interface ReviewFile {
  path: string;
  summary: string;
  issues: string[];
  qualityRating: number;
  securityConcerns: string[];
  suggestions: string[];
}

interface ReviewResult {
  overallScore: number;
  totalFiles: number;
  totalIssues: number;
  totalSecurityConcerns: number;
  files: ReviewFile[];
}

function getScoreColor(score: number): string {
  if (score > 7) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 4) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreBg(score: number): string {
  if (score > 7) return 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800';
  if (score >= 4) return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800';
  return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
}

export default function ReviewAgentPage() {
  const { workspace } = useAuth();
  const { toast } = useToast();
  const [sources, setSources] = useState<api.ApiSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>(['.ts', '.tsx', '.js', '.py']);
  const [reviewing, setReviewing] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace) return;
    api.fetchSources(workspace.id).then((s) => {
      setSources(s);
      if (s.length > 0) setSelectedSource(s[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [workspace]);

  const togglePattern = (ext: string) => {
    setSelectedPatterns((prev) =>
      prev.includes(ext) ? prev.filter((p) => p !== ext) : [...prev, ext]
    );
  };

  const handleReview = async () => {
    if (!selectedSource || !workspace) return;
    setReviewing(true);
    setResult(null);
    try {
      const res = await fetch('/api/agents/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: selectedSource,
          filePatterns: selectedPatterns,
          workspaceId: workspace.id,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      toast('Failed to run review', { variant: 'error' });
    }
    setReviewing(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-neutral-500" />
          Review Agent
        </h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          AI-powered code review for quality, security, and best practices.
        </p>
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 block">Source</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            >
              {sources.length === 0 && <option>No sources available</option>}
              {sources.map((src) => (
                <option key={src.id} value={src.id}>{src.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 block">File patterns</label>
            <div className="flex flex-wrap gap-2">
              {FILE_PATTERNS.map((p) => (
                <button
                  key={p.ext}
                  onClick={() => togglePattern(p.ext)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedPatterns.includes(p.ext)
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {p.label} <span className="ml-1 opacity-60">{p.ext}</span>
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleReview} loading={reviewing} disabled={!selectedSource || selectedPatterns.length === 0}>
            <Shield className="w-4 h-4" />
            Start Review
          </Button>
        </div>
      </Card>

      {reviewing && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
          <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">Analyzing code across {selectedPatterns.length} file patterns...</p>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className={`rounded-xl border p-5 ${getScoreBg(result.overallScore)}`}>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className={`text-3xl font-bold ${getScoreColor(result.overallScore)}`}>{result.overallScore}</p>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wide">/10</p>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">Overall Quality Score</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {result.overallScore > 7 ? 'Excellent code quality' :
                   result.overallScore >= 4 ? 'Needs improvement' : 'Critical issues found'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Files reviewed', value: String(result.totalFiles), icon: FileText },
              { label: 'Issues found', value: String(result.totalIssues), icon: AlertTriangle },
              { label: 'Security concerns', value: String(result.totalSecurityConcerns), icon: Lock },
              { label: 'Avg quality', value: `${(result.files.reduce((s, f) => s + f.qualityRating, 0) / (result.files.length || 1)).toFixed(1)}/10`, icon: CheckCircle2 },
            ].map((m) => (
              <motion.div key={m.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 p-4 shadow-sm"
              >
                <m.icon className="w-4 h-4 text-neutral-400 mb-2" />
                <p className="text-xl font-semibold tabular-nums">{m.value}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{m.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="space-y-2">
            {result.files.map((file) => {
              const isExpanded = expandedFile === file.path;
              return (
                <motion.div key={file.path} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  <Card hover>
                    <button
                      onClick={() => setExpandedFile(isExpanded ? null : file.path)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />}
                        <span className="text-sm font-mono font-medium truncate flex-1">{file.path}</span>
                        <span className={`text-sm font-semibold ${getScoreColor(file.qualityRating)}`}>{file.qualityRating}/10</span>
                        {file.issues.length > 0 && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                            {file.issues.length} issue{file.issues.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {file.securityConcerns.length > 0 && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                            <Lock className="w-2.5 h-2.5 mr-0.5" />{file.securityConcerns.length}
                          </span>
                        )}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
                            <div>
                              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Summary</p>
                              <p className="text-sm text-neutral-700 dark:text-neutral-300">{file.summary}</p>
                            </div>

                            {file.issues.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1.5 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />Issues
                                </p>
                                <ul className="space-y-1">
                                  {file.issues.map((issue, i) => (
                                    <li key={i} className="text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                                      {issue}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {file.securityConcerns.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1.5 flex items-center gap-1">
                                  <Lock className="w-3 h-3" />Security concerns
                                </p>
                                <ul className="space-y-1">
                                  {file.securityConcerns.map((c, i) => (
                                    <li key={i} className="text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-1.5" />
                                      {c}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {file.suggestions.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                                  <Lightbulb className="w-3 h-3" />Suggestions
                                </p>
                                <ul className="space-y-1">
                                  {file.suggestions.map((s, i) => (
                                    <li key={i} className="text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                                      {s}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {!result && !reviewing && (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-neutral-400" />
          </div>
          <h3 className="text-sm font-semibold mb-1">No review results yet</h3>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">Select a source and file patterns, then click Start Review.</p>
        </div>
      )}
    </div>
  );
}
