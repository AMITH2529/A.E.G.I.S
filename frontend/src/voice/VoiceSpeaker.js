import { sceneState } from '../scene/SceneState';

export class VoiceSpeaker {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voice = null;
    this.isReady = false;

    // Load voices
    this._loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = this._loadVoices.bind(this);
    }
  }

  _loadVoices() {
    const voices = this.synth.getVoices();
    if (voices.length > 0) {
      // Try to find a good robotic/British/neutral voice for AEGIS
      this.voice = 
        voices.find(v => v.name.includes('Google UK English Male')) ||
        voices.find(v => v.name.includes('Daniel')) ||
        voices.find(v => v.lang === 'en-GB' || v.lang === 'en-US') ||
        voices[0];
      this.isReady = true;
    }
  }

  speak(text) {
    if (!this.synth || !this.isReady) return;
    
    // Log to UI
    sceneState.addLog('aegis', text);
    
    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) {
      utterance.voice = this.voice;
    }
    
    // AEGIS Voice tuning
    utterance.pitch = 0.9;
    utterance.rate = 1.0;
    utterance.volume = 1.0;

    this.synth.speak(utterance);
  }
}

export const aegisVoice = new VoiceSpeaker();
