import React, { useState } from "react";
import {
  Globe,
  FileText,
  Calculator,
  Paintbrush,
  Folder,
  Terminal,
  Activity,
  Settings,
  Grid,
  Search,
  Wifi,
  Volume2,
  Battery,
  BatteryCharging,
  Zap,
  Sparkles,
  BookOpen,
  Sliders,
  Shield,
} from "lucide-react";
import { SystemMetrics, WindowApp } from "../../types";
import { WindowsToast } from "../../services/systemService";

interface WindowsDesktopProps {
  metrics: SystemMetrics;
  windows: WindowApp[];
  onOpenApp: (appName: WindowApp["name"]) => void;
  onFocusWindow: (id: string) => void;
  onOpenDocs: () => void;
  toasts: WindowsToast[];
  onDismissToast: (id: string) => void;
  onTriggerKillSwitch: () => void;
  superAIActive: boolean;
  children: React.ReactNode;
}

export const WindowsDesktop: React.FC<WindowsDesktopProps> = ({
  metrics,
  windows,
  onOpenApp,
  onFocusWindow,
  onOpenDocs,
  toasts,
  onDismissToast,
  onTriggerKillSwitch,
  superAIActive,
  children,
}) => {
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const desktopIcons = [
    { name: "brave", label: "Brave Browser", icon: <Globe className="w-8 h-8 text-amber-400" /> },
    { name: "notepad", label: "Notepad", icon: <FileText className="w-8 h-8 text-sky-400" /> },
    { name: "calculator", label: "Calculator", icon: <Calculator className="w-8 h-8 text-emerald-400" /> },
    { name: "paint", label: "Paint Studio", icon: <Paintbrush className="w-8 h-8 text-rose-400" /> },
    { name: "files", label: "File Explorer", icon: <Folder className="w-8 h-8 text-amber-300" /> },
    { name: "terminal", label: "PowerShell", icon: <Terminal className="w-8 h-8 text-indigo-400" /> },
    { name: "taskmgr", label: "Task Manager", icon: <Activity className="w-8 h-8 text-teal-400" /> },
    { name: "settings", label: "Settings", icon: <Settings className="w-8 h-8 text-slate-300" /> },
    { name: "discord", label: "Plugin Hub", icon: <Sliders className="w-8 h-8 text-purple-400" /> },
  ];

  return (
    <div
      id="windows-11-desktop"
      className="relative w-screen h-screen overflow-hidden select-none bg-slate-950 font-sans"
      style={{
        filter: `brightness(${metrics.brightness}%)`,
      }}
    >
      {/* Windows 11 Bloom Dark Wallpaper */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0c1322] via-[#0f172a] to-[#1e1b4b] overflow-hidden pointer-events-none">
        {/* Luminous Bloom petals effect */}
        <div className="absolute -top-[15%] left-[20%] w-[650px] h-[650px] rounded-full bg-sky-600/15 blur-[120px]" />
        <div className="absolute top-[30%] right-[15%] w-[550px] h-[550px] rounded-full bg-indigo-600/15 blur-[140px]" />
        <div className="absolute -bottom-[20%] left-[35%] w-[700px] h-[700px] rounded-full bg-purple-600/10 blur-[150px]" />
      </div>

      {/* Desktop App Icons Grid */}
      <div className="relative z-10 p-6 grid grid-flow-col grid-rows-6 gap-6 w-max">
        {desktopIcons.map((item) => (
          <div
            key={item.name}
            id={`desktop-icon-${item.name}`}
            onDoubleClick={() => onOpenApp(item.name as any)}
            onClick={() => onOpenApp(item.name as any)}
            className="group flex flex-col items-center justify-center p-2 rounded-xl hover:bg-white/10 active:bg-white/15 cursor-pointer w-20 transition text-center"
          >
            <div className="p-1 rounded-xl bg-slate-900/60 border border-white/10 group-hover:border-sky-500/40 shadow-md group-hover:scale-105 transition-transform">
              {item.icon}
            </div>
            <span className="text-[11px] font-medium text-slate-200 mt-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-2">
              {item.label}
            </span>
          </div>
        ))}

        {/* Architecture & Deliverables Docs Icon */}
        <div
          id="desktop-icon-docs"
          onClick={onOpenDocs}
          className="group flex flex-col items-center justify-center p-2 rounded-xl hover:bg-white/10 active:bg-white/15 cursor-pointer w-20 transition text-center"
        >
          <div className="p-1 rounded-xl bg-slate-900/60 border border-white/10 group-hover:border-sky-500/40 shadow-md group-hover:scale-105 transition-transform">
            <BookOpen className="w-8 h-8 text-sky-400" />
          </div>
          <span className="text-[11px] font-medium text-sky-300 mt-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-2">
            Engineering Docs
          </span>
        </div>
      </div>

      {/* Desktop App Windows Area */}
      <div className="absolute inset-0 bottom-12 pointer-events-auto overflow-hidden">
        {children}
      </div>

      {/* Start Menu Popup */}
      {startMenuOpen && (
        <div
          id="windows-start-menu"
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-14 left-1/2 -translate-x-1/2 w-[540px] max-h-[500px] z-50 bg-slate-900/90 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-5 text-slate-100 flex flex-col space-y-4 animate-in slide-in-from-bottom-5 duration-150"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search apps, settings, and documents..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Pinned Applications
            </div>
            <div className="grid grid-cols-4 gap-3">
              {desktopIcons.map((app) => (
                <button
                  key={app.name}
                  onClick={() => {
                    onOpenApp(app.name as any);
                    setStartMenuOpen(false);
                  }}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl hover:bg-white/10 transition text-center group"
                >
                  <div className="scale-90 group-hover:scale-100 transition-transform">
                    {app.icon}
                  </div>
                  <span className="text-xs font-medium text-slate-300 mt-1 truncate w-full">
                    {app.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow">
                M
              </div>
              <div className="text-left">
                <div className="font-semibold text-white">Developer User</div>
                <div className="text-[10px] text-slate-400">Windows 11 Pro</div>
              </div>
            </div>

            <button
              onClick={() => {
                onOpenDocs();
                setStartMenuOpen(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 transition text-xs font-medium"
            >
              System Specs & Architecture
            </button>
          </div>
        </div>
      )}

      {/* Windows 11 Centered Taskbar */}
      <div
        id="windows-11-taskbar"
        className="absolute bottom-0 inset-x-0 h-12 z-50 bg-slate-900/85 backdrop-blur-2xl border-t border-white/10 flex items-center justify-between px-4"
      >
        {/* Left widget: Weather / Magic NPU Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-white/5 text-[11px] text-slate-300 hover:bg-white/5 cursor-pointer transition">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-medium hidden sm:inline">Magic AI:</span>
            <span className="text-sky-300 font-mono">Ready (Idle: {metrics.cpuUsage}%)</span>
          </div>

          {superAIActive && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
              <Shield className="w-3 h-3" />
              <span>Super AI Armed</span>
            </div>
          )}
        </div>

        {/* Centered App Taskbar Icons */}
        <div className="flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
          {/* Windows Start Button */}
          <button
            id="taskbar-btn-start"
            onClick={() => setStartMenuOpen(!startMenuOpen)}
            title="Start Menu"
            className={`p-2 rounded-lg transition hover:bg-white/10 ${
              startMenuOpen ? "bg-white/15 text-sky-400" : "text-sky-400"
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>

          {/* Quick Launch Icons with running underline */}
          {desktopIcons.map((app) => {
            const openWin = windows.find((w) => w.name === app.name && w.isOpen);
            return (
              <button
                key={app.name}
                id={`taskbar-icon-${app.name}`}
                onClick={() => {
                  if (openWin) {
                    onFocusWindow(openWin.id);
                  } else {
                    onOpenApp(app.name as any);
                  }
                }}
                className={`relative p-2 rounded-lg hover:bg-white/10 transition group ${
                  openWin ? "bg-white/5" : ""
                }`}
                title={app.label}
              >
                <div className="scale-75">{app.icon}</div>
                {openWin && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-0.5 rounded-full bg-sky-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right System Tray */}
        <div className="flex items-center gap-2 text-slate-300 text-xs">
          {/* Emergency Kill Switch Hotkey Button */}
          <button
            id="taskbar-btn-emergency-stop"
            onClick={onTriggerKillSwitch}
            title="Emergency Kill Switch (CTRL + ALT + ESC)"
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition text-[10px] font-mono font-semibold"
          >
            <Zap className="w-3 h-3 text-rose-400" />
            <span className="hidden md:inline">KILL SWITCH</span>
          </button>

          {/* Hardware status icons */}
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 cursor-pointer transition">
            <Wifi className={`w-3.5 h-3.5 ${metrics.wifiEnabled ? "text-sky-400" : "text-slate-500"}`} />
            <Volume2 className="w-3.5 h-3.5 text-slate-300" />
            <div className="flex items-center gap-1">
              {metrics.isCharging ? (
                <BatteryCharging className="w-4 h-4 text-emerald-400" />
              ) : (
                <Battery className="w-4 h-4 text-slate-300" />
              )}
              <span className="text-[10px] font-mono">{metrics.batteryLevel || 100}%</span>
            </div>
          </div>

          {/* Clock */}
          <div className="text-right px-2 py-1 rounded-lg hover:bg-white/5 cursor-pointer transition">
            <div className="font-medium text-xs text-white">{currentTime}</div>
            <div className="text-[9px] text-slate-400">
              {new Date().toLocaleDateString([], { month: "numeric", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>
      </div>

      {/* Windows 11 Toast Notifications Corner */}
      <div className="absolute right-4 bottom-14 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map((toast, index) => (
          <div
            key={toast.id ? `${toast.id}-${index}` : `toast-${index}`}
            className="pointer-events-auto p-3 rounded-xl bg-slate-900/95 border border-white/20 shadow-2xl backdrop-blur-xl text-slate-100 flex items-start justify-between gap-3 animate-in slide-in-from-right duration-200"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>{toast.title}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismissToast(toast.id)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
