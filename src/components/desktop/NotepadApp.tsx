import React, { useState, useEffect } from "react";
import { FileText, Save, Download, Copy, Trash2, Check } from "lucide-react";
import { SystemService } from "../../services/systemService";

interface NotepadAppProps {
  initialContent?: string;
  onContentChange?: (text: string) => void;
}

export const NotepadApp: React.FC<NotepadAppProps> = ({
  initialContent = "",
  onContentChange,
}) => {
  const [content, setContent] = useState(initialContent);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState("Untitled.txt");

  useEffect(() => {
    if (initialContent !== undefined && initialContent !== content) {
      setContent(initialContent);
    }
  }, [initialContent]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    onContentChange?.(val);
  };

  const handleSave = () => {
    SystemService.showToast("File Saved", `Saved ${fileName} to Documents`, "success");
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    SystemService.showToast("Downloaded", `Exported ${fileName} to Downloads folder`, "info");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans text-xs">
      {/* Menu & Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-white/10 select-none">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-sky-400" />
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-sky-500 focus:outline-none text-slate-200 px-1 py-0.5 font-medium max-w-[140px]"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            id="notepad-btn-save"
            onClick={handleSave}
            title="Save file (Ctrl+S)"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            <Save className="w-3 h-3 text-sky-400" />
            <span>Save</span>
          </button>
          <button
            onClick={handleDownload}
            title="Export .txt"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 transition"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopy}
            title="Copy all text"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => {
              setContent("");
              onContentChange?.("");
            }}
            title="Clear"
            className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-white/5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 p-3 overflow-hidden flex flex-col">
        <textarea
          id="notepad-textarea"
          value={content}
          onChange={handleTextChange}
          placeholder="Start typing or let Magic write for you... (e.g. 'Magic open Notepad and type Hello World')"
          className="w-full h-full bg-transparent text-slate-200 font-mono text-xs resize-none focus:outline-none leading-relaxed selection:bg-sky-500/30"
          spellCheck={false}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-900/90 border-t border-white/10 text-[10px] text-slate-400 font-mono select-none">
        <div className="flex items-center gap-3">
          <span>Words: {wordCount}</span>
          <span>Characters: {charCount}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>UTF-8</span>
          <span>Windows (CRLF)</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};
