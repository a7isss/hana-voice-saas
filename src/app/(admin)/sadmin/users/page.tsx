'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, UserIcon, GroupIcon, PlusIcon, SearchIcon, MoreDotIcon, PencilIcon, TrashBinIcon, BoltIcon } from '../../../../icons/index';

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'hospital_admin' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  hospital_id?: string;
  hospital_name?: string;
  token_balance?: number; // New field
  last_login: string;
  created_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Recharge Modal State
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState<number>(100);
  const [rechargeUser, setRechargeUser] = useState<User | null>(null);
  const [isRecharging, setIsRecharging] = useState(false);

  // Mock data for now
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        username: 'ahmadyounis',
        email: 'ahmadyounis@example.com',
        full_name: 'Ahmad Younis',
        role: 'super_admin',
        status: 'active',
        last_login: '2025-11-22T08:30:00Z',
        created_at: '2025-10-01T00:00:00Z'
      },
      {
        id: '2',
        username: 'dr_smith',
        email: 'drsmith@kfh.com',
        full_name: 'Dr. Smith',
        role: 'hospital_admin',
        status: 'active',
        hospital_id: '1',
        hospital_name: 'King Khalid Hospital',
        token_balance: 500,
        last_login: '2025-11-21T14:15:00Z',
        created_at: '2025-10-15T00:00:00Z'
      },
      {
        id: '3',
        username: 'nurse_johnson',
        email: 'njohnson@kfh.com',
        full_name: 'Nurse Johnson',
        role: 'user',
        status: 'active',
        hospital_id: '1',
        hospital_name: 'King Khalid Hospital',
        last_login: '2025-11-21T09:45:00Z',
        created_at: '2025-10-20T00:00:00Z'
      },
      {
        id: '4',
        username: 'admin_faisal',
        email: 'admin@kfh Jeddah.com',
        full_name: 'Admin Faisal',
        role: 'hospital_admin',
        status: 'inactive',
        hospital_id: '2',
        hospital_name: 'King Faisal Hospital',
        token_balance: 120,
        last_login: '2025-11-15T16:30:00Z',
        created_at: '2025-09-10T00:00:00Z'
      },
      {
        id: '5',
        username: 'support_suspended',
        email: 'support@suspended.com',
        full_name: 'Suspended User',
        role: 'user',
        status: 'suspended',
        hospital_id: '3',
        hospital_name: 'Children\'s Hospital',
        last_login: '2025-11-10T11:20:00Z',
        created_at: '2025-08-05T00:00:00Z'
      }
    ];

    setUsers(mockUsers);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = selectedRole === 'all' || user.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'مشرف أعلى';
      case 'hospital_admin': return 'مشرف مستشفى';
      case 'user': return 'مستخدم';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'hospital_admin': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'inactive': return 'غير نشط';
      case 'suspended': return 'معلق';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOpenRecharge = (user: User) => {
    setRechargeUser(user);
    setRechargeAmount(100);
    setShowRechargeModal(true);
  };

  const handleRechargeSubmit = async () => {
    if (!rechargeUser || !rechargeUser.hospital_id) return;

    setIsRecharging(true);
    try {
      // Call API to recharge
      const response = await fetch('/api/sadmin/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId: rechargeUser.hospital_id,
          amount: rechargeAmount,
          adminId: 'current-admin-id' // Replace with actual auth user id
        })
      });

      if (response.ok) {
        // Update local state
        setUsers(users.map(u => {
          if (u.hospital_id === rechargeUser.hospital_id && u.role === 'hospital_admin') {
            return { ...u, token_balance: (u.token_balance || 0) + rechargeAmount };
          }
          return u;
        }));
        setShowRechargeModal(false);
        alert('تم شحن الرصيد بنجاح');
      } else {
        alert('حدث خطأ أثناء الشحن');
      }
    } catch (error) {
      console.error('Recharge failed', error);
      alert('فشل الاتصال بالخادم');
    } finally {
      setIsRecharging(false);
    }
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
              إدارة المستخدمين
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              User Management • إدارة المستخدمين والصلاحيات في النظام
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          إضافة مستخدم جديد
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="البحث في المستخدمين..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">جميع الأدوار</option>
              <option value="super_admin">مشرف أعلى</option>
              <option value="hospital_admin">مشرف مستشفى</option>
              <option value="user">مستخدم</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  المستخدم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  الدور
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  المستشفى (الرصيد)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  آخر دخول
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-500" />
                        </div>
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.full_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          @{user.username}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div>
                      {user.hospital_name || 'غير محدد'}
                      {user.role === 'hospital_admin' && user.token_balance !== undefined && (
                        <div className="text-xs text-blue-600 font-medium mt-1">
                          الرصيد: {user.token_balance} نقطة
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {getStatusLabel(user.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.last_login).toLocaleString('ar-SA')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {user.role === 'hospital_admin' && (
                        <button
                          onClick={() => handleOpenRecharge(user)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="شحن رصيد"
                        >
                          <BoltIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        aria-label="Edit user"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        aria-label="Delete user"
                      >
                        <TrashBinIcon className="h-4 w-4" />
                      </button>
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="More options"
                      >
                        <MoreDotIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">{users.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المستخدمين</p>
            </div>
            <UserIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {users.filter(u => u.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">مستخدمين نشطين</p>
            </div>
            <GroupIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {users.filter(u => u.role === 'hospital_admin').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">مشرفي المستشفيات</p>
            </div>
            <GroupIcon className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.role === 'super_admin').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">مشرفي النظام</p>
            </div>
            <UserIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Recharge Modal */}
      {showRechargeModal && rechargeUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              شحن رصيد - {rechargeUser.hospital_name}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                عدد النقاط
              </label>
              <input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min="1"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRechargeModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                إلغاء
              </button>
              <button
                onClick={handleRechargeSubmit}
                disabled={isRecharging}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isRecharging ? 'جاري الشحن...' : 'تأكيد الشحن'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
