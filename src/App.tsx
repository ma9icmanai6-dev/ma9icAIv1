import React, { useState, useEffect, useCallback } from "react";
import {
  AssistantState,
  ChatMessage,
  MemoryItem,
  MultiStepPlan,
  VisionDetection,
  VoiceSettings,
} from "./types";
import { VoiceEngine } from "./services/voiceEngine";
import { VisionService } from "./services/visionService";
import { MemoryService } from "./services/memoryService";

import { VoiceOrb } from "./components/assistant/VoiceOrb";
import { AvatarCanvas } from "./components/avatar/AvatarCanvas";
import { ChatFeed } from "./components/assistant/ChatFeed";
import { InputBar } from "./components/assistant/InputBar";
import { VoiceSettingsModal } from "./components/assistant/VoiceSettingsModal";
import { MemoryModal } from "./components/assistant/MemoryModal";
import { VisionModal } from "./components/assistant/VisionModal";

import {
  Sparkles,
  Monitor,
  Camera,
  Brain,
  Settings2,
  Trash2,
  Mic,
  Volume2,
  User,
  Radio,
} from "lucide-react";

export default function App() {
  // Assistant core state
  const [assistantState, setAssistantState] = useState<AssistantState>("idle");
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [visualMode, setVisualMode] = useState<"avatar" | "orb">("avatar");

  // Chat conversation
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Memories
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);

  // Vision State & Modal
  const [activeVision, setActiveVision] = useState<VisionDetection | null>(null);
  const [visionThumbnail, setVisionThumbnail] = useState<string | undefined>(undefined);
  const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);
  const [isVisionModalOpen, setIsVisionModalOpen] = useState(false);

  // Voice Settings & Modal
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(VoiceEngine.getSettings());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Handle Assistant Speech Output
  const handleSpeakText = useCallback((text: string) => {
    setAssistantState("speaking");
    VoiceEngine.speak(text, () => {
      setAssistantState("idle");
    });
  }, []);

  // Stop current speaking
  const handleStopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setAssistantState("idle");
  }, []);

  // Execute multi-step task sequence locally if suggested
  const executePlanSequence = useCallback(
    async (plan: MultiStepPlan) => {
      setAssistantState("executing");

      for (let i = 0; i < plan.steps.length; i++) {
        // Update plan progress
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.action?.multiStepPlan) {
              return {
                ...msg,
                action: {
                  ...msg.action,
                  multiStepPlan: {
                    ...msg.action.multiStepPlan,
                    steps: msg.action.multiStepPlan.steps.map((s, idx) =>
                      idx === i ? { ...s, status: "running" } : s
                    ),
                  },
                },
              };
            }
            return msg;
          })
        );

        // Simulated asynchronous execution delay per step
        await new Promise((r) => setTimeout(r, 900));

        // Mark step completed
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.action?.multiStepPlan) {
              return {
                ...msg,
                action: {
                  ...msg.action,
                  multiStepPlan: {
                    ...msg.action.multiStepPlan,
                    steps: msg.action.multiStepPlan.steps.map((s, idx) =>
                      idx === i ? { ...s, status: "completed" } : s
                    ),
                  },
                },
              };
            }
            return msg;
          })
        );
      }

      setAssistantState("speaking");
      const completionText = plan.spokenCompletion || "I have completed all steps in the plan.";
      VoiceEngine.speak(completionText, () => {
        setAssistantState("idle");
      });
    },
    []
  );

  // Screen Capture & Multimodal Vision Analysis (Gemini Flash OCR)
  const handleCaptureScreen = useCallback(async () => {
    setIsAnalyzingVision(true);
    setAssistantState("processing");
    VoiceEngine.speak("Examining your screen right now.");

    try {
      const base64Image = await VisionService.captureScreen();
      setVisionThumbnail(base64Image);

      const response = await fetch("/api/vision/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData: base64Image,
          instruction:
            "Analyze what is currently visible on the screen. Identify active applications, visible elements, text, and suggest next actions.",
        }),
      });

      let visionResult: VisionDetection;
      if (response.ok) {
        visionResult = await response.json();
      } else {
        visionResult = {
          summary: "I examined the screen snapshot and am ready for your next instruction.",
          openWindows: ["Current Window"],
          activeApplication: "Desktop Workspace",
          detectedElements: [],
          extractedText: "",
          suggestedActions: ["Ask question", "Run command"],
        };
      }
      setActiveVision(visionResult);

      setAssistantState("speaking");
      VoiceEngine.speak(visionResult.summary, () => {
        setAssistantState("idle");
      });

      // Add to conversation feed with thumbnail
      setMessages((prev) => [
        ...prev,
        {
          id: `vision-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          role: "assistant",
          content: visionResult.summary,
          visionThumbnail: base64Image,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      console.error("Screen capture error:", err);
      VoiceEngine.speak("Screen capture was cancelled or unavailable.");
      setAssistantState("idle");
    } finally {
      setIsAnalyzingVision(false);
    }
  }, []);

  // Web Camera Snapshot & Analysis
  const handleCaptureCamera = useCallback(async () => {
    setIsAnalyzingVision(true);
    setAssistantState("processing");
    VoiceEngine.speak("Taking a camera snapshot.");

    try {
      const base64Image = await VisionService.captureWebcam();
      setVisionThumbnail(base64Image);

      const response = await fetch("/api/vision/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData: base64Image,
          instruction: "Describe what you see through the user's camera clearly and concisely.",
        }),
      });

      let visionResult: VisionDetection;
      if (response.ok) {
        visionResult = await response.json();
      } else {
        visionResult = {
          summary: "Camera snapshot captured and processed.",
          openWindows: [],
          activeApplication: "Camera Feed",
          detectedElements: [],
          extractedText: "",
          suggestedActions: ["Capture another", "Ask question"],
        };
      }
      setActiveVision(visionResult);

      setAssistantState("speaking");
      VoiceEngine.speak(visionResult.summary, () => {
        setAssistantState("idle");
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `camera-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          role: "assistant",
          content: visionResult.summary,
          visionThumbnail: base64Image,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      console.error("Webcam error:", err);
      VoiceEngine.speak("Camera access was not granted.");
      setAssistantState("idle");
    } finally {
      setIsAnalyzingVision(false);
    }
  }, []);

  // Trigger Magic Greeting ("Hi, how can I help you?") when user says "Magic" or clicks the orb
  const triggerMagicGreeting = useCallback(() => {
    VoiceEngine.stopSpeaking();

    const greetingText = "Hi, how can I help you?";

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-asst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: "assistant",
        content: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    setAssistantState("speaking");
    setIsListening(false);

    VoiceEngine.speak(greetingText, () => {
      // Once speaking finishes, immediately start listening for user's input
      VoiceEngine.startListening();
      setIsListening(true);
      setAssistantState("listening");
    });
  }, []);

  // Send Message to Gemini Chat API
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      // If user says/types purely "magic" or "hey magic", trigger greeting
      const isPureWakeWord = /^\s*(hey\s+|hi\s+|ok\s+|okay\s+)?magic[!?.,]*\s*$/i.test(text.trim());
      if (isPureWakeWord) {
        triggerMagicGreeting();
        return;
      }

      const userMsg: ChatMessage = {
        id: `msg-user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: "user",
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setAssistantState("processing");

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: messages.slice(-6).map((m) => ({
              role: m.role,
              content: m.content,
            })),
            memories: MemoryService.getMemories(),
          }),
        });

        let data: any = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (!response.ok && !data?.spokenResponse) {
          throw new Error("Chat request failed");
        }

        const spokenText = data?.spokenResponse || data?.spokenReply || "I am here to help.";

        const assistantMsg: ChatMessage = {
          id: `msg-asst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          role: "assistant",
          content: spokenText,
          action: data.action,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setAssistantState("speaking");

        VoiceEngine.speak(spokenText, () => {
          setAssistantState("idle");
        });

        // Handle specific actions if present
        if (data.action?.type === "REMEMBER" && data.action.parameter) {
          MemoryService.addMemory("Preference", data.action.parameter, "preference", "persistent");
          setMemories(MemoryService.getMemories());
        } else if (data.action?.type === "SCREEN_ANALYSIS") {
          handleCaptureScreen();
        } else if (data.action?.type === "MULTI_STEP_PLAN" && data.action.multiStepPlan) {
          executePlanSequence(data.action.multiStepPlan);
        }
      } catch (err) {
        console.error("Chat error:", err);
        setAssistantState("error");
        VoiceEngine.speak("I encountered an issue processing that. Please try again.");
        setTimeout(() => setAssistantState("idle"), 3000);
      }
    },
    [messages, executePlanSequence, handleCaptureScreen]
  );

  // Toggle Voice Listening
  const handleToggleListening = useCallback(() => {
    if (isListening) {
      VoiceEngine.stopListening();
      setIsListening(false);
      setAssistantState("idle");
    } else {
      VoiceEngine.startListening();
      setIsListening(true);
      setAssistantState("listening");
    }
  }, [isListening]);

  // Click on the orb triggers "Hi, how can I help you?" or stops speaking
  const handleOrbClick = useCallback(() => {
    if (assistantState === "speaking") {
      VoiceEngine.stopSpeaking();
      setAssistantState("idle");
    } else {
      triggerMagicGreeting();
    }
  }, [assistantState, triggerMagicGreeting]);

  // Memory additions and removals
  const handleAddMemory = useCallback(
    (key: string, value: string, category: "preference" | "routine" | "application" | "user_info" | "website") => {
      MemoryService.addMemory(key, value, category, "persistent");
      setMemories(MemoryService.getMemories());
      VoiceEngine.speak(`I will remember that your ${key} is ${value}.`);
    },
    []
  );

  const handleRemoveMemory = useCallback((id: string) => {
    MemoryService.removeMemory(id);
    setMemories(MemoryService.getMemories());
  }, []);

  // Initial setup & event listeners
  useEffect(() => {
    // 1. Load memories
    setMemories(MemoryService.getMemories());

    // 2. Load SpeechSynthesis voices
    if ("speechSynthesis" in window) {
      const updateVoices = () => {
        const v = window.speechSynthesis.getVoices();
        setAvailableVoices(v);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    // 3. Connect speech recognition callback
    const unsubSpeech = VoiceEngine.onSpeechRecognized((transcript: string) => {
      setAssistantState("processing");
      handleSendMessage(transcript);
    });

    // 4. Connect wake-word callback ("Magic")
    const unsubWake = VoiceEngine.onWakeWordDetected(() => {
      triggerMagicGreeting();
    });

    // 5. Connect audio level meter
    const unsubAudio = VoiceEngine.onAudioLevel((lvl: number) => {
      setAudioLevel(lvl);
    });

    return () => {
      unsubSpeech();
      unsubWake();
      unsubAudio();
      VoiceEngine.stopListening();
    };
  }, [handleSendMessage, triggerMagicGreeting]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans select-none relative">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-3xl" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 shrink-0 h-16 px-6 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl flex items-center justify-between">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full rounded-[11px] bg-slate-950 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-white tracking-tight">Magic AI</h1>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-medium text-indigo-300">
                Assistant
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Voice & Multimodal Intelligence</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Inspect Screen Button */}
          <button
            onClick={handleCaptureScreen}
            disabled={isAnalyzingVision}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-cyan-300 transition-colors cursor-pointer disabled:opacity-50"
            title="Examine Screen via Gemini Vision"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inspect Screen</span>
          </button>

          {/* Camera Button */}
          <button
            onClick={handleCaptureCamera}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-purple-300 transition-colors cursor-pointer"
            title="Camera Vision"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Camera</span>
          </button>

          {/* Memory Button */}
          <button
            onClick={() => setIsMemoryOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-amber-300 transition-colors cursor-pointer"
            title="Long-Term Memories"
          >
            <Brain className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Memories</span>
            {memories.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center justify-center">
                {memories.length}
              </span>
            )}
          </button>

          {/* View Mode Switcher: 3D Avatar Head vs Voice Orb */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setVisualMode("avatar")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                visualMode === "avatar"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="3D Rigged Avatar Head (Reallusion CC4 / ARKit)"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3D Head</span>
            </button>
            <button
              onClick={() => setVisualMode("orb")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                visualMode === "orb"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Luminous Voice Orb"
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Orb</span>
            </button>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Voice & Personality Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          {/* Clear Chat Button */}
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Assistant Body */}
      <main className="relative z-10 flex-1 flex flex-col max-w-4xl w-full mx-auto overflow-hidden">
        {/* Dynamic Visual Stage: 3D Rigged Head or Luminous Orb */}
        <div className="shrink-0 border-b border-slate-800/40 bg-gradient-to-b from-slate-950/40 to-transparent">
          {visualMode === "avatar" ? (
            <AvatarCanvas
              isSpeaking={assistantState === "speaking"}
              audioLevel={audioLevel}
              onSpeakGreeting={triggerMagicGreeting}
              className="h-64 sm:h-72 w-full"
            />
          ) : (
            <VoiceOrb
              state={assistantState}
              audioLevel={audioLevel}
              isListening={isListening}
              onToggleListening={handleToggleListening}
              onClickOrb={handleOrbClick}
              onStopSpeaking={handleStopSpeaking}
            />
          )}
        </div>

        {/* Conversation Feed */}
        <ChatFeed
          messages={messages}
          onSpeak={handleSpeakText}
          onQuickPrompt={handleSendMessage}
          onOpenVisionDetail={() => setIsVisionModalOpen(true)}
        />

        {/* Bottom Command Console */}
        <InputBar
          onSendMessage={handleSendMessage}
          isListening={isListening}
          onToggleListening={handleToggleListening}
          onCaptureScreen={handleCaptureScreen}
          onCaptureCamera={handleCaptureCamera}
          state={assistantState}
          isAnalyzingVision={isAnalyzingVision}
        />
      </main>

      {/* Voice & Settings Modal */}
      <VoiceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={voiceSettings}
        onSettingsChange={(newSettings) => {
          VoiceEngine.updateSettings(newSettings);
          setVoiceSettings(VoiceEngine.getSettings());
        }}
        availableVoices={availableVoices}
      />

      {/* Memory Manager Modal */}
      <MemoryModal
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        memories={memories}
        onAddMemory={handleAddMemory}
        onRemoveMemory={handleRemoveMemory}
      />

      {/* Multimodal Vision Analysis Details Modal */}
      <VisionModal
        isOpen={isVisionModalOpen}
        onClose={() => setIsVisionModalOpen(false)}
        vision={activeVision}
        thumbnailUrl={visionThumbnail}
        onActionClick={handleSendMessage}
      />
    </div>
  );
}
