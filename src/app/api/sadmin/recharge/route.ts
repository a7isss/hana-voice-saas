import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const { hospitalId, amount, adminId } = await request.json();

    if (!hospitalId || !amount || !adminId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Start transaction (Supabase doesn't support multi-statement transactions via JS client easily without RPC, 
    // but we will do sequential updates for now. In production, use RPC or Postgres functions)

    // 1. Update hospital balance
    const { data: hospital, error: updateError } = await supabase.rpc('add_tokens', {
      p_hospital_id: hospitalId,
      p_amount: amount
    });

    // If RPC doesn't exist, we fall back to direct update (less safe for concurrency but okay for prototype)
    if (updateError) {
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
    }

    // 2. Record transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert([{
        hospital_id: hospitalId,
        amount: amount,
        transaction_type: 'admin_adjustment',
        description: `Manual recharge by admin`,
        created_by: adminId,
        created_at: new Date().toISOString()
      }]);

    if (transactionError) {
      console.error('Failed to record transaction:', transactionError);
      // Note: In a real system we would rollback here
    }

    return NextResponse.json({ success: true, message: 'Tokens added successfully' });
  } catch (error: any) {
    console.error('Recharge error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
