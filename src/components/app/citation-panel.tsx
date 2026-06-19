'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, FileText, ExternalLink } from 'lucide-react';

interface Citation {
  id: string;
  filePath: string;
  sourceLabel: string;
  excerpt: string;
  fullContent?: string;
}

export function CitationPanel({ documentId }: { documentId: string }) {
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/documents/${documentId}/citations`)
      .then((r) => r.json())
      .then((data) => { setCitations(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [documentId]);

  if (loading) {
    return (
      <Card className="p-5">
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-neutral-200/50 dark:bg-neutral-700/50 rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  if (citations.length === 0) return null;

  return (
    <Card className="p-5 space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <FileText className="w-4 h-4 text-neutral-400" />
        Source Citations
        <span className="text-xs text-neutral-400 font-normal">({citations.length})</span>
      </h3>
      <div className="space-y-2">
        {citations.map((c) => {
          const expanded = expandedId === c.id;
          return (
            <div key={c.id} className="rounded-lg border border-neutral-200/60 dark:border-neutral-800/60 overflow-hidden">
              <button
                onClick={() => setExpandedId(expanded ? null : c.id)}
                className="w-full flex items-center gap-2 p-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
              >
                {expanded ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">{c.sourceLabel}</span>
                    <span className="text-[10px] text-neutral-400 font-mono truncate">{c.filePath}</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{c.excerpt}</p>
                </div>
              </button>
              {expanded && c.fullContent && (
                <div className="border-t border-neutral-100 dark:border-neutral-800 p-3 bg-neutral-50 dark:bg-neutral-800/20">
                  <pre className="text-xs whitespace-pre-wrap font-sans text-neutral-600 dark:text-neutral-400 max-h-64 overflow-y-auto">{c.fullContent}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
