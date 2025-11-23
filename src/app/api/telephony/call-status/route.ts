import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { call_session_id, status, duration } = body;

        // Only deduct token for successful calls (e.g., 'completed' or 'answered' with duration > 0)
        // Adjust logic based on actual status codes
        const isBillable = status === 'completed' || (status === 'answered' && duration > 0);

        if (!isBillable) {
            return NextResponse.json({ message: 'Call not billable' });
        }

        // 1. Get Call Session to find Hospital ID
        const { data: session, error: sessionError } = await supabase
            .from('call_sessions')
            .select('campaign_id, campaigns(hospital_id)')
            .eq('id', call_session_id)
            .single();

        if (sessionError || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // @ts-ignore
        const hospitalId = session.campaigns?.hospital_id;

        if (!hospitalId) {
            return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
        }

        // 2. Deduct Token
        // Fetch current balance
        const { data: currentHospital, error: fetchError } = await supabase
            .from('hospitals')
            .select('token_balance')
            .eq('id', hospitalId)
            .single();

        if (fetchError) throw fetchError;

        const newBalance = (currentHospital.token_balance || 0) - 1;

        const { error: updateHospitalError } = await supabase
            .from('hospitals')
            .update({ token_balance: newBalance })
            .eq('id', hospitalId);

        if (updateHospitalError) throw updateHospitalError;

        // 3. Record Transaction
        const { error: transactionError } = await supabase
            .from('transactions')
            .insert([{
                hospital_id: hospitalId,
                amount: -1,
                transaction_type: 'call_usage',
                description: `Call usage for session ${call_session_id}`,
                reference_id: call_session_id,
                created_at: new Date().toISOString()
            }]);

        if (transactionError) {
            console.error('Failed to record transaction:', transactionError);
        }

        return NextResponse.json({ success: true, message: 'Token deducted' });

    } catch (error: any) {
        console.error('Call status webhook error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
