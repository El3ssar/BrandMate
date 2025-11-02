import React, { useState } from 'react';
import { useApp } from '@/store/AppContext';

interface NewSessionModalProps {
  onClose: () => void;
}

export function NewSessionModal({ onClose }: NewSessionModalProps) {
  const { createSession } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    provider: 'gemini' as 'gemini' | 'openai' | 'grok',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createSession({
        ...formData,
        brandColors: [
          { name: 'Principal', hex: '#1E3A8A' },
          { name: 'Secundario', hex: '#FBBF24' },
        ],
        textGuidelines: `# BRAND MANUAL - ${formData.name}\n\n## 1. Visual Identity\n### A. Color Palette: (Generated dynamically)\n### B. Typography: Headlines (Montserrat Bold, min 32px), Body (Roboto Regular, min 16px).\n\n## 2. Verbal Identity\n### A. Tone of Voice: Professional, inspiring, and direct.\n### B. Legal Rules: Add required disclaimers for all claims.`,
        labelDescription: 'Product label description goes here.',
        visualAnalysis: '[Visual rules to be generated]',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">New Brand Session</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Create a new session to organize different brands or campaigns
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Brand Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="e.g., Nike Summer Campaign 2025"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose a descriptive name for easy identification</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="Brief description of this brand session..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              AI Provider
            </label>
            <select
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
              className="input-field"
            >
              <option value="gemini">Google Gemini (Recommended - Fast & Free tier)</option>
              <option value="openai">OpenAI (Most Accurate)</option>
              <option value="grok">Grok (Alternative)</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">You can change this later in session settings</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

