'use client';

import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import * as api from '@/lib/api';
import {
  Search, FileText, GitBranch, Sparkles, LayoutDashboard, MessageSquare,
  Settings, Sun, Moon, RefreshCw, BookOpen, Activity, ExternalLink, Globe,
} from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const { theme, setTheme } = useTheme();
  const { workspace } = useAuth();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<api.SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const navigate = useCallback((href: string) => {
    setCommandPaletteOpen(false);
    router.push(href);
  }, [router, setCommandPaletteOpen]);

  useEffect(() => {
    if (!search.trim() || !workspace) { setResults(null); return; }
    setSearching(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.search(workspace.id, search.trim());
        setResults(res);
      } catch { setResults(null); }
      setSearching(false);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [search, workspace]);

  const commands = [
    { icon: LayoutDashboard, label: 'Go to Dashboard', action: () => navigate('/app/dashboard'), shortcut: '⌘D' },
    { icon: FileText, label: 'Go to Documents', action: () => navigate('/app/documents'), shortcut: '⌘N' },
    { icon: GitBranch, label: 'Go to Sources', action: () => navigate('/app/sources'), shortcut: '⌘S' },
    { icon: Sparkles, label: 'Go to Generate', action: () => navigate('/app/generate'), shortcut: '⌘G' },
    { icon: MessageSquare, label: 'Go to Assistant', action: () => navigate('/app/assistant'), shortcut: '⌘A' },
    { icon: Settings, label: 'Go to Settings', action: () => navigate('/app/settings'), shortcut: '⌘,' },
    { icon: Globe, label: 'Go to Hosting', action: () => navigate('/app/portal'), shortcut: '⌘H' },
    { icon: Sun, label: 'Switch to light mode', action: () => { setTheme('light'); setCommandPaletteOpen(false); } },
    { icon: Moon, label: 'Switch to dark mode', action: () => { setTheme('dark'); setCommandPaletteOpen(false); } },
    { icon: BookOpen, label: 'Switch to system theme', action: () => { setTheme('system'); setCommandPaletteOpen(false); } },
    { icon: RefreshCw, label: 'Sync all sources', action: () => navigate('/app/sources') },
    { icon: Activity, label: 'View activity', action: () => navigate('/app/dashboard') },
  ];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setCommandPaletteOpen(!commandPaletteOpen); }
      if (e.key === 'Escape') setCommandPaletteOpen(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) { setTimeout(() => inputRef.current?.focus(), 50); setSearch(''); setResults(null); }
  }, [commandPaletteOpen]);

  const showCommands = !search.trim();
  const filteredCommands = showCommands
    ? commands
    : commands.filter((c) => c.label.toLowerCase().includes(search.toLowerCase()));
  const hasSearchResults = results && (results.documents.length > 0 || results.files.length > 0);

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setCommandPaletteOpen(false)}
        >
          <motion.div initial={{ opacity: 0, scale: 0.96, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.12 }} onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-[15%] -translate-x-1/2 w-full max-w-lg"
          >
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                <Search className="w-4 h-4 text-neutral-400" />
                <input ref={inputRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search commands or documents..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400" />
                <kbd className="text-[10px] text-neutral-400 border border-neutral-200 dark:border-neutral-700 rounded px-1.5 py-0.5">ESC</kbd>
              </div>
              <div className="py-2 max-h-80 overflow-y-auto">
                {searching && (
                  <div className="px-4 py-3 text-sm text-neutral-400 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-neutral-300 border-t-neutral-600 animate-spin" />
                    Searching...
                  </div>
                )}

                {hasSearchResults && (
                  <>
                    {results!.documents.length > 0 && (
                      <div className="px-4 py-1.5 text-[10px] font-medium text-neutral-400 uppercase tracking-wider">Documents</div>
                    )}
                    {results!.documents.map((doc) => (
                      <button key={doc.id} onClick={() => navigate(`/app/documents/${doc.id}`)}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
                        <span className="flex-1 text-left truncate">{doc.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          doc.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : doc.status === 'draft' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                        }`}>{doc.status}</span>
                      </button>
                    ))}

                    {results!.files.length > 0 && (
                      <div className="px-4 py-1.5 text-[10px] font-medium text-neutral-400 uppercase tracking-wider mt-1">Source Files</div>
                    )}
                    {results!.files.map((file) => (
                      <div key={file.id}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-neutral-500"
                      >
                        <GitBranch className="w-4 h-4 text-neutral-400 shrink-0" />
                        <span className="flex-1 text-left truncate font-mono text-xs">{file.path}</span>
                      </div>
                    ))}
                  </>
                )}

                {!searching && !hasSearchResults && search.trim() && (
                  <p className="px-4 py-8 text-sm text-neutral-400 text-center">No results found</p>
                )}

                {showCommands && filteredCommands.map((cmd, i) => (
                  <button key={i} onClick={() => { cmd.action(); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <cmd.icon className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span className="flex-1 text-left">{cmd.label}</span>
                    {cmd.shortcut && <kbd className="text-[10px] text-neutral-400 border border-neutral-200 dark:border-neutral-700 rounded px-1.5 py-0.5">{cmd.shortcut}</kbd>}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
