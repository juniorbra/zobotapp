import React, { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Database } from '../database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function ConfigurarAgente() {
  const { user } = useAuth();
  const [details, setDetails] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchAgentProfile = async () => {
      if (!user) {
        console.log('No user found, returning early');
        setIsFetching(false);
        return;
      }

      console.log('Fetching profile for user:', user.id);
      try {
        // Usar a função RPC get_profile para obter o perfil do usuário atual
        const { data, error } = await supabase
          .rpc('get_profile')
          .single();

        console.log('Supabase response:', { data, error });

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        if (!data) {
          console.log('No profile found for user:', user.id);
          setDetails('');
        } else {
          console.log('Profile data:', data);
          // Garantir que o tipo está correto
          const profile = data as Profile;
          setDetails(profile.prompt?.replace(/\\n/g, '\n') || '');
          console.log('Details set to:', profile.prompt || '');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Erro ao carregar as instruções do agente');
      } finally {
        setIsFetching(false);
      }
    };

    fetchAgentProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) {
      setError('Usuário não está autenticado');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('https://webhooks.botvance.com.br/webhook/64012b8b-dca2-4f28-b1e7-abd3432867ed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          instrucoes: details
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar configurações do agente');
      }

      alert('Configurações salvas com sucesso!');
    } catch (error) {
      setError('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center mb-8">
          <Bot className="h-12 w-12 text-blue-600" />
          <h1 className="ml-4 text-3xl font-bold text-gray-900">
            Configurar Agente de IA
          </h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm mb-2">
              <span className="font-bold">Instruções do Agente</span>
              <Link 
                to="/configuracao-ia" 
                className="text-sm text-blue-600 hover:text-blue-800 ml-1"
              >
                (Obter ajuda da IA)
              </Link>
            </label>
            {isFetching ? (
              <div className="w-full h-[400px] flex items-center justify-center bg-gray-50 border border-gray-300 rounded-md">
                <span className="text-gray-500">Carregando instruções...</span>
              </div>
            ) : (
              <textarea
                value={details ?? ''}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={18}
                placeholder="Digite as instruções para o seu agente..."
                required
              />
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </form>
      </div>
    </div>
  );
}
