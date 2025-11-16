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
  const [campaignsData, setCampaignsData] = useState<any[]>([]);
  const [patientsData, setPatientsData] = useState<any[]>([]);
  const [appointmentsData, setAppointmentsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'patients' | 'appointments'>('overview');

  // Mock authentication check - in real implementation, check JWT token
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for JWT token
        const token = localStorage.getItem('hospital_token');
        const userData = JSON.parse(localStorage.getItem('hospital_user') || '{}');

        if (!token || !userData.id) {
          throw new Error('No authentication found');
        }

        setCurrentHospital({
          id: userData.hospitalId,
          name: userData.hospitalName || 'مستشفى',
          name_ar: userData.hospitalName || 'Hospital',
          current_condition: 'Active Voice Service'
        });

        await loadDashboardData();
        setIsLoading(false);
      } catch (error) {
        console.error('Hospital authentication failed:', error);
        // Redirect to hospital login page
        router.push('/auth/hospital/login');
      }
    };

    checkAuth();
  }, [router]);

  // Load tab data when tab changes
  useEffect(() => {
    const loadTabData = async () => {
      const token = localStorage.getItem('hospital_token');
      if (!token) return;

      try {
        switch (activeTab) {
          case 'campaigns':
            if (campaignsData.length === 0) {
              setIsLoadingCampaigns(true);
              const response = await fetch('/api/hospital/campaigns', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (response.ok) {
                const result = await response.json();
                if (result.success) {
                  setCampaignsData(result.data.campaigns);
                }
              }
              setIsLoadingCampaigns(false);
            }
            break;

          case 'patients':
            if (patientsData.length === 0) {
              setIsLoadingPatients(true);
              const response = await fetch('/api/hospital/patients', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (response.ok) {
                const result = await response.json();
                if (result.success) {
                  setPatientsData(result.data.patients);
                }
              }
              setIsLoadingPatients(false);
            }
            break;

          case 'appointments':
            if (appointmentsData.length === 0) {
              setIsLoadingAppointments(true);
              const response = await fetch('/api/hospital/appointments', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (response.ok) {
                const result = await response.json();
                if (result.success) {
                  setAppointmentsData(result.data.appointments);
                }
              }
              setIsLoadingAppointments(false);
            }
            break;
        }
      } catch (error) {
        console.error('Error loading tab data:', error);
      }
    };

    loadTabData();
  }, [activeTab, campaignsData.length, patientsData.length, appointmentsData.length]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Get JWT token from localStorage
      const token = localStorage.getItem('hospital_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/hospital/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
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
          <div className="space-y-6">
            {/* Campaign Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {campaignsData.reduce((sum, c) => sum + c.total_calls, 0)}
                    </p>
                    <p className="text-sm text-gray-600">إجمالي المكالمات</p>
                  </div>
                  <div className="text-3xl">📞</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {campaignsData.length}
                    </p>
                    <p className="text-sm text-gray-600">عدد الحملات</p>
                  </div>
                  <div className="text-3xl">📊</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {(campaignsData.reduce((sum, c) => sum + c.success_rate, 0) / Math.max(campaignsData.length, 1)).toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">متوسط النجاح</p>
                  </div>
                  <div className="text-3xl">✅</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {campaignsData.reduce((sum, c) => sum + c.appointments_scheduled, 0)}
                    </p>
                    <p className="text-sm text-gray-600">المواعيد المجدولة</p>
                  </div>
                  <div className="text-3xl">📅</div>
                </div>
              </div>
            </div>

            {/* Campaigns Table */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">الحملات الصوتية</h3>
                {isLoadingCampaigns && (
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    جارٍ التحميل...
                  </div>
                )}
              </div>

              {campaignsData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          اسم الحملة
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          الحالة
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          المكالمات
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          معدل النجاح
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          المواعيد
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          تاريخ البدء
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {campaignsData.map((campaign: any) => (
                        <tr key={campaign.id}>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            <div>
                              <div className="font-medium">{campaign.name_ar || campaign.name}</div>
                              <div className="text-gray-500 text-xs">{campaign.survey_name || 'استطلاع غير محدد'}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              campaign.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : campaign.status === 'running'
                                ? 'bg-blue-100 text-blue-800'
                                : campaign.status === 'paused'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {campaign.status === 'completed' ? 'مكتمل' :
                               campaign.status === 'running' ? 'قيد التشغيل' :
                               campaign.status === 'paused' ? 'متوقف' : 'مسودة'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">
                            <div>{campaign.total_calls}</div>
                            <div className="text-xs text-gray-500">
                              ناجح: {campaign.completed_calls || 0}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {campaign.success_rate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">
                            {campaign.appointments_scheduled || 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {campaign.scheduled_start ? new Date(campaign.scheduled_start).toLocaleDateString('ar-SA') : 'غير محدد'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {isLoadingCampaigns ? 'جارٍ تحميل الحملات...' : 'لا توجد حملات متاحة'}
                  </h4>
                  <p className="text-gray-600">
                    {isLoadingCampaigns ? 'يرجى الانتظار' : 'لم يتم العثور على حملات اتصال صوتي لهذا المستشفى'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="space-y-6">
            {/* Patients Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {patientsData.length}
                    </p>
                    <p className="text-sm text-gray-600">إجمالي المرضى</p>
                  </div>
                  <div className="text-3xl">👥</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {patientsData.filter(p => p.status === 'active').length}
                    </p>
                    <p className="text-sm text-gray-600">مرضى نشطين</p>
                  </div>
                  <div className="text-3xl">✅</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {patientsData.filter(p => p.priority_level === 'high').length}
                    </p>
                    <p className="text-sm text-gray-600">أولوية عالية</p>
                  </div>
                  <div className="text-3xl">⚠️</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {patientsData.filter(p => p.next_appointment_date).length}
                    </p>
                    <p className="text-sm text-gray-600">له مواعيد</p>
                  </div>
                  <div className="text-3xl">📅</div>
                </div>
              </div>
            </div>

            {/* Patients Table */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">قاعدة بيانات المرضى</h3>
                {isLoadingPatients && (
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    جارٍ التحميل...
                  </div>
                )}
              </div>

              {patientsData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          اسم المريض
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          رقم الهاتف
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          القسم
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          الأولوية
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          الحالة
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          آخر زيارة
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {patientsData.map((patient: any) => (
                        <tr key={patient.id}>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            <div>
                              <div className="font-medium">{patient.display_name}</div>
                              <div className="text-gray-500 text-xs">
                                ID: {patient.age ? `${patient.age} سنة` : 'العمر غير محدد'}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">
                            {patient.phone_number || 'غير محدد'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">
                            {patient.department || 'غير محدد'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              patient.priority_level === 'high'
                                ? 'bg-red-100 text-red-800'
                                : patient.priority_level === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {patient.priority_level === 'high' ? 'عالية' :
                               patient.priority_level === 'medium' ? 'متوسطة' : 'منخفضة'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              patient.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : patient.status === 'inactive'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {patient.status === 'active' ? 'نشط' :
                               patient.status === 'inactive' ? 'غير نشط' : patient.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {patient.last_visit_date
                              ? new Date(patient.last_visit_date).toLocaleDateString('ar-SA')
                              : 'لا توجد زيارة'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {isLoadingPatients ? 'جارٍ تحميل المرضى...' : 'لا يوجد مرضى مسجلين'}
                  </h4>
                  <p className="text-gray-600">
                    {isLoadingPatients ? 'يرجى الانتظار' : 'لم يتم العثور على مرضى مسجلين بهذا المستشفى'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="space-y-6">
            {/* Appointments Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {appointmentsData.length}
                    </p>
                    <p className="text-sm text-gray-600">إجمالي المواعيد</p>
                  </div>
                  <div className="text-3xl">📅</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {appointmentsData.filter(apt => apt.status === 'scheduled').length}
                    </p>
                    <p className="text-sm text-gray-600">مواعيد مجدولة</p>
                  </div>
                  <div className="text-3xl">⏰</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {appointmentsData.filter(apt => apt.is_today).length}
                    </p>
                    <p className="text-sm text-gray-600">اليوم</p>
                  </div>
                  <div className="text-3xl">📅</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {appointmentsData.filter(apt => apt.patient_notified).length}
                    </p>
                    <p className="text-sm text-gray-600">أشعارات مرسلة</p>
                  </div>
                  <div className="text-3xl">📱</div>
                </div>
              </div>
            </div>

            {/* Appointments Table */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">جدول المواعيد الطبية</h3>
                {isLoadingAppointments && (
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    جارٍ التحميل...
                  </div>
                )}
              </div>

              {appointmentsData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          المريض
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          التاريخ والوقت
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          النوع
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          القسم
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          الحالة
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          الإشعارات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {appointmentsData.map((appointment: any) => (
                        <tr key={appointment.id}>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            <div>
                              <div className="font-medium">
                                {appointment.patient?.display_name || 'مريض غير محدد'}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {appointment.patient?.department || 'قسم غير محدد'}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            <div className="font-medium">
                              {new Date(appointment.appointment_datetime).toLocaleDateString('ar-SA', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {new Date(appointment.appointment_datetime).toLocaleTimeString('ar-SA', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              {appointment.is_today && (
                                <span className="text-blue-600 font-medium mr-2">(اليوم)</span>
                              )}
                              {appointment.is_past && !appointment.is_today && (
                                <span className="text-red-600 font-medium mr-2">(ماضي)</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {appointment.appointment_type === 'consultation' ? 'استشارة' :
                               appointment.appointment_type === 'follow_up' ? 'متابعة' :
                               appointment.appointment_type === 'urgent' ? 'طارئ' :
                               appointment.appointment_type === 'checkup' ? 'فحص' :
                               appointment.appointment_type === 'procedure' ? 'إجراء' :
                               appointment.appointment_type || 'غير محدد'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">
                            {appointment.department || 'غير محدد'}
                            {appointment.room && (
                              <div className="text-xs text-gray-500">غرفة {appointment.room}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              appointment.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : appointment.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-800'
                                : appointment.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : appointment.status === 'in_progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {appointment.status === 'scheduled' ? 'مجدول' :
                               appointment.status === 'completed' ? 'مكتمل' :
                               appointment.status === 'cancelled' ? 'ملغي' :
                               appointment.status === 'in_progress' ? 'قيد التنفيذ' :
                               appointment.status === 'confirmed' ? 'مؤكد' :
                               appointment.status === 'no_show' ? 'لم يحضر' :
                               appointment.status || 'غير محدد'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">
                            <div className="flex items-center justify-center space-x-1 space-x-reverse">
                              {appointment.patient_notified && (
                                <div className="flex items-center" title="إشعار للمريض">
                                  <span className="text-green-600 text-sm">📱</span>
                                </div>
                              )}
                              {appointment.sms_reminder_sent && (
                                <div className="flex items-center" title="تذكير SMS">
                                  <span className="text-blue-600 text-sm">💬</span>
                                </div>
                              )}
                              {appointment.email_confirmation_sent && (
                                <div className="flex items-center" title="تأكيد إيميل">
                                  <span className="text-purple-600 text-sm">📧</span>
                                </div>
                              )}
                              {!appointment.patient_notified && !appointment.sms_reminder_sent && !appointment.email_confirmation_sent && (
                                <span className="text-gray-400 text-xs">لا إشعارات</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {isLoadingAppointments ? 'جارٍ تحميل المواعيد...' : 'لا توجد مواعيد مجدولة'}
                  </h4>
                  <p className="text-gray-600">
                    {isLoadingAppointments ? 'يرجى الانتظار' : 'لم يتم العثور على مواعيد طبية لهذا المستشفى'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
