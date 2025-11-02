import React, { useState } from 'react';
import type { AuditResult, AssetReview } from '@/types';

interface AuditResultCardProps {
  result: AuditResult;
}

const severityColors: Record<string, string> = {
  CRITICAL: 'bg-red-600 text-white',
  HIGH: 'bg-red-400 text-white',
  MEDIUM: 'bg-yellow-400 text-gray-900',
  LOW: 'bg-yellow-200 text-gray-900',
  'N/A': 'bg-gray-200 text-gray-800',
};

export function AuditResultCard({ result }: AuditResultCardProps) {
  const [expandedAssets, setExpandedAssets] = useState<Set<number>>(new Set([0]));

  const toggleAsset = (index: number) => {
    const newSet = new Set(expandedAssets);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedAssets(newSet);
  };

  const verdictColor =
    result.overall_verdict === 'APROBADO'
      ? 'bg-green-600 text-white'
      : result.overall_verdict === 'RECHAZADO'
      ? 'bg-red-700 text-white'
      : 'bg-yellow-500 text-gray-900';

  // Check if we have the new per-asset format
  const hasPerAssetReviews = result.asset_reviews && result.asset_reviews.length > 0;

  // Legacy format support
  const compliant = result.review_details?.filter((d) => d.finding_type === 'CUMPLIMIENTO') || [];
  const infractions = result.review_details?.filter((d) => d.finding_type === 'INFRACCION') || [];

  // Sort infractions by severity
  const sortedInfractions = [...infractions].sort((a, b) => {
    const order: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, 'N/A': 0 };
    return (order[b.severity] || 0) - (order[a.severity] || 0);
  });

  return (
    <div className="space-y-6">
      {/* Verdict Header */}
      <div className={`p-6 rounded-xl font-extrabold text-2xl flex justify-between items-center shadow-lg ${verdictColor}`}>
        <span>VERDICT: {result.overall_verdict}</span>
        <span className="text-3xl">Score: {result.overall_score}/100</span>
      </div>

      {/* Per-Asset Reviews (New Format) */}
      {hasPerAssetReviews && (
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            📋 Individual Asset Analysis ({result.asset_reviews!.length} {result.asset_reviews!.length === 1 ? 'asset' : 'assets'})
          </h3>
          <div className="space-y-4">
            {result.asset_reviews!.map((assetReview, index) => {
              const isExpanded = expandedAssets.has(index);
              const assetVerdictColor =
                assetReview.verdict === 'APROBADO'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : assetReview.verdict === 'RECHAZADO'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';

              const assetFile = (result as any)._assetFiles?.[index];
              
              return (
                <div key={index} className={`border-l-4 ${assetVerdictColor} rounded-lg shadow-md overflow-hidden dark:shadow-gray-900`}>
                  <button
                    onClick={() => toggleAsset(index)}
                    className="w-full p-4 text-left hover:bg-opacity-80 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Asset Thumbnail */}
                      {assetFile && (
                        <img
                          src={`data:${assetFile.mimeType};base64,${assetFile.data}`}
                          alt={`Asset ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border-2 border-gray-300"
                        />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                            Asset #{index + 1}
                          </span>
                          {(assetReview.asset_name || assetFile?.name) && (
                            <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                              {assetReview.asset_name || assetFile?.name}
                            </span>
                          )}
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                            assetReview.verdict === 'APROBADO' ? 'bg-green-600 text-white' :
                            assetReview.verdict === 'RECHAZADO' ? 'bg-red-600 text-white' :
                            'bg-yellow-500 text-gray-900'
                          }`}>
                            {assetReview.verdict}
                          </span>
                          <span className="text-xl font-bold text-brand-700 dark:text-brand-400">
                            {assetReview.score}/100
                          </span>
                        </div>
                        {assetReview.summary && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{assetReview.summary}</p>
                        )}
                      </div>
                      <span className={`text-2xl transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 bg-white dark:bg-gray-800">
                      {/* Compliant Findings */}
                      {assetReview.findings.filter(f => f.finding_type === 'CUMPLIMIENTO').map((finding, fIdx) => (
                        <div key={`c-${fIdx}`} className="flex items-start gap-2 bg-green-50 dark:bg-green-900/30 p-3 rounded-lg border border-green-200 dark:border-green-700">
                          <span className="text-green-600 dark:text-green-400 text-lg">✅</span>
                          <div className="flex-grow">
                            <span className="font-bold text-green-800 dark:text-green-400 mr-2">[{finding.module}]</span>
                            <span className="text-green-700 dark:text-green-300">{finding.description}</span>
                          </div>
                        </div>
                      ))}

                      {/* Infraction Findings */}
                      {assetReview.findings.filter(f => f.finding_type === 'INFRACCION').map((finding, fIdx) => (
                        <div key={`i-${fIdx}`} className="p-3 rounded-lg border-l-4 border-red-500 shadow bg-white dark:bg-gray-700">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${severityColors[finding.severity] || 'bg-gray-200'}`}>
                              {finding.severity}
                            </span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">[{finding.module}]</span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">{finding.description}</p>
                          <div className="pt-2 mt-2 border-t border-dashed border-gray-300 dark:border-gray-600">
                            <p className="text-brand-700 dark:text-brand-400 font-semibold text-sm">
                              <span className="font-bold">ACTION:</span> {finding.feedback}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legacy Format Support - Compliance Points */}
      {!hasPerAssetReviews && compliant.length > 0 && (
        <div>
          <h4 className="text-xl font-bold text-green-700 mb-3 border-b-2 border-green-200 pb-2">
            ✅ Compliance Points
          </h4>
          <ul className="space-y-3">
            {compliant.map((detail, index) => (
              <li
                key={index}
                className="flex items-start gap-3 bg-green-50 p-4 rounded-lg border border-green-200 shadow-sm"
              >
                <span className="text-green-600 text-xl">✅</span>
                <div className="flex-grow">
                  <span className="font-bold text-green-800 mr-2">[{detail.module}]</span>
                  <span className="text-green-700">{detail.description}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Legacy Format - Infractions */}
      {!hasPerAssetReviews && sortedInfractions.length > 0 && (
        <div>
          <h4 className="text-xl font-bold text-red-700 mb-3 border-b-2 border-red-200 pb-2">
            ❌ Infractions
          </h4>
          <ul className="space-y-4">
            {sortedInfractions.map((detail, index) => (
              <li
                key={index}
                className="p-4 rounded-lg border-l-4 border-red-500 shadow bg-white"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full ${
                      severityColors[detail.severity] || 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {detail.severity}
                  </span>
                  <span className="font-bold text-gray-800">[{detail.module}]</span>
                </div>
                <p className="text-gray-700 mb-2">{detail.description}</p>
                <div className="pt-2 mt-2 border-t border-dashed border-gray-300">
                  <p className="text-brand-700 font-semibold text-sm">
                    <span className="font-bold">ACTION:</span> {detail.feedback}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No details */}
      {!hasPerAssetReviews && compliant.length === 0 && infractions.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>No review details available</p>
        </div>
      )}
    </div>
  );
}


