'use client';

import Link from 'next/link';

export default function HanaVoiceLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="max-w-4xl w-full text-center mb-12">
          {/* Logo/Brand */}
          <div className="mb-8">
            <div className="mx-auto w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 shadow-lg">
              هـ
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
              هانا للتواصل الصوتي
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Hana Voice SaaS - منصة التواصل الصوتي الآلي للرعاية الطبية
            </p>
          </div>

          {/* Hero Content */}
          <div className="mb-12">
            <p className="text-lg text-gray-700 mb-6 leading-relaxed max-w-3xl mx-auto">
              رقي تجربة التواصل الصوتي مع عملائك من خلال الذكاء الاصطناعي المتقدم للتعرف على اللغة العربية،
              وخدمة العملاء الآلية على مدار الساعة لجميع أنواع المؤسسات الطبية والخدمية.
            </p>

            {/* Key Benefits */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-white">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-semibold text-gray-900 mb-1">دقة عالية في التعرف</h3>
                <p className="text-sm text-gray-600">98% دقة في فهم اللغة العربية الفصحى</p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-white">
                <div className="text-2xl mb-2">⚡</div>
                <h3 className="font-semibold text-gray-900 mb-1">سرعة الرد الفوري</h3>
                <p className="text-sm text-gray-600">تواصل آلي على مدار 24/7 دون انتظار</p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-white">
                <div className="text-2xl mb-2">🔒</div>
                <h3 className="font-semibold text-gray-900 mb-1">خصوصية المعلومات</h3>
                <p className="text-sm text-gray-600">معالجة آمنة متوافقة مع متطلبات الحماية</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
            {/* Hospital / Medical Organization Access */}
            <div className="mb-6">
              <div className="text-center mb-4">
                <div className="text-4xl mb-3">🏥</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  خصص هانا لمؤسستك الطبية
                </h3>
                <p className="text-gray-600 mb-4">
                  على التواصل الصوتي الآلي مع مرضايك وأسرهم، وعرض تقارير مفصلة عن الحملات الصوتية والاستطلاعات
                </p>
              </div>

              <Link
                href="/auth/hospital/login"
                className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-all duration-200 text-lg font-medium shadow-md hover:shadow-lg"
              >
                تسجيل دخول المؤسسة
              </Link>
            </div>

            {/* Signup Link */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                جديد على هانا؟ <Link href="/auth/hospital/signup" className="font-medium text-blue-600 hover:text-blue-700">إنشاء حساب مؤسسة جديدة</Link>
              </p>
            </div>
          </div>


        </div>

        {/* Footer */}
        <div className="mt-16 border-t border-gray-200 pt-8 w-full max-w-4xl mx-auto">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">
              منصة هانا للتواصل الصوتي الآلي © 2025
            </p>
            <p className="text-xs text-gray-500">
              لخدمة المؤسسات الطبية والخدمية في المنطقة العربية
            </p>
            <div className="mt-2 text-xs text-gray-400">
              support@hanavoice.com | sales@hanavoice.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
