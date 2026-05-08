import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SplitView } from '@/components/SplitView';
import { OutputPane } from '@/components/OutputPane';
import { STTPane } from '@/components/STTPane';
import styles from './MainView.module.css';

// Add type definition for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function STTView() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [leftRatio, setLeftRatio] = useState(0.6);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ko-KR';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setStatus(`Error: ${event.error}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      setStatus('Speech Recognition not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setStatus('Recording stopped');
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setIsRecording(true);
      setStatus('Listening...');
    }
  };

  const footer = (
    <div className={styles.footerRow}>
      <Link to="/" className={styles.recordLink}>
        ← SIGN LANGUAGE MODE
      </Link>
      <span>STT_V2.4_ONLINE</span>
    </div>
  );

  return (
    <SplitView
      leftRatio={leftRatio}
      onRatioChange={setLeftRatio}
      left={
        <STTPane
          isRecording={isRecording}
          onToggleRecording={toggleRecording}
          statusLabel={status}
        />
      }
      right={
        <OutputPane
          text={transcript}
          footer={footer}
        />
      }
    />
  );
}
