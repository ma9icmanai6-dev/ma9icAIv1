import React, { useState, useRef, useEffect } from "react";
import { Terminal, Copy, Trash2 } from "lucide-react";
import { SystemService } from "../../services/systemService";

interface OutputLine {
  id: string;
  type: "input" | "output" | "error" | "info";
  text: string;
}

export const TerminalApp: React.FC = () => {
  const [lines, setLines] = useState<OutputLine[]>([
    {
      id: "line-0",
      type: "info",
      text: "Windows PowerShell [Version 10.0.26100.1882]\n(c) Microsoft Corporation. All rights reserved.\nMagic AI Windows Automation Bridge Connected.\nType 'help' or 'magic status' to see available tools.\n",
    },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const newLines: OutputLine[] = [
      ...lines,
      { id: `in-${Date.now()}`, type: "input", text: `PS C:\\Users\\Developer> ${trimmed}` },
    ];

    const lower = trimmed.toLowerCase();
    const metrics = SystemService.getMetrics();

    if (lower === "cls" || lower === "clear") {
      setLines([]);
      return;
    } else if (lower === "help") {
      newLines.push({
        id: `out-${Date.now()}`,
        type: "output",
        text: `Available Windows Commands:
  systeminfo       - Detailed system and hardware specifications
  magic status     - Display Magic AI Engine & Automation status
  dir / ls         - List files in current directory
  mkdir <folder>   - Create new directory
  ipconfig         - Network adapter configuration
  tasklist         - Running Windows processes
  ping <target>    - Test network connectivity
  cls              - Clear console screen`,
      });
    } else if (lower === "systeminfo") {
      newLines.push({
        id: `out-${Date.now()}`,
        type: "output",
        text: `OS Name:                   Microsoft Windows 11 Pro
OS Version:                10.0.26100 Build 26100
System Manufacturer:       Microsoft Corporation
System Model:              Virtual Desktop Enterprise
Processor(s):              1 Processor(s) Installed. [01]: AMD Ryzen 9 7950X 16-Core Processor
Total Physical Memory:     16,384 MB (Available: ${metrics.ramTotal - metrics.ramUsage} GB)
AI Hardware NPU:           DirectML Neural Engine (45 TOPS)
Magic AI Service:          Active (Listening on local socket 0.0.0.0:3000)`,
      });
    } else if (lower.startsWith("magic status")) {
      newLines.push({
        id: `out-${Date.now()}`,
        type: "output",
        text: `[MAGIC DESKTOP SERVICE v1.0.0]
  Wake Word:         Active ("Magic" / 16kHz low-CPU VAD)
  Speech Engine:     British Female Natural Synthesis
  Screen Vision:     Gemini 3.8 Flash Vision OCR Active
  Super AI Control:  Armed with Emergency Kill Switch (CTRL+ALT+ESC)
  Idle CPU Overhead: ${metrics.cpuUsage}% (Target: <2%)
  Memory Footprint:  340 MB (Target: <500MB)`,
      });
    } else if (lower.startsWith("ping")) {
      const host = trimmed.split(" ")[1] || "google.com";
      newLines.push({
        id: `out-${Date.now()}`,
        type: "output",
        text: `Pinging ${host} [142.250.190.46] with 32 bytes of data:
Reply from 142.250.190.46: bytes=32 time=14ms TTL=117
Reply from 142.250.190.46: bytes=32 time=12ms TTL=117
Reply from 142.250.190.46: bytes=32 time=13ms TTL=117
Ping statistics for ${host}:
    Packets: Sent = 3, Received = 3, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 12ms, Maximum = 14ms, Average = 13ms`,
      });
    } else if (lower.startsWith("mkdir")) {
      const folder = trimmed.split(" ")[1] || "NewProject";
      newLines.push({
        id: `out-${Date.now()}`,
        type: "output",
        text: `    Directory: C:\\Users\\Developer\\${folder}\nMode                LastWriteTime         Length Name\n----                -------------         ------ ----\nd-----        ${new Date().toLocaleDateString()}                ${folder}`,
      });
      SystemService.showToast("Directory Created", `Created folder ${folder}`, "success");
    } else if (lower === "dir" || lower === "ls") {
      newLines.push({
        id: `out-${Date.now()}`,
        type: "output",
        text: `    Directory: C:\\Users\\Developer\nMode                LastWriteTime         Length Name\n----                -------------         ------ ----\nd-----        ${new Date().toLocaleDateString()}                RobloxProjects\nd-----        ${new Date().toLocaleDateString()}                Desktop\nd-----        ${new Date().toLocaleDateString()}                Documents\n-a----        ${new Date().toLocaleDateString()}          14234 GameConfig.luau`,
      });
    } else if (lower === "ipconfig") {
      newLines.push({
        id: `out-${Date.now()}`,
        type: "output",
        text: `Windows IP Configuration
Ethernet adapter vEthernet:
   Connection-specific DNS Suffix  . : localdomain
   IPv4 Address. . . . . . . . . . . : 192.168.1.145
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1`,
      });
    } else if (lower === "tasklist") {
      newLines.push({
        id: `out-${Date.now()}`,
        type: "output",
        text: `Image Name                     PID Session Name        Mem Usage
========================= ======== ================ ============
explorer.exe                  1452 Console              84,120 K
MagicAssistant.exe            3210 Console             142,300 K
brave.exe                     4892 Console             210,500 K
notepad.exe                   6124 Console              18,240 K
dwm.exe                       1024 Console              45,600 K`,
      });
    } else {
      newLines.push({
        id: `out-${Date.now()}`,
        type: "output",
        text: `${trimmed} : The term '${trimmed}' is not recognized as the name of a cmdlet, function, or operable program. Check spelling and try again.`,
      });
    }

    setLines(newLines);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCommand(input);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0c0c] text-[#cccccc] font-mono text-xs select-text">
      {/* Terminal Title Bar info */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-white/10 text-[11px] text-slate-400 select-none">
        <div className="flex items-center gap-2 text-sky-400 font-medium">
          <Terminal className="w-3.5 h-3.5" />
          <span>Windows PowerShell (Admin)</span>
        </div>
        <button
          onClick={() => setLines([])}
          title="Clear screen"
          className="p-1 hover:text-white rounded hover:bg-white/5"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 leading-relaxed">
        {lines.map((line) => (
          <div
            key={line.id}
            className={`whitespace-pre-wrap break-words ${
              line.type === "input"
                ? "text-sky-300 font-semibold"
                : line.type === "info"
                ? "text-slate-400"
                : line.type === "error"
                ? "text-rose-400"
                : "text-slate-200"
            }`}
          >
            {line.text}
          </div>
        ))}
        <div ref={endRef} />

        {/* Input prompt */}
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-sky-400 select-none font-semibold">PS C:\Users\Developer&gt;</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white focus:outline-none font-mono text-xs caret-sky-400"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};
