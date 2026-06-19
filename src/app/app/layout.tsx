'use client';

import { Sidebar } from '@/components/app/sidebar';
import { Topbar } from '@/components/app/topbar';
import { CommandPalette } from '@/components/app/command-palette';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { motion } from 'framer-motion';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-neutral-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <ErrorBoundary>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              {children}
            </motion.div>
          </ErrorBoundary>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
