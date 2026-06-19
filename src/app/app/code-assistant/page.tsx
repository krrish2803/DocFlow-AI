'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/toast';
import * as api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code, Send, Bot, User, FileText, Plus, Trash2, Clock,
  Play, ChevronRight, Lightbulb, AlertTriangle, CheckCircle2,
} from 'lucide-react';

const suggestions = [
  'Explain this function',
  'Find potential bugs',
  'Suggest improvements',
  'Review error handling',
  'Optimize performance',
  'Add type safety',
];

interface SourceFile {
  id: string;
  path: string;
  sourceId: string;
  sourceLabel: string;
}

interface CodeMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface CodeSuggestion {
  id: string;
  title: string;
  description: string;
  before: string;
  after: string;
  applied: boolean;
}

interface AnalysisResult {
  summary: string;
  issues: string[];
  suggestions: CodeSuggestion[];
  metrics: { complexity: number; maintainability: number; testCoverage: number };
}

export default function CodeAssistantPage() {
  const { workspace } = useAuth();
  const { toast } = useToast();
  const [sources, setSources] = useState<api.ApiSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [messages, setMessages] = useState<CodeMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!workspace) return;
    api.fetchSources(workspace.id).then((s) => {
      setSources(s);
      if (s.length > 0) setSelectedSource(s[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [workspace]);

  const handleSend = async () => {
    if (!input.trim() || sending || !workspace) return;
    const userMsg: CodeMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/agents/code-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          sourceId: selectedSource,
          workspaceId: workspace.id,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'No response',
        createdAt: new Date().toISOString(),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, something went wrong.',
        createdAt: new Date().toISOString(),
      }]);
    }
    setSending(false);
  };

  const handleAnalyze = async () => {
    if (!selectedSource || !workspace) return;
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await fetch('/api/agents/code-assistant/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: selectedSource,
          workspaceId: workspace.id,
        }),
      });
      const data = await res.json();
      setAnalysis(data);
    } catch {
      toast('Failed to analyze code', { variant: 'error' });
    }
    setAnalyzing(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-4">
      <div className="w-64 shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Source</h2>
        </div>
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 mb-4"
        >
          {sources.length === 0 && <option>No sources</option>}
          {sources.map((src) => (
            <option key={src.id} value={src.id}>{src.label}</option>
          ))}
        </select>

        <Button onClick={handleAnalyze} loading={analyzing} disabled={!selectedSource} className="w-full mb-4">
          <Play className="w-4 h-4" />Analyze Code
        </Button>

        {analysis && (
          <Card className="space-y-3">
            <h3 className="text-xs font-semibold">Analysis Summary</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">{analysis.summary}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Complexity</span>
                <span className="font-medium">{analysis.metrics.complexity}/10</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-neutral-500 rounded-full" style={{ width: `${analysis.metrics.complexity * 10}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Maintainability</span>
                <span className="font-medium">{analysis.metrics.maintainability}/10</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${analysis.metrics.maintainability * 10}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Test coverage</span>
                <span className="font-medium">{analysis.metrics.testCoverage}%</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${analysis.metrics.testCoverage}%` }} />
              </div>
            </div>

            {analysis.issues.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />Issues ({analysis.issues.length})
                </p>
                <ul className="space-y-1">
                  {analysis.issues.map((issue, i) => (
                    <li key={i} className="text-[11px] text-neutral-600 dark:text-neutral-400 flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-red-400 shrink-0 mt-1.5" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" />Suggestions ({analysis.suggestions.length})
                </p>
                {analysis.suggestions.map((sug) => (
                  <div key={sug.id} className="rounded-lg border border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50 dark:bg-neutral-800/50 p-3 space-y-2">
                    <p className="text-xs font-medium">{sug.title}</p>
                    <p className="text-[11px] text-neutral-500">{sug.description}</p>
                    {sug.before && (
                      <pre className="text-[10px] font-mono bg-neutral-100 dark:bg-neutral-900 rounded p-2 overflow-x-auto text-neutral-700 dark:text-neutral-300">{sug.before}</pre>
                    )}
                    {sug.after && (
                      <pre className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950 rounded p-2 overflow-x-auto text-emerald-700 dark:text-emerald-300">{sug.after}</pre>
                    )}
                    <Button size="sm" variant="secondary" className="w-full text-[11px]" onClick={() => toast('Fix applied (visual only)', { variant: 'success' })}>
                      <CheckCircle2 className="w-3 h-3" />Apply Fix
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="mb-4 flex items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Code className="w-5 h-5 text-neutral-500" />
              Code Assistant
            </h1>
            <p className="text-sm text-neutral-500 mt-0.5">Ask questions about your codebase. Get code-aware answers.</p>
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                  <Code className="w-6 h-6 text-neutral-400" />
                </div>
                <h3 className="text-sm font-semibold mb-1">Ask about your code</h3>
                <p className="text-xs text-neutral-400 max-w-xs mb-6">I answer based on your connected source code.</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => setInput(s)}
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >{s}</button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-neutral-500" />
                    </div>
                  )}
                  <div className={`max-w-[75%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                    <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300'}`}>
                      {msg.content.includes('```') ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                          {msg.content.split(/(```[\s\S]*?```)/g).map((part, i) => {
                            if (part.startsWith('```')) {
                              const code = part.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
                              return (
                                <pre key={i} className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-3 overflow-x-auto my-2 text-xs font-mono">
                                  <code>{code}</code>
                                </pre>
                              );
                            }
                            return <span key={i}>{part}</span>;
                          })}
                        </div>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{msg.content}</div>
                      )}
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-neutral-500" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {sending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"><Bot className="w-4 h-4 text-neutral-500" /></div>
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl px-4 py-3"><div className="flex gap-1">{[0, 150, 300].map((d) => <span key={d} className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div></div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your code..."
                className="flex-1 h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
              />
              <Button size="icon" onClick={handleSend} loading={sending} disabled={!input.trim()}><Send className="w-4 h-4" /></Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
