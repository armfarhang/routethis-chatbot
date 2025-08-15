export interface VoiceConfig {
  text: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
}

export interface VoiceCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: SpeechSynthesisErrorEvent) => void;
}

export class VoiceService {
  private static instance: VoiceService;
  private voices: SpeechSynthesisVoice[] = [];
  private isInitialized = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private activityCallbacks: ((isActive: boolean, amplitude?: number) => void)[] = [];

  private constructor() {
    this.initializeVoices();
  }

  public static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  private initializeVoices(): void {
    if ('speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
      if (this.voices.length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', () => {
          this.voices = window.speechSynthesis.getVoices();
          this.isInitialized = true;
          console.log('Voices loaded:', this.voices.length);
        });
      } else {
        this.isInitialized = true;
      }
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  public cancel(): void {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
      this.notifyActivityCallbacks(false);
    }
  }

  public onActivityChange(callback: (isActive: boolean, amplitude?: number) => void): () => void {
    this.activityCallbacks.push(callback);
    return () => {
      this.activityCallbacks = this.activityCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyActivityCallbacks(isActive: boolean, amplitude?: number): void {
    this.activityCallbacks.forEach(callback => callback(isActive, amplitude));
  }

  public speak(config: VoiceConfig, callbacks?: VoiceCallbacks): void {
    if (!this.isSupported()) {
      console.error('Speech synthesis not supported in this browser');
      return;
    }

    this.cancel();

    const utterance = new SpeechSynthesisUtterance(config.text);
    utterance.rate = config.rate ?? 1;
    utterance.pitch = config.pitch ?? 1;
    utterance.volume = config.volume ?? 1;
    
    if (config.voice) {
      utterance.voice = config.voice;
    } else if (this.voices.length > 0) {
      utterance.voice = this.voices[0];
    }

    this.currentUtterance = utterance;

    // Enhanced callbacks with activity tracking
    utterance.onstart = () => {
      this.notifyActivityCallbacks(true, 0.7); // High initial amplitude
      this.startAmplitudeAnimation();
      callbacks?.onStart?.();
    };
    
    utterance.onend = () => {
      this.currentUtterance = null;
      this.notifyActivityCallbacks(false);
      callbacks?.onEnd?.();
    };
    
    utterance.onerror = (error) => {
      this.currentUtterance = null;
      this.notifyActivityCallbacks(false);
      callbacks?.onError?.(error);
    };

    window.speechSynthesis.speak(utterance);
  }

  private startAmplitudeAnimation(): void {
    if (!this.currentUtterance) return;

    // Simulate realistic voice amplitude variations
    const animateAmplitude = () => {
      if (!this.currentUtterance || !window.speechSynthesis.speaking) return;

      // Generate semi-realistic amplitude based on time and randomness
      const baseAmplitude = 0.4 + Math.random() * 0.4;
      const timeVariation = Math.sin(Date.now() * 0.005) * 0.2;
      const amplitude = Math.max(0.2, Math.min(1, baseAmplitude + timeVariation));

      this.notifyActivityCallbacks(true, amplitude);
      
      // Continue animation
      setTimeout(animateAmplitude, 100);
    };

    animateAmplitude();
  }

  public speakWithDelay(config: VoiceConfig, delay: number, callbacks?: VoiceCallbacks): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.speak(config, {
          ...callbacks,
          onEnd: () => {
            callbacks?.onEnd?.();
            resolve();
          }
        });
      }, delay);
    });
  }

  public getStatus(): { speaking: boolean; pending: boolean } {
    if (!this.isSupported()) {
      return { speaking: false, pending: false };
    }
    
    return {
      speaking: window.speechSynthesis.speaking,
      pending: window.speechSynthesis.pending
    };
  }
}

// Convenience functions for common use cases
export const voiceService = VoiceService.getInstance();

export const speakWelcome = (canSpeak: boolean): void => {
  if (canSpeak) {
    voiceService.speak(
      {
        text: "Hello, I'm RouteThis, how can I assist you today?",
        rate: 1.2,
        pitch: 1,
        volume: 1
      },
      {
        onStart: () => console.log('Welcome speech started'),
        onEnd: () => console.log('Welcome speech ended'),
        onError: (error) => console.error('Welcome speech error:', error)
      }
    );
  }
 
};

export const speakText = (text: string, rate: number = 1): void => {
  voiceService.speak(
    {
      text,
      rate,
      pitch: 1,
      volume: 1
    },
    {
      onStart: () => console.log('Speech started'),
      onEnd: () => console.log('Speech ended'),
      onError: (error) => console.error('Speech error:', error)
    }
  );
};

export const testSpeech = (): void => {
  voiceService.speak(
    {
      text: "Testing. Can you hear this message?",
      rate: 0.9,
      pitch: 1,
      volume: 1
    },
    {
      onStart: () => console.log('Speech started - audio should play now'),
      onEnd: () => console.log('Speech ended'),
      onError: (error) => console.error('Speech error:', error.error)
    }
  );
};