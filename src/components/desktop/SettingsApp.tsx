import React, { useState, useEffect } from "react";
import {
  Volume2,
  Sun,
  Wifi,
  Bluetooth,
  Mic,
  ShieldCheck,
  Zap,
  Sliders,
  Cpu,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { SystemMetrics, VoiceSettings, PermissionLevel, AIConfig } from "../../types";

interface SettingsAppProps {
  metrics: SystemMetrics;
  onVolumeChange: (vol: number) => void;
  onBrightnessChange: (bright: number) => void;
  onToggleWifi: () => void;
  onToggleBluetooth: () => void;
  voiceSettings: VoiceSettings;
  onVoiceSettingsChange: (settings: Partial<VoiceSettings>) => void;
  availableVoices: SpeechSynthesisVoice[];
  permissionLevel: PermissionLevel;
  onPermissionChange: (perm: PermissionLevel) => void;
}

export const SettingsApp: React.FC<SettingsAppProps> = ({
  metrics,
  onVolumeChange,
  onBrightnessChange,
  onToggleWifi,
  onToggleBluetooth,
  voiceSettings,
  onVoiceSettingsChange,
  availableVoices,
  permissionLevel,
  onPermissionChange,
}) => {
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    provider: "ollama",
    ollamaHost: "http://127.0.0.1:11434",
    ollamaModel: "minicpm-v:latest",
    ollamaVisionModel: "minicpm-v:latest",
    geminiModel: "gemini-2.5-flash",
    ollamaOnline: false,
    availableOllamaModels: [],
    hasGeminiKey: false,
  });
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const fetchAiConfig = async () => {
    setIsLoadingConfig(true);
    try {
      const res = await fetch("/api/ai/config");
      if (res.ok) {
        const data = await res.json();
        setAiConfig(data);
      }
    } catch (err) {
      console.error("Failed to load AI config:", err);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  useEffect(() => {
    fetchAiConfig();
  }, []);

  const updateAiConfig = async (partial: Partial<AIConfig>) => {
    const updated = { ...aiConfig, ...partial };
    setAiConfig(updated);
    try {
      setSaveStatus("Saving...");
      const res = await fetch("/api/ai/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      if (res.ok) {
        const data = await res.json();
        setAiConfig(data);
        setSaveStatus("Saved");
        setTimeout(() => setSaveStatus(null), 2000);
      }
    } catch {
      setSaveStatus("Error saving");
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 text-xs select-none overflow-y-auto p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-sky-400" />
          <div>
            <h2 className="text-sm font-semibold text-white">Windows 11 & Magic Settings</h2>
            <p className="text-[11px] text-slate-400">System hardware control, AI model engine, and voice persona</p>
          </div>
        </div>
        {saveStatus && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
            {saveStatus}
          </span>
        )}
      </div>

      {/* AI Model Engine & Local Ollama Config */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-purple-400" /> AI Engine & Local LLM
          </h3>
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                aiConfig.ollamaOnline
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : "bg-rose-500/15 border-rose-500/40 text-rose-300"
              }`}
            >
              {aiConfig.ollamaOnline ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Ollama Online</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                  <span>Ollama Offline</span>
                </>
              )}
            </div>
            <button
              onClick={fetchAiConfig}
              disabled={isLoadingConfig}
              title="Refresh models"
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingConfig ? "animate-spin text-sky-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Provider Switch */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateAiConfig({ provider: "ollama" })}
            className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 ${
              aiConfig.provider === "ollama"
                ? "bg-purple-500/20 border-purple-500/50 text-purple-200"
                : "bg-slate-800/40 border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <Cpu className="w-4 h-4 mt-0.5 text-purple-400 shrink-0" />
            <div>
              <div className="font-semibold text-xs">Local Ollama</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Offline, Private & Local GPU</div>
            </div>
          </button>

          <button
            onClick={() => updateAiConfig({ provider: "gemini" })}
            className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 ${
              aiConfig.provider === "gemini"
                ? "bg-sky-500/20 border-sky-500/50 text-sky-200"
                : "bg-slate-800/40 border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <Zap className="w-4 h-4 mt-0.5 text-sky-400 shrink-0" />
            <div>
              <div className="font-semibold text-xs">Google Gemini</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Cloud API (Gemini 2.5 Flash)</div>
            </div>
          </button>
        </div>

        {/* Ollama Settings Section */}
        {aiConfig.provider === "ollama" && (
          <div className="space-y-2.5 pt-1">
            {/* Ollama Host */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Ollama Endpoint</span>
                <span className="font-mono text-slate-400">{aiConfig.ollamaHost}</span>
              </div>
              <input
                type="text"
                value={aiConfig.ollamaHost}
                onChange={(e) => setAiConfig({ ...aiConfig, ollamaHost: e.target.value })}
                onBlur={(e) => updateAiConfig({ ollamaHost: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-white/15 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 text-xs font-mono"
                placeholder="http://127.0.0.1:11434"
              />
            </div>

            {/* Chat Model Selection */}
            <div className="space-y-1">
              <label className="text-slate-300">Active Chat & Voice Model</label>
              <select
                value={aiConfig.ollamaModel}
                onChange={(e) => updateAiConfig({ ollamaModel: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-white/15 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
              >
                {aiConfig.availableOllamaModels.length > 0 ? (
                  aiConfig.availableOllamaModels.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} ({(m.size / 1024 / 1024 / 1024).toFixed(1)} GB)
                    </option>
                  ))
                ) : (
                  <>
                    <option value="minicpm-v:latest">minicpm-v:latest (Vision + Chat)</option>
                    <option value="qwen2.5-coder:latest">qwen2.5-coder:latest (Task Engine)</option>
                  </>
                )}
              </select>
            </div>

            {/* Vision Model Selection */}
            <div className="space-y-1">
              <label className="text-slate-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-purple-400" /> Screen & Camera Vision Model
              </label>
              <select
                value={aiConfig.ollamaVisionModel}
                onChange={(e) => updateAiConfig({ ollamaVisionModel: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-white/15 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
              >
                {aiConfig.availableOllamaModels.length > 0 ? (
                  aiConfig.availableOllamaModels.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))
                ) : (
                  <option value="minicpm-v:latest">minicpm-v:latest</option>
                )}
              </select>
            </div>
          </div>
        )}
      </div>


      {/* System Hardware Controls */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 space-y-4">
        <h3 className="text-xs font-semibold text-sky-300 uppercase tracking-wider flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5" /> Hardware & Audio Levels
        </h3>

        {/* Volume Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" /> Master Volume
            </span>
            <span className="font-mono font-medium text-sky-400">{metrics.volume}%</span>
          </div>
          <input
            id="settings-volume-slider"
            type="range"
            min="0"
            max="100"
            value={metrics.volume}
            onChange={(e) => onVolumeChange(parseInt(e.target.value))}
            className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Brightness Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-slate-400" /> Screen Brightness
            </span>
            <span className="font-mono font-medium text-amber-400">{metrics.brightness}%</span>
          </div>
          <input
            id="settings-brightness-slider"
            type="range"
            min="20"
            max="100"
            value={metrics.brightness}
            onChange={(e) => onBrightnessChange(parseInt(e.target.value))}
            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Wireless Toggles */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onToggleWifi}
            className={`flex items-center justify-between p-2.5 rounded-lg border transition ${
              metrics.wifiEnabled
                ? "bg-sky-500/15 border-sky-500/40 text-sky-300"
                : "bg-slate-800/60 border-white/5 text-slate-400"
            }`}
          >
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              <span className="font-medium">Wi-Fi</span>
            </div>
            <span className="text-[10px] font-mono uppercase">{metrics.wifiEnabled ? "On" : "Off"}</span>
          </button>

          <button
            onClick={onToggleBluetooth}
            className={`flex items-center justify-between p-2.5 rounded-lg border transition ${
              metrics.bluetoothEnabled
                ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                : "bg-slate-800/60 border-white/5 text-slate-400"
            }`}
          >
            <div className="flex items-center gap-2">
              <Bluetooth className="w-4 h-4" />
              <span className="font-medium">Bluetooth</span>
            </div>
            <span className="text-[10px] font-mono uppercase">{metrics.bluetoothEnabled ? "On" : "Off"}</span>
          </button>
        </div>
      </div>

      {/* Voice & TTS Persona Settings */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 space-y-3.5">
        <h3 className="text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
          <Mic className="w-3.5 h-3.5" /> Voice & Speech Engine (British Female)
        </h3>

        {/* Voice Selector */}
        <div className="space-y-1">
          <label className="text-slate-300">Speech Synthesis Voice</label>
          <select
            value={voiceSettings.voiceName}
            onChange={(e) => onVoiceSettingsChange({ voiceName: e.target.value })}
            className="w-full p-2 bg-slate-950 border border-white/15 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 text-xs"
          >
            <option value="default">Auto-select British female (Recommended)</option>
            {availableVoices.length > 0 ? (
              availableVoices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))
            ) : (
              <option value="default">British Female (Microsoft Hazel / Victoria / Google UK)</option>
            )}
          </select>
        </div>

        {/* Speed & Pitch */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex justify-between text-slate-300">
              <span>Speech Speed</span>
              <span className="font-mono text-sky-400">{voiceSettings.rate.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.4"
              step="0.1"
              value={voiceSettings.rate}
              onChange={(e) => onVoiceSettingsChange({ rate: parseFloat(e.target.value) })}
              className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-slate-300">
              <span>Speech Pitch</span>
              <span className="font-mono text-sky-400">{voiceSettings.pitch.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              value={voiceSettings.pitch}
              onChange={(e) => onVoiceSettingsChange({ pitch: parseFloat(e.target.value) })}
              className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Super AI Control & Security Privilege */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 space-y-3">
        <h3 className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5" /> Super AI Control & Automation Privileges
        </h3>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Super AI Control enables mouse pointer navigation, keystroke entry, and multi-step agent chains.
        </p>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { id: "one_action", label: "One Action", desc: "Single step only" },
            { id: "one_session", label: "One Session", desc: "Until app reload" },
            { id: "always", label: "Always Allow", desc: "Full automation" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => onPermissionChange(opt.id as PermissionLevel)}
              className={`p-2 rounded-xl border text-left transition ${
                permissionLevel === opt.id
                  ? "bg-amber-500/20 border-amber-500/60 text-amber-200"
                  : "bg-slate-800/40 border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <div className="font-semibold text-xs">{opt.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
          <Zap className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Emergency Kill Switch: Press <strong className="font-mono text-white">CTRL + ALT + ESC</strong> at any moment to halt all mouse and keyboard actions.</span>
        </div>
      </div>
    </div>
  );
};
