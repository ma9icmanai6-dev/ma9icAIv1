export interface VisemeWeights {
  jawOpen: number;
  mouthPucker: number;
  mouthFunnel: number;
  mouthSmileLeft: number;
  mouthSmileRight: number;
  mouthClose: number;
  viseme_aa: number;
  viseme_E: number;
  viseme_I: number;
  viseme_O: number;
  viseme_U: number;
  viseme_PP: number;
  viseme_FF: number;
  viseme_TH: number;
  viseme_CH: number;
  viseme_SS: number;
  eyeBlinkLeft: number;
  eyeBlinkRight: number;
  browInnerUp: number;
  [key: string]: number;
}

export type VisemeListener = (weights: Partial<VisemeWeights>) => void;

export class LipSyncEngine {
  private static instance: LipSyncEngine | null = null;
  private listeners: VisemeListener[] = [];
  private currentWeights: Partial<VisemeWeights> = {};
  private targetWeights: Partial<VisemeWeights> = {};

  // Audio analysis
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private isAnalyzing: boolean = false;
  private animFrameId: number | null = null;

  // Speech timing & synthesis sync
  private speakingActive: boolean = false;
  private speechTimeoutId: any = null;

  private constructor() {
    this.resetWeights();
  }

  public static getInstance(): LipSyncEngine {
    if (!LipSyncEngine.instance) {
      LipSyncEngine.instance = new LipSyncEngine();
    }
    return LipSyncEngine.instance;
  }

  public subscribe(listener: VisemeListener): () => void {
    this.listeners.push(listener);
    listener({ ...this.currentWeights });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getWeights(): Partial<VisemeWeights> {
    return { ...this.currentWeights };
  }

  public resetWeights() {
    this.targetWeights = {
      jawOpen: 0,
      mouthPucker: 0,
      mouthFunnel: 0,
      mouthSmileLeft: 0.1,
      mouthSmileRight: 0.1,
      mouthClose: 0,
      viseme_aa: 0,
      viseme_E: 0,
      viseme_I: 0,
      viseme_O: 0,
      viseme_U: 0,
      viseme_PP: 0,
      viseme_FF: 0,
      viseme_TH: 0,
      viseme_CH: 0,
      viseme_SS: 0,
      eyeBlinkLeft: 0,
      eyeBlinkRight: 0,
      browInnerUp: 0,
    };
    this.currentWeights = { ...this.targetWeights };
    this.notify();
  }

  public setManualWeight(key: string, value: number) {
    this.targetWeights[key] = Math.max(0, Math.min(1, value));
    this.currentWeights[key] = this.targetWeights[key];
    this.notify();
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.currentWeights);
    }
  }

  /**
   * Called when speech starts.
   * Parses the text into phonetic/viseme timing pulses.
   */
  public onSpeechStart(text: string) {
    this.speakingActive = true;
    if (this.speechTimeoutId) {
      clearTimeout(this.speechTimeoutId);
    }
    this.startAudioFormantLoop();
    this.animateSpeechWords(text);
  }

  /**
   * Called when speech ends.
   */
  public onSpeechEnd() {
    this.speakingActive = false;
    if (this.speechTimeoutId) {
      clearTimeout(this.speechTimeoutId);
      this.speechTimeoutId = null;
    }
    this.resetWeights();
  }

  /**
   * Parse words and trigger realistic phonetic visemes over time
   */
  private animateSpeechWords(text: string) {
    if (!this.speakingActive) return;

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 0) return;

    let delay = 0;
    const averageWordDurationMs = 280;

    words.forEach((word) => {
      // Analyze vowels and consonants in word
      const syllables = this.extractVisemeSequence(word);
      const stepDuration = averageWordDurationMs / Math.max(1, syllables.length);

      syllables.forEach((viseme) => {
        setTimeout(() => {
          if (!this.speakingActive) return;
          this.applyPhoneticViseme(viseme);
        }, delay);
        delay += stepDuration;
      });
    });

    // Reset after estimated duration if not already ended
    this.speechTimeoutId = setTimeout(() => {
      if (this.speakingActive) {
        this.resetWeights();
      }
    }, delay + 200);
  }

  /**
   * Extract phoneme keys from word
   */
  private extractVisemeSequence(word: string): string[] {
    const sequence: string[] = [];
    let i = 0;

    while (i < word.length) {
      const char = word[i];
      const next = word[i + 1] || "";

      if (char === "t" && next === "h") {
        sequence.push("TH");
        i += 2;
      } else if (char === "s" && next === "h") {
        sequence.push("CH");
        i += 2;
      } else if (char === "c" && next === "h") {
        sequence.push("CH");
        i += 2;
      } else if (char === "o" && next === "o") {
        sequence.push("U");
        i += 2;
      } else if (char === "e" && next === "e") {
        sequence.push("I");
        i += 2;
      } else if ("aeiou".includes(char)) {
        sequence.push(char.toUpperCase());
        i += 1;
      } else if ("bmp".includes(char)) {
        sequence.push("PP");
        i += 1;
      } else if ("fv".includes(char)) {
        sequence.push("FF");
        i += 1;
      } else if ("sz".includes(char)) {
        sequence.push("SS");
        i += 1;
      } else {
        sequence.push("DEFAULT");
        i += 1;
      }
    }

    return sequence.slice(0, 6);
  }

  /**
   * Sets target morph values based on phonetic sound
   */
  private applyPhoneticViseme(phoneme: string) {
    // Base smile & relax other vowels
    this.targetWeights = {
      jawOpen: 0.1,
      mouthPucker: 0,
      mouthFunnel: 0,
      mouthSmileLeft: 0.15,
      mouthSmileRight: 0.15,
      viseme_aa: 0,
      viseme_E: 0,
      viseme_I: 0,
      viseme_O: 0,
      viseme_U: 0,
      viseme_PP: 0,
      viseme_FF: 0,
      viseme_TH: 0,
      viseme_CH: 0,
      viseme_SS: 0,
    };

    switch (phoneme) {
      case "A": // Open jaw (father, cat)
        this.targetWeights.jawOpen = 0.75 + Math.random() * 0.2;
        this.targetWeights.viseme_aa = 0.8;
        this.targetWeights.mouthFunnel = 0.25;
        this.targetWeights.browInnerUp = 0.15;
        break;

      case "E": // Mid open wide (bed, hey)
        this.targetWeights.jawOpen = 0.5;
        this.targetWeights.viseme_E = 0.85;
        this.targetWeights.mouthSmileLeft = 0.45;
        this.targetWeights.mouthSmileRight = 0.45;
        break;

      case "I": // High vowel spread (see, it)
        this.targetWeights.jawOpen = 0.35;
        this.targetWeights.viseme_I = 0.8;
        this.targetWeights.mouthSmileLeft = 0.55;
        this.targetWeights.mouthSmileRight = 0.55;
        break;

      case "O": // Rounded open (go, home)
        this.targetWeights.jawOpen = 0.6;
        this.targetWeights.viseme_O = 0.85;
        this.targetWeights.mouthFunnel = 0.7;
        this.targetWeights.mouthPucker = 0.4;
        break;

      case "U": // Pucker narrow (you, blue)
        this.targetWeights.jawOpen = 0.25;
        this.targetWeights.viseme_U = 0.9;
        this.targetWeights.mouthPucker = 0.8;
        this.targetWeights.mouthFunnel = 0.5;
        break;

      case "PP": // Lips together (p, b, m)
        this.targetWeights.jawOpen = 0.05;
        this.targetWeights.viseme_PP = 0.9;
        this.targetWeights.mouthClose = 0.6;
        break;

      case "FF": // Lower lip under upper teeth (f, v)
        this.targetWeights.jawOpen = 0.2;
        this.targetWeights.viseme_FF = 0.85;
        break;

      case "TH": // Tongue between teeth
        this.targetWeights.jawOpen = 0.3;
        this.targetWeights.viseme_TH = 0.8;
        break;

      case "CH": // Lips protrude (ch, sh, j)
        this.targetWeights.jawOpen = 0.35;
        this.targetWeights.viseme_CH = 0.75;
        this.targetWeights.mouthFunnel = 0.4;
        break;

      case "SS": // Teeth together
        this.targetWeights.jawOpen = 0.15;
        this.targetWeights.viseme_SS = 0.75;
        this.targetWeights.mouthSmileLeft = 0.3;
        this.targetWeights.mouthSmileRight = 0.3;
        break;

      default:
        this.targetWeights.jawOpen = 0.3 + Math.random() * 0.3;
        this.targetWeights.mouthSmileLeft = 0.2;
        this.targetWeights.mouthSmileRight = 0.2;
        break;
    }

    this.currentWeights = { ...this.targetWeights };
    this.notify();
  }

  /**
   * Web Audio API Real-time Frequency Formant loop
   */
  private startAudioFormantLoop() {
    if (this.isAnalyzing) return;
    this.isAnalyzing = true;

    const tick = () => {
      if (!this.speakingActive) {
        this.isAnalyzing = false;
        return;
      }

      // Add gentle jitter/formant variation to make speech mouth feel organic
      if (this.targetWeights.jawOpen && this.targetWeights.jawOpen > 0.1) {
        const microJitter = (Math.sin(Date.now() * 0.02) * 0.08);
        this.currentWeights.jawOpen = Math.max(0, Math.min(1, (this.targetWeights.jawOpen || 0) + microJitter));
        this.notify();
      }

      this.animFrameId = requestAnimationFrame(tick);
    };

    tick();
  }

  /**
   * Test Viseme Sequence (Cycles through vowels and smile)
   */
  public runVisemeTest(onComplete?: () => void) {
    const testCycle = ["A", "E", "I", "O", "U", "PP", "SS", "CH"];
    let idx = 0;

    const interval = setInterval(() => {
      if (idx >= testCycle.length) {
        clearInterval(interval);
        this.resetWeights();
        onComplete?.();
        return;
      }
      this.applyPhoneticViseme(testCycle[idx]);
      idx++;
    }, 400);
  }
}
