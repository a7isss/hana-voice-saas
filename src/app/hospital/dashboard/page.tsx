"use client";

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/button/Button';

interface DashboardStats {
    totalCalls: number;
    completedCalls: number;
    failedCalls: number;
    successRate: number;
    totalResponses: number;
    yesResponses: number;
    noResponses: number;
    averageCallDuration: number;
    activeInstitutions: number;
    recentActivity: Array<{
        institution: string;
        calls: number;
        date: string;
        status: 'completed' | 'failed';
    }>;
}

export default function HealthcareCallingDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalCalls: 0,
        completedCalls: 0,
        failedCalls: 0,
        successRate: 0,
        totalResponses: 0,
        yesResponses: 0,
        noResponses: 0,
        averageCallDuration: 0,
        activeInstitutions: 0,
        recentActivity: []
    });

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // Get hospital ID from local storage
                const hospitalUserStr = localStorage.getItem('hospital_user');
                if (!hospitalUserStr) {
                    console.error('No hospital user found in local storage');
                    setIsLoading(false);
                    return;
                }

                const hospitalUser = JSON.parse(hospitalUserStr);
                const hospitalId = hospitalUser.hospital_id || hospitalUser.hospitalId; // Handle both cases

                if (!hospitalId) {
                    console.error('No hospital ID found in user data');
                    setIsLoading(false);
                    return;
                }

                const response = await fetch(`/api/hospital/dashboard?hospitalId=${hospitalId}`);
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                } else {
                    console.error('Failed to fetch dashboard data');
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Healthcare Calling Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Real-time analytics for automated patient surveys
                    </p>
                </div>
                <Button
                    onClick={() => window.location.href = '/calling-robot'}
                    variant="primary"
                >
                    Start New Campaign
                </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="text-blue-600 dark:text-blue-400 text-2xl mr-3">📞</div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Calls</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCalls.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="text-green-600 dark:text-green-400 text-2xl mr-3">✓</div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.successRate}%</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="text-purple-600 dark:text-purple-400 text-2xl mr-3">🏥</div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Institutions</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeInstitutions}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="text-orange-600 dark:text-orange-400 text-2xl mr-3">⏱️</div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Duration</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageCallDuration}s</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Call Performance */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Call Performance</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Completed Calls</span>
                            <span className="font-medium text-green-600">{stats.completedCalls}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Failed Calls</span>
                            <span className="font-medium text-red-600">{stats.failedCalls}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div
                                className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full"
                                style={{ width: '100%' }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>{Math.round((stats.completedCalls / stats.totalCalls) * 100)}% Success</span>
                            <span>{Math.round((stats.failedCalls / stats.totalCalls) * 100)}% Failed</span>
                        </div>
                    </div>
                </div>

                {/* Response Analysis */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Response Analysis</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Positive Responses (Yes)</span>
                            <span className="font-medium text-green-600">{stats.yesResponses}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Negative Responses (No)</span>
                            <span className="font-medium text-red-600">{stats.noResponses}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div
                                className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full"
                                style={{ width: '100%' }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>{Math.round((stats.yesResponses / stats.totalResponses) * 100)}% Yes</span>
                            <span>{Math.round((stats.noResponses / stats.totalResponses) * 100)}% No</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Institution Activity</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Institution
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Calls
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                            {stats.recentActivity.map((activity, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        {activity.institution}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        {activity.calls}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {activity.date}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${activity.status === 'completed'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            }`}>
                                            {activity.status === 'completed' ? 'Completed' : 'Failed'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                        onClick={() => window.location.href = '/hospital/campaigns'}
                        variant="primary"
                        className="w-full"
                    >
                        Start Calling Campaign
                    </Button>
                    <Button
                        onClick={() => window.location.href = '/hospital/reports'}
                        variant="outline"
                        className="w-full"
                    >
                        View Reports
                    </Button>
                    <Button
                        onClick={() => window.location.href = '/sadmin/tools/demo-test-call'}
                        variant="outline"
                        className="w-full"
                    >
                        Test Single Call
                    </Button>
                </div>
            </div>
        </div>
    );
}
