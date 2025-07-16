// src/ui/ask/askBridge.js
if (!window.api) window.api = {};
if (!window.api.askView) window.api.askView = {};

window.api.askView.startVoiceCapture = async function() {
    return await window.electron.invoke('voice-ask:start');
};

window.api.askView.stopVoiceCapture = async function() {
    return await window.electron.invoke('voice-ask:stop');
};