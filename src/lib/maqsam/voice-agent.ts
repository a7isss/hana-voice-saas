import WebSocket from 'ws';

// Types based on Maqsam Integration Doc
interface MaqsamMessage {
    type: string;
    apiKey?: string;
    data?: any;
}

interface Question {
    id: number;
    text: string;
}

export class MaqsamVoiceAgent {
    private ws: WebSocket;
    private questions: Question[];
    private currentQuestionIndex: number = 0;
    private isWaitingForAnswer: boolean = false;
    private welcomeMessage: string;

    constructor(ws: WebSocket, welcomeMessage: string, questions: Question[]) {
        this.ws = ws;
        this.welcomeMessage = welcomeMessage;
        this.questions = questions;

        // Bind methods
        this.handleMessage = this.handleMessage.bind(this);
        this.startConversation = this.startConversation.bind(this);
        this.askNextQuestion = this.askNextQuestion.bind(this);
    }

    public handleMessage(message: string) {
        try {
            const data: MaqsamMessage = JSON.parse(message);

            switch (data.type) {
                case 'session.setup':
                    console.log('Session Setup received. Sending Ready...');
                    // Authenticate if needed (check apiKey)
                    this.ws.send(JSON.stringify({ type: 'session.ready' }));

                    // Start conversation after a brief delay to ensure connection is stable
                    setTimeout(this.startConversation, 1000);
                    break;

                case 'speech.started':
                    console.log('User started speaking...');
                    // If we were playing audio, we might want to stop (interrupt)
                    break;

                case 'audio.input':
                    // This is the raw audio from the user.
                    // In a real app, send this to STT (Speech-to-Text) service.
                    // For scaffold, we simulate "Silence Detection" or "End of Speech" logic.
                    if (this.isWaitingForAnswer) {
                        this.handleUserAnswer(data.data?.audio);
                    }
                    break;

                case 'call.hangup':
                    console.log('Call hung up by user.');
                    this.ws.close();
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    private async startConversation() {
        console.log('Starting Conversation...');
        await this.playAudio(this.welcomeMessage);
        await this.askNextQuestion();
    }

    private async askNextQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            console.log('All questions asked. Ending call.');
            await this.playAudio('Thank you for your time. Goodbye.');
            this.ws.send(JSON.stringify({ type: 'call.hangup' }));
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        console.log(`Asking Question ${question.id}: ${question.text}`);

        await this.playAudio(question.text);

        this.isWaitingForAnswer = true;
        // In a real system, we would wait for STT results here.
    }

    private async handleUserAnswer(audioData: string) {
        // Simulate processing answer (STT)
        // In reality, you'd buffer audio, detect silence, then send to STT API.

        // Simulating "Answer Received" after some audio chunks
        // For scaffolding, let's assume we detected an answer after receiving input
        console.log('Receiving answer...');

        // Reset flag to avoid multiple triggers
        this.isWaitingForAnswer = false;

        // Move to next question
        this.currentQuestionIndex++;
        setTimeout(this.askNextQuestion, 2000); // Wait a bit before next question
    }

    private async playAudio(text: string) {
        console.log(`Playing TTS: "${text}"`);
        // 1. Call TTS Service (e.g. Google/ElevenLabs) to get Audio Buffer
        // 2. Convert to base64 (ulaw 8000Hz)
        // 3. Send to Maqsam

        // Mock sending audio
        const mockAudioBase64 = "UklGRi..."; // Placeholder
        this.ws.send(JSON.stringify({
            type: 'response.stream',
            data: { audio: mockAudioBase64 }
        }));

        // Simulate duration of playback
        return new Promise(resolve => setTimeout(resolve, 2000));
    }
}
