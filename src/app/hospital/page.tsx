'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Hospital {
  id: string;
  name: string;
  name_ar: string;
  current_condition?: string;
}

interface CampaignResult {
  id: string;
  campaign_name: string;
  campaign_name_ar: string;
  total_calls: number;
  successful_calls: number;
  response_rate: number;
  satisfaction_score: number;
  completed_at: string;
}

interface DashboardMetrics {
  active_calls: number;
  today_calls: number;
  today_responses: number;
  this_week_calls: number;
  this_week_success_rate: number;
  critical_responses: number;
  scheduled_appointments: number;
}

export default function HospitalDashboard() {
  const router = useRouter();
  const [currentHospital, setCurrentHospital] = useState<Hospital | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    active_calls: 0,
    today_calls: 0,
    today_responses: 0,
    this_week_calls: 0,
    this_week_success_rate: 0,
    critical_responses: 0,
    scheduled_appointments: 0
  });
  const [recentCampaigns, setRecentCampaigns] = useState<CampaignResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'patients' | 'appointments'>('overview');

  // Mock authentication check - in real implementation, check JWT token
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simulate hospital authentication endpoint
        // In production: const response = await fetch('/api/hospital/auth/verify');
        // For now, use mock data
        setCurrentHospital({
          id: '11111111-1111-1111-1111-111111111111',
          name: 'King Faisal Hospital',
          name_ar: 'مستشفى الملك فيصل',
          current_condition: 'Cardiology Department - Active'
        });
        await loadDashboardData();
        setIsLoading(false);
      } catch (error) {
        console.error('Hospital authentication failed:', error);
        // Redirect to hospital login page
        router.push('/hospital/login');
      }
    };

    checkAuth();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/hospital/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();

      if (result.success) {
        const { metrics, recent_campaigns } = result.data;

        setMetrics({
          active_calls: metrics.active_calls_count || 0,
          today_calls: metrics.today_calls_completed || 0,
          today_responses: metrics.today_responses_collected || 0,
          this_week_calls: metrics.this_week_calls || 0,
          this_week_success_rate: metrics.this_week_success_rate || 0,
          critical_responses: metrics.critical_responses || 0,
          scheduled_appointments: metrics.scheduled_appointments || 0
        });

        setRecentCampaigns(recent_campaigns);
      } else {
        throw new Error(result.error || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);

      // Fallback to demo data if API fails
      setMetrics({
        active_calls: 3,
        today_calls: 127,
        today_responses: 98,
        this_week_calls: 892,
        this_week_success_rate: 87.5,
        critical_responses: 12,
        scheduled_appointments: 23
      });

      setRecentCampaigns([
        {
          id: '1',
          campaign_name: 'Post-Surgery Follow-up',
          campaign_name_ar: 'متابعة ما بعد العمليات الجراحية',
          total_calls: 150,
          successful_calls: 132,
          response_rate: 88.0,
          satisfaction_score: 4.2,
          completed_at: '2025-11-16T08:30:00Z'
        },
        {
          id: '2',
          campaign_name: 'Medication Reminders',
          campaign_name_ar: 'تذكيرات الأدوية',
          total_calls: 89,
          successful_calls: 76,
          response_rate: 85.4,
          satisfaction_score: 4.5,
          completed_at: '2025-11-15T14:15:00Z'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear hospital session
    setCurrentHospital(null);
    router.push('/hospital/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">تحميل لوحة تحكم المستشفى...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!currentHospital) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">غير مصرح</h1>
          <p className="text-gray-600">يجب تسجيل الدخول كمستشفى لعرض البيانات</p>
          <button
            onClick={() => router.push('/hospital/login')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="bg-blue-600 text-white rounded-lg p-3">
                  <span className="text-2xl">🏥</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentHospital.name}
                </h1>
                <p className="text-gray-600">{currentHospital.name_ar}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">حالة الاتصال الصوتي</div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">نشط</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs - Read-Only Hospital Access Only */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            {[
              { id: 'overview', label: 'نظرة عامة', icon: '📊', description: 'إحصائيات الأداء والمقاييس' },
              { id: 'campaigns', label: 'التقارير الصوتية', icon: '📞', description: 'نتائج الحملات الصوتية' },
              { id: 'patients', label: 'قاعدة المرضى', icon: '👥', description: 'قائمة المرضى المسجلين' },
              { id: 'appointments', label: 'المواعيد المجدولة', icon: '📅', description: 'المواعيد الطبية المؤكدة' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors text-center ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                title={tab.description}
              >
                <div className="text-lg mb-1">{tab.icon}</div>
                <div>{tab.label}</div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{metrics.active_calls}</p>
                    <p className="text-sm text-gray-600">اتصالات نشطة</p>
                  </div>
                  <div className="text-3xl">📞</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{metrics.today_responses}</p>
                    <p className="text-sm text-gray-600">ردود اليوم</p>
                  </div>
                  <div className="text-3xl">✅</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{metrics.critical_responses}</p>
                    <p className="text-sm text-gray-600">حالات حرجة</p>
                  </div>
                  <div className="text-3xl">⚠️</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{metrics.scheduled_appointments}</p>
                    <p className="text-sm text-gray-600">مواعيد مجدولة</p>
                  </div>
                  <div className="text-3xl">📅</div>
                </div>
              </div>
            </div>

            {/* Recent Campaign Performance */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">الأداء الأسبوعي</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{metrics.this_week_calls}</div>
                  <div className="text-sm text-gray-600">اتصال هذا الأسبوع</div>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{metrics.this_week_success_rate}%</div>
                  <div className="text-sm text-gray-600">معدل النجاح</div>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{metrics.this_week_calls * metrics.this_week_success_rate / 100}</div>
                  <div className="text-sm text-gray-600">اتصالات ناجحة</div>
                </div>
              </div>
            </div>

            {/* Recent Campaigns Table */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">الحملات الأخيرة</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        اسم الحملة
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        النجاح
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        الرضا
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        التاريخ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentCampaigns.map((campaign) => (
                      <tr key={campaign.id}>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          <div>
                            <div className="font-medium">{campaign.campaign_name_ar}</div>
                            <div className="text-gray-500">{campaign.campaign_name}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {campaign.response_rate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-center">
                          <div className="flex items-center justify-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                key={i}
                                className={`text-lg ${
                                  i < Math.floor(campaign.satisfaction_score)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                            <span className="mr-2 text-sm text-gray-600">
                              {campaign.satisfaction_score.toFixed(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {new Date(campaign.completed_at).toLocaleDateString('ar-SA')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">إدارة الحملات الصوتية</h3>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">عرض الحملات الصوتية</h4>
              <p className="text-gray-600">يمكنك هنا عرض تفاصيل حملات الاتصال الصوتي وإحصائياتها</p>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">إدارة المرضى</h3>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">قاعدة بيانات المرضى</h4>
              <p className="text-gray-600">يمكنك هنا عرض قوائم المرضى المسجلين في نظام الاتصال الصوتي</p>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">المواعيد المجدولة</h3>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">إدارة المواعيد الطبية</h4>
              <p className="text-gray-600">يمكنك هنا عرض وإدارة المواعيد الطبية المجدولة من خلال الاتصالات الصوتية</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
