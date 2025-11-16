import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verify } from 'jsonwebtoken';
import crypto from 'crypto';

// Types for the new template response system
interface BackendResponse {
  template_id: string;
  question_count: number;
  answers: Answer[];
  metadata: {
    session_id?: string;
    patient_id?: string;
    hospital_id?: string;
    campaign_id?: string;
    call_duration_seconds?: number;
    voice_quality_score?: number;
    call_context: any; // Maqsam call context
  };
}

interface Answer {
  question_id: string;
  question_order: number;
  response: string;
  confidence: number;
  response_time_seconds?: number;
}

// Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.JWT_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey || !jwtSecret) {
  console.error('Missing required environment variables for response submission');
  throw new Error('Missing required environment variables');
}

// Create service role client for backend operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Guaranteed to be defined after the check above
const SECRET_KEY = jwtSecret;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization token' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const token = authHeader.substring(7);
    let decoded: any;

    try {
      decoded = verify(token, SECRET_KEY);
    } catch (err) {
      console.error('JWT verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: BackendResponse = await request.json();
    const { template_id, question_count, answers, metadata } = body;

    // Validate required fields
    if (!template_id || !question_count || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Invalid request: missing template_id, question_count, or answers' },
        { status: 400 }
      );
    }

    // Validate JWT token has proper hospital context
    const hospital_id = decoded.hospital_id;
    if (decoded.role !== 'super_admin' && !hospital_id) {
      return NextResponse.json(
        { error: 'Invalid token: hospital context required' },
        { status: 401 }
      );
    }

    // Additional server-side validation
    const validation = await validateTemplateResponse(body, hospital_id);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Save the aggregated response
    const result = await saveTemplateResponse(body, hospital_id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      response_id: result.response_id,
      message: 'Template response saved successfully',
      completion_rate: result.completion_rate
    });

  } catch (error) {
    console.error('Template response submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error during response submission' },
      { status: 500 }
    );
  }
}

async function validateTemplateResponse(body: BackendResponse, hospital_id: string) {
  try {
    const { template_id, question_count, answers, metadata } = body;

    // Verify template exists and is published
    const { data: templateVersion, error: templateError } = await supabase
      .from('template_versions')
      .select('id, questions_json, is_published')
      .eq('template_id', template_id)
      .eq('is_published', true)
      .single();

    if (templateError || !templateVersion) {
      return { valid: false, error: 'Template not found or not published' };
    }

    // Validate question count matches
    const templateQuestions = templateVersion.questions_json;
    if (Array.isArray(templateQuestions) && templateQuestions.length !== question_count) {
      return {
        valid: false,
        error: `Question count mismatch: expected ${templateQuestions.length}, got ${question_count}`
      };
    }

    // Validate answers structure and sorting
    if (!answers.every(answer =>
      answer.question_id &&
      typeof answer.question_order === 'number' &&
      answer.response &&
      typeof answer.confidence === 'number'
    )) {
      return { valid: false, error: 'Invalid answer structure' };
    }

    // Validate answers are sorted by question_order
    const orderArray = answers.map(a => a.question_order);
    const sortedOrderArray = [...orderArray].sort((a, b) => a - b);
    if (JSON.stringify(orderArray) !== JSON.stringify(sortedOrderArray)) {
      return { valid: false, error: 'Answers must be sorted by question_order' };
    }

    // Verify all answered questions correspond to template questions
    const templateQuestionIds = new Set(
      Array.isArray(templateQuestions) ? templateQuestions.map(q => q.id) : []
    );
    const answeredIds = new Set(answers.map(a => a.question_id));

    for (const answeredId of answeredIds) {
      if (!templateQuestionIds.has(answeredId)) {
        return { valid: false, error: `Unknown question ID: ${answeredId}` };
      }
    }

    return { valid: true };
  } catch (error) {
    console.error('Template validation error:', error);
    return { valid: false, error: 'Validation failed due to internal error' };
  }
}

async function saveTemplateResponse(body: BackendResponse, hospital_id: string) {
  try {
    const { template_id, question_count, answers, metadata } = body;

    // Generate response hash for deduplication
    const responseHash = generateResponseHash(template_id, answers, metadata.session_id);

    // Prepare response data
    const responseData = {
      template_id,
      hospital_id,
      patient_id: metadata.patient_id || null,
      campaign_id: metadata.campaign_id || null,
      call_session_id: metadata.session_id || null,

      // Response metadata
      question_count,
      answered_question_count: answers.length,

      // Response data
      answers_json: answers,
      metadata_json: metadata,

      // Performance metrics
      answered_at: new Date().toISOString(),
      response_time_seconds: metadata.call_duration_seconds || null,
      completion_rate: answers.length / question_count,

      // Deduplication
      response_hash: responseHash
    };

    // Save to template_responses table
    const { data, error } = await supabase
      .from('template_responses')
      .insert(responseData)
      .select('id')
      .single();

    if (error) {
      // Handle duplicate hash (same exact response already saved)
      if (error.code === '23505') { // unique_violation
        console.info('Duplicate response detected, skipping:', responseHash);
        return { success: true, response_id: null, completion_rate: responseData.completion_rate };
      }
      throw error;
    }

    console.info(`Template response saved: ${data.id} for template ${template_id}`);
    return {
      success: true,
      response_id: data.id,
      completion_rate: responseData.completion_rate
    };

  } catch (error) {
    console.error('Error saving template response:', error);
    return { success: false, error: 'Failed to save template response' };
  }
}

function generateResponseHash(template_id: string, answers: Answer[], session_id?: string): string {
  const hashInput = JSON.stringify({
    template_id,
    session_id: session_id || '',
    answers: answers.map(a => ({ id: a.question_id, response: a.response, order: a.question_order }))
  });

  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

// GET endpoint for testing and diagnostics
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const templateId = url.searchParams.get('template_id');
    const hospitalId = url.searchParams.get('hospital_id');

    if (!templateId || !hospitalId) {
      return NextResponse.json(
        { error: 'template_id and hospital_id required' },
        { status: 400 }
      );
    }

    // Get recent responses for this template and hospital
    const { data: responses, error } = await supabase
      .from('template_responses')
      .select('*')
      .eq('template_id', templateId)
      .eq('hospital_id', hospitalId)
      .order('answered_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    return NextResponse.json({
      template_responses: responses || [],
      count: responses?.length || 0
    });

  } catch (error) {
    console.error('Error fetching template responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template responses' },
      { status: 500 }
    );
  }
}
