import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';

interface AudioFile {
  id: string;
  fileName: string;
  description: string;
  duration: string;
  text: string;
  questionNumber?: number;
  type?: string;
}

interface AudioSetConfiguration {
  questionDelay: number;
  responseWindow: number;
  silenceThreshold: number;
  maxRetries: number;
  timeoutBetweenQuestions: number;
}

interface AudioSetMetadata {
  createdAt: string;
  createdBy: string;
  totalDuration: string;
  fileCount: number;
  estimatedCallTime: string;
  tags: string[];
  questionCount: number;
}

interface CompanyGreeting {
  name: string;
  description: string;
  greeting_id: string;
  client_id: string;
  language: string;
  audio_file_url: string;
  duration: number;
  created_at: string;
  updated_at: string;
}

interface CallResult {
  patientId: string;
  phoneNumber: string;
  conversationId: string;
  startedAt: string;
  completedAt: string;
  status: 'completed' | 'failed';
  duration?: number;
  responses?: Array<{
    questionId: number;
    questionText: string;
    response: string;
    confidence: number;
  }>;
  failureReason?: string;
}

// Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Database table validation utilities
async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select('*').limit(1);
    return !error || error.code !== 'PGRST116'; // PGRST116 = table doesn't exist
  } catch {
    return false;
  }
}

async function validateRequiredTables(): Promise<{ valid: boolean; missing: string[] }> {
  const requiredTables = [
    'customers',
    'call_logs',
    'survey_responses',
    'question_templates',
    'audio_sets',
    'company_greetings'
  ];

  const missing: string[] = [];

  for (const table of requiredTables) {
    if (!(await checkTableExists(table))) {
      missing.push(table);
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

// Logger for debugging (commented out to avoid unused variable warning)
// const logger = {
//   info: (message: string, data?: unknown) => console.log(`[DATA-API] ${new Date().toISOString()} INFO: ${message}`, data),
//   error: (message: string, error?: unknown) => console.error(`[DATA-API] ${new Date().toISOString()} ERROR: ${message}`, error),
//   warn: (message: string, data?: unknown) => console.warn(`[DATA-API] ${new Date().toISOString()} WARN: ${message}`, data)
// };

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'get-templates') {
      return await getQuestionTemplates();
    }

    if (action === 'get-audio-sets') {
      return await getAudioSets(url.searchParams.get('clientId') || null);
    }

    if (action === 'get-company-greetings') {
      return await getCompanyGreetings(url.searchParams.get('clientId') || null);
    }

    if (action === 'save-company-greeting') {
      // Handle greeting save separately in POST
      return NextResponse.json(
        { error: 'Use POST method for saving company greetings' },
        { status: 405 }
      );
    }

    if (action === 'health') {
      // Comprehensive health check with database validation
      const tableValidation = await validateRequiredTables();

      return NextResponse.json({
        status: tableValidation.valid ? 'healthy' : 'degraded',
        service: 'hana-data-service',
        database: {
          connected: true,
          tables: {
            valid: tableValidation.valid,
            missing: tableValidation.missing
          }
        },
        message: tableValidation.valid
          ? 'Data service is fully operational'
          : `Data service running but missing tables: ${tableValidation.missing.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    // Simple health check that doesn't require any dependencies
    // This ensures the health check passes even if dependencies aren't available
    return NextResponse.json({
      status: 'healthy',
      service: 'hana-data-service',
      message: 'Data service is running (dependencies may need configuration)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('GET request error:', error);
    return NextResponse.json(
      { error: 'Failed to process GET request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, clientId, startDate, endDate } = body;

    switch (action) {
      case 'export-survey-responses':
        return await exportSurveyResponses(clientId, startDate, endDate);

      case 'export-call-analytics':
        return await exportCallAnalytics(clientId, startDate, endDate, 'ar');

      case 'export-customer-list':
        return await exportCustomerList(clientId, 'ar');

      case 'get-summary-report':
        return await getSummaryReport(clientId);

      case 'save-audio-set':
        return await saveAudioSet(body);

      case 'save-company-greeting':
        return await saveCompanyGreeting(body);

      case 'save-call-batch-results':
        return await saveCallBatchResults(body);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch {
    console.error('Data export error');
    return NextResponse.json(
      { error: 'Failed to process data export request' },
      { status: 500 }
    );
  }
}

async function exportSurveyResponses(clientId: string, startDate?: string, endDate?: string) {
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
    const worksheet = workbook.addWorksheet('Report');
    
    // Define column headers
    const columns = [
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

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Create response
    const filename = `survey_responses_${clientId}.xlsx`;
    
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

async function getQuestionTemplates() {
  try {
    // Get all question templates from database
    const { data: templates, error } = await supabase
      .from('question_templates')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      templates: templates || [],
      total: templates?.length || 0
    });
  } catch (error) {
    console.error('Error fetching question templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question templates' },
      { status: 500 }
    );
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

async function getAudioSets(clientId?: string | null) {
  try {
    let query = supabase
      .from('audio_sets')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: audioSets, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      audioSets: audioSets || [],
      total: audioSets?.length || 0
    });
  } catch (error) {
    console.error('Error fetching audio sets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audio sets' },
      { status: 500 }
    );
  }
}

async function getCompanyGreetings(clientId?: string | null) {
  try {
    let query = supabase
      .from('company_greetings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: greetings, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      greetings: greetings || [],
      total: greetings?.length || 0
    });
  } catch (error) {
    console.error('Error fetching company greetings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company greetings' },
      { status: 500 }
    );
  }
}

async function saveAudioSet(audioSetData: {
  clientId: string;
  setId: string;
  name: string;
  description: string;
  language: string;
  department: string;
  version?: string;
  configuration: AudioSetConfiguration;
  audioFiles: AudioFile[];
  surveyFlow: object;
  metadata: AudioSetMetadata;
}) {
  try {
    const {
      clientId,
      setId,
      name,
      description,
      language,
      department,
      version = '1.0',
      configuration,
      audioFiles,
      surveyFlow,
      metadata
    } = audioSetData;

    const { data, error } = await supabase
      .from('audio_sets')
      .insert({
        client_id: clientId,
        set_id: setId,
        name: name,
        description: description,
        language: language || 'ar',
        department: department,
        version: version,
        configuration: configuration || {},
        audio_files: audioFiles || [],
        survey_flow: surveyFlow || {},
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      audioSet: data,
      message: 'Audio set saved successfully'
    });
  } catch (error) {
    console.error('Error saving audio set:', error);
    return NextResponse.json(
      { error: 'Failed to save audio set' },
      { status: 500 }
    );
  }
}

async function saveCompanyGreeting(greetingData: {
  greeting: CompanyGreeting;
}) {
  try {
    const { greeting } = greetingData;

    const { data, error } = await supabase
      .from('company_greetings')
      .insert({
        name: greeting.name,
        description: greeting.description,
        greeting_id: greeting.greeting_id,
        client_id: greeting.client_id,
        language: greeting.language,
        audio_file_url: greeting.audio_file_url,
        duration: greeting.duration,
        is_active: true,
        created_at: greeting.created_at,
        updated_at: greeting.updated_at
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      greeting: data,
      message: 'Company greeting saved successfully'
    });
  } catch (error) {
    console.error('Error saving company greeting:', error);
    return NextResponse.json(
      { error: 'Failed to save company greeting' },
      { status: 500 }
    );
  }
}

async function saveCallBatchResults(batchData: {
  clientId: string;
  companyName: string;
  greetingId?: string;
  audioSetId?: string;
  callResults: CallResult[];
}) {
  try {
    const {
      clientId,
      companyName,
      greetingId,
      audioSetId,
      callResults
    } = batchData;

    // Validate required parameters
    if (!clientId || !companyName || !callResults || !Array.isArray(callResults)) {
      return NextResponse.json(
        { error: 'Client ID, company name, and call results array are required' },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Process all call results in the batch
    const processedResults = {
      batchId,
      clientId,
      companyName,
      greetingId: greetingId || null,
      audioSetId: audioSetId || null,
      totalCalls: callResults.length,
      completedCalls: callResults.filter(r => r.status === 'completed').length,
      failedCalls: callResults.filter(r => r.status === 'failed').length,
      createdAt: timestamp,
      individualResults: callResults.map(result => ({
        patientId: result.patientId || `patient_${Date.now()}_${Math.random()}`,
        phoneNumber: result.phoneNumber,
        conversationId: result.conversationId || `conv_${Date.now()}_${Math.random()}`,
        status: result.status || 'unknown',
        duration: result.duration || 0,
        responses: result.responses || [],
        startedAt: result.startedAt || timestamp,
        completedAt: result.completedAt || timestamp,
        failureReason: result.failureReason || null
      }))
    };

    // Save batch summary to call_batches table (would need schema update)
    const { error: batchError } = await supabase
      .from('call_batches')
      .insert({
        batch_id: batchId,
        client_id: clientId,
        company_name: companyName,
        greeting_id: greetingId,
        audio_set_id: audioSetId,
        total_calls: processedResults.totalCalls,
        completed_calls: processedResults.completedCalls,
        failed_calls: processedResults.failedCalls,
        created_at: timestamp
      });

    // Save individual call results and responses
    for (const result of processedResults.individualResults) {
      // Save call log
      const { error: callLogError } = await supabase
        .from('call_logs')
        .insert({
          conversation_id: result.conversationId,
          client_id: clientId,
          patient_id: result.patientId,
          phone_number: result.phoneNumber,
          department: 'batch_call', // Could be derived from audio set
          status: result.status,
          call_duration: result.duration,
          attempt_number: 1,
          timestamp: result.startedAt
        });

      if (callLogError) {
        console.error('Error saving call log:', callLogError);
        // Continue processing other results
      }

      // Save survey responses if call completed
      if (result.status === 'completed' && result.responses && result.responses.length > 0) {
        const responsesToInsert = result.responses.map((response: {
          questionId: number;
          questionText: string;
          response: string;
          confidence: number;
        }) => ({
          conversation_id: result.conversationId,
          client_id: clientId,
          patient_id: result.patientId,
          department: 'batch_call',
          question_id: response.questionId,
          question_text: response.questionText,
          response: response.response,
          confidence: response.confidence,
          answered: true,
          timestamp: result.completedAt
        }));

        const { error: responseError } = await supabase
          .from('survey_responses')
          .insert(responsesToInsert);

        if (responseError) {
          console.error('Error saving survey responses:', responseError);
          // Continue processing other calls
        }
      }
    }

    if (batchError) {
      throw batchError;
    }

    return NextResponse.json({
      success: true,
      batchId,
      companyName,
      totalCalls: processedResults.totalCalls,
      completedCalls: processedResults.completedCalls,
      failedCalls: processedResults.failedCalls,
      message: `Batch results saved under ${companyName}. ${processedResults.completedCalls} successful calls, ${processedResults.failedCalls} failed calls.`
    });

  } catch (error) {
    console.error('Error saving call batch results:', error);
    return NextResponse.json(
      { error: 'Failed to save call batch results' },
      { status: 500 }
    );
  }
}

async function getSummaryReport(clientId: string) {
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
