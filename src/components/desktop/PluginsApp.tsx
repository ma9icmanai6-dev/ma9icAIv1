import React, { useState } from "react";
import {
  Lightbulb,
  Music,
  CloudSun,
  Image as ImageIcon,
  MessageSquare,
  Mail,
  ToggleLeft,
  ToggleRight,
  Play,
  Pause,
  SkipForward,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { SystemService } from "../../services/systemService";

export const PluginsApp: React.FC = () => {
  // Smart lights
  const [lightsOn, setLightsOn] = useState(true);
  const [lightColor, setLightColor] = useState("#fef08a"); // Warm
  const [lightBrightness, setLightBrightness] = useState(80);

  // Spotify
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTrack, setCurrentTrack] = useState({
    title: "Midnight City (Orchestral)",
    artist: "M83 & London Symphony",
    duration: "4:04",
  });

  // AI Image generator
  const [imagePrompt, setImagePrompt] = useState("Futuristic glass skyscraper in London with neon rain");
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateImage = () => {
    setIsGenerating(true);
    setTimeout(() => {
      // High-resolution artistic placeholder canvas
      setGeneratedImg(
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80"
      );
      setIsGenerating(false);
      SystemService.showToast("Image Generated", `Artwork generated for "${imagePrompt.slice(0, 24)}..."`, "success");
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 text-xs select-none overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div>
          <h2 className="text-sm font-semibold text-white">Magic Plugin Marketplace & Extensions</h2>
          <p className="text-[11px] text-slate-400">Extensible architecture for IoT, Media, Workspace, and Cloud Services</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-medium">
          6 Active Plugins
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Smart Home / Lights */}
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300">
              <Lightbulb className="w-4 h-4" />
              <span className="font-semibold text-xs">Home Automation (Philips Hue)</span>
            </div>
            <button
              onClick={() => {
                setLightsOn(!lightsOn);
                SystemService.showToast("Smart Lights", `Living room lights ${!lightsOn ? "turned ON" : "turned OFF"}`, "info");
              }}
              className="text-amber-400"
            >
              {lightsOn ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6 text-slate-500" />}
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Brightness</span>
              <span className="font-mono text-amber-300">{lightsOn ? `${lightBrightness}%` : "Off"}</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              disabled={!lightsOn}
              value={lightBrightness}
              onChange={(e) => setLightBrightness(parseInt(e.target.value))}
              className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-slate-400 text-[11px]">Ambiance:</span>
            {[
              { label: "Warm White", color: "#fef08a" },
              { label: "Daylight", color: "#e0f2fe" },
              { label: "Neon Cyan", color: "#38bdf8" },
              { label: "Relaxing Amber", color: "#fb923c" },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => setLightColor(p.color)}
                style={{ backgroundColor: p.color }}
                title={p.label}
                className={`w-4 h-4 rounded-full border border-white/20 transition ${
                  lightColor === p.color ? "ring-2 ring-amber-400 scale-110" : ""
                }`}
              />
            ))}
          </div>
        </div>

        {/* Spotify Integration */}
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400">
              <Music className="w-4 h-4" />
              <span className="font-semibold text-xs">Spotify Desktop Companion</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Connected
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shrink-0 shadow-md">
              <Music className="w-6 h-6" />
            </div>
            <div className="flex-1 truncate">
              <div className="font-semibold text-slate-200 truncate">{currentTrack.title}</div>
              <div className="text-[11px] text-slate-400 truncate">{currentTrack.artist}</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition shadow"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              </button>
              <button
                onClick={() => {
                  setCurrentTrack({
                    title: "Time (Hans Zimmer Inception Remix)",
                    artist: "Hans Zimmer & Alan Walker",
                    duration: "3:30",
                  });
                  SystemService.showToast("Spotify", "Skipped to next track", "info");
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">1:42 / {currentTrack.duration}</span>
          </div>
        </div>

        {/* Live Weather Forecast */}
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-400">
              <CloudSun className="w-4 h-4" />
              <span className="font-semibold text-xs">Weather & Atmosphere</span>
            </div>
            <span className="text-slate-400 text-[11px]">London, UK</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-2xl font-bold text-white">18°C</div>
              <div className="text-[11px] text-slate-400">Partly Cloudy • Gentle Breeze</div>
            </div>
            <div className="text-right text-[11px] text-slate-400 space-y-0.5">
              <div>Humidity: 62%</div>
              <div>Wind: 14 km/h WNW</div>
              <div>UV Index: 3 (Moderate)</div>
            </div>
          </div>
        </div>

        {/* AI Image Generation Plugin */}
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-400">
              <ImageIcon className="w-4 h-4" />
              <span className="font-semibold text-xs">AI Studio Image Generator</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Describe an image to generate..."
              className="flex-1 px-2.5 py-1.5 bg-slate-950 rounded-lg border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleGenerateImage}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium transition shrink-0"
            >
              {isGenerating ? "Creating..." : "Generate"}
            </button>
          </div>

          {generatedImg && (
            <div className="relative rounded-lg overflow-hidden border border-white/10 h-28">
              <img
                src={generatedImg}
                alt="AI Generated"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 right-2 text-[10px] bg-black/70 px-1.5 py-0.5 rounded text-white font-medium">
                Gemini Ultra Render
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
