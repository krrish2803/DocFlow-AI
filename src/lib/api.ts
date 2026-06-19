const BASE = '';

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export interface ApiUser {
  id: string;
  email: string;
  name: string | null;
}

export interface ApiWorkspace {
  id: string;
  name: string;
  slug: string;
}

export interface ApiSource {
  id: string;
  sourceType: string;
  label: string;
  status: string;
  lastSyncAt: string | null;
  contentVolume: number;
  repositoryUrl?: string;
  token?: string;
}

export interface ApiDoc {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  status: string;
  docType: string;
  version: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiJob {
  id: string;
  type: string;
  status: string;
  progress: number;
  message: string | null;
  resultDocumentId: string | null;
  createdAt: string;
}

export interface DashboardMetrics {
  healthScore: number;
  totalDocs: number;
  stalePages: number;
  pendingReviews: number;
  unansweredQuestions: number;
  publishedPages: number;
  recentSyncs: number;
  pendingJobs: number;
}

// Auth
export function signIn(email: string, password: string) {
  return fetcher<{ user: ApiUser; workspace: ApiWorkspace }>('/api/auth/signin', {
    method: 'POST', body: JSON.stringify({ email, password }),
  });
}

export function signUp(name: string, email: string, password: string, workspaceName?: string) {
  return fetcher<{ user: ApiUser; workspace: ApiWorkspace }>('/api/auth/signup', {
    method: 'POST', body: JSON.stringify({ name, email, password, workspaceName }),
  });
}

// Dashboard
export function fetchMetrics(workspaceId: string) {
  return fetcher<DashboardMetrics>(`/api/dashboard/metrics?workspaceId=${workspaceId}`);
}

export interface ActivityItem {
  id: string;
  type: string;
  label: string;
  status: string;
  link: string;
  timestamp: string;
}

export function fetchActivity(workspaceId: string) {
  return fetcher<ActivityItem[]>(`/api/dashboard/activity?workspaceId=${workspaceId}`);
}

// Sources
export function fetchSources(workspaceId: string) {
  return fetcher<ApiSource[]>(`/api/sources?workspaceId=${workspaceId}`);
}

export function createSource(data: { sourceType: string; label: string; repositoryUrl?: string; token?: string; workspaceId: string }) {
  return fetcher<ApiSource>('/api/sources', { method: 'POST', body: JSON.stringify(data) });
}

export function syncSource(id: string) {
  return fetcher<{ synced: number; total: number }>(`/api/sources/${id}/sync`, { method: 'POST' });
}

export function deleteSource(id: string) {
  return fetcher<{ ok: boolean }>(`/api/sources/${id}`, { method: 'DELETE' });
}

// Documents
export function fetchDocs(workspaceId: string) {
  return fetcher<ApiDoc[]>(`/api/documents?workspaceId=${workspaceId}`);
}

export function createDoc(data: { title: string; description?: string; docType?: string; content?: string; workspaceId: string }) {
  return fetcher<ApiDoc>('/api/documents', { method: 'POST', body: JSON.stringify(data) });
}

export function fetchDoc(id: string) {
  return fetcher<ApiDoc>(`/api/documents/${id}`);
}

export function updateDoc(id: string, data: { title?: string; description?: string; content?: string; status?: string; isPublished?: boolean; docType?: string }) {
  return fetcher<ApiDoc>(`/api/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteDoc(id: string) {
  return fetcher<{ ok: boolean }>(`/api/documents/${id}`, { method: 'DELETE' });
}

export interface DocumentVersion {
  id: string;
  version: number;
  title: string;
  content: string;
  description: string | null;
  createdAt: string;
}

export function fetchDocVersions(id: string) {
  return fetcher<DocumentVersion[]>(`/api/documents/${id}/versions`);
}

export interface WorkspaceSettings {
  name: string;
  slug: string;
  aiProvider: string;
  aiModel: string;
  hasApiKey: boolean;
}

// Settings
export function fetchSettings(workspaceId: string) {
  return fetcher<WorkspaceSettings>(`/api/settings?workspaceId=${workspaceId}`);
}

export function updateSettings(data: { workspaceId: string; aiApiKey?: string; aiModel?: string; name?: string }) {
  return fetcher<{ ok: boolean }>('/api/settings', { method: 'PUT', body: JSON.stringify(data) });
}

// Jobs
export function fetchJobs(workspaceId: string) {
  return fetcher<ApiJob[]>(`/api/jobs?workspaceId=${workspaceId}`);
}

export function fetchMe() {
  return fetcher<{ user: ApiUser; workspace: ApiWorkspace }>('/api/auth/me');
}

export function fetchJob(id: string) {
  return fetcher<ApiJob>(`/api/jobs?id=${id}`);
}

export interface WorkspaceMember {
  id: string; role: string; userId: string; email: string; name: string | null;
}

export function fetchMembers(workspaceId: string) {
  return fetcher<WorkspaceMember[]>(`/api/workspace/members?workspaceId=${workspaceId}`);
}

export function inviteMember(workspaceId: string, email: string) {
  return fetcher<WorkspaceMember>('/api/workspace/members', {
    method: 'POST', body: JSON.stringify({ workspaceId, email }),
  });
}

export function removeMember(membershipId: string, workspaceId: string) {
  return fetcher<{ ok: boolean }>(`/api/workspace/members?membershipId=${membershipId}&workspaceId=${workspaceId}`, { method: 'DELETE' });
}

export interface ApiKeyEntry {
  id: string; label: string; prefix: string; isRevoked: boolean;
  lastUsedAt: string | null; createdAt: string; expiresAt: string | null;
}

export function fetchApiKeys(workspaceId: string) {
  return fetcher<ApiKeyEntry[]>(`/api/workspace/api-keys?workspaceId=${workspaceId}`);
}

export function createApiKey(workspaceId: string, label: string, expiresInDays?: number) {
  return fetcher<{ prefix: string; key: string; label: string; expiresAt: string | null }>('/api/workspace/api-keys', {
    method: 'POST', body: JSON.stringify({ workspaceId, label, expiresInDays }),
  });
}

export function revokeApiKey(id: string) {
  return fetcher<{ ok: boolean }>(`/api/workspace/api-keys?id=${id}`, { method: 'DELETE' });
}

export function createJob(data: { type: string; message?: string; workspaceId: string }) {
  return fetcher<ApiJob>('/api/jobs', { method: 'POST', body: JSON.stringify(data) });
}

export interface SearchResult {
  documents: Array<{ id: string; title: string; status: string; updatedAt: string }>;
  files: Array<{ id: string; path: string; sourceId: string }>;
}

export function search(workspaceId: string, q: string) {
  return fetcher<SearchResult>(`/api/search?workspaceId=${workspaceId}&q=${encodeURIComponent(q)}`);
}

// Reviews
export interface ApiReview {
  id: string;
  documentId: string;
  documentTitle: string;
  reviewerName: string;
  reviewerId: string;
  status: string;
  comment: string | null;
  sectionIdx: number | null;
  createdAt: string;
}

export function fetchReviews(workspaceId: string) {
  return fetcher<ApiReview[]>(`/api/reviews?workspaceId=${workspaceId}`);
}

export function updateReview(id: string, data: { status: string; comment?: string }) {
  return fetcher<ApiReview>(`/api/reviews/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function assignReviewer(documentId: string, userId: string) {
  return fetcher<ApiReview>('/api/reviews', { method: 'POST', body: JSON.stringify({ documentId, userId }) });
}

// Document sources
export interface DocSourceLink {
  id: string;
  sourceId: string;
  sourceLabel: string;
  filePath: string;
  stale: boolean;
  lastCheckedAt: string;
}

export function fetchDocSources(documentId: string) {
  return fetcher<DocSourceLink[]>(`/api/documents/${documentId}/sources`);
}

// Job sources & diff
export interface JobSource {
  id: string;
  label: string;
  filePath: string;
}

export function fetchJobSources(jobId: string) {
  return fetcher<JobSource[]>(`/api/jobs/${jobId}/sources`);
}

export interface JobDiff {
  added: string[];
  removed: string[];
  hasChanges: boolean;
}

export function fetchJobDiff(jobId: string) {
  return fetcher<JobDiff>(`/api/jobs/${jobId}/diff`);
}

// Spec drift
export interface DriftEndpoint {
  path: string;
  method: string;
  documented: boolean;
  source: string;
}

export interface DriftResult {
  totalEndpoints: number;
  documentedCount: number;
  coveragePercent: number;
  endpoints: DriftEndpoint[];
}

export function fetchDriftResult(sourceId: string) {
  return fetcher<DriftResult>(`/api/sources/${sourceId}/drift`);
}

// Review Agent
export interface ReviewFile {
  path: string;
  summary: string;
  issues: string[];
  qualityRating: number;
  securityConcerns: string[];
  suggestions: string[];
}

export interface ReviewResult {
  overallScore: number;
  totalFiles: number;
  totalIssues: number;
  totalSecurityConcerns: number;
  files: ReviewFile[];
}

export function startReview(data: { sourceId: string; filePatterns: string[]; workspaceId: string }) {
  return fetcher<ReviewResult>('/api/agents/review', { method: 'POST', body: JSON.stringify(data) });
}

// Code Assistant
export interface CodeSuggestion {
  id: string;
  title: string;
  description: string;
  before: string;
  after: string;
  applied: boolean;
}

export interface AnalysisResult {
  summary: string;
  issues: string[];
  suggestions: CodeSuggestion[];
  metrics: { complexity: number; maintainability: number; testCoverage: number };
}

export function chatCodeAssistant(data: { message: string; sourceId: string; workspaceId: string }) {
  return fetcher<{ response: string }>('/api/agents/code-assistant', { method: 'POST', body: JSON.stringify(data) });
}

export function analyzeCode(data: { sourceId: string; workspaceId: string }) {
  return fetcher<AnalysisResult>('/api/agents/code-assistant/analyze', { method: 'POST', body: JSON.stringify(data) });
}
