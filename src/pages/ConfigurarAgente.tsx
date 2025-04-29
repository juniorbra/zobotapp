import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { QrCode } from 'lucide-react';
import PromptAssistant from '../components/PromptAssistant';

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

interface AgentForm {
  // Informações Básicas (Step 1)
  name: string;
  description: string;
  active: boolean;
  
  // Configurar IA (Step 2)
  type: string;
  model: string;
  prompt: string;
  
  // Conectar com WhatsApp (Step 3)
  webhook_url: string;
  
  // Configurar Respostas (Step 4)
  response_template: string;
  
  // Configurações Adicionais (Step 5)
  advanced_settings: {
    temperature: number;
    max_tokens: number;
  };
}

const ConfigurarAgente: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNewAgent = id === 'new';
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  // Submenu state for IA config vs Prompt Assistant (must be at top level)
  const [iaTab, setIaTab] = useState<'config' | 'assistant'>('config');
  
  const [form, setForm] = useState<AgentForm>({
    name: '',
    description: '',
    active: true,
    type: 'OPENAI',
    model: 'gpt-3.5-turbo',
    prompt: '',
    webhook_url: '',
    response_template: '',
    advanced_settings: {
      temperature: 0.7,
      max_tokens: 2000
    }
  });
  const [isDirty, setIsDirty] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // WhatsApp connection states
  const [countryCode, setCountryCode] = useState('+55');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qrCodeData, setQrCodeData] = useState<WhatsAppResponse | null>(null);
  const [whatsappError, setWhatsappError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ text: string; color: string }>({
    text: 'Status Conexão',
    color: 'text-gray-400'
  });
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // WhatsApp connection functions
  const checkConnectionState = async () => {
    if (!user?.email) {
      return;
    }
    
    setIsCheckingConnection(true);
    setConnectionStatus({ text: 'Verificando...', color: 'text-yellow-400' });

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
        setConnectionStatus({ text: 'Desconectado', color: 'text-red-400' });
        return;
      }

      const data = await response.json();
      
      // Handle array response format
      const instanceData = Array.isArray(data) ? data[0] : data;
      
      if (instanceData.erro) {
        setConnectionStatus({ text: 'Desconectado', color: 'text-red-400' });
      } else if (instanceData.instance?.state === 'connecting') {
        setConnectionStatus({ text: 'Conectando', color: 'text-orange-400' });
      } else if (instanceData.instance?.state === 'open') {
        setConnectionStatus({ text: 'Conectado', color: 'text-green-400' });
      } else {
        setConnectionStatus({ text: 'Desconectado', color: 'text-red-400' });
      }
    } catch (error) {
      setConnectionStatus({ text: 'Desconectado', color: 'text-red-400' });
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user?.email) {
      setWhatsappError('Usuário não está autenticado');
      return;
    }
    
    setIsDisconnecting(true);
    setWhatsappError(''); // Clear any previous errors
    try {
      const response = await fetch('https://webhooks.botvance.com.br/webhook/742674d8-4fb7-4be6-bfe9-d5d5ba2ed2f7', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          action: 'disconnect'
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Falha ao desconectar WhatsApp: ${responseText}`);
      }

      setConnectionStatus({ text: 'Desconectado', color: 'text-red-400' });
      setQrCodeData(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao desconectar WhatsApp';
      setWhatsappError(errorMessage);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleConnectWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setWhatsappError('');

    try {
      if (!user?.email) {
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

      setQrCodeData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao conectar WhatsApp';
      setWhatsappError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Só busca dados se houver id válido (edição)
    if (id && id !== 'new') {
      fetchAgentData();
    }
  }, [id, user, navigate]);

  const fetchAgentData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setForm({
          name: data.name || '',
          description: data.description || '',
          active: data.active || false,
          type: data.type || 'DIFY',
          model: data.model || 'gpt-3.5-turbo',
          prompt: data.prompt || '',
          webhook_url: data.webhook_url || '',
          response_template: data.response_template || '',
          advanced_settings: data.advanced_settings || {
            temperature: 0.7,
            max_tokens: 2000
          }
        });
      }
    } catch (error) {
      console.error('Error fetching agent:', error);
      setError('Não foi possível carregar os dados do agente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    setIsDirty(true);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleAdvancedSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      advanced_settings: {
        ...prev.advanced_settings,
        [name]: name === 'temperature' ? parseFloat(value) : parseInt(value)
      }
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    
    if (!form.name.trim()) {
      setError('O nome do agente é obrigatório.');
      setCurrentStep(1); // Voltar para o primeiro passo se o nome estiver vazio
      return;
    }

    try {
      setSaving(true);

      // Se for novo agente, insere e redireciona para edição com o novo id
      if (isNewAgent) {
        const { data, error } = await supabase
          .from('agents')
          .insert([
            {
              name: form.name,
              description: form.description,
              active: form.active,
              type: form.type,
              prompt: form.prompt,
              model: form.model,
              webhook_url: form.webhook_url,
              response_template: form.response_template,
              advanced_settings: form.advanced_settings,
              user_id: user?.id
            }
          ])
          .select()
          .single();

        if (error) throw error;

        setSuccess('Agente criado com sucesso!');
        // Redireciona para a edição do novo agente para evitar id=undefined em updates
        setTimeout(() => {
          if (data && data.id) {
            navigate(`/configurar-agente/${data.id}`);
          } else {
            navigate('/');
          }
        }, 1000);
      } else if (id && id !== 'new') {
        // Update existing agent
        const { error } = await supabase
          .from('agents')
          .update({
            name: form.name,
            description: form.description,
            active: form.active,
            type: form.type,
            prompt: form.prompt,
            model: form.model,
            webhook_url: form.webhook_url,
            response_template: form.response_template,
            advanced_settings: form.advanced_settings
          })
          .eq('id', id)
          .eq('user_id', user?.id);

        if (error) throw error;
        
        setSuccess('Agente atualizado com sucesso!');
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (error) {
      console.error('Error saving agent:', error);
      setError('Ocorreu um erro ao salvar o agente.');
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/painel-controle');
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  };

  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        // Função para salvar no webhook
        const handleSalvarBasico = async () => {
          try {
            const payload = {
              name: form.name,
              description: form.description,
              active: form.active
            };
            await fetch('https://webhooks.botvance.com.br/webhook/41869a3e-8f88-45da-82a5-zobotapp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            setSuccess('Dados enviados para o webhook com sucesso!');
          } catch (err) {
            setError('Erro ao enviar dados para o webhook.');
          }
        };

        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">Informações Básicas</h3>
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Nome do Agente</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full bg-[#2a3042] border border-[#374151] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Assistente de Vendas"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Descrição</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full bg-[#2a3042] border border-[#374151] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                placeholder="Descreva o propósito deste agente..."
              ></textarea>
            </div>
            
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleCheckboxChange}
                  className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 bg-[#2a3042] border-[#374151]"
                />
                <span className="ml-2 text-gray-300">Ativo</span>
              </label>
            </div>
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 bg-[#2a3042] hover:bg-[#374151] rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarBasico}
                className="px-6 py-2 bg-[#3b82f6] hover:bg-[#2563eb] rounded-lg"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-[#2a3042] hover:bg-[#374151] rounded-lg"
              >
                Próximo
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <div className="flex mb-6 border-b border-[#2a3042]">
              <button
                onClick={() => setIaTab('config')}
                className={`px-6 py-3 font-medium ${
                  iaTab === 'config'
                    ? 'text-[#3b82f6] border-b-2 border-[#3b82f6]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Configuração IA
              </button>
              <button
                onClick={() => setIaTab('assistant')}
                className={`px-6 py-3 font-medium ${
                  iaTab === 'assistant'
                    ? 'text-[#3b82f6] border-b-2 border-[#3b82f6]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Assistente de Prompt
              </button>
            </div>
            {iaTab === 'config' ? (
              <>
                <h3 className="text-xl font-semibold mb-4">Configurar IA</h3>
                <div className="mb-6">
                  <label className="block text-gray-300 mb-2">Tipo</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full bg-[#2a3042] border border-[#374151] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="OPENAI">OpenAI</option>
                  </select>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-300 mb-2">Modelo</label>
                  <select
                    name="model"
                    value={form.model}
                    onChange={handleChange}
                    className="w-full bg-[#2a3042] border border-[#374151] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-3.5-turbo-16k">GPT-3.5 Turbo 16K</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-32k">GPT-4 32K</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-4-turbo-preview">GPT-4 Turbo Preview</option>
                    <option value="gpt-4.1">GPT-4.1</option>
                    <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                    <option value="text-embedding-ada-002">Text Embedding Ada 002</option>
                    <option value="text-davinci-003">Text Davinci 003</option>
                  </select>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-300 mb-2">Prompt do Sistema</label>
                  <textarea
                    name="prompt"
                    value={form.prompt}
                    onChange={handleChange}
                    className="w-full bg-[#2a3042] border border-[#374151] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-48 font-mono"
                    placeholder="Insira o prompt do sistema para o agente..."
                  ></textarea>
                </div>
              </>
            ) : (
              <PromptAssistant />
            )}
          </div>
        );

  // Check connection state when step 3 is active
  useEffect(() => {
    if (currentStep === 3) {
      checkConnectionState();
    }
  }, [currentStep]);

      case 3:
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">Conectar com WhatsApp</h3>
            
            {/* Status Indicator */}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#374151] bg-[#2a3042]">
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
                onClick={checkConnectionState}
                disabled={isCheckingConnection}
                className={`px-4 py-2 text-sm font-medium text-white bg-[#3b82f6] hover:bg-[#2563eb] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isCheckingConnection ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Verificar
              </button>
              {connectionStatus.text === 'Conectado' && (
                <button
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className={`px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isDisconnecting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Desconectar
                </button>
              )}
            </div>

            {whatsappError && (
              <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
                {whatsappError}
              </div>
            )}

            {!qrCodeData ? (
              <div className="bg-[#1e2738] p-6 rounded-lg mb-6">
                <div className="flex items-center mb-4">
                  <QrCode className="h-6 w-6 text-[#3b82f6] mr-2" />
                  <h4 className="text-lg font-medium">Conectar WhatsApp</h4>
                </div>
                
                <form onSubmit={handleConnectWhatsApp} className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2">
                      Número do WhatsApp
                    </label>
                    <div className="flex">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-24 px-3 py-2 bg-[#2a3042] border border-[#374151] rounded-l-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="+55">+55</option>
                      </select>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="DDD + Número"
                        className="flex-1 px-3 py-2 bg-[#2a3042] border border-[#374151] rounded-r-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isConnecting}
                    className={`w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${
                      isConnecting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isConnecting ? 'Conectando...' : 'Conectar WhatsApp'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-[#1e2738] p-6 rounded-lg mb-6 text-center">
                <h4 className="text-lg font-medium mb-4">Escaneie o QR Code</h4>
                <div className="mb-4 bg-white p-4 inline-block rounded">
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
                  <p className="text-gray-300 mb-4">
                    Código de pareamento: <span className="font-mono font-bold">{qrCodeData.pairingCode}</span>
                  </p>
                )}
                <button
                  onClick={() => setQrCodeData(null)}
                  className="text-[#3b82f6] hover:text-[#2563eb]"
                >
                  Tentar novamente
                </button>
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">URL do Webhook (Opcional)</label>
              <input
                type="text"
                name="webhook_url"
                value={form.webhook_url}
                onChange={handleChange}
                className="w-full bg-[#2a3042] border border-[#374151] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://seu-webhook.com/api/whatsapp"
              />
              <p className="text-gray-400 text-sm mt-2">
                Configure um webhook adicional para integração personalizada (opcional)
              </p>
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">Configurar Respostas</h3>
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Template de Resposta</label>
              <textarea
                name="response_template"
                value={form.response_template}
                onChange={handleChange}
                className="w-full bg-[#2a3042] border border-[#374151] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-48 font-mono"
                placeholder="Configure como seu agente responderá às mensagens..."
              ></textarea>
              <p className="text-gray-400 text-sm mt-2">
                Use variáveis como {"{{nome_cliente}}"} para personalizar as respostas
              </p>
            </div>
            
            <div className="bg-[#1e2738] p-4 rounded-lg mb-6">
              <h4 className="text-lg font-medium mb-2">Variáveis Disponíveis</h4>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li>{"{{nome_cliente}}"} - Nome do cliente</li>
                <li>{"{{data}}"} - Data atual</li>
                <li>{"{{hora}}"} - Hora atual</li>
                <li>{"{{mensagem}}"} - Mensagem recebida</li>
              </ul>
            </div>
          </div>
        );
      case 5:
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">Configurações Adicionais</h3>
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">
                Temperatura: {form.advanced_settings.temperature}
              </label>
              <input
                type="range"
                name="temperature"
                min="0"
                max="1"
                step="0.1"
                value={form.advanced_settings.temperature}
                onChange={handleAdvancedSettingsChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Mais preciso</span>
                <span>Mais criativo</span>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">
                Máximo de Tokens: {form.advanced_settings.max_tokens}
              </label>
              <input
                type="range"
                name="max_tokens"
                min="100"
                max="4000"
                step="100"
                value={form.advanced_settings.max_tokens}
                onChange={handleAdvancedSettingsChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Respostas curtas</span>
                <span>Respostas longas</span>
              </div>
            </div>
            
            <div className="bg-[#1e2738] p-4 rounded-lg mb-6">
              <h4 className="text-lg font-medium mb-2">Configurações de Sessão</h4>
              <p className="text-gray-300 mb-2">
                Configure como o agente deve se comportar durante a sessão de conversa.
              </p>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 bg-[#2a3042] border-[#374151]"
                    defaultChecked
                  />
                  <span className="ml-2 text-gray-300">Manter histórico de conversa</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 bg-[#2a3042] border-[#374151]"
                    defaultChecked
                  />
                  <span className="ml-2 text-gray-300">Permitir anexos</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 bg-[#2a3042] border-[#374151]"
                  />
                  <span className="ml-2 text-gray-300">Modo de depuração</span>
                </label>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white">
      {/* Header */}
      <header className="bg-[#131825] p-4 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={() => {
              if (isDirty) {
                const confirm = window.confirm('Existem alterações não salvas. Tem certeza que deseja sair?');
                if (!confirm) return;
              }
              navigate('/painel-controle');
            }}
            className="flex items-center text-white mr-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8l-4 4m0 0l4 4m-4-4h18" />
            </svg>
            <span className="ml-2">Sair</span>
          </button>
          <h1 className="text-2xl font-bold">Editar Configurações do Agente</h1>
        </div>
        <div className="flex items-center">
          <button 
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-6 py-2 rounded-lg mr-4"
          >
            {saving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                <span>Salvando...</span>
              </div>
            ) : (
              'Salvar Alterações'
            )}
          </button>
          <button
            onClick={() => navigate('/minha-conta')}
            className="flex items-center bg-[#2a3042] hover:bg-[#374151] rounded-full p-2 mr-2"
            title="Minha Conta"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
          <div className="flex items-center bg-[#2a3042] rounded-full px-4 py-2">
            <img src="https://flagcdn.com/br.svg" alt="Bandeira do Brasil" className="h-5 w-5 mr-2" />
            <span>Português</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-[#131825] py-8 px-6 border-t border-[#2a3042]">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Progresso de Configuração</h2>
            <span className="text-gray-400">Passo {currentStep} de {totalSteps}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Step 1 */}
            <div 
              onClick={() => goToStep(1)}
              className={`flex items-center p-4 rounded-lg cursor-pointer ${
                currentStep === 1 ? 'bg-[#3b82f6]' : 'bg-[#1e2738]'
              }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
                currentStep === 1 ? 'bg-white text-[#3b82f6]' : 'bg-[#2a3042] text-white'
              }`}>
                <span className="font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold">Informações Básicas</h3>
                <p className="text-sm text-gray-300">Configure o nome, descrição e aparência do seu agente</p>
              </div>
            </div>
            
            {/* Step 2 */}
            <div 
              onClick={() => goToStep(2)}
              className={`flex items-center p-4 rounded-lg cursor-pointer ${
                currentStep === 2 ? 'bg-[#3b82f6]' : 'bg-[#1e2738]'
              }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
                currentStep === 2 ? 'bg-white text-[#3b82f6]' : 'bg-[#2a3042] text-white'
              }`}>
                <span className="font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold">Configurar IA</h3>
                <p className="text-sm text-gray-300">Configure a ferramenta de Inteligência Artificial</p>
              </div>
            </div>
            
            {/* Step 3 */}
            <div 
              onClick={() => goToStep(3)}
              className={`flex items-center p-4 rounded-lg cursor-pointer ${
                currentStep === 3 ? 'bg-[#3b82f6]' : 'bg-[#1e2738]'
              }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
                currentStep === 3 ? 'bg-white text-[#3b82f6]' : 'bg-[#2a3042] text-white'
              }`}>
                <span className="font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold">Conectar com WhatsApp</h3>
                <p className="text-sm text-gray-300">Configure o webhook para integração com Evolution API</p>
              </div>
            </div>
            
            {/* Step 4 */}
            <div 
              onClick={() => goToStep(4)}
              className={`flex items-center p-4 rounded-lg cursor-pointer ${
                currentStep === 4 ? 'bg-[#3b82f6]' : 'bg-[#1e2738]'
              }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
                currentStep === 4 ? 'bg-white text-[#3b82f6]' : 'bg-[#2a3042] text-white'
              }`}>
                <span className="font-bold">4</span>
              </div>
              <div>
                <h3 className="font-semibold">Configurar Respostas</h3>
                <p className="text-sm text-gray-300">Configure como seu agente responderá às mensagens</p>
              </div>
            </div>
            
            {/* Step 5 */}
            <div 
              onClick={() => goToStep(5)}
              className={`flex items-center p-4 rounded-lg cursor-pointer ${
                currentStep === 5 ? 'bg-[#3b82f6]' : 'bg-[#1e2738]'
              }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
                currentStep === 5 ? 'bg-white text-[#3b82f6]' : 'bg-[#2a3042] text-white'
              }`}>
                <span className="font-bold">5</span>
              </div>
              <div>
                <h3 className="font-semibold">Configurações Adicionais</h3>
                <p className="text-sm text-gray-300">Configurações avançadas e de sessão</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        <div className="max-w-3xl mx-auto bg-[#131825] rounded-lg p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div>
              {error && (
                <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mb-6 p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-200">
                  {success}
                </div>
              )}
              
              {renderStepContent()}
              
              {currentStep !== 1 && (
                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-2 bg-[#2a3042] hover:bg-[#374151] rounded-lg"
                  >
                    {currentStep === 1 ? 'Cancelar' : 'Anterior'}
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-2 bg-[#3b82f6] hover:bg-[#2563eb] rounded-lg"
                  >
                    {currentStep === totalSteps ? 'Finalizar' : 'Próximo'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ConfigurarAgente;
