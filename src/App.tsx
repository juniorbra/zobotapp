import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import ResetarSenha from './pages/ResetarSenha';
import ConectarWhatsapp from './pages/ConectarWhatsapp';
import ConfigurarAgente from './pages/ConfigurarAgente';
import PainelControle from './pages/PainelControle';

// Componente específico para lidar com o callback do OAuth
function OAuthCallback() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const processAuth = async () => {
      console.log('[OAuthCallback] Processando callback OAuth...');
      
      // Verificar se há hash na URL sem expor o conteúdo
      const hasHash = location.hash && location.hash.length > 0;
      console.log('[OAuthCallback] URL contém hash de autenticação:', hasHash);
      
      try {
        // Forçar processamento dos tokens na URL
        const { data, error } = await supabase.auth.getSession();
        console.log('[OAuthCallback] Sessão obtida:', data.session ? 'Sim' : 'Não');
        
        if (error) {
          console.error('[OAuthCallback] Erro ao processar autenticação');
          setError(error.message);
          return;
        }
        
        if (data.session) {
          console.log('[OAuthCallback] Sessão estabelecida com sucesso!');
          // Redirecionar para o painel de controle
          navigate('/painel-controle', { replace: true });
        } else {
          console.error('[OAuthCallback] Não foi possível estabelecer sessão');
          setError('Não foi possível estabelecer sessão. Tente novamente.');
        }
      } catch (err) {
        console.error('[OAuthCallback] Erro inesperado ao processar autenticação');
        setError('Erro inesperado ao processar autenticação.');
      } finally {
        setIsProcessing(false);
      }
    };
    
    processAuth();
  }, [navigate, location]);
  
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
        <div className="text-white text-xl">Processando autenticação...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-4 bg-[#3b82f6] text-white py-2 px-4 rounded-md hover:bg-[#2563eb]"
          >
            Voltar para o login
          </button>
        </div>
      </div>
    );
  }
  
  return null;
}

function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const location = useLocation();
  
  // Verificar se há tokens na URL (callback do OAuth)
  const hasAuthParams = location.hash && (
    location.hash.includes('access_token') || 
    location.hash.includes('refresh_token') || 
    location.hash.includes('error')
  );
  
  console.log('[RotaProtegida] Rota atual:', location.pathname);
  console.log('[RotaProtegida] Tem parâmetros de auth?', hasAuthParams);
  console.log('[RotaProtegida] Usuário autenticado?', !!session);
  
  // Se estamos na rota de callback com tokens, mas sem sessão,
  // vamos tentar processar os tokens manualmente
  if (hasAuthParams && !session) {
    console.log('[RotaProtegida] Detectados tokens na URL, processando...');
    // Forçar processamento dos tokens (o Supabase deveria fazer isso automaticamente)
    supabase.auth.getSession().then((result) => {
      console.log('[RotaProtegida] Sessão obtida após processar tokens:', !!result.data.session);
    });
    
    // Mostrar uma mensagem de carregamento enquanto processamos
    return <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
      <div className="text-white text-xl">Processando autenticação...</div>
    </div>;
  }
  
  if (!session) {
    // Verifica se é um redirecionamento manual (logout)
    const manualRedirect = localStorage.getItem('manual_redirect');
    if (manualRedirect) {
      localStorage.removeItem('manual_redirect');
      return null;
    }
    
    console.log('[RotaProtegida] Sem sessão, redirecionando para /login/');
    return <Navigate to="/login/" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login/" element={<Login />} />
        <Route path="/resetar-senha" element={<ResetarSenha />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route
          path="/minha-conta"
          element={<Navigate to="/painel-controle" />}
        />
        <Route
          path="/conectar-whatsapp"
          element={
            <RotaProtegida>
              <ConectarWhatsapp />
            </RotaProtegida>
          }
        />
        <Route
          path="/"
          element={<Navigate to="/painel-controle" />}
        />
        <Route
          path="/painel-controle"
          element={
            <RotaProtegida>
              <PainelControle />
            </RotaProtegida>
          }
        />
        <Route
          path="/configurar-agente"
          element={
            <RotaProtegida>
              <ConfigurarAgente />
            </RotaProtegida>
          }
        />
        <Route
          path="/configurar-agente/:id"
          element={
            <RotaProtegida>
              <ConfigurarAgente />
            </RotaProtegida>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
