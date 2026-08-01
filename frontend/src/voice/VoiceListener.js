import { useEffect, useRef } from 'react';
import { audioManager } from '../audio/AudioManager';

// Web Speech API (Speed Tier) for instant command recognition
export function useVoiceListener(onCommand) {
  const recognitionRef = useRef(null);
  const activeRef = useRef(false);
  const activeSessionTimeoutRef = useRef(null);

  useEffect(() => {
    // Check if SpeechRecognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Web Speech API is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const rawTranscript = event.results[last][0].transcript.trim().toLowerCase();
      console.log("Heard:", rawTranscript);
      
      // Wake word detection
      const wakeWords = ["hey aegis", "hey ages", "hey edges", "aegis", "ages", "edges"];
      let detectedWakeWord = null;
      
      for (const ww of wakeWords) {
        if (rawTranscript.includes(ww)) {
          detectedWakeWord = ww;
          break;
        }
      }

      if (detectedWakeWord) {
        // We heard the wake word! Stay awake for 8 seconds
        if (activeSessionTimeoutRef.current) clearTimeout(activeSessionTimeoutRef.current);
        activeSessionTimeoutRef.current = setTimeout(() => {
          activeSessionTimeoutRef.current = null;
          console.log("AEGIS went back to sleep.");
        }, 8000);

        const splitIndex = rawTranscript.indexOf(detectedWakeWord) + detectedWakeWord.length;
        const command = rawTranscript.substring(splitIndex).trim();
        
        if (command && onCommand) {
          console.log("Wake word detected with command:", command);
          onCommand(command);
        } else {
          console.log("Wake word detected, waiting for command...");
          audioManager.playSummon(); // subtle beep
        }
      } else if (activeSessionTimeoutRef.current && onCommand) {
        // We are already awake, so we accept this as a command
        if (activeSessionTimeoutRef.current) clearTimeout(activeSessionTimeoutRef.current);
        activeSessionTimeoutRef.current = setTimeout(() => {
          activeSessionTimeoutRef.current = null;
        }, 8000);
        
        console.log("Awake session active. Command:", rawTranscript);
        onCommand(rawTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      
      // Stop attempting to restart if the user denied permission or if the system forcefully aborted it (prevents infinite loop that locks up webcam)
      if (event.error === 'not-allowed' || event.error === 'aborted') {
        console.warn("Speech Recognition halted due to permissions or explicit abort.");
        activeRef.current = false;
        return;
      }

      // Restart on error if we are supposed to be active
      if (activeRef.current) {
        setTimeout(() => {
          try { recognition.start(); } catch(e) {}
        }, 1000);
      }
    };

    recognition.onend = () => {
      // Auto-restart to keep listening
      if (activeRef.current) {
        try { recognition.start(); } catch(e) {}
      }
    };

    recognitionRef.current = recognition;

    // Start immediately
    activeRef.current = true;
    recognition.start();

    return () => {
      activeRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onCommand]);
}
