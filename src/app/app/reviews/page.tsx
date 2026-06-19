'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/toast';
import * as api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  MessageSquare, CheckCircle2, XCircle, UserPlus,
  FileText, ChevronDown, Filter,
} from 'lucide-react';

type Review = api.ApiReview;

export default function ReviewsPage() {
  const { workspace, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<api.WorkspaceMember[]>([]);
  const [showAssignFor, setShowAssignFor] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadReviews = useCallback(() => {
    if (!workspace) return;
    api.fetchReviews(workspace.id).then((r) => { setReviews(r); setLoading(false); }).catch(() => setLoading(false));
  }, [workspace]);

  useEffect(() => {
    if (authLoading) return;
    if (!workspace) { setLoading(false); return; }
    loadReviews();
    api.fetchMembers(workspace.id).then(setMembers).catch(() => {});
  }, [workspace, authLoading, loadReviews]);

  const handleAction = async (reviewId: string, status: string, comment?: string) => {
    setProcessingId(reviewId);
    try {
      await api.updateReview(reviewId, { status, comment });
      toast(status === 'APPROVED' ? 'Review approved' : 'Review rejected', { variant: status === 'APPROVED' ? 'success' : 'info' });
      loadReviews();
    } catch {
      toast('Failed to update review', { variant: 'error' });
    }
    setProcessingId(null);
  };

  const handleAssign = async (documentId: string, userId: string) => {
    try {
      await api.assignReviewer(documentId, userId);
      toast('Reviewer assigned', { variant: 'success' });
      setShowAssignFor(null);
      loadReviews();
    } catch {
      toast('Failed to assign reviewer', { variant: 'error' });
    }
  };

  const pending = reviews.filter((r) => r.status === 'NEEDS_REVIEW' || r.status === 'PENDING');
  const sectionReviews = pending.filter((r) => r.sectionIdx !== null);
  const docReviews = pending.filter((r) => r.sectionIdx === null);
  const resolved = reviews.filter((r) => r.status === 'APPROVED' || r.status === 'REJECTED');

  if (loading || authLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Review Queue</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {pending.length} pending review{pending.length !== 1 ? 's' : ''} across workspace documents.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Filter className="w-3.5 h-3.5" />
          {resolved.length} resolved
        </div>
      </div>

      {pending.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold mb-1">All caught up</h3>
          <p className="text-xs text-neutral-400">No pending reviews in this workspace.</p>
        </Card>
      ) : (
        <>
          {sectionReviews.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Section Reviews</h2>
              {sectionReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  processingId={processingId}
                  onAction={handleAction}
                  onAssign={handleAssign}
                  showAssignFor={showAssignFor}
                  setShowAssignFor={setShowAssignFor}
                  members={members}
                />
              ))}
            </div>
          )}

          {docReviews.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Document Reviews</h2>
              {docReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  processingId={processingId}
                  onAction={handleAction}
                  onAssign={handleAssign}
                  showAssignFor={showAssignFor}
                  setShowAssignFor={setShowAssignFor}
                  members={members}
                />
              ))}
            </div>
          )}
        </>
      )}

      {resolved.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Recently Resolved</h2>
          {resolved.slice(0, 10).map((review) => (
            <motion.div key={review.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-4 flex items-center justify-between gap-4 opacity-60">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{review.documentTitle}</p>
                    <p className="text-xs text-neutral-400">{review.reviewerName} &middot; {formatDate(review.createdAt)}</p>
                  </div>
                </div>
                <Badge status={review.status} />
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewCard({
  review, processingId, onAction, onAssign, showAssignFor, setShowAssignFor, members,
}: {
  review: Review;
  processingId: string | null;
  onAction: (id: string, status: string, comment?: string) => void;
  onAssign: (docId: string, userId: string) => void;
  showAssignFor: string | null;
  setShowAssignFor: (id: string | null) => void;
  members: api.WorkspaceMember[];
}) {
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const isProcessing = processingId === review.id;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <FileText className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium">{review.documentTitle}</p>
                {review.sectionIdx !== null && (
                  <span className="text-[10px] text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded px-1.5 py-0.5">
                    Section #{review.sectionIdx + 1}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Reviewer: {review.reviewerName} &middot; {formatDate(review.createdAt)}
              </p>
              {review.comment && (
                <div className="mt-2 flex items-start gap-1.5 text-xs text-neutral-500 bg-neutral-50 dark:bg-neutral-800/30 rounded-lg px-2.5 py-2">
                  <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                  {review.comment}
                </div>
              )}
            </div>
          </div>
          <Badge status={review.status} />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            loading={isProcessing}
            onClick={() => onAction(review.id, 'APPROVED')}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            loading={isProcessing}
            onClick={() => {
              if (showComment) {
                onAction(review.id, 'REJECTED', comment || undefined);
                setComment('');
                setShowComment(false);
              } else {
                setShowComment(true);
              }
            }}
          >
            <XCircle className="w-3.5 h-3.5" />Reject
          </Button>
          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAssignFor(showAssignFor === review.id ? null : review.id)}
            >
              <UserPlus className="w-3.5 h-3.5" />Assign
              <ChevronDown className="w-3 h-3" />
            </Button>
            {showAssignFor === review.id && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-20 py-1">
                {members.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-neutral-400">No members found</p>
                ) : (
                  members.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onAssign(review.documentId, m.userId)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2"
                    >
                      <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[9px] font-medium">
                        {(m.name || m.email)?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="truncate">{m.name || m.email}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {showComment && (
          <div className="flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Rejection reason..."
              className="flex-1 h-9 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={() => { setShowComment(false); setComment(''); }}>Cancel</Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
