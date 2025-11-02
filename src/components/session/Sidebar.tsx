import React, { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { SessionCard } from './SessionCard';
import { NewSessionModal } from './NewSessionModal';
import { EditSessionModal } from './EditSessionModal';
import { ImportExportButtons } from './ImportExportButtons';
import type { BrandSession } from '@/types';

export function Sidebar() {
  const { sessions, currentSession, selectSession, user, logout } = useApp();
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<BrandSession | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleEditSession = (session: BrandSession) => {
    setSessionToEdit(session);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSessionToEdit(null);
  };

  return (
    <>
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-brand-700">Brand Guardian</h2>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center font-semibold hover:bg-brand-700 transition-colors"
                title={user?.displayName}
              >
                {user?.displayName?.[0]?.toUpperCase() || 'U'}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-200">
                    <p className="font-semibold text-sm text-gray-900">{user?.displayName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="w-full btn-primary text-sm"
          >
            + New Brand Session
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Your Brand Sessions ({sessions.length})
          </h3>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <div className="mb-3">📋</div>
              <p className="font-medium text-gray-600">No sessions yet</p>
              <p className="mt-1">Click the button above to create your first brand session!</p>
            </div>
          ) : (
            sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isActive={currentSession?.id === session.id}
                onClick={() => selectSession(session)}
                onEdit={handleEditSession}
              />
            ))
          )}
        </div>

        {/* Footer - Import/Export */}
        <div className="p-4 border-t border-gray-200">
          <ImportExportButtons />
        </div>
      </aside>

      {showNewModal && <NewSessionModal onClose={() => setShowNewModal(false)} />}
      {showEditModal && sessionToEdit && (
        <EditSessionModal session={sessionToEdit} onClose={handleCloseEditModal} />
      )}
    </>
  );
}

