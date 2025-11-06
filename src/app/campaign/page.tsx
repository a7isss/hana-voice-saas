"use client";

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';

interface Survey {
  id: string;
  name: string;
  description?: string;
  hospital_id: string;
  department_id?: string;
  is_active: boolean;
}

interface SurveyQuestion {
  id: string;
  survey_id: string;
  question_text: string;
  question_order: number;
  pause_seconds: number;
  expected_responses: string[];
}

interface CampaignResult {
  id: string;
  survey_id: string;
  phone_number: string;
  status: 'pending' | 'calling' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  responses?: Array<{
    question_id: string;
    question_text: string;
    response: string;
    confidence: number;
  }>;
  failure_reason?: string;
}

interface CampaignStats {
  total_calls: number;
  completed_calls: number;
  failed_calls: number;
  pending_calls: number;
  success_rate: number;
}

export default function CampaignPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<string>('');
  const [campaignResults, setCampaignResults] = useState<CampaignResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentCall, setCurrentCall] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<CampaignStats>({
    total_calls: 0,
    completed_calls: 0,
    failed_calls: 0,
    pending_calls: 0,
    success_rate: 0
  });

  // Load surveys on component mount
  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/surveys?action=get-surveys');
      if (response.ok) {
        const data = await response.json();
        setSurveys(data.surveys.filter((s: Survey) => s.is_active));
      }
    } catch (error) {
      console.error('Error loading surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSurveyQuestions = async (surveyId: string) => {
    try {
      const response = await fetch(`/api/surveys?action=get-survey-questions&surveyId=${surveyId}`);
      if (response.ok) {
        const data = await response.json();
        setSurveyQuestions(data.questions);
      }
    } catch (error) {
      console.error('Error loading survey questions:', error);
    }
  };

  const handleSurveyChange = async (surveyId: string) => {
    const survey = surveys.find(s => s.id === surveyId);
    setSelectedSurvey(survey || null);
    if (survey) {
      await loadSurveyQuestions(surveyId);
    } else {
      setSurveyQuestions([]);
    }
  };

  const startCampaign = async () => {
    if (!selectedSurvey || !phoneNumbers.trim()) {
      alert('Please select a survey and enter phone numbers');
      return;
    }

    const phoneList = phoneNumbers
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (phoneList.length === 0) {
      alert('Please enter at least one phone number');
      return;
    }

    setIsRunning(true);
    setCampaignResults([]);
    setStats({
      total_calls: phoneList.length,
      completed_calls: 0,
      failed_calls: 0,
      pending_calls: phoneList.length,
      success_rate: 0
    });

    // Initialize campaign results
    const initialResults: CampaignResult[] = phoneList.map((phone, index) => ({
      id: `call_${Date.now()}_${index}`,
      survey_id: selectedSurvey.id,
      phone_number: phone,
      status: 'pending'
    }));

    setCampaignResults(initialResults);

    // Start calling sequence
    await runCampaign(initialResults);
  };

  const runCampaign = async (results: CampaignResult[]) => {
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      setCurrentCall(result.phone_number);

      // Update status to calling
      const updatedResults = [...results];
      updatedResults[i].status = 'calling';
      updatedResults[i].started_at = new Date().toISOString();
      setCampaignResults(updatedResults);

      // Simulate survey call (replace with actual Maqsam integration later)
      await simulateSurveyCall(updatedResults[i], i);

      // Update stats
      const completed = updatedResults.filter(r => r.status === 'completed').length;
      const failed = updatedResults.filter(r => r.status === 'failed').length;
      const pending = updatedResults.filter(r => r.status === 'pending').length;

      setStats({
        total_calls: results.length,
        completed_calls: completed,
        failed_calls: failed,
        pending_calls: pending,
        success_rate: results.length > 0 ? (completed / results.length) * 100 : 0
      });

      // Small delay between calls
      if (i < results.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsRunning(false);
    setCurrentCall('');
  };

  const simulateSurveyCall = async (callResult: CampaignResult, index: number) => {
    try {
      // Simulate call connection delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Simulate call success/failure (80% success rate)
      const isSuccess = Math.random() > 0.2;

      if (isSuccess) {
        // Simulate survey responses
        const responses = surveyQuestions.map(question => {
          // Simulate Arabic responses with validation
          const responses = ['نعم', 'لا', 'غير متأكد'];
          const randomResponse = responses[Math.floor(Math.random() * responses.length)];

          return {
            question_id: question.id,
            question_text: question.question_text,
            response: randomResponse,
            confidence: 0.8 + Math.random() * 0.2 // 0.8-1.0 confidence
          };
        });

        callResult.status = 'completed';
        callResult.completed_at = new Date().toISOString();
        callResult.responses = responses;

        // Save responses to database
        await saveSurveyResponses(callResult);
      } else {
        // Simulate call failure
        callResult.status = 'failed';
        callResult.completed_at = new Date().toISOString();
        callResult.failure_reason = Math.random() > 0.5 ? 'no_answer' : 'busy_signal';
      }
    } catch (error) {
      callResult.status = 'failed';
      callResult.failure_reason = 'technical_error';
      callResult.completed_at = new Date().toISOString();
    }
  };

  const saveSurveyResponses = async (callResult: CampaignResult) => {
    if (!callResult.responses || callResult.responses.length === 0) return;

    try {
      // Generate unique conversation ID based on date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
      const conversationId = `conv_${dateStr}_${timeStr}_${callResult.phone_number.slice(-4)}`;

      // Save each response to survey_responses table
      for (const response of callResult.responses) {
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save-survey-response',
            conversation_id: conversationId,
            client_id: 'demo-client', // In real app, get from auth
            patient_id: `patient_${callResult.phone_number.slice(-4)}`,
            department: selectedSurvey?.department_id || 'General',
            question_id: response.question_id,
            question_text: response.question_text,
            response: response.response,
            confidence: response.confidence,
            answered: true,
            phone_number: callResult.phone_number,
            survey_id: callResult.survey_id
          })
        });
      }

      console.log(`Saved ${callResult.responses.length} responses for ${callResult.phone_number}`);
    } catch (error) {
      console.error('Error saving survey responses:', error);
    }
  };

  const stopCampaign = () => {
    setIsRunning(false);
    setCurrentCall('');
  };

  const clearResults = () => {
    setCampaignResults([]);
    setStats({
      total_calls: 0,
      completed_calls: 0,
      failed_calls: 0,
      pending_calls: 0,
      success_rate: 0
    });
  };

  const exportResults = () => {
    if (campaignResults.length === 0) return;

    const csvContent = [
      ['Phone Number', 'Status', 'Started At', 'Completed At', 'Failure Reason', ...surveyQuestions.map(q => `Q${q.question_order}: ${q.question_text.substring(0, 30)}...`)].join(','),
      ...campaignResults.map(result => [
        result.phone_number,
        result.status,
        result.started_at || '',
        result.completed_at || '',
        result.failure_reason || '',
        ...surveyQuestions.map(q => {
          const response = result.responses?.find(r => r.question_id === q.id);
          return response ? `${response.response} (${Math.round(response.confidence * 100)}%)` : '';
        })
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign_results_${selectedSurvey?.name || 'survey'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Campaign - Survey Calling Robot
        </h1>
        <div className="flex space-x-2">
          {campaignResults.length > 0 && (
            <>
              <Button onClick={exportResults} variant="outline" className="px-4 py-2">
                Export Results
              </Button>
              <Button onClick={clearResults} variant="outline" className="px-4 py-2">
                Clear Results
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Campaign Setup */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Campaign Setup</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Survey Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Survey
              </label>
              <Select
                options={surveys.map(s => ({ value: s.id, label: `${s.name} - ${s.hospital_id}` }))}
                placeholder="Choose a survey to run"
                onChange={handleSurveyChange}
              />
            </div>

            {selectedSurvey && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  {selectedSurvey.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {selectedSurvey.description}
                </p>
                <div className="text-xs text-gray-500">
                  <p>Hospital: {selectedSurvey.hospital_id}</p>
                  <p>Department: {selectedSurvey.department_id}</p>
                  <p>Questions: {surveyQuestions.length}</p>
                </div>
              </div>
            )}
          </div>

          {/* Phone Numbers Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Numbers (one per line)
              </label>
              <textarea
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter phone numbers, one per line&#10;+966501234567&#10;+966552345678&#10;+966553456789"
                value={phoneNumbers}
                onChange={(e) => setPhoneNumbers(e.target.value)}
                disabled={isRunning}
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter Saudi phone numbers with country code (+966)
              </p>
            </div>
          </div>
        </div>

        {/* Campaign Controls */}
        <div className="flex justify-center mt-6 space-x-4">
          {!isRunning ? (
            <Button
              onClick={startCampaign}
              disabled={!selectedSurvey || !phoneNumbers.trim() || loading}
              className="px-8 py-3 text-lg"
            >
              Start Campaign
            </Button>
          ) : (
            <Button
              onClick={stopCampaign}
              variant="outline"
              className="px-8 py-3 text-lg border-red-500 text-red-500 hover:bg-red-50"
            >
              Stop Campaign
            </Button>
          )}
        </div>
      </div>

      {/* Campaign Progress */}
      {(isRunning || campaignResults.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Campaign Progress</h2>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.total_calls}
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200">Total Calls</div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.completed_calls}
              </div>
              <div className="text-sm text-green-800 dark:text-green-200">Completed</div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.failed_calls}
              </div>
              <div className="text-sm text-red-800 dark:text-red-200">Failed</div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.pending_calls}
              </div>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">Pending</div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Math.round(stats.success_rate)}%
              </div>
              <div className="text-sm text-purple-800 dark:text-purple-200">Success Rate</div>
            </div>
          </div>

          {/* Current Call Status */}
          {isRunning && currentCall && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    Calling: {currentCall}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Running survey with {surveyQuestions.length} questions
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Results Table */}
          {campaignResults.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Responses
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {campaignResults.map((result) => (
                    <tr key={result.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {result.phone_number}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          result.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : result.status === 'failed'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : result.status === 'calling'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {result.status === 'completed' && '✓ Completed'}
                          {result.status === 'failed' && '✗ Failed'}
                          {result.status === 'calling' && '📞 Calling'}
                          {result.status === 'pending' && '⏳ Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {result.started_at && result.completed_at
                          ? `${Math.round((new Date(result.completed_at).getTime() - new Date(result.started_at).getTime()) / 1000)}s`
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {result.responses ? (
                          <div className="space-y-1">
                            {result.responses.slice(0, 2).map((response, idx) => (
                              <div key={idx} className="text-xs">
                                Q{idx + 1}: {response.response}
                              </div>
                            ))}
                            {result.responses.length > 2 && (
                              <div className="text-xs text-gray-400">
                                +{result.responses.length - 2} more
                              </div>
                            )}
                          </div>
                        ) : result.failure_reason ? (
                          <span className="text-red-600 dark:text-red-400 text-xs">
                            {result.failure_reason}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">How Campaign Calls Work</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Call Flow:</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Hospital greeting plays</li>
              <li>Each question plays with configured pause</li>
              <li>Arabic STT captures responses (نعم/لا/غير متأكد)</li>
              <li>Thank you message plays</li>
              <li>Call ends and results are saved</li>
            </ol>
          </div>
          <div>
            <h3 className="font-medium mb-2">Current Status:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>✅ Survey management and question builder</li>
              <li>✅ Voice template generation (simulated)</li>
              <li>✅ Campaign calling logic (simulated responses)</li>
              <li>⏳ Real Maqsam telephony integration (next phase)</li>
              <li>⏳ Live Arabic STT response validation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
