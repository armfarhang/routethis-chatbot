import { useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const isSupported = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);

  const initializeSpeechRecognition = useCallback(() => {
    if (!isSupported) {
      console.error('Speech recognition not supported');
      return null;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const result = event.results[0][0];
      setTranscript(result.transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return recognition;
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = initializeSpeechRecognition();
    }

    if (!recognitionRef.current) {
      console.error('Speech recognition is not supported in this browser');
      return;
    }

    if (!isListening) {
      recognitionRef.current.start();
    }
  }, [initializeSpeechRecognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  };
};

export class SpeechRecognitionService {
  private recognition: any = null;
  private isSupported: boolean;
  private listeners: {
    onStart?: () => void;
    onResult?: (transcript: string) => void;
    onError?: (error: string) => void;
    onEnd?: () => void;
  } = {};

  constructor() {
    this.isSupported = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
  }

  initialize() {
    if (!this.isSupported) {
      throw new Error('Speech recognition not supported');
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.listeners.onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.listeners.onResult?.(transcript);
    };

    this.recognition.onerror = (event: any) => {
      this.listeners.onError?.(event.error);
    };

    this.recognition.onend = () => {
      this.listeners.onEnd?.();
    };
  }

  setListeners(listeners: {
    onStart?: () => void;
    onResult?: (transcript: string) => void;
    onError?: (error: string) => void;
    onEnd?: () => void;
  }) {
    this.listeners = listeners;
  }

  start() {
    if (!this.recognition) {
      this.initialize();
    }
    this.recognition?.start();
  }

  stop() {
    this.recognition?.stop();
  }

  getIsSupported() {
    return this.isSupported;
  }
}

export const speechRecognitionService = new SpeechRecognitionService();