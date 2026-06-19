'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown, FileText, GitBranch, Sparkles, BookOpen, Search, Shield, BarChart3, ArrowRight, Check, Star } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

const features = [
  { icon: GitBranch, title: 'Connect any source', desc: 'Sync GitHub repos, OpenAPI specs, support conversations, and changelogs — all in one workspace.' },
  { icon: Sparkles, title: 'AI-powered generation', desc: 'Generate READMEs, API references, changelogs, and help center articles from your connected sources.' },
  { icon: Search, title: 'Change detection', desc: 'We automatically detect code and content changes that need documentation updates — before users notice.' },
  { icon: Shield, title: 'Review with citations', desc: 'Every AI suggestion includes source citations. Accept or reject at the section level with full version history.' },
  { icon: BookOpen, title: 'Publish instantly', desc: 'Deploy a hosted docs portal with custom domains, versioning, and full-text search — in one click.' },
  { icon: BarChart3, title: 'Track content health', desc: 'Monitor stale pages, unanswered questions, and documentation coverage across your workspace.' },
];

const howItWorks = [
  { step: '01', title: 'Connect sources', desc: 'Link your GitHub repositories, OpenAPI specs, and support channels.' },
  { step: '02', title: 'AI generates drafts', desc: 'Our engine analyzes your sources and creates documentation drafts with source citations.' },
  { step: '03', title: 'Review and approve', desc: 'Accept, reject, or edit AI suggestions at the section level. Keep what works, revise what doesn\'t.' },
  { step: '04', title: 'Publish and serve', desc: 'Deploy to your docs portal and let your team and users ask questions with cited answers.' },
];

const pricing = [
  { name: 'Starter', price: '$29', desc: 'For small teams', features: ['Up to 3 sources', '50 AI generations/mo', '1 docs site', 'Basic analytics'], cta: 'Start free trial' },
  { name: 'Pro', price: '$99', desc: 'For growing teams', features: ['Up to 10 sources', '500 AI generations/mo', 'Custom domain', 'Team collaboration', 'Advanced analytics'], cta: 'Start free trial', popular: true },
  { name: 'Enterprise', price: '$299', desc: 'For organizations', features: ['Unlimited sources', 'Unlimited generations', 'SSO', 'API access', 'Priority support', 'Dedicated onboarding'], cta: 'Contact sales' },
];

const faqs = [
  { q: 'How does DocFlow detect documentation-impacting changes?', a: 'DocFlow analyzes your connected sources — GitHub commits, PR diffs, and OpenAPI spec changes — and compares them against your documentation. When endpoints, parameters, or workflows change, it flags those sections as needing updates.' },
  { q: 'Can I customize the AI generation style?', a: 'Yes. Choose from presets like concise technical, developer-friendly, onboarding-focused, or internal team docs. You can also fine-tune the tone in workspace settings.' },
  { q: 'How does the AI assistant work?', a: 'The assistant uses retrieval-augmented generation over your indexed documentation. It only answers from approved sources and always cites the specific pages or sections used.' },
  { q: 'What sources can I connect?', a: 'GitHub repositories, OpenAPI/Swagger specs, Markdown files, Intercom/Zendesk support conversations, changelog feeds, and internal notes. More integrations are in development.' },
  { q: 'Is human review required before publishing?', a: 'Yes. Every AI-generated draft goes through a review workflow. You must approve each section before it can be published. This ensures accuracy and quality control.' },
  { q: 'Can I self-host DocFlow?', a: 'Self-hosting is available on the Enterprise plan. The cloud version is fully managed with SOC 2 compliance.' },
  { q: 'How long does setup take?', a: 'Most teams are up and running in under 10 minutes. Connect your first source, generate draft docs, and publish — all in the first session.' },
  { q: 'Do you offer discounts for startups?', a: 'Yes, we offer a Startup program for early-stage companies. Contact our sales team for details.' },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'Head of Developer Experience, Vercel', text: 'DocFlow cut our documentation maintenance time by 80%. The change detection is incredibly accurate.' },
  { name: 'Marcus Johnson', role: 'CTO, Stellate', text: 'We ship API updates every week. DocFlow keeps our docs in sync without anyone manually editing markdown files.' },
];

const previewTabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'sources', label: 'Sources' },
  { id: 'editor', label: 'Editor' },
  { id: 'assistant', label: 'Assistant' },
];

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activePreview, setActivePreview] = useState('dashboard');
  const { user } = useAuth();

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <div className="bg-white dark:bg-neutral-950">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-100/80 dark:border-neutral-800/80 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center">
              <FileText className="w-4 h-4 text-white dark:text-neutral-900" />
            </div>
            <span className="font-semibold text-base tracking-tight">DocFlow</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link href="/app/dashboard">
                <Button variant="primary" size="sm">Go to dashboard <ArrowRight className="w-3.5 h-3.5" /></Button>
              </Link>
            ) : (
              <>
                <Link href="/signin"><Button variant="ghost" size="sm">Sign in</Button></Link>
                <Link href="/signup"><Button size="sm">Start free <ArrowRight className="w-3.5 h-3.5" /></Button></Link>
              </>
            )}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 md:hidden bg-white dark:bg-neutral-950 pt-16">
            <div className="p-6 space-y-4">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block text-lg text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100">
                  {l.label}
                </a>
              ))}
              <hr className="border-neutral-100 dark:border-neutral-800" />
              {user ? (
                <Link href="/app/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Go to dashboard</Button>
                </Link>
              ) : (
                <div className="space-y-3 pt-2">
                  <Link href="/signin" onClick={() => setMobileOpen(false)}><Button variant="secondary" className="w-full">Sign in</Button></Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)}><Button className="w-full">Start free <ArrowRight className="w-4 h-4" /></Button></Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="pt-36 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-6">
              AI-powered documentation platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-5">
              Keep docs synced with{' '}
              <span className="text-neutral-400 dark:text-neutral-500">product change</span>
            </h1>
            <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              Turn commits, PRs, and specs into publish-ready docs. Catch stale pages before customers do.
              Answer questions with cited sources.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto text-base px-8">
                  Start free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8">
                  Book demo
                </Button>
              </a>
            </div>
            <p className="text-xs text-neutral-400 mt-4">No credit card required. Free plan includes 50 AI generations.</p>
          </motion.div>

          {/* Stats row */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex flex-wrap justify-center gap-8 mt-12 text-center">
            {[
              { value: '10,000+', label: 'Docs generated' },
              { value: '500+', label: 'Teams using DocFlow' },
              { value: '94%', label: 'Time saved on docs' },
              { value: '4.9★', label: 'Average rating' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Animated product preview */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="mt-16 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-xl bg-white dark:bg-neutral-900">
            <div className="flex items-center gap-1 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
              {previewTabs.map((t) => (
                <button key={t.id} onClick={() => setActivePreview(t.id)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activePreview === t.id ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="p-5 sm:p-8">
              <AnimatePresence mode="wait">
                {activePreview === 'dashboard' && (
                  <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <div className="grid grid-cols-4 gap-3">
                      {['Total docs', 'Health score', 'Stale pages', 'Pending reviews'].map((m) => (
                        <div key={m} className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                          <p className="text-[10px] text-neutral-400">{m}</p>
                          <p className="text-lg font-semibold mt-0.5">18</p>
                        </div>
                      ))}
                    </div>
                    <div className="h-32 rounded-lg bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-xs text-neutral-400">
                      Activity feed preview
                    </div>
                  </motion.div>
                )}
                {activePreview === 'sources' && (
                  <motion.div key="sources" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-3">
                    {['GitHub: acme-api', 'OpenAPI v2', 'Product Docs', 'Intercom Inbox'].map((s) => (
                      <div key={s} className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                        <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-xs font-medium">{s}</span></div>
                        <p className="text-[10px] text-neutral-400">Synced • 45 files</p>
                      </div>
                    ))}
                  </motion.div>
                )}
                {activePreview === 'editor' && (
                  <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="h-4 w-1/3 rounded bg-neutral-200 dark:bg-neutral-700" />
                        <div className="h-3 w-full rounded bg-neutral-100 dark:bg-neutral-800" />
                        <div className="h-3 w-4/5 rounded bg-neutral-100 dark:bg-neutral-800" />
                        <div className="h-3 w-3/4 rounded bg-neutral-100 dark:bg-neutral-800" />
                      </div>
                      <div className="w-1/3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                        <p className="text-[10px] text-neutral-400 mb-2">AI suggestions</p>
                        <div className="h-3 w-full rounded bg-neutral-200 dark:bg-neutral-700 mb-2" />
                        <div className="h-3 w-4/5 rounded bg-neutral-200 dark:bg-neutral-700" />
                      </div>
                    </div>
                  </motion.div>
                )}
                {activePreview === 'assistant' && (
                  <motion.div key="assistant" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    <div className="flex gap-2"><div className="flex-1 p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs">How do I reset my API key?</div></div>
                    <div className="flex gap-2"><div className="flex-1 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 text-xs border border-neutral-100 dark:border-neutral-700">You can reset your key from the Acme Console. <span className="text-neutral-400">[source]</span></div></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 border-y border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-8 mb-8 opacity-40">
            {['Vercel', 'Linear', 'Stripe', 'Notion', 'Railway'].map((name) => (
              <span key={name} className="text-sm font-semibold text-neutral-400 dark:text-neutral-500">{name}</span>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {testimonials.map((t) => (
              <div key={t.name} className="text-center">
                <div className="flex justify-center gap-0.5 mb-2">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-neutral-900 dark:fill-neutral-100 text-neutral-900 dark:text-neutral-100" />)}</div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 italic mb-2">"{t.text}"</p>
                <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100">{t.name}</p>
                <p className="text-[11px] text-neutral-400">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Documentation debt slows every team down</h2>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stale docs, missing release notes, and unanswered support questions erode trust and waste engineering time.
            Most teams either don't document or can't keep up with the pace of product change.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left">
            {[
              { stat: '60%', label: 'of teams say their docs are outdated' },
              { stat: '23h', label: 'per week spent manually updating docs' },
              { stat: '3x', label: 'more support tickets when docs are stale' },
            ].map((p) => (
              <div key={p.stat} className="p-5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                <p className="text-3xl font-bold mb-1">{p.stat}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{p.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-50/50 dark:bg-neutral-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Everything you need to ship great docs</h2>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">A documentation operating system for modern product teams.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="p-6 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                <f.icon className="w-5 h-5 text-neutral-700 dark:text-neutral-300 mb-4" />
                <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">How it works</h2>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">From source code to published docs in four steps.</p>
          </div>
          <div className="grid sm:grid-cols-4 gap-6">
            {howItWorks.map((s, i) => (
              <motion.div key={s.step} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="text-4xl font-bold text-neutral-200 dark:text-neutral-700 mb-3">{s.step}</div>
                <h3 className="font-semibold mb-1.5">{s.title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-50/50 dark:bg-neutral-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Simple, transparent pricing</h2>
            <p className="text-neutral-500 dark:text-neutral-400">Start free. Upgrade as you grow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {pricing.map((plan) => (
              <div key={plan.name} className={`relative p-6 rounded-xl border ${plan.popular ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-900' : 'border-neutral-200/60 dark:border-neutral-800/60'} flex flex-col`}>
                {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] font-semibold">Most popular</span>}
                <h3 className="font-semibold mb-1">{plan.name}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">{plan.desc}</p>
                <p className="text-3xl font-bold mb-6">{plan.price}<span className="text-sm font-normal text-neutral-400">/mo</span></p>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button variant={plan.popular ? 'primary' : 'outline'} className="w-full">{plan.cta}</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-2">
            {faqs.map((faq) => (
              <details key={faq.q} className="group p-4 rounded-lg border border-neutral-100 dark:border-neutral-800 open:bg-neutral-50 dark:open:bg-neutral-900 transition-colors">
                <summary className="cursor-pointer text-sm font-medium flex items-center justify-between gap-4">
                  {faq.q}
                  <ChevronDown className="w-4 h-4 shrink-0 text-neutral-400 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ship documentation at the speed of releases</h2>
          <p className="text-lg text-neutral-400 dark:text-neutral-500 mb-8 max-w-xl mx-auto">Join 500+ teams that use DocFlow to keep their docs in sync with product change.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-neutral-900 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 text-base px-8">
                Start free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 dark:border-neutral-300 dark:text-neutral-700 dark:hover:bg-neutral-200 text-base px-8">
                Book demo
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-neutral-100 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-neutral-900 dark:bg-white flex items-center justify-center">
              <FileText className="w-3 h-3 text-white dark:text-neutral-900" />
            </div>
            <span className="text-sm font-medium">DocFlow AI</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-neutral-400">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <span>Privacy</span>
            <span>Terms</span>
            <span>&copy; 2026 DocFlow AI, Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
