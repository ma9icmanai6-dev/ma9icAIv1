import React, { useEffect, useRef, useState } from "react";
import { Keyboard, MousePointer2, ShieldCheck, X, Zap } from "lucide-react";

interface TakeControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: string) => void;
  assistantName?: string;
}

export const TakeControlModal: React.FC<TakeControlModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  assistantName = "Nova",
}) => {
  const [task, setTask] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTask("");
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!task.trim()) return;
    onSubmit(task.trim());
    setTask("");
  };

  return (
    <div className="desktop-modal-backdrop pointer-events-auto fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="desktop-modal-panel w-full max-w-lg overflow-hidden rounded-3xl border border-cyan-300/25 bg-slate-950/95 text-slate-100 shadow-2xl shadow-cyan-950/40"
      >
        <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
          <div className="flex gap-3">
            <div className="rounded-xl bg-cyan-400/15 p-2.5 text-cyan-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Take Control</h2>
              <p className="mt-1 text-xs text-slate-400">Tell {assistantName} exactly what to do on your desktop.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <textarea
            ref={inputRef}
            value={task}
            onChange={(event) => setTask(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (task.trim()) {
                  onSubmit(task.trim());
                  setTask("");
                }
              }
            }}
            rows={4}
            placeholder="Example: Open Edge, click the search box, search for Nintendo games, and press Enter."
            className="w-full resize-none rounded-2xl border border-white/15 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/60"
          />

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <MousePointer2 className="h-4 w-4 text-cyan-300" />
              <span>Mouse movement and clicks</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <Keyboard className="h-4 w-4 text-cyan-300" />
              <span>Keyboard input and shortcuts</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-100">
            <Zap className="h-4 w-4 shrink-0 text-amber-300" />
            <span>{assistantName} will ask for permission before controlling the desktop.</span>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
            <span className="text-[11px] text-slate-500">Press Enter to send, or Shift+Enter for a new line.</span>
            <div className="flex shrink-0 gap-2">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-xs text-slate-400 hover:bg-white/10 hover:text-white">
              Cancel
            </button>
            <button type="submit" disabled={!task.trim()} className="rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40">
              Send and request control
            </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
