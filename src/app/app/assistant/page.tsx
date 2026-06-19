'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, FileText, Plus, MessageSquare, Trash2, Clock } from 'lucide-react';
import type { AssistantMessageItem } from '@/types';

const suggestions = ['What documents do I have?', 'Summarize my project', 'What files are in my sources?', 'Show me the README content'];

interface Conversation {
  id: string;
  title: string;
  lastMessage: string | null;
  messageCount: number;
  updatedAt: string;
}

interface ConversationMessage {
  id: string;
  role: string;
  content: string;
  citations: string | null;
  createdAt: string;
}

export default function AssistantPage() {
  const { user, workspace } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessageItem[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!workspace || !user) return;
    fetchConversations();
  }, [workspace, user]);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  const fetchConversations = async () => {
    if (!workspace || !user) return;
    try {
      const res = await fetch(`/api/conversations?workspaceId=${workspace.id}&userId=${user.id}`);
      const data = await res.json();
      setConversations(data);
    } catch {}
    setLoadingConversations(false);
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      const data: ConversationMessage[] = await res.json();
      setMessages(data.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        citations: m.citations ? JSON.parse(m.citations) : [],
        createdAt: m.createdAt,
      })));
    } catch {}
  };

  const createConversation = async () => {
    if (!workspace || !user) return;
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: workspace.id, userId: user.id }),
      });
      const data = await res.json();
      setConversations((prev) => [{ ...data, lastMessage: null, messageCount: 0 }, ...prev]);
      setActiveConversationId(data.id);
    } catch {}
  };

  const deleteConversation = async (id: string) => {
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) setActiveConversationId(null);
    } catch {}
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !workspace) return;
    const userMsg: AssistantMessageItem = { id: `msg-${Date.now()}`, role: 'user', content: input, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    let conversationId = activeConversationId;

    if (!conversationId) {
      try {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId: workspace.id, userId: user?.id, title: input.slice(0, 50) }),
        });
        const data = await res.json();
        conversationId = data.id;
        setActiveConversationId(data.id);
        setConversations((prev) => [{ ...data, lastMessage: null, messageCount: 0 }, ...prev]);
      } catch {}
    }

    try {
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: input }),
      });

      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, workspaceId: workspace.id }),
      });
      const data = await res.json();
      const response: AssistantMessageItem = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'No response',
        citations: data.citations || [],
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, response]);

      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'assistant', content: response.content, citations: response.citations }),
      });

      setConversations((prev) => prev.map((c) =>
        c.id === conversationId ? { ...c, lastMessage: response.content.slice(0, 100), messageCount: c.messageCount + 2, updatedAt: new Date().toISOString() } : c
      ));
    } catch {
      setMessages((prev) => [...prev, {
        id: `msg-${Date.now()}`, role: 'assistant', content: 'Sorry, something went wrong.', createdAt: new Date().toISOString(),
      }]);
    }
    setSending(false);
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-4">
      {showSidebar && (
        <div className="w-64 shrink-0 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Conversations</h2>
            <Button size="sm" onClick={createConversation}><Plus className="w-3.5 h-3.5" /></Button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {loadingConversations ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
              ))}</div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs text-neutral-400">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                    activeConversationId === conv.id
                      ? 'bg-neutral-100 dark:bg-neutral-800'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conv.title}</p>
                      {conv.lastMessage && (
                        <p className="text-xs text-neutral-400 truncate mt-0.5">{conv.lastMessage}</p>
                      )}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-neutral-400">{conv.messageCount} msgs</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <div className="mb-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)}>
            <MessageSquare className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Docs assistant</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Ask questions about your documentation. Answers cite their sources.</p>
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                  <Bot className="w-6 h-6 text-neutral-400" />
                </div>
                <h3 className="text-sm font-semibold mb-1">Ask me anything about your docs</h3>
                <p className="text-xs text-neutral-400 max-w-xs mb-6">I answer based on your published and reviewed documentation.</p>
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
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{msg.content}</div>
                    </div>
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.citations.map((cit: { sourceTitle: string; sourceType: string; excerpt: string }, i: number) => (
                          <button key={`${msg.id}-cit-${i}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-500">
                            <FileText className="w-3 h-3" />{cit.sourceTitle}
                          </button>
                        ))}
                      </div>
                    )}
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
                placeholder="Ask a question..."
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
