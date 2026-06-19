export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
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

export interface SourceItem {
  id: string;
  sourceType: string;
  label: string;
  status: string;
  lastSyncAt: string | null;
  contentVolume: number;
}

export interface DocItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: string;
  docType: string;
  version: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobItem {
  id: string;
  type: string;
  status: string;
  progress: number;
  message: string | null;
  createdAt: string;
}

export interface CitationItem {
  id: string;
  sourceTitle: string;
  sourceUrl: string | null;
  sourceType: string;
  excerpt: string;
}

export interface AssistantMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: CitationItem[];
  createdAt: string;
}

export interface AnalyticsData {
  mostViewed: { title: string; views: number }[];
  topQueries: { query: string; count: number }[];
  stalePages: { title: string; daysSinceUpdate: number }[];
  recentUpdates: { title: string; updatedAt: string }[];
  publishingCadence: { month: string; count: number }[];
  healthTrend: { date: string; score: number }[];
}
