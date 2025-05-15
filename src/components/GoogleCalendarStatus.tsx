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

  // Store agent ID in localStorage when component mounts
  useEffect(() => {
    if (agentId) {
      localStorage.setItem('current_agent_id', agentId);
      console.log('[GoogleCalendarStatus] Stored agent ID in localStorage on mount:', agentId);
    }
  }, [agentId]);

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
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
            </div>
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
