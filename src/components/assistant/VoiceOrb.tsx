import React from "react";
import { motion } from "motion/react";
import { Mic, MicOff, Volume2, Sparkles, Loader2 } from "lucide-react";
import { AssistantState } from "../../types";

interface VoiceOrbProps {
  state: AssistantState;
  audioLevel: number;
  isListening: boolean;
  onToggleListening: () => void;
  onStopSpeaking?: () => void;
  onClickOrb?: () => void;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  audioLevel,
  isListening,
  onToggleListening,
  onStopSpeaking,
  onClickOrb,
}) => {
  // Audio reactivity factor
  const clampedLevel = Math.min(1, Math.max(0, audioLevel || 0));
  const reactiveScale = 1 + clampedLevel * 0.35;

  const handleClick = () => {
    if (state === "speaking" && onStopSpeaking) {
      onStopSpeaking();
    } else if (onClickOrb) {
      onClickOrb();
    } else {
      onToggleListening();
    }
  };

  const getStatusText = () => {
    switch (state) {
      case "listening":
        return "Listening to your voice... (Speak now)";
      case "processing":
        return "Thinking & synthesizing response...";
      case "speaking":
        return "Magic is speaking (Click to stop)";
      case "executing":
        return "Executing plan actions...";
      case "error":
        return "Connection interrupted. Click to retry.";
      case "idle":
      default:
        return isListening
          ? "Listening... Say 'Magic' or click orb"
          : "Click orb or say 'Magic' to wake";
    }
  };

  const getStateTheme = () => {
    switch (state) {
      case "listening":
        return {
          glow: "from-cyan-500/40 via-teal-500/30 to-emerald-500/20",
          core: "from-cyan-400 via-teal-500 to-emerald-500",
          border: "border-cyan-400/60",
          text: "text-cyan-400",
          badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
        };
      case "processing":
        return {
          glow: "from-indigo-500/40 via-purple-500/30 to-pink-500/20",
          core: "from-indigo-400 via-purple-500 to-pink-500",
          border: "border-purple-400/60",
          text: "text-purple-400",
          badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
        };
      case "speaking":
        return {
          glow: "from-fuchsia-500/40 via-indigo-500/30 to-sky-500/20",
          core: "from-fuchsia-400 via-indigo-500 to-sky-400",
          border: "border-fuchsia-400/60",
          text: "text-fuchsia-400",
          badge: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40",
        };
      case "error":
        return {
          glow: "from-rose-500/40 via-red-500/30 to-orange-500/20",
          core: "from-rose-400 via-red-500 to-orange-500",
          border: "border-rose-400/60",
          text: "text-rose-400",
          badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        };
      default:
        return {
          glow: "from-indigo-500/20 via-sky-500/15 to-teal-500/10",
          core: "from-indigo-500 via-cyan-500 to-teal-400",
          border: "border-indigo-500/30",
          text: "text-indigo-300",
          badge: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
        };
    }
  };

  const theme = getStateTheme();

  return (
    <div className="flex flex-col items-center justify-center py-4 px-2 select-none">
      {/* Interactive Orb Canvas */}
      <div className="relative flex items-center justify-center cursor-pointer group" onClick={handleClick}>
        {/* Outer ambient glow */}
        <motion.div
          animate={{
            scale: state === "listening" ? [1, reactiveScale * 1.15, 1] : [1, 1.08, 1],
            opacity: state === "listening" ? [0.4, 0.7, 0.4] : [0.25, 0.45, 0.25],
          }}
          transition={{
            duration: state === "listening" ? 0.8 : 3.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute w-56 h-56 rounded-full bg-gradient-to-tr ${theme.glow} blur-2xl pointer-events-none`}
        />

        {/* Outer orbital rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: state === "processing" ? 4 : 22,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute w-44 h-44 rounded-full border border-slate-700/50 border-dashed pointer-events-none"
        />

        {state === "listening" && (
          <motion.div
            animate={{
              scale: [1, 1.35 + clampedLevel * 0.4, 1.6],
              opacity: [0.6, 0.2, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
            className={`absolute w-36 h-36 rounded-full border-2 ${theme.border} pointer-events-none`}
          />
        )}

        {/* Middle harmonic ring */}
        <motion.div
          animate={{
            scale: state === "speaking" ? [1, 1.12, 0.98, 1.08, 1] : 1,
            rotate: state === "speaking" ? [0, 90, 180, 270, 360] : 0,
          }}
          transition={{
            duration: state === "speaking" ? 2 : 0,
            repeat: state === "speaking" ? Infinity : 0,
            ease: "easeInOut",
          }}
          className={`relative w-36 h-36 rounded-full p-[2px] bg-gradient-to-tr ${theme.core} shadow-2xl transition-all duration-300 group-hover:scale-105`}
        >
          {/* Inner core body */}
          <div className="w-full h-full rounded-full bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden border border-white/10 relative">
            {/* Fluid inner radial lights */}
            <motion.div
              animate={{
                scale: state === "listening" ? [0.8, 1.25, 0.9] : [0.9, 1.1, 0.9],
                opacity: state === "listening" ? [0.5, 0.9, 0.5] : [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: state === "listening" ? 1 : 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`absolute inset-0 bg-gradient-to-tr ${theme.core} opacity-30 rounded-full blur-md`}
            />

            {/* Icon representation inside Orb */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              {state === "processing" ? (
                <Loader2 className="w-9 h-9 text-purple-300 animate-spin" />
              ) : state === "speaking" ? (
                <Volume2 className="w-9 h-9 text-fuchsia-300 animate-pulse" />
              ) : state === "listening" ? (
                <div className="flex items-center gap-1">
                  {[40, 75, 100, 60, 30].map((height, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: [6, Math.max(8, height * (0.3 + clampedLevel * 0.7)), 6],
                      }}
                      transition={{
                        duration: 0.4 + i * 0.08,
                        repeat: Infinity,
                        repeatType: "reverse",
                      }}
                      className="w-1 bg-cyan-300 rounded-full"
                    />
                  ))}
                </div>
              ) : isListening ? (
                <Mic className="w-9 h-9 text-cyan-400 group-hover:scale-110 transition-transform" />
              ) : (
                <Sparkles className="w-9 h-9 text-indigo-300 group-hover:scale-110 transition-transform" />
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Dynamic Status Caption & Hint */}
      <div className="mt-4 flex flex-col items-center text-center">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${theme.badge}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              state === "listening"
                ? "bg-cyan-400 animate-ping"
                : state === "speaking"
                ? "bg-fuchsia-400 animate-pulse"
                : state === "processing"
                ? "bg-purple-400 animate-spin"
                : "bg-indigo-400"
            }`}
          />
          {getStatusText()}
        </span>

        <p className="text-xs text-slate-400 mt-1.5 max-w-sm">
          Natural British voice persona • Continuous wake-word engine • Multimodal screen reasoning
        </p>
      </div>
    </div>
  );
};
