"use client";

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import TextArea from '@/components/form/input/TextArea';

interface Survey {
  id: string;
  name: string;
  description?: string;
  hospital_id: string;
  department_id?: string;
  created_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SurveyQuestion {
  id: string;
  survey_id: string;
  question_text: string;
  question_order: number;
  pause_seconds: number;
  expected_responses: string[];
  created_at: string;
}

interface VoiceTemplate {
  id: string;
  survey_id: string;
  question_id?: string;
  template_type: 'greeting' | 'question' | 'goodbye';
  audio_file_path: string;
  audio_duration_seconds: number;
  language: string;
  voice_model: string;
  generated_at: string;
}

interface Hospital {
  id: string;
  name: string;
}

export default function SurveyManagementPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [voiceTemplates, setVoiceTemplates] = useState<VoiceTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  // Form states
  const [newSurvey, setNewSurvey] = useState({
    name: '',
    description: '',
    hospital_id: '',
    department_id: ''
  });

  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_order: 1,
    pause_seconds: 5,
    expected_responses: ['نعم', 'لا', 'غير متأكد']
  });

  const [hospitals] = useState<Hospital[]>([
    { id: 'King Faisal Hospital', name: 'King Faisal Hospital' },
    { id: 'Riyadh Medical Center', name: 'Riyadh Medical Center' },
    { id: 'Al Habib Hospital', name: 'Al Habib Hospital' },
    { id: 'Dr. Sulaiman Al Habib', name: 'Dr. Sulaiman Al Habib' }
  ]);

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
        setSurveys(data.surveys);
      }
    } catch (error) {
      console.error('Error loading surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSurveyDetails = async (surveyId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/surveys?action=get-survey&surveyId=${surveyId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedSurvey(data.survey);
        setSurveyQuestions(data.questions);
        setVoiceTemplates(data.voiceTemplates);
      }
    } catch (error) {
      console.error('Error loading survey details:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSurvey = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-survey',
          ...newSurvey
        })
      });

      if (response.ok) {
        setNewSurvey({ name: '', description: '', hospital_id: '', department_id: '' });
        setShowCreateForm(false);
        loadSurveys();
      }
    } catch (error) {
      console.error('Error creating survey:', error);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = async () => {
    if (!selectedSurvey) return;

    try {
      setLoading(true);
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-question',
          surveyId: selectedSurvey.id,
          ...newQuestion
        })
      });

      if (response.ok) {
        setNewQuestion({
          question_text: '',
          question_order: surveyQuestions.length + 1,
          pause_seconds: 5,
          expected_responses: ['نعم', 'لا', 'غير متأكد']
        });
        setShowQuestionForm(false);
        loadSurveyDetails(selectedSurvey.id);
      }
    } catch (error) {
      console.error('Error adding question:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateVoiceTemplates = async () => {
    if (!selectedSurvey) return;

    try {
      setLoading(true);
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-voice-templates',
          surveyId: selectedSurvey.id,
          questions: surveyQuestions,
          greetingText: `السلام عليكم، أهلاً وسهلاً بك في ${selectedSurvey.hospital_id}. هذا الاستبيان سيستغرق دقيقة واحدة فقط.`,
          goodbyeText: 'شكراً لمشاركتك في الاستبيان. خدماتنا متاحة 24 ساعة.'
        })
      });

      if (response.ok) {
        loadSurveyDetails(selectedSurvey.id);
      }
    } catch (error) {
      console.error('Error generating voice templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      setLoading(true);
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete-question',
          questionId
        })
      });

      if (response.ok) {
        loadSurveyDetails(selectedSurvey!.id);
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Survey Management
        </h1>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2"
        >
          Create New Survey
        </Button>
      </div>

      {/* Create Survey Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Create New Survey</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Survey Name
              </label>
              <Input
                type="text"
                placeholder="Enter survey name in Arabic"
                value={newSurvey.name}
                onChange={(e) => setNewSurvey(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <TextArea
                placeholder="Survey description"
                value={newSurvey.description}
                onChange={(value) => setNewSurvey(prev => ({ ...prev, description: value }))}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hospital
              </label>
              <Select
                options={hospitals.map(h => ({ value: h.id, label: h.name }))}
                placeholder="Select hospital"
                onChange={(value) => setNewSurvey(prev => ({ ...prev, hospital_id: value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Department
              </label>
              <Input
                type="text"
                placeholder="e.g., Cardiology, General Practice"
                value={newSurvey.department_id}
                onChange={(e) => setNewSurvey(prev => ({ ...prev, department_id: e.target.value }))}
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={createSurvey} disabled={loading}>
                Create Survey
              </Button>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Surveys List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Surveys</h2>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No surveys found. Create your first survey above.
          </div>
        ) : (
          <div className="space-y-4">
            {surveys.map((survey) => (
              <div
                key={survey.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedSurvey?.id === survey.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => loadSurveyDetails(survey.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {survey.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {survey.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{survey.hospital_id}</span>
                      <span>{survey.department_id}</span>
                      <span>{new Date(survey.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    survey.is_active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {survey.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Survey Details */}
      {selectedSurvey && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Survey Details: {selectedSurvey.name}</h2>
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowQuestionForm(true)}
                className="px-4 py-2"
              >
                Add Question
              </Button>
              <Button
                onClick={generateVoiceTemplates}
                disabled={loading || surveyQuestions.length === 0}
                variant="outline"
                className="px-4 py-2"
              >
                Generate Voice Templates
              </Button>
            </div>
          </div>

          {/* Add Question Form */}
          {showQuestionForm && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-6">
              <h3 className="font-medium mb-4">Add New Question</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Question Text (Arabic)
                  </label>
                  <TextArea
                    placeholder="Enter question in Arabic"
                    value={newQuestion.question_text}
                    onChange={(value) => setNewQuestion(prev => ({ ...prev, question_text: value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Question Order
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={newQuestion.question_order}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, question_order: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Pause Seconds (1-20)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={newQuestion.pause_seconds}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, pause_seconds: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expected Responses (comma-separated)
                  </label>
                  <Input
                    type="text"
                    placeholder="نعم, لا, غير متأكد"
                    value={newQuestion.expected_responses.join(', ')}
                    onChange={(e) => setNewQuestion(prev => ({
                      ...prev,
                      expected_responses: e.target.value.split(',').map(s => s.trim())
                    }))}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={addQuestion} disabled={loading}>
                    Add Question
                  </Button>
                  <Button
                    onClick={() => setShowQuestionForm(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Questions List */}
          <div className="mb-6">
            <h3 className="font-medium mb-4">Questions ({surveyQuestions.length})</h3>
            {surveyQuestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                No questions added yet. Click "Add Question" to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {surveyQuestions.map((question) => (
                  <div key={question.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded text-sm font-medium">
                            Q{question.question_order}
                          </span>
                          <span className="text-sm text-gray-500">
                            {question.pause_seconds}s pause
                          </span>
                        </div>
                        <p className="text-right text-gray-900 dark:text-white mb-2">
                          {question.question_text}
                        </p>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Expected: {question.expected_responses.join(', ')}
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteQuestion(question.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Voice Templates */}
          <div>
            <h3 className="font-medium mb-4">Voice Templates ({voiceTemplates.length})</h3>
            {voiceTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                No voice templates generated yet. Add questions and click "Generate Voice Templates".
              </div>
            ) : (
              <div className="space-y-3">
                {voiceTemplates.map((template) => (
                  <div key={template.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            template.template_type === 'greeting'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : template.template_type === 'question'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          }`}>
                            {template.template_type === 'greeting' && 'Greeting'}
                            {template.template_type === 'question' && 'Question'}
                            {template.template_type === 'goodbye' && 'Goodbye'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {template.audio_duration_seconds}s
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {template.audio_file_path}
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        {new Date(template.generated_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
