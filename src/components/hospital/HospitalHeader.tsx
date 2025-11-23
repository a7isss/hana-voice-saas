'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Hospital {
    id: string;
    name: string;
    name_ar: string;
}

export default function HospitalHeader() {
    const router = useRouter();
    const [currentHospital, setCurrentHospital] = useState<Hospital | null>(null);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('hospital_user') || '{}');
        if (userData.hospitalId) {
            setCurrentHospital({
                id: userData.hospitalId,
                name: userData.hospitalName || 'مستشفى',
                name_ar: userData.hospitalName || 'Hospital',
            });
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('hospital_token');
        localStorage.removeItem('hospital_user');
        router.push('/auth/hospital/login');
    };

    if (!currentHospital) return null;

    return (
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
    );
}
