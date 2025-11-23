'use client';

import React from 'react';
import HospitalAuthGuard from '@/components/auth/HospitalAuthGuard';
import HospitalHeader from '@/components/hospital/HospitalHeader';

export default function HospitalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <HospitalAuthGuard>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <HospitalHeader />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </main>
            </div>
        </HospitalAuthGuard>
    );
}
