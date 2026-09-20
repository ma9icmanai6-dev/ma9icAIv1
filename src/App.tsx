import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  AssistantState,
  ChatMessage,
  MemoryItem,
  MultiStepPlan,
  VisionDetection,
  VoiceSettings,
  PermissionLevel,
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
import { SuperAIPermissionDialog } from "./components/desktop/SuperAIPermissionDialog";
import { TakeControlModal } from "./components/desktop/TakeControlModal";

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
  X,
  MousePointer,
} from "lucide-react";

function describeError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : String(error || "");
  return message && message !== "[object Object]" ? message : fallback;
}

export default function App() {
  const isDesktopShell = new URLSearchParams(window.location.search).has("desktop");

  // Assistant core state
  const [assistantState, setAssistantState] = useState<AssistantState>("idle");
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [visualMode, setVisualMode] = useState<"avatar" | "orb">("avatar");
  const [experienceMode, setExperienceMode] = useState<"full" | "model">("full");
  const [guiBlurred, setGuiBlurred] = useState(true);
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>("none");
  const [pendingPlan, setPendingPlan] = useState<MultiStepPlan | null>(null);
  const [isPermissionOpen, setIsPermissionOpen] = useState(false);
  const [isTakeControlOpen, setIsTakeControlOpen] = useState(false);

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
  const [connectionProgress, setConnectionProgress] = useState<number | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const lastGreetingRef = useRef(-1);

  useEffect(() => {
    document.body.classList.toggle("desktop-shell", isDesktopShell);
    return () => document.body.classList.remove("desktop-shell");
  }, [isDesktopShell]);

  useEffect(() => {
    (window as any).magicWindow?.setOverlayMode(experienceMode === "model");
  }, [experienceMode]);

  useEffect(() => {
    if (assistantState !== "processing" && assistantState !== "executing") {
      setConnectionProgress(null);
      return;
    }

    setConnectionProgress(12);
    const timer = window.setInterval(() => {
      setConnectionProgress((current) => current === null ? 12 : Math.min(88, current + 7));
    }, 450);
    return () => window.clearInterval(timer);
  }, [assistantState]);

  // Voice Settings & Modal
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(VoiceEngine.getSettings());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const setDesktopPermission = useCallback((level: PermissionLevel) => {
    setPermissionLevel(level);
    (window as any).magicDesktop?.setPermission(level);
  }, []);

  const executeDesktopAction = useCallback(async (actionType: string, params: Record<string, any> = {}) => {
    const coordinates = params.coordinates || {};
    const normalizedType = actionType.toUpperCase();
    const actions: Record<string, { action: string; params: Record<string, any> }> = {
      MOVE_MOUSE: { action: "MOVE_MOUSE", params: { x: params.x ?? coordinates.x, y: params.y ?? coordinates.y, coordinateSpace: params.coordinateSpace } },
      CLICK_BUTTON: { action: "CLICK", params: { x: params.x ?? coordinates.x, y: params.y ?? coordinates.y, coordinateSpace: params.coordinateSpace } },
      DOUBLE_CLICK: { action: "DOUBLE_CLICK", params: { x: params.x ?? coordinates.x, y: params.y ?? coordinates.y, coordinateSpace: params.coordinateSpace } },
      RIGHT_CLICK: { action: "RIGHT_CLICK", params: { x: params.x ?? coordinates.x, y: params.y ?? coordinates.y, coordinateSpace: params.coordinateSpace } },
      DRAG: { action: "DRAG", params: { x: params.x ?? coordinates.x, y: params.y ?? coordinates.y, endX: params.endX, endY: params.endY, coordinateSpace: params.coordinateSpace } },
      SCROLL: { action: "SCROLL", params: { x: params.x ?? coordinates.x, y: params.y ?? coordinates.y, key: params.key || "{PAGEDOWN}", coordinateSpace: params.coordinateSpace } },
      TYPE_INPUT: { action: "TYPE_TEXT", params: { text: params.text || params.parameter || "" } },
      KEY_PRESS: { action: "KEY_PRESS", params: { key: params.key || params.key_combination || params.parameter || "" } },
      LAUNCH_APP: { action: "LAUNCH_APP", params: { app: params.app || params.parameter || "notepad.exe" } },
      NAVIGATE_URL: { action: "NAVIGATE_URL", params: { url: params.url || params.parameter || "" } },
      OPEN_FILE: { action: "OPEN_FILE", params: { path: params.path || params.parameter || "" } },
      WAIT: { action: "WAIT", params: { ms: params.ms || params.estimatedDurationMs || 500 } },
    };
    const mapped = actions[normalizedType];
    if (!mapped) throw new Error(`Unsupported desktop action: ${actionType}`);
    if (!(window as any).magicDesktop?.execute) throw new Error("Desktop control is unavailable in this app window.");
    if (["MOVE_MOUSE", "CLICK_BUTTON", "DOUBLE_CLICK", "RIGHT_CLICK", "DRAG", "SCROLL"].includes(normalizedType)) {
      const x = mapped.params.x;
      const y = mapped.params.y;
      if (!Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) {
        throw new Error("This action needs screen coordinates. Ask Magic to inspect the screen first, then try again.");
      }
      if (normalizedType === "DRAG" && (!Number.isFinite(Number(mapped.params.endX)) || !Number.isFinite(Number(mapped.params.endY)))) {
        throw new Error("Drag actions need a destination point.");
      }
      if (normalizedType === "NAVIGATE_URL" && !String(mapped.params.url).trim()) {
        throw new Error("No URL was provided for navigation.");
      }
    }
    await (window as any).magicDesktop.execute(mapped.action, mapped.params);
  }, []);

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

        try {
          await executeDesktopAction(plan.steps[i].actionType, {
            ...plan.steps[i].params,
            parameter: plan.steps[i].parameter,
            coordinates: plan.steps[i].coordinates,
            estimatedDurationMs: plan.steps[i].estimatedDurationMs,
            coordinateSpace: plan.steps[i].params?.coordinateSpace,
          });
        } catch (error) {
          const rawReason = describeError(error, "The desktop action did not complete.");
          const reason = rawReason.length > 180 ? "Windows rejected the desktop action. Check the target app and permissions." : rawReason;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.action?.multiStepPlan
                ? { ...msg, action: { ...msg.action, multiStepPlan: { ...msg.action.multiStepPlan, status: "aborted", steps: msg.action.multiStepPlan.steps.map((step, index) => index === i ? { ...step, status: "failed" } : step) } } }
                : msg
            )
          );
          setAssistantState("error");
          VoiceEngine.speak(`Desktop control stopped: ${reason}`, () => setAssistantState("idle"));
          return;
        }

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
    [executeDesktopAction]
  );

  // Screen Capture & Multimodal Vision Analysis (Gemini Flash OCR)
  const handleCaptureScreen = useCallback(async (): Promise<VisionDetection | null> => {
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
            "Analyze the screen in detail for future mouse and keyboard control. Identify the active application and every visible search box, address bar, input, button, link, tab, menu, dialog, and important text. For each actionable element, return its exact screenshot-pixel boundingBox and center coordinates. Explain the page layout, focused control, readable labels, and what action each control would perform.",
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
      return visionResult;
    } catch (err) {
      console.error("Screen capture error:", err);
      VoiceEngine.speak(`Screen inspection failed: ${describeError(err, "screen capture was cancelled or unavailable.")}`);
      setAssistantState("idle");
      return null;
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
      VoiceEngine.speak(`Camera inspection failed: ${describeError(err, "camera access was not granted.")}`);
      setAssistantState("idle");
    } finally {
      setIsAnalyzingVision(false);
    }
  }, []);

  // Trigger Magic's greeting when the user says "Magic" or clicks the orb
  const triggerMagicGreeting = useCallback(() => {
    VoiceEngine.stopSpeaking();

    const greetings = [
      "Hi there. What can I help you with today?",
      "Good to see you. I am ready when you are.",
      "Hello. Your desktop assistant is online.",
      "Welcome back. What would you like to do?",
      "Hi. I am here and listening when you need me.",
    ];
    let greetingIndex = Math.floor(Math.random() * greetings.length);
    if (greetings.length > 1 && greetingIndex === lastGreetingRef.current) {
      greetingIndex = (greetingIndex + 1) % greetings.length;
    }
    lastGreetingRef.current = greetingIndex;
    const greetingText = greetings[greetingIndex];

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
      VoiceEngine.startListening()
        .then(() => {
          setVoiceNotice(null);
          setIsListening(true);
          setAssistantState("listening");
        })
        .catch((error) => {
          setIsListening(false);
          setAssistantState("idle");
          setVoiceNotice(describeError(error, "Microphone access is unavailable."));
        });
    });
  }, []);

  // Send Message to Gemini Chat API
  const handleSendMessage = useCallback(
    async (text: string, visionOverride?: VisionDetection | null) => {
      if (!text.trim()) return;

      // If user says/types purely "Magic" or "Hey Magic", trigger greeting
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
            visionContext: visionOverride ?? activeVision,
          }),
        });

        let data: any = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (!response.ok && !data?.spokenResponse) {
          throw new Error(data?.error || `Chat server returned HTTP ${response.status}.`);
        }

        const spokenText = data?.spokenResponse || data?.spokenReply || "The assistant returned no response. Check the Ollama connection and selected model.";

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
          if (data.action?.type === "LAUNCH_APP" || data.action?.type === "OPEN_FILE") {
          const appName = data.action.app || data.action.parameter || data.action.params?.app;
            const filePath = data.action.path || data.action.parameter || data.action.params?.path;
            const actionType = data.action.type;
            const plan: MultiStepPlan = {
              id: `launch-${Date.now()}`,
              planTitle: actionType === "OPEN_FILE" ? `Open ${filePath || "file"}` : `Open ${appName || "application"}`,
              spokenIntro: spokenText,
              steps: [{
                stepNumber: 1,
                description: actionType === "OPEN_FILE" ? `Open ${filePath || "file"}` : `Launch ${appName || "application"}`,
                actionType,
                params: actionType === "OPEN_FILE" ? { path: filePath } : { app: appName },
              status: "pending",
              estimatedDurationMs: 1000,
            }],
            spokenCompletion: actionType === "OPEN_FILE"
              ? `${filePath || "The file"} is open.`
              : `${appName || "The application"} is open.`,
            currentStepIndex: 0,
            status: "idle",
          };
          if (permissionLevel === "none" || permissionLevel === "deny") {
            setPendingPlan(plan);
            setIsPermissionOpen(true);
          } else {
            executePlanSequence(plan);
          }
        } else if (data.action?.type === "REMEMBER" && data.action.parameter) {
          MemoryService.addMemory("Preference", data.action.parameter, "preference", "persistent");
          setMemories(MemoryService.getMemories());
        } else if (data.action?.type === "SCREEN_ANALYSIS") {
          handleCaptureScreen();
        } else if (data.action?.type === "MULTI_STEP_PLAN" && data.action.multiStepPlan) {
          const plan = data.action.multiStepPlan as MultiStepPlan;
          if (permissionLevel === "none" || permissionLevel === "deny") {
            setPendingPlan(plan);
            setIsPermissionOpen(true);
          } else {
            executePlanSequence(plan);
          }
        }
      } catch (err) {
        console.error("Chat error:", err);
        setAssistantState("error");
        VoiceEngine.speak(`Chat failed: ${describeError(err, "the assistant could not process that request.")}`);
        setTimeout(() => setAssistantState("idle"), 3000);
      }
    },
    [messages, activeVision, executePlanSequence, handleCaptureScreen, permissionLevel, triggerMagicGreeting]
  );

  const handlePermissionGrant = useCallback((level: PermissionLevel) => {
    setDesktopPermission(level);
    setIsPermissionOpen(false);
    if (pendingPlan) {
      const plan = pendingPlan;
      setPendingPlan(null);
      executePlanSequence(plan);
    }
  }, [executePlanSequence, pendingPlan, setDesktopPermission]);

  const handleTakeControl = useCallback(async (task: string) => {
    setIsTakeControlOpen(false);
    const screenContext = await handleCaptureScreen();
    await handleSendMessage(task, screenContext);
  }, [handleCaptureScreen, handleSendMessage]);

  const handlePermissionDeny = useCallback(() => {
    setDesktopPermission("deny");
    setPendingPlan(null);
    setIsPermissionOpen(false);
    VoiceEngine.speak("Desktop control was cancelled.");
  }, [setDesktopPermission]);

  // Toggle Voice Listening
  const handleToggleListening = useCallback(() => {
    if (isListening) {
      VoiceEngine.stopListening();
      setIsListening(false);
      setAssistantState("idle");
    } else {
      setIsListening(true);
      setAssistantState("listening");
      setVoiceNotice(null);
      VoiceEngine.startListening().catch((error) => {
        setIsListening(false);
        setAssistantState("error");
        setVoiceNotice(describeError(error, "Microphone access is unavailable."));
        setAssistantState("idle");
      });
    }
  }, [isListening]);

  const handleModelQuickAction = useCallback(
    (action: "todo" | "important" | "inspect") => {
      const prompts = {
        todo: "Show me my important to-do items and help me decide what to do next.",
        important: "Review our conversation and tell me the most important items I should remember or act on.",
        inspect: "Inspect my screen and tell me what is active.",
      };
      handleSendMessage(prompts[action]);
    },
    [handleSendMessage]
  );
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
    let cleanupVoices = () => {};

    // 2. Load SpeechSynthesis voices
    if ("speechSynthesis" in window) {
      const updateVoices = () => {
        const engineVoices = VoiceEngine.getVoices();
        const browserVoices = window.speechSynthesis.getVoices();
        const voices = [...engineVoices, ...browserVoices].filter(
          (voice, index, all) => all.findIndex((candidate) => candidate.name === voice.name) === index
        );
        if (voices.length > 0) setAvailableVoices(voices);
      };
      updateVoices();
      window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
      const voiceLoadRetry = window.setInterval(updateVoices, 250);
      window.setTimeout(() => window.clearInterval(voiceLoadRetry), 5000);
      cleanupVoices = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
        window.clearInterval(voiceLoadRetry);
      };
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
    const unsubVoiceError = VoiceEngine.onError((message: string) => {
      console.warn("Voice recognition stopped:", message);
      setVoiceNotice(message);
      const isPermanentVoiceError = /permission was denied|unavailable|audio-capture|could not be initialized|speech recognition stopped|speech process did not start/i.test(message);
      if (isPermanentVoiceError) {
        setIsListening(false);
        setAssistantState("error");
        setAssistantState("idle");
      } else {
        setAssistantState("listening");
      }
    });

    return () => {
      cleanupVoices();
      unsubSpeech();
      unsubWake();
      unsubAudio();
      unsubVoiceError();
      VoiceEngine.stopListening();
    };
  }, [handleSendMessage, triggerMagicGreeting]);

  useEffect(() => {
    const greetingTimer = window.setTimeout(() => triggerMagicGreeting(), 900);
    return () => window.clearTimeout(greetingTimer);
  }, [triggerMagicGreeting]);

  return (
    <div
      className={`w-screen h-screen overflow-hidden ${isDesktopShell ? "desktop-shell" : "bg-slate-950"} text-slate-100 flex flex-col font-sans select-none relative`}
      style={
        isDesktopShell && guiBlurred && experienceMode === "full"
          ? { backgroundColor: "rgba(2, 6, 23, 0.4)", backdropFilter: "blur(18px)" }
          : undefined
      }
    >
      {experienceMode === "model" ? (
        <AvatarCanvas
          isSpeaking={assistantState === "speaking"}
          isListening={isListening}
          audioLevel={audioLevel}
          modelOnly
          onSpeakGreeting={triggerMagicGreeting}
          onToggleListening={handleToggleListening}
          onCaptureScreen={handleCaptureScreen}
          onSendMessage={handleSendMessage}
          status={assistantState}
          voiceNotice={voiceNotice}
          connectionProgress={connectionProgress}
          onQuickAction={handleModelQuickAction}
          onToggleFullView={() => setExperienceMode("full")}
          className="h-screen w-screen"
        />
      ) : (
        <>
      {/* Background ambient lighting */}
      <div className={`${isDesktopShell ? "hidden" : ""} absolute inset-0 pointer-events-none overflow-hidden`}>
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-3xl" />
      </div>

      {/* Top Header Bar */}
      <header className={`relative z-10 shrink-0 h-16 px-6 ${isDesktopShell ? "border-transparent bg-transparent" : "border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl"} flex items-center justify-between`}>
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

          <button
            onClick={() => setIsTakeControlOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300/35 bg-amber-400/15 px-3 py-1.5 text-xs text-amber-200 transition-colors hover:border-amber-300/60 hover:bg-amber-400/25"
            title="Tell Magic to control the desktop"
          >
            <MousePointer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Take Control</span>
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

          {/* Model-only overlay mode */}
          <button
            onClick={() => setExperienceMode("model")}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Show model only"
          >
            <User className="w-4 h-4" />
          </button>

          {isDesktopShell && (
            <button
              onClick={() => (window as any).magicWindow?.close()}
              className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 hover:text-rose-100 transition-colors cursor-pointer"
              title="Close Magic AI"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {isDesktopShell && (
            <button
              onClick={() => setGuiBlurred((current) => !current)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                guiBlurred
                  ? "bg-sky-500/20 border-sky-400/50 text-sky-200"
                  : "bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-300"
              }`}
              title={guiBlurred ? "Use fully transparent background" : "Use 60% transparent blurred background"}
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}

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
      <main className="relative z-10 flex-1 min-h-0 flex flex-col max-w-4xl w-full mx-auto overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {/* Dynamic Visual Stage: 3D Rigged Head or Luminous Orb */}
        <div className="shrink-0 border-b border-slate-800/40 bg-gradient-to-b from-slate-950/40 to-transparent">
          {visualMode === "avatar" ? (
            <AvatarCanvas
              isSpeaking={assistantState === "speaking"}
              audioLevel={audioLevel}
              onSpeakGreeting={triggerMagicGreeting}
              className="h-56 sm:h-64 w-full"
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
        </>
      )}

      <SuperAIPermissionDialog
        isOpen={isPermissionOpen}
        requestedActionDescription={pendingPlan?.planTitle || "A multi-step desktop control task"}
        onGrant={handlePermissionGrant}
        onDeny={handlePermissionDeny}
      />
      <TakeControlModal
        isOpen={isTakeControlOpen}
        onClose={() => setIsTakeControlOpen(false)}
        onSubmit={handleTakeControl}
      />
    </div>
  );
}
