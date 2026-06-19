'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import * as api from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/components/ui/toast';
import {
  Key, LogOut, CheckCircle2, Eye, EyeOff, Sun, Moon, Monitor, Edit3, Users, UserPlus, X,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, workspace, signOut, loading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [settings, setSettings] = useState<api.WorkspaceSettings | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('meta/llama-3.1-8b-instruct');
  const [wsName, setWsName] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [members, setMembers] = useState<api.WorkspaceMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [apiKeys, setApiKeys] = useState<api.ApiKeyEntry[]>([]);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const loadMembers = () => {
    if (!workspace) return;
    api.fetchMembers(workspace.id).then(setMembers).catch(() => {});
  };

  useEffect(() => {
    if (!workspace) return;
    api.fetchSettings(workspace.id).then((s) => {
      setSettings(s);
      setModel(s.aiModel);
      setWsName(s.name);
    }).catch(() => toast('Failed to load settings', { variant: 'error' }));
    loadMembers();
    api.fetchApiKeys(workspace.id).then(setApiKeys).catch(() => {});
  }, [workspace]);

  const handleSave = async () => {
    if (!workspace) return;
    setSaving(true);
    try {
      await api.updateSettings({
        workspaceId: workspace.id,
        aiApiKey: apiKey || undefined,
        aiModel: model,
        name: wsName || undefined,
      });
      setSettings((prev) => prev ? { ...prev, hasApiKey: !!apiKey, aiModel: model, name: wsName } : prev);
      toast('Settings saved', { variant: 'success' });
    } catch {
      toast('Failed to save settings', { variant: 'error' });
    }
    setSaving(false);
  };

  const handleInvite = async () => {
    if (!workspace || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      await api.inviteMember(workspace.id, inviteEmail.trim());
      toast('Member invited', { variant: 'success' });
      setInviteEmail('');
      loadMembers();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to invite member', { variant: 'error' });
    }
    setInviting(false);
  };

  const handleCreateKey = async () => {
    if (!workspace || !newKeyLabel.trim()) return;
    setCreatingKey(true);
    setNewKeyValue(null);
    try {
      const result = await api.createApiKey(workspace.id, newKeyLabel.trim());
      setNewKeyValue(result.key);
      toast('API key created — copy it now, it won\'t be shown again', { variant: 'success' });
      setNewKeyLabel('');
      api.fetchApiKeys(workspace.id).then(setApiKeys).catch(() => {});
    } catch {
      toast('Failed to create API key', { variant: 'error' });
    }
    setCreatingKey(false);
  };

  const handleRevokeKey = async (id: string, label: string) => {
    if (!confirm(`Revoke "${label}"? This cannot be undone.`)) return;
    try {
      await api.revokeApiKey(id);
      toast('API key revoked', { variant: 'success' });
      setApiKeys((prev) => prev.map((k) => k.id === id ? { ...k, isRevoked: true } : k));
    } catch {
      toast('Failed to revoke key', { variant: 'error' });
    }
  };

  const handleRemoveMember = async (membershipId: string, name: string | null) => {
    if (!workspace || !confirm(`Remove ${name || 'this member'} from the workspace?`)) return;
    try {
      await api.removeMember(membershipId, workspace.id);
      toast('Member removed', { variant: 'success' });
      loadMembers();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to remove member', { variant: 'error' });
    }
  };

  if (authLoading) return null;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Manage your workspace configuration.</p>
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <Edit3 className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Workspace</h3>
            <p className="text-xs text-neutral-400">Your workspace name and identifier.</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Workspace name</label>
            <input value={wsName} onChange={(e) => setWsName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400" />
          </div>
          {settings?.slug && (
            <p className="text-[11px] text-neutral-400">Slug: <span className="font-mono">{settings.slug}</span></p>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <Key className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium">NVIDIA AI Provider</h3>
            <p className="text-xs text-neutral-400">Connect your NVIDIA API key for AI-powered documentation generation.</p>
          </div>
          <Badge status={settings?.hasApiKey ? 'connected' : 'disconnected'} className="ml-auto" />
        </div>

        {settings?.hasApiKey && (
          <div className="flex items-center gap-2 mb-4 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            API key configured
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">NVIDIA API Key</label>
            <div className="relative">
              <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                placeholder={settings?.hasApiKey ? 'Enter new key to replace existing one' : 'nvapi-...'}
                className="w-full h-10 px-3 pr-10 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 font-mono text-xs" />
              <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Get a free key at <span className="font-mono">build.nvidia.com</span></p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">AI Model</label>
            <select value={model} onChange={(e) => setModel(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            >
              <option value="meta/llama-3.1-8b-instruct">Llama 3.1 8B (fast, free tier)</option>
              <option value="meta/llama-3.1-70b-instruct">Llama 3.1 70B (higher quality)</option>
              <option value="meta/llama-3.1-405b-instruct">Llama 3.1 405B (best quality)</option>
              <option value="mistralai/mistral-7b-instruct-v0.3">Mistral 7B</option>
              <option value="mistralai/mixtral-8x22b-instruct-v0.1">Mixtral 8x22B</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button onClick={handleSave} loading={saving}>Save settings</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" /> :
             theme === 'light' ? <Sun className="w-5 h-5 text-neutral-600 dark:text-neutral-400" /> :
             <Monitor className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />}
          </div>
          <div>
            <h3 className="text-sm font-medium">Appearance</h3>
            <p className="text-xs text-neutral-400">Choose your theme preference.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button key={t} onClick={() => setTheme(t)}
              className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border text-sm transition-all ${
                theme === t
                  ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              {t === 'light' ? <Sun className="w-4 h-4" /> : t === 'dark' ? <Moon className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <Key className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium">API keys</h3>
            <p className="text-xs text-neutral-400">Keys for programmatic access to your documentation.</p>
          </div>
        </div>

        {newKeyValue && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">New key created</p>
            <code className="block text-xs bg-amber-100 dark:bg-amber-900 p-2 rounded font-mono break-all select-all">{newKeyValue}</code>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">Copy this now. You won&apos;t be able to see it again.</p>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <input value={newKeyLabel} onChange={(e) => setNewKeyLabel(e.target.value)}
            placeholder="Key label (e.g. CI pipeline)..."
            className="flex-1 h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
          />
          <Button size="sm" onClick={handleCreateKey} loading={creatingKey} disabled={!newKeyLabel.trim()}>
            Create key
          </Button>
        </div>

        {apiKeys.length > 0 && (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {apiKeys.map((k) => (
              <div key={k.id} className="flex items-center justify-between py-2.5">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${k.isRevoked ? 'line-through text-neutral-400' : ''}`}>{k.label}</p>
                  <p className="text-xs text-neutral-400 font-mono">{k.prefix}...{k.isRevoked && '(revoked)'}</p>
                </div>
                {!k.isRevoked && (
                  <button onClick={() => handleRevokeKey(k.id, k.label)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 transition-all">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <Users className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Team members</h3>
            <p className="text-xs text-neutral-400">Manage who has access to this workspace.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Email address to invite..."
            className="flex-1 h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
          />
          <Button size="sm" onClick={handleInvite} loading={inviting} disabled={!inviteEmail.trim()}>
            <UserPlus className="w-3.5 h-3.5" />Invite
          </Button>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                  <span className="text-xs font-medium text-neutral-500">
                    {(m.name || m.email)[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{m.name || 'Unknown'}</p>
                  <p className="text-xs text-neutral-400 truncate">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge status={m.role === 'OWNER' ? 'published' : 'connected'} />
                {m.role !== 'OWNER' && (
                  <button onClick={() => handleRemoveMember(m.id, m.name)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 transition-all">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-dashed">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">{user?.name || 'User'}</h3>
            <p className="text-xs text-neutral-400">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge status="connected" />
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="w-4 h-4" />Sign out</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
