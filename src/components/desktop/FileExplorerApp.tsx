import React, { useState } from "react";
import {
  Folder,
  FolderPlus,
  FileCode,
  FileText,
  Trash2,
  Search,
  HardDrive,
  Home,
  Clock,
  Sparkles,
  Gamepad2,
} from "lucide-react";
import { SystemService } from "../../services/systemService";

export interface FileItem {
  id: string;
  name: string;
  type: "folder" | "file";
  extension?: string;
  size?: string;
  modified: string;
  category?: "roblox" | "code" | "doc" | "system";
}

interface FileExplorerAppProps {
  initialFolder?: string;
}

export const FileExplorerApp: React.FC<FileExplorerAppProps> = ({
  initialFolder = "RobloxProjects",
}) => {
  const [currentPath, setCurrentPath] = useState<string>(`C:\\Users\\Developer\\${initialFolder}`);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<FileItem[]>([
    {
      id: "f-1",
      name: "Roblox_Adventure_RPG",
      type: "folder",
      modified: "2026-09-18 14:30",
      category: "roblox",
    },
    {
      id: "f-2",
      name: "Obby_Speedrun_Simulator",
      type: "folder",
      modified: "2026-09-17 09:15",
      category: "roblox",
    },
    {
      id: "f-3",
      name: "GameConfig.luau",
      type: "file",
      extension: "luau",
      size: "14.2 KB",
      modified: "2026-09-19 01:10",
      category: "code",
    },
    {
      id: "f-4",
      name: "AssetManifest.json",
      type: "file",
      extension: "json",
      size: "4.8 KB",
      modified: "2026-09-19 00:45",
      category: "code",
    },
    {
      id: "f-5",
      name: "DesignDoc_Roblox.docx",
      type: "file",
      extension: "docx",
      size: "82.5 KB",
      modified: "2026-09-16 18:20",
      category: "doc",
    },
  ]);

  const handleCreateFolder = (name?: string) => {
    const folderName = name || prompt("Enter new folder name:", "New_Roblox_Project") || "New_Roblox_Project";
    const newItem: FileItem = {
      id: `folder-${Date.now()}`,
      name: folderName,
      type: "folder",
      modified: new Date().toISOString().replace("T", " ").substring(0, 16),
      category: folderName.toLowerCase().includes("roblox") ? "roblox" : "doc",
    };

    setItems([newItem, ...items]);
    SystemService.showToast(
      "Folder Created",
      `Created directory "${folderName}" at ${currentPath}`,
      "success"
    );
  };

  const handleDeleteItem = (id: string, name: string) => {
    setItems(items.filter((item) => item.id !== id));
    SystemService.showToast("Item Deleted", `Moved "${name}" to Recycle Bin`, "info");
  };

  const filteredItems = items.filter((it) =>
    it.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full bg-slate-950 text-slate-100 text-xs select-none">
      {/* Sidebar navigation */}
      <div className="w-48 bg-slate-900/80 border-r border-white/10 p-2.5 flex flex-col justify-between shrink-0">
        <div className="space-y-1">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
            Quick Access
          </div>
          <button
            onClick={() => setCurrentPath("C:\\Users\\Developer\\Desktop")}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition text-left"
          >
            <Home className="w-3.5 h-3.5 text-sky-400" />
            <span>Desktop</span>
          </button>
          <button
            onClick={() => setCurrentPath("C:\\Users\\Developer\\RobloxProjects")}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg bg-sky-500/15 text-sky-300 font-medium text-left"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Roblox Projects</span>
          </button>
          <button
            onClick={() => setCurrentPath("C:\\Users\\Developer\\Documents")}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition text-left"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Documents</span>
          </button>
          <button
            onClick={() => setCurrentPath("C:\\Users\\Developer\\Downloads")}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition text-left"
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local Disk (C:)</span>
          </button>
        </div>

        <div className="p-2 rounded-xl bg-slate-800/40 border border-white/5 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-sky-400 font-medium">
            <Sparkles className="w-3 h-3" />
            <span>Magic Connected</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Voice-command file creation & indexing enabled.
          </p>
        </div>
      </div>

      {/* Main File Content View */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Path & Search Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-white/10 gap-2">
          {/* Path bar */}
          <div className="flex-1 flex items-center gap-1 px-2.5 py-1 bg-slate-950/70 rounded-lg border border-white/10 font-mono text-[11px] text-slate-300 truncate">
            <HardDrive className="w-3 h-3 text-sky-400 shrink-0" />
            <span className="truncate">{currentPath}</span>
          </div>

          {/* Search */}
          <div className="relative w-44">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-7 pr-2 py-1 bg-slate-950/70 rounded-lg border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2 pointer-events-none" />
          </div>

          {/* Action buttons */}
          <button
            id="explorer-btn-new-folder"
            onClick={() => handleCreateFolder()}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium transition shadow-sm"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New folder</span>
          </button>
        </div>

        {/* Files Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 hover:border-sky-500/30 transition cursor-pointer text-center"
              >
                <div className="mb-2">
                  {item.type === "folder" ? (
                    item.category === "roblox" ? (
                      <div className="relative">
                        <Folder className="w-10 h-10 text-rose-400 fill-rose-400/20" />
                        <Gamepad2 className="w-4 h-4 text-white absolute bottom-1 right-0" />
                      </div>
                    ) : (
                      <Folder className="w-10 h-10 text-amber-400 fill-amber-400/20" />
                    )
                  ) : item.extension === "luau" ? (
                    <FileCode className="w-10 h-10 text-sky-400" />
                  ) : (
                    <FileText className="w-10 h-10 text-slate-300" />
                  )}
                </div>
                <span className="text-xs font-medium text-slate-200 truncate w-full group-hover:text-sky-300">
                  {item.name}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  {item.type === "folder" ? "File folder" : item.size || "File"}
                </span>

                {/* Delete button on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteItem(item.id, item.name);
                  }}
                  title="Delete"
                  className="absolute top-1.5 right-1.5 p-1 rounded bg-slate-800 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs">
              <Folder className="w-8 h-8 mb-2 stroke-[1.5]" />
              <span>No items found in this directory.</span>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between px-3 py-1 bg-slate-900 border-t border-white/10 text-[10px] text-slate-400">
          <span>{filteredItems.length} items</span>
          <span>Drive C: 284 GB free of 512 GB</span>
        </div>
      </div>
    </div>
  );
};
