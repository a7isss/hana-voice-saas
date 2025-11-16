'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Hospital {
  id: string;
  name: string;
  name_ar: string;
  description?: string;
  city: string;
  region: string;
  phone_number?: string;
  email_domain?: string;
  status: 'active' | 'inactive' | 'suspended';
  subscription_level: string;
  created_at: string;
  updated_at: string;
  stats: {
    total_patients: number;
    total_campaigns: number;
    total_appointments: number;
  };
}

interface SignupRequest {
  id: string;
  user_id: string;
  hospital_id: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at?: string;
  review_notes?: string;
  hospital_name?: string;
  admin_name?: string;
  admin_email?: string;
}

export default function HospitalManagementPage() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [signupRequests, setSignupRequests] = useState<SignupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hospitals' | 'signup-requests'>('hospitals');
  const [showCreateHospitalModal, setShowCreateHospitalModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    description: '',
    city: '',
    region: '',
    phone_number: '',
    email_domain: '',
    subscription_level: 'starter',
    admin_email: '',
    admin_name: '',
    admin_phone: ''
  });

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = () => {
    // For now, assume super admin is logged in
    // In production, check JWT token/API
    const token = localStorage.getItem('super_admin_token');
    if (!token) {
      router.push('/auth/super-admin/login');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Load hospitals
      const hospitalsResponse = await fetch('/api/admin/hospitals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`
        }
      });

      if (hospitalsResponse.ok) {
        const result = await hospitalsResponse.json();
        if (result.success) {
          setHospitals(result.data.hospitals);
        }
      }

      // Load signup requests
      const requestsResponse = await fetch('/api/admin/hospital-signup-requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`
        }
      });

      if (requestsResponse.ok) {
        const result = await requestsResponse.json();
        if (result.success) {
          setSignupRequests(result.data.requests);
        }
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/admin/hospitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`تم إنشاء المستشفى بنجاح! كلمة المرور المؤقتة: ${result.data.hospital.temp_password}`);

        // Reset form and close modal
        setFormData({
          name: '',
          name_ar: '',
          description: '',
          city: '',
          region: '',
          phone_number: '',
          email_domain: '',
          subscription_level: 'starter',
          admin_email: '',
          admin_name: '',
          admin_phone: ''
        });
        setShowCreateHospitalModal(false);
        loadData(); // Refresh data
      } else {
        const error = await response.json();
        alert('خطأ في إنشاء المستشفى: ' + error.error);
      }
    } catch (error) {
      console.error('Error creating hospital:', error);
      alert('حدث خطأ غير متوقع');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white rounded-lg p-3">
                <span className="text-2xl">🏥</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  إدارة المستشفيات
                </h1>
                <p className="text-gray-600">مركز الإدارة الرئيسي للمستشفيات</p>
              </div>
            </div>

            <button
              onClick={() => router.push('/sadmin')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{hospitals.length}</p>
                <p className="text-sm text-gray-600">إجمالي المستشفيات</p>
              </div>
              <div className="text-3xl">🏥</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {hospitals.filter(h => h.status === 'active').length}
                </p>
                <p className="text-sm text-gray-600">نشطة</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">{signupRequests.length}</p>
                <p className="text-sm text-gray-600">طلبات التسجيل</p>
              </div>
              <div className="text-3xl">📋</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {hospitals.reduce((sum, h) => sum + h.stats.total_patients, 0)}
                </p>
                <p className="text-sm text-gray-600">إجمالي المرضى</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveTab('hospitals')}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'hospitals'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              إدارة المستشفيات ({hospitals.length})
            </button>
            <button
              onClick={() => setActiveTab('signup-requests')}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'signup-requests'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              طلبات التسجيل ({signupRequests.filter(r => r.status === 'pending').length})
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'hospitals' && (
          <div className="space-y-6">
            {/* Header with Create Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">المستشفيات المسجلة</h2>
              <button
                onClick={() => setShowCreateHospitalModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 space-x-reverse"
              >
                <span>+</span>
                <span>إنشاء مستشفى جديد</span>
              </button>
            </div>

            {/* Hospitals Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستشفى</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المنطقة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإحصائيات</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الإنشاء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {hospitals.map((hospital) => (
                      <tr key={hospital.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{hospital.name_ar}</div>
                            <div className="text-gray-500 text-xs">{hospital.name}</div>
                            {hospital.description && (
                              <div className="text-gray-400 text-xs mt-1">{hospital.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-center">
                          <div>{hospital.city}</div>
                          <div className="text-gray-500 text-xs">{hospital.region}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            hospital.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : hospital.status === 'inactive'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {hospital.status === 'active' ? 'نشط' :
                             hospital.status === 'inactive' ? 'غير نشط' : 'معلق'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-center">
                          <div className="space-y-1">
                            <div className="text-xs">
                              <span className="font-medium text-blue-600">{hospital.stats.total_patients}</span> مريض
                            </div>
                            <div className="text-xs">
                              <span className="font-medium text-green-600">{hospital.stats.total_campaigns}</span> حملة
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">
                          {new Date(hospital.created_at).toLocaleDateString('ar-SA')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {hospitals.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏥</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">لا توجد مستشفيات</h4>
                  <p className="text-gray-600 mb-6">ابدأ بإنشاء اول مشفى في النظام</p>
                  <button
                    onClick={() => setShowCreateHospitalModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                  >
                    إنشاء المستشفى الأول
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'signup-requests' && (
          <div className="space-y-6">
            {/* Signup Requests Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">طلبات تسجيل المستشفيات</h3>
                <p className="text-gray-600 text-sm">مراجعة وإقرار طلبات التسجيل الجديدة</p>
              </div>

              {signupRequests.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الطلب</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المدير</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الطلب</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {signupRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{request.hospital_name}</div>
                              <div className="text-gray-500 text-xs">ID: {request.id.slice(-8)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right">
                            <div>
                              <div className="font-medium">{request.admin_name}</div>
                              <div className="text-gray-500 text-xs">{request.admin_email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right">
                            {new Date(request.requested_at).toLocaleDateString('ar-SA')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              request.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : request.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {request.status === 'pending' ? 'في الانتظار' :
                               request.status === 'approved' ? 'مُعتمد' : 'مرفوض'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-center">
                            <div className="flex space-x-2 space-x-reverse">
                              <button className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">
                                قبول
                              </button>
                              <button className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700">
                                رفض
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">لا توجد طلبات</h4>
                  <p className="text-gray-600">لا توجد طلبات تسجيل مستشفيات انتظار المراجعة</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Create Hospital Modal */}
      {showCreateHospitalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">إنشاء مستشفى جديد</h3>
                <button
                  onClick={() => setShowCreateHospitalModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateHospital} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      اسم المستشفى (إنجليزي) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الاسم بالعربية *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name_ar}
                      onChange={(e) => setFormData({...formData, name_ar: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الوصف
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="وصف مختصر للمستشفى"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      المدينة *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      المنطقة *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.region}
                      onChange={(e) => setFormData({...formData, region: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="مثال: الرياض، جدة، الدمام"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نطاق البريد الإلكتروني
                    </label>
                    <input
                      type="text"
                      value={formData.email_domain}
                      onChange={(e) => setFormData({...formData, email_domain: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="hospital.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    مستوى الاشتراك
                  </label>
                  <select
                    value={formData.subscription_level}
                    onChange={(e) => setFormData({...formData, subscription_level: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="starter">بداية</option>
                    <option value="professional">متقدم</option>
                    <option value="enterprise">مؤسسي</option>
                  </select>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">معلومات مدير المستشفى</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        اسم المدير *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.admin_name}
                        onChange={(e) => setFormData({...formData, admin_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        البريد الإلكتروني *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.admin_email}
                        onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        رقم الهاتف *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.admin_phone}
                        onChange={(e) => setFormData({...formData, admin_phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateHospitalModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    إنشاء المستشفى
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
