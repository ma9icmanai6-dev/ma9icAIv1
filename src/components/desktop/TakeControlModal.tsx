import React, { useEffect, useRef, useState } from "react";
import { Keyboard, MousePointer2, ShieldCheck, X, Zap } from "lucide-react";

interface TakeControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: string) => void;
  assistantName?: string;
  task: string;
  onTaskChange: (task: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
}

export const TakeControlModal: React.FC<TakeControlModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  assistantName = "Nova",
  task,
  onTaskChange,
  isListening,
  onToggleListening,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!task.trim()) return;
    onSubmit(task.trim());
  };

  return (
    <div className="desktop-modal-backdrop pointer-events-auto fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="desktop-modal-panel w-full max-w-sm overflow-hidden rounded-2xl border border-cyan-300/25 bg-slate-950/95 text-slate-100 shadow-2xl shadow-cyan-950/40"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex min-w-0 gap-2">
            <div className="rounded-lg bg-cyan-400/15 p-2 text-cyan-300">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">Take Control</h2>
              <p className="mt-0.5 truncate text-[10px] text-slate-400">Speak or type what {assistantName} should do.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-1.5 text-rose-200 hover:bg-rose-500/25 hover:text-white" title="Close Take Control" aria-label="Close Take Control">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <textarea
            ref={inputRef}
            value={task}
            onChange={(event) => onTaskChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (task.trim()) {
                  onSubmit(task.trim());
                }
              }
            }}
            rows={3}
            placeholder="Example: Open Edge and search for Nintendo games."
            className="w-full resize-none rounded-xl border border-white/15 bg-slate-900/80 px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/60"
          />

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onToggleListening}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-semibold transition ${
                isListening
                  ? "border-cyan-300/60 bg-cyan-400 text-slate-950"
                  : "border-cyan-300/25 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20"
              }`}
              title={isListening ? "Stop voice task capture" : "Speak your desktop task"}
            >
              <MousePointer2 className="h-3.5 w-3.5" />
              {isListening ? "Listening..." : "Speak task"}
            </button>
            <span className="text-right text-[10px] text-slate-500">Whisper voice input</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <MousePointer2 className="h-3.5 w-3.5 text-cyan-300" />
              <span>Mouse and clicks</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <Keyboard className="h-3.5 w-3.5 text-cyan-300" />
              <span>Keyboard and shortcuts</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-amber-300/20 bg-amber-400/10 px-2.5 py-2 text-[10px] text-amber-100">
            <Zap className="h-3.5 w-3.5 shrink-0 text-amber-300" />
            <span>{assistantName} still asks before controlling the desktop.</span>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
            <span className="text-[10px] text-slate-500">Enter sends</span>
            <div className="flex shrink-0 gap-2">
            <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-[11px] text-slate-400 hover:bg-white/10 hover:text-white">
              Cancel
            </button>
            <button type="submit" disabled={!task.trim()} className="rounded-lg bg-cyan-400 px-3 py-2 text-[11px] font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40">
              Accept and request control
            </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
