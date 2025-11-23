'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, CreditCard, CheckCircle, Lock } from 'lucide-react';

export default function CheckoutPage() {
    const router = useRouter();
    const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const packages = [
        { tokens: 100, price: 100, label: 'Starter' },
        { tokens: 500, price: 450, label: 'Standard', discount: '10% OFF' }, // 10% discount
        { tokens: 1000, price: 800, label: 'Pro', discount: '20% OFF' }, // 20% discount
        { tokens: 5000, price: 3500, label: 'Enterprise', discount: '30% OFF' } // 30% discount
    ];

    const vatRate = 0.15;

    const selectedPkg = packages.find(p => p.tokens === selectedPackage);
    const subtotal = selectedPkg ? selectedPkg.price : 0;
    const vatAmount = subtotal * vatRate;
    const total = subtotal + vatAmount;

    const handlePurchase = async () => {
        if (!selectedPkg) return;

        setIsProcessing(true);

        try {
            // Call API to purchase
            const response = await fetch('/api/billing/recharge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hospitalId: 'current-hospital-id', // Replace with actual context
                    userId: 'current-user-id', // Replace with actual context
                    amount: selectedPkg.tokens,
                    paymentMethod: 'credit_card'
                })
            });

            if (response.ok) {
                // Simulate processing delay
                setTimeout(() => {
                    router.push('/hospital/billing?success=true');
                }, 1500);
            } else {
                alert('Payment failed. Please try again.');
                setIsProcessing(false);
            }
        } catch (error) {
            console.error('Purchase error:', error);
            alert('An error occurred. Please try again.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/hospital/billing"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Buy Tokens
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Select a package to recharge your balance
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Packages Selection */}
                <div className="md:col-span-2 space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Select Package
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {packages.map((pkg) => (
                            <div
                                key={pkg.tokens}
                                onClick={() => setSelectedPackage(pkg.tokens)}
                                className={`relative cursor-pointer p-6 rounded-xl border-2 transition-all ${selectedPackage === pkg.tokens
                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                    }`}
                            >
                                {pkg.discount && (
                                    <span className="absolute top-3 right-3 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                        {pkg.discount}
                                    </span>
                                )}
                                <div className="mb-2">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {pkg.label}
                                    </span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                    {pkg.tokens} <span className="text-lg font-normal text-gray-500">Tokens</span>
                                </div>
                                <div className="text-lg font-medium text-blue-600 dark:text-blue-400">
                                    {pkg.price} SAR
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Payment Method (Mock) */}
                    <div className="mt-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Payment Method
                        </h2>
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center gap-4">
                            <div className="p-2 bg-gray-100 rounded">
                                <CreditCard className="h-6 w-6 text-gray-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Credit Card ending in 4242</p>
                                <p className="text-sm text-gray-500">Expires 12/25</p>
                            </div>
                            <button className="ml-auto text-blue-600 text-sm font-medium hover:underline">
                                Change
                            </button>
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="md:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                            Order Summary
                        </h2>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Package ({selectedPkg?.tokens || 0} tokens)</span>
                                <span>{subtotal.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>VAT (15%)</span>
                                <span>{vatAmount.toFixed(2)} SAR</span>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between font-bold text-lg text-gray-900 dark:text-white">
                                <span>Total</span>
                                <span>{total.toFixed(2)} SAR</span>
                            </div>
                        </div>

                        <button
                            onClick={handlePurchase}
                            disabled={!selectedPackage || isProcessing}
                            className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${!selectedPackage || isProcessing
                                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
                                }`}
                        >
                            {isProcessing ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <Lock className="h-4 w-4" />
                                    Pay {total.toFixed(2)} SAR
                                </>
                            )}
                        </button>

                        <div className="mt-4 text-center text-xs text-gray-500 flex items-center justify-center gap-1">
                            <Lock className="h-3 w-3" />
                            Secure Payment via Stripe (Mock)
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
