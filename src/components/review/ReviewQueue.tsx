import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { ConfirmDialog } from '../common/ConfirmDialog';
import type { AuditHistoryItem, AuditResult } from '@/types';

interface ReviewQueueProps {
  sessionId: string;
  onSelectReview: (audit: AuditResult) => void;
}

export function ReviewQueue({ sessionId, onSelectReview }: ReviewQueueProps) {
  const [audits, setAudits] = useState<AuditHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });

  useEffect(() => {
    loadAudits();
  }, [sessionId]);

  const loadAudits = async () => {
    setLoading(true);
    try {
      const response = await api.getSessionAudits(sessionId);
      if (response.ok && response.data) {
        setAudits(response.data);
        if (response.data.length > 0 && !selectedId) {
          const firstAudit = response.data[0];
          setSelectedId(firstAudit.id);
          onSelectReview(firstAudit.auditResult);
        }
      }
    } catch (error) {
      console.error('Failed to load audits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (audit: AuditHistoryItem) => {
    setSelectedId(audit.id);
    onSelectReview(audit.auditResult);
  };

  const handleDeleteClick = (auditId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({ show: true, id: auditId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;

    try {
      await api.deleteAudit(deleteConfirm.id);
      if (selectedId === deleteConfirm.id) {
        setSelectedId(null);
      }
      await loadAudits();
    } catch (error) {
      console.error('Failed to delete audit:', error);
    } finally {
      setDeleteConfirm({ show: false, id: null });
    }
  };

  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'APROBADO':
        return 'bg-green-500 text-white';
      case 'RECHAZADO':
        return 'bg-red-500 text-white';
      default:
        return 'bg-yellow-500 text-gray-900';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400 dark:text-gray-500">
        <div className="text-center">
          <div className="animate-spin text-3xl mb-2">⏳</div>
          <p className="text-sm dark:text-gray-400">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (audits.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 dark:text-gray-500">
        <div className="text-5xl mb-3">📋</div>
        <p className="font-semibold text-gray-600 dark:text-gray-300">No Reviews Yet</p>
        <p className="text-sm dark:text-gray-400 mt-1">Upload assets and run your first review</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
        Review History ({audits.length})
      </h3>
      {audits.map((audit) => {
        const isSelected = selectedId === audit.id;
        const verdictStyle = getVerdictStyle(audit.auditResult.overall_verdict);

        return (
          <div
            key={audit.id}
            onClick={() => handleSelect(audit)}
            className={`
              p-3 rounded-lg cursor-pointer transition-all border-2
              ${isSelected
                ? 'border-brand-500 dark:border-brand-600 bg-brand-50 dark:bg-brand-900/30 shadow-md'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-brand-300 dark:hover:border-brand-500 hover:shadow'
              }
            `}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">
                  {new Date(audit.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${verdictStyle}`}>
                    {audit.auditResult.overall_verdict}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {audit.auditResult.overall_score}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteClick(audit.id, e)}
                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                title="Delete review"
              >
                🗑️
              </button>
            </div>
            <div className="text-xs text-gray-600">
              {audit.assetsCount} {audit.assetsCount === 1 ? 'asset' : 'assets'} reviewed
            </div>
          </div>
        );
      })}
    </div>
    
    <ConfirmDialog
      isOpen={deleteConfirm.show}
      title="Delete Review"
      message="Are you sure you want to delete this review from history? This action cannot be undone."
      confirmText="Delete"
      cancelText="Cancel"
      danger
      onConfirm={confirmDelete}
      onCancel={() => setDeleteConfirm({ show: false, id: null })}
    />
    </>
  );
}

