'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/toast';
import * as api from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  GitBranch, FileJson, FileText, MessageSquare, GitCommit,
  BookOpen, Plus, RefreshCw, ExternalLink, Eye, EyeOff, Trash2, Link as LinkIcon,
  Shield, Code,
} from 'lucide-react';
import type { ApiSource } from '@/lib/api';
import { useHotkey } from '@/lib/use-hotkey';
import Link from 'next/link';

const sourceIcons: Record<string, React.ElementType> = {
  GITHUB_REPO: GitBranch, OPENAPI_SPEC: FileJson, MARKDOWN: FileText,
  SUPPORT_CONVERSATIONS: MessageSquare, CHANGELOG: GitCommit, INTERNAL_NOTES: BookOpen,
};

const sourceLabels: Record<string, string> = {
  GITHUB_REPO: 'GitHub repository', OPENAPI_SPEC: 'OpenAPI spec', MARKDOWN: 'Markdown docs',
  SUPPORT_CONVERSATIONS: 'Support conversations', CHANGELOG: 'Changelog', INTERNAL_NOTES: 'Internal notes',
};

export default function SourcesPage() {
  const { workspace, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [sources, setSources] = useState<ApiSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('GITHUB_REPO');
  const [formLabel, setFormLabel] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formToken, setFormToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const loadSources = useCallback(() => {
    if (!workspace) return;
    api.fetchSources(workspace.id).then((s) => { setSources(s); setLoading(false); }).catch(() => setLoading(false));
  }, [workspace]);

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      await api.syncSource(id);
      loadSources();
    } catch {}
    setSyncingId(null);
  };

  const handleDeleteSource = async (id: string, label: string) => {
    if (!confirm(`Delete "${label}"? All synced files will be removed.`)) return;
    await api.deleteSource(id);
    loadSources();
  };

  useHotkey('n', () => setShowForm((v) => !v), [setShowForm], !authLoading);

  useEffect(() => {
    if (authLoading) return;
    if (!workspace) { setLoading(false); return; }
    loadSources();
  }, [workspace, authLoading, loadSources]);

  const handleAdd = async () => {
    if (!workspace || !formLabel.trim()) return;
    setSaving(true);
    try {
      await api.createSource({ sourceType: formType, label: formLabel.trim(), repositoryUrl: formUrl.trim() || undefined, token: formToken.trim() || undefined, workspaceId: workspace.id });
      setFormLabel('');
      setFormUrl('');
      setFormToken('');
      setShowForm(false);
      loadSources();
    } catch {}
    setSaving(false);
  };

  if (loading || authLoading) return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Sources</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Connect and manage your documentation sources.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4" />Add source</Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select value={formType} onChange={(e) => { setFormType(e.target.value); setFormUrl(''); setFormToken(''); }}
              className="h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            >
              <option value="GITHUB_REPO">GitHub repository</option>
              <option value="OPENAPI_SPEC">OpenAPI spec</option>
              <option value="MARKDOWN">Markdown docs</option>
              <option value="SUPPORT_CONVERSATIONS">Support conversations</option>
              <option value="CHANGELOG">Changelog</option>
              <option value="INTERNAL_NOTES">Internal notes</option>
            </select>
            <input value={formLabel} onChange={(e) => setFormLabel(e.target.value)} placeholder="Label (e.g. API Backend)"
              className="h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400" />
            {formType !== 'INTERNAL_NOTES' && (
              <input value={formUrl} onChange={(e) => setFormUrl(e.target.value)}
                placeholder={formType === 'GITHUB_REPO' ? 'https://github.com/owner/repo' : 'https://example.com/spec.yaml'}
                className="h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400" />
            )}
            {formType === 'INTERNAL_NOTES' && <div />}
            <div className="flex gap-2">
              <Button onClick={handleAdd} loading={saving} disabled={!formLabel.trim()} className="flex-1">Add</Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
          <div className="text-xs text-neutral-400 flex items-center gap-2">
            {formType === 'GITHUB_REPO' && <><LinkIcon className="w-3 h-3" /> Synced via GitHub API. Fetches repository files for analysis.</>}
            {formType === 'OPENAPI_SPEC' && <><LinkIcon className="w-3 h-3" /> Provide a URL to a hosted OpenAPI/Swagger spec file.</>}
            {formType === 'MARKDOWN' && <><LinkIcon className="w-3 h-3" /> Provide a URL to a directory of markdown files.</>}
            {formType === 'SUPPORT_CONVERSATIONS' && <><LinkIcon className="w-3 h-3" /> Link to support conversation exports.</>}
            {formType === 'CHANGELOG' && <><LinkIcon className="w-3 h-3" /> Link to changelog or release notes source.</>}
            {formType === 'INTERNAL_NOTES' && 'Internal notes are created and edited within DocFlow.'}
          </div>

          {formType === 'GITHUB_REPO' && (
            <div className="relative">
              <input type={showToken ? 'text' : 'password'} value={formToken} onChange={(e) => setFormToken(e.target.value)}
                placeholder="GitHub personal access token (optional — for higher rate limits / private repos)"
                className="w-full h-10 pl-3 pr-10 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400" />
              <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
              <GitBranch className="w-6 h-6 text-neutral-400" />
            </div>
            <h3 className="text-sm font-semibold mb-1">No connected sources</h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto mb-4">Connect a GitHub repository, OpenAPI spec, or import markdown files to get started.</p>
            <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" />Add your first source</Button>
          </div>
        ) : (
          sources.map((src) => {
            const Icon = sourceIcons[src.sourceType] || FileText;
            return (
              <motion.div key={src.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card hover>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{src.label}</h3>
                        <p className="text-xs text-neutral-400">{sourceLabels[src.sourceType] || src.sourceType}</p>
                      </div>
                    </div>
                    <Badge status={src.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-neutral-400 mb-4">
                    <span>{formatNumber(src.contentVolume)} files</span>
                    {src.lastSyncAt && <span>Last sync: {formatDate(src.lastSyncAt)}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" loading={syncingId === src.id} onClick={() => handleSync(src.id)}><RefreshCw className="w-3.5 h-3.5" />Sync</Button>
                    <Link href={`/app/review-agent?source=${src.id}`}>
                      <Button variant="ghost" size="sm"><Shield className="w-3.5 h-3.5" />Review</Button>
                    </Link>
                    <Link href={`/app/code-assistant?source=${src.id}`}>
                      <Button variant="ghost" size="sm"><Code className="w-3.5 h-3.5" />Fix Code</Button>
                    </Link>
                    <Link href={`/app/sources/${src.id}/drift`}>
                      <Button variant="ghost" size="sm"><ExternalLink className="w-3.5 h-3.5" />Drift</Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSource(src.id, src.label)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
