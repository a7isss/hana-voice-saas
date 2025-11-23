"use client";
import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface HospitalAuthGuardProps {
    children: ReactNode;
    redirectTo?: string;
}

const HospitalAuthGuard: React.FC<HospitalAuthGuardProps> = ({
    children,
    redirectTo = '/auth/hospital/login'
}) => {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('hospital_token');
            const userData = localStorage.getItem('hospital_user');

            if (token && userData) {
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
                router.push(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`);
            }
            setIsLoading(false);
        };

        checkAuth();
    }, [router, redirectTo]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Checking hospital authentication...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
};

export default HospitalAuthGuard;
