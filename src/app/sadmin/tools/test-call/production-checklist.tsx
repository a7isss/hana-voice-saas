'use client';

import { useState, useEffect } from 'react';

interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  required: boolean;
  details?: string;
  timestamp?: string;
}

interface ServiceStatus {
  name: string;
  endpoint: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  responseTime?: number;
  lastCheck?: string;
  details?: any;
}

export default function ProductionChecklist() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize checklist
  useEffect(() => {
    initializeChecklist();
  }, []);

  const initializeChecklist = () => {
    const initialChecklist: ChecklistItem[] = [
      // Voice Service Health
      {
        id: 'voice-service-health',
        category: 'Voice Service',
        title: 'Voice Service Health Check',
        description: 'Verify voice service is running and models are loaded',
        status: 'pending',
        required: true
      },
      {
        id: 'stt-model-loaded',
        category: 'Voice Service',
        title: 'STT Model Loaded',
        description: 'Arabic speech recognition model (Vosk) is loaded and ready',
        status: 'pending',
        required: true
      },
      {
        id: 'tts-model-loaded',
        category: 'Voice Service',
        title: 'TTS Model Loaded',
        description: 'Arabic text-to-speech model (Coqui XTTS) is loaded and ready',
        status: 'pending',
        required: true
      },
      {
        id: 'ffmpeg-available',
        category: 'Voice Service',
        title: 'FFmpeg Available',
        description: 'FFmpeg is installed and accessible for audio conversion',
        status: 'pending',
        required: true
      },

      // Maqsam Integration
      {
        id: 'maqsam-status',
        category: 'Maqsam Integration',
        title: 'Maqsam Integration Status',
        description: 'Maqsam protocol handler is initialized and ready',
        status: 'pending',
        required: true
      },
      {
        id: 'telephony-token',
        category: 'Maqsam Integration',
        title: 'Telephony Token Configured',
        description: 'Pre-shared authentication token is set in environment',
        status: 'pending',
        required: true
      },
      {
        id: 'websocket-endpoints',
        category: 'Maqsam Integration',
        title: 'WebSocket Endpoints Active',
        description: 'All required WebSocket endpoints are accessible',
        status: 'pending',
        required: true
      },
      {
        id: 'protocol-handshake',
        category: 'Maqsam Integration',
        title: 'Protocol Handshake Working',
        description: 'Session setup and ready handshake completes successfully',
        status: 'pending',
        required: true
      },

      // Audio Processing
      {
        id: 'audio-format-conversion',
        category: 'Audio Processing',
        title: 'Audio Format Conversion',
        description: 'μ-law to WAV and back conversion works correctly',
        status: 'pending',
        required: true
      },
      {
        id: 'sample-rate-compatibility',
        category: 'Audio Processing',
        title: 'Sample Rate Compatibility',
        description: '16kHz sample rate maintained for Vosk compatibility',
        status: 'pending',
        required: true
      },
      {
        id: 'audio-quality',
        category: 'Audio Processing',
        title: 'Audio Quality Verification',
        description: 'Audio quality is maintained through processing pipeline',
        status: 'pending',
        required: true
      },

      // Security & Authentication
      {
        id: 'token-authentication',
        category: 'Security',
        title: 'Token Authentication',
        description: 'Pre-shared token authentication works correctly',
        status: 'pending',
        required: true
      },
      {
        id: 'rate-limiting',
        category: 'Security',
        title: 'Rate Limiting',
        description: 'Rate limiting is active and configurable',
        status: 'pending',
        required: true
      },
      {
        id: 'session-management',
        category: 'Security',
        title: 'Session Management',
        description: 'Concurrent session limits are enforced',
        status: 'pending',
        required: true
      },

      // Performance & Reliability
      {
        id: 'concurrent-calls',
        category: 'Performance',
        title: 'Concurrent Call Handling',
        description: 'System can handle multiple concurrent calls',
        status: 'pending',
        required: true
      },
      {
        id: 'response-time',
        category: 'Performance',
        title: 'Response Time',
        description: 'Voice response time under 2 seconds',
        status: 'pending',
        required: true
      },
      {
        id: 'error-handling',
        category: 'Performance',
        title: 'Error Handling',
        description: 'Graceful error handling and recovery',
        status: 'pending',
        required: true
      },

      // Deployment & Infrastructure
      {
        id: 'environment-variables',
        category: 'Deployment',
        title: 'Environment Variables',
        description: 'All required environment variables are set',
        status: 'pending',
        required: true
      },
      {
        id: 'persistent-storage',
        category: 'Deployment',
        title: 'Persistent Storage',
        description: 'Voice models are properly mounted and accessible',
        status: 'pending',
        required: true
      },
      {
        id: 'health-monitoring',
        category: 'Deployment',
        title: 'Health Monitoring',
        description: 'Health check endpoints are working',
        status: 'pending',
        required: true
      }
    ];

    setChecklist(initialChecklist);
  };

  const runComprehensiveCheck = async () => {
    setIsLoading(true);
    const updatedChecklist = [...checklist];
    const updatedServiceStatus: ServiceStatus[] = [];

    // Check Voice Service Health
    try {
      const startTime = Date.now();
      const response = await fetch('http://localhost:8000/health');
      const health = await response.json();
      const responseTime = Date.now() - startTime;

      updatedServiceStatus.push({
        name: 'Voice Service',
        endpoint: '/health',
        status: response.ok ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date().toISOString(),
        details: health
      });

      if (response.ok) {
        updateChecklistStatus(updatedChecklist, 'voice-service-health', 'completed', 
          `Voice service healthy - ${responseTime}ms response`);
        
        // Check STT model
        if (health.models?.stt === 'Vosk Arabic v0.22') {
          updateChecklistStatus(updatedChecklist, 'stt-model-loaded', 'completed', 
            'STT model loaded successfully');
        } else {
          updateChecklistStatus(updatedChecklist, 'stt-model-loaded', 'failed', 
            'STT model not loaded correctly');
        }

        // Check TTS model
        if (health.models?.tts === 'Coqui XTTS v2') {
          updateChecklistStatus(updatedChecklist, 'tts-model-loaded', 'completed', 
            'TTS model loaded successfully');
        } else {
          updateChecklistStatus(updatedChecklist, 'tts-model-loaded', 'failed', 
            'TTS model not loaded correctly');
        }
      } else {
        updateChecklistStatus(updatedChecklist, 'voice-service-health', 'failed', 
          `Health check failed: ${health.message || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateChecklistStatus(updatedChecklist, 'voice-service-health', 'failed', 
        `Health check error: ${errorMessage}`);
      updatedServiceStatus.push({
        name: 'Voice Service',
        endpoint: '/health',
        status: 'down',
        lastCheck: new Date().toISOString(),
        details: { error: errorMessage }
      });
    }

    // Check Maqsam Status
    try {
      const startTime = Date.now();
      const response = await fetch('http://localhost:8000/maqsam/status');
      const maqsamStatus = await response.json();
      const responseTime = Date.now() - startTime;

      updatedServiceStatus.push({
        name: 'Maqsam Integration',
        endpoint: '/maqsam/status',
        status: response.ok ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date().toISOString(),
        details: maqsamStatus
      });

      if (response.ok && maqsamStatus.integration === 'ready') {
        updateChecklistStatus(updatedChecklist, 'maqsam-status', 'completed', 
          'Maqsam integration ready');
        
        // Check authentication
        if (maqsamStatus.authentication?.status === 'configured') {
          updateChecklistStatus(updatedChecklist, 'telephony-token', 'completed', 
            'Telephony token configured');
        } else {
          updateChecklistStatus(updatedChecklist, 'telephony-token', 'failed', 
            'Telephony token not configured');
        }

        // Check endpoints
        if (maqsamStatus.endpoints) {
          updateChecklistStatus(updatedChecklist, 'websocket-endpoints', 'completed', 
            'WebSocket endpoints configured');
        }
      } else {
        updateChecklistStatus(updatedChecklist, 'maqsam-status', 'failed', 
          `Maqsam integration issue: ${maqsamStatus.message || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateChecklistStatus(updatedChecklist, 'maqsam-status', 'failed', 
        `Maqsam status check error: ${errorMessage}`);
    }

    // Check WebSocket connectivity
    try {
      const ws = new WebSocket('ws://localhost:8000/ws/maqsam/test');
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          updateChecklistStatus(updatedChecklist, 'websocket-endpoints', 'failed', 
            'WebSocket connection timeout');
          resolve(null);
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          updateChecklistStatus(updatedChecklist, 'websocket-endpoints', 'completed', 
            'WebSocket connection successful');
          ws.close();
          resolve(null);
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          updateChecklistStatus(updatedChecklist, 'websocket-endpoints', 'failed', 
            'WebSocket connection failed');
          resolve(null);
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateChecklistStatus(updatedChecklist, 'websocket-endpoints', 'failed', 
        `WebSocket test error: ${errorMessage}`);
    }

    // Update state
    setChecklist(updatedChecklist);
    setServiceStatus(updatedServiceStatus);
    setIsLoading(false);
  };

  const updateChecklistStatus = (
    checklist: ChecklistItem[], 
    id: string, 
    status: ChecklistItem['status'],
    details?: string
  ) => {
    const item = checklist.find(item => item.id === id);
    if (item) {
      item.status = status;
      item.details = details;
      item.timestamp = new Date().toISOString();
    }
  };

  const getStatusColor = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'failed': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '🔄';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  const completedCount = checklist.filter(item => item.status === 'completed').length;
  const totalCount = checklist.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Production Readiness Checklist</h1>
        <button
          onClick={runComprehensiveCheck}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Running Checks...' : 'Run Comprehensive Check'}
        </button>
      </div>

      {/* Progress Summary */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Overall Progress</h2>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span>Completion Progress</span>
              <span>{completedCount}/{totalCount} ({completionPercentage}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-green-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Status */}
      {serviceStatus.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Service Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviceStatus.map((service, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                service.status === 'healthy' ? 'bg-green-50 border-green-200' :
                service.status === 'degraded' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold">{service.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    service.status === 'healthy' ? 'bg-green-200 text-green-800' :
                    service.status === 'degraded' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-red-200 text-red-800'
                  }`}>
                    {service.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{service.endpoint}</p>
                {service.responseTime && (
                  <p className="text-sm mt-1">Response: {service.responseTime}ms</p>
                )}
                {service.details && (
                  <details className="mt-2">
                    <summary className="text-sm cursor-pointer">Details</summary>
                    <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(service.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checklist Items */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Production Readiness Checklist</h2>
        <div className="space-y-4">
          {checklist.map((item) => (
            <div key={item.id} className={`p-4 border rounded-lg ${getStatusColor(item.status)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStatusIcon(item.status)}</span>
                    <h3 className="font-semibold">{item.title}</h3>
                    {item.required && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                        REQUIRED
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-1">{item.description}</p>
                  {item.details && (
                    <p className="text-sm mt-2 bg-white bg-opacity-50 p-2 rounded">
                      {item.details}
                    </p>
                  )}
                  {item.timestamp && (
                    <p className="text-xs text-gray-600 mt-1">
                      Last checked: {new Date(item.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
        <h3 className="text-lg font-semibold mb-2">Next Steps</h3>
        <ul className="list-disc list-inside space-y-2">
          {completionPercentage < 100 && (
            <li>Address failed checks before proceeding to production</li>
          )}
          {completionPercentage >= 80 && (
            <li>Perform end-to-end test calls with actual Maqsam integration</li>
          )}
          {completionPercentage >= 90 && (
            <li>Monitor system performance under load testing</li>
          )}
          {completionPercentage === 100 && (
            <li className="text-green-600 font-semibold">✅ System is ready for production deployment!</li>
          )}
          <li>Verify all environment variables are set in production</li>
          <li>Test with actual telephony calls before full rollout</li>
          <li>Monitor logs and performance metrics continuously</li>
        </ul>
      </div>
    </div>
  );
}
