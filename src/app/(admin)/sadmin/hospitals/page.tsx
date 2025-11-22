'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, UsersIcon, HospitalIcon, PlusIcon, SearchIcon } from '../../../icons/index';

export default function HospitalManagement() {
  const hospitals = [
    {
      id: '1',
      name: 'مستشفى الملك خالد',
      name_en: 'King Khalid Hospital',
      city: 'الرياض',
      status: 'active',
      campaigns: 45,
      success_rate: 92.5,
      patients: 2500,
      last_active: '2025-11-21T10:30:00Z'
    },
    {
      id: '2',
      name: 'مستشفى الملك فيصل',
      name_en: 'King Faisal Hospital',
      city: 'جدة',
      status: 'active',
      campaigns: 38,
      success_rate: 88.9,
      patients: 1800,
      last_active: '2025-11-21T09:15:00Z'
    },
    {
      id: '3',
      name: 'مستشفى الأطفال',
      name_en: 'Children\'s Hospital',
      city: 'الدمام',
      status: 'warning',
      campaigns: 12,
      success_rate: 75.3,
      patients: 950,
      last_active: '2025-11-20T16:45:00Z'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/sadmin"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              إدارة المستشفيات
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Hospital Management • إدارة المستشفيات المسجلة في النظام
            </p>
          </div>
        </div>

        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors">
          <PlusIcon className="h-4 w-4" />
          إضافة مستشفى جديد
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
                placeholder="البحث في المستشفيات..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="">جميع المدن</option>
              <option value="riyadh">الرياض</option>
              <option value="jeddah">جدة</option>
              <option value="dammam">الدمام</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
              <option value="warning">تحذير</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hospitals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hospitals.map((hospital) => (
          <div
            key={hospital.id}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${
                  hospital.status === 'active' ? 'bg-green-100 text-green-600' :
                  hospital.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <HospitalIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {hospital.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {hospital.name_en}
                  </p>
                </div>
              </div>
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                hospital.status === 'active' ? 'bg-green-100 text-green-800' :
                hospital.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {hospital.status === 'active' ? 'نشط' :
                 hospital.status === 'warning' ? 'تحذير' : 'غير نشط'}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">المدينة:</span>
                <span className="font-medium text-gray-900 dark:text-white">{hospital.city}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">الحملات:</span>
                <span className="font-medium text-gray-900 dark:text-white">{hospital.campaigns}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">نسبة النجاح:</span>
                <span className={`font-medium ${
                  hospital.success_rate > 90 ? 'text-green-600' :
                  hospital.success_rate > 80 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {hospital.success_rate}%
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">المرضى:</span>
                <span className="font-medium text-gray-900 dark:text-white">{hospital.patients.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                عرض التفاصيل
              </button>
              <button className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors">
                تعديل
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">{hospitals.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المستشفيات</p>
            </div>
            <HospitalIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {hospitals.filter(h => h.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">مستشفيات نشطة</p>
            </div>
            <UsersIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {hospitals.reduce((sum, h) => sum + h.campaigns, 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الحملات</p>
            </div>
            <HospitalIcon className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {(hospitals.reduce((sum, h) => sum + h.patients, 0)).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المرضى</p>
            </div>
            <UsersIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
