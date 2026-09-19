import React from "react";
import { ShieldAlert, Zap, Check, X, MousePointer, Keyboard } from "lucide-react";
import { PermissionLevel } from "../../types";

interface SuperAIPermissionDialogProps {
  isOpen: boolean;
  requestedActionDescription?: string;
  onGrant: (level: PermissionLevel) => void;
  onDeny: () => void;
}

export const SuperAIPermissionDialog: React.FC<SuperAIPermissionDialogProps> = ({
  isOpen,
  requestedActionDescription,
  onGrant,
  onDeny,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl shadow-amber-500/10 overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Banner */}
        <div className="flex items-center gap-3 px-5 py-3.5 bg-amber-500/15 border-b border-amber-500/20 text-amber-300">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">Super AI Control Permission</h3>
            <p className="text-[11px] text-amber-200/80">Automated Keyboard & Mouse Navigation Request</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            Super AI Control allows Magic to move the mouse cursor, click interface elements, input text, and orchestrate multi-step computer tasks on your behalf.
          </p>

          {requestedActionDescription && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-white/10 space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-400">Target Action:</span>
              <p className="text-sky-300 font-medium">{requestedActionDescription}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/40 border border-white/5">
              <MousePointer className="w-3.5 h-3.5 text-amber-400" />
              <span>Mouse automation</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/40 border border-white/5">
              <Keyboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Keyboard automation</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Emergency Kill Switch: Press <strong>CTRL + ALT + ESC</strong> at any moment to cancel.</span>
          </div>

          {/* Action Choice Buttons */}
          <div className="space-y-2 pt-2">
            <button
              id="perm-btn-one-action"
              onClick={() => onGrant("one_action")}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition shadow-md"
            >
              <span>Permit One Action Only</span>
              <Check className="w-4 h-4" />
            </button>
            <button
              id="perm-btn-one-session"
              onClick={() => onGrant("one_session")}
              className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition border border-white/10"
            >
              <span>Permit This Session</span>
              <span className="text-[10px] text-slate-400 font-mono">Until reload</span>
            </button>
            <button
              id="perm-btn-always"
              onClick={() => onGrant("always")}
              className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition border border-white/10"
            >
              <span>Always Allow</span>
              <span className="text-[10px] text-slate-400 font-mono">Full Trust</span>
            </button>
            <button
              id="perm-btn-deny"
              onClick={onDeny}
              className="w-full py-2 text-center text-slate-400 hover:text-rose-400 transition text-[11px]"
            >
              Deny and Cancel Action
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
