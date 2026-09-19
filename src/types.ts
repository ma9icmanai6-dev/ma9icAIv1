export type AssistantState = "idle" | "listening" | "processing" | "speaking" | "executing" | "error";

export type PermissionLevel = "none" | "one_action" | "one_session" | "always" | "deny";

export interface SystemMetrics {
  cpuUsage: number; // percentage
  ramUsage: number; // GB
  ramTotal: number; // GB
  gpuUsage: number; // percentage
  batteryLevel: number | null; // percentage
  isCharging: boolean;
  networkStatus: "connected" | "disconnected" | "limited";
  networkType: string;
  volume: number; // 0-100
  brightness: number; // 0-100
  wifiEnabled: boolean;
  bluetoothEnabled: boolean;
}

export interface WindowApp {
  id: string;
  title: string;
  name: "brave" | "edge" | "chrome" | "notepad" | "calculator" | "paint" | "files" | "terminal" | "taskmgr" | "settings" | "discord" | "roblox" | "spotify";
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number; width: number; height: number };
  data?: any;
}

export interface MemoryItem {
  id: string;
  type: "session" | "persistent" | "long_term";
  key: string;
  value: string;
  category: "preference" | "routine" | "application" | "user_info" | "website";
  createdAt: string;
}

export interface AgentStep {
  stepNumber: number;
  description: string;
  actionType: string;
  targetApp?: string;
  parameter?: string;
  coordinates?: { x: number; y: number };
  params?: Record<string, any>;
  status: "pending" | "running" | "completed" | "failed";
  estimatedDurationMs?: number;
}

export interface MultiStepPlan {
  id: string;
  planTitle: string;
  spokenIntro: string;
  steps: AgentStep[];
  spokenCompletion: string;
  currentStepIndex: number;
  status: "idle" | "in_progress" | "completed" | "aborted";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  action?: {
    type: string;
    description?: string;
    targetApp?: string;
    parameter?: any;
    params?: any;
    multiStepPlan?: MultiStepPlan;
  };
  visionThumbnail?: string;
  plan?: MultiStepPlan;
}

export interface VisionDetection {
  summary: string;
  openWindows: string[];
  activeApplication: string;
  detectedElements: Array<{
    type: "button" | "input" | "menu" | "tab" | "text" | "window";
    label: string;
    location: string;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }>;
  extractedText: string;
  suggestedActions: string[];
}

export interface PluginItem {
  id: string;
  name: string;
  category: string;
  description: string;
  enabled: boolean;
  icon: string;
  statusText: string;
  actionHandler?: () => void;
}

export interface VoiceSettings {
  pitch: number; // 0.5 to 2
  rate: number; // 0.5 to 2
  volume: number; // 0 to 1
  voiceName: string;
  wakeWordSensitivity: number; // 0.1 to 1.0
  continuousListening: boolean;
  localWakeWordEnabled: boolean;
}
