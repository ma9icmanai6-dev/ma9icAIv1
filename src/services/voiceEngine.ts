import { VoiceSettings } from "../types";
import { LipSyncEngine } from "./lipSyncEngine";

export interface VoiceEngineCallbacks {
  onTranscript: (text: string, isFinal: boolean, confidence: number) => void;
  onWakeWordDetected: (phrase: string) => void;
  onAudioLevel: (level: number) => void; // 0 to 1
  onSpeakingStateChange: (isSpeaking: boolean) => void;
  onError: (error: string) => void;
}

export class VoiceEngine {
  private static instance: VoiceEngine | null = null;
  private static transcriptListeners: Array<(t: string) => void> = [];
  private static wakeWordListeners: Array<(w: string) => void> = [];
  private static audioLevelListeners: Array<(lvl: number) => void> = [];

  public static getInstance(): VoiceEngine {
    if (!this.instance) {
      this.instance = new VoiceEngine(
        {
          pitch: 1.05,
          rate: 1.0,
          volume: 1.0,
          voiceName: "default",
          wakeWordSensitivity: 0.8,
          continuousListening: true,
          localWakeWordEnabled: true,
        },
        {
          onTranscript: (t, isFinal) => {
            if (isFinal) {
              this.transcriptListeners.forEach((l) => l(t));
            }
          },
          onWakeWordDetected: (w) => this.wakeWordListeners.forEach((l) => l(w)),
          onAudioLevel: (lvl) => this.audioLevelListeners.forEach((l) => l(lvl)),
          onSpeakingStateChange: () => {},
          onError: (e) => console.warn(e),
        }
      );
    }
    return this.instance;
  }

  public static speak(text: string, onDone?: () => void): Promise<void> {
    return this.getInstance().speak(text, onDone);
  }

  public static stopSpeaking(): void {
    this.getInstance().stopSpeaking();
  }

  public static startListening(): Promise<void> {
    return this.getInstance().startListening();
  }

  public static stopListening(): void {
    this.getInstance().stopListening();
  }

  public static getSettings(): VoiceSettings {
    return this.getInstance().getSettings();
  }

  public static getVoices(): SpeechSynthesisVoice[] {
    return this.getInstance().getVoices();
  }

  public static setVoice(voiceName: string): void {
    this.getInstance().setVoice(voiceName);
  }

  public static updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.getInstance().updateSettings(newSettings);
  }

  public static onSpeechRecognized(cb: (transcript: string) => void) {
    this.transcriptListeners.push(cb);
    return () => {
      this.transcriptListeners = this.transcriptListeners.filter((l) => l !== cb);
    };
  }

  public static onWakeWordDetected(cb: (phrase: string) => void) {
    this.wakeWordListeners.push(cb);
    return () => {
      this.wakeWordListeners = this.wakeWordListeners.filter((l) => l !== cb);
    };
  }

  public static onAudioLevel(cb: (level: number) => void) {
    this.audioLevelListeners.push(cb);
    return () => {
      this.audioLevelListeners = this.audioLevelListeners.filter((l) => l !== cb);
    };
  }

  private recognition: any = null;
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private settings: VoiceSettings;
  private callbacks: VoiceEngineCallbacks;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;

  constructor(settings: VoiceSettings, callbacks: VoiceEngineCallbacks) {
    this.settings = settings;
    this.callbacks = callbacks;
    this.initSynth();
    this.initSpeechRecognition();
  }

  private initSynth() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
      const loadVoices = () => {
        this.availableVoices = this.synth?.getVoices() || [];
        // Look for British Female voice first
        const britishFemale = this.availableVoices.find(
          (v) =>
            v.lang.toLowerCase().startsWith("en-gb") &&
            (v.name.toLowerCase().includes("female") ||
              v.name.toLowerCase().includes("hazel") ||
              v.name.toLowerCase().includes("victoria") ||
              v.name.toLowerCase().includes("sonia") ||
              v.name.toLowerCase().includes("george") === false)
        ) || this.availableVoices.find((v) => v.lang.toLowerCase().startsWith("en-gb"))
          || this.availableVoices.find((v) => v.lang.toLowerCase().startsWith("en"))
          || this.availableVoices[0];

        this.selectedVoice = britishFemale || null;
      };

      loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = loadVoices;
      }
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices;
  }

  public setVoice(voiceName: string) {
    const found = this.availableVoices.find((v) => v.name === voiceName);
    if (found) {
      this.selectedVoice = found;
      this.settings.voiceName = found.name;
    }
  }

  public updateSettings(newSettings: Partial<VoiceSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (newSettings.voiceName) {
      this.setVoice(newSettings.voiceName);
    }
  }

  public getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  private initSpeechRecognition() {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Web SpeechRecognition is not natively supported in this browser.");
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-GB";
      this.recognition.maxAlternatives = 3;

      this.recognition.onresult = (event: any) => {
        // Discard microphone audio picked up while the assistant is speaking
        if (this.isSpeaking) return;

        let interimTranscript = "";
        let finalTranscript = "";
        let confidence = 0.9;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          if (result.isFinal) {
            finalTranscript += transcript;
            confidence = result[0].confidence || 0.95;
          } else {
            interimTranscript += transcript;
          }
        }

        const activeText = (finalTranscript || interimTranscript).trim();
        if (!activeText) return;

        // Check if phrase is solely the wake word (e.g. "Magic", "Hey Magic", "Magic!")
        const isPureWakeWord = /^\s*(hey\s+|hi\s+|ok\s+|okay\s+)?magic[!?.,]*\s*$/i.test(activeText);
        if (isPureWakeWord) {
          if (finalTranscript || activeText.length >= 5) {
            this.callbacks.onWakeWordDetected(activeText);
          }
          return;
        }

        // If phrase starts with wake word followed by a command: "Magic what is on my screen"
        const wakeWordPrefixRegex = /^\s*(hey\s+|hi\s+|ok\s+|okay\s+)?magic[,:\s]+(.+)$/i;
        const match = activeText.match(wakeWordPrefixRegex);
        if (match) {
          const commandText = match[2].trim();
          if (finalTranscript) {
            this.callbacks.onTranscript(commandText, true, confidence);
          } else if (interimTranscript) {
            this.callbacks.onTranscript(commandText, false, 0.7);
          }
          return;
        }

        if (finalTranscript) {
          this.callbacks.onTranscript(finalTranscript.trim(), true, confidence);
        } else if (interimTranscript) {
          this.callbacks.onTranscript(interimTranscript.trim(), false, 0.7);
        }
      };

      this.recognition.onerror = (event: any) => {
        // Ignore "no-speech" or "aborted" in continuous background mode
        if (event.error !== "no-speech" && event.error !== "aborted") {
          console.warn("Speech recognition error:", event.error);
          this.callbacks.onError(`Speech error: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening && this.settings.continuousListening) {
          try {
            this.recognition.start();
          } catch {
            // Restart silently
          }
        }
      };
    } catch (err: any) {
      console.error("Failed to initialize speech recognition:", err);
    }
  }

  public async startMicrophoneCapture() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.microphoneStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();
        const source = this.audioContext.createMediaStreamSource(
          this.microphoneStream
        );
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;
        source.connect(this.analyser);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const updateAudioLevel = () => {
          if (!this.analyser) return;
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const normalized = Math.min(1, average / 128);
          this.callbacks.onAudioLevel(normalized);
          this.animFrameId = requestAnimationFrame(updateAudioLevel);
        };
        updateAudioLevel();
      }
    } catch (err: any) {
      console.warn("Microphone audio level capture warning:", err);
    }
  }

  public async startListening() {
    this.isListening = true;
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        // Already started
      }
    }
    await this.startMicrophoneCapture();
  }

  public stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignored
      }
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach((track) => track.stop());
      this.microphoneStream = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.callbacks.onAudioLevel(0);
  }

  public speak(text: string, onDone?: () => void): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        console.warn("Speech synthesis not supported");
        onDone?.();
        resolve();
        return;
      }

      // Cancel any ongoing speech
      this.synth.cancel();

      // Clean markdown tags or symbols from spoken voice
      const cleanText = text
        .replace(/[*_~`#[\]()]/g, "")
        .replace(/https?:\/\/\S+/g, "a web link")
        .trim();

      if (!cleanText) {
        onDone?.();
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      this.currentUtterance = utterance;

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      utterance.rate = this.settings.rate || 1.0;
      utterance.pitch = this.settings.pitch || 1.05;
      utterance.volume = this.settings.volume ?? 1.0;

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.callbacks.onSpeakingStateChange(true);
        LipSyncEngine.getInstance().onSpeechStart(cleanText);
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.callbacks.onSpeakingStateChange(false);
        this.currentUtterance = null;
        LipSyncEngine.getInstance().onSpeechEnd();
        onDone?.();
        resolve();
      };

      utterance.onerror = (err) => {
        console.warn("Speech synthesis error:", err);
        this.isSpeaking = false;
        this.callbacks.onSpeakingStateChange(false);
        this.currentUtterance = null;
        LipSyncEngine.getInstance().onSpeechEnd();
        onDone?.();
        resolve();
      };

      this.synth.speak(utterance);
    });
  }

  public stopSpeaking() {
    this.isSpeaking = false;
    LipSyncEngine.getInstance().onSpeechEnd();
    if (this.synth) {
      this.synth.cancel();
      this.callbacks.onSpeakingStateChange(false);
      this.currentUtterance = null;
    }
  }
}
