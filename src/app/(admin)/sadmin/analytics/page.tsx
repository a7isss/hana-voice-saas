'use client';

import React from 'react';
import Link from 'next/link';
import {
  ChevronLeftIcon,
  ArrowUpIcon,
  UserIcon,
  ChatIcon,
  CalenderIcon,
  CheckCircleIcon,
  DownloadIcon,
  PieChartIcon
} from '../../../../icons/index';

export default function SystemAnalytics() {
  const analyticsData = {
    overall: {
      totalCalls: 125000,
      successRate: 92.4,
      averageCallDuration: 120,
      totalPatients: 85000
    },
    trends: [
      { period: 'Nov 2025', calls: 8500, success: 91.2, patients: 6500 },
      { period: 'Oct 2025', calls: 9200, success: 93.1, patients: 7100 },
      { period: 'Sep 2025', calls: 7800, success: 90.8, patients: 5800 },
      { period: 'Aug 2025', calls: 8800, success: 94.2, patients: 6800 }
    ],
    hospitals: [
      { name: 'King Khalid Hospital', calls: 25000, success: 94.1, patients: 18000 },
      { name: 'King Faisal Hospital', calls: 22000, success: 91.8, patients: 16000 },
      { name: 'Children\'s Hospital', calls: 15000, success: 89.5, patients: 12000 },
      { name: 'Maternity Hospital', calls: 18000, success: 93.2, patients: 13500 }
    ]
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
              تحليلات النظام
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              System Analytics • تحليلات شاملة لأداء النظام
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors">
            <DownloadIcon className="h-4 w-4" />
            تصدير التقرير
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {analyticsData.overall.totalCalls.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المكالمات</p>
            </div>
            <ChatIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">{analyticsData.overall.successRate}%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">نسبة النجاح</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-orange-600">{analyticsData.overall.averageCallDuration}s</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">متوسط مدة المكالمة</p>
            </div>
            <CalenderIcon className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {analyticsData.overall.totalPatients.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المرضى</p>
            </div>
            <UserIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Trends Chart (Simple representation) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-6">
          <ArrowUpIcon className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            اتجاهات الأداء الشهرية
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">الشهر</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">المكالمات</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">نسبة النجاح</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">المرضى</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">الاتجاه</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.trends.map((trend, index) => (
                <tr key={trend.period} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                    {trend.period}
                  </td>
                  <td className="text-center py-3 px-4">
                    {trend.calls.toLocaleString()}
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {trend.success}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    {trend.patients.toLocaleString()}
                  </td>
                  <td className="text-center py-3 px-4">
                    <ArrowUpIcon className={`h-4 w-4 ${
                      index === 0 ? 'text-green-600' :
                      trend.success > analyticsData.trends[index - 1]?.success ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hospital Performance Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-6">
          <ArrowUpIcon className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            أداء المستشفيات
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">المستشفى</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">المكالمات</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">نسبة النجاح</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">المرضى</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">التصنيف</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.hospitals.map((hospital, index) => (
                <tr key={hospital.name} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                    {hospital.name}
                  </td>
                  <td className="text-center py-3 px-4">
                    {hospital.calls.toLocaleString()}
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      hospital.success >= 93 ? 'bg-green-100 text-green-800' :
                      hospital.success >= 90 ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {hospital.success}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    {hospital.patients.toLocaleString()}
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      #{index + 1}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Voice Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircleIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              مؤشرات جودة الصوت
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">دقة التعرف على الكلام (STT):</span>
              <span className="font-medium text-green-600">97.8%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">جودة التحويل النصي إلى كلام:</span>
              <span className="font-medium text-green-600">96.4%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">معدل الاتصال الصوتي:</span>
              <span className="font-medium text-blue-600">99.2%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">متوسط وقت الاستجابة:</span>
              <span className="font-medium text-purple-600">234ms</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              إحصائيات المرضى
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">إجمالي المرضى المسجلين:</span>
              <span className="font-medium text-blue-600">85,000</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">المرضى النشطون:</span>
              <span className="font-medium text-green-600">67,300</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">معدل المشاركة:</span>
              <span className="font-medium text-orange-600">84.7%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">متوسط الردود السريعة:</span>
              <span className="font-medium text-purple-600">89.3%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
