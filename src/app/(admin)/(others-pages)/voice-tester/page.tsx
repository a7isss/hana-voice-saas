"use client";

import React, { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/button/Button';

type RecordingState = 'idle' | 'recording' | 'processing' | 'playing';

interface Message {
  id: string;
  type: 'user' | 'hana';
  text: string;
  timestamp: Date;
}

export default function VoiceTesterPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Connect to voice service WebSocket
  useEffect(() => {
    connectToVoiceService();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Voice Service Configuration
  const VOICE_SERVICE_URL = process.env.NODE_ENV === 'development'
    ? 'ws://localhost:8000/ws/healthcare-questionnaire'
    : `wss://${window.location.host.replace('3000', '8000')}/ws/healthcare-questionnaire`;

  const connectToVoiceService = () => {
    setIsInitializing(true);
    try {
      const ws = new WebSocket(VOICE_SERVICE_URL);

      ws.onopen = () => {
        console.log('Connected to voice service');
        setIsConnected(true);
        setIsInitializing(false);

        // Send initial Arabic greeting from Hana
        addMessage('هانا', 'مرحبا , انا هناء. كيف يمكنني مساعدتك في استشارتك الصحية اليوم؟', 'hana');
        playGreeting();
      };

      ws.onmessage = async (event) => {
        console.log('Received message from voice service');

        if (event.data instanceof Blob) {
          // Handle audio response
          console.log('Received audio response');
          setRecordingState('playing');
          await playAudioBlob(event.data);
          setRecordingState('idle');
        } else if (typeof event.data === 'string') {
          // Handle text messages (fallback)
          console.log('Received text response:', event.data);
          addMessage('هانا', event.data, 'hana');
        }
      };

      ws.onclose = (event) => {
        console.log('Voice service connection closed:', event.code, event.reason);
        setIsConnected(false);
        setRecordingState('idle');
      };

      ws.onerror = (error) => {
        console.error('Voice service error:', error);
        setIsConnected(false);
        setRecordingState('idle');
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect to voice service:', error);
      setIsInitializing(false);
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

  const playGreeting = async () => {
    try {
      // Generate greeting audio using Web Speech API as fallback
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('مرحبا , انا هناء. كيف يمكنني مساعدتك في استشارتك الصحية اليوم؟');
        utterance.lang = 'ar-SA'; // Arabic Saudi

        // Try to find an Arabic voice
        const voices = speechSynthesis.getVoices();
        const arabicVoice = voices.find(voice => voice.lang.startsWith('ar'));
        if (arabicVoice) {
          utterance.voice = arabicVoice;
        }

        utterance.onend = () => {
          console.log('Greeting finished');
        };

        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Error playing greeting:', error);
    }
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

  const startRecording = async () => {
    try {
      setRecordingState('recording');
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

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioToVoiceService(audioBlob);

        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;

      console.log('Started recording');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setRecordingState('idle');
      alert('Microphone access required for voice chat. Please allow access and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      setRecordingState('processing');
      mediaRecorderRef.current.stop();
      console.log('Stopped recording, processing...');
    }
  };

  const sendAudioToVoiceService = async (audioBlob: Blob) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('Voice service not connected');
      setRecordingState('idle');
      return;
    }

    try {
      console.log('Sending audio to voice service...');
      wsRef.current.send(audioBlob);
      addMessage('أنت', '🗣️ رسالة صوتية', 'user');
    } catch (error) {
      console.error('Failed to send audio:', error);
      setRecordingState('idle');
    }
  };

  const toggleRecording = () => {
    if (recordingState === 'recording') {
      stopRecording();
    } else {
      startRecording();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            اختبار خدمة الصوت - Hana Voice Service Tester
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            اختبر المحادثة الصوتية باللغة العربية مع خدمة هناء الصحية
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                isInitializing ? 'bg-yellow-500' :
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="font-medium">
                {isInitializing ? 'جاري الاتصال...' :
                 isConnected ? 'متصل بخدمة الصوت' : 'غير متصل'}
              </span>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={reconnect}
                variant="outline"
                size="sm"
                disabled={isInitializing}
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
              <div className={`inline-block w-24 h-24 rounded-full transition-all duration-300 ${
                recordingState === 'recording' ? 'bg-red-500 animate-pulse' :
                recordingState === 'processing' ? 'bg-yellow-500 animate-spin' :
                recordingState === 'playing' ? 'bg-green-500 animate-bounce' :
                'bg-gray-300 dark:bg-gray-600'
              } flex items-center justify-center cursor-pointer`}
              onClick={isConnected ? toggleRecording : undefined}
              >
                {recordingState === 'recording' ? (
                  <div className="w-8 h-8 bg-white rounded-sm"></div>
                ) : recordingState === 'processing' ? (
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : recordingState === 'playing' ? (
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.5 5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-9zM12.5 5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-9z"/>
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.366 3.5a.5.5 0 0 1 .5 0L11 6.765V3.5a.5.5 0 0 1 .5-.5h1A.5.5 0 0 1 13 3.5v13a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V9.236l-4.134 3.265a.5.5 0 0 1-.732-.382V3.882a.5.5 0 0 1 .5-.382z"/>
                  </svg>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">
                {recordingState === 'idle' && 'اضغط للبدء في التسجيل'}
                {recordingState === 'recording' && 'جاري التسجيل... اضغط للإيقاف'}
                {recordingState === 'processing' && 'جاري المعالجة...'}
                {recordingState === 'playing' && 'جاري تشغيل الرد...'}
              </h2>
            </div>

            <div className="space-x-2">
              <Button
                onClick={toggleRecording}
                disabled={!isConnected || isInitializing}
                className={`px-8 py-3 text-lg ${
                  recordingState === 'recording'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {recordingState === 'recording' ? 'إيقاف التسجيل' : 'بدء التسجيل'}
              </Button>

              {!isConnected && !isInitializing && (
                <p className="text-red-500 mt-2">
                  تأكد من تشغيل خدمة الصوت في localhost:8000
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">المحادثة</h3>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>ابدأ التسجيل لبدء المحادثة مع هناء</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-green-100 dark:bg-green-800 dark:text-green-100'
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {message.type === 'user' ? 'أنت:' : 'هانا:'}
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

        {/* Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">تعليمات الاستخدام</h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">للاختبار السليم:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>تأكد من الإتصال بخدمة الصوت</li>
                <li>اسمح بوصول الميكروفون عند الطلب</li>
                <li>تحدث بوضوح باللغة العربية</li>
                <li>استخدم متصفح Chrome أو Firefox</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">نصائح للاختبار:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>ابدأ بـ"مرحبا" لاختبار التحية</li>
                <li>جرب أسئلة صحية مثل "أشعر بصداع"</li>
                <li>تحقق من جودة الصوت والنطق</li>
                <li>اختبر مختلف أنواع الأسئلة</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
