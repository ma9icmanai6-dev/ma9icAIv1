import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Minus,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Camera,
  Monitor,
  Brain,
  Zap,
  Shield,
  Volume2,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Eye,
  Plus,
} from "lucide-react";
import {
  AssistantState,
  ChatMessage,
  MemoryItem,
  MultiStepPlan,
  VisionDetection,
  VoiceSettings,
} from "../../types";

interface CompanionWindowProps {
  isOpen: boolean;
  onClose: () => void;
  state: AssistantState;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
  audioLevel: number;
  onCaptureScreen: () => void;
  onCaptureCamera: () => void;
  memories: MemoryItem[];
  onAddMemory: (key: string, value: string) => void;
  onRemoveMemory: (id: string) => void;
  activePlan: MultiStepPlan | null;
  onTriggerKillSwitch: () => void;
  superAIActive: boolean;
  activeVision: VisionDetection | null;
  isAnalyzingVision: boolean;
}

export const CompanionWindow: React.FC<CompanionWindowProps> = ({
  isOpen,
  onClose,
  state,
  messages,
  onSendMessage,
  isListening,
  onToggleListening,
  audioLevel,
  onCaptureScreen,
  onCaptureCamera,
  memories,
  onAddMemory,
  onRemoveMemory,
  activePlan,
  onTriggerKillSwitch,
  superAIActive,
  activeVision,
  isAnalyzingVision,
}) => {
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "vision" | "memory" | "plan">("chat");
  const [newMemKey, setNewMemKey] = useState("");
  const [newMemVal, setNewMemVal] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activePlan]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleAddMemorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemKey.trim() || !newMemVal.trim()) return;
    onAddMemory(newMemKey.trim(), newMemVal.trim());
    setNewMemKey("");
    setNewMemVal("");
  };

  return (
    <div className="fixed right-6 top-12 bottom-16 w-96 z-40 bg-slate-900/90 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 select-none animate-in slide-in-from-right duration-250">
      {/* Title Bar with Status */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                state === "listening"
                  ? "bg-sky-400 animate-ping"
                  : state === "speaking"
                  ? "bg-emerald-400"
                  : state === "processing"
                  ? "bg-purple-400 animate-spin"
                  : "bg-sky-400"
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-white tracking-wide">MAGIC ASSISTANT</h2>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono">
                WIN 11
              </span>
            </div>
            <div className="text-[10px] text-slate-400 capitalize flex items-center gap-1">
              <span>Status:</span>
              <strong className="text-sky-300">{state}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Emergency Kill Switch */}
          <button
            id="companion-kill-switch"
            onClick={onTriggerKillSwitch}
            title="Emergency Kill Switch (Ctrl+Alt+Esc)"
            className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 rounded-lg transition"
          >
            <Zap className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            title="Minimize to Floating Orb"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center px-3 py-1.5 bg-slate-950/70 border-b border-white/10 text-xs gap-1">
        {[
          { id: "chat", label: "Companion", icon: <Sparkles className="w-3.5 h-3.5" /> },
          { id: "vision", label: "Screen Vision", icon: <Eye className="w-3.5 h-3.5" /> },
          { id: "memory", label: "AI Memory", icon: <Brain className="w-3.5 h-3.5" /> },
          { id: "plan", label: "Task Plan", icon: <Clock className="w-3.5 h-3.5" /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition ${
              activeTab === t.id
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 overflow-y-auto p-3.5 text-xs">
        {activeTab === "chat" && (
          <div className="flex flex-col h-full justify-between space-y-3">
            {/* Conversation Log */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-3 text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Hello, I am Magic</h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Your Windows 11 voice desktop companion. Say <strong>"Magic"</strong> or try a command below:
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 w-full pt-2">
                    {[
                      "Magic open Brave and go to Google",
                      "Magic search for pizza recipes",
                      "Magic what is on my screen?",
                      "Magic open Notepad and type Hello World",
                      "Magic create a folder for my Roblox project",
                    ].map((cmd, i) => (
                      <button
                        key={i}
                        onClick={() => onSendMessage(cmd)}
                        className="text-left px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-sky-500/15 border border-white/5 hover:border-sky-500/30 text-slate-300 hover:text-white transition text-[11px]"
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div
                    key={m.id ? `${m.id}-${idx}` : `msg-${idx}`}
                    className={`flex flex-col ${
                      m.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                        m.role === "user"
                          ? "bg-sky-600 text-white rounded-br-none"
                          : "bg-slate-800/90 text-slate-200 border border-white/10 rounded-bl-none"
                      }`}
                    >
                      <p className="text-xs">{m.content}</p>
                      {m.action && m.action.type !== "NONE" && (
                        <div className="mt-2 pt-1.5 border-t border-white/10 text-[10px] text-sky-300 font-mono">
                          Action: {m.action.type}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-[10px] text-slate-400">
              <button
                onClick={onCaptureScreen}
                disabled={isAnalyzingVision}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-sky-300 transition shrink-0 border border-white/5"
              >
                <Monitor className="w-3 h-3" />
                <span>Read Screen</span>
              </button>
              <button
                onClick={onCaptureCamera}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-300 transition shrink-0 border border-white/5"
              >
                <Camera className="w-3 h-3" />
                <span>Camera View</span>
              </button>
              <button
                onClick={() => onSendMessage("Show my memories")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-300 transition shrink-0 border border-white/5"
              >
                <Brain className="w-3 h-3" />
                <span>Show Memories</span>
              </button>
            </div>
          </div>
        )}

        {/* Screen Vision Tab */}
        {activeTab === "vision" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-xs text-white flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-sky-400" />
                Desktop Screen & OCR Understanding
              </h3>
              <button
                id="btn-trigger-screen-capture"
                onClick={onCaptureScreen}
                disabled={isAnalyzingVision}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-medium transition"
              >
                <RefreshCw className={`w-3 h-3 ${isAnalyzingVision ? "animate-spin" : ""}`} />
                <span>{isAnalyzingVision ? "Analyzing..." : "Scan Screen"}</span>
              </button>
            </div>

            {activeVision ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-white/10 space-y-2">
                  <div className="text-[10px] text-sky-400 uppercase font-mono font-semibold">
                    Multimodal Vision Summary
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">{activeVision.summary}</p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-white/10 space-y-1.5">
                  <div className="text-[10px] text-amber-400 uppercase font-mono font-semibold">
                    Identified Open Windows
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeVision.openWindows.map((win, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-900 border border-white/10 text-slate-300 text-[11px]"
                      >
                        {win}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-white/10 space-y-1.5">
                  <div className="text-[10px] text-emerald-400 uppercase font-mono font-semibold">
                    Detected Interactive Elements
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {activeVision.detectedElements.map((el, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[11px] py-1 border-b border-white/5"
                      >
                        <span className="text-slate-200">{el.label}</span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                          {el.type} • {el.location}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {activeVision.extractedText && (
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-white/10 space-y-1">
                    <div className="text-[10px] text-purple-400 uppercase font-mono font-semibold">
                      Extracted Text / OCR
                    </div>
                    <p className="text-[11px] text-slate-300 font-mono bg-slate-900/90 p-2 rounded max-h-24 overflow-y-auto">
                      {activeVision.extractedText}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <Monitor className="w-8 h-8 mx-auto text-slate-500" />
                <p>Click "Scan Screen" to capture live desktop display or share your monitor for Gemini OCR & UI detection.</p>
              </div>
            )}
          </div>
        )}

        {/* AI Memory Tab */}
        {activeTab === "memory" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-xs text-white flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-amber-400" />
                Magic Long-Term & Session Memory
              </h3>
              <span className="text-[10px] text-slate-400">{memories.length} items</span>
            </div>

            {/* Add Memory Form */}
            <form onSubmit={handleAddMemorySubmit} className="space-y-2 p-2.5 bg-slate-950/60 rounded-xl border border-white/10">
              <div className="text-[10px] font-medium text-slate-300">Add Preference / Fact</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Key (e.g. favorite_food)"
                  value={newMemKey}
                  onChange={(e) => setNewMemKey(e.target.value)}
                  className="px-2 py-1 bg-slate-900 border border-white/10 rounded text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. Margherita Pizza)"
                  value={newMemVal}
                  onChange={(e) => setNewMemVal(e.target.value)}
                  className="px-2 py-1 bg-slate-900 border border-white/10 rounded text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Memory</span>
              </button>
            </form>

            {/* Memory List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {memories.map((mem) => (
                <div
                  key={mem.id}
                  className="p-2.5 bg-slate-950/80 rounded-xl border border-white/10 flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sky-300 truncate">{mem.key}</span>
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {mem.type}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] truncate">{mem.value}</p>
                  </div>
                  <button
                    onClick={() => onRemoveMemory(mem.id)}
                    title="Forget this memory"
                    className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-white/5 transition shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task Plan Tab */}
        {activeTab === "plan" && (
          <div className="space-y-3">
            <h3 className="font-semibold text-xs text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              Multi-Step Task Planning Engine
            </h3>

            {activePlan ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-300 text-xs">{activePlan.planTitle}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                        activePlan.status === "completed"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : activePlan.status === "aborted"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse"
                      }`}
                    >
                      {activePlan.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{activePlan.spokenIntro}</p>
                </div>

                <div className="space-y-2">
                  {activePlan.steps.map((step, idx) => (
                    <div
                      key={step.stepNumber}
                      className={`p-2.5 rounded-xl border flex items-center gap-3 transition ${
                        step.status === "completed"
                          ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                          : step.status === "running"
                          ? "bg-sky-950/40 border-sky-500/50 text-sky-200 shadow-md animate-pulse"
                          : step.status === "failed"
                          ? "bg-rose-950/30 border-rose-500/40 text-rose-200"
                          : "bg-slate-950/40 border-white/5 text-slate-400"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold shrink-0 bg-slate-800">
                        {step.status === "completed" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          step.stepNumber
                        )}
                      </div>
                      <div className="flex-1 truncate">
                        <div className="font-medium text-xs truncate">{step.description}</div>
                        <div className="text-[10px] font-mono opacity-70">
                          {step.actionType}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-500" />
                <p>No multi-step action currently running. Give Magic a multi-step instruction to watch real-time automated execution!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spoken Audio Meter & Input Bar */}
      <div className="p-3 bg-slate-950 border-t border-white/10 space-y-2">
        {/* Audio Waveform Indicator */}
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isListening ? "bg-emerald-400 animate-ping" : "bg-slate-600"
              }`}
            />
            <span>{isListening ? "Microphone Live (Wake Word: 'Magic')" : "Microphone Muted"}</span>
          </div>

          {/* Dynamic Audio Level Bar */}
          <div className="flex items-center gap-0.5 h-3">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full transition-all duration-75"
                style={{
                  height: `${Math.max(3, (audioLevel * 20 * (i + 1)) % 14)}px`,
                  backgroundColor: audioLevel > 0.05 ? "#38bdf8" : "#334155",
                }}
              />
            ))}
          </div>
        </div>

        {/* Text Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleListening}
            title={isListening ? "Mute Microphone" : "Unmute Microphone"}
            className={`p-2 rounded-xl transition shrink-0 ${
              isListening
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <input
            id="companion-chat-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Talk with Magic or type a command..."
            className="flex-1 px-3 py-2 bg-slate-900 border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white transition shrink-0 shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
