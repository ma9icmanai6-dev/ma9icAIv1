import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Send, Monitor, Camera, Sparkles, Loader2 } from "lucide-react";
import { AssistantState } from "../../types";

interface InputBarProps {
  onSendMessage: (text: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
  onCaptureScreen: () => void;
  onCaptureCamera: () => void;
  state: AssistantState;
  isAnalyzingVision?: boolean;
}

export const InputBar: React.FC<InputBarProps> = ({
  onSendMessage,
  isListening,
  onToggleListening,
  onCaptureScreen,
  onCaptureCamera,
  state,
  isAnalyzingVision = false,
}) => {
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 backdrop-blur-xl">
      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        <button
          onClick={onCaptureScreen}
          disabled={isAnalyzingVision}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-cyan-300 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isAnalyzingVision ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Monitor className="w-3.5 h-3.5" />
          )}
          <span>Inspect Screen</span>
        </button>

        <button
          onClick={onCaptureCamera}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-purple-300 transition-colors cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Camera Vision</span>
        </button>

        {[
          "Magic",
          "What can you do?",
          "Plan a project workflow",
          "Remember I prefer concise replies",
        ].map((chip, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(chip)}
            className="shrink-0 px-3 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Main Command Input Box */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1">
        <div className="relative flex-1 flex items-center bg-slate-900 border border-slate-800 focus-within:border-indigo-500 rounded-2xl transition-colors shadow-inner">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? "Listening to your voice... (or type here)"
                : "Ask Magic anything, or click the mic to talk..."
            }
            className="w-full bg-transparent px-4 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />

          {/* Inline Action Buttons inside input */}
          <div className="flex items-center gap-1.5 pr-2">
            <button
              type="button"
              onClick={onCaptureScreen}
              disabled={isAnalyzingVision}
              title="Capture & analyze screen"
              className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Microphone Toggle Button */}
        <button
          type="button"
          onClick={onToggleListening}
          className={`relative p-3.5 rounded-2xl transition-all flex items-center justify-center cursor-pointer shadow-lg ${
            isListening
              ? "bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/30 scale-105"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          }`}
          title={isListening ? "Stop listening" : "Start voice listening (or say 'Magic')"}
        >
          {isListening ? (
            <Mic className="w-5 h-5 animate-pulse" />
          ) : (
            <MicOff className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || state === "processing"}
          className="p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all flex items-center justify-center cursor-pointer shadow-lg shadow-indigo-600/20"
          title="Send message"
        >
          {state === "processing" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};
