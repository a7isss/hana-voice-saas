"use client";
import { ChevronLeftIcon } from "@/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function SignInForm() {
  const router = useRouter();

  // Auto-login for superadmin - goes directly to dashboard
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 2000); // 2 second delay to show the login page briefly
    
    return () => clearTimeout(timer);
  }, [router]);
  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Superadmin Login
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Welcome to Hana Voice SaaS Admin Panel
            </p>
          </div>
            <div>
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-brand-100 rounded-full dark:bg-brand-900">
                    <svg className="w-8 h-8 text-brand-600 dark:text-brand-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Auto-login in progress...
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    You will be redirected to the dashboard automatically
                  </p>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div className="bg-brand-600 h-2.5 rounded-full animate-pulse" style={{width: '70%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
