'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeftIcon,
  ShootingStarIcon as TestTubeIcon,
  CheckCircleIcon,
  AlertIcon as AlertTriangleIcon,
  CloseIcon as XCircleIcon,
  AngleUpIcon as PlayIcon,
  ArrowRightIcon as RefreshCwIcon,
  AudioIcon,
  ChatIcon as PhoneIcon,
  LockIcon as ShieldIcon,
  DownloadIcon as NetworkIcon,
  BoxIcon as SettingsIcon,
  PieChartIcon
} from '../../../../icons/index';

interface TestResult {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  duration?: number;
  lastRun: string;
  category: string;
  details?: string;
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestResult[];
  status: 'idle' | 'running' | 'completed';
}

export default function TestDashboard() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);
  const [runningSuites, setRunningSuites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const mockTestSuites: TestSuite[] = [
      {
        id: 'voice-processing',
        name: 'معالجة الصوت والتعرف',
        description: 'اختبارات معالجة الصوت العربي ونسب الدقة',
        status: 'idle',
        tests: [
          {
            id: 'stt-basic',
            name: 'STT - اختبار أساسي',
            description: 'اختبار التعرف على الكلمات العربية البسيطة',
            status: 'passed',
            duration: 2.3,
            lastRun: '2025-11-22T08:30:00Z',
            category: 'speech-to-text'
          },
          {
            id: 'stt-accuracy',
            name: 'STT - دقة التعرف',
            description: 'قياس دقة التعرف على مجموعة اختبارية متنوعة',
            status: 'passed',
            duration: 15.7,
            lastRun: '2025-11-22T08:15:00Z',
            category: 'speech-to-text'
          },
          {
            id: 'tts-quality',
            name: 'TTS - جودة التوليد',
            description: 'اختبار جودة صوت التوليد العربي',
            status: 'warning',
            duration: 8.9,
            lastRun: '2025-11-22T08:00:00Z',
            category: 'text-to-speech'
          }
        ]
      },
      {
        id: 'telephony-integration',
        name: 'تكامل الهاتف',
        description: 'اختبارات الاتصال والتكامل مع خدمة Maqsam',
        status: 'idle',
        tests: [
          {
            id: 'maqsam-connect',
            name: 'اتصال Maqsam',
            description: 'التحقق من الاتصال بـ API Maqsam',
            status: 'passed',
            duration: 1.2,
            lastRun: '2025-11-22T07:45:00Z',
            category: 'telephony'
          },
          {
            id: 'call-initiation',
            name: 'بدء المكالمة',
            description: 'اختبار بدء المكالمات عبر Maqsam',
            status: 'failed',
            duration: 0,
            lastRun: '2025-11-22T07:40:00Z',
            category: 'telephony',
            details: 'Authentication token expired'
          }
        ]
      },
      {
        id: 'security-tests',
        name: 'اختبارات الأمان',
        description: 'التحقق من أمان النظام وحماية البيانات',
        status: 'idle',
        tests: [
          {
            id: 'auth-validation',
            name: 'تحقق المصادقة',
            description: 'اختبار صحة نظام المصادقة',
            status: 'passed',
            duration: 3.1,
            lastRun: '2025-11-22T07:30:00Z',
            category: 'security'
          },
          {
            id: 'data-encryption',
            name: 'تشفير البيانات',
            description: 'التحقق من تشفير البيانات الحساسة',
            status: 'passed',
            duration: 2.8,
            lastRun: '2025-11-22T07:25:00Z',
            category: 'security'
          },
          {
            id: 'rate-limiting',
            name: 'تقييد المعدل',
            description: 'اختبار آليات منع إساءة الاستخدام',
            status: 'pending',
            lastRun: '2025-11-21T16:00:00Z',
            category: 'security'
          }
        ]
      },
      {
        id: 'database-tests',
        name: 'قاعدة البيانات',
        description: 'اختبارات سلامة قاعدة البيانات والأداء',
        status: 'idle',
        tests: [
          {
            id: 'connection-test',
            name: 'اختبار الاتصال',
            description: 'التحقق من الاتصال بـ Supabase',
            status: 'passed',
            duration: 0.8,
            lastRun: '2025-11-22T07:20:00Z',
            category: 'database'
          },
          {
            id: 'data-integrity',
            name: 'سلامة البيانات',
            description: 'التحقق من سلامة البيانات والقيود',
            status: 'passed',
            duration: 5.2,
            lastRun: '2025-11-22T07:15:00Z',
            category: 'database'
          }
        ]
      },
      {
        id: 'survey-integration',
        name: 'تكامل الاستطلاعات',
        description: 'اختبارات دفق الاستطلاعات الطبية',
        status: 'idle',
        tests: [
          {
            id: 'survey-creation',
            name: 'إنشاء الاستطلاع',
            description: 'إنشاء وتخزين الاستطلاعات الجديدة',
            status: 'passed',
            duration: 1.5,
            lastRun: '2025-11-22T07:10:00Z',
            category: 'surveys'
          },
          {
            id: 'response-processing',
            name: 'معالجة الردود',
            description: 'معالجة وتخزين ردود المرضى',
            status: 'warning',
            duration: 4.2,
            lastRun: '2025-11-22T07:05:00Z',
            category: 'surveys',
            details: 'Slow response time detected'
          }
        ]
      }
    ];

    setTestSuites(mockTestSuites);
  }, []);

  const runTestSuite = async (suiteId: string) => {
    setRunningSuites(prev => new Set(prev).add(suiteId));

    // Update suite status
    setTestSuites(prev =>
      prev.map(suite =>
        suite.id === suiteId
          ? { ...suite, status: 'running' as const }
          : suite
      )
    );

    try {
      // Simulate running tests
      for (const suite of testSuites) {
        if (suite.id === suiteId) {
          for (let i = 0; i < suite.tests.length; i++) {
            const test = suite.tests[i];

            // Update test status to running
            setTestSuites(prev => prev.map(s =>
              s.id === suiteId
                ? {
                    ...s,
                    tests: s.tests.map((t, idx) =>
                      idx === i ? { ...t, status: 'running' as const } : t
                    )
                  }
                : s
            ));

            // Simulate test execution time
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 3000));

            // Random test result
            const statuses: Array<'passed' | 'failed' | 'warning'> = ['passed', 'passed', 'passed', 'warning', 'failed'];
            const newStatus = statuses[Math.floor(Math.random() * statuses.length)];

            setTestSuites(prev => prev.map(s =>
              s.id === suiteId
                ? {
                    ...s,
                    tests: s.tests.map((t, idx) =>
                      idx === i
                        ? {
                            ...t,
                            status: newStatus,
                            duration: parseFloat((1 + Math.random() * 4).toFixed(1)),
                            lastRun: new Date().toISOString()
                          }
                        : t
                    )
                  }
                : s
            ));
          }
        }
      }

      // Mark suite as completed
      setTestSuites(prev =>
        prev.map(suite =>
          suite.id === suiteId
            ? { ...suite, status: 'completed' as const }
            : suite
        )
      );

    } finally {
      setRunningSuites(prev => {
        const newSet = new Set(prev);
        newSet.delete(suiteId);
        return newSet;
      });
    }
  };

  const runAllTests = async () => {
    for (const suite of testSuites) {
      await runTestSuite(suite.id);
      // Small delay between suites
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangleIcon className="h-5 w-5 text-yellow-600" />;
      case 'running':
        return <RefreshCwIcon className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-400"></div>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-700 bg-green-100';
      case 'failed': return 'text-red-700 bg-red-100';
      case 'warning': return 'text-yellow-700 bg-yellow-100';
      case 'running': return 'text-blue-700 bg-blue-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getSuiteIcon = (suiteId: string) => {
    switch (suiteId) {
      case 'voice-processing':
        return <AudioIcon className="h-5 w-5" />;
      case 'telephony-integration':
        return <PhoneIcon className="h-5 w-5" />;
      case 'security-tests':
        return <ShieldIcon className="h-5 w-5" />;
      case 'database-tests':
        return <NetworkIcon className="h-5 w-5" />;
      case 'survey-integration':
        return <PieChartIcon className="h-5 w-5" />;
      default:
        return <SettingsIcon className="h-5 w-5" />;
    }
  };

  const getSuiteStats = (suite: TestSuite) => {
    const passed = suite.tests.filter(t => t.status === 'passed').length;
    const failed = suite.tests.filter(t => t.status === 'failed').length;
    const warnings = suite.tests.filter(t => t.status === 'warning').length;
    const total = suite.tests.length;

    return { passed, failed, warnings, total };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/sadmin"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              لوحة اختبارات النظام
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              System Test Dashboard • اختبارات شاملة لضمان استقرار النظام
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runAllTests}
            disabled={runningSuites.size > 0}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <PlayIcon className="h-4 w-4" />
            تشغيل جميع الاختبارات
          </button>
        </div>
      </div>

      {/* Test Suites Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testSuites.map((suite) => {
          const { passed, failed, warnings, total } = getSuiteStats(suite);
          const isRunning = runningSuites.has(suite.id);

          return (
            <div
              key={suite.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${getStatusColor(
                    suite.status === 'running' ? 'running' :
                    failed > 0 ? 'failed' :
                    warnings > 0 ? 'warning' : 'passed'
                  )}`}>
                    {isRunning ? (
                      <RefreshCwIcon className="h-6 w-6 animate-spin" />
                    ) : (
                      getSuiteIcon(suite.id)
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {suite.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {total} اختبار
                    </p>
                  </div>
                </div>
              </div>

              {/* Test Results Summary */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">نجح: {passed}</span>
                  <span className="text-red-600">فشل: {failed}</span>
                  <span className="text-yellow-600">تحذير: {warnings}</span>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(passed / total) * 100}%` }}></div>
                </div>
              </div>

              <button
                onClick={() => runTestSuite(suite.id)}
                disabled={isRunning}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {isRunning ? 'تشغيل الاختبارات...' : 'تشغيل مجموعة الاختبارات'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Detailed Test Results */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            تفاصيل الاختبارات
          </h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {testSuites.map((suite) => (
            <div key={suite.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  {getSuiteIcon(suite.id)}
                  {suite.name}
                </h3>
                <button
                  onClick={() => setSelectedSuite(selectedSuite === suite.id ? null : suite.id)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  {selectedSuite === suite.id ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                </button>
              </div>

              {selectedSuite === suite.id && (
                <div className="space-y-3 mt-4">
                  {suite.tests.map((test) => (
                    <div
                      key={test.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {test.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {test.description}
                          </p>
                          {test.details && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                              {test.details}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-left">
                        {test.duration && (
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {test.duration}s
                          </div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(test.lastRun).toLocaleString('ar-SA')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Test Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {testSuites.reduce((sum, suite) => sum + suite.tests.filter(t => t.status === 'passed').length, 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">اختبارات ناجحة</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-600">
                {testSuites.reduce((sum, suite) => sum + suite.tests.filter(t => t.status === 'failed').length, 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">اختبارات فاشلة</p>
            </div>
            <XCircleIcon className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {testSuites.reduce((sum, suite) => sum + suite.tests.filter(t => t.status === 'warning').length, 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">تحذيرات</p>
            </div>
            <AlertTriangleIcon className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {testSuites.reduce((sum, suite) => sum + suite.tests.length, 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الاختبارات</p>
            </div>
            <TestTubeIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
