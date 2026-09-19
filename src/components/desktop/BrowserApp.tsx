import React, { useState, useEffect } from "react";
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Search,
  ShieldCheck,
  Plus,
  ExternalLink,
  Youtube,
  Utensils,
  Sparkles,
} from "lucide-react";

interface BrowserAppProps {
  initialUrl?: string;
  initialQuery?: string;
  onAddressBarFocus?: () => void;
  onNavigate?: (url: string) => void;
}

export const BrowserApp: React.FC<BrowserAppProps> = ({
  initialUrl = "https://www.google.com",
  initialQuery = "",
  onNavigate,
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [tabs, setTabs] = useState([
    { id: "tab-1", title: "Google", url: "https://www.google.com" },
  ]);
  const [activeTabId, setActiveTabId] = useState("tab-1");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  useEffect(() => {
    if (initialUrl && initialUrl !== url) {
      setUrl(initialUrl);
      setInputUrl(initialUrl);
    }
  }, [initialUrl]);

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleNavigate = (targetUrl: string) => {
    setIsLoading(true);
    let cleaned = targetUrl.trim();
    if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
      if (cleaned.includes(".") && !cleaned.includes(" ")) {
        cleaned = "https://" + cleaned;
      } else {
        cleaned = `https://www.google.com/search?q=${encodeURIComponent(cleaned)}`;
      }
    }
    setUrl(cleaned);
    setInputUrl(cleaned);
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleNavigate(inputUrl);
    }
  };

  const isSearch = url.includes("google.com/search") || searchQuery.length > 0;
  const isYouTube = url.includes("youtube.com");
  const isPizza = url.toLowerCase().includes("pizza") || searchQuery.toLowerCase().includes("pizza");
  const isRoblox = url.toLowerCase().includes("roblox") || searchQuery.toLowerCase().includes("roblox");

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 text-sm">
      {/* Tab bar */}
      <div className="flex items-center px-2 pt-1.5 bg-slate-950/80 border-b border-white/10 gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => {
              setActiveTabId(tab.id);
              setUrl(tab.url);
              setInputUrl(tab.url);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-medium cursor-pointer transition max-w-[160px] truncate ${
              activeTabId === tab.id
                ? "bg-slate-800 text-sky-400 border-t-2 border-sky-500"
                : "text-slate-400 hover:bg-slate-900/60"
            }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{tab.title}</span>
          </div>
        ))}
        <button
          onClick={() => {
            const newTab = {
              id: `tab-${Date.now()}`,
              title: "New Tab",
              url: "https://www.google.com",
            };
            setTabs([...tabs, newTab]);
            setActiveTabId(newTab.id);
            setUrl(newTab.url);
            setInputUrl(newTab.url);
          }}
          className="p-1 text-slate-400 hover:text-white rounded"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Navigation & Address Bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/90 border-b border-white/10">
        <div className="flex items-center gap-1 text-slate-400">
          <button className="p-1 hover:text-white rounded hover:bg-white/5">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button className="p-1 hover:text-white rounded hover:bg-white/5">
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleNavigate(inputUrl)}
            className={`p-1 hover:text-white rounded hover:bg-white/5 ${
              isLoading ? "animate-spin text-sky-400" : ""
            }`}
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Shield Icon for Brave */}
        <div className="flex items-center gap-1 text-amber-400 text-xs px-2 py-1 bg-amber-500/10 rounded border border-amber-500/20 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Brave Shields</span>
        </div>

        {/* Omnibox / Address Bar */}
        <div className="flex-1 relative">
          <input
            id="browser-address-bar"
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or enter web address..."
            className="w-full pl-8 pr-4 py-1.5 text-xs bg-slate-950/70 text-slate-100 rounded-lg border border-white/10 focus:outline-none focus:border-sky-500 transition"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Web Viewport Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
        {/* Render interactive simulated page */}
        {isPizza ? (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center gap-2 text-amber-400 pb-2 border-b border-white/10">
              <Utensils className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Authentic Italian Pizza Recipes</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-2">
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  Neapolitan Classic
                </span>
                <h3 className="font-medium text-slate-200">Pizza Margherita</h3>
                <p className="text-xs text-slate-400">
                  00 Flour, San Marzano tomatoes, fresh buffalo mozzarella, fresh basil, extra virgin olive oil. Fermented for 48 hours.
                </p>
                <div className="text-xs text-sky-400 flex items-center gap-1 font-medium">
                  Bake at 500°C for 90 seconds
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-2">
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium">
                  Crispy Crust
                </span>
                <h3 className="font-medium text-slate-200">New York Style Pepperoni</h3>
                <p className="text-xs text-slate-400">
                  High-gluten bread flour, spicy marinara, low-moisture whole milk mozzarella, cupping pepperoni cups.
                </p>
                <div className="text-xs text-sky-400 flex items-center gap-1 font-medium">
                  Bake on pizza steel at 285°C
                </div>
              </div>
            </div>
          </div>
        ) : isRoblox ? (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2 text-rose-400">
                <Youtube className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Roblox Studio Development Tutorials</h2>
              </div>
              <span className="text-xs text-slate-400">5.2K results found</span>
            </div>
            <div className="space-y-3">
              {[
                {
                  title: "Roblox Studio 2026: Complete Beginner to Advanced Game Architecture",
                  creator: "Roblox Dev Academy",
                  views: "420K views",
                  duration: "45:12",
                },
                {
                  title: "Luau Scripting Mastery: DataStores, Raycasting & Client-Server Replication",
                  creator: "CodeWithRoblox",
                  views: "185K views",
                  duration: "32:40",
                },
                {
                  title: "How to Build and Publish a Multiplayer Simulator Game in 1 Hour",
                  creator: "GameMaker Studio",
                  views: "290K views",
                  duration: "1:02:15",
                },
              ].map((video, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 p-3 rounded-xl bg-slate-900/80 border border-white/10 hover:border-sky-500/40 cursor-pointer transition"
                >
                  <div className="w-36 h-20 bg-slate-800 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden border border-white/5">
                    <Youtube className="w-8 h-8 text-rose-500" />
                    <span className="absolute bottom-1 right-1 text-[10px] bg-black/80 px-1 rounded text-white font-mono">
                      {video.duration}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-slate-200 hover:text-sky-400">
                      {video.title}
                    </h3>
                    <p className="text-xs text-slate-400">{video.creator} • {video.views}</p>
                    <div className="text-[11px] text-slate-500">
                      Step-by-step game mechanics, project structure, and best practices.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isYouTube ? (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-rose-500 pb-2 border-b border-white/10">
              <Youtube className="w-6 h-6" />
              <span className="text-base font-bold text-white tracking-tight">YouTube</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                "Windows 11 Power Toys & AI Tools",
                "Advanced C# & .NET 9 WinUI 3 Desktop App Development",
                "Building Jarvis Voice Assistants with Local LLMs",
              ].map((title, i) => (
                <div key={i} className="p-3 bg-slate-900 rounded-xl border border-white/10 space-y-2">
                  <div className="w-full h-28 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                    Video Stream
                  </div>
                  <div className="text-xs font-medium text-slate-200">{title}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 space-y-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Globe className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Google & Web Portal</h2>
              <p className="text-xs text-slate-400 mt-1">
                Connected via Brave Shields High-Speed Sandbox
              </p>
            </div>

            <div className="w-full max-w-md relative">
              <input
                id="browser-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNavigate(searchQuery);
                }}
                placeholder="Search Google or type a URL..."
                className="w-full pl-10 pr-24 py-2.5 bg-slate-900 text-xs text-white rounded-full border border-white/15 focus:outline-none focus:border-sky-500 transition shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <button
                id="btn-browser-search-submit"
                onClick={() => handleNavigate(searchQuery)}
                className="absolute right-1.5 top-1.5 px-3 py-1.5 rounded-full bg-sky-600 hover:bg-sky-500 text-xs font-medium text-white transition"
              >
                Search
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {[
                { label: "Pizza Recipes", query: "pizza recipes" },
                { label: "Roblox Studio Tutorials", query: "Roblox Studio tutorials" },
                { label: "Windows 11 Documentation", query: "https://learn.microsoft.com" },
                { label: "YouTube", query: "https://youtube.com" },
              ].map((rec, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSearchQuery(rec.query);
                    handleNavigate(rec.query);
                  }}
                  className="px-3 py-1 text-xs rounded-full bg-slate-900 border border-white/10 hover:border-sky-500/40 text-slate-300 hover:text-white transition"
                >
                  {rec.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
