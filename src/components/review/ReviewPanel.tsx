import React, { useState, useEffect } from 'react';
import { useApp } from '@/store/AppContext';
import { api } from '@/services/api';
import { FileUpload } from '../brand/FileUpload';
import { ReviewQueue } from './ReviewQueue';
import { AuditResultCard } from '../brand/AuditResultCard';
import type { FileData, AuditResult } from '@/types';
import type { ReviewJob } from '@/types/review';

export function ReviewPanel() {
  const { currentSession } = useApp();
  const [reviewAssets, setReviewAssets] = useState<FileData[]>([]);
  const [currentAudit, setCurrentAudit] = useState<AuditResult | null>(null);
  const [runningReviews, setRunningReviews] = useState<ReviewJob[]>([]);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Load last audit when session changes
  useEffect(() => {
    if (currentSession) {
      loadLastAudit();
    } else {
      setCurrentAudit(null);
    }
  }, [currentSession]);

  const loadLastAudit = async () => {
    if (!currentSession) return;
    
    try {
      const response = await api.getSessionAudits(currentSession.id);
      if (response.ok && response.data && response.data.length > 0) {
        setCurrentAudit(response.data[0].auditResult);
      }
    } catch (err) {
      console.error('Failed to load last audit:', err);
    }
  };

  const handleReview = async () => {
    if (!currentSession) return;

    if (reviewAssets.length === 0) {
      setError('Upload at least one asset to review.');
      return;
    }

    if (!currentSession.visualAnalysis || currentSession.visualAnalysis.includes('[Visual rules')) {
      setError('Please distill visual rules first in the Brand Configuration tab.');
      return;
    }

    // Create review job
    const jobId = `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const assetsToReview = [...reviewAssets]; // Copy assets
    
    const newJob: ReviewJob = {
      id: jobId,
      sessionId: currentSession.id,
      assets: assetsToReview,
      status: 'running',
      createdAt: new Date().toISOString(),
      assetsCount: assetsToReview.length
    };

    // Add to running reviews
    setRunningReviews(prev => [newJob, ...prev]);
    
    // Clear upload area for next batch
    setReviewAssets([]);
    setError('');

    // Run review asynchronously (non-blocking)
    runReviewJob(newJob, currentSession);
  };

  const runReviewJob = async (job: ReviewJob, session: any) => {
    try {
      // CRITICAL: Include ALL visual context - PDF, examples, labels
      const fullContext = [
        ...session.designSystemPdf,
        ...session.fewShotImages,
        ...session.correctLabelImages,
        ...session.incorrectLabelImages,
      ];

      // Build asset list with explicit filenames for the LLM
      const assetList = job.assets.map((asset, idx) => 
        `Asset ${idx}: "${asset.name || `unnamed-${idx}.jpg`}"`
      ).join('\n');
      
      console.log('🔍 Sending to review:', {
        assetsCount: job.assets.length,
        assetNames: job.assets.map(a => a.name),
        visualContextCount: fullContext.length
      });

      const response = await api.review(
        session.provider,
        session.id,
        {
          brandGuidelines: session.textGuidelines,
          visualAnalysis: session.visualAnalysis,
          labelDescription: session.labelDescription,
          visualContext: fullContext,  // Include all visual references
          reviewQuery: `**COMPREHENSIVE BRAND AUDIT - PER ASSET:**

You will receive ${fullContext.length} REFERENCE files (design system, examples, labels) followed by ${job.assets.length} ASSETS TO REVIEW.

ASSETS TO REVIEW (analyze these individually):
${assetList}

For EACH asset above, analyze against ALL visual references provided (design system PDF, approved examples, product labels).
Compare directly with the reference materials, not just text descriptions.

IMPORTANT: In your response, use the EXACT asset_name from the list above for each asset.

Review for:
1) Legal compliance (disclaimers, required text)
2) Product elements (versions, labels, specs)
3) Visual aesthetics (composition, hierarchy, balance)
4) Typography (fonts, sizes, alignment, readability)
5) Colors (palette adherence, contrast, proportions)
6) Logo usage (placement, size, clear space)
7) Accessibility (legibility, contrast ratios)`,
          assets: job.assets,
        }
      );

      if (response.ok && response.data) {
        // Add asset references to result for thumbnails
        const resultWithAssets = {
          ...response.data.json,
          _assetFiles: job.assets  // Store original assets for thumbnails
        };
        
        console.log('✅ Review complete:', {
          assetReviews: resultWithAssets.asset_reviews?.length,
          assetNames: resultWithAssets.asset_reviews?.map((a: any) => a.asset_name),
          hasAssetFiles: !!resultWithAssets._assetFiles,
          assetFilesCount: resultWithAssets._assetFiles?.length
        });
        
        // Update job as complete
        setRunningReviews(prev => prev.map(j => 
          j.id === job.id 
            ? { ...j, status: 'complete', result: resultWithAssets, completedAt: new Date().toISOString() }
            : j
        ));
        setCurrentAudit(resultWithAssets);
        setRefreshKey(prev => prev + 1); // Refresh queue
      } else {
        // Update job as error
        setRunningReviews(prev => prev.map(j => 
          j.id === job.id 
            ? { ...j, status: 'error', error: response.error || 'Review failed', completedAt: new Date().toISOString() }
            : j
        ));
      }
    } catch (err) {
      setRunningReviews(prev => prev.map(j => 
        j.id === job.id 
          ? { ...j, status: 'error', error: err instanceof Error ? err.message : 'Unknown error', completedAt: new Date().toISOString() }
          : j
      ));
    }
  };

  if (!currentSession) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Session Selected</h3>
          <p className="text-gray-500 dark:text-gray-400">Select a brand session to review assets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex gap-6 p-6">
      {/* Left Sidebar - Review Queue */}
      <div className="w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex flex-col border border-gray-200 dark:border-gray-700">
        <div className="flex-1 overflow-y-auto">
          <ReviewQueue
            key={refreshKey}
            sessionId={currentSession.id}
            onSelectReview={setCurrentAudit}
          />
        </div>
      </div>

      {/* Center - Upload & Controls */}
      <div className="w-96 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col border border-gray-200 dark:border-gray-700">
        <div className="flex-1 overflow-y-auto">
        <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Start New Review</h2>
        
        {/* Running Reviews - Only show currently running */}
        {runningReviews.filter(j => j.status === 'running').length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">⏳ Processing Now</h3>
            <div className="space-y-2">
              {runningReviews.filter(j => j.status === 'running').map((job) => (
                <div
                  key={job.id}
                  className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-700 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                      {job.assetsCount} {job.assetsCount === 1 ? 'asset' : 'assets'}
                    </span>
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-400 animate-pulse flex items-center gap-1">
                      <span className="inline-block animate-spin">⏳</span>
                      Analyzing...
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                    AI is reviewing against brand guidelines...
                  </div>
                  <div className="h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-400 rounded-full animate-pulse w-full shadow-inner"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Upload Assets</label>
              {reviewAssets.length > 0 && (
                <span className="text-xs bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 px-2 py-1 rounded-full font-semibold">
                  {reviewAssets.length} {reviewAssets.length === 1 ? 'asset' : 'assets'}
                </span>
              )}
            </div>
            <FileUpload
              label=""
              accept="image/*"
              multiple
              files={reviewAssets}
              onChange={setReviewAssets}
              placeholder="Drop campaign images here or click to upload"
            />
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleReview}
              disabled={reviewAssets.length === 0}
              className="w-full bg-brand-600 hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-600 text-white font-bold py-3 px-4 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors relative overflow-hidden"
            >
              <span className="flex items-center justify-center gap-2">
                <span>▶️</span>
                Start Review ({reviewAssets.length} {reviewAssets.length === 1 ? 'asset' : 'assets'})
              </span>
            </button>
            
            {reviewAssets.length === 0 ? (
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                ⚠️ Upload assets to begin
              </p>
            ) : (
              <p className="text-xs text-center text-green-600 dark:text-green-400 mt-2">
                ✓ Review will run in background
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
            <p className="font-semibold text-blue-900 dark:text-blue-300 mb-2">⚡ Parallel Reviews</p>
            <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
              <li>• Start a review, then upload more assets immediately</li>
              <li>• Run multiple reviews simultaneously</li>
              <li>• Reviews run in background - UI stays responsive</li>
              <li>• All reviews save to history automatically</li>
            </ul>
          </div>
        </div>
        </div>
      </div>

      {/* Right - Results Display */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col border border-gray-200 dark:border-gray-700">
        <div className="flex-1 overflow-y-auto">
        {currentAudit ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Compliance Report</h2>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {currentAudit.asset_reviews ? `${currentAudit.asset_reviews.length} assets analyzed` : 'Analysis complete'}
              </div>
            </div>
            <AuditResultCard result={currentAudit} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400 dark:text-gray-500">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No Review Selected</h3>
              <p className="text-sm">Upload assets and run a review, or select from history</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

