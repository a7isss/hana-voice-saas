import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface SurveyQuestion {
  id: string;
  survey_id: string;
  question_text: string;
  question_order: number;
  pause_seconds: number;
  expected_responses: string[];
  created_at: string;
}

interface VoiceTemplate {
  id: string;
  survey_id: string;
  question_id?: string;
  template_type: 'greeting' | 'question' | 'goodbye';
  audio_file_path: string;
  audio_duration_seconds: number;
  language: string;
  voice_model: string;
  generated_at: string;
}

// Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const surveyId = url.searchParams.get('surveyId');
    const hospitalId = url.searchParams.get('hospitalId');

    switch (action) {
      case 'get-surveys':
        return await getSurveys(hospitalId);

      case 'get-survey':
        if (!surveyId) {
          return NextResponse.json({ error: 'Survey ID required' }, { status: 400 });
        }
        return await getSurvey(surveyId);

      case 'get-survey-questions':
        if (!surveyId) {
          return NextResponse.json({ error: 'Survey ID required' }, { status: 400 });
        }
        return await getSurveyQuestions(surveyId);

      case 'get-voice-templates':
        if (!surveyId) {
          return NextResponse.json({ error: 'Survey ID required' }, { status: 400 });
        }
        return await getVoiceTemplates(surveyId);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
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
    const { action } = body;

    switch (action) {
      case 'create-survey':
        return await createSurvey(body);

      case 'update-survey':
        return await updateSurvey(body);

      case 'delete-survey':
        return await deleteSurvey(body);

      case 'add-question':
        return await addQuestion(body);

      case 'update-question':
        return await updateQuestion(body);

      case 'delete-question':
        return await deleteQuestion(body);

      case 'generate-voice-templates':
        return await generateVoiceTemplates(body);

      case 'save-voice-template':
        return await saveVoiceTemplate(body);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('POST request error:', error);
    return NextResponse.json(
      { error: 'Failed to process POST request' },
      { status: 500 }
    );
  }
}

async function getSurveys(hospitalId?: string | null) {
  try {
    let query = supabase
      .from('surveys')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId);
    }

    const { data: surveys, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      surveys: surveys || [],
      total: surveys?.length || 0
    });
  } catch (error) {
    console.error('Error fetching surveys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch surveys' },
      { status: 500 }
    );
  }
}

async function getSurvey(surveyId: string) {
  try {
    const { data: survey, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single();

    if (error) throw error;
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Get questions for this survey
    const { data: questions, error: questionsError } = await supabase
      .from('survey_questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('question_order', { ascending: true });

    if (questionsError) throw questionsError;

    // Get voice templates for this survey
    const { data: templates, error: templatesError } = await supabase
      .from('voice_templates')
      .select('*')
      .eq('survey_id', surveyId)
      .order('generated_at', { ascending: false });

    if (templatesError) throw templatesError;

    return NextResponse.json({
      survey,
      questions: questions || [],
      voiceTemplates: templates || []
    });
  } catch (error) {
    console.error('Error fetching survey:', error);
    return NextResponse.json(
      { error: 'Failed to fetch survey' },
      { status: 500 }
    );
  }
}

async function getSurveyQuestions(surveyId: string) {
  try {
    const { data: questions, error } = await supabase
      .from('survey_questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('question_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      questions: questions || [],
      total: questions?.length || 0
    });
  } catch (error) {
    console.error('Error fetching survey questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch survey questions' },
      { status: 500 }
    );
  }
}

async function getVoiceTemplates(surveyId: string) {
  try {
    const { data: templates, error } = await supabase
      .from('voice_templates')
      .select('*')
      .eq('survey_id', surveyId)
      .order('generated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      templates: templates || [],
      total: templates?.length || 0
    });
  } catch (error) {
    console.error('Error fetching voice templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice templates' },
      { status: 500 }
    );
  }
}

async function createSurvey(body: {
  name: string;
  description?: string;
  hospital_id: string;
  department_id?: string;
  created_by?: string;
}) {
  try {
    const { name, description, hospital_id, department_id, created_by } = body;

    if (!name || !hospital_id) {
      return NextResponse.json(
        { error: 'Survey name and hospital_id are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('surveys')
      .insert({
        name,
        description,
        hospital_id,
        department_id,
        created_by: created_by || 'admin',
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      survey: data,
      message: 'Survey created successfully'
    });
  } catch (error) {
    console.error('Error creating survey:', error);
    return NextResponse.json(
      { error: 'Failed to create survey' },
      { status: 500 }
    );
  }
}

async function updateSurvey(body: {
  surveyId: string;
  name?: string;
  description?: string;
  department_id?: string;
  is_active?: boolean;
}) {
  try {
    const { surveyId, ...updates } = body;

    if (!surveyId) {
      return NextResponse.json({ error: 'Survey ID required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('surveys')
      .update(updates)
      .eq('id', surveyId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      survey: data,
      message: 'Survey updated successfully'
    });
  } catch (error) {
    console.error('Error updating survey:', error);
    return NextResponse.json(
      { error: 'Failed to update survey' },
      { status: 500 }
    );
  }
}

async function deleteSurvey(body: { surveyId: string }) {
  try {
    const { surveyId } = body;

    if (!surveyId) {
      return NextResponse.json({ error: 'Survey ID required' }, { status: 400 });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('surveys')
      .update({ is_active: false })
      .eq('id', surveyId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Survey deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting survey:', error);
    return NextResponse.json(
      { error: 'Failed to delete survey' },
      { status: 500 }
    );
  }
}

async function addQuestion(body: {
  surveyId: string;
  question_text: string;
  question_order: number;
  pause_seconds?: number;
  expected_responses?: string[];
}) {
  try {
    const { surveyId, question_text, question_order, pause_seconds = 5, expected_responses } = body;

    if (!surveyId || !question_text || question_order === undefined) {
      return NextResponse.json(
        { error: 'Survey ID, question text, and order are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('survey_questions')
      .insert({
        survey_id: surveyId,
        question_text,
        question_order,
        pause_seconds,
        expected_responses: expected_responses || ['نعم', 'لا', 'غير متأكد']
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      question: data,
      message: 'Question added successfully'
    });
  } catch (error) {
    console.error('Error adding question:', error);
    return NextResponse.json(
      { error: 'Failed to add question' },
      { status: 500 }
    );
  }
}

async function updateQuestion(body: {
  questionId: string;
  question_text?: string;
  question_order?: number;
  pause_seconds?: number;
  expected_responses?: string[];
}) {
  try {
    const { questionId, ...updates } = body;

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('survey_questions')
      .update(updates)
      .eq('id', questionId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      question: data,
      message: 'Question updated successfully'
    });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

async function deleteQuestion(body: { questionId: string }) {
  try {
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('survey_questions')
      .delete()
      .eq('id', questionId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}

async function generateVoiceTemplates(body: {
  surveyId: string;
  questions: SurveyQuestion[];
  greetingText?: string;
  goodbyeText?: string;
}) {
  try {
    const { surveyId, questions, greetingText, goodbyeText } = body;

    if (!surveyId || !questions) {
      return NextResponse.json(
        { error: 'Survey ID and questions are required' },
        { status: 400 }
      );
    }

    // This would integrate with TTS service to generate audio files
    // For now, we'll create placeholder templates
    const templates: VoiceTemplate[] = [];

    // Generate greeting template
    if (greetingText) {
      templates.push({
        id: `greeting_${Date.now()}`,
        survey_id: surveyId,
        template_type: 'greeting',
        audio_file_path: `surveys/${surveyId}/greeting.wav`,
        audio_duration_seconds: 3.5, // Estimated duration
        language: 'ar',
        voice_model: 'tts_arabic',
        generated_at: new Date().toISOString()
      });
    }

    // Generate question templates
    questions.forEach((question, index) => {
      templates.push({
        id: `question_${question.id}_${Date.now()}`,
        survey_id: surveyId,
        question_id: question.id,
        template_type: 'question',
        audio_file_path: `surveys/${surveyId}/question_${index + 1}.wav`,
        audio_duration_seconds: Math.max(2, question.question_text.length * 0.1), // Rough estimate
        language: 'ar',
        voice_model: 'tts_arabic',
        generated_at: new Date().toISOString()
      });
    });

    // Generate goodbye template
    if (goodbyeText) {
      templates.push({
        id: `goodbye_${Date.now()}`,
        survey_id: surveyId,
        template_type: 'goodbye',
        audio_file_path: `surveys/${surveyId}/goodbye.wav`,
        audio_duration_seconds: 2.5, // Estimated duration
        language: 'ar',
        voice_model: 'tts_arabic',
        generated_at: new Date().toISOString()
      });
    }

    // Save templates to database
    const { data, error } = await supabase
      .from('voice_templates')
      .insert(templates)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      templates: data,
      message: `${templates.length} voice templates generated successfully`
    });
  } catch (error) {
    console.error('Error generating voice templates:', error);
    return NextResponse.json(
      { error: 'Failed to generate voice templates' },
      { status: 500 }
    );
  }
}

async function saveVoiceTemplate(body: {
  surveyId: string;
  questionId?: string;
  templateType: 'greeting' | 'question' | 'goodbye';
  audioFilePath: string;
  audioDurationSeconds: number;
  language?: string;
  voiceModel?: string;
}) {
  try {
    const {
      surveyId,
      questionId,
      templateType,
      audioFilePath,
      audioDurationSeconds,
      language = 'ar',
      voiceModel = 'tts_arabic'
    } = body;

    if (!surveyId || !templateType || !audioFilePath) {
      return NextResponse.json(
        { error: 'Survey ID, template type, and audio file path are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('voice_templates')
      .insert({
        survey_id: surveyId,
        question_id: questionId,
        template_type: templateType,
        audio_file_path: audioFilePath,
        audio_duration_seconds: audioDurationSeconds,
        language,
        voice_model: voiceModel
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      template: data,
      message: 'Voice template saved successfully'
    });
  } catch (error) {
    console.error('Error saving voice template:', error);
    return NextResponse.json(
      { error: 'Failed to save voice template' },
      { status: 500 }
    );
  }
}
