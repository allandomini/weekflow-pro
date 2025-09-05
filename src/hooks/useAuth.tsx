import React, { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('🔐 Auth state:', { user: user?.id, loading });

  useEffect(() => {
    let mounted = true;

    // Check for existing session immediately
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Session error:', error);
          setSession(null);
          setUser(null);
        } else {
          // Check if account is marked as deleted
          if (session?.user?.user_metadata?.account_deleted) {
            console.log('Account marked as deleted, attempting to clear metadata');
            
            // Try to clear the deleted flag first (in case this is a reactivated account)
            try {
              const { error: updateError } = await supabase.auth.updateUser({
                data: { 
                  account_deleted: false,
                  deleted_at: null,
                  original_email: null
                }
              });
              
              if (!updateError) {
                // Successfully cleared, refresh session
                const { data: { session: newSession } } = await supabase.auth.getSession();
                if (newSession && !newSession.user?.user_metadata?.account_deleted) {
                  setSession(newSession);
                  setUser(newSession.user);
                  return;
                }
              }
            } catch (error) {
              console.error('Error clearing deleted flag:', error);
            }
            
            // If clearing failed or account is truly deleted, sign out
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            toast({
              title: "Conta não encontrada",
              description: "Esta conta foi excluída e não existe mais no sistema.",
              variant: "destructive",
            });
          } else {
            setSession(session);
            setUser(session?.user ?? null);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session?.user?.id);
        
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          localStorage.removeItem('domini-app-loaded');
          localStorage.removeItem('domini-last-load');
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Check if account is marked as deleted
          if (session?.user?.user_metadata?.account_deleted) {
            console.log('Account marked as deleted, attempting to clear metadata');
            
            // Try to clear the deleted flag first (in case this is a reactivated account)
            try {
              const { error: updateError } = await supabase.auth.updateUser({
                data: { 
                  account_deleted: false,
                  deleted_at: null,
                  original_email: null
                }
              });
              
              if (!updateError) {
                // Successfully cleared, set session normally
                setSession(session);
                setUser(session?.user ?? null);
                return;
              }
            } catch (error) {
              console.error('Error clearing deleted flag:', error);
            }
            
            // If clearing failed or account is truly deleted, sign out
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            toast({
              title: "Conta não encontrada",
              description: "Esta conta foi excluída e não existe mais no sistema.",
              variant: "destructive",
            });
          } else {
            setSession(session);
            setUser(session?.user ?? null);
          }
        }
        
        setLoading(false);
      }
    );

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
          account_deleted: false,
        },
      },
    });

    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // If login successful, check if we need to clear deleted account metadata
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.account_deleted) {
        // Clear the deleted flag for reactivated accounts
        await supabase.auth.updateUser({
          data: { 
            account_deleted: false,
            deleted_at: null,
            original_email: null
          }
        });
      }
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}