import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Volume2,
  Sparkles,
  User,
  CheckCircle2,
  Circle,
  Loader2,
  ArrowRight,
  Eye,
  Brain,
  ListTodo,
  Copy,
  Check,
} from "lucide-react";
import { ChatMessage, VisionDetection } from "../../types";

interface ChatFeedProps {
  messages: ChatMessage[];
  onSpeak: (text: string) => void;
  onQuickPrompt: (text: string) => void;
  onOpenVisionDetail?: (vision: VisionDetection) => void;
}

export const ChatFeed: React.FC<ChatFeedProps> = ({
  messages,
  onSpeak,
  onQuickPrompt,
  onOpenVisionDetail,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-100">Welcome to Magic AI</h2>
          <p className="text-xs text-slate-400 mt-1">
            Your personal multimodal voice companion. Speak naturally, ask me to examine your screen, or plan multi-step workflows.
          </p>

          <div className="mt-5 text-left">
            <span className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">Try asking:</span>
            <div className="mt-2 space-y-2">
              {[
                {
                  label: "Examine my screen",
                  prompt: "Inspect my screen and tell me what is active.",
                  icon: <Eye className="w-3.5 h-3.5 text-cyan-400" />,
                },
                {
                  label: "Plan a multi-step project",
                  prompt: "Plan a multi-step workflow to organize my development project.",
                  icon: <ListTodo className="w-3.5 h-3.5 text-purple-400" />,
                },
                {
                  label: "Remember my preference",
                  prompt: "Remember that I prefer TypeScript with Tailwind CSS.",
                  icon: <Brain className="w-3.5 h-3.5 text-amber-400" />,
                },
                {
                  label: "What can you do?",
                  prompt: "What capabilities and automation tools do you have?",
                  icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />,
                },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onQuickPrompt(item.prompt)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 text-xs text-slate-200 transition-colors group cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      <AnimatePresence initial={false}>
        {messages.map((msg, idx) => (
          <motion.div
            key={msg.id ? `${msg.id}-${idx}` : `msg-${idx}`}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-start gap-3`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[82%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed shadow-lg ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-sm"
                  : "bg-slate-900/90 text-slate-100 border border-slate-800/90 rounded-tl-sm backdrop-blur-md"
              }`}
            >
              {/* Message Header / Timestamp */}
              <div className="flex items-center justify-between gap-4 mb-1 text-[11px] opacity-70">
                <span className="font-medium flex items-center gap-1.5">
                  {msg.role === "user" ? (
                    <>
                      <User className="w-3 h-3" /> You
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-cyan-400" /> Magic
                    </>
                  )}
                </span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Body Content */}
              <div className="whitespace-pre-wrap select-text">{msg.content}</div>

              {/* Assistant Message Actions (Speech Replay, Copy) */}
              {msg.role === "assistant" && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSpeak(msg.content)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 hover:text-slate-200 transition-colors text-[11px] cursor-pointer"
                      title="Speak response aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Speak</span>
                    </button>

                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 hover:text-slate-200 transition-colors text-[11px] cursor-pointer"
                      title="Copy text to clipboard"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Multi-Step Action Plan Card */}
              {msg.action?.multiStepPlan && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-950/80 border border-indigo-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ListTodo className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-semibold text-indigo-300">
                        {msg.action.multiStepPlan.planTitle || "Automated Workflow Plan"}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {msg.action.multiStepPlan.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="space-y-1.5 mt-2">
                    {msg.action.multiStepPlan.steps.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800"
                      >
                        <div className="mt-0.5 shrink-0">
                          {step.status === "completed" ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : step.status === "running" ? (
                            <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-200">{step.description}</p>
                          {step.parameter && (
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                              Param: {step.parameter}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vision Analysis Thumbnail & Elements Preview */}
              {msg.visionThumbnail && (
                <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                      <Eye className="w-3.5 h-3.5" /> Visual Screen Capture
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono">Gemini 3.8 Flash OCR</span>
                  </div>
                  <div className="relative rounded-lg overflow-hidden border border-slate-800 group">
                    <img
                      src={msg.visionThumbnail}
                      alt="Screen capture"
                      className="w-full max-h-48 object-cover object-top"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
};
