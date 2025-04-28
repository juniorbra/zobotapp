import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import ResetarSenha from './pages/ResetarSenha';
import ConectarWhatsapp from './pages/ConectarWhatsapp';
import ConfigurarAgente from './pages/ConfigurarAgente';
import ConfiguracaoIA from './pages/ConfiguracaoIA';
import MinhaConta from './pages/MinhaConta';
import { Wifi, Settings, User, Bot, Sun, Moon, Menu as MenuIcon, LogOut } from 'lucide-react';
import { useState } from 'react';

function Layout({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <div className="flex h-screen">
        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden fixed top-4 left-4 z-20 p-2 rounded-md bg-gray-100 dark:bg-gray-800"
          aria-label="Toggle menu"
        >
          <MenuIcon className="h-6 w-6" />
        </button>

        {/* Sidebar */}
        <div
          className={`${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:relative top-0 left-0 z-10 w-64 h-full transition-transform duration-300 ease-in-out ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } shadow-lg`}
        >
          <nav className="p-6 space-y-4 mt-14 lg:mt-0">
            <Link
              to="/minha-conta"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive('/minha-conta')
                  ? 'bg-blue-500 text-white'
                  : `${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
              }`}
            >
              <User className="h-5 w-5 mr-3" />
              Minha Conta
            </Link>
            <Link
              to="/conectar-whatsapp"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive('/conectar-whatsapp')
                  ? 'bg-blue-500 text-white'
                  : `${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
              }`}
            >
              <Wifi className="h-5 w-5 mr-3" />
              Passo 1: Conectar WhatsApp
            </Link>
            <Link
              to="/configurar-agente"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive('/configurar-agente')
                  ? 'bg-blue-500 text-white'
                  : `${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
              }`}
            >
              <Settings className="h-5 w-5 mr-3" />
              Passo 2: Configurar Agente IA
            </Link>
            <Link
              to="/configuracao-ia"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive('/configuracao-ia')
                  ? 'bg-blue-500 text-white'
                  : `${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
              }`}
            >
              <Bot className="h-5 w-5 mr-3" />
              Ajuda da IA
            </Link>
            <button
              onClick={async () => {
                try {
                  // Desativa temporariamente o redirecionamento automático
                  localStorage.setItem('manual_redirect', 'true');
                  await signOut();
                  window.location.href = 'https://zobot.app';
                } catch (error) {
                  console.error('Erro ao fazer logout:', error);
                  window.location.href = 'https://zobot.app';
                }
              }}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sair
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Theme Toggle */}
          <div className="fixed top-4 right-4 z-10">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${
                isDark ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>

          {/* Overlay for mobile */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-0 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Content */}
          <div className="p-6 h-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  
  if (!session) {
    // Verifica se é um redirecionamento manual (logout)
    const manualRedirect = localStorage.getItem('manual_redirect');
    if (manualRedirect) {
      localStorage.removeItem('manual_redirect');
      return null;
    }
    return <Navigate to="/login" />;
  }

  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/resetar-senha" element={<ResetarSenha />} />
        <Route
          path="/minha-conta"
          element={
            <RotaProtegida>
              <MinhaConta />
            </RotaProtegida>
          }
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
          path="/configurar-agente"
          element={
            <RotaProtegida>
              <ConfigurarAgente />
            </RotaProtegida>
          }
        />
        <Route
          path="/configuracao-ia"
          element={
            <RotaProtegida>
              <ConfiguracaoIA />
            </RotaProtegida>
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;