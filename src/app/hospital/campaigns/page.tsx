"use client";

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import ExcelJS from 'exceljs';

interface Question {
  id: number;
  text: string;
  type: string;
}

interface TemplateQuestions {
  total_questions: number;
  questions: Question[];
}

interface AudioFile {
  id: string;
  fileName: string;
  description: string;
  duration: string;
  text: string;
  questionNumber?: number;
  type?: string;
}

interface AudioSet {
  id: string;
  name: string;
  department: string;
  language: string;
  audio_files?: AudioFile[];
}

interface QuestionTemplate {
  id: number;
  template_name: string;
  department: string;
  language: string;
  questions: TemplateQuestions;
}

interface PatientData {
  name: string;
  phone: string;
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

  // Global pause controls
  const [pauseConfig, setPauseConfig] = useState({
    enabled: false,
    startTime: '00:00',
    endTime: '06:00',
    message: 'Automated calling paused during off-hours. Calls will resume at 6:00 AM.'
  });
  const [isPaused, setIsPaused] = useState(false);
  const [pauseOverride, setPauseOverride] = useState(false);

  // Fetch audio sets and greetings from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch audio sets
        const audioResponse = await fetch('/api/data?action=get-audio-sets');
        if (audioResponse.ok) {
          const audioData = await audioResponse.json();
          // Transform audio sets to template format for compatibility
          const transformedTemplates = audioData.audioSets?.map((audioSet: AudioSet) => ({
            id: audioSet.id,
            template_name: audioSet.name,
            department: audioSet.department,
            language: audioSet.language,
            questions: {
              total_questions: audioSet.audio_files?.filter((file: AudioFile) =>
                file.id.startsWith('question_')
              ).length || 0,
              questions: audioSet.audio_files?.filter((file: AudioFile) =>
                file.id.startsWith('question_')
              ).map((file: AudioFile, index: number) => ({
                id: index + 1,
                text: file.text || file.description,
                type: file.type || 'yes_no'
              })) || []
            }
          })) || [];
          setTemplates(transformedTemplates);
        }

        // Fetch company greetings - kept for backward compatibility but no longer used
        await fetch('/api/data?action=get-company-greetings');
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
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

  const parseExcelFile = async (file: File): Promise<PatientData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);

          const worksheet = workbook.getWorksheet(1);
          if (!worksheet) {
            reject(new Error('No worksheet found'));
            return;
          }

          const patients: PatientData[] = [];

          // Iterate over rows starting from row 2 (assuming header is row 1)
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            // Assuming Name is col 1, Phone is col 2
            const name = row.getCell(1).text;
            const phone = row.getCell(2).text;

            if (phone) {
              patients.push({ name: name || 'Unknown', phone });
            }
          });

          resolve(patients);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
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
    setCallStatus('Reading Excel file...');

    try {
      const patients = await parseExcelFile(excelFile);
      setCallStatus(`Found ${patients.length} patients. Starting queue...`);

      // Create a Campaign ID (mock for now, or fetch from backend)
      const campaignId = `camp_${Date.now()}`;

      processPatientQueue(patients, campaignId);
    } catch (error) {
      console.error('Error parsing Excel:', error);
      setCallStatus('Failed to parse Excel file.');
      setIsCalling(false);
    }
  };

  const processPatientQueue = async (patients: PatientData[], campaignId: string) => {
    let completed = 0;
    let failed = 0;
    setCallsPending(patients.length);
    setCallsCompleted(0);
    setCallsFailed(0);

    for (const patient of patients) {
      if (isPaused) {
        setCallStatus('Queue paused. Waiting to resume...');
        // Simple pause logic: wait loop
        while (isPaused) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      setCurrentPatient(patient.name);
      setCurrentPhoneNumber(patient.phone);
      setCallStatus(`Calling ${patient.name}...`);

      try {
        // 1. Trigger Call
        const triggerRes = await fetch('/api/campaigns/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientName: patient.name,
            phoneNumber: patient.phone,
            templateId: selectedTemplate,
            campaignId: campaignId
          })
        });

        if (!triggerRes.ok) throw new Error('Failed to trigger call');
        const { sessionId } = await triggerRes.json();

        // 2. Poll Status
        let status = 'queued';
        while (status === 'queued' || status === 'ringing' || status === 'in-progress') {
          await new Promise(r => setTimeout(r, 2000)); // Poll every 2s
          const statusRes = await fetch(`/api/campaigns/status?sessionId=${sessionId}`);
          const statusData = await statusRes.json();
          status = statusData.status;
        }

        if (status === 'completed') {
          completed++;
          setCallsCompleted(completed);
          setCallHistory(prev => [...prev, {
            patient: patient.name,
            phone: patient.phone,
            status: 'completed',
            timestamp: new Date().toLocaleString()
          }]);
        } else {
          failed++;
          setCallsFailed(failed);
          setCallHistory(prev => [...prev, {
            patient: patient.name,
            phone: patient.phone,
            status: 'failed',
            timestamp: new Date().toLocaleString()
          }]);
        }

      } catch (error) {
        console.error('Call error:', error);
        failed++;
        setCallsFailed(failed);
      }

      setCallsPending(prev => prev - 1);
    }

    setIsCalling(false);
    setCallStatus(`Campaign Finished: ${completed} Completed, ${failed} Failed.`);
  };

  const testSingleCall = async () => {
    if (!phoneNumber) {
      setCallStatus('Please enter a phone number');
      return;
    }

    if (!selectedTemplate) {
      setCallStatus('Please select a survey template first');
      return;
    }

    setIsCalling(true);
    setCallStatus(`Testing call to ${phoneNumber}...`);

    try {
      // 1. Trigger Call
      const triggerRes = await fetch('/api/campaigns/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: 'Test Patient',
          phoneNumber: phoneNumber,
          templateId: selectedTemplate,
          campaignId: `test_${Date.now()}`
        })
      });

      if (!triggerRes.ok) {
        const errorData = await triggerRes.json();
        throw new Error(errorData.error || 'Failed to trigger call');
      }

      const { sessionId } = await triggerRes.json();
      setCallStatus(`Call initiated (Session: ${sessionId}). Waiting for completion...`);

      // 2. Poll Status
      let status = 'queued';
      while (status === 'queued' || status === 'ringing' || status === 'in-progress') {
        await new Promise(r => setTimeout(r, 2000)); // Poll every 2s
        const statusRes = await fetch(`/api/campaigns/status?sessionId=${sessionId}`);
        const statusData = await statusRes.json();
        status = statusData.status;
      }

      if (status === 'completed') {
        setCallStatus(`Test Call Completed Successfully!`);
        setCallHistory(prev => [...prev, {
          patient: 'Test Patient',
          phone: phoneNumber,
          status: 'completed',
          timestamp: new Date().toLocaleString()
        }]);
      } else {
        setCallStatus(`Test Call Failed.`);
        setCallHistory(prev => [...prev, {
          patient: 'Test Patient',
          phone: phoneNumber,
          status: 'failed',
          timestamp: new Date().toLocaleString()
        }]);
      }

    } catch (error: any) {
      console.error('Test call error:', error);
      setCallStatus(`Test call failed: ${error.message}`);
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
                Select Agent Script Set
              </label>
              <Select
                options={templates.map(template => ({
                  value: template.id.toString(),
                  label: `${template.template_name} (${template.language.toUpperCase()})`
                }))}
                placeholder="Choose a script from Agent Configuration"
                onChange={handleTemplateChange}
                className="mb-4"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Scripts include company greetings and call flows configured in the <a href="/agent-configuration" className="text-blue-600 hover:underline" target="_blank">Agent Configuration</a> page
              </p>
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
        <div className={`p-4 rounded-lg ${callStatus.includes('failed') ? 'bg-red-50 border border-red-200' :
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
              <p className={`text-sm font-medium ${callStatus.includes('failed') ? 'text-red-800' :
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
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${call.status === 'completed'
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

      {/* Global Pause Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Global Pause Settings</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Configure automated calling pause periods to avoid calling during off-hours or holidays.
          When enabled, calls will be paused and resumed automatically based on the time settings.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="pauseEnabled"
                checked={pauseConfig.enabled}
                onChange={(e) => setPauseConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="pauseEnabled" className="text-sm font-medium text-gray-900 dark:text-white">
                Enable Global Pause
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pause Start Time
                </label>
                <Input
                  type="time"
                  value={pauseConfig.startTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPauseConfig(prev => ({ ...prev, startTime: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pause End Time
                </label>
                <Input
                  type="time"
                  value={pauseConfig.endTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPauseConfig(prev => ({ ...prev, endTime: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pause Message (Optional)
              </label>
              <Input
                type="text"
                placeholder="Custom pause message..."
                value={pauseConfig.message}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPauseConfig(prev => ({ ...prev, message: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Current Status</h3>
            <div className={`p-4 rounded-lg ${isPaused ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200' : 'bg-green-50 dark:bg-green-900/20 border border-green-200'}`}>
              <div className="flex items-center">
                <span className={`text-2xl mr-3 ${isPaused ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                  {isPaused ? '⏸️' : '▶️'}
                </span>
                <div>
                  <p className={`font-medium ${isPaused ? 'text-yellow-800 dark:text-yellow-200' : 'text-green-800 dark:text-green-200'}`}>
                    {isPaused ? 'Calls Currently Paused' : 'Calls Active'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isPaused ? pauseConfig.message : 'Automated calling is active'}
                  </p>
                </div>
              </div>
            </div>

            {pauseOverride && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-orange-600 dark:text-orange-400 mr-2">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      Override Active
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      Paused period overridden by administrator
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <Button
                onClick={() => setIsPaused(true)}
                disabled={!pauseConfig.enabled || isPaused}
                className="flex-1"
                variant="outline"
                size="sm"
              >
                Manual Pause
              </Button>
              <Button
                onClick={() => setIsPaused(false)}
                disabled={!pauseConfig.enabled || !isPaused}
                className="flex-1"
                variant="outline"
                size="sm"
              >
                Resume Calls
              </Button>
              <Button
                onClick={() => setPauseOverride(!pauseOverride)}
                className="flex-1"
                variant={pauseOverride ? "outline" : "primary"}
                size="sm"
              >
                {pauseOverride ? 'Disable Override' : 'Override Pause'}
              </Button>
            </div>
          </div>
        </div>
      </div>

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
