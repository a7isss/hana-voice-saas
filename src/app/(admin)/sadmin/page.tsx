'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AudioIcon,
  ShootingStarIcon as TestTubeIcon,
  BoxCubeIcon as SettingsIcon,
  ChatIcon as PhoneIcon,
  PieChartIcon,
  CheckCircleIcon,
  AlertIcon as AlertTriangleIcon,
  ErrorIcon as XCircleIcon,
  ArrowRightIcon as RefreshCwIcon,
  ChevronRightIcon as ExternalLinkIcon,
  ChevronUpIcon as PlayIcon,
  BoltIcon as ZapIcon,
  BoxIcon as ActivityIcon,
  BoxCubeIcon as CpuIcon,
  DownloadIcon as NetworkIcon,
  PageIcon as HardDriveIcon,
  LockIcon as ShieldIcon
} from '../../../icons/index';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  message: string;
  lastCheck: string;
}

interface VoiceModelStatus {
  stt_model: string;
  tts_model: string;
  loaded: boolean;
  memory_usage: string;
}

export default function SuperAdminDashboard() {
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([]);
  const [voiceModelStatus, setVoiceModelStatus] = useState<VoiceModelStatus | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock service statuses - in real app, this would call actual APIs
  const mockServiceStatuses: ServiceStatus[] = [
    {
      name: 'Voice Service',
      status: 'healthy',
      message: 'Service responding, models loaded',
      lastCheck: new Date().toISOString()
    },
    {
      name: 'Database (Supabase)',
      status: 'healthy',
      message: 'Connected successfully',
      lastCheck: new Date().toISOString()
    },
    {
      name: 'Maqsam Integration',
      status: 'warning',
      message: 'Awaiting telephony configuration',
      lastCheck: new Date().toISOString()
    },
    {
      name: 'Railway Volumes',
      status: 'healthy',
      message: 'Voice models mounted at /data/models',
      lastCheck: new Date().toISOString()
    }
  ];

  useEffect(() => {
    // Initialize with mock data
    setServiceStatuses(mockServiceStatuses);
    setVoiceModelStatus({
      stt_model: 'vosk-model-ar-0.22-linto-1.0',
      tts_model: 'xtts_v2',
      loaded: true,
      memory_usage: '~2.1GB'
    });
  }, []);

  const handleRefreshStatuses = async () => {
    setIsRefreshing(true);

    // Simulate API calls
    await new Promise(resolve => setTimeout(resolve, 1000));

    setServiceStatuses(mockServiceStatuses);
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon className="h-4 w-4" />;
      case 'warning': return <AlertTriangleIcon className="h-4 w-4" />;
      case 'error': return <XCircleIcon className="h-4 w-4" />;
      default: return <RefreshCwIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive system monitoring and testing tools for Hana Voice SaaS
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <button
            onClick={handleRefreshStatuses}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCwIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {serviceStatuses.map((service, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-full ${getStatusColor(service.status)}`}>
                  {getStatusIcon(service.status)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {service.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {service.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Voice Models Status */}
      {voiceModelStatus && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <AudioIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Voice Models Status
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">STT Model</h3>
              <p className="text-xs text-green-600 dark:text-green-400">{voiceModelStatus.stt_model}</p>
              <div className="flex items-center gap-1 mt-2">
                <CheckCircleIcon className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-700 dark:text-green-300">Loaded</span>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">TTS Model</h3>
              <p className="text-xs text-green-600 dark:text-green-400">{voiceModelStatus.tts_model}</p>
              <div className="flex items-center gap-1 mt-2">
                <CheckCircleIcon className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-700 dark:text-green-300">Loaded</span>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Memory Usage</h3>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{voiceModelStatus.memory_usage}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Current usage</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Testing Tools */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-6">
          <TestTubeIcon className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Quick Testing Tools
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              name: 'Voice Service Tester',
              path: '/voice-tester',
              description: 'Test STT/TTS functionality and Arabic voice processing',
              icon: <AudioIcon className="h-5 w-5" />,
              color: 'bg-blue-500'
            },
            {
              name: 'Survey Management',
              path: '/survey-management',
              description: 'Create, edit and test healthcare survey templates',
              icon: <PieChartIcon className="h-5 w-5" />,
              color: 'bg-green-500'
            },
            {
              name: 'Campaign Simulator',
              path: '/campaign',
              description: 'Run and monitor automated voice survey campaigns',
              icon: <PhoneIcon className="h-5 w-5" />,
              color: 'bg-orange-500'
            },
            {
              name: 'Demo Test Call',
              path: '/demo-test-call',
              description: 'Test individual phone call functionality',
              icon: <PhoneIcon className="h-5 w-5" />,
              color: 'bg-purple-500'
            },
            {
              name: 'Agent Configuration',
              path: '/agent-configuration',
              description: 'Configure AI agent behavior and responses',
              icon: <SettingsIcon className="h-5 w-5" />,
              color: 'bg-indigo-500'
            },
            {
              name: 'Telephony Settings',
              path: '/telephony-settings',
              description: 'Configure Maqsam integration and phone settings',
              icon: <PhoneIcon className="h-5 w-5" />,
              color: 'bg-red-500'
            }
          ].map((tool, index) => (
            <Link
              key={index}
              href={tool.path}
              className="group bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-all hover:scale-105"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${tool.color} text-white`}>
                  {tool.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {tool.name}
                  </h3>
                </div>
                <ExternalLinkIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Cloud Verification Checklist */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-6">
          <CheckCircleIcon className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Cloud Verification Checklist
          </h2>
        </div>

        <div className="space-y-3">
          {[
            { text: 'Verify Railway service URLs', status: 'pending' },
            { text: 'Test service health endpoints', status: 'completed' },
            { text: 'Check voice model loading', status: 'completed' },
            { text: 'Validate environment variables', status: 'pending' },
            { text: 'Test cross-service communication', status: 'pending' },
            { text: 'Verify Maqsam integration', status: 'pending' },
            { text: 'Run Arabic voice processing tests', status: 'available' },
            { text: 'Execute healthcare survey flows', status: 'available' }
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
                item.status === 'completed' ? 'bg-green-100 text-green-600' :
                item.status === 'available' ? 'bg-blue-100 text-blue-600' :
                'bg-gray-100 text-gray-400'
              }`}>
                {item.status === 'completed' ?
                  <CheckCircleIcon className="h-3 w-3" /> :
                  item.status === 'available' ?
                  <PlayIcon className="h-3 w-3" /> :
                  <div className="h-2 w-2 rounded-full bg-current"></div>
                }
              </div>
              <span className={`text-sm ${
                item.status === 'completed' ? 'text-green-700 dark:text-green-300' :
                item.status === 'available' ? 'text-blue-700 dark:text-blue-300' :
                'text-gray-600 dark:text-gray-400'
              }`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <ActivityIcon className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            System Information
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <CpuIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Services</p>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <HardDriveIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">2.1GB</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Model Memory</p>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <NetworkIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">98%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Arabic STT Accuracy</p>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <ShieldIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">100%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
