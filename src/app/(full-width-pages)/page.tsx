'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Logo/Brand */}
        <div className="mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
            هـ
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            هانا للتواصل الصوتي
          </h1>
          <p className="text-gray-600">
            Hana Voice SaaS - منصة الاتصال الصوتي الطبية
          </p>
        </div>

        {/* Services Cards */}
        <div className="space-y-4">
          {/* Hospital Dashboard */}
          <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="text-center">
              <div className="text-4xl mb-3">🏥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                لوحة تحكم المستشفى
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                عرض نتائج الاتصالات الصوتية والتقارير الطبية
              </p>
              <Link
                href="/hospital"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                الدخول كمستشفى
              </Link>
            </div>
          </div>

          {/* System Status */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>النظام نشط ويعمل</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            منصة هانا للتواصل الصوتي الطبي © 2025
          </p>
          <p className="text-xs text-gray-500 mt-1">
            للدعم التقني: support@hanavoice.com
          </p>
        </div>
      </div>
    </div>
  );
}
