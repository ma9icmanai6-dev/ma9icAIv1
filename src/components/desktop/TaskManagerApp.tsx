import React, { useState } from "react";
import { Activity, Cpu, HardDrive, Wifi, ShieldAlert, Sparkles } from "lucide-react";
import { SystemMetrics } from "../../types";

interface TaskManagerAppProps {
  metrics: SystemMetrics;
}

export const TaskManagerApp: React.FC<TaskManagerAppProps> = ({ metrics }) => {
  const [activeTab, setActiveTab] = useState<"processes" | "performance">("processes");
  const [processes, setProcesses] = useState([
    { name: "Magic AI Desktop Assistant", pid: 3210, cpu: `${metrics.cpuUsage}%`, mem: "340 MB", status: "Active (Listening)" },
    { name: "Brave Browser (12 tabs)", pid: 4892, cpu: "1.4%", mem: "520 MB", status: "Running" },
    { name: "Windows Explorer (explorer.exe)", pid: 1452, cpu: "0.4%", mem: "112 MB", status: "Running" },
    { name: "Desktop Window Manager (dwm.exe)", pid: 1024, cpu: "0.8%", mem: "68 MB", status: "Running" },
    { name: "Roblox Studio Bridge (RobloxStudio.exe)", pid: 7215, cpu: "0.1%", mem: "210 MB", status: "Suspended" },
    { name: "Notepad (notepad.exe)", pid: 6124, cpu: "0.0%", mem: "18 MB", status: "Running" },
  ]);

  const handleEndTask = (pid: number) => {
    setProcesses(processes.filter((p) => p.pid !== pid));
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 text-xs select-none">
      {/* Tab bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-white/10">
        <button
          onClick={() => setActiveTab("processes")}
          className={`px-3 py-1 rounded-md font-medium transition ${
            activeTab === "processes" ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : "text-slate-400 hover:text-white"
          }`}
        >
          Processes
        </button>
        <button
          onClick={() => setActiveTab("performance")}
          className={`px-3 py-1 rounded-md font-medium transition ${
            activeTab === "performance" ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : "text-slate-400 hover:text-white"
          }`}
        >
          Performance
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === "processes" ? (
          <div className="space-y-2">
            <div className="grid grid-cols-12 px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/10">
              <div className="col-span-5">Name</div>
              <div className="col-span-2">PID</div>
              <div className="col-span-2">CPU</div>
              <div className="col-span-2">Memory</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            <div className="space-y-1">
              {processes.map((proc) => (
                <div
                  key={proc.pid}
                  className="grid grid-cols-12 items-center px-3 py-2 rounded-lg bg-slate-900/50 hover:bg-slate-800/80 border border-white/5 text-slate-200 transition"
                >
                  <div className="col-span-5 flex items-center gap-2 truncate">
                    {proc.name.includes("Magic") ? (
                      <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0 animate-pulse" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className="truncate font-medium">{proc.name}</span>
                  </div>
                  <div className="col-span-2 font-mono text-slate-400">{proc.pid}</div>
                  <div className="col-span-2 font-mono text-sky-400">{proc.cpu}</div>
                  <div className="col-span-2 font-mono text-slate-300">{proc.mem}</div>
                  <div className="col-span-1 text-right">
                    <button
                      onClick={() => handleEndTask(proc.pid)}
                      className="text-[11px] text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded hover:bg-rose-500/10 transition"
                    >
                      End
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* CPU Metric Card */}
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sky-400">
                  <Cpu className="w-4 h-4" />
                  <span className="font-semibold text-sm">CPU Utilization</span>
                </div>
                <span className="text-xl font-bold font-mono text-white">{metrics.cpuUsage}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, metrics.cpuUsage * 10)}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 flex justify-between">
                <span>Idle Benchmark: &lt;2.0%</span>
                <span className="text-emerald-400 font-medium">Optimal Target Met</span>
              </div>
            </div>

            {/* Memory Card */}
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Activity className="w-4 h-4" />
                  <span className="font-semibold text-sm">Memory</span>
                </div>
                <span className="text-xl font-bold font-mono text-white">
                  {metrics.ramUsage.toFixed(1)} / {metrics.ramTotal} GB
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(metrics.ramUsage / metrics.ramTotal) * 100}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 flex justify-between">
                <span>Magic Footprint: 340 MB</span>
                <span className="text-emerald-400 font-medium">Target &lt;500MB Met</span>
              </div>
            </div>

            {/* GPU Card */}
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <HardDrive className="w-4 h-4" />
                  <span className="font-semibold text-sm">GPU Engine (DirectX 12)</span>
                </div>
                <span className="text-xl font-bold font-mono text-white">{metrics.gpuUsage}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, metrics.gpuUsage * 5)}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400">
                <span>Hardware Acceleration Active for Acrylic / Mica Compositing</span>
              </div>
            </div>

            {/* Network Card */}
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400">
                  <Wifi className="w-4 h-4" />
                  <span className="font-semibold text-sm">Network Adapter</span>
                </div>
                <span className="text-sm font-medium font-mono text-emerald-400">
                  {metrics.networkStatus.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-slate-300 font-mono">
                {metrics.networkType} • Real-Time Socket
              </div>
              <div className="text-[11px] text-slate-400">
                Low Latency Gemini 3.8 Flash Streaming Connected
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
