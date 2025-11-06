// Supabase Storage integration for survey audio files

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export interface AudioFileMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration?: number;
  language: string;
  voiceModel: string;
}

export interface StorageResult {
  success: boolean;
  filePath?: string;
  publicUrl?: string;
  error?: string;
}

export interface VoiceTemplateUpload {
  surveyId: string;
  questionId?: string;
  templateType: 'greeting' | 'question' | 'goodbye';
  audioBlob: Blob;
  metadata: AudioFileMetadata;
}

/**
 * Uploads an audio file to Supabase Storage
 */
export async function uploadAudioFile(
  bucketName: string,
  filePath: string,
  audioBlob: Blob,
  metadata?: Partial<AudioFileMetadata>
): Promise<StorageResult> {
  try {
    // Upload file to storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, audioBlob, {
        contentType: 'audio/wav',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      success: true,
      filePath: data.path,
      publicUrl: urlData.publicUrl
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
}

/**
 * Downloads an audio file from Supabase Storage
 */
export async function downloadAudioFile(
  bucketName: string,
  filePath: string
): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);

    if (error) {
      console.error('Storage download error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Download error:', error);
    return null;
  }
}

/**
 * Deletes an audio file from Supabase Storage
 */
export async function deleteAudioFile(
  bucketName: string,
  filePath: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Storage delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

/**
 * Lists files in a storage bucket with optional prefix
 */
export async function listAudioFiles(
  bucketName: string,
  prefix?: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(prefix, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('Storage list error:', error);
      return [];
    }

    return data?.map(file => file.name) || [];
  } catch (error) {
    console.error('List error:', error);
    return [];
  }
}

/**
 * Uploads a voice template with proper organization
 */
export async function uploadVoiceTemplate(uploadData: VoiceTemplateUpload): Promise<StorageResult> {
  const { surveyId, questionId, templateType, audioBlob, metadata } = uploadData;

  // Generate organized file path
  const timestamp = Date.now();
  const fileName = questionId
    ? `${templateType}_${questionId}_${timestamp}.wav`
    : `${templateType}_${timestamp}.wav`;

  const filePath = `surveys/${surveyId}/${fileName}`;

  return await uploadAudioFile('survey-audio', filePath, audioBlob, metadata);
}

/**
 * Gets the public URL for a voice template
 */
export function getVoiceTemplateUrl(filePath: string): string {
  const { data } = supabase.storage
    .from('survey-audio')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Validates audio file before upload
 */
export function validateAudioFile(file: File): {
  isValid: boolean;
  error?: string;
  metadata?: AudioFileMetadata;
} {
  // Check file type
  const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/webm'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only WAV, MP3, and WebM audio files are allowed.'
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File too large. Maximum size is 10MB.'
    };
  }

  return {
    isValid: true,
    metadata: {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      language: 'ar',
      voiceModel: 'tts_arabic'
    }
  };
}

/**
 * Creates a survey audio bucket if it doesn't exist
 */
export async function ensureSurveyAudioBucket(): Promise<boolean> {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'survey-audio');

    if (!bucketExists) {
      // Create bucket
      const { error: createError } = await supabase.storage.createBucket('survey-audio', {
        public: true,
        allowedMimeTypes: ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/webm'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        return false;
      }

      console.log('Created survey-audio bucket');
    }

    return true;
  } catch (error) {
    console.error('Bucket setup error:', error);
    return false;
  }
}

/**
 * Gets storage usage statistics
 */
export async function getStorageStats(bucketName: string): Promise<{
  totalFiles: number;
  totalSize: number;
  files: Array<{
    name: string;
    size: number;
    lastModified: string;
  }>;
} | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('Storage stats error:', error);
      return null;
    }

    const files = data?.map(file => ({
      name: file.name,
      size: file.metadata?.size || 0,
      lastModified: file.updated_at || file.created_at || ''
    })) || [];

    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    return {
      totalFiles,
      totalSize,
      files
    };
  } catch (error) {
    console.error('Stats error:', error);
    return null;
  }
}

/**
 * Cleans up old/unused audio files
 */
export async function cleanupOldAudioFiles(
  bucketName: string,
  olderThanDays: number = 30
): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' }
      });

    if (error) {
      console.error('Cleanup list error:', error);
      return 0;
    }

    const filesToDelete = data
      ?.filter(file => {
        const fileDate = new Date(file.created_at || '');
        return fileDate < cutoffDate;
      })
      .map(file => file.name) || [];

    if (filesToDelete.length === 0) {
      return 0;
    }

    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove(filesToDelete);

    if (deleteError) {
      console.error('Cleanup delete error:', deleteError);
      return 0;
    }

    console.log(`Cleaned up ${filesToDelete.length} old audio files`);
    return filesToDelete.length;
  } catch (error) {
    console.error('Cleanup error:', error);
    return 0;
  }
}
