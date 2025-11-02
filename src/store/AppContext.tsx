import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, BrandSession, FileData } from '@/types';
import { api } from '@/services/api';

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  sessions: BrandSession[];
  currentSession: BrandSession | null;
  reviewAssets: FileData[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  loadSessions: () => Promise<void>;
  selectSession: (session: BrandSession | null) => void;
  createSession: (data: Partial<BrandSession>) => Promise<void>;
  updateSession: (id: string, data: Partial<BrandSession>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  setReviewAssets: (assets: FileData[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessions, setSessions] = useState<BrandSession[]>([]);
  const [currentSession, setCurrentSession] = useState<BrandSession | null>(null);
  const [reviewAssets, setReviewAssets] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to restore session on mount
    const token = api.getToken();
    if (token) {
      api.getCurrentUser().then((response) => {
        if (response.ok && response.data) {
          setUser(response.data);
          setIsAuthenticated(true);
          loadSessions();
        } else {
          api.setToken(null);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login({ email, password });
    if (!response.ok || !response.data) {
      throw new Error(response.error || 'Login failed');
    }
    const { user, token } = response.data;
    api.setToken(token);
    setUser(user);
    setIsAuthenticated(true);
    await loadSessions();
  };

  const register = async (data: any) => {
    const response = await api.register(data);
    if (!response.ok || !response.data) {
      throw new Error(response.error || 'Registration failed');
    }
    const { user, token } = response.data;
    api.setToken(token);
    setUser(user);
    setIsAuthenticated(true);
    await loadSessions();
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setSessions([]);
    setCurrentSession(null);
    setReviewAssets([]);
  };

  const loadSessions = async () => {
    const response = await api.getSessions();
    if (response.ok && response.data) {
      setSessions(response.data);
    }
  };

  const selectSession = (session: BrandSession | null) => {
    setCurrentSession(session);
  };

  const createSession = async (data: Partial<BrandSession>) => {
    const response = await api.createSession(data);
    if (!response.ok || !response.data) {
      throw new Error(response.error || 'Failed to create session');
    }
    await loadSessions();
    setCurrentSession(response.data);
  };

  const updateSession = async (id: string, data: Partial<BrandSession>) => {
    const response = await api.updateSession(id, data);
    if (!response.ok || !response.data) {
      throw new Error(response.error || 'Failed to update session');
    }
    await loadSessions();
    if (currentSession?.id === id) {
      setCurrentSession(response.data);
    }
  };

  const deleteSession = async (id: string) => {
    const response = await api.deleteSession(id);
    if (!response.ok) {
      throw new Error(response.error || 'Failed to delete session');
    }
    if (currentSession?.id === id) {
      setCurrentSession(null);
    }
    await loadSessions();
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated,
        sessions,
        currentSession,
        reviewAssets,
        loading,
        login,
        register,
        logout,
        loadSessions,
        selectSession,
        createSession,
        updateSession,
        deleteSession,
        setReviewAssets,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}


