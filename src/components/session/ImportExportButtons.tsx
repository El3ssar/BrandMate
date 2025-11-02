import React, { useRef } from 'react';
import { useApp } from '@/store/AppContext';
import { api } from '@/services/api';
import { downloadJSON, uploadJSON } from '@/utils/fileUtils';
import type { SessionExport } from '@/types';

export function ImportExportButtons() {
  const { loadSessions } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const response = await api.exportSessions();
      if (response.ok && response.data) {
        const filename = `brand-guardian-export-${new Date().toISOString().split('T')[0]}.json`;
        downloadJSON(response.data, filename);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export sessions');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await uploadJSON<any>(file);
      
      let response;
      // Check if it's a single session or multiple sessions
      if (data.session) {
        // Single session export
        response = await api.importSessions({ ...data, sessions: [data.session] });
      } else if (data.sessions) {
        // Multiple sessions export
        response = await api.importSessions(data);
      } else {
        throw new Error('Invalid export file format');
      }
      
      if (response.ok) {
        await loadSessions();
        alert(`Successfully imported ${response.data?.sessions?.length || 0} session(s)!`);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import. Please check the file format.');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleExport}
        className="w-full px-3 py-2 text-sm font-medium text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 rounded-lg transition-colors border border-brand-200 dark:border-brand-700"
      >
        📤 Export All Sessions
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
      >
        📥 Import Sessions
      </button>
    </div>
  );
}


