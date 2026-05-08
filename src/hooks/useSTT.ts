import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

export function useSTT() {
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ko-KR';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result && result[0]) {
            currentTranscript += result[0].transcript;
          }
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') return; // Ignore no-speech errors to avoid stopping
        console.error('Speech recognition error:', event.error);
        setStatus(`Error: ${event.error}`);
        if (event.error !== 'aborted') {
          setIsRecording(false);
          isRecordingRef.current = false;
        }
      };

      recognition.onend = () => {
        // Auto-restart if it ended but we're still in recording mode
        if (isRecordingRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error('Failed to restart recognition:', e);
          }
        } else {
          setIsRecording(false);
        }
      };

      recognitionRef.current = recognition;
    } else {
      setStatus('Speech Recognition not supported');
    }

    return () => {
      isRecordingRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      isRecordingRef.current = false;
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      isRecordingRef.current = true;
      recognitionRef.current.start();
      setIsRecording(true);
      setStatus('Listening...');
    }
  }, [isRecording]);

  return { isRecording, transcript, status, toggleRecording, setTranscript };
}
