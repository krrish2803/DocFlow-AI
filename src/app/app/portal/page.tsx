'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, ExternalLink, CheckCircle, XCircle, AlertCircle, Plus, ArrowRight } from 'lucide-react';
import { useState } from 'react';

const demoDomains = [
  { domain: 'docs.acme.com', status: 'active', ssl: true, verified: true },
  { domain: 'help.acme.com', status: 'pending', ssl: false, verified: false },
];

export default function PortalPage() {
  const [domains] = useState(demoDomains);
  const [showAdd, setShowAdd] = useState(false);
  const [newDomain, setNewDomain] = useState('');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Hosting Portal</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Manage custom domains and site hosting for your documentation.</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}><Plus className="w-4 h-4" />{showAdd ? 'Cancel' : 'Add domain'}</Button>
      </div>

      {showAdd && (
        <Card>
          <h2 className="text-sm font-semibold mb-3">Add custom domain</h2>
          <p className="text-xs text-neutral-500 mb-4">Enter your domain name and add the following CNAME record:</p>
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3 mb-4 font-mono text-xs space-y-1">
            <p><span className="text-neutral-400">Type:</span> CNAME</p>
            <p><span className="text-neutral-400">Name:</span> @</p>
            <p><span className="text-neutral-400">Target:</span> <span className="text-blue-600 dark:text-blue-400">docs.docflow.ai</span></p>
            <p><span className="text-neutral-400">TTL:</span> 3600</p>
          </div>
          <div className="flex items-center gap-2">
            <input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="e.g. docs.yourcompany.com"
              className="flex-1 h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            />
            <Button size="sm" disabled={!newDomain.trim()}>Verify &amp; add</Button>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-sm font-semibold mb-4">Custom domains</h2>
        {domains.length === 0 ? (
          <p className="text-sm text-neutral-400 py-8 text-center">No custom domains configured. Add one above to get started.</p>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {domains.map((d) => (
              <div key={d.domain} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-neutral-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{d.domain}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                        d.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {d.status === 'active' ? <CheckCircle className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                        {d.status}
                      </span>
                      {d.ssl && (
                        <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5" /> SSL
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <a href={`https://${d.domain}`} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-3">Hosting status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Site status', value: 'Online', icon: CheckCircle, color: 'text-green-500' },
            { label: 'SSL certificate', value: 'Valid', icon: CheckCircle, color: 'text-green-500' },
            { label: 'CDN', value: 'Active', icon: CheckCircle, color: 'text-green-500' },
            { label: 'Storage used', value: '12 MB', icon: AlertCircle, color: 'text-amber-500' },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
              <s.icon className={`w-4 h-4 ${s.color} mb-1.5`} />
              <p className="text-lg font-semibold">{s.value}</p>
              <p className="text-[10px] text-neutral-400">{s.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
