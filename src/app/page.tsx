'use client';

import Link from 'next/link';
import { useState } from 'react';
import AIBrainCircuit from '@/components/common/AIBrainCircuit';

export default function IntelligentMachinesLandingPage() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: '🤖',
      title: 'ذكاء اصطناعي متقدم',
      description: 'تقنية التعلم العميق للتعرف على اللغة العربية بدقة 98%',
      detail: 'نستخدم أحدث نماذج الذكاء الاصطناعي المدربة خصيصاً على اللهجات العربية المختلفة'
    },
    {
      icon: '🎯',
      title: 'تخصيص ذكي',
      description: 'تكيف تلقائي مع احتياجات كل مريض',
      detail: 'النظام يتعلم من كل محادثة ليقدم تجربة أكثر تخصيصاً وفعالية'
    },
    {
      icon: '⚡',
      title: 'استجابة فورية',
      description: 'معالجة صوتية في الوقت الفعلي',
      detail: 'تحليل وفهم الكلام في أقل من 4 ثوان مع ردود طبيعية ومريحة'
    },
    {
      icon: '🔒',
      title: 'أمان متقدم',
      description: 'حماية البيانات الطبية بأعلى المعايير',
      detail: 'معالجة آمنة متوافقة مع HIPAA دون تخزين دائم للبيانات الصوتية'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Hero Section */}
      <div className="relative flex flex-col items-center justify-center min-h-screen px-4 py-16">
        <div className="max-w-6xl w-full">
          
          {/* Brand Header */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center justify-center mb-8">
              <div className="relative">
                <AIBrainCircuit theme="blue" size={300} animationSpeed={0.8} />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-200 via-white to-indigo-200 bg-clip-text text-transparent leading-tight">
              الآلات الذكية
            </h1>
            <p className="text-2xl md:text-3xl text-blue-200 mb-6 font-light">
              Intelligent Machines
            </p>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              حيث يلتقي الذكاء الاصطناعي بالرعاية الصحية
              <br />
              <span className="text-blue-300">منصة التواصل الصوتي الذكي للمؤسسات الطبية</span>
            </p>
          </div>

          {/* Vision Statement */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 md:p-12 mb-16 border border-white/10 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 text-blue-200">رؤيتنا</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full"></div>
            </div>
            <p className="text-lg text-gray-200 leading-relaxed text-center max-w-4xl mx-auto">
              نؤمن بأن <span className="text-blue-300 font-semibold">الآلات الذكية</span> ليست مجرد أدوات تقنية، 
              بل شركاء في تحسين جودة الرعاية الصحية. من خلال الجمع بين 
              <span className="text-indigo-300 font-semibold"> الذكاء الاصطناعي المتقدم</span> و
              <span className="text-blue-300 font-semibold"> الفهم العميق للغة العربية</span>، 
              نمكّن المؤسسات الطبية من التواصل مع مرضاها بطريقة أكثر إنسانية وفعالية، 
              على مدار الساعة، دون حدود.
            </p>
          </div>

          {/* Interactive Features Grid */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12 text-blue-200">
              قوة الذكاء الاصطناعي في خدمتك
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  onMouseEnter={() => setActiveFeature(index)}
                  className={`bg-white/5 backdrop-blur-lg rounded-xl p-6 border transition-all duration-300 cursor-pointer ${
                    activeFeature === index
                      ? 'border-blue-400 shadow-2xl shadow-blue-500/20 scale-105'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2 text-blue-200">{feature.title}</h3>
                  <p className="text-sm text-gray-300 mb-3">{feature.description}</p>
                  <p className={`text-xs text-gray-400 transition-opacity duration-300 ${
                    activeFeature === index ? 'opacity-100' : 'opacity-0'
                  }`}>
                    {feature.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Benefits */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-lg rounded-xl p-6 border border-blue-400/30">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-3 text-blue-200">تحليلات ذكية</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                تحويل المحادثات الصوتية إلى بيانات قابلة للتحليل مع رؤى فورية عن رضا المرضى واحتياجاتهم
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 backdrop-blur-lg rounded-xl p-6 border border-indigo-400/30">
              <div className="text-3xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold mb-3 text-indigo-200">تغطية شاملة</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                الوصول إلى آلاف المرضى في وقت واحد، مع تخصيص كل محادثة حسب الحالة الفردية
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-lg rounded-xl p-6 border border-purple-400/30">
              <div className="text-3xl mb-4">💡</div>
              <h3 className="text-xl font-semibold mb-3 text-purple-200">تعلم مستمر</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                النظام يتحسن تلقائياً مع كل محادثة، ليقدم تجربة أفضل وأكثر دقة بمرور الوقت
              </p>
            </div>
          </div>

          {/* Use Cases */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 md:p-12 mb-16 border border-white/10">
            <h2 className="text-3xl font-bold text-center mb-8 text-blue-200">
              كيف تخدم الآلات الذكية مؤسستك؟
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="text-2xl">🏥</div>
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-blue-200">متابعة ما بعد العمليات</h4>
                  <p className="text-gray-300 text-sm">
                    اتصال تلقائي بالمرضى للاطمئنان على حالتهم وجمع معلومات عن التعافي
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="text-2xl">💊</div>
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-blue-200">تذكير بالأدوية</h4>
                  <p className="text-gray-300 text-sm">
                    مكالمات صوتية ذكية لتذكير المرضى بمواعيد الأدوية والجرعات
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="text-2xl">📅</div>
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-blue-200">تأكيد المواعيد</h4>
                  <p className="text-gray-300 text-sm">
                    تأكيد تلقائي للمواعيد الطبية وإعادة الجدولة عند الحاجة
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="text-2xl">📋</div>
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-blue-200">استطلاعات الرضا</h4>
                  <p className="text-gray-300 text-sm">
                    جمع آراء المرضى بطريقة طبيعية ومريحة عبر المحادثات الصوتية
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600/30 to-indigo-600/30 backdrop-blur-lg rounded-2xl shadow-2xl p-8 md:p-12 border border-blue-400/30">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🏥</div>
              <h3 className="text-3xl font-bold mb-4 text-white">
                ابدأ رحلتك مع الآلات الذكية
              </h3>
              <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                انضم إلى المؤسسات الطبية الرائدة التي تستخدم الذكاء الاصطناعي 
                لتحسين التواصل مع مرضاها وتقديم رعاية أفضل
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/hospital/login"
                className="inline-block bg-white text-blue-900 px-8 py-4 rounded-xl hover:bg-blue-50 transition-all duration-200 text-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105"
              >
                تسجيل دخول المؤسسة
              </Link>
              <Link
                href="/auth/hospital/signup"
                className="inline-block bg-blue-500/20 text-white border-2 border-white/30 px-8 py-4 rounded-xl hover:bg-blue-500/30 transition-all duration-200 text-lg font-semibold hover:scale-105"
              >
                إنشاء حساب جديد
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-white/20 text-center">
              <p className="text-sm text-blue-200">
                جديد على المنصة؟ نقدم <span className="font-semibold">تجربة مجانية</span> لمدة 30 يوماً
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-20 border-t border-white/10 pt-12 w-full max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-lg mb-4 text-blue-200">الآلات الذكية</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                منصة التواصل الصوتي الذكي المدعومة بالذكاء الاصطناعي للمؤسسات الطبية في المنطقة العربية
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4 text-blue-200">تواصل معنا</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p>📧 support@intelligentmachines.sa</p>
                <p>📞 +966 XX XXX XXXX</p>
                <p>🌐 www.intelligentmachines.sa</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4 text-blue-200">التقنية</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p>✓ ذكاء اصطناعي متقدم</p>
                <p>✓ معالجة اللغة العربية</p>
                <p>✓ أمان وخصوصية عالية</p>
              </div>
            </div>
          </div>
          
          <div className="text-center pt-8 border-t border-white/10">
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
  );
}
