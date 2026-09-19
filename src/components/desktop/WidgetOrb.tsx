import React, { useState } from "react";
import {
  Mic,
  MicOff,
  Maximize2,
  Sparkles,
  Sliders,
  Pin,
  PinOff,
  Shield,
  Zap,
} from "lucide-react";
import { AssistantState } from "../../types";

interface WidgetOrbProps {
  state: AssistantState;
  audioLevel: number;
  isListening: boolean;
  onToggleListening: () => void;
  onExpand: () => void;
  onTriggerKillSwitch: () => void;
  opacity: number;
  onOpacityChange: (val: number) => void;
  isPinned: boolean;
  onTogglePin: () => void;
  superAIActive: boolean;
}

export const WidgetOrb: React.FC<WidgetOrbProps> = ({
  state,
  audioLevel,
  isListening,
  onToggleListening,
  onExpand,
  onTriggerKillSwitch,
  opacity,
  onOpacityChange,
  isPinned,
  onTogglePin,
  superAIActive,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [pos, setPos] = useState({ x: 40, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("input")) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPos({
      x: Math.max(10, Math.min(window.innerWidth - 120, e.clientX - dragOffset.x)),
      y: Math.max(10, Math.min(window.innerHeight - 120, e.clientY - dragOffset.y)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // State color mapping
  const getStateColors = () => {
    switch (state) {
      case "listening":
        return {
          glow: "rgba(56, 189, 248, 0.6)",
          ring: "border-sky-400",
          core: "from-sky-500 to-cyan-400",
          badge: "Listening...",
        };
      case "processing":
        return {
          glow: "rgba(168, 85, 247, 0.6)",
          ring: "border-purple-400 animate-spin",
          core: "from-purple-500 to-indigo-500",
          badge: "Thinking...",
        };
      case "speaking":
        return {
          glow: "rgba(16, 185, 129, 0.6)",
          ring: "border-emerald-400",
          core: "from-emerald-500 to-teal-400",
          badge: "Speaking",
        };
      case "executing":
        return {
          glow: "rgba(245, 158, 11, 0.7)",
          ring: "border-amber-400",
          core: "from-amber-500 to-orange-500",
          badge: "Executing",
        };
      case "error":
        return {
          glow: "rgba(244, 63, 94, 0.6)",
          ring: "border-rose-500",
          core: "from-rose-500 to-red-600",
          badge: "Error",
        };
      case "idle":
      default:
        return {
          glow: "rgba(56, 189, 248, 0.35)",
          ring: "border-sky-500/40",
          core: "from-sky-600 to-indigo-600",
          badge: "Magic Ready",
        };
    }
  };

  const colors = getStateColors();
  const dynamicScale = 1 + audioLevel * 0.35;

  return (
    <div
      id="magic-floating-widget"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        opacity,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed z-40 select-none flex flex-col items-center cursor-grab active:cursor-grabbing"
    >
      {/* Orb Body */}
      <div className="relative flex items-center justify-center">
        {/* Outer Ripple Wave on Audio */}
        {isListening && (
          <div
            className="absolute rounded-full pointer-events-none transition-all duration-75"
            style={{
              width: `${74 * dynamicScale}px`,
              height: `${74 * dynamicScale}px`,
              backgroundColor: colors.glow,
              filter: "blur(14px)",
            }}
          />
        )}

        {/* Outer Animated Ring */}
        <div
          className={`w-16 h-16 rounded-full border-2 p-1 flex items-center justify-center transition-all duration-300 ${colors.ring} shadow-xl`}
          style={{
            boxShadow: `0 0 24px ${colors.glow}`,
          }}
        >
          {/* Core Glowing Orb Button */}
          <button
            onClick={onToggleListening}
            title={isListening ? "Magic is listening... (Click to pause)" : "Click to activate Magic"}
            className={`w-full h-full rounded-full bg-gradient-to-tr ${colors.core} flex items-center justify-center text-white shadow-inner transition-transform active:scale-95`}
          >
            {isListening ? (
              <Mic className="w-6 h-6 animate-pulse" />
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Super AI Active Indicator Shield */}
        {superAIActive && (
          <div
            title="Super AI Control Active"
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border border-slate-900 flex items-center justify-center text-slate-950 shadow"
          >
            <Shield className="w-3 h-3 fill-current" />
          </div>
        )}
      </div>

      {/* State Badge */}
      <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-white/15 backdrop-blur-md shadow-md text-[10px] font-medium text-slate-200 tracking-wide flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            state === "listening"
              ? "bg-sky-400 animate-ping"
              : state === "speaking"
              ? "bg-emerald-400 animate-pulse"
              : state === "executing"
              ? "bg-amber-400 animate-bounce"
              : "bg-sky-400"
          }`}
        />
        <span>{colors.badge}</span>
      </div>

      {/* Quick Hover Controls Toolbelt */}
      {isHovered && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-2 flex items-center gap-1 p-1 bg-slate-900/95 border border-white/20 rounded-xl shadow-2xl backdrop-blur-xl text-slate-300 animate-fadeIn"
        >
          <button
            onClick={onExpand}
            title="Open Full Desktop Companion Window"
            className="p-1.5 hover:text-sky-400 hover:bg-white/10 rounded-lg transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onTogglePin}
            title={isPinned ? "Unpin widget" : "Pin to screen"}
            className={`p-1.5 rounded-lg transition ${
              isPinned ? "text-sky-400 bg-sky-500/20" : "hover:text-white hover:bg-white/10"
            }`}
          >
            {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onToggleListening}
            title={isListening ? "Mute Microphone" : "Unmute Microphone"}
            className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            {isListening ? (
              <MicOff className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Mic className="w-3.5 h-3.5 text-sky-400" />
            )}
          </button>
          <button
            onClick={onTriggerKillSwitch}
            title="Emergency Stop (Ctrl+Alt+Esc)"
            className="p-1.5 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition text-rose-500"
          >
            <Zap className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
