import React, { useState } from "react";
import { X, Eye, Copy, Check, Sparkles, LayoutList, Layers } from "lucide-react";
import { VisionDetection } from "../../types";

interface VisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  vision: VisionDetection | null;
  thumbnailUrl?: string;
  onActionClick?: (action: string) => void;
}

export const VisionModal: React.FC<VisionModalProps> = ({
  isOpen,
  onClose,
  vision,
  thumbnailUrl,
  onActionClick,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !vision) return null;

  const handleCopyOCR = () => {
    if (vision.extractedText) {
      navigator.clipboard.writeText(vision.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Multimodal Vision Analysis</h3>
              <p className="text-xs text-slate-400">Powered by Gemini 3.8 Flash Multimodal OCR</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable Area */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Spoken Summary */}
          <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Assistant Perception</span>
            <p className="text-sm text-slate-200 mt-1 leading-relaxed">{vision.summary}</p>
          </div>

          {/* Screenshot Thumbnail if available */}
          {thumbnailUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <img
                src={thumbnailUrl}
                alt="Captured screen frame"
                className="w-full max-h-56 object-cover object-top"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Active Windows & Applications */}
          {vision.openWindows && vision.openWindows.length > 0 && (
            <div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Detected Applications & Focus
              </span>
              <div className="flex flex-wrap gap-1.5">
                {vision.openWindows.map((app, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detected Elements Grid */}
          {vision.detectedElements && vision.detectedElements.length > 0 && (
            <div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                <LayoutList className="w-3.5 h-3.5 text-emerald-400" />
                Interactive UI Elements Identified ({vision.detectedElements.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {vision.detectedElements.map((el, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="uppercase font-semibold text-indigo-300">{el.type}</span>
                      <span>{el.location}</span>
                    </div>
                    <p className="font-medium text-slate-200 truncate">{el.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Text (OCR) */}
          {vision.extractedText && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-300">Extracted Text (OCR)</span>
                <button
                  onClick={handleCopyOCR}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy text</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-36 overflow-y-auto">
                {vision.extractedText}
              </div>
            </div>
          )}

          {/* Suggested Actions */}
          {vision.suggestedActions && vision.suggestedActions.length > 0 && (
            <div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Recommended Next Steps
              </span>
              <div className="flex flex-wrap gap-2">
                {vision.suggestedActions.map((act, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (onActionClick) onActionClick(act);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-indigo-300 transition-colors cursor-pointer"
                  >
                    {act}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
