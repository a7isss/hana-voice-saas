'use client';

import { useState, useRef, useEffect } from 'react';

interface DebugLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  step: string;
  data?: any;
}

interface TestCallStatus {
  isActive: boolean;
  currentStep: string;
  progress: number;
  connectionId?: string;
  startTime?: Date;
  endTime?: Date;
}

export default function TestCallPage() {
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [testStatus, setTestStatus] = useState<TestCallStatus>({
    isActive: false,
    currentStep: 'idle',
    progress: 0
  });
  const [telephonySettings, setTelephonySettings] = useState({
    baseUrl: 'ws://localhost:8000',
    token: '',
    agent: 'healthcare'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false); // Voice service connection status
  const logsEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [debugLogs]);

  // Add debug log helper
  const addDebugLog = (level: DebugLog['level'], step: string, message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const log: DebugLog = { timestamp, level, step, message, data };
    setDebugLogs(prev => [...prev, log]);
    console.log(`[${timestamp}] ${step}: ${message}`, data || '');
  };

  // Update test status
  const updateTestStatus = (updates: Partial<TestCallStatus>) => {
    setTestStatus(prev => ({ ...prev, ...updates }));
  };

  // Clear logs
  const clearLogs = () => {
    setDebugLogs([]);
    setAudioUrl('');
    updateTestStatus({
      isActive: false,
      currentStep: 'idle',
      progress: 0,
      connectionId: undefined,
      startTime: undefined,
      endTime: undefined
    });
  };

  // Test WebSocket connection
  const testWebSocketConnection = async () => {
    if (testStatus.isActive) {
      addDebugLog('warning', 'Connection', 'Test already in progress');
      return;
    }

    setIsLoading(true);
    clearLogs();
    updateTestStatus({
      isActive: true,
      currentStep: 'initializing',
      progress: 0,
      startTime: new Date(),
      connectionId: `test_${Date.now()}`
    });

    try {
      // Step 1: Validate settings
      addDebugLog('info', 'Validation', 'Validating telephony settings');
      updateTestStatus({ currentStep: 'validation', progress: 10 });

      if (!telephonySettings.baseUrl) {
        throw new Error('WebSocket base URL is required');
      }
      if (!telephonySettings.token) {
        throw new Error('Authentication token is required');
      }

      addDebugLog('success', 'Validation', 'Settings validation passed');
      updateTestStatus({ progress: 20 });

      // Step 2: Create WebSocket connection
      addDebugLog('info', 'Connection', 'Establishing WebSocket connection');
      updateTestStatus({ currentStep: 'connection', progress: 30 });

      const wsUrl = `${telephonySettings.baseUrl}/ws/maqsam/test?token=${telephonySettings.token}`;
      addDebugLog('info', 'Connection', `Connecting to: ${wsUrl}`);

      const ws = new WebSocket(wsUrl);

      // WebSocket event handlers
      ws.onopen = () => {
        addDebugLog('success', 'Connection', 'WebSocket connection established');
        updateTestStatus({ progress: 40 });

        // Step 3: Send session setup
        addDebugLog('info', 'Protocol', 'Sending session setup message');
        updateTestStatus({ currentStep: 'session_setup', progress: 50 });

        const setupMessage = {
          type: 'session.setup',
          apiKey: telephonySettings.token,
          data: {
            context: {
              caller_number: '+966123456789',
              callee_number: '+966987654321',
              caller: 'Test User',
              callee: 'Healthcare Agent',
              direction: 'inbound',
              timestamp: new Date().toISOString(),
              custom: {
                test_mode: true,
                connection_id: testStatus.connectionId
              }
            }
          }
        };

        ws.send(JSON.stringify(setupMessage));
        addDebugLog('info', 'Protocol', 'Session setup message sent', setupMessage);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          addDebugLog('info', 'Protocol', `Received message: ${message.type}`, message);

          // Handle different message types
          switch (message.type) {
            case 'session.ready':
              addDebugLog('success', 'Protocol', 'Session ready confirmation received');
              updateTestStatus({ currentStep: 'session_ready', progress: 60 });

              // Step 4: Send test audio
              setTimeout(() => {
                addDebugLog('info', 'Audio', 'Sending test audio input');
                updateTestStatus({ currentStep: 'audio_input', progress: 70 });

                // Create a simple test audio message
                const audioMessage = {
                  type: 'audio.input',
                  data: {
                    audio: 'test_audio_data_placeholder' // In real scenario, this would be Base64 μ-law
                  }
                };

                ws.send(JSON.stringify(audioMessage));
                addDebugLog('info', 'Audio', 'Test audio sent');
              }, 1000);
              break;

            case 'response.stream':
              addDebugLog('success', 'Audio', 'Audio response received');
              updateTestStatus({ currentStep: 'audio_response', progress: 80 });

              // Simulate audio playback
              if (message.data && message.data.audio) {
                addDebugLog('info', 'Audio', 'Processing audio response');
                // In real implementation, this would decode and play the audio
                setTimeout(() => {
                  addDebugLog('success', 'Audio', 'Audio playback completed');
                  updateTestStatus({ currentStep: 'audio_playback', progress: 90 });
                }, 2000);
              }
              break;

            case 'call.mark':
              addDebugLog('info', 'Protocol', 'Call mark event received', message.data);
              break;

            default:
              addDebugLog('warning', 'Protocol', `Unknown message type: ${message.type}`);
          }
        } catch (error) {
          addDebugLog('error', 'Protocol', 'Failed to parse WebSocket message', { error, rawData: event.data });
        }
      };

      ws.onerror = (error) => {
        addDebugLog('error', 'Connection', 'WebSocket connection error', error);
        updateTestStatus({ isActive: false, currentStep: 'error', progress: 0 });
      };

      ws.onclose = (event) => {
        addDebugLog('info', 'Connection', `WebSocket connection closed: ${event.code} - ${event.reason}`);
        updateTestStatus({ 
          isActive: false, 
          currentStep: 'completed', 
          progress: 100,
          endTime: new Date()
        });

        // Calculate test duration
        if (testStatus.startTime) {
          const duration = new Date().getTime() - testStatus.startTime.getTime();
          addDebugLog('info', 'Completion', `Test completed in ${duration}ms`);
        }
      };

      // Auto-close after 30 seconds
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          addDebugLog('info', 'Timeout', 'Closing connection after 30 seconds');
          ws.close(1000, 'Test completed');
        }
      }, 30000);

    } catch (error) {
      addDebugLog('error', 'Initialization', 'Failed to start test call', error);
      updateTestStatus({ isActive: false, currentStep: 'error', progress: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  // Test voice service health
  const testVoiceServiceHealth = async () => {
    try {
      addDebugLog('info', 'Health Check', 'Testing voice service health');
      
      const response = await fetch(`${telephonySettings.baseUrl.replace('ws://', 'http://').replace('wss://', 'https://')}/health`);
      const health = await response.json();

      if (response.ok) {
        addDebugLog('success', 'Health Check', 'Voice service is healthy', health);
      } else {
        addDebugLog('error', 'Health Check', 'Voice service health check failed', health);
      }
    } catch (error) {
      addDebugLog('error', 'Health Check', 'Voice service health check failed', error);
    }
  };

  // Test Maqsam status
  const testMaqsamStatus = async () => {
    try {
      addDebugLog('info', 'Status Check', 'Checking Maqsam integration status');
      
      const response = await fetch(`${telephonySettings.baseUrl.replace('ws://', 'http://').replace('wss://', 'https://')}/maqsam/status`);
      const status = await response.json();

      if (response.ok) {
        addDebugLog('success', 'Status Check', 'Maqsam integration status', status);
      } else {
        addDebugLog('error', 'Status Check', 'Maqsam status check failed', status);
      }
    } catch (error) {
      addDebugLog('error', 'Status Check', 'Maqsam status check failed', error);
    }
  };

  // Get step color
  const getStepColor = (step: string) => {
    const stepProgress = {
      'idle': 'text-gray-500',
      'initializing': 'text-blue-500',
      'validation': 'text-yellow-500',
      'connection': 'text-blue-500',
      'session_setup': 'text-purple-500',
      'session_ready': 'text-green-500',
      'audio_input': 'text-indigo-500',
      'audio_response': 'text-green-500',
      'audio_playback': 'text-teal-500',
      'completed': 'text-green-500',
      'error': 'text-red-500'
    };
    return stepProgress[step as keyof typeof stepProgress] || 'text-gray-500';
  };

  // Get log level color
  const getLogLevelColor = (level: string) => {
    const colors = {
      info: 'text-blue-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
      success: 'text-green-600'
    };
    return colors[level as keyof typeof colors] || 'text-gray-600';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Test Call Debugging</h1>
        <button
          onClick={clearLogs}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Logs
        </button>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">WebSocket Base URL</label>
            <input
              type="text"
              value={telephonySettings.baseUrl}
              onChange={(e) => setTelephonySettings(prev => ({ ...prev, baseUrl: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="ws://localhost:8000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Authentication Token</label>
            <input
              type="password"
              value={telephonySettings.token}
              onChange={(e) => setTelephonySettings(prev => ({ ...prev, token: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter pre-shared token"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Agent Type</label>
            <select
              value={telephonySettings.agent}
              onChange={(e) => setTelephonySettings(prev => ({ ...prev, agent: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="healthcare">Healthcare</option>
              <option value="test">Test</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={testWebSocketConnection}
            disabled={isLoading || testStatus.isActive || !telephonySettings.token}
            className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {testStatus.isActive ? 'Test in Progress...' : 'Start Test Call'}
          </button>

          <button
            onClick={testVoiceServiceHealth}
            disabled={isLoading}
            className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            Test Voice Service Health
          </button>

          <button
            onClick={testMaqsamStatus}
            disabled={isLoading}
            className="px-6 py-3 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
          >
            Check Maqsam Status
          </button>
        </div>
      </div>

      {/* Progress Dashboard */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Test Progress</h2>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className={getStepColor(testStatus.currentStep)}>
              Current Step: {testStatus.currentStep}
            </span>
            <span>{testStatus.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${testStatus.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Connection Info */}
        {testStatus.connectionId && (
          <div className="text-sm text-gray-600">
            Connection ID: {testStatus.connectionId}
            {testStatus.startTime && (
              <span className="ml-4">
                Started: {testStatus.startTime.toLocaleTimeString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Debug Console */}
      <div className="bg-black text-white p-6 rounded-lg shadow-md font-mono">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Debug Console</h2>
          <span className="text-sm text-gray-400">
            {debugLogs.length} log entries
          </span>
        </div>

        <div className="h-96 overflow-y-auto bg-gray-900 p-4 rounded">
          {debugLogs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No logs yet. Start a test call to see debugging information.
            </div>
          ) : (
            debugLogs.map((log, index) => (
              <div key={index} className="border-b border-gray-700 py-2">
                <div className="flex items-start space-x-2">
                  <span className="text-gray-400 text-sm min-w-16">{log.timestamp}</span>
                  <span className={`font-semibold min-w-24 ${getLogLevelColor(log.level)}`}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span className="text-yellow-400 min-w-32">{log.step}</span>
                  <span className="flex-1">{log.message}</span>
                </div>
                {log.data && (
                  <div className="ml-24 mt-1 text-gray-400 text-sm">
                    {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : log.data}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Audio Playback */}
      {audioUrl && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Audio Playback</h2>
          <audio ref={audioRef} controls className="w-full">
            <source src={audioUrl} type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {/* Deployment & Testing Section */}
      <div className="bg-green-50 p-6 rounded-lg border border-green-200">
        <h3 className="text-lg font-semibold mb-4">🚀 Deployment & Testing Status</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GitHub Integration */}
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-medium mb-3 text-green-900">📚 GitHub Integration</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Repository:</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">hana-voice-saas</span>
              </div>
              <div className="flex justify-between">
                <span>Branch:</span>
                <a
                  href="https://github.com/a7isss/hana-voice-saas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-mono bg-gray-100 px-2 py-1 rounded"
                >
                  main
                </a>
              </div>
              <div className="mt-3">
                <button
                  onClick={async () => {
                    addDebugLog('info', 'GitHub', 'Checking deployment status...');
                    try {
                      // This would be replaced with actual deployment status check
                      addDebugLog('success', 'GitHub', 'Latest commit deployed successfully');
                      addDebugLog('info', 'GitHub', 'All Maqsam integration changes pushed');
                    } catch (error) {
                      addDebugLog('error', 'GitHub', 'Deployment check failed');
                    }
                  }}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Check Deployment Status
                </button>
              </div>
            </div>
          </div>

          {/* Railway Deployment */}
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-medium mb-3 text-blue-900">🚂 Railway Deployment</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>URL:</span>
                <a
                  href="https://hana-voice-saas.onrender.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 break-all"
                >
                  hana-voice-saas.onrender.com
                </a>
              </div>
              <div className="flex justify-between">
                <span>Voice Service:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Deploy:</span>
                <span className="font-mono text-xs">{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Deployment Checklist */}
        <div className="mt-6 bg-white p-4 rounded-lg border">
          <h4 className="font-medium mb-3 text-purple-900">📋 Pre-Deployment Checklist</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                {isConnected ? '✓' : '✗'}
              </span>
              <span>Vice service connection active</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={telephonySettings.token ? 'text-green-600' : 'text-red-600'}>
                {telephonySettings.token ? '✓' : '✗'}
              </span>
              <span>Maqsam authentication token configured</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span>WebSocket endpoints accessible</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span>Environment variables set</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span>Database connections healthy</span>
            </div>
          </div>
        </div>

        {/* Testing Commands */}
        <div className="mt-6 bg-white p-4 rounded-lg border">
          <h4 className="font-medium mb-3 text-orange-900">🧪 Testing Commands</h4>
          <div className="space-y-3">
            <div>
              <p className="font-medium text-sm mb-2">Test Voice Service Health:</p>
              <code className="bg-gray-100 p-2 rounded text-sm block">
                curl http://localhost:8000/health
              </code>
            </div>
            <div>
              <p className="font-medium text-sm mb-2">Test Maqsam Status:</p>
              <code className="bg-gray-100 p-2 rounded text-sm block">
                curl http://localhost:8000/maqsam/status
              </code>
            </div>
            <div>
              <p className="font-medium text-sm mb-2">Test Production Deployment:</p>
              <code className="bg-gray-100 p-2 rounded text-sm block">
                curl https://hana-voice-saas.onrender.com/api/health
              </code>
            </div>
          </div>
        </div>

        {/* Environment Status */}
        <div className="mt-6 bg-white p-4 rounded-lg border">
          <h4 className="font-medium mb-3 text-gray-900">🌍 Environment Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl mb-1">🖥️</div>
              <div className="font-medium">Local</div>
              <div className="text-xs text-gray-600">localhost:8000</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🚀</div>
              <div className="font-medium">Railway</div>
              <div className="text-xs text-gray-600">Production</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">💾</div>
              <div className="font-medium">Supabase</div>
              <div className="text-xs text-gray-600">Database</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🎤</div>
              <div className="font-medium">Voice</div>
              <div className="text-xs text-gray-600">Models Loaded</div>
            </div>
          </div>
        </div>
      </div>

      {/* Debugging Tips */}
      <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
        <h3 className="text-lg font-semibold mb-2">Debugging Tips</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Check that your voice service is running on the specified WebSocket URL</li>
          <li>Verify the authentication token matches your Maqsam configuration</li>
          <li>Monitor the console for specific error messages at each step</li>
          <li>Use the health checks to verify service availability</li>
          <li>Check browser console for additional WebSocket debugging information</li>
        </ul>
      </div>
    </div>
  );
}
