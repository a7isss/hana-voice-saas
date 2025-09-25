"use client";

import React, { useState } from 'react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';

export default function CallingRobotPage() {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState('');
  const [callsCompleted, setCallsCompleted] = useState(0);
  const [currentPatient, setCurrentPatient] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

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

    setIsCalling(true);
    setCallStatus('Starting automated calls...');

    try {
      const formData = new FormData();
      formData.append('excelFile', excelFile);

      const response = await fetch('/api/telephony', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setCallStatus(`Calling initiated for ${result.totalPatients} patients`);
        
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
    const interval = setInterval(() => {
      completed++;
      setCallsCompleted(completed);
      setCurrentPatient(`Patient ${completed}`);
      
      if (completed >= totalPatients) {
        clearInterval(interval);
        setIsCalling(false);
        setCallStatus(`All ${totalPatients} calls completed`);
      }
    }, 2000); // Simulate 2 seconds per call
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
                Upload Excel File
              </label>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleExcelUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
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
          disabled={isCalling || !excelFile}
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

      {/* Call Progress */}
      {isCalling && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Call Progress</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Current Patient:</span>
              <span className="text-sm">{currentPatient || 'Starting...'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Calls Completed:</span>
              <span className="text-sm">{callsCompleted}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-brand-600 h-2.5 rounded-full" 
                style={{ width: `${(callsCompleted / 100) * 100}%` }}
              ></div>
            </div>
          </div>
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
