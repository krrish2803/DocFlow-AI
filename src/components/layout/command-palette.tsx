'use client';

import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, GitBranch, Sparkles, BarChart3, Settings, BookOpen, Command } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const commands = [
  { icon: Search, label: 'Search documentation...', href: '#', shortcut: '⌘K' },
  { icon: FileText, label: 'Create new document', href: '/docs/new', shortcut: '⌘N' },
  { icon: GitBranch, label: 'Connect a source', href: '/sources', shortcut: '⌘S' },
  { icon: Sparkles, label: 'Generate documentation', href: '/generation', shortcut: '⌘G' },
  { icon: BookOpen, label: 'Open publish center', href: '/publish', shortcut: '⌘P' },
  { icon: BarChart3, label: 'View analytics', href: '/analytics', shortcut: '⌘A' },
  { icon: Settings, label: 'Settings', href: '/settings', shortcut: '⌘,' },
  { icon: BookOpen, label: 'Go to dashboard', href: '/dashboard', shortcut: '⌘D' },
];

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const [search, setSearch] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape') setCommandPaletteOpen(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch('');
    }
  }, [commandPaletteOpen]);

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setCommandPaletteOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-[15%] -translate-x-1/2 w-full max-w-lg"
          >
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                <Search className="w-4 h-4 text-neutral-400" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none"
                />
                <kbd className="text-[10px] text-neutral-400 border border-neutral-200 dark:border-neutral-700 rounded px-1.5 py-0.5">
                  ESC
                </kbd>
              </div>

              <div className="py-2 max-h-72 overflow-y-auto">
                {filtered.map((cmd) => (
                  <button
                    key={cmd.href}
                    onClick={() => {
                      setCommandPaletteOpen(false);
                      router.push(cmd.href);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <cmd.icon className="w-4 h-4 text-neutral-400" />
                    <span className="flex-1 text-left">{cmd.label}</span>
                    <kbd className="text-[10px] text-neutral-400 border border-neutral-200 dark:border-neutral-700 rounded px-1.5 py-0.5">
                      {cmd.shortcut}
                    </kbd>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="px-4 py-8 text-sm text-neutral-400 text-center">No results found</p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
