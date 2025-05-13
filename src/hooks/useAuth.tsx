import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, nome: string, telefone: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Forçar detecção de sessão OAuth na URL antes de qualquer navegação
    (async () => {
      // Detecta tokens na URL e processa sessão OAuth
      await supabase.auth.getSession();
      // Após processar, obtém a sessão atual
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('[Auth] getSession (init):', session ? 'Sessão válida' : 'Sem sessão');
        setSession(session);
        setUser(session?.user ?? null);
      });
    })();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] onAuthStateChange:', event, session ? 'Sessão válida' : 'Sem sessão');
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, nome: string, telefone: string) => {
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
          telefone
        }
      }
    });

    if (signUpError) throw signUpError;
    
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ 
          id: data.user.id, 
          nome, 
          telefone, 
          email 
        }]);

      if (profileError) throw profileError;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    console.log('[Auth] Iniciando login com Google...');
    
    // Limpar qualquer sessão anterior
    localStorage.removeItem('supabase.auth.token');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: 'select_account', // Força seleção de conta Google
        }
      }
    });
    
    if (error) {
      console.error('[Auth] Erro no login com Google');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, signIn, signInWithGoogle, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
