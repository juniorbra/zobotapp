import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await signIn(email, password);
      navigate('/painel-controle');
    } catch (error) {
      setError('Email ou senha incorretos. Por favor, verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      setError('Erro ao fazer login com Google. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#131825] rounded-lg shadow-lg p-8">
        <div className="flex justify-center mb-8">
          <img src="https://zobot.app/logozobotwebsite.png" alt="Logo Zobot" className="h-12" />
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-8">Login</h2>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-300 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-[#232b3d] border border-[#374151] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-bold mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#232b3d] border border-[#374151] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button type="submit" ...>
            Entrar
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#131825] text-gray-400">Ou continue com</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 py-2 px-4 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg ... /> Entrar com Google
          </button>
        </form>

        <p className="mt-4 text-center text-gray-400">
          <Link to="/resetar-senha" className="text-blue-400 hover:text-blue-300">
            Esqueceu sua senha?
          </Link>
        </p>
      </div>
    </div>
  );
}
