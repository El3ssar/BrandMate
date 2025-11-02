import React, { useState } from 'react';
import { Sidebar } from '../session/Sidebar';
import { BrandConfiguration } from '../brand/BrandConfiguration';
import { ReviewPanel } from '../review/ReviewPanel';
import { useApp } from '@/store/AppContext';

export function MainLayout() {
  const [activeTab, setActiveTab] = useState<'configure' | 'review'>('configure');
  const { currentSession } = useApp();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 pt-4 transition-colors">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('configure')}
              className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
                activeTab === 'configure'
                  ? 'bg-brand-500 dark:bg-brand-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              🎨 Brand Configuration
            </button>
            <button
              onClick={() => setActiveTab('review')}
              disabled={!currentSession}
              className={`px-6 py-3 font-semibold rounded-t-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === 'review'
                  ? 'bg-brand-500 dark:bg-brand-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              🔍 Asset Review
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors">
          {activeTab === 'configure' ? (
            <div className="h-full overflow-y-auto">
              <BrandConfiguration />
            </div>
          ) : (
            <ReviewPanel />
          )}
        </div>
      </div>
    </div>
  );
}

