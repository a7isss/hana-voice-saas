"use client";

import React, { useState } from 'react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';

interface ReportData {
  institution: string;
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  successRate: number;
  totalResponses: number;
  yesResponses: number;
  noResponses: number;
  averageCallDuration: number;
  departments: Record<string, number>;
  dateRange: string;
}

export default function ReportsPage() {
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportType, setReportType] = useState('summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const institutions = [
    { value: 'hospital-1', label: 'مستشفى الملك فهد - الرياض' },
    { value: 'hospital-2', label: 'مستشفى الملك عبدالعزيز - جدة' },
    { value: 'hospital-3', label: 'مستشفى الملك خالد - الدمام' },
    { value: 'hospital-4', label: 'مستشفى الملك سعود - الرياض' },
    { value: 'hospital-5', label: 'مستشفى الملك فيصل - الرياض' }
  ];

  const generateReport = async () => {
    if (!selectedInstitution) {
      alert('Please select an institution');
      return;
    }

    setIsGenerating(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const mockData: ReportData = {
        institution: institutions.find(inst => inst.value === selectedInstitution)?.label || selectedInstitution,
        totalCalls: 1250,
        completedCalls: 980,
        failedCalls: 270,
        successRate: 78.4,
        totalResponses: 850,
        yesResponses: 620,
        noResponses: 230,
        averageCallDuration: 45.2,
        departments: {
          'Cardiology': 320,
          'Emergency': 280,
          'Radiology': 210,
          'Dentistry': 180,
          'Pediatrics': 160,
          'General': 100
        },
        dateRange: startDate && endDate ? `${startDate} to ${endDate}` : 'Last 30 days'
      };
      
      setReportData(mockData);
      setIsGenerating(false);
    }, 2000);
  };

  const exportToExcel = () => {
    if (!reportData) return;
    
    // Simulate Excel export
    alert(`Exporting report for ${reportData.institution} to Excel...`);
  };

  const exportToPDF = () => {
    if (!reportData) return;
    
    // Simulate PDF export
    alert(`Exporting report for ${reportData.institution} to PDF...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Institutional Reports
        </h1>
      </div>

      {/* Report Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Generate Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Institution
            </label>
            <Select
              options={institutions}
              placeholder="Select institution"
              onChange={setSelectedInstitution}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Type
            </label>
            <Select
              options={[
                { value: 'summary', label: 'Summary Report' },
                { value: 'detailed', label: 'Detailed Analysis' },
                { value: 'department', label: 'Department Breakdown' }
              ]}
              placeholder="Select report type"
              onChange={setReportType}
            />
          </div>
        </div>
        
        <div className="mt-4 flex space-x-4">
          <Button
            onClick={generateReport}
            disabled={isGenerating || !selectedInstitution}
            className="px-6"
            variant="primary"
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
          
          {reportData && (
            <>
              <Button
                onClick={exportToExcel}
                className="px-6"
                variant="outline"
              >
                Export to Excel
              </Button>
              <Button
                onClick={exportToPDF}
                className="px-6"
                variant="outline"
              >
                Export to PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Summary Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Calls</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{reportData.totalCalls}</p>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Success Rate</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{reportData.successRate}%</p>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Total Responses</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{reportData.totalResponses}</p>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Avg Duration</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{reportData.averageCallDuration}s</p>
              </div>
            </div>
          </div>

          {/* Response Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-md font-semibold mb-4">Response Analysis</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Positive Responses (Yes)</span>
                  <span className="font-medium text-green-600">{reportData.yesResponses}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Negative Responses (No)</span>
                  <span className="font-medium text-red-600">{reportData.noResponses}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full" 
                    style={{ width: '100%' }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{Math.round((reportData.yesResponses / reportData.totalResponses) * 100)}% Yes</span>
                  <span>{Math.round((reportData.noResponses / reportData.totalResponses) * 100)}% No</span>
                </div>
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-md font-semibold mb-4">Department Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(reportData.departments).map(([dept, count]) => (
                  <div key={dept} className="flex justify-between items-center">
                    <span className="text-sm">{dept}</span>
                    <span className="font-medium">{count} calls</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Call Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-md font-semibold mb-4">Call Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-green-600">{reportData.completedCalls}</p>
                <p className="text-sm text-gray-600">Completed Calls</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-red-600">{reportData.failedCalls}</p>
                <p className="text-sm text-gray-600">Failed Calls</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{reportData.totalCalls}</p>
                <p className="text-sm text-gray-600">Total Attempts</p>
              </div>
            </div>
          </div>

          {/* Report Metadata */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-md font-semibold mb-4">Report Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Institution:</strong> {reportData.institution}</p>
                <p><strong>Date Range:</strong> {reportData.dateRange}</p>
              </div>
              <div>
                <p><strong>Generated:</strong> {new Date().toLocaleString()}</p>
                <p><strong>Report Type:</strong> {reportType === 'summary' ? 'Summary Report' : 
                  reportType === 'detailed' ? 'Detailed Analysis' : 'Department Breakdown'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sample Reports */}
      {!reportData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Available Report Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Summary Report</h3>
              <p className="text-sm text-gray-600">Overview of call statistics, success rates, and response analysis</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Detailed Analysis</h3>
              <p className="text-sm text-gray-600">Comprehensive breakdown with department-level insights</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Department Breakdown</h3>
              <p className="text-sm text-gray-600">Specialized reports for individual departments</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
