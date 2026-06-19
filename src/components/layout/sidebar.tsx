'use client';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, GitBranch, FileText, Sparkles, BookOpen,
  BarChart3, Settings, Menu, ChevronLeft,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sources', label: 'Sources', icon: GitBranch },
  { href: '/docs', label: 'Documents', icon: FileText },
  { href: '/generation', label: 'Generate', icon: Sparkles },
  { href: '/publish', label: 'Publish', icon: BookOpen },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const pathname = usePathname();
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="hidden md:flex flex-col border-r border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-950 overflow-hidden shrink-0"
          >
            <div className="flex items-center justify-between h-14 px-4 border-b border-neutral-100 dark:border-neutral-800">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-neutral-900 dark:bg-white flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white dark:text-neutral-900" />
                </div>
                <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  DocFlow
                </span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group',
                    isActive(item.href)
                      ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                      : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800/50'
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {item.href === '/generation' && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </Link>
              ))}
            </nav>

            <div className="p-3 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                <div className="w-6 h-6 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center text-[10px] font-medium text-neutral-600 dark:text-neutral-300">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">Acme SaaS</p>
                  <p className="text-[10px] text-neutral-400">Free plan</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <button
        onClick={() => setSidebarOpen(true)}
        className={cn(
          'fixed top-3.5 left-3 z-50 p-2 rounded-lg md:hidden',
          'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800',
          sidebarOpen && 'hidden'
        )}
      >
        <Menu className="w-5 h-5" />
      </button>
    </>
  );
}
