import React, { useEffect, useRef } from 'react';
import type { BrandSession } from '@/types';
import { useApp } from '@/store/AppContext';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface SessionCardProps {
  session: BrandSession;
  isActive: boolean;
  onClick: () => void;
  onEdit: (session: BrandSession) => void;
}

export function SessionCard({ session, isActive, onClick, onEdit }: SessionCardProps) {
  const { deleteSession } = useApp();
  const [showMenu, setShowMenu] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit(session);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    await deleteSession(session.id);
  };

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    
    // Export this session as JSON
    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      session: session
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative p-3 rounded-lg cursor-pointer transition-all duration-150
        ${isActive 
          ? 'bg-brand-50 dark:bg-brand-900/30 border-2 border-brand-500 dark:border-brand-600 shadow-md' 
          : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm truncate ${isActive ? 'text-brand-700 dark:text-brand-400' : 'text-gray-900 dark:text-gray-100'}`}>
            {session.name}
          </h4>
          {session.description && (
            <p className="text-xs text-gray-500 dark:text-gray-300 mt-1 line-clamp-2">
              {session.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={`
              text-xs px-2 py-0.5 rounded-full font-medium
              ${session.provider === 'gemini' ? 'bg-blue-100 text-blue-700' : ''}
              ${session.provider === 'openai' ? 'bg-green-100 text-green-700' : ''}
              ${session.provider === 'grok' ? 'bg-purple-100 text-purple-700' : ''}
            `}>
              {session.provider}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {new Date(session.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        <div className="relative ml-2" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            ⋮
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <button
                onClick={handleEdit}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700"
              >
                ✏️ Edit
              </button>
              <button
                onClick={handleExport}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700"
              >
                📤 Export
              </button>
              <button
                onClick={handleDeleteClick}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Session"
        message={`Are you sure you want to delete "${session.name}"? This will also delete all associated review history.`}
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

