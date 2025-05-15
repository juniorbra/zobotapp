import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface GoogleCalendarStatusProps {
  agentId?: string;
  onStatusChange?: (isConnected: boolean) => void;
}

interface CalendarSettings {
  access_mode: string;
  start_time: string;
  end_time: string;
  allowed_days: string[];
  default_duration: number;
  add_client_as_guest: boolean;
  auto_reschedule: boolean;
  auto_delete: boolean;
  custom_instructions: string;
}

const GoogleCalendarStatus: React.FC<GoogleCalendarStatusProps> = ({ agentId, onStatusChange }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<CalendarSettings>({
    access_mode: 'view_only',
    start_time: '08:00',
    end_time: '18:00',
    allowed_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    default_duration: 30,
    add_client_as_guest: true,
    auto_reschedule: false,
    auto_delete: false,
    custom_instructions: 'Sempre confirme com o cliente antes de agendar.\nEvite agendar compromissos fora do horário comercial.\nUse "Consulta" como título padrão dos eventos.'
  });

  useEffect(() => {
    const checkGoogleConnection = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Check if user has Google Calendar connected
        const { data, error } = await supabase
          .from('profiles')
          .select('google_calendar_connected')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        const isGoogleConnected = data?.google_calendar_connected || false;
        setIsConnected(isGoogleConnected);
        
        if (onStatusChange) {
          onStatusChange(isGoogleConnected);
        }
        
        // Always load agent settings if agent ID is provided, regardless of connection status
        // This ensures settings are preserved when disconnecting and reconnecting
        if (agentId) {
          loadAgentSettings(agentId);
        }
      } catch (error) {
        console.error('Error checking Google Calendar connection:', error);
        setIsConnected(false);
        if (onStatusChange) onStatusChange(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkGoogleConnection();
  }, [user, agentId, onStatusChange]);
  
  const loadAgentSettings = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select(`
          google_calendar_access_mode,
          google_calendar_start_time,
          google_calendar_end_time,
          google_calendar_allowed_days,
          google_calendar_default_duration,
          google_calendar_add_client_as_guest,
          google_calendar_auto_reschedule,
          google_calendar_auto_delete,
          google_calendar_custom_instructions
        `)
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setSettings({
          access_mode: data.google_calendar_access_mode || 'view_only',
          start_time: data.google_calendar_start_time?.substring(0, 5) || '08:00',
          end_time: data.google_calendar_end_time?.substring(0, 5) || '18:00',
          allowed_days: data.google_calendar_allowed_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          default_duration: data.google_calendar_default_duration || 30,
          add_client_as_guest: data.google_calendar_add_client_as_guest || true,
          auto_reschedule: data.google_calendar_auto_reschedule || false,
          auto_delete: data.google_calendar_auto_delete || false,
          custom_instructions: data.google_calendar_custom_instructions || 'Sempre confirme com o cliente antes de agendar.\nEvite agendar compromissos fora do horário comercial.\nUse "Consulta" como título padrão dos eventos.'
        });
      }
    } catch (error) {
      console.error('Error loading agent calendar settings:', error);
    }
  };
  
  const handleDisconnect = async () => {
    if (!user) return;
    
    try {
      // Update profile to disconnect Google Calendar
      const { error } = await supabase
        .from('profiles')
        .update({ google_calendar_connected: false })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // We don't clear the agent's Google Calendar settings
      // This way, when the user reconnects, the settings will still be available
      
      setIsConnected(false);
      if (onStatusChange) onStatusChange(false);
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
    }
  };
  
  // Connection status banner
  const renderConnectionStatus = () => {
    if (isConnected) {
      return (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-green-400 font-medium">Conectado ao Google Calendar</span>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Desconectar
          </button>
        </div>
      );
    } else {
      return (
        <div className="mb-6">
          <div className="p-4 text-center text-gray-400 bg-[#1e2738] rounded-lg mb-4">
            <p className="mb-4">Conecte-se ao Google Calendar para habilitar agendamentos automáticos.</p>
            <a
              href="https://accounts.google.com/o/oauth2/v2/auth?client_id=129040955497-3eci140g1va31b0as1vndd27rfksk1jl.apps.googleusercontent.com&redirect_uri=https://meu.zobot.top/oauth/google/callback&response_type=code&scope=https://www.googleapis.com/auth/calendar&access_type=offline&prompt=consent"
              className="w-full max-w-md mx-auto flex items-center justify-center bg-white text-gray-800 py-2 px-4 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal text-base shadow transition"
              style={{ minWidth: 260 }}
              onClick={() => {
                // Store the agent ID in localStorage before redirecting
                if (agentId) {
                  localStorage.setItem('current_agent_id', agentId);
                  console.log('[GoogleCalendarStatus] Stored agent ID in localStorage:', agentId);
                }
              }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path fill="#4285F4" d="M21.805 10.023h-9.765v3.954h5.592c-.241 1.262-1.45 3.707-5.592 3.707-3.363 0-6.099-2.785-6.099-6.207s2.736-6.207 6.099-6.207c1.92 0 3.21.819 3.948 1.523l2.697-2.62C17.13 2.7 14.98 1.7 12.5 1.7 6.977 1.7 2.5 6.18 2.5 11.5s4.477 9.8 10 9.8c5.74 0 9.5-4.03 9.5-9.7 0-.65-.07-1.14-.19-1.5z"/>
                </g>
              </svg>
              Conectar com Google Calendar
            </a>
          </div>
          {!agentId && (
            <div className="text-yellow-400 text-center">
              <p>Você precisa estar conectado ao Google Calendar para usar os recursos de agendamento.</p>
            </div>
          )}
        </div>
      );
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  
  // Store agent ID in localStorage when component mounts
  useEffect(() => {
    if (agentId) {
      localStorage.setItem('current_agent_id', agentId);
      console.log('[GoogleCalendarStatus] Stored agent ID in localStorage on mount:', agentId);
    }
  }, [agentId]);

  // Debug information
  console.log('[GoogleCalendarStatus] Rendering with:', {
    agentId,
    isConnected,
    isLoading,
    settingsLoaded: !!settings
  });

  // If no agent ID is provided and not connected, just show the connection UI
  if (!agentId && !isConnected) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p className="mb-4">Conecte-se ao Google Calendar para habilitar agendamentos automáticos.</p>
        <a
          href="https://accounts.google.com/o/oauth2/v2/auth?client_id=129040955497-3eci140g1va31b0as1vndd27rfksk1jl.apps.googleusercontent.com&redirect_uri=https://meu.zobot.top/oauth/google/callback&response_type=code&scope=https://www.googleapis.com/auth/calendar&access_type=offline&prompt=consent"
              className="w-full max-w-md mx-auto flex items-center justify-center bg-white text-gray-800 py-2 px-4 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal text-base shadow transition"
              style={{ minWidth: 260 }}
              onClick={() => {
                // Store the agent ID in localStorage before redirecting
                if (agentId) {
                  localStorage.setItem('current_agent_id', agentId);
                  console.log('[GoogleCalendarStatus] Stored agent ID in localStorage:', agentId);
                }
              }}
            >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <g>
              <path fill="#4285F4" d="M21.805 10.023h-9.765v3.954h5.592c-.241 1.262-1.45 3.707-5.592 3.707-3.363 0-6.099-2.785-6.099-6.207s2.736-6.207 6.099-6.207c1.92 0 3.21.819 3.948 1.523l2.697-2.62C17.13 2.7 14.98 1.7 12.5 1.7 6.977 1.7 2.5 6.18 2.5 11.5s4.477 9.8 10 9.8c5.74 0 9.5-4.03 9.5-9.7 0-.65-.07-1.14-.19-1.5z"/>
            </g>
          </svg>
          Conectar com Google Calendar
        </a>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* Connection status */}
      {isConnected ? (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-green-400 font-medium">Conectado ao Google Calendar</span>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Desconectar
          </button>
        </div>
      ) : (
        <div className="mb-6">
          <div className="p-4 text-center text-gray-400 bg-[#1e2738] rounded-lg mb-4">
            <p className="mb-4">Conecte-se ao Google Calendar para habilitar agendamentos automáticos.</p>
            <a
              href="https://accounts.google.com/o/oauth2/v2/auth?client_id=129040955497-3eci140g1va31b0as1vndd27rfksk1jl.apps.googleusercontent.com&redirect_uri=https://meu.zobot.top/oauth/google/callback&response_type=code&scope=https://www.googleapis.com/auth/calendar&access_type=offline&prompt=consent"
              className="w-full max-w-md mx-auto flex items-center justify-center bg-white text-gray-800 py-2 px-4 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal text-base shadow transition"
              style={{ minWidth: 260 }}
              onClick={() => {
                // Store the agent ID in localStorage before redirecting
                if (agentId) {
                  localStorage.setItem('current_agent_id', agentId);
                  console.log('[GoogleCalendarStatus] Stored agent ID in localStorage:', agentId);
                }
              }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path fill="#4285F4" d="M21.805 10.023h-9.765v3.954h5.592c-.241 1.262-1.45 3.707-5.592 3.707-3.363 0-6.099-2.785-6.099-6.207s2.736-6.207 6.099-6.207c1.92 0 3.21.819 3.948 1.523l2.697-2.62C17.13 2.7 14.98 1.7 12.5 1.7 6.977 1.7 2.5 6.18 2.5 11.5s4.477 9.8 10 9.8c5.74 0 9.5-4.03 9.5-9.7 0-.65-.07-1.14-.19-1.5z"/>
                </g>
              </svg>
              Conectar com Google Calendar
            </a>
          </div>
        </div>
      )}
      
      {/* Debug information */}
      <div className="bg-yellow-900/30 border border-yellow-600 text-yellow-200 rounded-lg p-4 mb-4">
        <p>Debug: agentId={agentId}, isConnected={isConnected.toString()}</p>
      </div>
      
      {/* Always show settings if agent ID is provided */}
      {agentId && (
        <div className="space-y-8">
          {/* Permissões do Agente */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">🔄 Permissões do Agente</h3>
            <p className="text-gray-400 mb-2">Modo de acesso ao Google Calendar:</p>
            <p className="text-gray-400 text-sm mb-4">Defina o que o agente pode fazer com seu calendário.</p>
            
            <div className="space-y-3">
              <label className="flex items-start">
                <input
                  type="radio"
                  name="access_mode"
                  value="view_only"
                  checked={settings.access_mode === 'view_only'}
                  onChange={() => setSettings({...settings, access_mode: 'view_only'})}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 bg-[#2a3042] border-[#374151]"
                />
                <div className="ml-3">
                  <span className="text-white">Apenas visualizar disponibilidade</span>
                  <p className="text-gray-400 text-sm">A IA pode consultar eventos, mas não pode agendar nada</p>
                </div>
              </label>
              
              <label className="flex items-start">
                <input
                  type="radio"
                  name="access_mode"
                  value="create_events"
                  checked={settings.access_mode === 'create_events'}
                  onChange={() => setSettings({...settings, access_mode: 'create_events'})}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 bg-[#2a3042] border-[#374151]"
                />
                <div className="ml-3">
                  <span className="text-white">Criar eventos</span>
                  <p className="text-gray-400 text-sm">A IA pode agendar compromissos, mas não pode alterar nem excluir</p>
                </div>
              </label>
              
              <label className="flex items-start">
                <input
                  type="radio"
                  name="access_mode"
                  value="create_edit_events"
                  checked={settings.access_mode === 'create_edit_events'}
                  onChange={() => setSettings({...settings, access_mode: 'create_edit_events'})}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 bg-[#2a3042] border-[#374151]"
                />
                <div className="ml-3">
                  <span className="text-white">Criar e editar eventos</span>
                  <p className="text-gray-400 text-sm">A IA pode agendar e atualizar eventos já existentes</p>
                </div>
              </label>
              
              <label className="flex items-start">
                <input
                  type="radio"
                  name="access_mode"
                  value="full_control"
                  checked={settings.access_mode === 'full_control'}
                  onChange={() => setSettings({...settings, access_mode: 'full_control'})}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 bg-[#2a3042] border-[#374151]"
                />
                <div className="ml-3">
                  <span className="text-white">Controle total</span>
                  <p className="text-gray-400 text-sm">A IA pode criar, editar e excluir eventos</p>
                </div>
              </label>
            </div>
          </div>
          
          {/* Horários e Dias Permitidos */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">📆 Horários e Dias Permitidos</h3>
            
            <div className="mb-6">
              <p className="text-gray-400 mb-2">Horário disponível para agendamentos:</p>
              <p className="text-gray-400 text-sm mb-4">Limite os horários em que os compromissos podem ser agendados.</p>
              
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-gray-400 mb-1">Início:</label>
                  <input
                    type="time"
                    value={settings.start_time}
                    onChange={(e) => setSettings({...settings, start_time: e.target.value})}
                    className="bg-[#2a3042] border border-[#374151] rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 mb-1">Fim:</label>
                  <input
                    type="time"
                    value={settings.end_time}
                    onChange={(e) => setSettings({...settings, end_time: e.target.value})}
                    className="bg-[#2a3042] border border-[#374151] rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-gray-400 mb-2">Dias permitidos para agendamento:</p>
              <p className="text-gray-400 text-sm mb-4">Marque os dias da semana em que a IA pode agendar.</p>
              
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.allowed_days.includes('monday')}
                    onChange={(e) => {
                      const newDays = e.target.checked 
                        ? [...settings.allowed_days, 'monday'] 
                        : settings.allowed_days.filter(d => d !== 'monday');
                      setSettings({...settings, allowed_days: newDays});
                    }}
                    className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 bg-[#2a3042] border-[#374151]"
                  />
                  <span className="ml-2 text-white">Segunda-feira</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.allowed_days.includes('tuesday')}
                    onChange={(e) => {
                      const newDays = e.target.checked 
                        ? [...settings.allowed_days, 'tuesday'] 
                        : settings.allowed_days.filter(d => d !== 'tuesday');
                      setSettings({...settings, allowed_days: newDays});
                    }}
                    className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 bg-[#2a3042] border-[#374151]"
                  />
                  <span className="ml-2 text-white">Terça-feira</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.allowed_days.includes('wednesday')}
                    onChange={(e) => {
                      const newDays = e.target.checked 
                        ? [...settings.allowed_days, 'wednesday'] 
                        : settings.allowed_days.filter(d => d !== 'wednesday');
                      setSettings({...settings, allowed_days: newDays});
                    }}
                    className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 bg-[#2a3042] border-[#374151]"
                  />
                  <span className="ml-2 text-white">Quarta-feira</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.allowed_days.includes('thursday')}
                    onChange={(e) => {
                      const newDays = e.target.checked 
                        ? [...settings.allowed_days, 'thursday'] 
                        : settings.allowed_days.filter(d => d !== 'thursday');
                      setSettings({...settings, allowed_days: newDays});
                    }}
                    className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 bg-[#2a3042] border-[#374151]"
                  />
                  <span className="ml-2 text-white">Quinta-feira</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.allowed_days.includes('friday')}
                    onChange={(e) => {
                      const newDays = e.target.checked 
                        ? [...settings.allowed_days, 'friday'] 
                        : settings.allowed_days.filter(d => d !== 'friday');
                      setSettings({...settings, allowed_days: newDays});
                    }}
                    className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 bg-[#2a3042] border-[#374151]"
                  />
                  <span className="ml-2 text-white">Sexta-feira</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.allowed_days.includes('saturday')}
                    onChange={(e) => {
                      const newDays = e.target.checked 
                        ? [...settings.allowed_days, 'saturday'] 
                        : settings.allowed_days.filter(d => d !== 'saturday');
                      setSettings({...settings, allowed_days: newDays});
                    }}
                    className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 bg-[#2a3042] border-[#374151]"
                  />
                  <span className="ml-2 text-white">Sábado</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.allowed_days.includes('sunday')}
                    onChange={(e) => {
                      const newDays = e.target.checked 
                        ? [...settings.allowed_days, 'sunday'] 
                        : settings.allowed_days.filter(d => d !== 'sunday');
                      setSettings({...settings, allowed_days: newDays});
                    }}
                    className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 bg-[#2a3042] border-[#374151]"
                  />
                  <span className="ml-2 text-white">Domingo</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Configurações de Evento */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">⏱️ Configurações de Evento</h3>
            
            <div className="mb-6">
              <p className="text-gray-400 mb-2">Duração padrão dos eventos:</p>
              <p className="text-gray-400 text-sm mb-4">Caso o cliente não informe a duração, será usada esta.</p>
              
              <div className="flex items-center">
                <input
                  type="number"
                  min="5"
                  max="240"
                  value={settings.default_duration}
                  onChange={(e) => setSettings({...settings, default_duration: parseInt(e.target.value) || 30})}
                  className="w-20 bg-[#2a3042] border border-[#374151] rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-400">minutos</span>
              </div>
            </div>
            
            <div>
              <p className="text-gray-400 mb-2">Adicionar cliente como convidado no Google Calendar?</p>
              <p className="text-gray-400 text-sm mb-4">O cliente será incluído como participante do evento com base no e-mail informado.</p>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="add_client"
                    checked={settings.add_client_as_guest}
                    onChange={() => setSettings({...settings, add_client_as_guest: true})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 bg-[#2a3042] border-[#374151]"
                  />
                  <span className="ml-2 text-white">Sim</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="add_client"
                    checked={!settings.add_client_as_guest}
                    onChange={() => setSettings({...settings, add_client_as_guest: false})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 bg-[#2a3042] border-[#374151]"
                  />
                  <span className="ml-2 text-white">Não</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Comportamento Inteligente da IA */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">⚙️ Comportamento Inteligente da IA</h3>
            
            <div className="mb-6">
              <p className="text-gray-400 mb-2">A IA pode reagendar eventos automaticamente?</p>
              <p className="text-gray-400 text-sm mb-4">Se o cliente pedir para remarcar ou se houver conflito de horário, a IA pode buscar novo horário e atualizar o evento automaticamente.</p>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="auto_reschedule"
                    checked={settings.auto_reschedule}
                    onChange={() => setSettings({...settings, auto_reschedule: true})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 bg-[#2a3042] border-[#374151]"
                  />
                  <span className="ml-2 text-white">Sim</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="auto_reschedule"
                    checked={!settings.auto_reschedule}
                    onChange={() => setSettings({...settings, auto_reschedule: false})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 bg-[#2a3042] border-[#374151]"
                  />
                  <span className="ml-2 text-white">Não (a IA apenas pergunta ao cliente e aguarda autorização)</span>
                </label>
              </div>
            </div>
            
            <div>
              <p className="text-gray-400 mb-2">A IA pode excluir eventos?</p>
              <p className="text-gray-400 text-sm mb-4">Caso o cliente diga que deseja cancelar o compromisso, a IA pode remover o evento automaticamente.</p>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="auto_delete"
                    checked={settings.auto_delete}
                    onChange={() => setSettings({...settings, auto_delete: true})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 bg-[#2a3042] border-[#374151]"
                  />
                  <span className="ml-2 text-white">Sim</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="auto_delete"
                    checked={!settings.auto_delete}
                    onChange={() => setSettings({...settings, auto_delete: false})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 bg-[#2a3042] border-[#374151]"
                  />
                  <span className="ml-2 text-white">Não (a IA apenas sinaliza o cancelamento sem excluir)</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Instruções personalizadas */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">💬 Instruções personalizadas para o agente</h3>
            <p className="text-gray-400 mb-2">Frases que o agente deve seguir ao falar sobre agendamentos:</p>
            <p className="text-gray-400 text-sm mb-4">Dicas de tom de voz ou frases obrigatórias (opcional).</p>
            
            <textarea
              value={settings.custom_instructions}
              onChange={(e) => setSettings({...settings, custom_instructions: e.target.value})}
              className="w-full bg-[#2a3042] border border-[#374151] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
              placeholder="Instruções personalizadas para o agente..."
            ></textarea>
          </div>
          
          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={async () => {
                if (!user || !agentId) return;
                
                try {
                  const { error } = await supabase
                    .from('agents')
                    .update({
                      google_calendar_access_mode: settings.access_mode,
                      google_calendar_start_time: settings.start_time,
                      google_calendar_end_time: settings.end_time,
                      google_calendar_allowed_days: settings.allowed_days,
                      google_calendar_default_duration: settings.default_duration,
                      google_calendar_add_client_as_guest: settings.add_client_as_guest,
                      google_calendar_auto_reschedule: settings.auto_reschedule,
                      google_calendar_auto_delete: settings.auto_delete,
                      google_calendar_custom_instructions: settings.custom_instructions
                    })
                    .eq('id', agentId)
                    .eq('user_id', user.id);
                  
                  if (error) throw error;
                  
                  alert('Configurações de agendamento salvas com sucesso!');
                } catch (error) {
                  console.error('Error saving calendar settings:', error);
                  alert('Erro ao salvar configurações de agendamento.');
                }
              }}
              className="px-6 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg"
            >
              Salvar Configurações
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarStatus;
