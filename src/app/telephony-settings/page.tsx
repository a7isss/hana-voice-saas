'use client';

import { useState, useEffect } from 'react';

interface TelephonySettings {
  id?: string;
  provider: 'maqsam';
  auth_method: 'http_header' | 'websocket_token';
  auth_token: string;
  base_url: string;
  webhook_url: string;
  allowed_agents: string[];
  is_active: boolean;
  test_mode: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function TelephonySettingsPage() {
  const [settings, setSettings] = useState<TelephonySettings>({
    provider: 'maqsam',
    auth_method: 'http_header',
    auth_token: '',
    base_url: 'wss://your-service.com',
    webhook_url: '',
    allowed_agents: ['ar', 'en', 'support'],
    is_active: false,
    test_mode: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load current settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/telephony-settings');
      const data = await response.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const method = settings.id ? 'PUT' : 'POST';
      const url = settings.id ? '/api/telephony-settings' : '/api/telephony-settings';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Settings saved successfully!');
        setSettings(data.settings);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/telephony/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Connection test successful!');
      } else {
        setMessage(`Connection test failed: ${data.error}`);
      }
    } catch (error) {
      setMessage('Connection test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentChange = (index: number, value: string) => {
    const newAgents = [...settings.allowed_agents];
    newAgents[index] = value;
    setSettings({ ...settings, allowed_agents: newAgents });
  };

  const addAgent = () => {
    setSettings({
      ...settings,
      allowed_agents: [...settings.allowed_agents, '']
    });
  };

  const removeAgent = (index: number) => {
    const newAgents = settings.allowed_agents.filter((_, i) => i !== index);
    setSettings({ ...settings, allowed_agents: newAgents });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Telephony Settings</h1>
      
      {message && (
        <div className={`p-4 mb-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        {/* Provider Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Provider</label>
          <select 
            value={settings.provider}
            onChange={(e) => setSettings({ ...settings, provider: e.target.value as 'maqsam' })}
            className="w-full p-2 border border-gray-300 rounded"
            disabled
          >
            <option value="maqsam">Maqsam</option>
          </select>
        </div>

        {/* Authentication Method */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Authentication Method</label>
          <select 
            value={settings.auth_method}
            onChange={(e) => setSettings({ ...settings, auth_method: e.target.value as 'http_header' | 'websocket_token' })}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="http_header">HTTP Header (Recommended)</option>
            <option value="websocket_token">WebSocket Token</option>
          </select>
        </div>

        {/* Auth Token */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Authentication Token</label>
          <input
            type="password"
            value={settings.auth_token}
            onChange={(e) => setSettings({ ...settings, auth_token: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Enter your pre-shared token"
          />
        </div>

        {/* Base URL */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">WebSocket Base URL</label>
          <input
            type="text"
            value={settings.base_url}
            onChange={(e) => setSettings({ ...settings, base_url: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="wss://your-service.com"
          />
        </div>

        {/* Webhook URL */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Webhook URL (for callbacks)</label>
          <input
            type="text"
            value={settings.webhook_url}
            onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="https://your-service.com/api/webhooks"
          />
        </div>

        {/* Allowed Agents */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Allowed Agents</label>
          <div className="space-y-2">
            {settings.allowed_agents.map((agent, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={agent}
                  onChange={(e) => handleAgentChange(index, e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded"
                  placeholder="Agent identifier (e.g., ar, en, support)"
                />
                <button
                  type="button"
                  onClick={() => removeAgent(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addAgent}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Agent
            </button>
          </div>
        </div>

        {/* Toggles */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={settings.is_active}
              onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              Activate Telephony Integration
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="test_mode"
              checked={settings.test_mode}
              onChange={(e) => setSettings({ ...settings, test_mode: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="test_mode" className="text-sm font-medium">
              Test Mode (Logs interactions without making actual calls)
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>

          <button
            onClick={handleTestConnection}
            disabled={isLoading || !settings.auth_token}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            Test Connection
          </button>
        </div>
      </div>

      {/* Configuration Help */}
      <div className="mt-8 bg-yellow-50 p-4 rounded-lg">
        <h3 className="font-bold mb-2">Configuration Help</h3>
        <p className="text-sm mb-2">
          <strong>Maqsam Account:</strong> gm@hndasah.com | Organization: nothomalhandasa
        </p>
        <p className="text-sm mb-2">
          <strong>Phone Number:</strong> +966112502534
        </p>
        <p className="text-sm">
          <strong>WebSocket URL Format:</strong> {settings.base_url}/[agent]?token=[your-token]
        </p>
      </div>
    </div>
  );
}
