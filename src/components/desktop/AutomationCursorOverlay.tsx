import React, { useEffect, useState } from "react";
import { MousePointer2 } from "lucide-react";
import { AutomationCursorPos, AutomationEngine } from "../../services/automationEngine";

export const AutomationCursorOverlay: React.FC = () => {
  const [cursor, setCursor] = useState<AutomationCursorPos>({
    x: 400,
    y: 300,
    isClicking: false,
    isRightClicking: false,
    isDragging: false,
    visible: false,
  });

  useEffect(() => {
    const cleanup = AutomationEngine.onCursorUpdate((pos) => {
      setCursor(pos);
    });
    return cleanup;
  }, []);

  if (!cursor.visible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 transition-opacity duration-150 select-none"
      style={{
        left: `${cursor.x}px`,
        top: `${cursor.y}px`,
      }}
    >
      <div className="relative">
        {/* Pointer Arrow */}
        <MousePointer2
          className={`w-6 h-6 text-sky-400 drop-shadow-[0_2px_8px_rgba(56,189,248,0.8)] fill-sky-400/90 transition-transform ${
            cursor.isClicking || cursor.isRightClicking ? "scale-90" : "scale-100"
          }`}
        />

        {/* Click Visual Ripple */}
        {(cursor.isClicking || cursor.isRightClicking) && (
          <span className="absolute -top-1 -left-1 w-8 h-8 rounded-full border-2 border-sky-400 animate-ping pointer-events-none" />
        )}

        {/* Action Label Tooltip */}
        {cursor.targetLabel && (
          <div className="absolute left-6 top-2 px-2 py-0.5 rounded-md bg-slate-900/95 border border-sky-500/40 text-[10px] font-medium text-sky-300 whitespace-nowrap shadow-lg backdrop-blur-md">
            {cursor.targetLabel}
          </div>
        )}
      </div>
    </div>
  );
};
