'use client';

import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { Search, Sun, Moon, Bell, LogOut, Command } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Topbar() {
  const { setCommandPaletteOpen } = useAppStore();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="h-14 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        <button onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors w-full max-w-sm"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Search docs, sources...</span>
          <span className="hidden sm:flex items-center gap-1 ml-auto text-[10px] text-neutral-400 border border-neutral-200 dark:border-neutral-700 rounded px-1.5 py-0.5">
            <Command className="w-2.5 h-2.5" />K
          </span>
        </button>

        <div className="flex items-center gap-2">
          {mounted && (
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
          <button className="relative p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>
          <div className="flex items-center gap-2 pl-2 border-l border-neutral-200 dark:border-neutral-700">
            <span className="text-xs text-neutral-400 hidden sm:inline">{user?.name || user?.email}</span>
            <button onClick={signOut} className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
