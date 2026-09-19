import React, { useState } from "react";
import {
  BookOpen,
  Code2,
  Database,
  Shield,
  Layers,
  FileText,
  Download,
  Terminal,
  Cpu,
  X,
  ExternalLink,
} from "lucide-react";

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<
    "architecture" | "schema" | "win32" | "installer" | "sdk" | "manual"
  >("architecture");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-4xl h-[85vh] bg-slate-900 border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800/90 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                Magic AI Desktop Assistant — Production Engineering Deliverables
              </h2>
              <p className="text-[11px] text-slate-400">
                Windows 11 Native Architecture, C#/.NET 9 WinUI 3 Bridge, Win32 Automation, & SQLite Schemas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Nav */}
          <div className="w-56 bg-slate-950/60 border-r border-white/10 p-3 space-y-1 text-xs shrink-0">
            {[
              { id: "architecture", label: "Software Architecture", icon: <Layers className="w-3.5 h-3.5" /> },
              { id: "win32", label: "Win32 & Automation Engine", icon: <Cpu className="w-3.5 h-3.5" /> },
              { id: "schema", label: "Database Schema (SQLite)", icon: <Database className="w-3.5 h-3.5" /> },
              { id: "installer", label: "Installer & Auto-Update", icon: <Terminal className="w-3.5 h-3.5" /> },
              { id: "sdk", label: "Plugin SDK & Security", icon: <Shield className="w-3.5 h-3.5" /> },
              { id: "manual", label: "End-User Guide & Hotkeys", icon: <FileText className="w-3.5 h-3.5" /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition font-medium ${
                  activeSection === item.id
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <span className={activeSection === item.id ? "text-sky-400" : "text-slate-500"}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6 font-mono text-xs space-y-5 text-slate-300 leading-relaxed bg-slate-950/80">
            {activeSection === "architecture" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-sky-400 font-sans">
                  1. Production Software Architecture (.NET 9 & WinUI 3)
                </h3>
                <p className="font-sans text-slate-400 text-xs">
                  Magic uses a decoupled multi-process architecture consisting of a lightweight WinUI 3 desktop overlay, an isolated automation agent runner, and a local NPU/Cloud hybrid AI model pipeline.
                </p>

                <div className="p-3.5 bg-slate-900 rounded-xl border border-white/10 space-y-2">
                  <div className="text-emerald-400 font-semibold font-sans">Architectural Components:</div>
                  <ul className="list-disc pl-5 space-y-1 text-slate-300">
                    <li><strong className="text-white">Magic.UI (WinUI 3 / XAML / Mica):</strong> Always-on-top borderless floating circular widget and expandable companion window with low CPU composition.</li>
                    <li><strong className="text-white">Magic.Core (C# .NET 9 Worker):</strong> Orchestrates continuous voice recognition, local wake-word neural spotting (Porcupine / ONNX Runtime), and task decomposition.</li>
                    <li><strong className="text-white">Magic.Vision (DirectX / Windows.Graphics.Capture):</strong> Zero-latency GPU frame acquisition, Microsoft Windows OCR API, and Gemini 3.8 Flash multimodal reasoning.</li>
                    <li><strong className="text-white">Magic.Automation (UIAutomationClient / P/Invoke):</strong> Safe Win32 input simulator with permission arbitration and hardware kill switch hook.</li>
                    <li><strong className="text-white">Magic.Storage (SQLite & Dapper):</strong> Encrypted local persistence for memories, user preferences, and audit logs.</li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10 font-mono text-[11px] text-sky-300 whitespace-pre">
{`+-------------------------------------------------------------+
|             WinUI 3 Desktop Overlay (Mica/Acrylic)          |
|    [Floating Orb Widget] <---> [Expanded Companion Window]  |
+------------------------------+------------------------------+
                               | IPC (gRPC / Named Pipes)
+------------------------------v------------------------------+
|                     Magic.Core (.NET 9)                     |
|  - Wake Word Spotter ("Magic" ONNX / VAD)                   |
|  - Web / Azure Speech Synthesizer (British Female Voice)    |
|  - Multi-Step Task Planner Engine                           |
|  - Long-Term Memory Service                                 |
+------------------------------+------------------------------+
         |                     |                     |
+--------v-------+    +--------v-------+    +--------v--------+
|  Magic.Vision  |    |  Magic.Auto    |    |  Magic.Storage  |
| Windows OCR &  |    | Win32 Input &  |    | SQLite Local DB |
| Gemini 3.8     |    | UI Automation  |    | Encrypted Keys  |
+----------------+    +----------------+    +-----------------+`}
                </div>
              </div>
            )}

            {activeSection === "win32" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-sky-400 font-sans">
                  2. Win32 APIs & UI Automation Interop (C# P/Invoke)
                </h3>
                <p className="font-sans text-slate-400 text-xs">
                  Native Windows desktop integration using user32.dll, UIAutomationClient, and low-level keyboard/mouse hooks:
                </p>

                <div className="p-3.5 bg-slate-900 rounded-xl border border-white/10 text-[11px] space-y-2 text-slate-300">
                  <div className="text-sky-400 font-semibold font-sans">C# SendInput & Low-Level Hook Implementation:</div>
                  <pre className="text-slate-300 overflow-x-auto">
{`[DllImport("user32.dll", SetLastError = true)]
public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

[DllImport("user32.dll")]
public static extern bool SetCursorPos(int X, int Y);

[DllImport("user32.dll")]
public static extern IntPtr SetWindowsHookEx(int idHook, LowLevelProc lpfn, IntPtr hMod, uint dwThreadId);

// Emergency Kill Switch: Low-Level Keyboard Hook for CTRL + ALT + ESC
private IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam) {
    if (nCode >= 0 && wParam == (IntPtr)WM_KEYDOWN) {
        int vkCode = Marshal.ReadInt32(lParam);
        bool ctrl = (GetKeyState(VK_CONTROL) & 0x8000) != 0;
        bool alt = (GetKeyState(VK_MENU) & 0x8000) != 0;
        if (ctrl && alt && vkCode == VK_ESCAPE) {
            EmergencyKillSwitch.Trigger();
            return (IntPtr)1; // Suppress and abort
        }
    }
    return CallNextHookEx(_hookID, nCode, wParam, lParam);
}`}
                  </pre>
                </div>
              </div>
            )}

            {activeSection === "schema" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-sky-400 font-sans">
                  3. SQLite Local Database Schema
                </h3>
                <div className="p-3.5 bg-slate-900 rounded-xl border border-white/10 text-[11px] space-y-2 text-slate-300">
                  <pre className="overflow-x-auto text-sky-300">
{`-- AI Memories Table
CREATE TABLE IF NOT EXISTS Memories (
    Id TEXT PRIMARY KEY,
    Category TEXT NOT NULL,          -- 'preference', 'routine', 'application', 'website'
    KeyName TEXT NOT NULL,
    Content TEXT NOT NULL,
    MemoryLevel TEXT NOT NULL,       -- 'session', 'persistent', 'long_term'
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Conversation History Table
CREATE TABLE IF NOT EXISTS ChatHistory (
    Id TEXT PRIMARY KEY,
    SessionId TEXT NOT NULL,
    Role TEXT NOT NULL,              -- 'user', 'assistant', 'system'
    SpokenText TEXT NOT NULL,
    ActionPayload TEXT,              -- JSON structured command
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Security & Automation Audit Log
CREATE TABLE IF NOT EXISTS AuditLogs (
    Id TEXT PRIMARY KEY,
    ActionType TEXT NOT NULL,        -- 'MOUSE_CLICK', 'KEYBOARD_TYPE', 'FILE_WRITE'
    TargetProcess TEXT,              -- 'notepad.exe', 'brave.exe'
    UserPermissionLevel TEXT,        -- 'one_action', 'one_session', 'always'
    ExecutedStatus TEXT,             -- 'success', 'killed', 'denied'
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);`}
                  </pre>
                </div>
              </div>
            )}

            {activeSection === "installer" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-sky-400 font-sans">
                  4. Windows MSIX & Inno Setup Deployment Script
                </h3>
                <div className="p-3.5 bg-slate-900 rounded-xl border border-white/10 text-[11px] space-y-2">
                  <pre className="overflow-x-auto text-slate-300">
{`[Setup]
AppName=Magic AI Desktop Assistant
AppVersion=1.0.0
DefaultDirName={autopf}\\MagicAI
DefaultGroupName=Magic Assistant
OutputBaseFilename=MagicAssistant_Setup_x64
Compression=lzma2/ultra64
SolidCompression=yes
ArchitecturesAllowed=x64
PrivilegesRequired=lowest

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "startup"; Description: "Start Magic Assistant when Windows launches"

[Files]
Source: "bin\\Release\\net9.0-windows10.0.26100\\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs

[Icons]
Name: "{group}\\Magic AI Assistant"; Filename: "{app}\\MagicAssistant.exe"
Name: "{autodesktop}\\Magic AI Assistant"; Filename: "{app}\\MagicAssistant.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\\MagicAssistant.exe"; Description: "{cm:LaunchProgram,Magic AI}"; Flags: nowait postinstall`}
                  </pre>
                </div>
              </div>
            )}

            {activeSection === "sdk" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-sky-400 font-sans">
                  5. Plugin Architecture SDK & Security Sandbox
                </h3>
                <p className="font-sans text-slate-400 text-xs">
                  Every plugin executes in a secure AppContainer sandbox with strict capability declarations:
                </p>
                <div className="p-3.5 bg-slate-900 rounded-xl border border-white/10 text-[11px] space-y-2">
                  <pre className="overflow-x-auto text-emerald-300">
{`public interface IMagicPlugin {
    string PluginId { get; }
    string DisplayName { get; }
    PluginCapability Capabilities { get; } // NetworkAccess, SystemVolume, MediaPlayback
    Task InitializeAsync(IMagicPluginContext context);
    Task<PluginResult> ExecuteVoiceIntentAsync(string intent, Dictionary<string, object> parameters);
    Task ShutdownAsync();
}`}
                  </pre>
                </div>
              </div>
            )}

            {activeSection === "manual" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-sky-400 font-sans">
                  6. End-User Guide & Voice Commands
                </h3>
                <div className="space-y-2.5 font-sans text-xs">
                  <div className="p-3 bg-slate-900 rounded-xl border border-white/10 space-y-1">
                    <div className="font-semibold text-white">Wake Word:</div>
                    <p className="text-slate-400">Say <strong className="text-sky-400">"Magic"</strong>, <strong className="text-sky-400">"Hey Magic"</strong>, or click the glowing orb.</p>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-white/10 space-y-1">
                    <div className="font-semibold text-white">Key Voice Commands:</div>
                    <ul className="list-disc pl-5 space-y-1 text-slate-300">
                      <li><em>"Magic open Brave"</em> or <em>"Magic open Brave and go to Google"</em></li>
                      <li><em>"Magic search for pizza recipes"</em></li>
                      <li><em>"Magic what is on my screen?"</em></li>
                      <li><em>"Magic open Notepad and type Hello World"</em></li>
                      <li><em>"Magic create a folder for my Roblox project"</em></li>
                      <li><em>"Magic open Brave, go to YouTube, search for Roblox Studio tutorials"</em></li>
                      <li><em>"Magic show my memories"</em> or <em>"Magic remember this"</em></li>
                      <li><em>"Magic adjust volume to 80%"</em></li>
                    </ul>
                  </div>

                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1 text-rose-300">
                    <div className="font-semibold text-white">Emergency Kill Switch:</div>
                    <p>Press <strong className="font-mono text-white bg-rose-950 px-2 py-0.5 rounded">CTRL + ALT + ESC</strong> at any moment to halt all mouse and keyboard actions instantly.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
