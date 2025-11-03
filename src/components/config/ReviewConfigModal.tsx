import React, { useState, useEffect } from 'react';
import type { BrandSession } from '@/types';

interface ReviewConfigModalProps {
  session: BrandSession;
  onSave: (customPrompt: string) => void;
  onClose: () => void;
}

export function ReviewConfigModal({ session, onSave, onClose }: ReviewConfigModalProps) {
  const [customPrompt, setCustomPrompt] = useState(session.customReviewPrompt || '');

  // Update state when session changes
  useEffect(() => {
    setCustomPrompt(session.customReviewPrompt || '');
  }, [session.customReviewPrompt]);

  const defaultPrompt = `**COMPREHENSIVE BRAND AUDIT - PER ASSET:**

Review for:
1) Legal compliance (disclaimers, required text)
2) Product elements (versions, labels, specs)
3) Visual aesthetics (composition, hierarchy, balance)
4) Typography (fonts, sizes, alignment, readability)
5) Colors (palette adherence, contrast, proportions)
6) Logo usage (placement, size, clear space)
7) Accessibility (legibility, contrast ratios)`;

  const handleSave = () => {
    onSave(customPrompt);
    onClose();
  };

  const handleReset = () => {
    setCustomPrompt('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Review Configuration
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Customize what the AI checks when reviewing assets. Leave empty to use default.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Custom Review Instructions
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={10}
            className="input-field font-mono text-sm"
            placeholder={defaultPrompt}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Tell the AI what to focus on when reviewing campaign assets
          </p>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300 mb-4">
          <p className="font-semibold mb-1">💡 Examples</p>
          <ul className="text-xs space-y-1">
            <li>• "Focus on legal compliance and disclaimers"</li>
            <li>• "Check social media specs: 1080x1080, readable text"</li>
            <li>• "Verify product version V2.3 with QR code"</li>
            <li>• "Ensure accessibility WCAG AA compliance"</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition-colors"
          >
            Reset to Default
          </button>
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 btn-primary"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

