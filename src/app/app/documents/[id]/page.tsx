'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StaleBadge } from '@/components/app/stale-badge';
import { CitationPanel } from '@/components/app/citation-panel';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/toast';
import * as api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft, Edit3, Save, Trash2, FileText, BookOpen, Code, Wrench, GitCommit,
  Lightbulb, Bug, Megaphone, History, ChevronDown, ChevronRight, Link as LinkIcon,
  UserPlus, AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const docIcons: Record<string, React.ElementType> = {
  setup_guide: Wrench, api_reference: Code, readme: BookOpen,
  changelog: GitCommit, feature_explainer: Lightbulb, troubleshooting: Bug,
  help_center: BookOpen, release_notes: Megaphone, internal_docs: FileText,
};

export default function DocumentViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { workspace } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [doc, setDoc] = useState<api.ApiDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState<api.DocumentVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<api.DocumentVersion | null>(null);
  const [sourceLinks, setSourceLinks] = useState<api.DocSourceLink[]>([]);
  const [showSources, setShowSources] = useState(false);
  const [members, setMembers] = useState<api.WorkspaceMember[]>([]);
  const [showAssign, setShowAssign] = useState(false);

  const loadDoc = useCallback(() => {
    api.fetchDoc(id).then((d) => {
      setDoc(d);
      setTitle(d.title);
      setDescription(d.description || '');
      setContent(d.content);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadDoc();
    api.fetchDocVersions(id).then(setVersions).catch(() => {});
    api.fetchDocSources(id).then(setSourceLinks).catch(() => {});
    if (workspace) {
      api.fetchMembers(workspace.id).then(setMembers).catch(() => {});
    }
  }, [id, workspace]);

  async function handleSave() {
    if (!doc) return;
    setSaving(true);
    try {
      const updated = await api.updateDoc(doc.id, { title, description, content });
      setDoc(updated);
      setTitle(updated.title);
      setDescription(updated.description || '');
      setContent(updated.content);
      setEditing(false);
    } catch { }
    setSaving(false);
  }

  async function handlePublish() {
    if (!doc) return;
    const updated = await api.updateDoc(doc.id, { isPublished: !doc.isPublished, status: doc.isPublished ? 'draft' : 'approved' });
    setDoc(updated);
  }

  async function handleDelete() {
    if (!doc || !confirm('Delete this document permanently?')) return;
    await api.deleteDoc(doc.id);
    router.push('/app/documents');
  }

  async function handleAssign(userId: string) {
    try {
      await api.assignReviewer(id, userId);
      toast('Reviewer assigned', { variant: 'success' });
      setShowAssign(false);
    } catch {
      toast('Failed to assign reviewer', { variant: 'error' });
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
        <div className="h-4 w-96 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
        <div className="h-96 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="text-center py-16">
        <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-1">Document not found</h2>
        <p className="text-sm text-neutral-400 mb-4">This document may have been deleted.</p>
        <Link href="/app/documents"><Button>Back to documents</Button></Link>
      </div>
    );
  }

  const Icon = docIcons[doc.docType] || FileText;
  const hasStaleSources = sourceLinks.some((s) => s.stale);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/app/documents" className="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />Back to documents
        </Link>
        <div className="flex items-center gap-2">
          <Badge status={doc.isPublished ? 'published' : doc.status} />
          {hasStaleSources && <StaleBadge stale />}
          <span className="text-xs text-neutral-400">v{doc.version}</span>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-neutral-500" />
            </div>
            {editing ? (
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold bg-transparent border-b border-neutral-300 dark:border-neutral-600 focus:outline-none focus:border-neutral-500 pb-0.5" />
            ) : (
              <h1 className="text-lg font-semibold">{doc.title}</h1>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {editing ? (
              <Button onClick={handleSave} disabled={saving}><Save className="w-3.5 h-3.5" />{saving ? 'Saving...' : 'Save'}</Button>
            ) : (
              <Button variant="outline" onClick={() => setEditing(true)}><Edit3 className="w-3.5 h-3.5" />Edit</Button>
            )}
          </div>
        </div>

        {editing ? (
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description"
            className="w-full text-sm text-neutral-500 bg-transparent border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-neutral-400" rows={2} />
        ) : (
          doc.description && <p className="text-sm text-neutral-500">{doc.description}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <span>Updated {formatDate(doc.updatedAt)}</span>
          <span>Created {formatDate(doc.createdAt)}</span>
        </div>
      </Card>

      <Card className="p-6">
        {editing ? (
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[400px] text-sm bg-transparent border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 font-mono focus:outline-none focus:ring-2 focus:ring-neutral-400 resize-y" />
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {content ? <MarkdownPreview content={content} /> : <p className="text-neutral-400 italic">No content</p>}
          </div>
        )}
      </Card>

      <Card>
        <button onClick={() => setShowSources(!showSources)} className="w-full flex items-center justify-between p-4 text-left">
          <div className="flex items-center gap-3">
            <LinkIcon className="w-4 h-4 text-neutral-400" />
            <span className="text-sm font-medium">Source files</span>
            <span className="text-xs text-neutral-400">({sourceLinks.length})</span>
            {hasStaleSources && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
          </div>
          {showSources ? <ChevronDown className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
        </button>
        {showSources && (
          <div className="border-t border-neutral-100 dark:border-neutral-800">
            {sourceLinks.length === 0 ? (
              <p className="text-xs text-neutral-400 p-4">No source files linked</p>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {sourceLinks.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono text-neutral-500 truncate">{s.filePath}</span>
                      <span className="text-[10px] text-neutral-400">{s.sourceLabel}</span>
                    </div>
                    <StaleBadge stale={s.stale} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <Card>
        <button onClick={() => setShowVersions(!showVersions)} className="w-full flex items-center justify-between p-4 text-left">
          <div className="flex items-center gap-3">
            <History className="w-4 h-4 text-neutral-400" />
            <span className="text-sm font-medium">Version history</span>
            <span className="text-xs text-neutral-400">({versions.length} versions)</span>
          </div>
          {showVersions ? <ChevronDown className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
        </button>
        {showVersions && (
          <div className="border-t border-neutral-100 dark:border-neutral-800">
            {versions.length === 0 ? (
              <p className="text-xs text-neutral-400 p-4">No previous versions</p>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {versions.map((v) => (
                  <div key={v.id}
                    className="flex items-center justify-between p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
                    onClick={() => setPreviewVersion(previewVersion?.id === v.id ? null : v)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-neutral-500">v{v.version}</span>
                      <span className="text-sm">{v.title}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400">{formatDate(v.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
            {previewVersion && (
              <div className="border-t border-neutral-100 dark:border-neutral-800 p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-sans text-neutral-600 dark:text-neutral-400">{previewVersion.content.slice(0, 3000)}</pre>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserPlus className="w-4 h-4 text-neutral-400" />
            <span className="text-sm font-medium">Review assignment</span>
          </div>
          <div className="relative">
            <Button size="sm" variant="outline" onClick={() => setShowAssign(!showAssign)}>
              <UserPlus className="w-3.5 h-3.5" />Assign reviewer
            </Button>
            {showAssign && (
              <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-20 py-1">
                {members.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-neutral-400">No workspace members</p>
                ) : (
                  members.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleAssign(m.userId)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2"
                    >
                      <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[9px] font-medium">
                        {(m.name || m.email)?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="truncate">{m.name || m.email}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      <CitationPanel documentId={id} />

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:border-red-200"><Trash2 className="w-3.5 h-3.5" />Delete</Button>
        <Button onClick={handlePublish}>{doc.isPublished ? 'Unpublish' : 'Publish'}</Button>
      </div>
    </div>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  return <div className="whitespace-pre-wrap">{content}</div>;
}
