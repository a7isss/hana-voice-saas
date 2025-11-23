import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
    try {
        const { hospitalId, amount, userId, paymentMethod } = await request.json();

        if (!hospitalId || !amount || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Calculate VAT (15%)
        const vatRate = 0.15;
        const subtotal = amount; // Assuming 1 token = 1 SAR for simplicity, or amount is the token count
        // Let's assume amount is token count, and price per token is 1 SAR
        const pricePerToken = 1.0;
        const totalCost = amount * pricePerToken;
        const vatAmount = totalCost * vatRate;
        const totalWithVat = totalCost + vatAmount;

        // Mock Payment Processing
        // In real app, verify payment with gateway here
        const paymentSuccess = true;

        if (!paymentSuccess) {
            return NextResponse.json({ error: 'Payment failed' }, { status: 402 });
        }

        // Update Balance
        // Fetch current balance
        const { data: currentHospital, error: fetchError } = await supabase
            .from('hospitals')
            .select('token_balance')
            .eq('id', hospitalId)
            .single();

        if (fetchError) throw fetchError;

        const newBalance = (currentHospital.token_balance || 0) + amount;

        const { error: updateHospitalError } = await supabase
            .from('hospitals')
            .update({ token_balance: newBalance })
            .eq('id', hospitalId);

        if (updateHospitalError) throw updateHospitalError;

        // Record Transaction
        const { error: transactionError } = await supabase
            .from('transactions')
            .insert([{
                hospital_id: hospitalId,
                amount: amount,
                transaction_type: 'recharge',
                description: `Purchase of ${amount} tokens (VAT: ${vatAmount.toFixed(2)} SAR)`,
                created_by: userId,
                created_at: new Date().toISOString()
            }]);

        if (transactionError) {
            console.error('Failed to record transaction:', transactionError);
        }

        return NextResponse.json({
            success: true,
            message: 'Tokens purchased successfully',
            details: {
                tokens: amount,
                vat: vatAmount,
                total: totalWithVat
            }
        });

    } catch (error: any) {
        console.error('Billing recharge error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
