"use client";

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/button/Button';
import InputField from '@/components/form/input/InputField';
import FileInput from '@/components/form/input/FileInput';
import TextArea from '@/components/form/input/TextArea';
import Alert from '@/components/ui/alert/Alert';
import Select from '@/components/form/Select';

interface AudioFile {
  id: string;
  fileName: string;
  description: string;
  duration: string;
  text: string;
  questionNumber?: number;
  type?: string;
}

interface SurveyQuestion {
  id: number;
  text: string;
  language: string;
  type?: string;
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

interface AudioSetData {
  id: string;
  name: string;
  description: string;
  language: string;
  department: string;
  version: string;
  configuration: object;
  audioFiles: AudioFile[];
  surveyFlow: object;
  metadata: AudioSetMetadata;
}

export default function AudioSetCreationPage() {
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [, setConfigFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const [audioSet, setAudioSet] = useState<AudioSetData | null>(null);
  const [audioSetForm, setAudioSetForm] = useState({
    name: '',
    description: '',
    language: 'ar',
    department: ''
  });
  const [companyGreetings, setCompanyGreetings] = useState<CompanyGreeting[]>([]);
  const [greetingForm, setGreetingForm] = useState({
    name: '',
    description: '',
    greetingId: '',
    clientId: 'fc5a18af-9347-40e6-b647-13f5106cd6b4', // Demo client
    language: 'ar',
    audioFileUrl: '',
    duration: 8
  });
  const [timingConfig, setTimingConfig] = useState({
    questionDelay: 2,
    responseWindow: 10,
    silenceThreshold: 3,
    maxRetries: 2,
    timeoutBetweenQuestions: 1
  });

  // Load existing greetings on component mount
  useEffect(() => {
    const loadGreetings = async () => {
      try {
        const response = await fetch('/api/data?action=get-company-greetings');
        if (response.ok) {
          const data = await response.json();
          setCompanyGreetings(data.greetings || []);
        }
      } catch (error) {
        console.error('Error loading greetings:', error);
      }
    };

    loadGreetings();
  }, []);

  const saveCompanyGreeting = async () => {
    setIsProcessing(true);
    setProcessStatus('Saving company greeting...');

    try {
      const greetingData = {
        name: greetingForm.name,
        description: greetingForm.description,
        greeting_id: greetingForm.greetingId,
        client_id: greetingForm.clientId,
        language: greetingForm.language,
        audio_file_url: greetingForm.audioFileUrl,
        duration: greetingForm.duration,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save-company-greeting',
          greeting: greetingData
        })
      });

      if (response.ok) {
        // Add to local state
        setCompanyGreetings(prev => [...prev, greetingData]);
        // Reset form
        setGreetingForm({
          name: '',
          description: '',
          greetingId: '',
          clientId: 'fc5a18af-9347-40e6-b647-13f5106cd6b4',
          language: 'ar',
          audioFileUrl: '',
          duration: 8
        });
        setProcessStatus('Company greeting saved successfully!');
      } else {
        const error = await response.json();
        setProcessStatus(`Failed to save greeting: ${error.error}`);
      }
    } catch (error) {
      setProcessStatus(`Failed to save greeting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJsonUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/json') {
        setJsonFile(file);
        setProcessStatus('JSON file uploaded successfully');
      } else {
        setProcessStatus('Please upload a valid JSON file');
      }
    }
  };

  const handleConfigUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/json') {
        setConfigFile(file);
        setProcessStatus('Configuration file uploaded successfully');
      } else {
        setProcessStatus('Please upload a valid JSON configuration file');
      }
    }
  };

  const processAndSaveAudioSet = async () => {
    if (!jsonFile) {
      setProcessStatus('Please upload a JSON file first');
      return;
    }

    if (!audioSetForm.name || !audioSetForm.department) {
      setProcessStatus('Please fill in the audio set name and department');
      return;
    }

    setIsProcessing(true);
    setProcessStatus('Processing questions to audio set...');

    try {
      // Read the JSON file
      const jsonContent = await jsonFile.text();
      const surveyData = JSON.parse(jsonContent);

      // Generate unique set ID
      const setId = `survey_${audioSetForm.department}_${audioSetForm.language}_${Date.now()}`;

      // Process survey data into audio set format
      const audioFiles = surveyData.survey.questions.map((question: SurveyQuestion, index: number) => ({
        id: `question_${index + 1}`,
        fileName: `question_${index + 1}.mp3`,
        description: question.text,
        duration: `00:00:05`, // Estimate based on text length
        text: question.text,
        questionNumber: index + 1,
        type: question.type || 'yes_no'
      }));

      // Add intro and outro
      audioFiles.unshift({
        id: 'intro_greeting',
        fileName: 'intro_greeting.mp3',
        description: 'تحية افتتاحية للمريض',
        duration: '00:00:08',
        text: 'مرحباً بك في الاستبيان الصحي'
      });

      audioFiles.push({
        id: 'outro_thankyou',
        fileName: 'outro_thankyou.mp3',
        description: 'خاتمة الاستبيان وشكر المريض',
        duration: '00:00:07',
        text: 'شكراً لك على إجاباتك، نتائج الاستبيان ستساعد في تحسين رعايتك الصحية'
      });

      // Create audio set structure
      const audioSetData = {
        clientId: 'fc5a18af-9347-40e6-b647-13f5106cd6b4', // Demo client ID
        setId: setId,
        name: audioSetForm.name,
        description: audioSetForm.description || `${audioSetForm.name} - مجموعة صوتية باللغة ${audioSetForm.language}`,
        language: audioSetForm.language,
        department: audioSetForm.department,
        version: '1.0',
        configuration: timingConfig,
        audioFiles: audioFiles,
        surveyFlow: {
          sequence: audioFiles.map((file: AudioFile) => file.id),
          responseHandling: {
            expectedResponses: ['نعم', 'لا', 'غير متأكد', 'yes', 'no', 'uncertain'],
            confidenceThreshold: 0.7,
            fallbackBehavior: 'repeat_question'
          }
        },
        metadata: {
          createdAt: new Date().toISOString(),
          createdBy: 'hana-voice-system',
          totalDuration: '00:02:30',
          fileCount: audioFiles.length,
          estimatedCallTime: '00:02:30',
          tags: [audioSetForm.department, audioSetForm.language, 'voice-survey'],
          questionCount: surveyData.survey.questions.length
        }
      };

      // Save to database
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save-audio-set',
          ...audioSetData
        })
      });

      if (response.ok) {
        setAudioSet({
          id: setId,
          ...audioSetData
        } as AudioSetData);
        setProcessStatus(`Audio set "${audioSetForm.name}" saved successfully! Set ID: ${setId}`);
      } else {
        const error = await response.json();
        setProcessStatus(`Failed to save audio set: ${error.error}`);
      }
    } catch (error) {
      setProcessStatus(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Audio Set Creation
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audio Set Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Audio Set Information</h2>
          <div className="space-y-4">
            <InputField
              label="Set Name"
              placeholder="e.g., Cardiology Arabic Survey v1"
              value={audioSetForm.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAudioSetForm(prev => ({
                ...prev,
                name: e.target.value
              }))}
            />

            <InputField
              label="Department"
              placeholder="e.g., cardiology, neurology, general"
              value={audioSetForm.department}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAudioSetForm(prev => ({
                ...prev,
                department: e.target.value
              }))}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language
              </label>
              <Select
                options={[
                  { value: 'ar', label: 'Arabic (العربية)' },
                  { value: 'en', label: 'English' }
                ]}
                placeholder="Select Language"
                defaultValue={audioSetForm.language}
                onChange={(value: string) => setAudioSetForm(prev => ({
                  ...prev,
                  language: value
                }))}
              />
            </div>

            <TextArea
              label="Description (Optional)"
              placeholder="Brief description of this audio set..."
              value={audioSetForm.description}
              onChange={(value: string) => setAudioSetForm(prev => ({
                ...prev,
                description: value
              }))}
              rows={3}
            />
          </div>
        </div>

        {/* JSON Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Upload Survey Questions</h2>
          <FileInput
            label="Upload JSON File"
            accept=".json"
            onChange={handleJsonUpload}
            helperText="Upload a JSON file containing survey questions"
          />
          {jsonFile && (
            <div className="mt-2 text-sm text-green-600">
              Selected: {jsonFile.name}
            </div>
          )}

          <div className="mt-4">
            <FileInput
              label="Upload Custom Configuration (Optional)"
              accept=".json"
              onChange={handleConfigUpload}
              helperText="Upload custom timing configuration"
            />
          </div>
        </div>
      </div>

      {/* Timing Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Timing Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <InputField
            label="Question Delay (sec)"
            type="number"
            value={timingConfig.questionDelay}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimingConfig(prev => ({
              ...prev,
              questionDelay: parseInt(e.target.value) || 2
            }))}
            min="1"
            max="10"
          />

          <InputField
            label="Response Window (sec)"
            type="number"
            value={timingConfig.responseWindow}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimingConfig(prev => ({
              ...prev,
              responseWindow: parseInt(e.target.value) || 10
            }))}
            min="5"
            max="30"
          />

          <InputField
            label="Silence Threshold (sec)"
            type="number"
            value={timingConfig.silenceThreshold}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimingConfig(prev => ({
              ...prev,
              silenceThreshold: parseInt(e.target.value) || 3
            }))}
            min="1"
            max="10"
          />

          <InputField
            label="Max Retries"
            type="number"
            value={timingConfig.maxRetries}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimingConfig(prev => ({
              ...prev,
              maxRetries: parseInt(e.target.value) || 2
            }))}
            min="1"
            max="5"
          />

          <InputField
            label="Timeout Between Questions"
            type="number"
            value={timingConfig.timeoutBetweenQuestions}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimingConfig(prev => ({
              ...prev,
              timeoutBetweenQuestions: parseInt(e.target.value) || 1
            }))}
            min="0"
            max="5"
          />
        </div>
      </div>

      {/* Process Button */}
      <div className="flex justify-center">
        <Button
          onClick={processAndSaveAudioSet}
          disabled={isProcessing || !jsonFile || !audioSetForm.name || !audioSetForm.department}
          className="px-8 py-3"
          variant="primary"
        >
          {isProcessing ? 'Processing...' : 'Create & Save Audio Set'}
        </Button>
      </div>

      {/* Status Message */}
      {processStatus && (
        <Alert
          variant={processStatus.includes('failed') || processStatus.includes('Failed') ? 'error' : 'success'}
          title={processStatus.includes('failed') || processStatus.includes('Failed') ? 'Error' : 'Success'}
          message={processStatus}
        />
      )}

      {/* Audio Set Preview */}
      {audioSet && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Audio Set Created: {audioSet.name}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Basic Information</h3>
              <dl className="space-y-1 text-sm">
                <div><strong>Set ID:</strong> {audioSet.id}</div>
                <div><strong>Language:</strong> {audioSet.language === 'ar' ? 'Arabic' : 'English'}</div>
                <div><strong>Department:</strong> {audioSet.department}</div>
                <div><strong>Version:</strong> {audioSet.version}</div>
                <div><strong>Files Count:</strong> {audioSet.metadata.fileCount || 0}</div>
                <div><strong>Estimated Duration:</strong> {audioSet.metadata.estimatedCallTime || 'N/A'}</div>
              </dl>
            </div>

            <div>
              <h3 className="font-medium mb-2">Audio Files Preview</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {audioSet.audioFiles.slice(0, 5).map((file: AudioFile, index: number) => (
                  <div key={index} className="text-xs border-l-4 border-blue-500 pl-2">
                    <div className="font-medium">{file.id}</div>
                    <div className="text-gray-600 truncate">{file.description}</div>
                  </div>
                ))}
                {audioSet.audioFiles.length > 5 && (
                  <div className="text-xs text-gray-500">... and {audioSet.audioFiles.length - 5} more files</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Greetings Management Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Company Greetings Management</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Manually manage company-specific greeting audio files for different hospitals and clinics.
          Each company gets their own personalized greeting to identify the calling organization.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add New Greeting */}
          <div className="space-y-4">
            <h3 className="font-medium">Add New Company Greeting</h3>

            <InputField
              label="Greeting Name"
              placeholder="e.g., King Faisal Hospital Greeting"
              value={greetingForm.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setGreetingForm(prev => ({ ...prev, name: e.target.value }))
              }
            />

            <InputField
              label="Greeting ID"
              placeholder="e.g., king_faisal_cardiology_greeting"
              value={greetingForm.greetingId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setGreetingForm(prev => ({ ...prev, greetingId: e.target.value }))
              }
            />

            <InputField
              label="Audio File URL"
              placeholder="https://example.com/greeting.mp3"
              value={greetingForm.audioFileUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setGreetingForm(prev => ({ ...prev, audioFileUrl: e.target.value }))
              }
            />

            <TextArea
              label="Description"
              placeholder="Brief description of this greeting..."
              value={greetingForm.description}
              onChange={(value: string) =>
                setGreetingForm(prev => ({ ...prev, description: value }))
              }
              rows={2}
            />

            <Button
              onClick={saveCompanyGreeting}
              disabled={!greetingForm.name || !greetingForm.greetingId || isProcessing || !greetingForm.audioFileUrl}
              className="w-full"
              variant="outline"
            >
              {isProcessing ? 'Saving...' : 'Save Greeting'}
            </Button>
          </div>

          {/* Existing Greetings */}
          <div className="space-y-4">
            <h3 className="font-medium">Existing Company Greetings</h3>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {companyGreetings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No company greetings set up yet.</p>
                  <p className="text-sm mt-1">Add greetings above to get started.</p>
                </div>
              ) : (
                companyGreetings.map((greeting, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{greeting.name}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          ID: {greeting.greeting_id}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Duration: {greeting.duration}s
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs">
                        Play
                      </Button>
                    </div>
                    {greeting.description && (
                      <p className="text-xs text-gray-500 mt-2">{greeting.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sample JSON Structure */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Sample JSON Structure</h2>
        <TextArea
          label="Expected JSON Format"
          value={JSON.stringify({
            survey: {
              title: "Patient Health Survey",
              questions: [
                {
                  id: 1,
                  text: "هل تشعر بأي ألم في الصدر؟",
                  language: "ar",
                  type: "yes_no"
                },
                {
                  id: 2,
                  text: "هل تعاني من صعوبة في التنفس؟",
                  language: "ar",
                  type: "yes_no"
                }
              ]
            }
          }, null, 2)}
          rows={10}
          readOnly
        />
      </div>
    </div>
  );
}
