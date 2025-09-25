"use client";

import React, { useState } from 'react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';

interface TestResults {
  audioGeneration?: unknown;
  callInitiation?: unknown;
  dataStorage?: unknown;
  responses?: Array<{ questionId: number; response: string; confidence: number }>;
  services?: {
    voice: unknown;
    telephony: unknown;
    data: unknown;
  };
  connectivity?: string;
}

export default function DemoTestCallPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState('');
  const [testResults, setTestResults] = useState<TestResults | null>(null);

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

        {/* Demo Survey Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Demo Survey Questions</h2>
          <div className="space-y-3">
            {generateTestSurvey().survey.questions.map((question, index) => (
              <div key={question.id} className="border-l-4 border-brand-500 pl-4 py-2">
                <div className="flex items-start space-x-2">
                  <span className="text-sm font-medium text-gray-500">{index + 1}.</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {question.text}
                    </p>
                    <p className="text-xs text-gray-500">
                      Type: {question.type} • Language: {question.language}
                    </p>
                  </div>
                </div>
              </div>
            ))}
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
