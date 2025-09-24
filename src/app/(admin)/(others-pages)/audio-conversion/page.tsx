"use client";

import React, { useState } from 'react';
import Button from '@/components/ui/button/Button';
import InputField from '@/components/form/input/InputField';
import FileInput from '@/components/form/input/FileInput';
import TextArea from '@/components/form/input/TextArea';
import Alert from '@/components/ui/alert/Alert';

export default function AudioConversionPage() {
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [configFile, setConfigFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStatus, setConversionStatus] = useState('');
  const [audioFiles, setAudioFiles] = useState<string[]>([]);
  const [timingConfig, setTimingConfig] = useState({
    questionDelay: 2,
    responseWindow: 10,
    silenceThreshold: 3
  });

  const handleJsonUpload = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/json') {
        setJsonFile(file);
        setConversionStatus('JSON file uploaded successfully');
      } else {
        setConversionStatus('Please upload a valid JSON file');
      }
    }
  };

  const handleConfigUpload = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/json') {
        setConfigFile(file);
        setConversionStatus('Configuration file uploaded successfully');
      } else {
        setConversionStatus('Please upload a valid JSON configuration file');
      }
    }
  };

  const convertToAudio = async () => {
    if (!jsonFile) {
      setConversionStatus('Please upload a JSON file first');
      return;
    }

    setIsConverting(true);
    setConversionStatus('Converting questions to audio...');

    try {
      const formData = new FormData();
      formData.append('jsonFile', jsonFile);
      if (configFile) {
        formData.append('configFile', configFile);
      }
      formData.append('timingConfig', JSON.stringify(timingConfig));

      const response = await fetch('/api/voice', {
        method: 'POST',
        body: formData,
        headers: {
          'action': 'convert-questions-to-audio'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setAudioFiles(result.audioFiles);
        setConversionStatus(`Successfully converted ${result.audioFiles.length} questions to audio`);
      } else {
        const error = await response.json();
        setConversionStatus(`Conversion failed: ${error.error}`);
      }
    } catch (error) {
      setConversionStatus('Conversion failed. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const downloadAudioFile = (audioUrl: string, questionNumber: number) => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `question-${questionNumber}.mp3`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Audio Question Conversion
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        </div>

        {/* Configuration Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Timing Configuration</h2>
          
          <div className="space-y-4">
            <InputField
              label="Question Delay (seconds)"
              type="number"
              value={timingConfig.questionDelay}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimingConfig(prev => ({
                ...prev,
                questionDelay: parseInt(e.target.value)
              }))}
              min="1"
              max="10"
            />
            
            <InputField
              label="Response Window (seconds)"
              type="number"
              value={timingConfig.responseWindow}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimingConfig(prev => ({
                ...prev,
                responseWindow: parseInt(e.target.value)
              }))}
              min="5"
              max="30"
            />
            
            <InputField
              label="Silence Threshold (seconds)"
              type="number"
              value={timingConfig.silenceThreshold}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimingConfig(prev => ({
                ...prev,
                silenceThreshold: parseInt(e.target.value)
              }))}
              min="1"
              max="10"
            />
          </div>

          <div className="mt-4">
            <FileInput
              label="Upload Custom Configuration (Optional)"
              accept=".json"
              onChange={handleConfigUpload}
              helperText="Upload a custom timing configuration file"
            />
          </div>
        </div>
      </div>

      {/* Convert Button */}
      <div className="flex justify-center">
        <Button
          onClick={convertToAudio}
          disabled={isConverting || !jsonFile}
          className="px-8 py-3"
        >
          {isConverting ? 'Converting...' : 'Convert to Audio'}
        </Button>
      </div>

      {/* Status Message */}
      {conversionStatus && (
        <Alert
          variant={conversionStatus.includes('failed') ? 'error' : 'success'}
          title={conversionStatus.includes('failed') ? 'Error' : 'Success'}
          message={conversionStatus}
        />
      )}

      {/* Generated Audio Files */}
      {audioFiles.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Generated Audio Files</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {audioFiles.map((audioUrl, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Question {index + 1}</span>
                  <Button
                    size="sm"
                    onClick={() => downloadAudioFile(audioUrl, index + 1)}
                  >
                    Download
                  </Button>
                </div>
                <audio controls className="w-full mt-2">
                  <source src={audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            ))}
          </div>
        </div>
      )}

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
