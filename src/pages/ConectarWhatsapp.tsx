import React, { useState, useEffect } from 'react';
import { QrCode } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface WhatsAppResponse {
  base64: string;
  pairingCode: string;
}

interface ConnectionState {
  instance?: {
    instanceName: string;
    state: string;
  };
  erro?: string;
}

export default function ConectarWhatsapp() {
  const { user } = useAuth();
  const [countryCode, setCountryCode] = useState('+55');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qrCodeData, setQrCodeData] = useState<WhatsAppResponse | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ text: string; color: string }>({
    text: 'Status Conexão',
    color: 'text-gray-600'
  });
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [instanceName, setInstanceName] = useState<string | null>(null);

  // Fetch connection state from wa_connections table
  const fetchConnectionState = async () => {
    if (!user?.id) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('wa_connections')
        .select('instance_name, state')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching connection state:', error);
        return null;
      }

      console.log('Fetched connection state from database:', data);
      return data;
    } catch (error) {
      console.error('Error in fetchConnectionState:', error);
      return null;
    }
  };

  // Update connection state in wa_connections table
  const updateConnectionState = async (instanceName: string, state: string) => {
    if (!user?.id) {
      return;
    }

    try {
      // Check if a record already exists
      const { data: existingData } = await supabase
        .from('wa_connections')
        .select('id')
        .eq('user_id', user.id)
        .eq('instance_name', instanceName)
        .single();

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('wa_connections')
          .update({ state })
          .eq('id', existingData.id);

        if (error) {
          console.error('Error updating connection state:', error);
        }
      } else {
        // Insert new record
        const { error } = await supabase
          .from('wa_connections')
          .insert([
            {
              user_id: user.id,
              instance_name: instanceName,
              state
            }
          ]);

        if (error) {
          console.error('Error inserting connection state:', error);
        }
      }
    } catch (error) {
      console.error('Error in updateConnectionState:', error);
    }
  };

  // Load connection state on component mount and periodically
  useEffect(() => {
    const loadInitialState = async () => {
      if (user?.id) {
        console.log('Loading initial connection state...');
        
        try {
          // Directly fetch from database first
          const connectionData = await fetchConnectionState();
          console.log('Initial connection data from database:', connectionData);
          
          if (connectionData && connectionData.state) {
            setInstanceName(connectionData.instance_name);
            const status = getStatusFromState(connectionData.state);
            console.log('Setting initial status from database state:', connectionData.state, 'to UI status:', status);
            setConnectionStatus(status);
            
            // If the state is 'open', also show the disconnect button
            if (connectionData.state === 'open') {
              console.log('Connection is open, showing disconnect button');
            }
            
            // If the state is 'connecting', we should try to get the QR code
            if (connectionData.state === 'connecting' && !qrCodeData) {
              console.log('Connection is in connecting state, checking for QR code');
              // We don't have the QR code data stored, so we need to get it from the API
              // This is just a placeholder - in a real implementation, you would need to
              // fetch the QR code from the API or have it stored somewhere
            }
          } else {
            console.log('No initial connection data found, checking with API');
            // If no data in database, perform a full check
            await checkConnectionState();
          }
        } catch (error) {
          console.error('Error loading initial state:', error);
          // Fallback to full check
          await checkConnectionState();
        }
      }
    };
    
    // Load initial state
    loadInitialState();
    
    // Set up periodic checking (every 10 seconds)
    const intervalId = setInterval(() => {
      if (user?.id && !isCheckingConnection && !isDisconnecting) {
        checkConnectionState();
      }
    }, 10000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [user]);

  // Map database states to UI text
  const getStatusFromState = (state: string) => {
    switch (state) {
      case 'connecting':
        return { text: 'Conectando', color: 'text-orange-600' };
      case 'open':
        return { text: 'Conectado', color: 'text-green-600' };
      case 'closed':
      case 'disconnected':
        return { text: 'Desconectado', color: 'text-red-600' };
      case 'verifying':
        return { text: 'Verificando...', color: 'text-yellow-600' };
      default:
        return { text: 'Desconectado', color: 'text-red-600' };
    }
  };

  const checkConnectionState = async () => {
    if (!user?.id) {
      return;
    }
    
    setIsCheckingConnection(true);
    
    // Set UI to checking state
    setConnectionStatus({ text: 'Verificando...', color: 'text-yellow-600' });

    try {
      // First check the database
      const connectionData = await fetchConnectionState();
      
      console.log('Current connection data from database:', connectionData);
      
      // If we have valid data in the database
      if (connectionData && connectionData.state) {
        setInstanceName(connectionData.instance_name);
        
        // Only update the database if we're not already in verifying state
        if (connectionData.state !== 'verifying') {
          // Map the database state to UI status
          const status = getStatusFromState(connectionData.state);
          console.log('Setting status from database state:', connectionData.state, 'to UI status:', status);
          setConnectionStatus(status);
        } else {
          // If we're in verifying state, check with the API
          await checkWithAPI();
        }
      } else {
        // If no data in database, check with the API
        await checkWithAPI();
      }
    } catch (error) {
      console.error('Error checking connection state:', error);
      setConnectionStatus({ text: 'Desconectado', color: 'text-red-600' });
    } finally {
      setIsCheckingConnection(false);
    }
  };

  // Helper function to check connection with API
  const checkWithAPI = async () => {
    if (!user?.email || !user?.id) return;
    
    try {
      const response = await fetch('https://webhooks.botvance.com.br/webhook/bbbb1235-0cad-482d-ae30-b49ba0122aad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          action: 'check_connection'
        }),
      });

      if (!response.ok) {
        setConnectionStatus({ text: 'Desconectado', color: 'text-red-600' });
        // If we have an instance name, update the database
        if (instanceName) {
          await updateConnectionState(instanceName, 'closed');
        }
        return;
      }

      const data = await response.json();
      console.log('API response:', data);
      
      // Handle array response format
      const instanceData = Array.isArray(data) ? data[0] : data;
      
      if (instanceData.erro) {
        console.log('API returned error, setting state to closed');
        setConnectionStatus({ text: 'Desconectado', color: 'text-red-600' });
        // Update database with disconnected state
        if (instanceName) {
          await updateConnectionState(instanceName, 'closed');
        }
      } else if (instanceData.instance?.state === 'connecting') {
        console.log('API state is connecting');
        setConnectionStatus({ text: 'Conectando', color: 'text-orange-600' });
        setInstanceName(instanceData.instance.instanceName);
        // Update database
        await updateConnectionState(instanceData.instance.instanceName, 'connecting');
      } else if (instanceData.instance?.state === 'open') {
        console.log('API state is open');
        setConnectionStatus({ text: 'Conectado', color: 'text-green-600' });
        setInstanceName(instanceData.instance.instanceName);
        // Update database
        await updateConnectionState(instanceData.instance.instanceName, 'open');
      } else {
        console.log('API returned unknown state, setting to closed');
        setConnectionStatus({ text: 'Desconectado', color: 'text-red-600' });
        // Update database with disconnected state
        if (instanceName) {
          await updateConnectionState(instanceName, 'closed');
        }
      }
    } catch (error) {
      console.error('Error in checkWithAPI:', error);
      setConnectionStatus({ text: 'Desconectado', color: 'text-red-600' });
    }
  };

  const handleDisconnect = async () => {
    if (!user?.email || !user?.id) {
      setError('Usuário não está autenticado');
      return;
    }
    
    setIsDisconnecting(true);
    setError(''); // Clear any previous errors
    try {
      console.log('Iniciando desconexão para:', user.email);
      const response = await fetch('https://webhooks.botvance.com.br/webhook/742674d8-4fb7-4be6-bfe9-d5d5ba2ed2f7', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          action: 'disconnect' // Adding action parameter
        }),
      });

      const responseText = await response.text();
      console.log('Resposta do servidor:', responseText);

      if (!response.ok) {
        throw new Error(`Falha ao desconectar WhatsApp: ${responseText}`);
      }

      // Update connection state in database
      if (instanceName) {
        await updateConnectionState(instanceName, 'closed');
      }

      setConnectionStatus({ text: 'Desconectado', color: 'text-red-600' });
      setQrCodeData(null);
    } catch (err) {
      console.error('Erro na desconexão:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao desconectar WhatsApp';
      setError(errorMessage);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!user?.email || !user?.id) {
        throw new Error('Usuário não está autenticado');
      }

      const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
      
      const response = await fetch('https://webhooks.botvance.com.br/webhook/8ce3cd0c-fb7b-4727-9782-92bfe292f3c9', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          telefone: fullPhoneNumber
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao conectar WhatsApp: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data?.base64) {
        throw new Error('QR Code inválido recebido do servidor');
      }

      // When QR code is generated, update the connection state to 'connecting'
      // We'll use a temporary instance name based on the phone number until we get the real one
      const tempInstanceName = `wa_${fullPhoneNumber.replace(/\D/g, '')}`;
      await updateConnectionState(tempInstanceName, 'connecting');
      setInstanceName(tempInstanceName);
      
      setQrCodeData(data);
      setConnectionStatus({ text: 'Conectando', color: 'text-orange-600' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao conectar WhatsApp';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center mb-8">
          <QrCode className="h-12 w-12 text-blue-600" />
          <h1 className="ml-4 text-3xl font-bold text-gray-900">
            Conectar WhatsApp
          </h1>
        </div>

        {/* Status Indicator */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus.text === 'Conectado' ? 'bg-green-500' :
              connectionStatus.text === 'Conectando' ? 'bg-orange-500' :
              connectionStatus.text === 'Verificando...' ? 'bg-yellow-500' :
              connectionStatus.text === 'Desconectado' ? 'bg-red-500' : 'bg-gray-400'
            }`} />
            <span className={`font-medium ${connectionStatus.color}`}>
              {connectionStatus.text}
            </span>
          </div>
          <button
            onClick={async () => {
              // Force a fresh check with the database first
              const connectionData = await fetchConnectionState();
              if (connectionData && connectionData.state) {
                console.log('Manual check - connection data from database:', connectionData);
                setInstanceName(connectionData.instance_name);
                const status = getStatusFromState(connectionData.state);
                console.log('Manual check - setting status from database state:', connectionData.state, 'to UI status:', status);
                setConnectionStatus(status);
              } else {
                // If no data in database, do a full check
                checkConnectionState();
              }
            }}
            disabled={isCheckingConnection}
            className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isCheckingConnection ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Verificar
          </button>
          {(connectionStatus.text === 'Conectado' || connectionStatus.color === 'text-green-600') && (
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className={`px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                isDisconnecting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Desconectar
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!qrCodeData ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Número do WhatsApp
              </label>
              <div className="flex">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="+55">+55</option>
                </select>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="DDD + Número"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Conectando...' : 'Conectar WhatsApp'}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Escaneie o QR Code</h2>
            <div className="mb-4">
              {qrCodeData.base64 ? (
                <img
                  src={qrCodeData.base64}
                  alt="QR Code WhatsApp"
                  className="mx-auto"
                />
              ) : (
                <p className="text-red-600">QR Code não disponível</p>
              )}
            </div>
            {qrCodeData.pairingCode && (
              <p className="text-gray-600 mb-4">
                Código de pareamento: <span className="font-mono font-bold">{qrCodeData.pairingCode}</span>
              </p>
            )}
            <button
              onClick={() => setQrCodeData(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
