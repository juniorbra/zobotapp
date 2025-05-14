import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const GoogleOAuthCallback: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const processGoogleAuth = async () => {
      console.log('[GoogleOAuthCallback] Processando callback do Google...');
      
      try {
        // Verificar se o usuário está autenticado
        if (!user || !user.id) {
          throw new Error('Usuário não autenticado');
        }

        // Extrair o código de autorização da URL
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          throw new Error('Código de autorização não encontrado na URL');
        }
        
        console.log('[GoogleOAuthCallback] Código de autorização obtido');
        
        // Trocar o código por tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code,
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
            redirect_uri: 'https://meu.zobot.top/oauth/google/callback',
            grant_type: 'authorization_code'
          }).toString()
        });
        
        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.text();
          throw new Error(`Erro ao trocar código por tokens: ${errorData}`);
        }
        
        const tokenData = await tokenResponse.json();
        console.log('[GoogleOAuthCallback] Tokens obtidos com sucesso');
        
        // Extrair tokens
        const { access_token, refresh_token, expires_in } = tokenData;
        
        if (!access_token || !refresh_token) {
          throw new Error('Tokens inválidos recebidos do Google');
        }
        
        // Calcular data de expiração
        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + expires_in);
        
        // Armazenar tokens no Supabase
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            google_access_token: access_token,
            google_refresh_token: refresh_token,
            google_token_expiry: expiryDate.toISOString(),
            google_calendar_connected: true
          })
          .eq('id', user.id);
        
        if (updateError) {
          throw new Error(`Erro ao armazenar tokens: ${updateError.message}`);
        }
        
        console.log('[GoogleOAuthCallback] Tokens armazenados com sucesso');
        setSuccess(true);
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate('/configurar-agente', { replace: true });
        }, 2000);
        
      } catch (err) {
        console.error('[GoogleOAuthCallback] Erro:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsProcessing(false);
      }
    };
    
    processGoogleAuth();
  }, [location, navigate, user]);
  
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
        <div className="bg-[#131825] p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <h2 className="text-xl text-white text-center font-semibold mb-2">
            Processando autenticação do Google Calendar
          </h2>
          <p className="text-gray-400 text-center">
            Por favor, aguarde enquanto processamos sua autenticação...
          </p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
        <div className="bg-[#131825] p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
            <h3 className="font-bold text-lg mb-2">Erro na autenticação</h3>
            <p>{error}</p>
          </div>
          <div className="flex justify-center">
            <button 
              onClick={() => navigate('/configurar-agente')}
              className="bg-[#3b82f6] text-white py-2 px-4 rounded-md hover:bg-[#2563eb]"
            >
              Voltar para configuração
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
        <div className="bg-[#131825] p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded mb-4">
            <h3 className="font-bold text-lg mb-2">Autenticação concluída</h3>
            <p>Sua conta do Google Calendar foi conectada com sucesso!</p>
          </div>
          <p className="text-gray-400 text-center mb-4">
            Você será redirecionado automaticamente em alguns segundos...
          </p>
          <div className="flex justify-center">
            <button 
              onClick={() => navigate('/configurar-agente')}
              className="bg-[#3b82f6] text-white py-2 px-4 rounded-md hover:bg-[#2563eb]"
            >
              Voltar para configuração
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
};

export default GoogleOAuthCallback;
