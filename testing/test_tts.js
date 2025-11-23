// Simple TTS WebSocket test
const WebSocket = require('ws');

const testTTS = () => {
  console.log('Testing TTS WebSocket endpoint...');

  const ws = new WebSocket('ws://localhost:8000/ws/tts');

  ws.onopen = () => {
    console.log('✅ Connected to TTS WebSocket');
    console.log('Sending test text: "مرحباً، هذا اختبار للنطق"');
    ws.send('tts:مرحباً، هذا اختبار للنطق');
  };

  ws.onmessage = (event) => {
    if (event.data instanceof Buffer) {
      console.log(`✅ Received audio data: ${event.data.length} bytes`);
      console.log('TTS test successful!');
    } else {
      console.log('❌ Received text response:', event.data);
    }
    ws.close();
  };

  ws.onerror = (error) => {
    console.error('❌ WebSocket error:', error);
  };

  ws.onclose = (event) => {
    console.log('WebSocket closed:', event.code, event.reason);
  };
};

testTTS();
