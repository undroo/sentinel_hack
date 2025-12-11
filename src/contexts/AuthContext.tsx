import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Responder } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  responder: Responder | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setResponder: (responder: Responder | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [responder, setResponder] = useState<Responder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: responderData } = await supabase
            .from('responders')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (responderData) {
            setResponder(responderData);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: responderData } = await supabase
          .from('responders')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (responderData) {
          setResponder(responderData);
        }
      } else {
        setResponder(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    responder,
    isLoading,
    isAuthenticated: !!responder,
    setResponder,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
