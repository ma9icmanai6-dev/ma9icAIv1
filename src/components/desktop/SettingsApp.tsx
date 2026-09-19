import React from "react";
import {
  Volume2,
  Sun,
  Wifi,
  Bluetooth,
  Mic,
  ShieldCheck,
  Zap,
  Sliders,
} from "lucide-react";
import { SystemMetrics, VoiceSettings, PermissionLevel } from "../../types";

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
  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 text-xs select-none overflow-y-auto p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
        <Sliders className="w-5 h-5 text-sky-400" />
        <div>
          <h2 className="text-sm font-semibold text-white">Windows 11 & Magic Settings</h2>
          <p className="text-[11px] text-slate-400">System hardware control, voice persona, and automation privileges</p>
        </div>
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
