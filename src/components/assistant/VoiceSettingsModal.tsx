import React from "react";
import { X, Volume2, Mic, Play } from "lucide-react";
import { VoiceSettings } from "../../types";
import { VoiceEngine } from "../../services/voiceEngine";

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onSettingsChange: (newSettings: Partial<VoiceSettings>) => void;
  availableVoices: SpeechSynthesisVoice[];
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  availableVoices,
}) => {
  if (!isOpen) return null;

  const handleTestVoice = () => {
    VoiceEngine.speak("Hello! I am Magic, your personal AI voice companion.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Voice & Personality</h3>
              <p className="text-xs text-slate-400">Configure speech engine and wake-word detector</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Body */}
        <div className="mt-5 space-y-4">
          {/* Voice Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Synthesis Voice
            </label>
            <select
              value={settings.voiceName}
              onChange={(e) => {
                onSettingsChange({ voiceName: e.target.value });
                VoiceEngine.setVoice(e.target.value);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="default">Default British Female (Recommended)</option>
              {availableVoices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Speech Rate */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-300">Speech Rate</span>
              <span className="text-indigo-400 font-mono">{settings.rate.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.5"
              step="0.05"
              value={settings.rate}
              onChange={(e) => onSettingsChange({ rate: parseFloat(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Pitch */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-300">Voice Pitch</span>
              <span className="text-indigo-400 font-mono">{settings.pitch.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.4"
              step="0.05"
              value={settings.pitch}
              onChange={(e) => onSettingsChange({ pitch: parseFloat(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Volume */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-300">Volume</span>
              <span className="text-indigo-400 font-mono">{Math.round(settings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={(e) => onSettingsChange({ volume: parseFloat(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Wake Word Detection */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="block text-xs font-medium text-slate-200">Local Wake-Word</span>
              <span className="block text-[11px] text-slate-400">Triggers on "Magic" or "Hey Magic"</span>
            </div>
            <input
              type="checkbox"
              checked={settings.localWakeWordEnabled}
              onChange={(e) => onSettingsChange({ localWakeWordEnabled: e.target.checked })}
              className="w-4 h-4 accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleTestVoice}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-indigo-400" />
            <span>Test Voice</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
