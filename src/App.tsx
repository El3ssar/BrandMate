import React from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { AuthPage } from './components/auth/AuthPage';
import { MainLayout } from './components/layout/MainLayout';

function AppContent() {
  const { isAuthenticated, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4 animate-pulse">🎨</div>
          <h2 className="text-2xl font-bold">Loading Brand Guardian...</h2>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <MainLayout /> : <AuthPage />;
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;


