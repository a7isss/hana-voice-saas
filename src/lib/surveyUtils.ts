// Survey utility functions for Arabic response validation and processing

export interface ArabicResponseValidation {
  isValid: boolean;
  normalizedResponse: string;
  confidence: number;
  alternatives?: string[];
}

export interface SurveyQuestion {
  id: string;
  question_text: string;
  expected_responses: string[];
  pause_seconds: number;
}

export interface SurveyResponse {
  question_id: string;
  question_text: string;
  response: string;
  confidence: number;
  timestamp: string;
}

// Arabic response normalization patterns
const ARABIC_YES_PATTERNS = [
  'نعم', 'اي', 'ايه', 'أي', 'أيه', 'ايوا', 'أيوا', 'صح', 'صحيح', 'موافق', 'بالتأكيد',
  'yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'correct', 'right'
];

const ARABIC_NO_PATTERNS = [
  'لا', 'لأ', 'ما', 'مافي', 'ما في', 'مش', 'موش', 'ما أريد', 'رفض', 'لا أريد',
  'no', 'nope', 'nah', 'not', 'never', 'wrong', 'incorrect'
];

const ARABIC_UNCERTAIN_PATTERNS = [
  'غير متأكد', 'مش متأكد', 'ما أعرف', 'لست متأكد', 'ربما', 'يمكن', 'شايف', 'شايفه',
  'uncertain', 'maybe', 'perhaps', 'not sure', 'dont know', 'unsure'
];

/**
 * Validates and normalizes Arabic survey responses
 */
export function validateArabicResponse(
  transcription: string,
  expectedResponses: string[] = ['نعم', 'لا', 'غير متأكد']
): ArabicResponseValidation {
  if (!transcription || transcription.trim().length === 0) {
    return {
      isValid: false,
      normalizedResponse: '',
      confidence: 0
    };
  }

  const normalizedText = transcription.toLowerCase().trim();

  // Check for yes responses
  for (const pattern of ARABIC_YES_PATTERNS) {
    if (normalizedText.includes(pattern.toLowerCase())) {
      return {
        isValid: true,
        normalizedResponse: 'نعم',
        confidence: 0.9,
        alternatives: ['yes', 'نعم']
      };
    }
  }

  // Check for no responses
  for (const pattern of ARABIC_NO_PATTERNS) {
    if (normalizedText.includes(pattern.toLowerCase())) {
      return {
        isValid: true,
        normalizedResponse: 'لا',
        confidence: 0.9,
        alternatives: ['no', 'لا']
      };
    }
  }

  // Check for uncertain responses
  for (const pattern of ARABIC_UNCERTAIN_PATTERNS) {
    if (normalizedText.includes(pattern.toLowerCase())) {
      return {
        isValid: true,
        normalizedResponse: 'غير متأكد',
        confidence: 0.8,
        alternatives: ['uncertain', 'غير متأكد']
      };
    }
  }

  // Check against expected responses (fuzzy matching)
  for (const expected of expectedResponses) {
    const expectedNormalized = expected.toLowerCase().trim();
    if (normalizedText.includes(expectedNormalized) ||
        expectedNormalized.includes(normalizedText)) {
      return {
        isValid: true,
        normalizedResponse: expected,
        confidence: 0.7
      };
    }
  }

  // No match found - return uncertain with low confidence
  return {
    isValid: false,
    normalizedResponse: 'غير متأكد',
    confidence: 0.3,
    alternatives: ['uncertain']
  };
}

/**
 * Generates a date-dependent unique identifier
 */
export function generateDateDependentId(prefix: string = 'survey'): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
  const randomSuffix = Math.random().toString(36).substr(2, 6); // 6 char random

  return `${prefix}_${dateStr}_${timeStr}_${randomSuffix}`;
}

/**
 * Generates a conversation ID based on date and phone number
 */
export function generateConversationId(phoneNumber: string): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
  const phoneSuffix = phoneNumber.slice(-4); // Last 4 digits

  return `conv_${dateStr}_${timeStr}_${phoneSuffix}`;
}

/**
 * Calculates survey completion statistics
 */
export function calculateSurveyStats(responses: SurveyResponse[]) {
  const totalResponses = responses.length;
  const yesResponses = responses.filter(r => r.response === 'نعم').length;
  const noResponses = responses.filter(r => r.response === 'لا').length;
  const uncertainResponses = responses.filter(r => r.response === 'غير متأكد').length;

  const averageConfidence = totalResponses > 0
    ? responses.reduce((sum, r) => sum + r.confidence, 0) / totalResponses
    : 0;

  return {
    totalResponses,
    yesResponses,
    noResponses,
    uncertainResponses,
    yesPercentage: totalResponses > 0 ? (yesResponses / totalResponses) * 100 : 0,
    noPercentage: totalResponses > 0 ? (noResponses / totalResponses) * 100 : 0,
    uncertainPercentage: totalResponses > 0 ? (uncertainResponses / totalResponses) * 100 : 0,
    averageConfidence: Math.round(averageConfidence * 100) / 100
  };
}

/**
 * Validates survey question data
 */
export function validateSurveyQuestion(question: Partial<SurveyQuestion>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!question.question_text || question.question_text.trim().length === 0) {
    errors.push('Question text is required');
  }

  if (!question.expected_responses || question.expected_responses.length === 0) {
    errors.push('At least one expected response is required');
  }

  if (question.pause_seconds !== undefined &&
      (question.pause_seconds < 1 || question.pause_seconds > 20)) {
    errors.push('Pause seconds must be between 1 and 20');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Normalizes Arabic text for better matching
 */
export function normalizeArabicText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    // Remove tatweel (elongation character)
    .replace(/ـ/g, '')
    // Normalize alef variants
    .replace(/[أإآ]/g, 'ا')
    // Normalize yaa variants
    .replace(/[ىي]/g, 'ي')
    // Remove diacritics (Tashkeel)
    .replace(/[\u064B-\u065F]/g, '')
    // Normalize hamza variants
    .replace(/[ءئؤ]/g, 'ء');
}

/**
 * Checks if a response matches expected Arabic patterns
 */
export function isArabicResponseMatch(
  transcription: string,
  expectedResponse: string,
  threshold: number = 0.8
): boolean {
  const normalizedTranscription = normalizeArabicText(transcription);
  const normalizedExpected = normalizeArabicText(expectedResponse);

  // Exact match
  if (normalizedTranscription === normalizedExpected) {
    return true;
  }

  // Contains match
  if (normalizedTranscription.includes(normalizedExpected) ||
      normalizedExpected.includes(normalizedTranscription)) {
    return true;
  }

  // Calculate similarity score (simple character overlap)
  const transcriptionChars = new Set(normalizedTranscription.split(''));
  const expectedChars = new Set(normalizedExpected.split(''));
  const intersection = new Set([...transcriptionChars].filter(x => expectedChars.has(x)));
  const union = new Set([...transcriptionChars, ...expectedChars]);
  const similarity = intersection.size / union.size;

  return similarity >= threshold;
}

/**
 * Formats survey results for export
 */
export function formatSurveyResultsForExport(responses: SurveyResponse[]) {
  return responses.map(response => ({
    'Question ID': response.question_id,
    'Question Text': response.question_text,
    'Response': response.response,
    'Confidence': `${Math.round(response.confidence * 100)}%`,
    'Timestamp': new Date(response.timestamp).toLocaleString('ar-SA')
  }));
}

/**
 * Generates survey summary report
 */
export function generateSurveySummary(
  surveyName: string,
  responses: SurveyResponse[],
  totalCalls: number,
  completedCalls: number
) {
  const stats = calculateSurveyStats(responses);

  return {
    surveyName,
    generatedAt: new Date().toISOString(),
    callMetrics: {
      totalCalls,
      completedCalls,
      completionRate: totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0
    },
    responseMetrics: stats,
    insights: {
      mostCommonResponse: stats.yesResponses >= stats.noResponses && stats.yesResponses >= stats.uncertainResponses
        ? 'نعم (Yes)'
        : stats.noResponses >= stats.uncertainResponses
        ? 'لا (No)'
        : 'غير متأكد (Uncertain)',
      responseClarity: stats.averageConfidence > 0.8 ? 'High' :
                      stats.averageConfidence > 0.6 ? 'Medium' : 'Low'
    }
  };
}
