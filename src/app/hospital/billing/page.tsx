'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    CreditCard,
    Clock,
    CheckCircle,
    XCircle,
    ArrowRight,
    Zap
} from 'lucide-react';

interface Transaction {
    id: string;
    amount: number;
    transaction_type: 'recharge' | 'call_usage' | 'admin_adjustment';
    description: string;
    created_at: string;
    status: 'completed' | 'failed' | 'pending';
}

export default function BillingPage() {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Mock data fetch
        // In real app: fetch from /api/billing/balance and /api/billing/transactions
        setTimeout(() => {
            setBalance(500);
            setTransactions([
                {
                    id: '1',
                    amount: 1000,
                    transaction_type: 'recharge',
                    description: 'Purchase of 1000 tokens (VAT: 150.00 SAR)',
                    created_at: '2025-11-20T10:00:00Z',
                    status: 'completed'
                },
                {
                    id: '2',
                    amount: -1,
                    transaction_type: 'call_usage',
                    description: 'Call usage for session 12345',
                    created_at: '2025-11-21T14:30:00Z',
                    status: 'completed'
                },
                {
                    id: '3',
                    amount: -1,
                    transaction_type: 'call_usage',
                    description: 'Call usage for session 12346',
                    created_at: '2025-11-21T14:35:00Z',
                    status: 'completed'
                },
                {
                    id: '4',
                    amount: 50,
                    transaction_type: 'admin_adjustment',
                    description: 'Manual recharge by admin',
                    created_at: '2025-11-15T09:00:00Z',
                    status: 'completed'
                }
            ]);
            setIsLoading(false);
        }, 1000);
    }, []);

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'recharge': return <CreditCard className="h-5 w-5 text-green-600" />;
            case 'call_usage': return <Zap className="h-5 w-5 text-blue-600" />;
            case 'admin_adjustment': return <CheckCircle className="h-5 w-5 text-purple-600" />;
            default: return <Clock className="h-5 w-5 text-gray-600" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Billing & Tokens
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage your token balance and view transaction history
                    </p>
                </div>
                <Link
                    href="/hospital/billing/checkout"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                    <CreditCard className="h-4 w-4" />
                    Buy Tokens
                </Link>
            </div>

            {/* Balance Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-blue-100 mb-1">Current Balance</p>
                        <h2 className="text-4xl font-bold">{balance.toLocaleString()} <span className="text-xl font-normal">Tokens</span></h2>
                    </div>
                    <div className="bg-white/10 p-4 rounded-full">
                        <Zap className="h-10 w-10 text-white" />
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-blue-100">
                    <CheckCircle className="h-4 w-4" />
                    <span>1 Token = 1 Successful Call</span>
                </div>
            </div>

            {/* Transactions History */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Transaction History
                    </h3>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading transactions...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                                    {getTransactionIcon(tx.transaction_type)}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                                    {tx.transaction_type.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {tx.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString()}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900 dark:text-white'
                                            }`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
