/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/button/Button';
import Select from '@/components/form/Select';

type CallState = 'idle' | 'connecting' | 'live' | 'processing';

interface Message {
  id: string;
  type: 'user' | 'hana';
  text: string;
  timestamp: Date;
}

interface ScriptStep {
  id: string;
  text: string;
  waitForResponse: boolean;
  timeout: number;
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

export default function VoiceTesterPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [callState, setCallState] = useState<CallState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastTranscription, setLastTranscription] = useState<string>('');

  // Agent Configuration Script Testing
  const [scriptSets, setScriptSets] = useState<ScriptSet[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState<string>('');
  const [currentScriptStep, setCurrentScriptStep] = useState<number>(0);
  const [scriptPlaybackState, setScriptPlaybackState] = useState<'idle' | 'playing' | 'paused'>('idle');


  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load scripts from localStorage (same as agent configuration page)
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
      setSelectedScriptId(defaultScripts[0].id);
    }
  }, []);

  // Connect to voice service echo endpoint
  useEffect(() => {
    connectToVoiceService();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // Clear any pending timeouts
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Voice Service Configuration - dynamic URL for production/local
  const VOICE_SERVICE_URL = typeof window !== 'undefined'
    ? (process.env.NODE_ENV === 'production'
        ? `wss://hana-voice-service.onrender.com/ws/echo`
        : 'ws://localhost:8000/ws/echo')
    : 'ws://localhost:8000/ws/echo';

  const connectToVoiceService = () => {
    try {
      const ws = new WebSocket(VOICE_SERVICE_URL);

      ws.onopen = () => {
        console.log('Connected to echo voice service');
        setIsConnected(true);
      };

      ws.onmessage = async (event) => {
        console.log('Received message from echo service');

        if (event.data instanceof Blob) {
          // Handle audio echo response
          console.log('Received audio echo response');
          setCallState('processing');

          // Show Hana's echo message if we have transcription
          if (lastTranscription) {
            addMessage('هانا (ترديد)', lastTranscription, 'hana');
          }

          await playAudioBlob(event.data);
          setCallState('idle');
          setLastTranscription(''); // Reset for next recording

        } else if (typeof event.data === 'string') {
          // Handle text messages
          console.log('Received text response:', event.data);

          if (event.data.startsWith('transcription: ')) {
            // This is the STT transcription result
            const transcribedText = event.data.replace('transcription: ', '');
            console.log('STT Result:', transcribedText);
            setLastTranscription(transcribedText);
            // Show the user's transcribed text
            addMessage('أنت', transcribedText, 'user');

          } else if (event.data.startsWith('error:')) {
            // Handle error messages
            addMessage('خطأ', event.data, 'hana');
          } else {
            // Other text messages
            addMessage('خطأ', event.data, 'hana');
          }
        }
      };

      ws.onclose = (event) => {
        console.log('Echo service connection closed:', event.code, event.reason);
        setIsConnected(false);
        setCallState('idle');
      };

      ws.onerror = (error) => {
        console.error('Echo service error:', error);
        setIsConnected(false);
        setCallState('idle');
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect to echo service:', error);
    }
  };

  const addMessage = (speaker: string, text: string, type: 'user' | 'hana') => {
    const message: Message = {
      id: Date.now().toString(),
      type,
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const playAudioBlob = async (audioBlob: Blob) => {
    return new Promise<void>((resolve, reject) => {
      try {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Audio playback failed'));
        };

        audio.play().catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  };

  const startCall = async () => {
    try {
      setCallState('connecting');
      audioChunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      streamRef.current = stream;
      setCallState('live');
      addMessage('System', 'You can now speak. Transcription will appear in real-time.', 'user');

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && callState === 'live') {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioToEchoService(audioBlob);

        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;

      console.log('Started voice call');
    } catch (error) {
      console.error('Failed to start call:', error);
      setCallState('idle');
      alert('Microphone access required for voice testing. Please allow access and try again.');
    }
  };

  const endCall = () => {
    if (mediaRecorderRef.current && callState === 'live') {
      setCallState('processing');
      mediaRecorderRef.current.stop();
      console.log('Ended call, processing final audio...');
    }
  };

  const sendAudioToEchoService = async (audioBlob: Blob) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('Echo service not connected');
      setCallState('idle');
      return;
    }

    try {
      console.log('Sending audio to echo service...');
      wsRef.current.send(audioBlob);
    } catch (error) {
      console.error('Failed to send audio:', error);
      setCallState('idle');
    }
  };

  const toggleCall = () => {
    if (callState === 'live') {
      endCall();
    } else {
      startCall();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const reconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    connectToVoiceService();
  };

  // Script Playback Functions
  const selectedScript = scriptSets.find(s => s.id === selectedScriptId);

  const speakText = async (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!isConnected || !wsRef.current) {
        reject(new Error('Voice service not connected'));
        return;
      }

      // Send text to TTS service via WebSocket
      wsRef.current.send(`tts:${text}`);

      // Listen for response (audio will come back as Blob)
      const originalMessageHandler = wsRef.current.onmessage;
      wsRef.current.onmessage = async (event) => {
        if (event.data instanceof Blob) {
          try {
            await playAudioBlob(event.data);
            if (wsRef.current) {
              wsRef.current.onmessage = originalMessageHandler;
            }
            resolve();
          } catch (error) {
            if (wsRef.current) {
              wsRef.current.onmessage = originalMessageHandler;
            }
            reject(error);
          }
        } else {
          // Restore original handler for other messages
          originalMessageHandler?.call(wsRef.current!, event);
        }
      };
    });
  };

  const playScriptStep = async (stepIndex: number) => {
    if (!selectedScript) return;

    const step = selectedScript.steps[stepIndex];
    if (!step) return;


    addMessage('هانا (اختبار سكريبت)', step.text, 'hana');

    try {
      await speakText(step.text);

      if (step.waitForResponse && stepIndex < selectedScript.steps.length - 1) {
        // Wait for timeout before next step
        playbackTimeoutRef.current = setTimeout(() => {
          setCurrentScriptStep(stepIndex + 1);
          playScriptStep(stepIndex + 1);
        }, step.timeout * 1000);
      } else if (stepIndex < selectedScript.steps.length - 1) {
        // No wait needed, continue to next step
        setTimeout(() => {
          setCurrentScriptStep(stepIndex + 1);
          playScriptStep(stepIndex + 1);
        }, 1000); // Short pause between steps
      } else {
        // End of script
        setScriptPlaybackState('idle');
        setCurrentScriptStep(0);
      }
    } catch (error) {
      console.error('Script playback error:', error);
      addMessage('خطأ', 'فشل في تشغيل السكريبت', 'hana');
      setScriptPlaybackState('idle');
    }
  };

  const startScriptPlayback = () => {
    setCurrentScriptStep(0);
    setScriptPlaybackState('playing');
    playScriptStep(0);
  };

  const pauseScriptPlayback = () => {
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
    setScriptPlaybackState('paused');
  };

  const resumeScriptPlayback = () => {
    if (scriptPlaybackState === 'paused') {
      setScriptPlaybackState('playing');
      playScriptStep(currentScriptStep);
    }
  };

  const stopScriptPlayback = () => {
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
    setScriptPlaybackState('idle');
    setCurrentScriptStep(0);
  };

  const nextScriptStep = () => {
    if (selectedScript && currentScriptStep < selectedScript.steps.length - 1) {
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
      }
      setCurrentScriptStep(currentScriptStep + 1);
      if (scriptPlaybackState === 'playing') {
        playScriptStep(currentScriptStep + 1);
      }
    }
  };

  const previousScriptStep = () => {
    if (currentScriptStep > 0) {
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
      }
      setCurrentScriptStep(currentScriptStep - 1);
      if (scriptPlaybackState === 'playing') {
        playScriptStep(currentScriptStep - 1);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            اختبار الترديد الصوتي - Voice Echo Tester
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            اختبر تدفق الصوت من الكلام → النص → الكلام مجدداً
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium">
                {isConnected ? 'متصل بخدمة الترديد' : 'غير متصل'}
              </span>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={reconnect}
                variant="outline"
                size="sm"
              >
                إعادة الاتصال
              </Button>
              <Button
                onClick={clearChat}
                variant="outline"
                size="sm"
              >
                مسح المحادثة
              </Button>
            </div>
          </div>
        </div>

        {/* Voice Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="text-center">
            <div className="mb-6">
              <div className={`inline-block w-24 h-24 rounded-full transition-all duration-300 ${callState === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                callState === 'live' ? 'bg-green-500 animate-pulse' :
                callState === 'processing' ? 'bg-blue-500 animate-spin' :
                'bg-gray-300 dark:bg-gray-600'} flex items-center justify-center cursor-pointer`}
              onClick={isConnected ? toggleCall : undefined}
              >
                {callState === 'live' ? (
                  <div className="w-8 h-8 bg-white rounded-sm"></div>
                ) : callState === 'processing' ? (
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : callState === 'connecting' ? (
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-8 h-8 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.366 3.5a.5.5 0 0 1 .5 0L11 6.765V3.5a.5.5 0 0 1 .5-.5h1A.5.5 0 0 1 13 3.5v13a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V9.236l-4.134 3.265a.5.5 0 0 1-.732-.382V3.882a.5.5 0 0 1 .5-.382z"/>
                  </svg>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">
                {callState === 'idle' && 'جاهز للبدء بالمكالمة'}
                {callState === 'connecting' && 'جاري الاتصال...'}
                {callState === 'live' && 'المكالمة نشطة - يمكنك الكلام الآن'}
                {callState === 'processing' && 'جاري معالجة المكالمة...'}
              </h2>
              {callState === 'live' && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  النص المرسل سيظهر في الوقت الفعلي
                </p>
              )}
            </div>

            <div className="space-x-2">
              <Button
                onClick={toggleCall}
                disabled={!isConnected}
                className={`px-8 py-3 text-lg ${
                  callState === 'live'
                    ? 'bg-red-600 hover:bg-red-700'
                    : callState === 'connecting'
                    ? 'bg-gray-600 hover:bg-gray-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {callState === 'idle' && 'بدء المكالمة'}
                {callState === 'connecting' && 'جاري البدء...'}
                {callState === 'live' && 'إنهاء المكالمة'}
                {callState === 'processing' && 'جاري المعالجة...'}
              </Button>
            </div>

            {!isConnected && (
              <p className="text-red-500 mt-4">
                تأكد من تشغيل خدمة الصوت في localhost:8000
              </p>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">المحادثة والترديد</h3>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>ابدأ المكالمة لرؤية النص المرسل والترديد في الوقت الفعلي</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.type === 'user' ? 'bg-blue-600 text-white' :
                      message.type === 'hana' ? 'bg-green-100 dark:bg-green-800 dark:text-green-100' :
                      'bg-red-100 dark:bg-red-800 dark:text-red-100'}`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {message.type === 'user' ? 'ما قلته:' :
                       message.type === 'hana' ? 'هانا ترددت:' :
                       'خطأ:'}
                    </p>
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString('ar-SA')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Script Testing Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">اختبار سكريبتات التكوين الصوتي</h3>

          {/* Script Selection */}
          <div className="mb-6">
            <Select
              placeholder="اختيار سكريبت للاختبار"
              onChange={setSelectedScriptId}
              options={scriptSets.map(script => ({
                value: script.id,
                label: `${script.name} - ${script.description}`
              }))}
              className="mb-4"
            />

            {selectedScript && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p><strong>عدد الخطوات:</strong> {selectedScript.steps.length}</p>
                <p><strong>آخر تحديث:</strong> {selectedScript.updatedAt.toLocaleDateString('ar-SA')}</p>
              </div>
            )}
          </div>

          {/* Script Display and Controls */}
          {selectedScript && (
            <div className="space-y-6">
              {/* Current Step Display */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    الخطوة الحالية: {currentScriptStep + 1} من {selectedScript.steps.length}
                  </span>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    scriptPlaybackState === 'playing' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    scriptPlaybackState === 'paused' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {scriptPlaybackState === 'idle' && 'متوقف'}
                    {scriptPlaybackState === 'playing' && 'قيد التشغيل'}
                    {scriptPlaybackState === 'paused' && 'متوقف مؤقتاً'}
                  </div>
                </div>

                <div className="text-center">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 mb-4">
                    <p className="text-right text-lg leading-relaxed">
                      {selectedScript.steps[currentScriptStep]?.text || 'لا توجد خطوة محددة'}
                    </p>
                    {selectedScript.steps[currentScriptStep]?.waitForResponse && (
                      <div className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                        ⏱️ انتظار رد (وقبل: {selectedScript.steps[currentScriptStep]?.timeout} ثانية)
                      </div>
                    )}
                  </div>
                </div>

                {/* Script Control Buttons */}
                <div className="flex justify-center space-x-2">
                  {scriptPlaybackState === 'idle' && (
                    <Button
                      onClick={startScriptPlayback}
                      disabled={!isConnected}
                      className="px-6 py-2"
                    >
                      ▶️ تشغيل السكريبت
                    </Button>
                  )}

                  {scriptPlaybackState === 'playing' && (
                    <Button
                      onClick={pauseScriptPlayback}
                      className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700"
                    >
                      ⏸️ إيقاف مؤقت
                    </Button>
                  )}

                  {scriptPlaybackState === 'paused' && (
                    <Button
                      onClick={resumeScriptPlayback}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700"
                    >
                      ▶️ استمرار
                    </Button>
                  )}

                  {
                    <Button
                      onClick={stopScriptPlayback}
                      variant="outline"
                      className="px-4 py-2"
                    >
                      ⏹️ إيقاف نهائي
                    </Button>
                  }
                </div>

                {/* Navigation Controls */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <Button
                    onClick={previousScriptStep}
                    disabled={currentScriptStep === 0}
                    variant="outline"
                    size="sm"
                  >
                    السابق ◀️
                  </Button>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    تقدم: {currentScriptStep + 1} / {selectedScript.steps.length}
                  </div>

                  <Button
                    onClick={nextScriptStep}
                    disabled={currentScriptStep >= selectedScript.steps.length - 1}
                    variant="outline"
                    size="sm"
                  >
                    التالي ▶️
                  </Button>
                </div>
              </div>

              {/* All Steps Preview */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                <h4 className="text-md font-semibold mb-4 text-center">معاينة جميع خطوات السكريبت</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedScript.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        index === currentScriptStep
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                          : step.required
                          ? 'border-green-200 bg-green-50 dark:bg-green-900/10'
                          : 'border-gray-200 bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium px-2 py-1 rounded ${
                            index === currentScriptStep
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                              : step.required
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                          }`}>
                            {index + 1}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {step.required && (
                              <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-1 rounded">
                                مطلوب *
                              </span>
                            )}
                            {step.waitForResponse && (
                              <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 px-2 py-1 rounded">
                                انتظار رد
                              </span>
                            )}
                          </div>
                        </div>
                        {step.waitForResponse && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {step.timeout} ث
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-right mt-2 leading-relaxed">{step.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!selectedScript && scriptSets.length > 0 && (
            <div className="text-center text-gray-500 py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>اختر سكريبت من القائمة لعرض خطواته واختباره</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">كيفية الاختبار</h3>

          <div className="grid md:grid-cols-1 gap-6">
            <div>
              <h4 className="font-medium mb-2">تدفق الاختبار:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>اضغط "بدء المكالمة" واسمح بوصول الميكروفون</li>
                <li>قل جملة بالعربية بوضوح (مثل: "مرحباً، كيف حالك؟")</li>
                <li>انظر النص يظهر في الوقت الفعلي</li>
                <li>اسمع الترديد الصوتي للكلام</li>
                <li>اضغط "إنهاء المكالمة" عند الانتهاء</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">ملاحظات مهمة:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>هذا اختبار في الوقت الفعلي لتدفق STT → TTS</li>
                <li>لا تحتاج للضغط على زر التسجيل &ndash; المكالمة تعمل مباشرة</li>
                <li>ستردد هانا بالضبط ما قلت</li>
                <li>تأكد من تشغيل خدمة الصوت في localhost:8000</li>
                <li>استخدم متصفح Chrome أو Firefox للاختبار</li>
                <li>النص والصوت يظهران معاً</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
