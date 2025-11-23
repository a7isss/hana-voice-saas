import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { patientName, phoneNumber, templateId, campaignId } = body;

        // 1. Create Call Session Record
        const { data: session, error } = await supabase
            .from('call_sessions')
            .insert([{
                campaign_id: campaignId,
                patient_id: 'temp-patient-id', // In real app, create patient record first
                status: 'queued',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        // 2. SIMULATION: Trigger the "Call" (Mocking the Maqsam interaction)
        // In a real app, this would make a request to Maqsam API to initiate the call.
        // Here, we just simulate a delay and update the DB.
        simulateCall(session.id);

        return NextResponse.json({
            success: true,
            sessionId: session.id,
            message: 'Call queued successfully'
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function simulateCall(sessionId: string) {
    // Wait 5 seconds to simulate ringing and talking
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Update to 'completed'
    await supabase
        .from('call_sessions')
        .update({
            status: 'completed',
            call_duration_seconds: Math.floor(Math.random() * 60) + 30 // Random duration 30-90s
        })
        .eq('id', sessionId);
}
