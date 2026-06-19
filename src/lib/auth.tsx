'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Workspace } from '@/types';
import { useRouter } from 'next/navigation';
import * as api from '@/lib/api';

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  workspace: null,
  loading: true,
  signIn: async () => false,
  signUp: async () => false,
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setWorkspace(data.workspace);
          localStorage.setItem('docflow-user', JSON.stringify(data.user));
          localStorage.setItem('docflow-workspace', JSON.stringify(data.workspace));
        } else {
          const stored = localStorage.getItem('docflow-user');
          const ws = localStorage.getItem('docflow-workspace');
          if (stored) {
            setUser(JSON.parse(stored) as User);
            if (ws) setWorkspace(JSON.parse(ws));
          }
        }
      } catch {
        const stored = localStorage.getItem('docflow-user');
        const ws = localStorage.getItem('docflow-workspace');
        if (stored) {
          setUser(JSON.parse(stored) as User);
          if (ws) setWorkspace(JSON.parse(ws));
        }
      }
      setLoading(false);
    }
    verify();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const data = await api.signIn(email, password);
      setUser(data.user);
      setWorkspace(data.workspace);
      localStorage.setItem('docflow-user', JSON.stringify(data.user));
      localStorage.setItem('docflow-workspace', JSON.stringify(data.workspace));
      return true;
    } catch {
      return false;
    }
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    try {
      const data = await api.signUp(name, email, password);
      setUser(data.user);
      setWorkspace(data.workspace);
      localStorage.setItem('docflow-user', JSON.stringify(data.user));
      localStorage.setItem('docflow-workspace', JSON.stringify(data.workspace));
      return true;
    } catch (e) {
      throw e;
    }
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setWorkspace(null);
    localStorage.removeItem('docflow-user');
    localStorage.removeItem('docflow-workspace');
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, workspace, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
