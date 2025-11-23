"use client";

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import TextArea from '@/components/form/input/TextArea';
import Select from '@/components/form/Select';
import InputField from '@/components/form/input/InputField';


// Script set interface
interface ScriptStep {
  id: string;
  text: string;
  waitForResponse: boolean;
  timeout: number; // seconds
  required: boolean;
}

interface ScriptSet {
  id: string;
  name: string;
  description: string;
  steps: ScriptStep[];
  createdAt: Date;
  updatedAt: Date;
}

export default function AgentConfigurationPage() {
  const [scriptSets, setScriptSets] = useState<ScriptSet[]>([]);
  const [selectedScriptSet, setSelectedScriptSet] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentScript, setCurrentScript] = useState<ScriptSet | null>(null);
  const [showScriptInput, setShowScriptInput] = useState(false);
  const [scriptInput, setScriptInput] = useState('');
  const [alertMessage, setAlertMessage] = useState<string>('');

  // Default script sets
  useEffect(() => {
    const defaultScripts: ScriptSet[] = [
      {
        id: 'welcome-call',
        name: 'نداء الترحيب - Welcome Call',
        description: 'نسخة الترحيب الأساسية لحالات الاتصال الأول',
        createdAt: new Date(),
        updatedAt: new Date(),
        steps: [
          {
            id: 'greeting',
            text: 'السلام عليكم، أهلاً وسهلاً بك في خدمة Hana Voice، خدمة المشفى الرئيسي على الخط',
            waitForResponse: false,
            timeout: 0,
            required: true
          },
          {
            id: 'introduction',
            text: 'أهدف اليوم لمتابعة صحتك وتقديم الرعاية الطبية المناسبة',
            waitForResponse: false,
            timeout: 0,
            required: true
          },
          {
            id: 'first_question',
            text: 'كيف تشعر اليوم؟ هل هناك أي أعراض جديدة نريد متابعتها؟',
            waitForResponse: true,
            timeout: 15,
            required: true
          },
          {
            id: 'clarify',
            text: 'عذراً، هل يمكنك تكرار طلبك مرة أخرى؟',
            waitForResponse: true,
            timeout: 8,
            required: false
          },
          {
            id: 'closing',
            text: 'شكراً لاتصالك بنا، خدماتنا متوفرة 24 ساعة، في انتظار مساعدتك دائماً',
            waitForResponse: false,
            timeout: 0,
            required: true
          }
        ]
      },
      {
        id: 'follow-up',
        name: 'الاتصال المتابعة - Follow Up',
        description: 'نسخة المتابعة للتحقق من رضا العملاء',
        createdAt: new Date(),
        updatedAt: new Date(),
        steps: [
          {
            id: 'greeting',
            text: 'مرحباً، نحن نتصل من Hana Voice للمتابعة معك حول تجربتك الأخيرة. هل عندك دقيقة؟',
            waitForResponse: true,
            timeout: 12,
            required: true
          },
          {
            id: 'satisfaction',
            text: 'من 1 إلى 10، كم تقيم تجربتك مع خدمة Hana Voice؟',
            waitForResponse: true,
            timeout: 15,
            required: false
          },
          {
            id: 'feedback',
            text: 'هل لديك أي ملاحظات أو اقتراحات لتحسين خدماتنا؟',
            waitForResponse: true,
            timeout: 20,
            required: false
          },
          {
            id: 'closing',
            text: 'شكراً لوقتك وردك، نعدك بأن نحسن خدماتنا بناء على ملاحظاتك',
            waitForResponse: false,
            timeout: 0,
            required: true
          }
        ]
      },
      {
        id: 'medical-inquiry',
        name: 'استفسار طبي - Medical Inquiry',
        description: 'نسخة للاستفسارات الطبية والتوعوية',
        createdAt: new Date(),
        updatedAt: new Date(),
        steps: [
          {
            id: 'greeting',
            text: 'السلام عليكم، أهلاً بك في خدمة الاستشارات الطبية من Hana Voice. هل تحتاج مساعدة في موضوع طبي؟',
            waitForResponse: true,
            timeout: 15,
            required: true
          },
          {
            id: 'symptoms',
            text: 'هل يمكنك وصف الأعراض التي تشعر بها؟ يرجى ذكر مدة الأعراض ودرجة الإزعاج.',
            waitForResponse: true,
            timeout: 25,
            required: false
          },
          {
            id: 'severity',
            text: 'في رأيك، كم هي خطورة هذه الأعراض؟ هل تحتاج رعاية طبية فورية؟',
            waitForResponse: true,
            timeout: 12,
            required: true
          },
          {
            id: 'advice',
            text: 'بناء على وصفك، ننصحك بالتواصل فوراً مع أقرب مركز طبي. هل تحتاج مساعدة في العثور على رقم الطوارئ؟',
            waitForResponse: true,
            timeout: 10,
            required: false
          }
        ]
      }
    ];

    setScriptSets(defaultScripts);
    if (defaultScripts.length > 0) {
      setSelectedScriptSet(defaultScripts[0].id);
    }
  }, []);

  const addScriptSet = () => {
    const newScript: ScriptSet = {
      id: Date.now().toString(),
      name: 'سكريبت جديد - New Script',
      description: 'وصف السكريبت الجديد',
      createdAt: new Date(),
      updatedAt: new Date(),
      steps: [
        {
          id: 'greeting',
          text: 'السلام عليكم، كيف يمكننا مساعدتك؟',
          waitForResponse: true,
          timeout: 10,
          required: true
        }
      ]
    };
    setScriptSets(prev => [...prev, newScript]);
    setSelectedScriptSet(newScript.id);
    setIsEditing(true);
  };

  const updateScriptSet = () => {
    if (!currentScript) return;
    setScriptSets(prev =>
      prev.map(script => script.id === currentScript.id ? currentScript : script)
    );
    setIsEditing(false);
    setCurrentScript(null);
    setAlertMessage('تم حفظ السكريبت بنجاح');
    setTimeout(() => setAlertMessage(''), 3000);
  };

  const deleteScriptSet = () => {
    setScriptSets(prev => prev.filter(script => script.id !== selectedScriptSet));
    if (scriptSets.length > 1) {
      const remaining = scriptSets.filter(script => script.id !== selectedScriptSet);
      setSelectedScriptSet(remaining[0].id);
    }
    setIsEditing(false);
    setCurrentScript(null);
  };

  const importScriptsFromJSON = () => {
    try {
      const parsedScripts = JSON.parse(scriptInput);
      if (Array.isArray(parsedScripts)) {
        setScriptSets(parsedScripts);
        setAlertMessage('تم استيراد السكريبت بنجاح');
        setTimeout(() => setAlertMessage(''), 3000);
      }
      setShowScriptInput(false);
      setScriptInput('');
    } catch {
      setAlertMessage('خطأ في تنسيق JSON');
      setTimeout(() => setAlertMessage(''), 3000);
    }
  };

  const exportScriptsToJSON = () => {
    const dataStr = JSON.stringify(scriptSets, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hana-voice-scripts.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const currentScriptData = scriptSets.find(s => s.id === selectedScriptSet);

  if (isEditing && currentScript) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">تعديل سكريبت الترديد</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Configure voice agent scripts and timing</p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => {
                setIsEditing(false);
                setCurrentScript(null);
              }} variant="outline">
                إلغاء
              </Button>
              <Button onClick={updateScriptSet}>
                حفظ
              </Button>
            </div>
          </div>

          {/* Edit Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="اسم السكريبت"
                value={currentScript.name}
                onChange={(event) => setCurrentScript({...currentScript, name: event.target.value})}
              />
              <InputField
                label="الوصف"
                value={currentScript.description}
                onChange={(event) => setCurrentScript({...currentScript, description: event.target.value})}
              />
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">خطوات السكريبت</h3>
              <div className="space-y-4">
                {currentScript.steps.map((step, index) => (
                  <div key={step.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <span className="font-medium">الخطوة {index + 1}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newSteps = currentScript.steps.filter((_, i) => i !== index);
                          setCurrentScript({...currentScript, steps: newSteps});
                        }}
                      >
                        حذف
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <TextArea
                        label="نص السكريبت"
                        value={step.text}
                        onChange={(value) => {
                          const newSteps = [...currentScript.steps];
                          newSteps[index] = { ...step, text: value };
                          setCurrentScript({...currentScript, steps: newSteps});
                        }}
                        rows={3}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <InputField
                          label="وقت الانتظار (ثانية)"
                          type="number"
                          value={step.timeout.toString()}
                          onChange={(event) => {
                            const newSteps = [...currentScript.steps];
                            newSteps[index] = { ...step, timeout: parseInt(event.target.value) };
                            setCurrentScript({...currentScript, steps: newSteps});
                          }}
                        />
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={step.waitForResponse}
                            onChange={(e) => {
                              const newSteps = [...currentScript.steps];
                              newSteps[index] = { ...step, waitForResponse: e.target.checked };
                              setCurrentScript({...currentScript, steps: newSteps});
                            }}
                            className="rounded"
                          />
                          <label>انتظار إجابة</label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={() => {
                    const newStep: ScriptStep = {
                      id: Date.now().toString(),
                      text: '',
                      waitForResponse: true,
                      timeout: 10,
                      required: false
                    };
                    setCurrentScript({...currentScript, steps: [...currentScript.steps, newStep]});
                  }}
                >
                  إضافة خطوة جديدة
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">تكوين الوكيل الصوتي</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Configure voice agent scripts and call flows</p>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={() => setShowScriptInput(true)}
              variant="outline"
            >
              استيراد JSON
            </Button>
            <Button
              onClick={exportScriptsToJSON}
              variant="outline"
            >
              تصدير JSON
            </Button>
            <Button onClick={addScriptSet}>
              سكريبت جديد
            </Button>
          </div>
        </div>

        {alertMessage && (
          <Alert variant="success" title="نجح" message={alertMessage} />
        )}

        {/* JSON Import Modal */}
        {showScriptInput && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-4xl w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">استيراد سكريبت من JSON</h3>
              <TextArea
                label="JSON Script Data"
                value={scriptInput}
                onChange={setScriptInput}
                rows={10}
                placeholder='[{"name": "Script Name", "description": "Description", "steps": [...]}, ...]'
              />
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowScriptInput(false);
                    setScriptInput('');
                  }}
                >
                  إلغاء
                </Button>
                <Button onClick={importScriptsFromJSON}>
                  استيراد
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Script Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">اختيار سكريبت</h2>
            {currentScriptData && (
              <div className="flex space-x-2">
                <Button onClick={() => {
                  setCurrentScript({...currentScriptData});
                  setIsEditing(true);
                }}>
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  onClick={deleteScriptSet}
                  className="text-red-600 hover:text-red-700"
                >
                  حذف
                </Button>
              </div>
            )}
          </div>

          <Select
            placeholder="اختيار مجموعة السكريبت"
            onChange={setSelectedScriptSet}
            options={scriptSets.map(script => ({
              value: script.id,
              label: `${script.name} - ${script.description}`
            }))}
          />
        </div>

        {/* Script Details */}
        {currentScriptData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Script Info */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">معلومات السكريبت</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">الاسم</label>
                    <p className="text-sm">{currentScriptData.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">الوصف</label>
                    <p className="text-sm">{currentScriptData.description}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">عدد الخطوات</label>
                    <p className="text-sm">{currentScriptData.steps.length}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">آخر تحديث</label>
                    <p className="text-sm">{currentScriptData.updatedAt.toLocaleDateString('ar-SA')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Script Steps */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">خطوات السكريبت</h3>
                <div className="space-y-4">
                  {currentScriptData.steps.map((step, index) => (
                    <div key={step.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          الخطوة {index + 1}
                          {step.required && <span className="text-red-500 ml-2">*</span>}
                        </span>
                        <div className="flex items-center space-x-2">
                          {step.waitForResponse && (
                            <span className="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                              انتظار إجابة ({step.timeout} ث)
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-right">{step.text}</p>
                    </div>
                  ))}
                </div>

                {/* JSON Export */}
                <div className="mt-6">
                  <h4 className="font-medium mb-2">JSON للسكريبت الحالي:</h4>
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-xs overflow-x-auto">
                    <pre>{JSON.stringify(currentScriptData, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">كيفية استخدام</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">خطوات التكوين:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>اختر سكريبت موجود أو أنشئ سكريبت جديد</li>
                <li>عدل السكريبت حسب احتياجاتك</li>
                <li>اضبط أوقات الانتظار والاستجابة</li>
                <li>حدد الخطوات المطلوبة والاختيارية</li>
                <li>احفظ التغييرات واستخدم في خدمة المكالمات</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">إعدادات التوقيت:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li><strong>انتظار إجابة:</strong> ستنتظر الرد قبل الانتقال للخطوة التالية</li>
                <li><strong>وقت الانتظار:</strong> المدة المسموحة للإجابة قبل الانتقال</li>
                <li><strong>مطلوب:</strong> خطوات يجب إكمالها في المكالمة</li>
                <li><strong>اختياري:</strong> خطوات يمكن تخطيها إذا لزم الأمر</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
