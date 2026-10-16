import { GoogleGenAI } from '@google/genai';
import type { Memory, Reminder, ProposedAction } from '../types';

export type VoiceStatus = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'interrupted' | 'error';

export interface VoiceMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  action?: ProposedAction | null;
}

export interface VoiceAssistantCallbacks {
  onStatusChange: (status: VoiceStatus) => void;
  onAudioLevel: (level: number) => void;
  onTranscript: (message: VoiceMessage) => void;
  onError: (errorMessage: string) => void;
}

export class VoiceAssistantService {
  private status: VoiceStatus = 'idle';
  private callbacks: VoiceAssistantCallbacks;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private recognition: any = null;
  private isListening = false;
  private liveSession: any = null;
  private speechSynth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(callbacks: VoiceAssistantCallbacks) {
    this.callbacks = callbacks;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.speechSynth = window.speechSynthesis;
    }
  }

  public getStatus(): VoiceStatus {
    return this.status;
  }

  private setStatus(status: VoiceStatus) {
    this.status = status;
    this.callbacks.onStatusChange(status);
  }

  /**
   * Initializes audio context and analyser node for real-time visualizer reactivity.
   */
  public async initializeAudio(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone audio is not supported in this browser.');
      }

      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.micStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      this.startAudioLevelLoop();
      return true;
    } catch (err: any) {
      this.callbacks.onError(err?.message || 'Failed to access microphone.');
      this.setStatus('error');
      return false;
    }
  }

  private startAudioLevelLoop() {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkLevel = () => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const normalized = Math.min(1, average / 128); // 0.0 to 1.0

      // Natural Interruption detection:
      // If assistant is speaking and user starts talking noticeably, interrupt playback
      if (this.status === 'speaking' && normalized > 0.35) {
        this.interruptSpeech();
      }

      this.callbacks.onAudioLevel(normalized);
      this.animFrameId = requestAnimationFrame(checkLevel);
    };

    checkLevel();
  }

  /**
   * Starts conversational session.
   * Attempts Live API connection; falls back gracefully to grounded audio pipeline.
   */
  public async startSession(
    memories: Memory[],
    reminders: Reminder[]
  ): Promise<void> {
    const initialized = await this.initializeAudio();
    if (!initialized) return;

    this.setStatus('connecting');

    try {
      // 1. Request session token from server
      const tokenRes = await fetch('/api/voice/session-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await tokenRes.json();

      if (data.token && !data.fallbackRequired) {
        // Live API session attempt
        try {
          const ai = new GoogleGenAI({ apiKey: data.token });
          this.liveSession = await (ai as any).live?.connect({
            model: data.model || 'gemini-3.8-live',
            config: {
              responseModalities: ['AUDIO'],
              systemInstruction: {
                parts: [{
                  text: `You are Smriti AI voice assistant. Speak concisely and ground your answers in the user's memories (${memories.length} memories, ${reminders.length} reminders).`
                }]
              }
            },
            callbacks: {
              onopen: () => {
                this.setStatus('listening');
              },
              onmessage: (msg: any) => {
                if (msg.serverContent?.modelTurn) {
                  this.setStatus('speaking');
                }
              },
              onclose: () => {
                this.setStatus('idle');
              },
              onerror: () => {
                this.fallbackToVoicePipeline(memories, reminders);
              }
            }
          });
          return;
        } catch {
          // If live connect errors, proceed to robust fallback pipeline
          this.fallbackToVoicePipeline(memories, reminders);
        }
      } else {
        // Fallback pipeline
        this.fallbackToVoicePipeline(memories, reminders);
      }
    } catch {
      this.fallbackToVoicePipeline(memories, reminders);
    }
  }

  /**
   * Conversational Voice Pipeline Fallback:
   * Listens to speech, submits grounded query to /api/voice/query, and speaks the reply.
   */
  public fallbackToVoicePipeline(memories: Memory[], reminders: Reminder[]) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.setStatus('idle');
      this.callbacks.onError('Live speech recognition is not supported in this browser. You can still type queries in Ask Smriti AI.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.setStatus('listening');
      };

      this.recognition.onresult = async (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (!transcript || !transcript.trim()) return;

        this.callbacks.onTranscript({
          id: `msg-${Date.now()}-u`,
          sender: 'user',
          text: transcript.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        this.setStatus('thinking');
        await this.processGroundedQuery(transcript.trim(), memories, reminders);
      };

      this.recognition.onerror = (err: any) => {
        this.isListening = false;
        if (err.error !== 'no-speech') {
          this.callbacks.onError(`Speech error: ${err.error}`);
        }
        this.setStatus('idle');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.status === 'listening') {
          this.setStatus('idle');
        }
      };

      this.recognition.start();
    } catch (e: any) {
      this.setStatus('idle');
      this.callbacks.onError(e?.message || 'Could not start speech listener.');
    }
  }

  /**
   * Sends the user voice query to /api/voice/query and handles the response.
   */
  public async processGroundedQuery(
    queryText: string,
    memories: Memory[],
    reminders: Reminder[]
  ): Promise<void> {
    try {
      const res = await fetch('/api/voice/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          memories,
          reminders,
          currentDateTime: new Date().toISOString()
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Voice request failed (${res.status})`);
      }

      const data = await res.json();
      const speechText = data.speechText || data.displayText || 'I understood.';
      const displayText = data.displayText || data.speechText;

      this.callbacks.onTranscript({
        id: `msg-${Date.now()}-a`,
        sender: 'assistant',
        text: displayText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: data.action || null
      });

      this.speakText(speechText);
    } catch (err: any) {
      this.setStatus('idle');
      this.callbacks.onError(err?.message || 'Could not process voice query.');
    }
  }

  /**
   * Speaks the response with browser speech synthesis and updates state.
   */
  public speakText(text: string) {
    if (!this.speechSynth) {
      this.setStatus('idle');
      return;
    }

    this.speechSynth.cancel();
    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.rate = 1.0;
    this.currentUtterance.pitch = 1.0;

    this.currentUtterance.onstart = () => {
      this.setStatus('speaking');
    };

    this.currentUtterance.onend = () => {
      this.setStatus('idle');
      this.currentUtterance = null;
    };

    this.currentUtterance.onerror = () => {
      this.setStatus('idle');
      this.currentUtterance = null;
    };

    this.speechSynth.speak(this.currentUtterance);
  }

  /**
   * Natural interruption: halts assistant speech immediately.
   */
  public interruptSpeech() {
    if (this.speechSynth) {
      this.speechSynth.cancel();
    }
    this.currentUtterance = null;
    this.setStatus('interrupted');
    setTimeout(() => {
      if (this.status === 'interrupted') {
        this.setStatus('listening');
        // Restart speech recognition to capture user's new question
        if (this.recognition && !this.isListening) {
          try {
            this.recognition.start();
          } catch {
            // Already started or busy
          }
        }
      }
    }, 400);
  }

  /**
   * Halts active session and cleans up resources.
   */
  public endSession() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.speechSynth) {
      this.speechSynth.cancel();
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
      this.recognition = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    if (this.liveSession) {
      try {
        this.liveSession.close();
      } catch {
        // Ignore
      }
      this.liveSession = null;
    }

    this.isListening = false;
    this.setStatus('idle');
  }
}
