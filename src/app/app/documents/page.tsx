'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { useHotkey } from '@/lib/use-hotkey';
import * as api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Plus, Search, BookOpen, Code, FileText, Wrench, GitCommit, Lightbulb, Bug, Megaphone, Trash2, Eye } from 'lucide-react';
import type { ApiDoc } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const docIcons: Record<string, React.ElementType> = {
  setup_guide: Wrench, api_reference: Code, readme: BookOpen,
  changelog: GitCommit, feature_explainer: Lightbulb, troubleshooting: Bug,
  help_center: BookOpen, release_notes: Megaphone, internal_docs: FileText,
};

export default function DocumentsPage() {
  const { workspace } = useAuth();
  const [docs, setDocs] = useState<ApiDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  function loadDocs() {
    if (!workspace) return;
    api.fetchDocs(workspace.id).then(setDocs).catch(() => {}).finally(() => setLoading(false));
  }

  const router = useRouter();

  useHotkey('n', () => router.push('/app/generate'), [router]);
  useHotkey('/', () => searchRef.current?.focus(), [searchRef]);

  useEffect(() => {
    if (workspace) loadDocs();
    else setLoading(false);
  }, [workspace]);

  async function handleDelete(doc: ApiDoc, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${doc.title}"?`)) return;
    await api.deleteDoc(doc.id);
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
  }

  const filtered = docs.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-56 mt-1.5" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-72 rounded-lg" />
      <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
          <Skeleton className="w-4 h-4" />
          <div className="flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32 mt-1" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}</div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Documents</h1>
          <p className="text-sm text-neutral-500 mt-0.5">All generated and published documentation.</p>
        </div>
        <Link href="/app/generate"><Button><Plus className="w-4 h-4" />New document</Button></Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..."
          className="w-full h-10 pl-9 pr-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400" />
      </div>

      <div className="space-y-1">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-neutral-400" />
            </div>
            <h3 className="text-sm font-semibold mb-1">No documents yet</h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto mb-4">Generate your first document from a connected source or create one manually.</p>
            <Link href="/app/generate"><Button><Plus className="w-4 h-4" />Generate a document</Button></Link>
          </div>
        ) : (
          filtered.map((doc) => {
            const Icon = docIcons[doc.docType] || FileText;
            return (
              <motion.div key={doc.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                <Link href={`/app/documents/${doc.id}`}>
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-all group">
                    <Icon className="w-4 h-4 text-neutral-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{doc.title}</p>
                      {doc.description && <p className="text-xs text-neutral-400 mt-0.5 truncate">{doc.description}</p>}
                    </div>
                    <div className="hidden sm:flex items-center gap-3 text-xs text-neutral-400">
                      <span>v{doc.version}</span>
                    </div>
                    <Badge status={doc.isPublished ? 'published' : doc.status} />
                    <button onClick={(e) => handleDelete(doc, e)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
