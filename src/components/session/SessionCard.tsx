import React from 'react';
import type { BrandSession } from '@/types';
import { useApp } from '@/store/AppContext';

interface SessionCardProps {
  session: BrandSession;
  isActive: boolean;
  onClick: () => void;
  onEdit: (session: BrandSession) => void;
}

export function SessionCard({ session, isActive, onClick, onEdit }: SessionCardProps) {
  const { deleteSession } = useApp();
  const [showMenu, setShowMenu] = React.useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit(session);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete session "${session.name}"?`)) {
      await deleteSession(session.id);
    }
    setShowMenu(false);
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative p-3 rounded-lg cursor-pointer transition-all duration-150
        ${isActive 
          ? 'bg-brand-50 border-2 border-brand-500 shadow-md' 
          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm truncate ${isActive ? 'text-brand-700' : 'text-gray-900'}`}>
            {session.name}
          </h4>
          {session.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
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
            <span className="text-xs text-gray-400">
              {new Date(session.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        <div className="relative ml-2">
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
            <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <button
                onClick={handleEdit}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
              >
                ✏️ Edit
              </button>
              <button
                onClick={handleDelete}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

