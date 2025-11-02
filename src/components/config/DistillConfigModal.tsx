import React, { useState } from 'react';
import type { BrandSession } from '@/types';

interface DistillConfigModalProps {
  session: BrandSession;
  onSave: (customPrompt: string) => void;
  onClose: () => void;
}

export function DistillConfigModal({ session, onSave, onClose }: DistillConfigModalProps) {
  const [customPrompt, setCustomPrompt] = useState(session.customDistillPrompt || '');

  const defaultPrompt = `Analyze ALL files (PDFs and images) to create detailed brand rules.

Structure your analysis in 7 sections:
1. Typography (exact fonts, sizes, weights, spacing)
2. Color Palette (HEX codes, hierarchy, proportions)
3. Composition & Layout (grids, margins, alignment)
4. Photographic Style (photography type, lighting, mood)
5. Logo & Graphics (positioning, sizes, clear space)
6. Product Rules (specifications, versions)
7. Accessibility (contrast, legibility)

Be extremely specific and detailed.`;

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
          Distill Configuration
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Customize how AI analyzes your brand materials. Leave empty to use default.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Custom Distill Instructions
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={12}
            className="input-field font-mono text-sm"
            placeholder={defaultPrompt}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Tell the AI what to focus on when analyzing your brand materials
          </p>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300 mb-4">
          <p className="font-semibold mb-1">💡 Tips</p>
          <ul className="text-xs space-y-1">
            <li>• Specify which aspects are most important for your brand</li>
            <li>• Mention industry-specific requirements</li>
            <li>• Request specific output format if needed</li>
            <li>• Leave empty to use optimized defaults</li>
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

