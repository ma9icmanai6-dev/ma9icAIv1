import React, { useState } from "react";
import { Minus, Square, X, Maximize2 } from "lucide-react";
import { WindowApp } from "../../types";

interface AppWindowProps {
  app: WindowApp;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const AppWindow: React.FC<AppWindowProps> = ({
  app,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  children,
  icon,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [pos, setPos] = useState({ x: app.position.x, y: app.position.y });

  if (!app.isOpen || app.isMinimized) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    onFocus();
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || app.isMaximized) return;
    setPos({
      x: Math.max(10, e.clientX - dragOffset.x),
      y: Math.max(10, e.clientY - dragOffset.y),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const style: React.CSSProperties = app.isMaximized
    ? {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: "48px",
        zIndex: app.zIndex,
      }
    : {
        position: "absolute",
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${app.position.width}px`,
        height: `${app.position.height}px`,
        zIndex: app.zIndex,
      };

  return (
    <div
      id={`window-${app.id}`}
      style={style}
      onMouseDown={onFocus}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="flex flex-col rounded-xl overflow-hidden border border-white/20 bg-slate-900/90 backdrop-blur-xl shadow-2xl transition-all select-none"
    >
      {/* Windows 11 Title Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-3.5 py-2.5 bg-slate-800/80 border-b border-white/10 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-sky-400">{icon}</span>}
          <span className="text-xs font-medium text-slate-200 tracking-wide truncate max-w-[200px]">
            {app.title}
          </span>
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-1 -mr-1">
          <button
            id={`btn-min-${app.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            title="Minimize"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            id={`btn-max-${app.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onMaximize();
            }}
            title={app.isMaximized ? "Restore" : "Maximize"}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition"
          >
            {app.isMaximized ? (
              <Square className="w-3 h-3" />
            ) : (
              <Maximize2 className="w-3 h-3" />
            )}
          </button>
          <button
            id={`btn-close-${app.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-rose-600 rounded-md transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Window Body */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-950/60 text-slate-100">
        {children}
      </div>
    </div>
  );
};
