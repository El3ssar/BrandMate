import React, { useState } from 'react';
import type { BrandSession, AIParameters } from '@/types';

interface GlobalConfigModalProps {
  session: BrandSession;
  onSave: (params: AIParameters) => void;
  onClose: () => void;
}

export function GlobalConfigModal({ session, onSave, onClose }: GlobalConfigModalProps) {
  const [params, setParams] = useState<AIParameters>(session.aiParameters || {});

  const providerDefaults = {
    gemini: { temperature: 0.7, maxTokens: 8192, topP: 0.95 },
    openai: { temperature: 0.7, maxTokens: 4096, topP: 1.0 },
    grok: { temperature: 0.7, maxTokens: 4096, topP: 1.0 },
  };

  const defaults = providerDefaults[session.provider];

  const handleSave = () => {
    onSave(params);
    onClose();
  };

  const handleReset = () => {
    setParams({});
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          AI Parameters ({session.provider})
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Fine-tune AI behavior. Leave empty for provider defaults.
        </p>

        <div className="space-y-4">
          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Temperature (0.0 - 2.0)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={params.temperature ?? ''}
              onChange={(e) => setParams({ ...params, temperature: e.target.value ? parseFloat(e.target.value) : undefined })}
              className="input-field"
              placeholder={`Default: ${defaults.temperature}`}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Lower = more focused, Higher = more creative
            </p>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Output Tokens
            </label>
            <input
              type="number"
              step="256"
              min="256"
              max="16384"
              value={params.maxTokens ?? ''}
              onChange={(e) => setParams({ ...params, maxTokens: e.target.value ? parseInt(e.target.value) : undefined })}
              className="input-field"
              placeholder={`Default: ${defaults.maxTokens}`}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Maximum length of AI response
            </p>
          </div>

          {/* Top P */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Top P (0.0 - 1.0)
            </label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={params.topP ?? ''}
              onChange={(e) => setParams({ ...params, topP: e.target.value ? parseFloat(e.target.value) : undefined })}
              className="input-field"
              placeholder={`Default: ${defaults.topP}`}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Nucleus sampling - diversity control
            </p>
          </div>
        </div>

        <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm">
          <p className="text-yellow-800 dark:text-yellow-300 text-xs">
            ⚠️ Advanced settings. Defaults are optimized for brand compliance. Change only if you know what you're doing.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition-colors"
          >
            Reset
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
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

