"use client";

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
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

interface AudioSetConfiguration {
  questionDelay: number;
  responseWindow: number;
  silenceThreshold: number;
  maxRetries: number;
  timeoutBetweenQuestions: number;
}

interface AudioSet {
  id: string;
  set_id: string;
  name: string;
  description: string;
  language: string;
  department: string;
  configuration: AudioSetConfiguration;
  audio_files: AudioFile[];
}

interface TestResults {
  audioGeneration?: {
    audioUrl?: string;
    status?: string;
    message?: string;
  };
  callInitiation?: {
    callId?: string;
    status?: string;
    message?: string;
  };
  dataStorage?: {
    status?: string;
    message?: string;
    batchId?: string;
  };
  responses?: Array<{
    questionId: number;
    response: string;
    confidence: number;
  }>;
  services?: {
    voice: {
      status?: string;
      message?: string;
    };
    telephony: {
      status?: string;
      message?: string;
    };
    data: {
      status?: string;
      message?: string;
    };
  };
  connectivity?: string;
}

export default function DemoTestCallPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState('');
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [audioSets, setAudioSets] = useState<AudioSet[]>([]);
  const [selectedAudioSet, setSelectedAudioSet] = useState('');

  // Load available audio sets
  useEffect(() => {
    const loadAudioSets = async () => {
      try {
        const response = await fetch('/api/data?action=get-audio-sets');
        if (response.ok) {
          const data = await response.json();
          setAudioSets(data.audioSets || []);
        }
      } catch (error) {
        console.error('Error loading audio sets:', error);
      }
    };
    loadAudioSets();
  }, []);

  const generateTestSurvey = () => {
    return {
      survey: {
        title: "Demo Health Survey",
        questions: [
          {
            id: 1,
            text: "هل تشعر بصحة جيدة اليوم؟",
            language: "ar",
            type: "yes_no"
          },
          {
            id: 2,
            text: "هل تناولت أدويتك اليوم؟",
            language: "ar",
            type: "yes_no"
          },
          {
            id: 3,
            text: "هل تشعر بأي أعراض جديدة؟",
            language: "ar",
            type: "yes_no"
          },
          {
            id: 4,
            text: "هل تحتاج إلى موعد طبي؟",
            language: "ar",
            type: "yes_no"
          },
          {
            id: 5,
            text: "هل أنت راض عن الخدمة الصحية؟",
            language: "ar",
            type: "yes_no"
          }
        ]
      }
    };
  };

  const runFullPipelineTest = async () => {
    if (!phoneNumber) {
      setTestStatus('Please enter a phone number');
      return;
    }

    setIsTesting(true);
    setTestStatus('Starting full pipeline test...');

    try {
      // Step 1: Generate test audio files
      setTestStatus('Generating audio files for demo survey...');
      
      const surveyData = generateTestSurvey();
      const audioResponse = await fetch('/api/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate-test-audio',
          survey: surveyData,
          language: 'ar'
        })
      });

      if (!audioResponse.ok) {
        throw new Error('Audio generation failed');
      }

      const audioResult = await audioResponse.json();
      
      // Step 2: Initiate test call
      setTestStatus('Initiating test call...');
      
      const callResponse = await fetch('/api/telephony', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'initiate-call',
          phoneNumber: phoneNumber,
          clientId: 'demo-test',
          audioUrl: audioResult.audioUrl,
          surveyId: 'demo-survey',
          language: 'ar'
        })
      });

      if (!callResponse.ok) {
        throw new Error('Call initiation failed');
      }

      const callResult = await callResponse.json();

      // Step 3: Simulate response collection
      setTestStatus('Simulating response collection...');
      
      const responses = [
        { questionId: 1, response: 'نعم', confidence: 0.95 },
        { questionId: 2, response: 'لا', confidence: 0.88 },
        { questionId: 3, response: 'غير متأكد', confidence: 0.45 },
        { questionId: 4, response: 'نعم', confidence: 0.92 },
        { questionId: 5, response: 'نعم', confidence: 0.97 }
      ];

      // Step 4: Store results in database
      setTestStatus('Storing results in database...');
      
      const dataResponse = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'store-survey-results',
          surveyId: 'demo-survey',
          patientPhone: phoneNumber,
          responses: responses,
          callId: callResult.callId
        })
      });

      if (!dataResponse.ok) {
        throw new Error('Data storage failed');
      }

      const dataResult = await dataResponse.json();

      // Final results
      setTestResults({
        audioGeneration: audioResult,
        callInitiation: callResult,
        dataStorage: dataResult,
        responses: responses
      });

      setTestStatus('Demo test completed successfully!');
      
    } catch (error) {
      setTestStatus(`Test failed: ${(error as Error).message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const quickTest = async () => {
    if (!phoneNumber) {
      setTestStatus('Please enter a phone number');
      return;
    }

    setIsTesting(true);
    setTestStatus('Running quick connectivity test...');

    try {
      // Test API connectivity
      const healthChecks = await Promise.all([
        fetch('/api/voice').then(r => r.json()),
        fetch('/api/telephony').then(r => r.json()),
        fetch('/api/data').then(r => r.json())
      ]);

      const allHealthy = healthChecks.every(check => check.status === 'healthy');
      
      if (allHealthy) {
        setTestStatus('All services are healthy and ready for calls');
        setTestResults({
          services: {
            voice: healthChecks[0],
            telephony: healthChecks[1],
            data: healthChecks[2]
          },
          connectivity: 'success'
        });
      } else {
        throw new Error('Some services are not healthy');
      }
    } catch (error) {
      setTestStatus(`Connectivity test failed: ${(error as Error).message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Demo/Test Call Page
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Test Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number for Test
              </label>
              <Input
                type="tel"
                placeholder="+966501234567"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
                className="w-full"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Enter a phone number to test the full pipeline
              </p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={quickTest}
                disabled={isTesting || !phoneNumber}
                className="w-full"
                variant="outline"
              >
                Quick Connectivity Test
              </Button>
              
              <Button
                onClick={runFullPipelineTest}
                disabled={isTesting || !phoneNumber}
                className="w-full"
                variant="primary"
              >
                {isTesting ? 'Testing...' : 'Run Full Pipeline Test'}
              </Button>
            </div>
          </div>
        </div>

        {/* Audio Set Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Audio Set Selection</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Audio Set
              </label>
              <Select
                options={audioSets.map(audioSet => ({
                  value: audioSet.set_id,
                  label: `${audioSet.name} (${audioSet.language.toUpperCase()}) - ${audioSet.department}`
                }))}
                placeholder="Choose an audio set for the demo"
                defaultValue={selectedAudioSet}
                onChange={(value: string) => setSelectedAudioSet(value)}
              />
            </div>

            {selectedAudioSet && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium mb-2">Selected Audio Set Preview</h3>
                {(() => {
                  const selectedSet = audioSets.find(set => set.set_id === selectedAudioSet);
                  return selectedSet ? (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <strong>Name:</strong> {selectedSet.name}
                      </div>
                      <div className="text-sm">
                        <strong>Description:</strong> {selectedSet.description}
                      </div>
                      <div className="text-sm">
                        <strong>Language:</strong> {selectedSet.language === 'ar' ? 'Arabic' : 'English'}
                      </div>
                      <div className="text-sm">
                        <strong>Department:</strong> {selectedSet.department}
                      </div>
                      <div className="text-sm">
                        <strong>Files:</strong> {selectedSet.audio_files?.length || 0}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {audioSets.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-4">
                No audio sets available. Create some in the Audio Set Creation page first.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Status */}
      {testStatus && (
        <div className={`p-4 rounded-lg ${
          testStatus.includes('failed') ? 'bg-red-50 border border-red-200' : 
          testStatus.includes('success') ? 'bg-green-50 border border-green-200' : 
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {testStatus.includes('failed') ? (
                <span className="text-red-400">⚠</span>
              ) : testStatus.includes('success') ? (
                <span className="text-green-400">✓</span>
              ) : (
                <span className="text-blue-400">⟳</span>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                testStatus.includes('failed') ? 'text-red-800' : 
                testStatus.includes('success') ? 'text-green-800' : 
                'text-blue-800'
              }`}>
                {testStatus}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Test Results */}
      {testResults && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Test Results</h2>
          
          {testResults.connectivity ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-medium">Voice Service</h3>
                  <p className={`text-sm ${(testResults.services?.voice as {status?: string})?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                    {(testResults.services?.voice as {status?: string})?.status || 'unknown'}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-medium">Telephony Service</h3>
                  <p className={`text-sm ${(testResults.services?.telephony as {status?: string})?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                    {(testResults.services?.telephony as {status?: string})?.status || 'unknown'}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-medium">Data Service</h3>
                  <p className={`text-sm ${(testResults.services?.data as {status?: string})?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                    {(testResults.services?.data as {status?: string})?.status || 'unknown'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Audio Generation Results */}
              <div>
                <h3 className="font-medium mb-2">Audio Generation</h3>
                <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded">
                  {JSON.stringify(testResults.audioGeneration, null, 2)}
                </pre>
              </div>

              {/* Call Initiation Results */}
              <div>
                <h3 className="font-medium mb-2">Call Initiation</h3>
                <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded">
                  {JSON.stringify(testResults.callInitiation, null, 2)}
                </pre>
              </div>

              {/* Data Storage Results */}
              <div>
                <h3 className="font-medium mb-2">Data Storage</h3>
                <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded">
                  {JSON.stringify(testResults.dataStorage, null, 2)}
                </pre>
              </div>

              {/* Simulated Responses */}
              <div>
                <h3 className="font-medium mb-2">Simulated Responses</h3>
                <div className="space-y-2">
                  {testResults.responses?.map((response, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <span>Question {response.questionId}</span>
                      <span className="font-medium">{response.response}</span>
                      <span className="text-xs text-gray-500">({(response.confidence * 100).toFixed(0)}% confidence)</span>
                    </div>
                  )) ?? []}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Usage Instructions</h2>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <span className="text-brand-500 font-medium">1.</span>
            <div>
              <p className="font-medium">Quick Connectivity Test</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tests if all API services are running and healthy. This is a fast check for basic connectivity.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-brand-500 font-medium">2.</span>
            <div>
              <p className="font-medium">Full Pipeline Test</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Runs the complete workflow: generates audio, initiates a call, simulates responses, and stores data.
                Use this for comprehensive testing and customer demonstrations.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-brand-500 font-medium">3.</span>
            <div>
              <p className="font-medium">Production Ready</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This demo uses the same APIs and workflows as the production system, ensuring accurate testing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
