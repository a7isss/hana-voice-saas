import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';

// Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Logger for debugging
const logger = {
  info: (message: string, data?: any) => console.log(`[DATA-API] ${new Date().toISOString()} INFO: ${message}`, data),
  error: (message: string, error?: any) => console.error(`[DATA-API] ${new Date().toISOString()} ERROR: ${message}`, error),
  warn: (message: string, data?: any) => console.warn(`[DATA-API] ${new Date().toISOString()} WARN: ${message}`, data)
};

export async function GET(request: NextRequest) {
  try {
    // Health check endpoint
    const { data, error } = await supabase.from('clients').select('id').limit(1);
    
    if (error) {
      return NextResponse.json(
        { 
          status: 'unhealthy', 
          service: 'hana-data-service',
          database_connected: false,
          excel_generation: false,
          error: error.message 
        },
        { status: 500 }
      );
    }

    // Test Excel generation
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Test');
    worksheet.addRow(['Test Data']);
    
    return NextResponse.json({
      status: 'healthy',
      service: 'hana-data-service',
      database_connected: true,
      excel_generation: true,
      pandas_available: false, // Not using pandas in Node.js
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        service: 'hana-data-service',
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, clientId, startDate, endDate, language } = body;

    switch (action) {
      case 'export-survey-responses':
        return await exportSurveyResponses(clientId, startDate, endDate, language);
      
      case 'export-call-analytics':
        return await exportCallAnalytics(clientId, startDate, endDate, language);
      
      case 'export-customer-list':
        return await exportCustomerList(clientId, language);
      
      case 'get-summary-report':
        return await getSummaryReport(clientId, language);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to process data export request' },
      { status: 500 }
    );
  }
}

async function exportSurveyResponses(clientId: string, startDate?: string, endDate?: string, language?: string) {
  try {
    // Get survey responses from database
    let query = supabase.from('survey_responses').select('*').eq('client_id', clientId);
    
    if (startDate) {
      query = query.gte('timestamp', startDate);
    }
    if (endDate) {
      query = query.lte('timestamp', endDate);
    }
    
    const { data: responses, error } = await query;
    
    if (error) throw error;
    if (!responses || responses.length === 0) {
      return NextResponse.json(
        { error: 'No survey responses found' },
        { status: 404 }
      );
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(language === 'ar' ? 'التقرير' : 'Report');
    
    // Define column headers
    const columns = language === 'ar' ? [
      { header: 'رقم المحادثة', key: 'conversation_id', width: 15 },
      { header: 'رقم المريض', key: 'patient_id', width: 15 },
      { header: 'القسم', key: 'department', width: 20 },
      { header: 'رقم السؤال', key: 'question_id', width: 15 },
      { header: 'نص السؤال', key: 'question_text', width: 30 },
      { header: 'الإجابة', key: 'response', width: 15 },
      { header: 'مستوى الثقة', key: 'confidence', width: 15 },
      { header: 'تم الإجابة', key: 'answered', width: 15 },
      { header: 'التاريخ والوقت', key: 'timestamp', width: 20 }
    ] : [
      { header: 'Conversation ID', key: 'conversation_id', width: 15 },
      { header: 'Patient ID', key: 'patient_id', width: 15 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Question ID', key: 'question_id', width: 15 },
      { header: 'Question Text', key: 'question_text', width: 30 },
      { header: 'Response', key: 'response', width: 15 },
      { header: 'Confidence', key: 'confidence', width: 15 },
      { header: 'Answered', key: 'answered', width: 15 },
      { header: 'Timestamp', key: 'timestamp', width: 20 }
    ];

    worksheet.columns = columns;
    
    // Add data rows
    responses.forEach(response => {
      worksheet.addRow({
        conversation_id: response.conversation_id,
        patient_id: response.patient_id,
        department: response.department,
        question_id: response.question_id,
        question_text: response.question_text,
        response: response.response,
        confidence: response.confidence,
        answered: response.answered,
        timestamp: new Date(response.timestamp).toLocaleString()
      });
    });

    // Apply RTL formatting for Arabic
    if (language === 'ar') {
      worksheet.views = [{ rightToLeft: true }];
    }

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Create response
    const filename = `survey_responses_${clientId}_${language || 'ar'}.xlsx`;
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    throw error;
  }
}

async function exportCallAnalytics(clientId: string, startDate?: string, endDate?: string, language?: string) {
  try {
    // Get call logs from database
    let query = supabase.from('call_logs').select('*').eq('client_id', clientId);
    
    if (startDate) {
      query = query.gte('timestamp', startDate);
    }
    if (endDate) {
      query = query.lte('timestamp', endDate);
    }
    
    const { data: callLogs, error } = await query;
    
    if (error) throw error;
    if (!callLogs || callLogs.length === 0) {
      return NextResponse.json(
        { error: 'No call analytics found' },
        { status: 404 }
      );
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(language === 'ar' ? 'تحليلات المكالمات' : 'Call Analytics');
    
    // Define column headers
    const columns = language === 'ar' ? [
      { header: 'رقم المحادثة', key: 'conversation_id', width: 15 },
      { header: 'رقم المريض', key: 'patient_id', width: 15 },
      { header: 'القسم', key: 'department', width: 20 },
      { header: 'رقم الهاتف', key: 'phone_number', width: 15 },
      { header: 'عدد المحاولات', key: 'attempt_number', width: 15 },
      { header: 'الحالة', key: 'status', width: 15 },
      { header: 'مدة المكالمة (ثانية)', key: 'call_duration', width: 20 },
      { header: 'التاريخ والوقت', key: 'timestamp', width: 20 }
    ] : [
      { header: 'Conversation ID', key: 'conversation_id', width: 15 },
      { header: 'Patient ID', key: 'patient_id', width: 15 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Phone Number', key: 'phone_number', width: 15 },
      { header: 'Attempt Number', key: 'attempt_number', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Call Duration (seconds)', key: 'call_duration', width: 20 },
      { header: 'Timestamp', key: 'timestamp', width: 20 }
    ];

    worksheet.columns = columns;
    
    // Add data rows
    callLogs.forEach(log => {
      worksheet.addRow({
        conversation_id: log.conversation_id,
        patient_id: log.patient_id,
        department: log.department,
        phone_number: log.phone_number,
        attempt_number: log.attempt_number,
        status: log.status,
        call_duration: log.call_duration || 0,
        timestamp: new Date(log.timestamp).toLocaleString()
      });
    });

    // Apply RTL formatting for Arabic
    if (language === 'ar') {
      worksheet.views = [{ rightToLeft: true }];
    }

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Create response
    const filename = `call_analytics_${clientId}_${language || 'ar'}.xlsx`;
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    throw error;
  }
}

async function exportCustomerList(clientId: string, language?: string) {
  try {
    // Get customers from database
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .eq('client_id', clientId);
    
    if (error) throw error;
    if (!customers || customers.length === 0) {
      return NextResponse.json(
        { error: 'No customers found' },
        { status: 404 }
      );
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(language === 'ar' ? 'قائمة العملاء' : 'Customer List');
    
    // Define column headers
    const columns = language === 'ar' ? [
      { header: 'اسم المريض', key: 'name', width: 20 },
      { header: 'رقم الهاتف', key: 'phone_number', width: 15 },
      { header: 'القسم', key: 'department', width: 20 },
      { header: 'الحالة', key: 'status', width: 15 },
      { header: 'الأولوية', key: 'priority', width: 15 },
      { header: 'آخر محاولة اتصال', key: 'last_call_attempt', width: 20 },
      { header: 'تاريخ الإضافة', key: 'created_at', width: 20 }
    ] : [
      { header: 'Patient Name', key: 'name', width: 20 },
      { header: 'Phone Number', key: 'phone_number', width: 15 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Last Call Attempt', key: 'last_call_attempt', width: 20 },
      { header: 'Created At', key: 'created_at', width: 20 }
    ];

    worksheet.columns = columns;
    
    // Add data rows
    customers.forEach(customer => {
      worksheet.addRow({
        name: customer.name,
        phone_number: customer.phone_number,
        department: customer.department,
        status: customer.status,
        priority: customer.priority,
        last_call_attempt: customer.last_call_attempt ? new Date(customer.last_call_attempt).toLocaleString() : 'Never',
        created_at: new Date(customer.created_at).toLocaleString()
      });
    });

    // Apply RTL formatting for Arabic
    if (language === 'ar') {
      worksheet.views = [{ rightToLeft: true }];
    }

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Create response
    const filename = `customer_list_${clientId}_${language || 'ar'}.xlsx`;
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    throw error;
  }
}

async function getSummaryReport(clientId: string, language?: string) {
  try {
    // Get data for summary
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .eq('client_id', clientId);
    
    const { data: callLogs } = await supabase
      .from('call_logs')
      .select('*')
      .eq('client_id', clientId);
    
    const { data: surveyResponses } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('client_id', clientId);

    // Calculate statistics
    const totalCustomers = customers?.length || 0;
    const totalCalls = callLogs?.length || 0;
    const completedCalls = callLogs?.filter(log => log.status === 'completed').length || 0;
    const failedCalls = callLogs?.filter(log => log.status === 'failed').length || 0;
    const totalResponses = surveyResponses?.length || 0;
    
    const successRate = totalCalls > 0 ? (completedCalls / totalCalls * 100) : 0;
    
    // Department breakdown
    const departments: Record<string, number> = {};
    customers?.forEach(customer => {
      const dept = customer.department || 'unknown';
      departments[dept] = (departments[dept] || 0) + 1;
    });
    
    // Response analysis
    const yesResponses = surveyResponses?.filter(r => r.response === 'yes').length || 0;
    const noResponses = surveyResponses?.filter(r => r.response === 'no').length || 0;
    const uncertainResponses = surveyResponses?.filter(r => r.response === 'uncertain').length || 0;

    const summary = {
      total_customers: totalCustomers,
      total_calls: totalCalls,
      completed_calls: completedCalls,
      failed_calls: failedCalls,
      success_rate: Math.round(successRate * 100) / 100,
      total_responses: totalResponses,
      yes_responses: yesResponses,
      no_responses: noResponses,
      uncertain_responses: uncertainResponses,
      departments,
      generated_at: new Date().toISOString()
    };

    return NextResponse.json({ summary });
  } catch (error) {
    throw error;
  }
}
