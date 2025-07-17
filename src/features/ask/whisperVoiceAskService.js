// whisperVoiceAskService.js
// Handles audio recording and Whisper transcription for AskView

class WhisperVoiceAskService {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.onTranscription = null;
    }

    async startRecording() {
        if (this.isRecording) return;
        this.isRecording = true;
        this.audioChunks = [];
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) this.audioChunks.push(e.data);
        };
        this.mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            const transcription = await this.transcribeAudio(audioBlob);
            console.log('Whisper transcription result:', transcription);
            if (this.onTranscription) {
                try {
                    console.log('Calling onTranscription callback');
                    this.onTranscription(transcription);
                    console.log('onTranscription callback finished');
                } catch (err) {
                    console.error('Error in onTranscription callback:', err);
                }
            }
        };
        this.mediaRecorder.start();
        console.log("recording start");
    }

    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;
        this.isRecording = false;
        this.mediaRecorder.stop();
        console.log("recording end");
    }

    async transcribeAudio(audioBlob) {
        // Send audioBlob to the main process for Whisper transcription (IPC)
        if (!window.api?.askView?.transcribeWithWhisper) {
            console.error('IPC method for Whisper transcription not available');
            return '';
        }
        try {
            const transcription = await window.api.askView.transcribeWithWhisper(audioBlob);
            return transcription || '';
        } catch (error) {
            console.error('IPC Whisper transcription failed:', error);
            return '';
        }
    }

    setTranscriptionCallback(cb) {
        this.onTranscription = cb;
    }
}

export default new WhisperVoiceAskService();