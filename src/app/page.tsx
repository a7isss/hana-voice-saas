'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, Brain, Activity, Shield } from 'lucide-react';
import AlienRobot from '@/components/common/AlienRobot';
import HaloPageLight from '@/components/ui/HaloPageLight';

export default function IntelligentMachinesLanding() {
  return (
    <>
      <HaloPageLight radius={200} intensity={1.3} />
      <div className="min-h-screen bg-gray-950 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-blue-950/50 to-indigo-950/50" />
        
        {/* Floating orbs in background */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-32 right-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />

        {/* Main content */}
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
          <div className="max-w-5xl text-center">
            
            {/* Hero badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-400 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span>مدعوم بالذكاء الاصطناعي المتقدم</span>
            </div>

            {/* Main heading */}
            <h1 className="mb-6 text-6xl font-bold tracking-tight md:text-7xl lg:text-8xl">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                الآلات الذكية
              </span>
              <br />
              <span className="text-white">Intelligent Machines</span>
            </h1>

            {/* Subtitle */}
            <p className="mb-12 text-xl text-gray-300 md:text-2xl max-w-3xl mx-auto">
              حيث يلتقي الذكاء الاصطناعي بالرعاية الصحية
              <br />
              <span className="text-blue-400">منصة التواصل الصوتي الذكي للمؤسسات الطبية</span>
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                href="/auth/hospital/signup"
                className="group relative overflow-hidden bg-blue-600 text-white hover:bg-blue-700 px-8 py-4 text-lg rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/50 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2">
                  إنشاء حساب مؤسسة
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
              
              <Link
                href="/auth/hospital/login"
                className="border border-blue-500/30 text-white hover:bg-blue-500/10 px-8 py-4 text-lg rounded-xl backdrop-blur-sm transition-all duration-200 hover:border-blue-500/50"
              >
                تسجيل الدخول
              </Link>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { 
                  icon: Brain, 
                  title: "ذكاء اصطناعي متقدم", 
                  desc: "دقة 98% في التعرف على اللغة العربية",
                  color: "blue"
                },
                { 
                  icon: Activity, 
                  title: "معالجة فورية", 
                  desc: "استجابة في الوقت الفعلي على مدار الساعة",
                  color: "cyan"
                },
                { 
                  icon: Shield, 
                  title: "أمان متقدم", 
                  desc: "حماية البيانات الطبية بأعلى المعايير",
                  color: "indigo"
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="group relative rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm transition-all hover:border-blue-500/40 hover:bg-gray-900/80 hover:scale-105"
                >
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-${feature.color}-500/10 text-${feature.color}-400`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Use Cases Section */}
            <div className="mt-20 rounded-2xl border border-gray-800 bg-gray-900/50 p-8 md:p-12 backdrop-blur-sm">
              <h2 className="text-3xl font-bold text-white mb-8">
                كيف تخدم الآلات الذكية مؤسستك؟
              </h2>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">🏥</div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2 text-blue-400">متابعة ما بعد العمليات</h4>
                    <p className="text-gray-400 text-sm">
                      اتصال تلقائي بالمرضى للاطمئنان على حالتهم وجمع معلومات عن التعافي
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="text-2xl">💊</div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2 text-cyan-400">تذكير بالأدوية</h4>
                    <p className="text-gray-400 text-sm">
                      مكالمات صوتية ذكية لتذكير المرضى بمواعيد الأدوية والجرعات
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="text-2xl">📅</div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2 text-indigo-400">تأكيد المواعيد</h4>
                    <p className="text-gray-400 text-sm">
                      تأكيد تلقائي للمواعيد الطبية وإعادة الجدولة عند الحاجة
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="text-2xl">📋</div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2 text-purple-400">استطلاعات الرضا</h4>
                    <p className="text-gray-400 text-sm">
                      جمع آراء المرضى بطريقة طبيعية ومريحة عبر المحادثات الصوتية
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Alien Robot in bottom-left corner */}
        <div className="fixed bottom-8 left-8 z-20">
          <AlienRobot />
        </div>

        {/* Footer */}
        <div className="relative z-10 border-t border-gray-800 mt-20">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <h4 className="font-semibold text-lg mb-4 text-blue-400">الآلات الذكية</h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  منصة التواصل الصوتي الذكي المدعومة بالذكاء الاصطناعي للمؤسسات الطبية في المنطقة العربية
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-4 text-cyan-400">تواصل معنا</h4>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>📧 support@intelligentmachines.sa</p>
                  <p>📞 +966 XX XXX XXXX</p>
                  <p>🌐 www.intelligentmachines.sa</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-4 text-indigo-400">التقنية</h4>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>✓ ذكاء اصطناعي متقدم</p>
                  <p>✓ معالجة اللغة العربية</p>
                  <p>✓ أمان وخصوصية عالية</p>
                </div>
              </div>
            </div>
            
            <div className="text-center pt-8 border-t border-gray-800">
              <p className="text-sm text-gray-400 mb-2">
                © 2025 الآلات الذكية - Intelligent Machines. جميع الحقوق محفوظة
              </p>
              <p className="text-xs text-gray-500">
                مدعوم بأحدث تقنيات الذكاء الاصطناعي والتعلم العميق
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
