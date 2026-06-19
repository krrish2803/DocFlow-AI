'use client';

import { Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileText, Eye, EyeOff } from 'lucide-react';

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ok = await signIn(email, password);
    setLoading(false);
    if (ok) {
      router.push(searchParams.get('redirect') || '/app/dashboard');
    } else {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 bg-neutral-50 dark:bg-neutral-900 items-center justify-center p-12">
        <div className="max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center mb-6">
            <FileText className="w-6 h-6 text-white dark:text-neutral-900" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Keep docs synced with product change.</h2>
          <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
            DocFlow automatically generates and updates documentation from your code, APIs, and support conversations.
          </p>
          <div className="mt-8 space-y-3">
            {['Connect GitHub repos and OpenAPI specs', 'AI generates drafts with source citations', 'Review, approve, and publish in minutes'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center">
              <FileText className="w-4 h-4 text-white dark:text-neutral-900" />
            </div>
            <span className="font-semibold text-lg">DocFlow</span>
          </div>

          <h1 className="text-xl font-semibold mb-1">Welcome back</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">Sign in to your DocFlow workspace.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@company.com" required className="w-full h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required className="w-full h-10 px-3 pr-10 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950 rounded-lg px-3 py-2">{error}</p>}

            <Button type="submit" loading={loading} className="w-full">Sign in</Button>
          </form>

          <p className="text-center text-xs text-neutral-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-neutral-900 dark:text-neutral-100 font-medium hover:underline">Sign up</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
