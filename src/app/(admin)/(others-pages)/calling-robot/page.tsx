"use client";

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';

interface Question {
  id: number;
  text: string;
  type: string;
}

interface TemplateQuestions {
  total_questions: number;
  questions: Question[];
}

interface QuestionTemplate {
  id: number;
  template_name: string;
  department: string;
  language: string;
  questions: TemplateQuestions;
}

export default function CallingRobotPage() {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState('');
  const [callsCompleted, setCallsCompleted] = useState(0);
  const [callsPending, setCallsPending] = useState(0);
  const [callsFailed, setCallsFailed] = useState(0);
  const [currentPatient, setCurrentPatient] = useState('');
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedTemplateData, setSelectedTemplateData] = useState<QuestionTemplate | null>(null);
  const [callHistory, setCallHistory] = useState<Array<{
    patient: string;
    phone: string;
    status: 'pending' | 'completed' | 'failed';
    timestamp: string;
  }>>([]);

  // Fetch templates from database
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/data?action=get-templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates || []);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };

    fetchTemplates();
  }, []);

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id.toString() === templateId);
    setSelectedTemplateData(template || null);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.name.endsWith('.xlsx')) {
        setExcelFile(file);
        setCallStatus('Excel file uploaded successfully');
      } else {
        setCallStatus('Please upload a valid Excel file (.xlsx)');
      }
    }
  };

  const initiateCalls = async () => {
    if (!excelFile) {
      setCallStatus('Please upload an Excel file first');
      return;
    }

    if (!selectedTemplate) {
      setCallStatus('Please select a survey template first');
      return;
    }

    setIsCalling(true);
    setCallStatus('Starting automated calls...');

    try {
      const formData = new FormData();
      formData.append('excelFile', excelFile);
      formData.append('templateId', selectedTemplate);

      const response = await fetch('/api/telephony', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setCallStatus(`Calling initiated for ${result.totalPatients} patients using template: ${selectedTemplateData?.template_name || 'Unknown'}`);
        
        // Simulate call progress
        simulateCallProgress(result.totalPatients);
      } else {
        const errorData = await response.json();
        setCallStatus(`Call initiation failed: ${errorData.error}`);
      }
    } catch {
      setCallStatus('Call initiation failed. Please try again.');
    }
  };

  const simulateCallProgress = (totalPatients: number) => {
    let completed = 0;
    let failed = 0;
    let pending = totalPatients;
    
    setCallsPending(pending);
    setCallsFailed(failed);
    setCallsCompleted(completed);
    
    const interval = setInterval(() => {
      // Simulate call outcomes
      const isSuccess = Math.random() > 0.2; // 80% success rate
      
      if (isSuccess) {
        completed++;
        setCallsCompleted(completed);
        setCallHistory(prev => [...prev, {
          patient: `Patient ${completed}`,
          phone: `+9665${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
          status: 'completed',
          timestamp: new Date().toLocaleString()
        }]);
      } else {
        failed++;
        setCallsFailed(failed);
        setCallHistory(prev => [...prev, {
          patient: `Patient ${completed + failed}`,
          phone: `+9665${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
          status: 'failed',
          timestamp: new Date().toLocaleString()
        }]);
      }
      
      pending = totalPatients - completed - failed;
      setCallsPending(pending);
      setCurrentPatient(`Patient ${completed + failed + 1}`);
      setCurrentPhoneNumber(`+9665${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`);
      
      if (completed + failed >= totalPatients) {
        clearInterval(interval);
        setIsCalling(false);
        setCallStatus(`Calls completed: ${completed} successful, ${failed} failed`);
      }
    }, 3000); // Simulate 3 seconds per call
  };

  const testSingleCall = async () => {
    if (!phoneNumber) {
      setCallStatus('Please enter a phone number');
      return;
    }

    setIsCalling(true);
    setCallStatus(`Testing call to ${phoneNumber}...`);

    try {
      const response = await fetch('/api/telephony', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'initiate-call',
          phoneNumber: phoneNumber,
          clientId: 'test-client',
          audioUrl: '/api/voice?action=generate-test-audio',
          surveyId: 'test-survey',
          language: 'ar'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setCallStatus(`Test call initiated: ${result.callId}`);
      } else {
        const errorData = await response.json();
        setCallStatus(`Test call failed: ${errorData.error}`);
      }
    } catch {
      setCallStatus('Test call failed. Please try again.');
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Calling Robot
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Excel Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Upload Patient List</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Survey Template
              </label>
              <Select
                options={templates.map(template => ({
                  value: template.id.toString(),
                  label: template.template_name
                }))}
                placeholder="Choose a survey template"
                onChange={handleTemplateChange}
                className="mb-4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Excel File
              </label>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleExcelUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                aria-label="Upload Excel file with patient data"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Upload an Excel file with patient names and phone numbers
              </p>
            </div>
            
            {excelFile && (
              <div className="text-sm text-green-600">
                Selected: {excelFile.name}
              </div>
            )}

            {/* Template Preview */}
            {selectedTemplateData && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selected Template Preview
                </h3>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <p><strong>Department:</strong> {selectedTemplateData.department}</p>
                  <p><strong>Questions:</strong> {selectedTemplateData.questions?.total_questions || 0}</p>
                  <div className="mt-2">
                    <p className="font-medium">Questions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedTemplateData.questions?.questions?.map((q: Question, index: number) => (
                        <li key={q.id} className="text-xs">
                          {index + 1}. {q.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Single Test Call Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Test Single Call</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="+966XXXXXXXXX"
                value={phoneNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Button
              onClick={testSingleCall}
              disabled={isCalling || !phoneNumber}
              className="w-full"
            >
              {isCalling ? 'Calling...' : 'Test Call'}
            </Button>
          </div>
        </div>
      </div>

      {/* Start Calls Button */}
      <div className="flex justify-center">
        <Button
          onClick={initiateCalls}
          disabled={isCalling || !excelFile || !selectedTemplate}
          className="px-8 py-3"
          variant="primary"
        >
          {isCalling ? 'Calling Patients...' : 'Start Automated Calls'}
        </Button>
      </div>

      {/* Status and Progress */}
      {callStatus && (
        <div className={`p-4 rounded-lg ${
          callStatus.includes('failed') ? 'bg-red-50 border border-red-200' : 
          callStatus.includes('success') ? 'bg-green-50 border border-green-200' : 
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {callStatus.includes('failed') ? (
                <span className="text-red-400">⚠</span>
              ) : callStatus.includes('success') ? (
                <span className="text-green-400">✓</span>
              ) : (
                <span className="text-blue-400">⟳</span>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                callStatus.includes('failed') ? 'text-red-800' : 
                callStatus.includes('success') ? 'text-green-800' : 
                'text-blue-800'
              }`}>
                {callStatus}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Call Progress */}
      {(isCalling || callHistory.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Call Progress & Statistics</h2>
          
          {/* Real-time Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="text-blue-600 dark:text-blue-400 text-2xl mr-3">⟳</div>
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Pending</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{callsPending}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="text-green-600 dark:text-green-400 text-2xl mr-3">✓</div>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Completed</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{callsCompleted}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="text-red-600 dark:text-red-400 text-2xl mr-3">⚠</div>
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Failed</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{callsFailed}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {isCalling && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Current Call: {currentPatient}</span>
                <span className="text-sm text-gray-500">{currentPhoneNumber}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                <div 
                  className="bg-brand-600 h-3 rounded-full transition-all duration-300" 
                  style={{ 
                    width: `${((callsCompleted + callsFailed) / (callsCompleted + callsFailed + callsPending)) * 100 || 0}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>{Math.round(((callsCompleted + callsFailed) / (callsCompleted + callsFailed + callsPending)) * 100 || 0)}%</span>
                <span>100%</span>
              </div>
            </div>
          )}

          {/* Call History */}
          {callHistory.length > 0 && (
            <div>
              <h3 className="text-md font-semibold mb-3">Recent Calls</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                    {callHistory.slice(-10).reverse().map((call, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {call.patient}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {call.phone}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            call.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {call.status === 'completed' ? '✓ Completed' : '⚠ Failed'}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {call.timestamp}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sample Excel Structure */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Expected Excel Format</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Survey Type
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  أحمد محمد
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  +966501234567
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  Cardiology
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  فاطمة عبدالله
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  +966552345678
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  General Health
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
