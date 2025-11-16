'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SuperAdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is super admin (from environment or JWT)
    // For now, redirect to campaign page as admin entry point
    router.replace('/campaign');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-700">Redirecting to Super Admin Dashboard...</p>
      </div>
    </div>
  );
}

// This creates /sadmin as a super admin entry point
// The actual admin interface remains at /campaign, /telephony-settings, etc.
// This provides a single /sadmin URL for super admin access
