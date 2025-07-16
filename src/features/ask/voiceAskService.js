const { BrowserWindow } = require('electron');
const SttService = require('../listen/stt/sttService');
const askService = require('./askService');
const internalBridge = require('../../bridge/internalBridge');

class VoiceAskService {
    constructor() {
        this.sttService = new SttService();
        this.isCapturing = false;
        this.transcribedText = '';
        this.setupCallbacks();
    }

    setupCallbacks() {
        this.sttService.setCallbacks({
            onTranscriptionComplete: (speaker, text) => {
                if (speaker === 'Me') {
                    this.transcribedText += (this.transcribedText ? ' ' : '') + text;
                }
            },
            onStatusUpdate: (status) => {
                this.sendToRenderer('voice-ask-status', status);
            }
        });
    }

    sendToRenderer(channel, data) {
        const { windowPool } = require('../../window/windowManager');
        const askWindow = windowPool?.get('ask');
        if (askWindow && !askWindow.isDestroyed()) {
            askWindow.webContents.send(channel, data);
        }
    }

    initialize() {
        this.setupIpcHandlers();
    }

    setupIpcHandlers() {
        const { ipcMain } = require('electron');
        ipcMain.handle('voice-ask:start', async () => {
            if (!this.isCapturing) {
                this.isCapturing = true;
                this.transcribedText = '';
                await this.sttService.initializeSttSessions('en');
                this.sttService.sendToRenderer('stt-update', { speaker: 'Me', text: '', isPartial: true, isFinal: false });
            }
            return { capturing: this.isCapturing };
        });
        ipcMain.handle('voice-ask:stop', async () => {
            if (this.isCapturing) {
                this.isCapturing = false;
                // Flush any remaining transcription
                this.sttService.flushMyCompletion && this.sttService.flushMyCompletion();
                // Route the transcribed text to askService
                if (this.transcribedText.trim()) {
                    const askService = require('./askService');
                    await askService.sendMessage(this.transcribedText.trim(), []);
                }
                this.transcribedText = '';
            }
            return { capturing: this.isCapturing };
        });
    }
}

module.exports = new VoiceAskService();